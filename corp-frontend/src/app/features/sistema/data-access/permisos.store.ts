import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';
import { ClaveAutorizacion, ClaveQr } from './permisos.models';
import { SistemaApiService } from './sistema-api.service';

/** Claves de autorización y claves QR: las dos pestañas de Permisos. */
@Injectable()
export class PermisosStore {
  private readonly api = inject(SistemaApiService);

  readonly cargando = signal(true);
  readonly error = signal(false);

  readonly claves = signal<readonly ClaveAutorizacion[]>([]);
  readonly clavesQr = signal<readonly ClaveQr[]>([]);

  readonly clavesActivas = computed(
    () => this.claves().filter((fila) => fila.estado === 'A').length
  );
  readonly qrActivas = computed(
    () => this.clavesQr().filter((fila) => fila.estado === 'A').length
  );

  constructor() {
    forkJoin({
      claves: this.api.listarClaves(),
      clavesQr: this.api.listarClavesQr(),
    })
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of({ claves: [] as readonly ClaveAutorizacion[], clavesQr: [] as readonly ClaveQr[] });
        }),
        takeUntilDestroyed()
      )
      .subscribe(({ claves, clavesQr }) => {
        this.claves.set(claves);
        this.clavesQr.set(clavesQr);
        this.cargando.set(false);
      });
  }

  // TODO(backend): los cambios se quedan en memoria; faltan los endpoints.
  alternarClave(idClave: number): void {
    this.claves.update((filas) =>
      filas.map((fila) =>
        fila.idClave === idClave ? { ...fila, estado: fila.estado === 'A' ? 'I' : 'A' } : fila
      )
    );
  }

  alternarQr(idClaveQr: number): void {
    this.clavesQr.update((filas) =>
      filas.map((fila) =>
        fila.idClaveQr === idClaveQr ? { ...fila, estado: fila.estado === 'A' ? 'I' : 'A' } : fila
      )
    );
  }
}
