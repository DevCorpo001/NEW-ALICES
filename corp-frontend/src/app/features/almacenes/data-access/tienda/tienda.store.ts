import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';
import { AlmacenesApiService } from '../almacen/almacenes-api.service';
import { Canal, Empresa, GuardarTienda, Tienda } from './tienda.models';

export type FiltroEstadoTienda = 'todos' | 'activo' | 'inactivo';

/** Mantenimiento de tiendas, con sus canales y empresas para los selectores. */
@Injectable()
export class TiendaStore {
  private readonly api = inject(AlmacenesApiService);

  readonly codigo = signal('');
  readonly idRazonSocial = signal<number | null>(null);
  readonly idCanal = signal<number | null>(null);
  readonly estado = signal<FiltroEstadoTienda>('todos');

  readonly cargando = signal(true);
  readonly error = signal(false);

  private readonly todas = signal<readonly Tienda[]>([]);
  readonly canales = signal<readonly Canal[]>([]);
  readonly empresas = signal<readonly Empresa[]>([]);

  readonly resultados = computed(() => {
    const codigo = this.codigo().trim().toLowerCase();
    const empresa = this.empresas().find((fila) => fila.idEmpresa === this.idRazonSocial());

    return this.todas().filter((fila) => {
      if (codigo && !fila.codigo.toLowerCase().includes(codigo)) {
        return false;
      }
      if (empresa && fila.ruc !== empresa.ruc) {
        return false;
      }
      if (this.idCanal() !== null && fila.idCanal !== this.idCanal()) {
        return false;
      }
      if (this.estado() === 'todos') {
        return true;
      }
      return this.estado() === 'activo' ? fila.activo : !fila.activo;
    });
  });

  readonly total = computed(() => this.todas().length);
  readonly activas = computed(() => this.todas().filter((fila) => fila.activo).length);

  readonly hayFiltros = computed(
    () =>
      this.codigo().trim() !== '' ||
      this.idRazonSocial() !== null ||
      this.idCanal() !== null ||
      this.estado() !== 'todos'
  );

  constructor() {
    forkJoin({
      tiendas: this.api.listarTiendas(),
      canales: this.api.listarCanales(),
      empresas: this.api.listarEmpresas(),
    })
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of({
            tiendas: [] as readonly Tienda[],
            canales: [] as readonly Canal[],
            empresas: [] as readonly Empresa[],
          });
        }),
        takeUntilDestroyed()
      )
      .subscribe(({ tiendas, canales, empresas }) => {
        this.todas.set(tiendas);
        this.canales.set(canales);
        this.empresas.set(empresas);
        this.cargando.set(false);
      });
  }

  limpiar(): void {
    this.codigo.set('');
    this.idRazonSocial.set(null);
    this.idCanal.set(null);
    this.estado.set('todos');
  }

  // TODO(backend): las altas y los cambios se quedan en memoria; faltan los endpoints.
  agregar(datos: GuardarTienda): void {
    const empresa = this.empresas().find((fila) => fila.idEmpresa === datos.idEmpresa);
    const envio = this.empresas().find((fila) => fila.idEmpresa === datos.idEmpresaEnvio);
    const canal = this.canales().find((fila) => fila.idCanal === datos.idCanal);

    this.todas.update((filas) => [
      ...filas,
      {
        idTienda: filas.reduce((mayor, fila) => Math.max(mayor, fila.idTienda), 0) + 1,
        codigo: datos.codigo,
        direccion: datos.direccion,
        ruc: empresa?.ruc ?? '',
        razonSocial: empresa?.razonSocial ?? '',
        empresaEnvio: envio?.razonSocial ?? '',
        ubigeo: datos.ubigeo,
        cantidadImpresiones: datos.cantidadImpresiones,
        serie: datos.serie,
        manejaStock: datos.manejaStock,
        idCanal: datos.idCanal ?? 0,
        canal: canal?.nombre ?? '',
        activo: datos.activo,
      },
    ]);
  }

  alternarEstado(idTienda: number): void {
    this.todas.update((filas) =>
      filas.map((fila) => (fila.idTienda === idTienda ? { ...fila, activo: !fila.activo } : fila))
    );
  }

  guardarCanal(canal: Canal): void {
    this.canales.update((filas) => {
      const existe = filas.some((fila) => fila.idCanal === canal.idCanal);
      return existe
        ? filas.map((fila) => (fila.idCanal === canal.idCanal ? canal : fila))
        : [...filas, canal];
    });
  }

  siguienteIdCanal(): number {
    return this.canales().reduce((mayor, fila) => Math.max(mayor, fila.idCanal), 0) + 1;
  }
}
