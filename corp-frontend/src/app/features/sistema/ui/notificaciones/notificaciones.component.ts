import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSend, lucideTrash2 } from '@ng-icons/lucide';
import { ConfirmService } from '@/shared/services/confirm.service';
import { BotonAccionComponent } from '@/shared/ui/boton-accion/boton-accion.component';
import { Notificacion } from '../../data-access/notificaciones.models';
import { NotificacionesStore } from '../../data-access/notificaciones.store';

/** Envío de avisos a los terminales y registro de lo enviado. */
@Component({
  selector: 'app-notificaciones',
  imports: [NgIcon, DatePipe, BotonAccionComponent],
  providers: [NotificacionesStore, provideIcons({ lucideSend, lucideTrash2 })],
  templateUrl: './notificaciones.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionesComponent {
  readonly store = inject(NotificacionesStore);
  private readonly dialogos = inject(ConfirmService);

  readonly borrador = signal('');

  readonly puedeEnviar = computed(() => this.borrador().trim().length > 0);

  escribir(event: Event): void {
    this.borrador.set((event.target as HTMLTextAreaElement).value);
  }

  enviar(): void {
    if (!this.puedeEnviar()) {
      return;
    }
    this.store.enviar(this.borrador());
    this.borrador.set('');
  }

  async eliminar(notificacion: Notificacion): Promise<void> {
    const confirmado = await this.dialogos.confirm(
      `Se borrará del registro: "${notificacion.mensaje}".`,
      'Eliminar',
      'Cancelar',
      'warning'
    );
    if (confirmado) {
      this.store.eliminar(notificacion.idNotificacion);
    }
  }
}
