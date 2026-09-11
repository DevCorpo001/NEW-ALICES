import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucidePlus, lucideRotateCcw, lucideTrash2, lucideX } from '@ng-icons/lucide';
import { MensajeFooter, MensajesFooterService } from '../../../../core/services/mensajes-footer.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { BotonAccionComponent } from '../../../../shared/ui/boton-accion/boton-accion.component';

/** Mensajes del ticker inferior y colores del pie; los cambios se ven al momento. */
@Component({
  selector: 'app-mensajes',
  imports: [NgIcon, BotonAccionComponent],
  providers: [
    provideIcons({ lucideCheck, lucidePlus, lucideRotateCcw, lucideTrash2, lucideX }),
  ],
  templateUrl: './mensajes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MensajesComponent {
  readonly footer = inject(MensajesFooterService);
  private readonly dialogos = inject(ConfirmService);

  readonly nuevo = signal('');
  readonly editandoId = signal<number | null>(null);
  readonly borrador = signal('');

  readonly puedeInsertar = computed(() => this.nuevo().trim().length > 0);
  readonly puedeGuardar = computed(() => this.borrador().trim().length > 0);

  cambiarNuevo(event: Event): void {
    this.nuevo.set((event.target as HTMLInputElement).value);
  }

  cambiarBorrador(event: Event): void {
    this.borrador.set((event.target as HTMLInputElement).value);
  }

  insertar(): void {
    if (!this.puedeInsertar()) {
      return;
    }
    this.footer.agregar(this.nuevo());
    this.nuevo.set('');
  }

  editar(mensaje: MensajeFooter): void {
    this.editandoId.set(mensaje.id);
    this.borrador.set(mensaje.texto);
  }

  guardar(): void {
    const id = this.editandoId();
    if (id === null || !this.puedeGuardar()) {
      return;
    }
    this.footer.actualizar(id, this.borrador());
    this.cancelar();
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.borrador.set('');
  }

  async eliminar(mensaje: MensajeFooter): Promise<void> {
    const confirmado = await this.dialogos.confirm(
      `El mensaje "${mensaje.texto}" dejará de mostrarse en el pie.`,
      'Eliminar',
      'Cancelar',
      'warning'
    );
    if (confirmado) {
      this.footer.eliminar(mensaje.id);
    }
  }

  cambiarColorTexto(event: Event): void {
    this.footer.cambiarColores((event.target as HTMLInputElement).value, this.footer.colorFondo());
  }

  cambiarColorFondo(event: Event): void {
    this.footer.cambiarColores(this.footer.colorTexto(), (event.target as HTMLInputElement).value);
  }
}
