import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Cliente } from './clientes.models';
import { normalizar } from './seguridad.filtros';
import { SistemaApiService } from './sistema-api.service';

/** Campos que se pueden filtrar desde la cabecera de la tabla. */
export type ColumnaCliente =
  | 'documento'
  | 'nombre'
  | 'abreviatura'
  | 'nombreComercial'
  | 'direccion'
  | 'fechaRegistro'
  | 'condicion'
  | 'ultimaValidacion'
  | 'ubigeo'
  | 'estado';

export const CLIENTES_POR_PAGINA = 12;

/** Clientes con los filtros de la barra superior y los de cada columna. */
@Injectable()
export class ClientesStore {
  private readonly api = inject(SistemaApiService);

  readonly documento = signal('');
  readonly nombre = signal('');
  readonly nombreComercial = signal('');

  /** Filtro escrito en el embudo de cada columna; vacío es sin filtrar. */
  readonly porColumna = signal<Readonly<Partial<Record<ColumnaCliente, string>>>>({});

  readonly pagina = signal(1);
  readonly cargando = signal(true);
  readonly error = signal(false);

  private readonly todos = signal<readonly Cliente[]>([]);

  readonly resultados = computed(() => {
    const documento = normalizar(this.documento());
    const nombre = normalizar(this.nombre());
    const comercial = normalizar(this.nombreComercial());
    const columnas = Object.entries(this.porColumna()).filter(([, valor]) => valor?.trim());

    return this.todos().filter((fila) => {
      if (documento && !normalizar(fila.documento).includes(documento)) {
        return false;
      }
      if (nombre && !normalizar(fila.nombre).includes(nombre)) {
        return false;
      }
      if (comercial && !normalizar(fila.nombreComercial ?? '').includes(comercial)) {
        return false;
      }
      return columnas.every(([campo, valor]) =>
        normalizar(String(fila[campo as ColumnaCliente] ?? '')).includes(normalizar(valor ?? ''))
      );
    });
  });

  readonly total = computed(() => this.todos().length);

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.resultados().length / CLIENTES_POR_PAGINA))
  );

  readonly paginaActual = computed(() => Math.min(this.pagina(), this.totalPaginas()));

  readonly paginados = computed(() => {
    const desde = (this.paginaActual() - 1) * CLIENTES_POR_PAGINA;
    return this.resultados().slice(desde, desde + CLIENTES_POR_PAGINA);
  });

  readonly columnasFiltradas = computed(
    () => Object.values(this.porColumna()).filter((valor) => valor?.trim()).length
  );

  readonly hayFiltros = computed(
    () =>
      this.documento().trim() !== '' ||
      this.nombre().trim() !== '' ||
      this.nombreComercial().trim() !== '' ||
      this.columnasFiltradas() > 0
  );

  constructor() {
    this.api
      .listarClientes()
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of<readonly Cliente[]>([]);
        }),
        takeUntilDestroyed()
      )
      .subscribe((clientes) => {
        this.todos.set(clientes);
        this.cargando.set(false);
      });
  }

  filtroDe(columna: ColumnaCliente): string {
    return this.porColumna()[columna] ?? '';
  }

  filtrarColumna(columna: ColumnaCliente, valor: string): void {
    this.porColumna.update((actual) => ({ ...actual, [columna]: valor }));
    this.pagina.set(1);
  }

  cambiarDocumento(valor: string): void {
    this.documento.set(valor);
    this.pagina.set(1);
  }

  cambiarNombre(valor: string): void {
    this.nombre.set(valor);
    this.pagina.set(1);
  }

  cambiarNombreComercial(valor: string): void {
    this.nombreComercial.set(valor);
    this.pagina.set(1);
  }

  irAPagina(pagina: number): void {
    this.pagina.set(Math.min(Math.max(1, pagina), this.totalPaginas()));
  }

  limpiar(): void {
    this.documento.set('');
    this.nombre.set('');
    this.nombreComercial.set('');
    this.porColumna.set({});
    this.pagina.set(1);
  }
}
