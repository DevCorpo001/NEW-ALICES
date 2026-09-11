import { Injectable, computed, signal } from '@angular/core';
import { Notificacion } from './notificaciones.models';

// TODO(backend): las notificaciones enviadas se quedan en memoria; falta el SP.
const DEMO: readonly Notificacion[] = [
  { idNotificacion: 1, mensaje: 'Recordar cierre de caja a las 21:00', enviadoEn: '2026-08-29T18:30:00' },
  { idNotificacion: 2, mensaje: 'Llega mercadería de AGIVA mañana temprano', enviadoEn: '2026-08-29T09:12:00' },
];

/** Notificaciones enviadas a los terminales, de la más reciente a la más antigua. */
@Injectable()
export class NotificacionesStore {
  private readonly enviadas = signal<readonly Notificacion[]>(DEMO);

  readonly notificaciones = computed(() =>
    [...this.enviadas()].sort((a, b) => b.enviadoEn.localeCompare(a.enviadoEn))
  );

  readonly total = computed(() => this.enviadas().length);

  enviar(mensaje: string): void {
    const limpio = mensaje.trim();
    if (!limpio) {
      return;
    }
    this.enviadas.update((actuales) => [
      ...actuales,
      {
        idNotificacion: this.siguienteId(actuales),
        mensaje: limpio,
        enviadoEn: new Date().toISOString(),
      },
    ]);
  }

  eliminar(idNotificacion: number): void {
    this.enviadas.update((actuales) =>
      actuales.filter((fila) => fila.idNotificacion !== idNotificacion)
    );
  }

  private siguienteId(actuales: readonly Notificacion[]): number {
    return actuales.reduce((mayor, fila) => Math.max(mayor, fila.idNotificacion), 0) + 1;
  }
}
