import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';
import { Conductor, Vehiculo } from './conductores.models';
import { SistemaApiService } from './sistema-api.service';
import { normalizar } from './seguridad.filtros';

/** Conductores y vehículos: dos listados de la misma pantalla, con un buscador común. */
@Injectable()
export class ConductoresStore {
  private readonly api = inject(SistemaApiService);

  readonly texto = signal('');
  readonly cargando = signal(true);
  readonly error = signal(false);

  private readonly conductores = signal<readonly Conductor[]>([]);
  private readonly vehiculos = signal<readonly Vehiculo[]>([]);

  readonly conductoresFiltrados = computed(() => {
    const texto = normalizar(this.texto());
    if (!texto) {
      return this.conductores();
    }
    return this.conductores().filter((fila) =>
      normalizar(`${fila.nombre} ${fila.numeroDocumento} ${fila.licencia}`).includes(texto)
    );
  });

  readonly vehiculosFiltrados = computed(() => {
    const texto = normalizar(this.texto());
    if (!texto) {
      return this.vehiculos();
    }
    return this.vehiculos().filter((fila) =>
      normalizar(`${fila.placa} ${fila.nombre}`).includes(texto)
    );
  });

  readonly totalConductores = computed(() => this.conductores().length);
  readonly totalVehiculos = computed(() => this.vehiculos().length);
  readonly hayFiltro = computed(() => this.texto().trim() !== '');

  constructor() {
    forkJoin({
      conductores: this.api.listarConductores(),
      vehiculos: this.api.listarVehiculos(),
    })
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of({ conductores: [] as readonly Conductor[], vehiculos: [] as readonly Vehiculo[] });
        }),
        takeUntilDestroyed()
      )
      .subscribe(({ conductores, vehiculos }) => {
        this.conductores.set(conductores);
        this.vehiculos.set(vehiculos);
        this.cargando.set(false);
      });
  }

  limpiar(): void {
    this.texto.set('');
  }

  // TODO(backend): las bajas se quedan en memoria; falta el endpoint.
  eliminarConductor(idConductor: number): void {
    this.conductores.update((filas) => filas.filter((fila) => fila.idConductor !== idConductor));
  }

  eliminarVehiculo(idVehiculo: number): void {
    this.vehiculos.update((filas) => filas.filter((fila) => fila.idVehiculo !== idVehiculo));
  }
}
