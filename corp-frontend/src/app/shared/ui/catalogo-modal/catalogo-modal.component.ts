import { ListKeyManager } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideLoaderCircle, lucidePlus, lucideSave, lucideSearch } from '@ng-icons/lucide';
import { EnterPrimaryDirective } from '../../directives/enter-primary.directive';
import { AutocompleteComponent } from '../autocomplete/autocomplete.component';
import { AutocompleteOpcion } from '../autocomplete/autocomplete.models';
import { AppModalComponent } from '../modal/app-modal.component';
import { CatalogoDataSource } from './catalogo-modal.datasource';
import { CatalogoCampo, CatalogoConfig, CatalogoFila } from './catalogo-modal.models';

type Vista = 'buscar' | 'agregar';

/** Envoltura de fila: `CatalogoFila` no encaja en `ListKeyManagerOption`. */
interface FilaNavegable {
  readonly fila: CatalogoFila;
  readonly disabled?: boolean;
}

/** Modal de catálogo maestro (búsqueda y alta); lo propio de cada uno va en `config` y `fuente`. */
@Component({
  selector: 'app-catalogo-modal',
  imports: [
    ReactiveFormsModule,
    NgIcon,
    AppModalComponent,
    AutocompleteComponent,
    EnterPrimaryDirective,
  ],
  providers: [
    provideIcons({ lucideCheck, lucideLoaderCircle, lucidePlus, lucideSave, lucideSearch }),
  ],
  templateUrl: './catalogo-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoModalComponent {
  readonly abierto = input(false);
  readonly config = input.required<CatalogoConfig>();
  readonly fuente = input.required<CatalogoDataSource>();

  readonly cerrar = output();
  /** Fila elegida entera y no solo `config.clave`: el consumidor necesita el id. */
  readonly seleccionar = output<CatalogoFila>();

  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly listaRef = viewChild<ElementRef<HTMLElement>>('lista');

  readonly vista = signal<Vista>('buscar');

  readonly filas = signal<readonly CatalogoFila[]>([]);
  readonly cargando = signal(false);
  readonly errorBusqueda = signal<string | null>(null);
  /** Distingue "aún no has buscado" de "la búsqueda no devolvió nada". */
  readonly busquedaRealizada = signal(false);
  readonly mensajeExito = signal<string | null>(null);

  /** Filtro que está guiando la búsqueda ahora mismo; los demás se vacían. */
  readonly campoActivo = signal<string | null>(null);
  readonly sugerencias = signal<readonly CatalogoFila[]>([]);
  readonly buscandoSugerencias = signal(false);

  readonly guardando = signal(false);
  readonly errorAlta = signal<string | null>(null);
  readonly cargandoCodigo = signal(false);

  readonly indiceActivo = signal(-1);

  readonly formularioFiltro = computed(() => construirGrupo(this.config().filtros));
  readonly formularioAlta = computed(() => construirGrupo(this.config().campos));

  readonly columnasFiltro = computed(
    () => `repeat(${this.config().filtros.length}, minmax(0, 1fr)) auto auto`
  );

  /** Sugerencias mapeadas al contrato de `app-autocomplete`. */
  readonly opcionesSugeridas = computed<readonly AutocompleteOpcion<CatalogoFila>[]>(() => {
    const columnas = this.config().columnas;
    const principal = columnas[0]?.campo ?? this.config().clave;
    const secundario = columnas[1]?.campo;
    return this.sugerencias().map((fila, indice) => ({
      clave: `${fila[this.config().clave] ?? indice}`,
      principal: fila[principal] ?? '',
      secundario: secundario ? fila[secundario] : undefined,
      valor: fila,
    }));
  });

  private readonly items = computed<FilaNavegable[]>(() =>
    this.filas().map((fila) => ({ fila }))
  );

  private readonly keyManager = new ListKeyManager<FilaNavegable>(this.items, this.injector);

  constructor() {
    this.keyManager.change.pipe(takeUntilDestroyed()).subscribe((indice) => {
      this.indiceActivo.set(indice);
      this.desplazarAlActivo();
    });

    // Cada apertura arranca limpia; el listado solo aparece al pulsar Buscar.
    effect(() => {
      if (!this.abierto()) {
        return;
      }
      untracked(() => {
        this.formularioFiltro().reset();
        this.formularioAlta().reset();
        this.vista.set('buscar');
        this.campoActivo.set(null);
        this.sugerencias.set([]);
        this.filas.set([]);
        this.indiceActivo.set(-1);
        this.busquedaRealizada.set(false);
        this.errorBusqueda.set(null);
        this.errorAlta.set(null);
        this.mensajeExito.set(null);
      });
    });
  }

  // ── Filtros ─────────────────────────────────────────────────────────────
  /** Al teclear en un filtro los demás se vacían: se busca por código o por nombre, no ambos. */
  onBuscarSugerencias(campo: string, termino: string): void {
    if (!termino.trim()) {
      this.sugerencias.set([]);
      return;
    }

    if (this.campoActivo() !== campo) {
      this.campoActivo.set(campo);
      this.vaciarOtrosFiltros(campo);
    }

    this.buscandoSugerencias.set(true);
    this.fuente()
      .sugerencias(campo, termino.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (filas) => {
          this.buscandoSugerencias.set(false);
          this.sugerencias.set(filas);
        },
        error: () => {
          this.buscandoSugerencias.set(false);
          this.sugerencias.set([]);
        },
      });
  }

  /** Elegir una sugerencia rellena el filtro y lanza la búsqueda. */
  onElegirSugerencia(campo: string, fila: CatalogoFila): void {
    this.control(this.formularioFiltro(), campo).setValue(fila[campo] ?? '');
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.cargarFilas(this.formularioFiltro().getRawValue());
  }

  private vaciarOtrosFiltros(campoActivo: string): void {
    const formulario = this.formularioFiltro();
    for (const filtro of this.config().filtros) {
      if (filtro.campo !== campoActivo) {
        formulario.controls[filtro.campo].setValue('', { emitEvent: false });
      }
    }
  }

  private cargarFilas(filtros: CatalogoFila): void {
    this.cargando.set(true);
    this.errorBusqueda.set(null);
    this.mensajeExito.set(null);
    this.fuente()
      .buscar(filtros)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (filas) => {
          this.cargando.set(false);
          this.filas.set(filas);
          this.busquedaRealizada.set(true);
          if (filas.length === 0) {
            this.indiceActivo.set(-1);
            return;
          }
          // Primera fila activa y foco en la tabla: las flechas van sin clic previo.
          this.keyManager.setFirstItemActive();
          this.enfocarLista();
        },
        error: (error: Error) => {
          this.cargando.set(false);
          this.filas.set([]);
          this.indiceActivo.set(-1);
          this.busquedaRealizada.set(true);
          this.errorBusqueda.set(error.message || 'No se pudo cargar el catálogo.');
        },
      });
  }

  // ── Navegación por teclado de los resultados ────────────────────────────
  onKeydownLista(event: KeyboardEvent): void {
    if (this.filas().length === 0) {
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.keyManager.setNextItemActive();
        return;
      case 'ArrowUp':
        event.preventDefault();
        // Desde la primera fila, ↑ devuelve el foco a los filtros.
        if (this.indiceActivo() <= 0) {
          this.enfocarPrimerFiltro();
          return;
        }
        this.keyManager.setPreviousItemActive();
        return;
      case 'Home':
        event.preventDefault();
        this.keyManager.setFirstItemActive();
        return;
      case 'End':
        event.preventDefault();
        this.keyManager.setLastItemActive();
        return;
      case 'Enter': {
        const activa = this.filas()[this.indiceActivo()];
        if (activa) {
          event.preventDefault();
          this.elegir(activa);
        }
        return;
      }
      default:
        return;
    }
  }

  activar(indice: number): void {
    this.keyManager.setActiveItem(indice);
  }

  elegir(fila: CatalogoFila): void {
    if (fila[this.config().clave] !== undefined) {
      this.seleccionar.emit(fila);
    }
  }

  idFila(indice: number): string {
    return `catalogo-fila-${indice}`;
  }

  private enfocarLista(): void {
    queueMicrotask(() => this.listaRef()?.nativeElement.focus());
  }

  private enfocarPrimerFiltro(): void {
    const primero = this.config().filtros[0];
    if (primero) {
      document.getElementById(`filtro-${primero.campo}`)?.focus();
    }
  }

  private desplazarAlActivo(): void {
    queueMicrotask(() => {
      const id = this.idFila(this.indiceActivo());
      document.getElementById(id)?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  // ── Alta ────────────────────────────────────────────────────────────────
  irAAgregar(): void {
    this.formularioAlta().reset();
    this.errorAlta.set(null);
    this.vista.set('agregar');

    const siguiente = this.fuente().siguienteCodigo?.();
    if (!siguiente) {
      return;
    }

    this.cargandoCodigo.set(true);
    siguiente.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (codigo) => {
        this.cargandoCodigo.set(false);
        this.control(this.formularioAlta(), this.config().clave).setValue(codigo);
      },
      error: () => {
        this.cargandoCodigo.set(false);
        this.errorAlta.set('No se pudo obtener el siguiente código. Escríbelo manualmente.');
      },
    });
  }

  volverABuscar(): void {
    this.errorAlta.set(null);
    this.vista.set('buscar');
  }

  guardarNuevo(): void {
    if (this.guardando()) {
      return;
    }

    const formulario = this.formularioAlta();
    if (formulario.invalid) {
      formulario.markAllAsTouched();
      return;
    }

    const fila = { ...formulario.getRawValue() };
    this.guardando.set(true);
    this.errorAlta.set(null);

    this.fuente()
      .crear(fila)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.formularioFiltro().reset();
          this.campoActivo.set(null);
          this.vista.set('buscar');
          // Se vuelve a la búsqueda sin listar; el aviso confirma que se guardó.
          this.filas.set([]);
          this.indiceActivo.set(-1);
          this.busquedaRealizada.set(false);
          this.mensajeExito.set('Registro guardado correctamente.');
        },
        error: (error: Error) => {
          this.guardando.set(false);
          this.errorAlta.set(error.message || 'No se pudo guardar el registro.');
        },
      });
  }

  // ── Utilidades de plantilla ─────────────────────────────────────────────
  control(formulario: FormGroup<Record<string, FormControl<string>>>, campo: string): FormControl<string> {
    return formulario.controls[campo];
  }

  invalido(formulario: FormGroup<Record<string, FormControl<string>>>, campo: string): boolean {
    const control = formulario.controls[campo];
    return control.touched && control.invalid;
  }
}

function construirGrupo(campos: readonly CatalogoCampo[]): FormGroup<Record<string, FormControl<string>>> {
  const controles: Record<string, FormControl<string>> = {};
  for (const campo of campos) {
    controles[campo.campo] = new FormControl('', {
      nonNullable: true,
      validators: campo.requerido ? [Validators.required] : [],
    });
  }
  return new FormGroup(controles);
}
