import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { mensajeDeGuardado } from './producto-mensajes';
import { ProductosApiService } from './productos-api.service';
import { CodigoBarra, GuardarProducto, PrecioProducto, ProductoDetalle } from './productos.models';

export interface ProductoSeleccionado {
  readonly idProducto: number;
  readonly codigo: string;
  readonly nombre: string;
  readonly imagen?: string | null;
}

/** Lo que se pinta de una vez al abrir un producto. */
export interface FichaProducto {
  readonly detalle: ProductoDetalle;
  readonly precios: PrecioProducto[];
  readonly barras: CodigoBarra[];
}

/** Ficha del producto en pantalla; se provee por componente, como la búsqueda. */
@Injectable()
export class ProductoFichaStore {
  private readonly api = inject(ProductosApiService);

  readonly seleccionado = signal<ProductoSeleccionado | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly guardando = signal(false);
  readonly errorGuardado = signal<string | null>(null);

  /** Trae la ficha y, con su id, precios y barras; si estos fallan la ficha se rellena igual. */
  cargar(codigo: string): Observable<FichaProducto> {
    this.cargando.set(true);
    this.error.set(null);

    // Devuelve el flujo sin suscribirse: suscribir aquí y en el componente lanzaría dos veces la petición.
    return this.api.encontrar(codigo).pipe(
      switchMap((detalle) =>
        forkJoin({
          detalle: of(detalle),
          precios: this.api.listarPrecios(detalle.idProducto).pipe(catchError(() => of([]))),
          barras: this.api.listarCodigosBarra(detalle.idProducto).pipe(catchError(() => of([]))),
        })
      ),
      tap({
        next: ({ detalle }) => {
          this.cargando.set(false);
          this.seleccionar(detalle);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('No se pudieron cargar los datos del producto.');
        },
      })
    );
  }

  /** Sin id da de alta y no hay ficha de vuelta; con id actualiza y devuelve lo que quedó en la base. */
  guardar(cuerpo: GuardarProducto, idProducto: number | null): Observable<ProductoDetalle | null> {
    this.guardando.set(true);
    this.errorGuardado.set(null);

    const peticion: Observable<ProductoDetalle | null> =
      idProducto === null
        ? this.api.agregar(cuerpo).pipe(map(() => null))
        : this.api.actualizar(idProducto, cuerpo);

    return peticion.pipe(
      tap({
        next: (detalle) => {
          this.guardando.set(false);
          if (detalle) {
            this.seleccionar(detalle);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.guardando.set(false);
          this.errorGuardado.set(mensajeDeGuardado(error));
        },
      })
    );
  }

  private seleccionar(detalle: ProductoDetalle): void {
    this.seleccionado.set({
      idProducto: detalle.idProducto,
      codigo: detalle.codigoProducto ?? '',
      nombre: detalle.descripcion ?? '',
      imagen: detalle.imagen ?? null,
    });
  }

  reiniciar(): void {
    this.seleccionado.set(null);
    this.cargando.set(false);
    this.error.set(null);
    this.guardando.set(false);
    this.errorGuardado.set(null);
  }
}
