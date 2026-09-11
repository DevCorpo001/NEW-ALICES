import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Perfil, TipoPerfil } from './perfiles.models';
import { SistemaApiService } from './sistema-api.service';
import { coincideEstado, normalizar } from './seguridad.filtros';
import { FiltroEstado } from './seguridad.models';

/** Vendedores y cajeros comparten pantalla y filtros; solo cambia el tipo activo. */
@Injectable()
export class PerfilesStore {
  private readonly api = inject(SistemaApiService);

  readonly tipo = signal<TipoPerfil>('vendedor');
  readonly codigo = signal('');
  readonly nombre = signal('');
  readonly estado = signal<FiltroEstado>('todos');

  readonly cargando = signal(true);
  readonly error = signal(false);

  private readonly todos = signal<readonly Perfil[]>([]);

  readonly delTipo = computed(() => this.todos().filter((fila) => fila.tipo === this.tipo()));

  readonly resultados = computed(() => {
    const codigo = normalizar(this.codigo());
    const nombre = normalizar(this.nombre());

    return this.delTipo().filter((fila) => {
      if (codigo && !normalizar(fila.codigo).includes(codigo)) {
        return false;
      }
      if (nombre && !normalizar(fila.nombre).includes(nombre)) {
        return false;
      }
      return coincideEstado(fila.estado, this.estado());
    });
  });

  readonly total = computed(() => this.delTipo().length);
  readonly activos = computed(() => this.delTipo().filter((fila) => fila.estado === 'A').length);

  readonly hayFiltros = computed(
    () =>
      this.codigo().trim() !== '' || this.nombre().trim() !== '' || this.estado() !== 'todos'
  );

  constructor() {
    this.api
      .listarPerfiles()
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of<readonly Perfil[]>([]);
        }),
        takeUntilDestroyed()
      )
      .subscribe((perfiles) => {
        this.todos.set(perfiles);
        this.cargando.set(false);
      });
  }

  /** Los filtros nombran al tipo ("Código Vendedor"), así que al cambiar de pestaña se limpian. */
  cambiarTipo(tipo: TipoPerfil): void {
    this.tipo.set(tipo);
    this.limpiar();
  }

  limpiar(): void {
    this.codigo.set('');
    this.nombre.set('');
    this.estado.set('todos');
  }

  /** Alterna activo/inactivo en memoria. TODO(backend): falta el endpoint. */
  alternarEstado(idPerfil: number): void {
    this.todos.update((perfiles) =>
      perfiles.map((fila) =>
        fila.idPerfil === idPerfil ? { ...fila, estado: fila.estado === 'A' ? 'I' : 'A' } : fila
      )
    );
  }
}
