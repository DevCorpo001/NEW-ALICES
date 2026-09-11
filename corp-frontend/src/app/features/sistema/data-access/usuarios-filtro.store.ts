import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { SistemaApiService } from './sistema-api.service';
import { filtrarUsuarios } from './seguridad.filtros';
import { FiltroEstado, Usuario } from './seguridad.models';

export const USUARIOS_POR_PAGINA = 10;

/** Listado de usuarios con filtros y paginación; se provee por componente para arrancar limpio. */
@Injectable()
export class UsuariosFiltroStore {
  private readonly api = inject(SistemaApiService);

  readonly texto = signal('');
  readonly idRol = signal<number | null>(null);
  readonly estado = signal<FiltroEstado>('todos');
  readonly pagina = signal(1);

  readonly cargando = signal(true);
  readonly error = signal(false);

  private readonly todos = signal<readonly Usuario[]>([]);

  readonly resultados = computed(() =>
    filtrarUsuarios(this.todos(), {
      texto: this.texto(),
      idRol: this.idRol(),
      estado: this.estado(),
    })
  );

  readonly total = computed(() => this.todos().length);
  readonly activos = computed(() => this.todos().filter((fila) => fila.estado === 'A').length);

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.resultados().length / USUARIOS_POR_PAGINA))
  );

  /** Página efectiva: si el filtro deja menos páginas, se muestra la última en vez de una vacía. */
  readonly paginaActual = computed(() => Math.min(this.pagina(), this.totalPaginas()));

  readonly paginados = computed(() => {
    const desde = (this.paginaActual() - 1) * USUARIOS_POR_PAGINA;
    return this.resultados().slice(desde, desde + USUARIOS_POR_PAGINA);
  });

  readonly desde = computed(() =>
    this.resultados().length === 0 ? 0 : (this.paginaActual() - 1) * USUARIOS_POR_PAGINA + 1
  );

  readonly hasta = computed(() =>
    Math.min(this.paginaActual() * USUARIOS_POR_PAGINA, this.resultados().length)
  );

  readonly hayFiltros = computed(
    () => this.texto().trim() !== '' || this.idRol() !== null || this.estado() !== 'todos'
  );

  constructor() {
    this.api
      .listarUsuarios()
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of<readonly Usuario[]>([]);
        }),
        takeUntilDestroyed()
      )
      .subscribe((usuarios) => {
        this.todos.set(usuarios);
        this.cargando.set(false);
      });
  }

  // Cambiar un filtro vuelve a la primera página: la que se estaba viendo ya no significa lo mismo.
  cambiarTexto(texto: string): void {
    this.texto.set(texto);
    this.pagina.set(1);
  }

  cambiarRol(idRol: number | null): void {
    this.idRol.set(idRol);
    this.pagina.set(1);
  }

  cambiarEstado(estado: FiltroEstado): void {
    this.estado.set(estado);
    this.pagina.set(1);
  }

  irAPagina(pagina: number): void {
    this.pagina.set(Math.min(Math.max(1, pagina), this.totalPaginas()));
  }

  limpiar(): void {
    this.texto.set('');
    this.idRol.set(null);
    this.estado.set('todos');
    this.pagina.set(1);
  }

  /** Alterna activo/inactivo en memoria. TODO(backend): falta el endpoint. */
  alternarEstado(idUsuario: number): void {
    this.todos.update((usuarios) =>
      usuarios.map((fila) =>
        fila.idUsuario === idUsuario ? { ...fila, estado: fila.estado === 'A' ? 'I' : 'A' } : fila
      )
    );
  }
}
