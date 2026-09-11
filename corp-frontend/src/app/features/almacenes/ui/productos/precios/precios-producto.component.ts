import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideHistory, lucidePlus, lucideTrash, lucideWarehouse } from '@ng-icons/lucide';
import { ConfirmService } from '../../../../../shared/services/confirm.service';
import { ProductosApiService } from '../../../data-access/producto/productos-api.service';
import { PrecioProducto } from '../../../data-access/producto/productos.models';
import { HistorialPreciosModalComponent } from '../modals/historial-precios/historial-precios-modal.component';
import { AlmacenesStockModalComponent } from '../modals/almacenes-stock/almacenes-stock-modal.component';
import {
  PrecioDetalleGuardar,
  PrecioDetalleModalComponent,
} from '../modals/precio-detalle/precio-detalle-modal.component';

/** Lista de precios; conserva el `PrecioProducto` entero para el modal de detalle. */
// TODO(backend): las ediciones se quedan en memoria; falta el endpoint de guardado.
@Component({
  selector: 'app-precios-producto',
  imports: [NgIcon, HistorialPreciosModalComponent, PrecioDetalleModalComponent, AlmacenesStockModalComponent],
  providers: [
    provideIcons({ lucideEye, lucideHistory, lucidePlus, lucideTrash, lucideWarehouse }),
  ],
  templateUrl: './precios-producto.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreciosProductoComponent {
  /** Usuario de la sesión; el modal prefiere el que tocó cada precio. */
  readonly usuario = input('ADMIN');

  private readonly productosApi = inject(ProductosApiService);
  private readonly dialogos = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  readonly precios = signal<readonly PrecioProducto[]>([]);
  readonly detalleAbierto = signal(false);
  readonly filaEnEdicion = signal<PrecioProducto | null>(null);
  readonly historialAbierto = signal(false);
  readonly precioDelHistorial = signal<PrecioProducto | null>(null);
  readonly almacenesAbierto = signal(false);
  readonly precioDeAlmacenes = signal<PrecioProducto | null>(null);

  private siguienteId = 1;

  /** Fila lista para pintar: el precio original más su fecha formateada. */
  readonly filas = computed(() =>
    this.precios().map((precio) => ({
      precio,
      fecha: formatearFecha(precio.fechaModificacion),
    }))
  );

  agregar(): void {
    this.filaEnEdicion.set(null);
    this.detalleAbierto.set(true);
  }

  abrirDetalle(precio: PrecioProducto): void {
    this.filaEnEdicion.set(precio);
    this.detalleAbierto.set(true);
  }

  aplicarDetalle(datos: PrecioDetalleGuardar): void {
    const enEdicion = this.filaEnEdicion();
    if (enEdicion) {
      this.precios.update((filas) =>
        filas.map((fila) => (fila.idPrecio === enEdicion.idPrecio ? fusionar(fila, datos) : fila))
      );
    } else {
      this.precios.update((filas) => [...filas, fusionar(vacio(this.siguienteId++), datos)]);
    }
    this.detalleAbierto.set(false);
  }

  /** Avisa de qué canal y cuántos rangos se van a borrar antes de tocar la base. */
  async eliminar(precio: PrecioProducto): Promise<void> {
    const canal = precio.canal?.trim() || 'sin canal';
    const rangos = precio.rangos.length;
    const detalleRangos =
      rangos === 0
        ? 'No tiene rangos por cantidad.'
        : rangos === 1
          ? 'Se eliminará también su 1 rango por cantidad.'
          : `Se eliminarán también sus ${rangos} rangos por cantidad.`;

    const confirmado = await this.dialogos.confirm(
      `Vas a eliminar el precio del canal ${canal}. ${detalleRangos} Esta acción no se puede deshacer.`,
      'Sí, eliminar',
      'Cancelar',
      'warning'
    );

    if (!confirmado) {
      return;
    }

    // Las filas añadidas en pantalla aún no están en la base: su id es local y
    // podría coincidir con el de otro producto, así que nunca se envían.
    if (precio.idProducto === 0 || precio.idCanal === null) {
      this.quitarDeLaLista(precio.idPrecio);
      return;
    }

    this.productosApi
      .eliminarPreciosDeCanal(precio.idProducto, precio.idCanal)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.quitarDeLaLista(precio.idPrecio);
          void this.dialogos.exito(
            `El precio del canal ${canal} se eliminó correctamente.`,
            'Precio eliminado'
          );
        },
        error: (respuesta: HttpErrorResponse) => {
          void this.dialogos.error(mensajeDeBorrado(respuesta), 'No se pudo eliminar');
        },
      });
  }

  private quitarDeLaLista(idPrecio: number): void {
    this.precios.update((filas) => filas.filter((fila) => fila.idPrecio !== idPrecio));
    if (this.precioDelHistorial()?.idPrecio === idPrecio) {
      this.cerrarHistorial();
    }
  }

  /** Vacía la lista al cambiar de producto. */
  reiniciar(): void {
    this.precios.set([]);
    this.detalleAbierto.set(false);
    this.filaEnEdicion.set(null);
    this.cerrarHistorial();
    this.cerrarAlmacenes();
  }

  /** Carga los precios que devuelve la API para el producto seleccionado. */
  establecer(precios: readonly PrecioProducto[]): void {
    this.precios.set(precios);
    // Los ids vienen de la base; los nuevos siguen a partir del mayor.
    this.siguienteId = precios.reduce((max, fila) => Math.max(max, fila.idPrecio), 0) + 1;
    this.detalleAbierto.set(false);
    this.filaEnEdicion.set(null);
    this.cerrarHistorial();
    this.cerrarAlmacenes();
  }

  abrirHistorial(precio: PrecioProducto): void {
    this.precioDelHistorial.set(precio);
    this.historialAbierto.set(true);
  }

  cerrarHistorial(): void {
    this.historialAbierto.set(false);
    this.precioDelHistorial.set(null);
  }

  verAlmacenes(precio: PrecioProducto): void {
    this.precioDeAlmacenes.set(precio);
    this.almacenesAbierto.set(true);
  }

  cerrarAlmacenes(): void {
    this.almacenesAbierto.set(false);
    this.precioDeAlmacenes.set(null);
  }
}

