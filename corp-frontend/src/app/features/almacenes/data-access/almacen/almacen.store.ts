import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Almacen } from './almacen.models';
import { AlmacenesApiService } from './almacenes-api.service';

/** Sin tildes y en minúsculas: se busca como se teclea, no como está escrito en la BD. */
function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Mantenimiento de almacenes; se provee por componente para arrancar limpio. */
@Injectable()
export class AlmacenStore {
  private readonly api = inject(AlmacenesApiService);

  readonly codigo = signal('');
  readonly descripcion = signal('');

  readonly cargando = signal(true);
  readonly error = signal(false);

  private readonly todos = signal<readonly Almacen[]>([]);

  readonly resultados = computed(() => {
    const codigo = normalizar(this.codigo());
    const descripcion = normalizar(this.descripcion());

    return this.todos().filter((fila) => {
      if (codigo && !normalizar(fila.codigo).includes(codigo)) {
        return false;
      }
      return !descripcion || normalizar(fila.descripcion).includes(descripcion);
    });
  });

  readonly total = computed(() => this.todos().length);
  readonly hayFiltros = computed(
    () => this.codigo().trim() !== '' || this.descripcion().trim() !== ''
  );

  constructor() {
    this.api
      .listarAlmacenes()
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of<readonly Almacen[]>([]);
        }),
        takeUntilDestroyed()
      )
      .subscribe((almacenes) => {
        this.todos.set(almacenes);
        this.cargando.set(false);
      });
  }

  limpiar(): void {
    this.codigo.set('');
    this.descripcion.set('');
  }

  /** Baja en memoria. TODO(backend): falta el endpoint. */
  eliminar(idAlmacen: number): void {
    this.todos.update((filas) => filas.filter((fila) => fila.idAlmacen !== idAlmacen));
  }
}
