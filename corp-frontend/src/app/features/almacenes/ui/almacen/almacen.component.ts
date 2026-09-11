import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEraser, lucidePlus, lucideSquarePen, lucideTrash2 } from '@ng-icons/lucide';
import { EnterNavigateDirective } from '../../../../shared/directives/enter-navigate.directive';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { BotonAccionComponent } from '../../../../shared/ui/boton-accion/boton-accion.component';
import { Almacen } from '../../data-access/almacen/almacen.models';
import { AlmacenStore } from '../../data-access/almacen/almacen.store';

/** Mantenimiento de almacenes. */
@Component({
  selector: 'app-almacen',
  imports: [NgIcon, EnterNavigateDirective, BotonAccionComponent],
  providers: [
    AlmacenStore,
    provideIcons({ lucideEraser, lucidePlus, lucideSquarePen, lucideTrash2 }),
  ],
  templateUrl: './almacen.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlmacenComponent {
  readonly store = inject(AlmacenStore);
  private readonly dialogos = inject(ConfirmService);

  cambiarCodigo(event: Event): void {
    this.store.codigo.set((event.target as HTMLInputElement).value);
  }

  cambiarDescripcion(event: Event): void {
    this.store.descripcion.set((event.target as HTMLInputElement).value);
  }

  async eliminar(almacen: Almacen): Promise<void> {
    const confirmado = await this.dialogos.confirm(
      `Se dará de baja el almacén ${almacen.codigo} — ${almacen.descripcion}.`,
      'Eliminar',
      'Cancelar',
      'warning'
    );
    if (confirmado) {
      this.store.eliminar(almacen.idAlmacen);
    }
  }

  // TODO(backend): faltan los endpoints de alta y edición.
  agregar(): void {}

  editar(_almacen: Almacen): void {}
}
