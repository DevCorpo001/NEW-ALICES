import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEraser, lucideNetwork, lucidePlus, lucideSquarePen } from '@ng-icons/lucide';
import { EnterNavigateDirective } from '@/shared/directives/enter-navigate.directive';
import { BotonAccionComponent } from '@/shared/ui/boton-accion/boton-accion.component';
import { EstadoChipComponent } from '@/shared/ui/estado-chip/estado-chip.component';
import { Canal, GuardarTienda, Tienda } from '../../data-access/tienda/tienda.models';
import { FiltroEstadoTienda, TiendaStore } from '../../data-access/tienda/tienda.store';
import { CanalesModalComponent } from './modals/canales-modal.component';
import { TiendaFormModalComponent } from './modals/tienda-form-modal.component';

/** Mantenimiento de tiendas, con el alta y la gestión de canales en modales. */
@Component({
  selector: 'app-tienda',
  imports: [
    NgIcon,
    EnterNavigateDirective,
    EstadoChipComponent,
    BotonAccionComponent,
    TiendaFormModalComponent,
    CanalesModalComponent,
  ],
  providers: [
    TiendaStore,
    provideIcons({ lucideEraser, lucideNetwork, lucidePlus, lucideSquarePen }),
  ],
  templateUrl: './tienda.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TiendaComponent {
  readonly store = inject(TiendaStore);

  readonly formAbierto = signal(false);
  readonly canalesAbierto = signal(false);

  cambiarCodigo(event: Event): void {
    this.store.codigo.set((event.target as HTMLInputElement).value);
  }

  cambiarRazonSocial(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.store.idRazonSocial.set(valor ? Number(valor) : null);
  }

  cambiarCanal(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.store.idCanal.set(valor ? Number(valor) : null);
  }

  cambiarEstado(event: Event): void {
    this.store.estado.set((event.target as HTMLSelectElement).value as FiltroEstadoTienda);
  }

  guardarTienda(datos: GuardarTienda): void {
    this.store.agregar(datos);
    this.formAbierto.set(false);
  }

  guardarCanal(canal: Canal): void {
    this.store.guardarCanal(canal);
  }

  // TODO(backend): falta el endpoint de edición.
  editar(_tienda: Tienda): void {}
}
