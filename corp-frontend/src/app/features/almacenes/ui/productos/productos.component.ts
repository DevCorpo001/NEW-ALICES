import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { Router } from '@angular/router';
import {
  lucideEraser,
  lucideEye,
  lucideLayers,
  lucideLightbulb,
  lucideLock,
  lucidePlus,
  lucideSave,
  lucideSearch,
  lucideUsers,
  lucideX,
} from '@ng-icons/lucide';
import { AuthService } from '@/core/auth/auth.service';
import { ConfirmService } from '@/shared/services/confirm.service';
import { EnterNavigateDirective } from '@/shared/directives/enter-navigate.directive';
import { EnterPrimaryDirective } from '@/shared/directives/enter-primary.directive';
import { AutocompleteComponent } from '@/shared/ui/autocomplete/autocomplete.component';
import { AutocompleteOpcion } from '@/shared/ui/autocomplete/autocomplete.models';
import { CatalogoModalComponent } from '@/shared/ui/catalogo-modal/catalogo-modal.component';
import { CatalogoFila } from '@/shared/ui/catalogo-modal/catalogo-modal.models';
import { CatalogoId } from '../../data-access/catalogo/catalogos.models';
import { crearFuentesCatalogo, idDeFila, textoDeFila } from '../../data-access/producto/producto-catalogos';
import { ProductoFichaStore } from '../../data-access/producto/producto-ficha.store';
import {
  IdsCatalogo,
  SIN_IDS,
  construirCuerpo,
  crearFormularioProducto,
  hoyEnInput,
  idsDesdeDetalle,
  unirCodigosBarra,
  valoresDesdeDetalle,
} from '../../data-access/producto/producto-formulario';
import { camposFaltantes, mensajeCamposFaltantes } from '../../data-access/producto/producto-mensajes';
import { EstadoProducto, ProductosBusquedaStore } from '../../data-access/producto/productos-busqueda.store';
import { ProductoAutocomplete, ProductoDetalle } from '../../data-access/producto/productos.models';
import { camposClasificacion, catalogosConfig } from './catalogos.config';
import { ImagenProductoComponent } from './imagen/imagen-producto.component';
import { CodigoBarraModalComponent } from './modals/codigo-barra/codigo-barra-modal.component';
import {
  DesvincularProveedorEvento,
  ProveedoresAsociadosModalComponent,
} from './modals/proveedores-asociados/proveedores-asociados-modal.component';
import { PreciosProductoComponent } from './precios/precios-producto.component';

