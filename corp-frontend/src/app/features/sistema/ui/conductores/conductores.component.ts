import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCar,
  lucideEraser,
  lucideSearch,
  lucideSquarePen,
  lucideTrash2,
  lucideUserPlus,
} from '@ng-icons/lucide';
import { EnterNavigateDirective } from '@/shared/directives/enter-navigate.directive';
import { ConfirmService } from '@/shared/services/confirm.service';
import { BotonAccionComponent } from '@/shared/ui/boton-accion/boton-accion.component';
import { Conductor, Vehiculo } from '../../data-access/conductores.models';
import { ConductoresStore } from '../../data-access/conductores.store';

/** Conductores y vehículos de reparto, cada uno con su listado. */
@Component({
  selector: 'app-conductores',
  imports: [NgIcon, EnterNavigateDirective, BotonAccionComponent],
  providers: [
    ConductoresStore,
    provideIcons({
      lucideCar,
      lucideEraser,
      lucideSearch,
      lucideSquarePen,
      lucideTrash2,
      lucideUserPlus,
    }),
  ],
  templateUrl: './conductores.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConductoresComponent {
  readonly store = inject(ConductoresStore);
  private readonly dialogos = inject(ConfirmService);

  cambiarTexto(event: Event): void {
    this.store.texto.set((event.target as HTMLInputElement).value);
  }

  async eliminarConductor(conductor: Conductor): Promise<void> {
    const confirmado = await this.dialogos.confirm(
      `Se dará de baja a ${conductor.nombre}.`,
      'Eliminar',
      'Cancelar',
      'warning'
    );
    if (confirmado) {
      this.store.eliminarConductor(conductor.idConductor);
    }
  }

  async eliminarVehiculo(vehiculo: Vehiculo): Promise<void> {
    const confirmado = await this.dialogos.confirm(
      `Se dará de baja el vehículo ${vehiculo.placa}.`,
      'Eliminar',
      'Cancelar',
      'warning'
    );
    if (confirmado) {
      this.store.eliminarVehiculo(vehiculo.idVehiculo);
    }
  }

  // TODO(backend): faltan los endpoints de alta y edición.
  agregarConductor(): void {}

  agregarVehiculo(): void {}

  editarConductor(_conductor: Conductor): void {}

  editarVehiculo(_vehiculo: Vehiculo): void {}
}
