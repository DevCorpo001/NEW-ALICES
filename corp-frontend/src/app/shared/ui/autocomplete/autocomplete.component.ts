import { ListKeyManager } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import { Subject, debounce, timer } from 'rxjs';
import { AutocompleteOpcion } from './autocomplete.models';

/** Buscador con panel de sugerencias; no pide datos: emite `buscar` y recibe `opciones`. */
@Component({
  selector: 'app-autocomplete',
  imports: [NgIcon, CdkOverlayOrigin, CdkConnectedOverlay],
  providers: [
    provideIcons({ lucideLoaderCircle }),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true,
    },
  ],
  templateUrl: './autocomplete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteComponent<T> implements ControlValueAccessor {
  /** Id del `<input>`; se usa para el `for` de la etiqueta y los ids ARIA. */
  readonly idControl = input.required<string>();
  readonly etiqueta = input('');
  readonly placeholder = input('');
  readonly opciones = input<readonly AutocompleteOpcion<T>[]>([]);
  readonly buscando = input(false);
  readonly error = input(false);
  readonly mensajeError = input('Error al buscar. Inténtalo de nuevo.');
  readonly mensajeVacio = input('Sin resultados para la búsqueda.');
  /** Milisegundos de espera antes de emitir `buscar`. */
  readonly retrasoMs = input(300);
  /** Aplica `uppercase` al texto tecleado (convención de captura del POS). */
  readonly mayusculas = input(true);

  /** Término ya estabilizado por el debounce. Cadena vacía = campo limpio. */
  readonly buscar = output<string>();
  /** Fila original de la opción elegida. */
  readonly seleccionar = output<T>();

  private readonly injector = inject(Injector);
  private readonly termino$ = new Subject<string>();
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('campo');

  readonly valor = signal('');
  readonly deshabilitado = signal(false);
  readonly abierto = signal(false);
  readonly indiceActivo = signal(0);
  readonly anchoPanel = signal(0);

  readonly idPanel = computed(() => `${this.idControl()}-panel`);
  readonly hayOpciones = computed(() => this.opciones().length > 0);
  readonly idOpcionActiva = computed(() => {
    const opcion = this.opciones()[this.indiceActivo()];
    return opcion ? `${this.idControl()}-opcion-${opcion.clave}` : null;
  });

  private readonly keyManager = new ListKeyManager<AutocompleteOpcion<T>>(
    this.opciones,
    this.injector
  );

  private onChange: (valor: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // `debounce` y no `debounceTime`: `retrasoMs` aún no existe al construir el pipe.
    this.termino$
      .pipe(
        debounce(() => timer(this.retrasoMs())),
        takeUntilDestroyed()
      )
      .subscribe((termino) => this.buscar.emit(termino));

    this.keyManager.change.pipe(takeUntilDestroyed()).subscribe((indice) => {
      this.indiceActivo.set(indice);
      this.desplazarAlActivo();
    });

    // `untracked` obligatorio: sin él el efecto se resuscribe y reinicia el índice (ver skill).
    effect(() => {
      this.opciones();
      untracked(() => {
        this.keyManager.setActiveItem(0);
        this.indiceActivo.set(0);
      });
    });
  }

  // ── ControlValueAccessor ────────────────────────────────────────────────
  writeValue(valor: string | null): void {
    this.valor.set(valor ?? '');
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }

  // ── Interacción ─────────────────────────────────────────────────────────
  onInput(event: Event): void {
    const texto = (event.target as HTMLInputElement).value;
    this.valor.set(texto);
    this.onChange(texto);
    if (texto.trim()) {
      this.medirAncho();
      this.abierto.set(true);
    } else {
      this.abierto.set(false);
    }
    this.termino$.next(texto);
  }

  onKeydown(event: KeyboardEvent): void {
    // Métodos directos y no `onKeydown`: este se guía por el `keyCode` obsoleto.
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.abierto() || !this.hayOpciones()) {
          this.forzarBusqueda();
          return;
        }
        this.keyManager.setNextItemActive();
        return;
      case 'ArrowUp':
        if (this.abierto() && this.hayOpciones()) {
          event.preventDefault();
          this.keyManager.setPreviousItemActive();
        }
        return;
      case 'Home':
        if (this.abierto() && this.hayOpciones()) {
          event.preventDefault();
          this.keyManager.setFirstItemActive();
        }
        return;
      case 'End':
        if (this.abierto() && this.hayOpciones()) {
          event.preventDefault();
          this.keyManager.setLastItemActive();
        }
        return;
      case 'Enter': {
        event.preventDefault();
        const activa = this.opciones()[this.indiceActivo()];
        if (this.abierto() && activa) {
          this.elegir(activa);
        } else {
          this.forzarBusqueda();
        }
        return;
      }
      case 'Escape':
      case 'F2':
        if (this.abierto()) {
          event.preventDefault();
          this.cerrar();
        }
        return;
      case 'Tab':
        this.cerrar();
        return;
      default:
        return;
    }
  }

  elegir(opcion: AutocompleteOpcion<T>): void {
    this.cerrar();
    this.seleccionar.emit(opcion.valor);
  }

  activar(indice: number): void {
    this.keyManager.setActiveItem(indice);
  }

  cerrar(): void {
    this.abierto.set(false);
    this.onTouched();
  }

  /** Reabre el panel con los resultados vigentes (ej. al recuperar el foco). */
  onFocus(): void {
    if (this.valor().trim() && this.hayOpciones()) {
      this.medirAncho();
      this.abierto.set(true);
    }
  }

  private forzarBusqueda(): void {
    this.medirAncho();
    this.abierto.set(true);
    this.buscar.emit(this.valor());
  }

  private medirAncho(): void {
    const ancho = this.inputRef()?.nativeElement.offsetWidth ?? 0;
    if (ancho > 0) {
      this.anchoPanel.set(ancho);
    }
  }

  private desplazarAlActivo(): void {
    queueMicrotask(() => {
      const id = this.idOpcionActiva();
      if (!id) {
        return;
      }
      // `scrollIntoView` no existe en jsdom; el encadenamiento evita romper las pruebas.
      document.getElementById(id)?.scrollIntoView?.({ block: 'nearest' });
    });
  }
}
