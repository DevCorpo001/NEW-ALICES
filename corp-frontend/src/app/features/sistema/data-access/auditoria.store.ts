import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { RegistroAuditoria, TipoAccion } from './auditoria.models';
import { normalizar } from './seguridad.filtros';
import { SistemaApiService } from './sistema-api.service';

export interface CriterioAuditoria {
  readonly usuario: string;
  readonly modulo: string;
  readonly accion: TipoAccion | '';
  readonly desde: string;
  readonly hasta: string;
}

const SIN_CRITERIO: CriterioAuditoria = {
  usuario: '',
  modulo: '',
  accion: '',
  desde: '',
  hasta: '',
};

/** Bitácora de movimientos. Los filtros se aplican a mano: mañana esto será una consulta al servidor. */
@Injectable()
export class AuditoriaStore {
  private readonly api = inject(SistemaApiService);

  /** Lo que hay escrito en la barra. */
  readonly borrador = signal<CriterioAuditoria>(SIN_CRITERIO);
  /** Lo que se está mostrando; solo cambia al pulsar Aplicar. */
  private readonly aplicado = signal<CriterioAuditoria>(SIN_CRITERIO);

  readonly cargando = signal(true);
  readonly error = signal(false);

  private readonly todos = signal<readonly RegistroAuditoria[]>([]);

  readonly modulos = computed(() => [...new Set(this.todos().map((fila) => fila.modulo))].sort());

  readonly acciones = computed(() => [...new Set(this.todos().map((fila) => fila.accion))].sort());

  readonly resultados = computed(() => {
    const criterio = this.aplicado();
    const usuario = normalizar(criterio.usuario);

    return this.todos().filter((fila) => {
      if (usuario && !normalizar(fila.usuario).includes(usuario)) {
        return false;
      }
      if (criterio.modulo && fila.modulo !== criterio.modulo) {
        return false;
      }
      if (criterio.accion && fila.accion !== criterio.accion) {
        return false;
      }
      // Se compara el `yyyy-MM-dd` del ISO, así el rango incluye los días de los extremos enteros.
      const dia = fila.fechaHora.slice(0, 10);
      if (criterio.desde && dia < criterio.desde) {
        return false;
      }
      if (criterio.hasta && dia > criterio.hasta) {
        return false;
      }
      return true;
    });
  });

  readonly total = computed(() => this.todos().length);

  readonly hayFiltros = computed(() =>
    Object.values(this.aplicado()).some((valor) => valor !== '')
  );

  /** Avisa de que lo escrito todavía no se ha aplicado. */
  readonly sinAplicar = computed(() => {
    const borrador = this.borrador();
    const aplicado = this.aplicado();
    return (Object.keys(borrador) as (keyof CriterioAuditoria)[]).some(
      (campo) => borrador[campo] !== aplicado[campo]
    );
  });

  constructor() {
    this.api
      .listarAuditoria()
      .pipe(
        catchError(() => {
          this.error.set(true);
          return of<readonly RegistroAuditoria[]>([]);
        }),
        takeUntilDestroyed()
      )
      .subscribe((registros) => {
        this.todos.set(registros);
        this.cargando.set(false);
      });
  }

  cambiar<C extends keyof CriterioAuditoria>(campo: C, valor: CriterioAuditoria[C]): void {
    this.borrador.update((actual) => ({ ...actual, [campo]: valor }));
  }

  aplicar(): void {
    this.aplicado.set(this.borrador());
  }

  limpiar(): void {
    this.borrador.set(SIN_CRITERIO);
    this.aplicado.set(SIN_CRITERIO);
  }
}
