import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { SistemaApiService } from './sistema-api.service';
import { contarPorCobertura, filtrarRoles } from './seguridad.filtros';
import { FiltroCobertura, Rol } from './seguridad.models';

/** Listado de roles con sus filtros y las columnas ocultas de la tabla. */
@Injectable()
export class RolesFiltroStore {
  private readonly api = inject(SistemaApiService);

  readonly texto = signal('');
  readonly cobertura = signal<FiltroCobertura>('todos');

  /** Se guardan las ocultas, no las visibles: al entrar están todas marcadas. */
  readonly columnasOcultas = signal<readonly string[]>([]);

  readonly cargando = signal(true);
  readonly error = signal(false);

  private readonly todos = signal<readonly Rol[]>([]);

  readonly resultados = computed(() =>
    filtrarRoles(this.todos(), { texto: this.texto(), cobertura: this.cobertura() })
  );

  readonly total = computed(() => this.todos().length);
  readonly conteoCobertura = computed(() => contarPorCobertura(this.todos()));

  /** Para el selector de rol de la pestaña de usuarios. */
  readonly opcionesRol = computed(() =>
    this.todos().map((rol) => ({ idRol: rol.idRol, nombre: rol.nombre }))
  );

  readonly hayFiltros = computed(
    () => this.texto().trim() !== '' || this.cobertura() !== 'todos'
  );

  constructor() {
    this.api
      .listarRoles()
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of<readonly Rol[]>([]);
        }),
        takeUntilDestroyed()
      )
      .subscribe((roles) => {
        this.todos.set(roles);
        this.cargando.set(false);
      });
  }

  /** Limpia filtros; las columnas visibles no son un filtro de datos y se conservan. */
  limpiar(): void {
    this.texto.set('');
    this.cobertura.set('todos');
  }
}