function fusionar(precio: PrecioProducto, datos: PrecioDetalleGuardar): PrecioProducto {
  return {
    ...precio,
    canal: datos.canal,
    precioCosto: datos.precioCosto,
    precioCostoBase: datos.precioCostoBase,
    precioCostoDescuento: datos.precioCostoDescuento,
    precioUnitario: datos.precioUnitario,
    precioMayorista: datos.precioMayorista,
    unidadesComp: datos.unidadesComp,
    unidadesBonificadas: datos.unidadesBonificadas,
    descuento1: datos.descuento1,
    descuento2: datos.descuento2,
    descuento3: datos.descuento3,
    descuento4: datos.descuento4,
    observacion: datos.observacion,
    fechaModificacion: datos.fechaModificacion || precio.fechaModificacion,
    rangos: [...datos.rangos],
  };
}

function vacio(idPrecio: number): PrecioProducto {
  return {
    idPrecio,
    idProducto: 0,
    idGrupo: 0,
    nombreGrupo: '',
    idCanal: null,
    canal: '',
    observacion: '',
    usuario: '',
    precioUnitario: 0,
    precioMayorista: 0,
    precioDocena: 0,
    precioCosto: 0,
    precioCostoBase: 0,
    precioCostoDescuento: 0,
    unidadesComp: 1,
    unidadesBonificadas: 0,
    descuento1: 0,
    descuento2: 0,
    descuento3: 0,
    descuento4: 0,
    fechaModificacion: null,
    rangos: [],
  };
}

function mensajeDeBorrado(respuesta: HttpErrorResponse): string {
  // 404: el precio ya no estaba; alguien lo borró antes desde otra pantalla.
  if (respuesta.status === 404) {
    return 'Ese precio ya no existe en la base.';
  }
  return 'No se pudo eliminar el precio. Inténtalo de nuevo.';
}

/** La tabla muestra `dd/MM/yyyy`. */
function formatearFecha(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }
  const dia = `${fecha.getDate()}`.padStart(2, '0');
  const mes = `${fecha.getMonth() + 1}`.padStart(2, '0');
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}
