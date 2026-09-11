import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CambioPrecio,
  CodigoBarra,
  CriterioValidacionProducto,
  GuardarProducto,
  PrecioProducto,
  ProductoAutocomplete,
  ProductoDetalle,
  ProductoProveedor,
  ValidacionProducto,
} from './productos.models';

@Injectable({ providedIn: 'root' })
export class ProductosApiService {
  private readonly http = inject(HttpClient);

  listarAutocomplete(busqueda: string, estado: string): Observable<ProductoAutocomplete[]> {
    let params = new HttpParams();
    if (busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<ProductoAutocomplete[]>(
      `${environment.apiBaseUrl}/productos/autocomplete`,
      { params },
    );
  }

  /** Comprueba si el código o el código de barra ya existen. */
  validar(criterio: CriterioValidacionProducto): Observable<ValidacionProducto> {
    let params = new HttpParams();
    if (criterio.codigo?.trim()) {
      params = params.set('codigo', criterio.codigo.trim());
    }
    if (criterio.idProducto !== undefined) {
      params = params.set('idProducto', criterio.idProducto);
    }
    if (criterio.codigoBarra?.trim()) {
      params = params.set('codigoBarra', criterio.codigoBarra.trim());
    }
    return this.http.get<ValidacionProducto>(`${environment.apiBaseUrl}/productos/validar`, {
      params,
    });
  }

  /** Ficha completa por código; 404 si no existe. */
  encontrar(codigoProducto: string): Observable<ProductoDetalle> {
    const params = new HttpParams().set('codigoProducto', codigoProducto.trim());
    return this.http.get<ProductoDetalle>(`${environment.apiBaseUrl}/productos/buscar`, { params });
  }

  listarPrecios(idProducto: number): Observable<PrecioProducto[]> {
    return this.http.get<PrecioProducto[]>(
      `${environment.apiBaseUrl}/productos/${idProducto}/precios`,
    );
  }

  /** Borra el precio del canal: la fila base y todos sus rangos por cantidad. */
  eliminarPreciosDeCanal(idProducto: number, idCanal: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/productos/${idProducto}/precios/canal/${idCanal}`,
    );
  }

  /** Historial de cambios de un precio, del más reciente al más antiguo. */
  listarHistorialPrecio(idPrecio: number): Observable<CambioPrecio[]> {
    return this.http.get<CambioPrecio[]>(
      `${environment.apiBaseUrl}/productos/precios/${idPrecio}/historial`,
    );
  }

  listarCodigosBarra(idProducto: number): Observable<CodigoBarra[]> {
    return this.http.get<CodigoBarra[]>(
      `${environment.apiBaseUrl}/productos/${idProducto}/codigos-barra`,
    );
  }

  agregar(producto: GuardarProducto): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/productos`, producto);
  }

  /** Devuelve la ficha releída de la base, que confirma que el cambio quedó. */
  actualizar(idProducto: number, producto: GuardarProducto): Observable<ProductoDetalle> {
    return this.http.put<ProductoDetalle>(
      `${environment.apiBaseUrl}/productos/${idProducto}`,
      producto,
    );
  }

  /** Lista existencias por almacén asociadas a un precio/canal. */
  listarStockAlmacen(idPrecio: number): Observable<import('./productos.models').StockAlmacen[]> {
    return this.http.get<import('./productos.models').StockAlmacen[]>(
      `${environment.apiBaseUrl}/productos/precios/${idPrecio}/almacenes`,
    );
  }

  /** Aplica ajustes de stock (sumar o actualizar) para los almacenes. */
  actualizarStockAlmacen(
    idPrecio: number,
    ajustes: import('./productos.models').AjusteStockItem[],
  ): Observable<void> {
    return this.http.put<void>(
      `${environment.apiBaseUrl}/productos/precios/${idPrecio}/almacenes`,
      { ajustes },
    );
  }

  /** Sube el archivo de imagen para el producto. */
  subirImagen(idProducto: number, archivo: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    return this.http.post<{ url: string }>(
      `${environment.apiBaseUrl}/productos/${idProducto}/imagen`,
      formData,
    );
  }

  /** Elimina la imagen del producto. */
  eliminarImagen(idProducto: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/productos/${idProducto}/imagen`);
  }

  /** Lista los proveedores asociados al producto (SP_PRODUCTO_LISTAR_PROVEEDORES). */
  listarProveedoresProducto(idProducto: number): Observable<readonly ProductoProveedor[]> {
    return this.http.get<readonly ProductoProveedor[]>(
      `${environment.apiBaseUrl}/productos/${idProducto}/proveedores`,
    );
  }

  /** Asocia un proveedor al producto (SP_PRODUCTO_AGREGAR_PROVEEDOR). */
  asociarProveedorProducto(
    idProducto: number,
    idProveedor: number,
  ): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${environment.apiBaseUrl}/productos/${idProducto}/proveedores`,
      { idProveedor },
    );
  }

  /** Desvincula un proveedor del producto (SP_PRODUCTO_ELIMINAR_PROVEEDOR). */
  eliminarProveedorProducto(
    idProducto: number,
    idProductoProveedor: number,
  ): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/productos/${idProducto}/proveedores/${idProductoProveedor}`,
    );
  }
}