/** Mantenimiento de productos: orquesta búsqueda, catálogos, imagen y precios. */
@Component({
  selector: 'app-productos',
  imports: [
    ReactiveFormsModule,
    NgIcon,
    EnterNavigateDirective,
    EnterPrimaryDirective,
    AutocompleteComponent,
    CatalogoModalComponent,
    CodigoBarraModalComponent,
    ProveedoresAsociadosModalComponent,
    ImagenProductoComponent,
    PreciosProductoComponent,
  ],
  providers: [
    ProductosBusquedaStore,
    ProductoFichaStore,
    provideIcons({
      lucideEraser,
      lucideEye,
      lucideLayers,
      lucideLightbulb,
      lucideLock,
      lucidePlus,
      lucideSave,
      lucideSearch,
      lucideUsers,
      lucideX,
    }),
  ],
  templateUrl: './productos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly dialogos = inject(ConfirmService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly busqueda = inject(ProductosBusquedaStore);
  private readonly ficha = inject(ProductoFichaStore);

  readonly configCatalogos = catalogosConfig;
  readonly camposClasificacion = camposClasificacion;
  readonly fuentesCatalogo = crearFuentesCatalogo(this.http);

  private readonly precios = viewChild(PreciosProductoComponent);
  private readonly imagen = viewChild(ImagenProductoComponent);

  readonly usuarioActual = computed(() => this.auth.user()?.nombre ?? 'ADMIN');

  /** Texto mostrado en el buscador. El término de búsqueda lo lleva el store. */
  readonly textoBuscado = this.fb.nonNullable.control('');

  readonly formulario = crearFormularioProducto(this.fb);

  // El estado de la ficha vive en el store; estos alias lo dejan al alcance del template.
  readonly productoSeleccionado = this.ficha.seleccionado;
  readonly cargandoFicha = this.ficha.cargando;
  readonly errorFicha = this.ficha.error;
  readonly guardando = this.ficha.guardando;
  readonly errorGuardado = this.ficha.errorGuardado;

  readonly catalogoAbierto = signal<CatalogoId | null>(null);
  readonly codigoBarraAbierto = signal(false);
  readonly proveedoresAsociadosAbierto = signal(false);

  /** Ids de catálogo del producto en pantalla; es lo que espera el backend. */
  private readonly idsCatalogo = signal<IdsCatalogo>({ ...SIN_IDS });

  /** Con producto cargado se actualiza; sin él, se da de alta. */
  readonly modoGuardado = computed<'nuevo' | 'actualizar'>(() =>
    this.productoSeleccionado() ? 'actualizar' : 'nuevo'
  );

  readonly modo = computed<'nuevo' | 'editar'>(() =>
    this.productoSeleccionado() ? 'editar' : 'nuevo'
  );

  readonly opciones = computed<readonly AutocompleteOpcion<ProductoAutocomplete>[]>(() =>
    this.busqueda.resultados().map((fila) => ({
      clave: fila.idProducto,
      principal: fila.codigoProducto ?? '',
      secundario: fila.descripcion ?? '',
      etiqueta: fila.estado === 'I' ? 'INACTIVO' : undefined,
      valor: fila,
    }))
  );

  // ── Búsqueda ────────────────────────────────────────────────────────────
  onBuscar(termino: string): void {
    this.busqueda.termino.set(termino);
  }

  cambiarEstado(event: Event): void {
    this.busqueda.estado.set((event.target as HTMLSelectElement).value as EstadoProducto);
  }

  /** Botón "Buscar" de la barra: relanza con el texto ya escrito. */
  buscar(): void {
    this.busqueda.termino.set(this.textoBuscado.value);
  }

  seleccionarProducto(fila: ProductoAutocomplete): void {
    const codigo = fila.codigoProducto ?? '';
    // Sin `emitEvent` para no relanzar la búsqueda al escribir el código elegido.
    this.textoBuscado.setValue(codigo, { emitEvent: false });
    this.cargarFicha(codigo);
  }

  private cargarFicha(codigo: string): void {
    this.ficha
      .cargar(codigo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ detalle, precios, barras }) => {
          this.aplicarDetalle(detalle);
          this.formulario.controls.codigoBarra.setValue(unirCodigosBarra(barras));
          this.precios()?.establecer(precios);
        },
        // El store ya dejó el aviso en `errorFicha`.
        error: () => {},
      });
  }

  private aplicarDetalle(detalle: ProductoDetalle): void {
    this.formulario.patchValue(valoresDesdeDetalle(detalle));
    this.idsCatalogo.set(idsDesdeDetalle(detalle));
    // Recién cargado desde la base: todavía no hay cambios del usuario.
    this.formulario.markAsPristine();
  }

  // ── Acciones de pantalla ────────────────────────────────────────────────
  limpiar(): void {
    this.textoBuscado.setValue('', { emitEvent: false });
    this.busqueda.limpiar();
    this.ficha.reiniciar();
    this.formulario.reset();
    // Se recalcula por si la pestaña lleva días abierta.
    this.formulario.controls.fechaRegistro.setValue(hoyEnInput());
    this.precios()?.reiniciar();
    this.imagen()?.reiniciar();
    this.idsCatalogo.set({ ...SIN_IDS });
  }

  nuevo(): void {
    this.limpiar();
    queueMicrotask(() => document.getElementById('buscar-producto')?.focus());
  }

  /** Un solo botón: actualiza si hay producto cargado; si no, da de alta. */
  guardarProducto(): void {
    if (this.guardando()) {
      return;
    }
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      void this.avisarCamposFaltantes();
      return;
    }

    const seleccionado = this.productoSeleccionado();
    const cuerpo = construirCuerpo(this.formulario.getRawValue(), this.idsCatalogo());

    this.ficha
      .guardar(cuerpo, seleccionado?.idProducto ?? null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalle) => {
          if (detalle) {
            // Se repinta con lo que devolvió la base, no con lo que se envió.
            this.aplicarDetalle(detalle);
            this.avisarExito(
              'actualizado',
              detalle.codigoProducto ?? cuerpo.codigo,
              detalle.descripcion ?? cuerpo.descripcion
            );
            return;
          }
          this.formulario.markAsPristine();
          this.avisarExito('registrado', cuerpo.codigo, cuerpo.descripcion);
          // El SP de alta no devuelve el id; se recarga la ficha por código.
          this.cargarFicha(cuerpo.codigo);
        },
        error: () => this.avisarError(),
      });
  }

  private avisarExito(accion: 'registrado' | 'actualizado', codigo: string, nombre: string): void {
    const verbo = accion === 'registrado' ? 'registró' : 'actualizó';
    void this.dialogos.exito(
      `El producto ${codigo} — ${nombre} se ${verbo} correctamente.`,
      accion === 'registrado' ? 'Producto registrado' : 'Producto actualizado'
    );
  }

  /** El mensaje ya lo dejó el store al fallar la petición. */
  private avisarError(): void {
    void this.dialogos.error(
      this.errorGuardado() ?? 'No se pudo guardar el producto.',
      'No se pudo guardar'
    );
  }

  /** Avisa de los obligatorios vacíos y devuelve el foco al primero. */
  private async avisarCamposFaltantes(): Promise<void> {
    const faltantes = camposFaltantes(this.formulario);
    if (faltantes.length === 0) {
      return;
    }

    await this.dialogos.advertencia(mensajeCamposFaltantes(faltantes), 'Faltan datos obligatorios');
    this.enfocarCampo(faltantes[0][0]);
  }

  /** Enfoca un control del formulario por su `formControlName`. */
  private enfocarCampo(control: string): void {
    const campo = document.querySelector<HTMLElement>(`[formControlName="${control}"]`);
    if (!campo) {
      return;
    }

    // En campos de catálogo (solo lectura) el foco útil es el botón que abre el modal.
    const esSoloLectura = campo instanceof HTMLInputElement && campo.readOnly;
    const boton = esSoloLectura ? campo.parentElement?.querySelector<HTMLElement>('button') : null;

    (boton ?? campo).focus();
  }

  buscarGrupoProducto(): void {
    const cod = this.formulario.controls.codigo.value?.trim();
    if (cod) {
      void this.router.navigate(['/almacenes/grupo-producto'], { queryParams: { busqueda: cod } });
    } else {
      void this.router.navigate(['/almacenes/grupo-producto']);
    }
  }

  limpiarCatalogo(id: CatalogoId): void {
    this.formulario.controls[id].setValue('');
    this.formulario.markAsDirty();
    this.idsCatalogo.update((actual) => ({ ...actual, [id]: null }));
  }

  // ── Catálogos maestros ──────────────────────────────────────────────────
  abrirCatalogo(id: CatalogoId): void {
    this.catalogoAbierto.set(id);
  }

  aplicarCatalogo(fila: CatalogoFila): void {
    const id = this.catalogoAbierto();
    if (!id) {
      return;
    }

    this.formulario.controls[id].setValue(textoDeFila(id, fila, this.configCatalogos[id].clave));
    this.formulario.markAsDirty();

    // Se guarda también el id: es lo que necesita el backend al guardar.
    this.idsCatalogo.update((actual) => ({ ...actual, [id]: idDeFila(id, fila) }));

    this.catalogoAbierto.set(null);
  }

  aplicarCodigosBarra(codigos: string): void {
    this.formulario.patchValue({ codigoBarra: codigos });
    this.formulario.markAsDirty();
    this.codigoBarraAbierto.set(false);
  }

  abrirProveedoresAsociados(): void {
    this.proveedoresAsociadosAbierto.set(true);
  }

  cerrarProveedoresAsociados(): void {
    this.proveedoresAsociadosAbierto.set(false);
  }

  seleccionarProveedor(prov: { idProveedor: number; ruc: string; razonSocial: string }): void {
    this.formulario.controls.proveedor.setValue(prov.razonSocial);
    this.formulario.markAsDirty();
    this.idsCatalogo.update((actual) => ({ ...actual, proveedor: prov.idProveedor }));
  }

  desvincularProveedor(evento: DesvincularProveedorEvento): void {
    const idActual = this.idsCatalogo().proveedor;
    const textoActual = (this.formulario.controls.proveedor.value || '').trim().toLowerCase();
    const rucProv = (evento.proveedor.ruc || '').trim().toLowerCase();
    const razonSocialProv = (evento.proveedor.razonSocial || '').trim().toLowerCase();

    const coincideId = idActual !== null && idActual === evento.proveedor.idProveedor;
    const coincideTexto =
      Boolean(textoActual) &&
      ((Boolean(razonSocialProv) && textoActual === razonSocialProv) ||
        (Boolean(rucProv) && textoActual === rucProv));

    if (coincideId || coincideTexto || !evento.quedanProveedores) {
      this.limpiarCatalogo('proveedor');
    }
  }
}
