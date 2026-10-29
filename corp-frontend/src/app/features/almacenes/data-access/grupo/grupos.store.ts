import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';
import { AlmacenesApiService } from '../almacen/almacenes-api.service';
import { Grupo, ProductoAgrupable } from './grupo.models';
import { Canal } from '../tienda/tienda.models';

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Grupos y sus productos; una sola carga sirve a las dos pestañas de la pantalla. */
@Injectable()
export class GruposStore {
  private readonly api = inject(AlmacenesApiService);

  // Filtros de la pestaña Grupos
  readonly nombre = signal('');
  readonly codigo = signal('');
  readonly abreviacion = signal('');
  readonly idCanalGrupo = signal<number | null>(null);
  readonly soloConProductos = signal(false);

  // Filtros de la pestaña Grupo Producto
  readonly producto = signal('');
  readonly proveedor = signal('');
  readonly idCanalProducto = signal<number | null>(null);

  readonly seleccionados = signal<readonly number[]>([]);

  readonly cargando = signal(true);
  readonly error = signal(false);

  readonly canales = signal<readonly Canal[]>([]);
  private readonly grupos = signal<readonly Grupo[]>([]);
  private readonly productos = signal<readonly ProductoAgrupable[]>([]);

  readonly gruposFiltrados = computed(() => {
    const nombre = normalizar(this.nombre());
    const codigo = normalizar(this.codigo());
    const abreviacion = normalizar(this.abreviacion());

    return this.grupos().filter((fila) => {
      if (nombre && !normalizar(fila.nombre).includes(nombre)) {
        return false;
      }
      if (codigo && !normalizar(fila.codigo).includes(codigo)) {
        return false;
      }
      if (abreviacion && !normalizar(fila.abreviacion).includes(abreviacion)) {
        return false;
      }
      if (this.idCanalGrupo() !== null && fila.idCanal !== this.idCanalGrupo()) {
        return false;
      }
      return !this.soloConProductos() || fila.productos > 0;
    });
  });

  readonly productosFiltrados = computed(() => {
    const producto = normalizar(this.producto());
    const proveedor = normalizar(this.proveedor());

    return this.productos().filter((fila) => {
      if (producto && !normalizar(`${fila.codigo} ${fila.producto}`).includes(producto)) {
        return false;
      }
      if (proveedor && !normalizar(fila.proveedor).includes(proveedor)) {
        return false;
      }
      return this.idCanalProducto() === null || fila.idCanal === this.idCanalProducto();
    });
  });

  /** Todos los grupos, sin los filtros de su pestaña: el destino de una asignación no depende de ellos. */
  readonly listaGrupos = computed(() => this.grupos());

  readonly totalGrupos = computed(() => this.grupos().length);
  readonly totalProductos = computed(() => this.productos().length);

  readonly hayFiltrosGrupo = computed(
    () =>
      this.nombre().trim() !== '' ||
      this.codigo().trim() !== '' ||
      this.abreviacion().trim() !== '' ||
      this.idCanalGrupo() !== null ||
      this.soloConProductos()
  );

  readonly hayFiltrosProducto = computed(
    () =>
      this.producto().trim() !== '' ||
      this.proveedor().trim() !== '' ||
      this.idCanalProducto() !== null
  );

  /** Solo cuenta lo seleccionado que sigue visible tras filtrar. */
  readonly seleccionVisible = computed(() =>
    this.productosFiltrados().filter((fila) => this.seleccionados().includes(fila.idProducto))
  );

  readonly todosSeleccionados = computed(() => {
    const visibles = this.productosFiltrados();
    return visibles.length > 0 && this.seleccionVisible().length === visibles.length;
  });

  constructor() {
    forkJoin({
      grupos: this.api.listarGrupos(),
      productos: this.api.listarProductosAgrupables(),
      canales: this.api.listarCanales(),
    })
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of({
            grupos: [] as readonly Grupo[],
            productos: [] as readonly ProductoAgrupable[],
            canales: [] as readonly Canal[],
          });
        }),
        takeUntilDestroyed()
      )
      .subscribe(({ grupos, productos, canales }) => {
        this.grupos.set(grupos);
        this.productos.set(productos);
        this.canales.set(canales);
        this.cargando.set(false);
      });
  }

  productosDe(idGrupo: number): readonly ProductoAgrupable[] {
    return this.productos().filter((fila) => fila.idGrupo === idGrupo);
  }

  estaSeleccionado(idProducto: number): boolean {
    return this.seleccionados().includes(idProducto);
  }

  alternarSeleccion(idProducto: number): void {
    this.seleccionados.update((actuales) =>
      actuales.includes(idProducto)
        ? actuales.filter((id) => id !== idProducto)
        : [...actuales, idProducto]
    );
  }

  alternarTodos(): void {
    const visibles = this.productosFiltrados().map((fila) => fila.idProducto);
    this.seleccionados.set(this.todosSeleccionados() ? [] : visibles);
  }

  /** Mueve lo seleccionado al grupo. TODO(backend): falta el endpoint. */
  asignarGrupo(idGrupo: number): void {
    const grupo = this.grupos().find((fila) => fila.idGrupo === idGrupo);
    const elegidos = this.seleccionados();
    if (!grupo || elegidos.length === 0) {
      return;
    }

    this.productos.update((filas) =>
      filas.map((fila) =>
        elegidos.includes(fila.idProducto)
          ? { ...fila, idGrupo: grupo.idGrupo, grupo: grupo.nombre }
          : fila
      )
    );
    this.recontarGrupos();
    this.seleccionados.set([]);
  }

  limpiarGrupos(): void {
    this.nombre.set('');
    this.codigo.set('');
    this.abreviacion.set('');
    this.idCanalGrupo.set(null);
    this.soloConProductos.set(false);
  }

  limpiarProductos(): void {
    this.producto.set('');
    this.proveedor.set('');
    this.idCanalProducto.set(null);
    this.seleccionados.set([]);
  }

  eliminarGrupo(idGrupo: number): void {
    this.grupos.update((filas) => filas.filter((fila) => fila.idGrupo !== idGrupo));
    this.productos.update((filas) =>
      filas.map((fila) => (fila.idGrupo === idGrupo ? { ...fila, idGrupo: null, grupo: null } : fila))
    );
  }

  private recontarGrupos(): void {
    this.grupos.update((filas) =>
      filas.map((grupo) => ({
        ...grupo,
        productos: this.productos().filter((fila) => fila.idGrupo === grupo.idGrupo).length,
      }))
    );
  }
}
