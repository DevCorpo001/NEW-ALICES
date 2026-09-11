import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { ProductoAutocomplete } from './productos.models';
import { ProductosApiService } from './productos-api.service';

export type EstadoProducto = 'todos' | 'activo' | 'inactivo';

type Resultado =
  | { readonly tipo: 'vacio' }
  | { readonly tipo: 'error' }
  | { readonly tipo: 'ok'; readonly filas: readonly ProductoAutocomplete[] };

const CODIGOS_ESTADO: Record<EstadoProducto, string> = {
  todos: '',
  activo: 'A',
  inactivo: 'I',
};

/** Búsqueda de productos; se provee por componente (no en `root`) para arrancar limpia. */
@Injectable()
export class ProductosBusquedaStore {
  private readonly api = inject(ProductosApiService);

  readonly termino = signal('');
  readonly estado = signal<EstadoProducto>('todos');

  readonly resultados = signal<readonly ProductoAutocomplete[]>([]);
  readonly buscando = signal(false);
  readonly error = signal(false);

  private readonly criterio = computed(() => ({
    termino: this.termino().trim(),
    estado: this.estado(),
  }));

  constructor() {
    toObservable(this.criterio)
      .pipe(
        switchMap(({ termino, estado }) => {
          if (!termino) {
            return of<Resultado>({ tipo: 'vacio' });
          }
          this.buscando.set(true);
          this.error.set(false);
          return this.api.listarAutocomplete(termino, CODIGOS_ESTADO[estado]).pipe(
            map((filas): Resultado => ({ tipo: 'ok', filas })),
            catchError(() => of<Resultado>({ tipo: 'error' }))
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe((resultado) => this.aplicar(resultado));
  }

  limpiar(): void {
    this.termino.set('');
    this.estado.set('todos');
  }

  private aplicar(resultado: Resultado): void {
    this.buscando.set(false);
    this.error.set(resultado.tipo === 'error');
    this.resultados.set(resultado.tipo === 'ok' ? resultado.filas : []);
  }
}
