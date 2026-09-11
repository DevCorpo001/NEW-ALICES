import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideLoaderCircle,
  lucidePlus,
  lucideSave,
  lucideSearch,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';
import { environment } from '../../../../../../../environments/environment';
import { EnterPrimaryDirective } from '../../../../../../shared/directives/enter-primary.directive';
import { ConfirmService } from '../../../../../../shared/services/confirm.service';
import { AutocompleteComponent } from '../../../../../../shared/ui/autocomplete/autocomplete.component';
import { AutocompleteOpcion } from '../../../../../../shared/ui/autocomplete/autocomplete.models';
import { AppModalComponent } from '../../../../../../shared/ui/modal/app-modal.component';
import { ProductosApiService } from '../../../../data-access/producto/productos-api.service';
import { ProductoProveedor } from '../../../../data-access/producto/productos.models';

export interface ProveedorBusqueda {
  readonly idProveedor: number;
  readonly ruc: string;
  readonly razonSocial: string;
}

export interface DesvincularProveedorEvento {
  readonly proveedor: ProductoProveedor;
  readonly quedanProveedores: boolean;
}

@Component({
  selector: 'app-proveedores-asociados-modal',
  imports: [
    AppModalComponent,
    AutocompleteComponent,
    EnterPrimaryDirective,
    NgIcon,
    ReactiveFormsModule,
  ],
  providers: [
    provideIcons({
      lucideCheck,
      lucideLoaderCircle,
      lucidePlus,
      lucideSave,
      lucideSearch,
      lucideTrash2,
      lucideX,
    }),
  ],
  templateUrl: './proveedores-asociados-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProveedoresAsociadosModalComponent {
  readonly abierto = input(false);
  readonly idProducto = input<number | null>(null);
  readonly codigoProducto = input<string | null>(null);
  readonly descripcionProducto = input<string | null>(null);

  readonly cerrar = output();
  readonly seleccionar = output<ProveedorBusqueda>();
  readonly desvincular = output<DesvincularProveedorEvento>();
  readonly cambio = output();

  private readonly productosApi = inject(ProductosApiService);
  private readonly http = inject(HttpClient);
  private readonly dialogos = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  readonly vista = signal<'buscar' | 'agregar'>('buscar');

  // Filtros de búsqueda con autocompletado
  readonly filtroRucControl = new FormControl('', { nonNullable: true });
  readonly filtroRazonSocialControl = new FormControl('', { nonNullable: true });
  readonly campoActivo = signal<'ruc' | 'razonSocial' | null>(null);
  readonly sugerencias = signal<readonly ProveedorBusqueda[]>([]);
  readonly buscandoSugerencias = signal(false);

  readonly opcionesSugeridas = computed<readonly AutocompleteOpcion<ProveedorBusqueda>[]>(() => {
    const campo = this.campoActivo();
    return this.sugerencias().map((p) => ({
      clave: p.idProveedor,
      principal: campo === 'ruc' ? p.ruc : p.razonSocial,
      secundario: campo === 'ruc' ? p.razonSocial : (p.ruc || undefined),
      valor: p,
    }));
  });

  readonly resultadosBusqueda = signal<readonly ProveedorBusqueda[]>([]);
  readonly buscando = signal(false);
  readonly haBuscado = signal(false);

  // Lista de proveedores asociados al producto
  readonly proveedores = signal<readonly ProductoProveedor[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  // Formulario alta nuevo proveedor
  readonly nuevoRuc = signal('');
  readonly nuevoRazonSocial = signal('');
  readonly nuevoNombreComercial = signal('');
  readonly nuevoDireccion = signal('');
  readonly nuevoNombreVendedor = signal('');
  readonly guardandoNuevo = signal(false);
  readonly errorNuevo = signal<string | null>(null);

  readonly titulo = computed(() =>
    this.vista() === 'agregar' ? 'Agregar Proveedor' : 'Buscar Proveedor'
  );

  constructor() {
    effect(() => {
      const abierto = this.abierto();
      const id = this.idProducto();

      if (!abierto) {
        untracked(() => this.limpiar());
        return;
      }

      if (id !== null) {
        untracked(() => {
          this.cargarProveedores(id);
        });
      } else {
        untracked(() => {
          this.proveedores.set([]);
        });
      }
    });
  }

  limpiar(): void {
    this.vista.set('buscar');
    this.filtroRucControl.setValue('', { emitEvent: false });
    this.filtroRazonSocialControl.setValue('', { emitEvent: false });
    this.sugerencias.set([]);
    this.campoActivo.set(null);
    this.buscandoSugerencias.set(false);
    this.resultadosBusqueda.set([]);
    this.haBuscado.set(false);
    this.buscando.set(false);
    this.error.set(null);
    this.cargando.set(false);
    this.guardando.set(false);
    this.limpiarFormularioNuevo();
  }

  limpiarFormularioNuevo(): void {
    this.nuevoRuc.set('');
    this.nuevoRazonSocial.set('');
    this.nuevoNombreComercial.set('');
    this.nuevoDireccion.set('');
    this.nuevoNombreVendedor.set('');
    this.errorNuevo.set(null);
    this.guardandoNuevo.set(false);
  }

  onBuscarSugerencias(campo: 'ruc' | 'razonSocial', termino: string): void {
    if (!termino.trim()) {
      this.sugerencias.set([]);
      return;
    }

    if (this.campoActivo() !== campo) {
      this.campoActivo.set(campo);
      const otro = campo === 'ruc' ? this.filtroRazonSocialControl : this.filtroRucControl;
      otro.setValue('', { emitEvent: false });
    }

    this.buscandoSugerencias.set(true);
    const params: Record<string, string> = { [campo]: termino.trim() };

    this.http
      .get<readonly any[]>(`${environment.apiBaseUrl}/proveedores/autocomplete`, { params })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.buscandoSugerencias.set(false);
          const filas: ProveedorBusqueda[] = items.map((p) => ({
            idProveedor: p.idProveedor,
            ruc: (p.ruc || '').trim(),
            razonSocial: (p.razonSocial || '').trim(),
          }));
          this.sugerencias.set(filas);
        },
        error: () => {
          this.buscandoSugerencias.set(false);
          this.sugerencias.set([]);
        },
      });
  }

  onElegirSugerencia(campo: 'ruc' | 'razonSocial', prov: ProveedorBusqueda): void {
    this.filtroRucControl.setValue(prov.ruc, { emitEvent: false });
    this.filtroRazonSocialControl.setValue(prov.razonSocial, { emitEvent: false });
    this.sugerencias.set([]);
    this.resultadosBusqueda.set([prov]);
    this.haBuscado.set(true);
  }

  buscar(): void {
    const ruc = this.filtroRucControl.value.trim();
    const razonSocial = this.filtroRazonSocialControl.value.trim();

    this.buscando.set(true);
    this.error.set(null);

    const params: Record<string, string> = {};
    if (ruc) {
      params['ruc'] = ruc;
    }
    if (razonSocial) {
      params['razonSocial'] = razonSocial;
    }

    this.http
      .get<readonly any[]>(`${environment.apiBaseUrl}/proveedores`, { params })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          const filas: ProveedorBusqueda[] = items.map((p) => ({
            idProveedor: p.idProveedor,
            ruc: (p.ruc || '').trim(),
            razonSocial: (p.razonSocial || '').trim(),
          }));
          this.resultadosBusqueda.set(filas);
          this.haBuscado.set(true);
          this.buscando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.resultadosBusqueda.set([]);
          this.haBuscado.set(true);
          this.buscando.set(false);
          this.error.set(
            err.error?.message || err.error?.error || 'Error al consultar proveedores.',
          );
        },
      });
  }

  seleccionarYAsociar(prov: ProveedorBusqueda): void {
    this.seleccionar.emit(prov);

    const idProd = this.idProducto();
    if (!idProd) {
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.productosApi
      .asociarProveedorProducto(idProd, prov.idProveedor)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.cargarProveedores(idProd);
          this.cambio.emit();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          const msg = err.error?.message || err.error?.error;
          if (msg && !msg.toLowerCase().includes('ya existe') && !msg.toLowerCase().includes('duplicad')) {
            this.error.set(msg);
          }
        },
      });
  }

  cargarProveedores(idProducto: number): void {
    this.cargando.set(true);
    this.error.set(null);

    this.productosApi
      .listarProveedoresProducto(idProducto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.proveedores.set(lista);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(
            err.error?.message || err.error?.error || 'Error al cargar proveedores asociados.',
          );
          this.cargando.set(false);
        },
      });
  }

  async eliminarProveedor(prov: ProductoProveedor): Promise<void> {
    const idProd = this.idProducto();
    if (!idProd) {
      return;
    }

    const desc = prov.razonSocial || prov.ruc || 'este proveedor';
    const confirmado = await this.dialogos.confirm(
      `¿Desea desvincular a "${desc}" de este producto?`,
      'Desvincular',
      'Cancelar',
      'warning',
    );

    if (!confirmado) {
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.productosApi
      .eliminarProveedorProducto(idProd, prov.idProductoProveedor)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          const proveedoresRestantes = this.proveedores().filter(
            (p) => p.idProductoProveedor !== prov.idProductoProveedor,
          );
          this.proveedores.set(proveedoresRestantes);
          this.desvincular.emit({
            proveedor: prov,
            quedanProveedores: proveedoresRestantes.length > 0,
          });
          this.cambio.emit();
          this.cargarProveedores(idProd);
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.error.set(
            err.error?.message || err.error?.error || 'No se pudo desvincular el proveedor del producto.',
          );
        },
      });
  }

  irAAgregar(): void {
    this.limpiarFormularioNuevo();
    this.nuevoRuc.set(this.filtroRucControl.value.trim());
    this.nuevoRazonSocial.set(this.filtroRazonSocialControl.value.trim());
    this.vista.set('agregar');
  }

  cancelarAgregar(): void {
    this.limpiarFormularioNuevo();
    this.vista.set('buscar');
  }

  guardarNuevoProveedor(): void {
    const ruc = this.nuevoRuc().trim();
    const razonSocial = this.nuevoRazonSocial().trim();

    if (!ruc) {
      this.errorNuevo.set('El RUC es obligatorio.');
      return;
    }
    if (!razonSocial) {
      this.errorNuevo.set('La Razón Social es obligatoria.');
      return;
    }

    this.guardandoNuevo.set(true);
    this.errorNuevo.set(null);

    this.http
      .post(`${environment.apiBaseUrl}/proveedores`, {
        ruc,
        razonSocial,
        nombreComercial: this.nuevoNombreComercial().trim() || null,
        direccion: this.nuevoDireccion().trim() || null,
        nombreVendedor: this.nuevoNombreVendedor().trim() || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardandoNuevo.set(false);
          this.vista.set('buscar');
          this.filtroRucControl.setValue(ruc);
          this.filtroRazonSocialControl.setValue(razonSocial);
          this.buscar();
        },
        error: (err: HttpErrorResponse) => {
          this.guardandoNuevo.set(false);
          this.errorNuevo.set(
            err.error?.message || err.error?.error || 'No se pudo registrar el proveedor.',
          );
        },
      });
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }
}
