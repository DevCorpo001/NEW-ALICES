import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppModalComponent } from '../../../../../../shared/ui/modal/app-modal.component';
import { ProductosApiService } from '../../../../data-access/producto/productos-api.service';
import { CambioPrecio, TipoCambioPrecio } from '../../../../data-access/producto/productos.models';

/** Cómo se pinta cada tipo de movimiento en la columna ESTADO. */
const ESTADOS: Record<TipoCambioPrecio, { etiqueta: string; clase: string }> = {
  INSERT: { etiqueta: 'Alta', clase: 'bg-success-light text-success' },
  UPDATE: { etiqueta: 'Modificación', clase: 'bg-primary-light text-primary' },
  DELETE: { etiqueta: 'Eliminación', clase: 'bg-slate-200 text-slate-600' },
};

/** Fila del historial ya formateada para la tabla. */
export interface FilaHistorialPrecio {
  readonly idCambio: number;
  readonly fecha: string;
  readonly usuario: string;
  readonly desde: string;
  readonly precio: string;
  /** Unidades compradas; se muestra en la columna rotulada UNIDAD. */
  readonly unidadesComp: string;
  readonly unidadesBonificadas: string;
  readonly descuento1: string;
  readonly descuento2: string;
  readonly estado: string;
  readonly estadoClase: string;
}

/** Historial de cambios de un precio; carga sus propios datos al abrirse. */
@Component({
  selector: 'app-historial-precios-modal',
  imports: [AppModalComponent],
  templateUrl: './historial-precios-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialPreciosModalComponent {
  readonly abierto = input(false);
  readonly idPrecio = input<number | null>(null);
  readonly canal = input<string | null>(null);
  readonly cerrar = output();

  private readonly productosApi = inject(ProductosApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cambios = signal<readonly CambioPrecio[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly titulo = computed(() => {
    const canal = this.canal()?.trim();
    return canal ? `Historial De Cambios - ${canal}` : 'Historial De Cambios';
  });

  readonly filas = computed<readonly FilaHistorialPrecio[]>(() =>
    this.cambios().map((cambio) => {
      const estado = cambio.tipo ? ESTADOS[cambio.tipo] : undefined;
      return {
        idCambio: cambio.idCambio,
        fecha: fechaHora(cambio.fecha),
        usuario: cambio.usuario?.trim() || '—',
        desde: entero(cambio.desde),
        precio: decimales(cambio.precioUnitario),
        unidadesComp: entero(cambio.unidadesComp),
        unidadesBonificadas: entero(cambio.unidadesBonificadas),
        descuento1: porcentaje(cambio.descuento1),
        descuento2: porcentaje(cambio.descuento2),
        estado: estado?.etiqueta ?? '—',
        estadoClase: estado?.clase ?? 'bg-slate-100 text-slate-500',
      };
    })
  );

  constructor() {
    effect(() => {
      const idPrecio = this.idPrecio();
      if (!this.abierto() || idPrecio === null) {
        return;
      }
      // `untracked`: `cargar` escribe las señales que este efecto no debe observar (ver skill).
      untracked(() => this.cargar(idPrecio));
    });
  }

  private cargar(idPrecio: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.cambios.set([]);

    this.productosApi
      .listarHistorialPrecio(idPrecio)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cambios) => {
          this.cambios.set(cambios);
          this.cargando.set(false);
        },
        error: (respuesta: HttpErrorResponse) => {
          this.error.set(mensajeDeHistorial(respuesta));
          this.cargando.set(false);
        },
      });
  }
}

/** `dd/MM/yyyy HH:mm`; el historial necesita la hora para ordenar cambios del mismo día. */
function fechaHora(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }
  const dia = `${fecha.getDate()}`.padStart(2, '0');
  const mes = `${fecha.getMonth() + 1}`.padStart(2, '0');
  const hora = `${fecha.getHours()}`.padStart(2, '0');
  const minuto = `${fecha.getMinutes()}`.padStart(2, '0');
  return `${dia}/${mes}/${fecha.getFullYear()} ${hora}:${minuto}`;
}

function decimales(valor: number | null): string {
  return valor === null ? '—' : valor.toFixed(2);
}

function entero(valor: number | null): string {
  return valor === null ? '—' : `${valor}`;
}

function porcentaje(valor: number | null): string {
  return valor === null ? '—' : `${valor.toFixed(2)}%`;
}

function mensajeDeHistorial(respuesta: HttpErrorResponse): string {
  if (respuesta.status === 404) {
    return 'Este precio ya no existe.';
  }
  return 'No se pudo cargar el historial de cambios.';
}
