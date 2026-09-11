import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucidePlus, lucideSquarePen, lucideX } from '@ng-icons/lucide';
import { BotonAccionComponent } from '../../../../../shared/ui/boton-accion/boton-accion.component';
import { AppModalComponent } from '../../../../../shared/ui/modal/app-modal.component';
import { Canal } from '../../../data-access/tienda/tienda.models';

/** Alta y edición de canales de venta, en línea sobre la propia tabla. */
@Component({
  selector: 'app-canales-modal',
  imports: [NgIcon, AppModalComponent, BotonAccionComponent],
  providers: [provideIcons({ lucideCheck, lucidePlus, lucideSquarePen, lucideX })],
  templateUrl: './canales-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanalesModalComponent {
  readonly abierto = input(false);
  readonly canales = input.required<readonly Canal[]>();
  readonly siguienteId = input(0);

  readonly cerrar = output();
  readonly guardar = output<Canal>();

  /** `null` es sin edición; un id existente edita esa fila y `0` es el alta. */
  readonly editandoId = signal<number | null>(null);
  readonly nombre = signal('');
  readonly descripcion = signal('');

  crear(): void {
    this.editandoId.set(0);
    this.nombre.set('');
    this.descripcion.set('');
  }

  editar(canal: Canal): void {
    this.editandoId.set(canal.idCanal);
    this.nombre.set(canal.nombre);
    this.descripcion.set(canal.descripcion);
  }

  cancelar(): void {
    this.editandoId.set(null);
  }

  confirmar(): void {
    const id = this.editandoId();
    if (id === null || !this.nombre().trim()) {
      return;
    }
    this.guardar.emit({
      idCanal: id === 0 ? this.siguienteId() : id,
      nombre: this.nombre().trim().toUpperCase(),
      descripcion: this.descripcion().trim(),
    });
    this.cancelar();
  }

  cambiarNombre(event: Event): void {
    this.nombre.set((event.target as HTMLInputElement).value);
  }

  cambiarDescripcion(event: Event): void {
    this.descripcion.set((event.target as HTMLInputElement).value);
  }
}
