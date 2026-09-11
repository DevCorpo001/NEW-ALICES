import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { Almacen } from './almacen.models';
import { ALMACENES_DEMO, CANALES_DEMO, EMPRESAS_DEMO, TIENDAS_DEMO } from './almacenes.datos-demo';
import { Grupo, ProductoAgrupable } from '../grupo/grupo.models';
import { GRUPOS_DEMO, PRODUCTOS_AGRUPABLES_DEMO } from '../grupo/grupos.datos-demo';
import { Canal, Empresa, Tienda } from '../tienda/tienda.models';

/** Mantenimientos de almacén y tienda. TODO(backend): faltan los SPs; hoy responde con datos de muestra. */
@Injectable({ providedIn: 'root' })
export class AlmacenesApiService {
  listarAlmacenes(): Observable<readonly Almacen[]> {
    return of(ALMACENES_DEMO).pipe(delay(RETARDO_MS));
  }

  listarTiendas(): Observable<readonly Tienda[]> {
    return of(TIENDAS_DEMO).pipe(delay(RETARDO_MS));
  }

  listarCanales(): Observable<readonly Canal[]> {
    return of(CANALES_DEMO).pipe(delay(RETARDO_MS));
  }

  listarEmpresas(): Observable<readonly Empresa[]> {
    return of(EMPRESAS_DEMO).pipe(delay(RETARDO_MS));
  }

  listarGrupos(): Observable<readonly Grupo[]> {
    return of(GRUPOS_DEMO).pipe(delay(RETARDO_MS));
  }

  listarProductosAgrupables(): Observable<readonly ProductoAgrupable[]> {
    return of(PRODUCTOS_AGRUPABLES_DEMO).pipe(delay(RETARDO_MS));
  }
}

const RETARDO_MS = 250;
