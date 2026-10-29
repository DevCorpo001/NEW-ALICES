import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEraser, lucideFolderPlus } from '@ng-icons/lucide';
import { EnterNavigateDirective } from '@/shared/directives/enter-navigate.directive';
import { GruposStore } from '../../../data-access/grupo/grupos.store';
import { AsignarGrupoModalComponent } from '../modals/asignar-grupo-modal.component';

/** Pestaña de asignación: se marcan productos y se mueven a un grupo. */
@Component({
  selector: 'app-grupo-productos-tab',
  imports: [NgIcon, DecimalPipe, EnterNavigateDirective, AsignarGrupoModalComponent],
  providers: [provideIcons({ lucideEraser, lucideFolderPlus })],
  templateUrl: './grupo-productos-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrupoProductosTabComponent {
  readonly store = inject(GruposStore);

  readonly asignarAbierto = signal(false);

  cambiarProducto(event: Event): void {
    this.store.producto.set((event.target as HTMLInputElement).value);
  }

  cambiarProveedor(event: Event): void {
    this.store.proveedor.set((event.target as HTMLInputElement).value);
  }

  cambiarCanal(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.store.idCanalProducto.set(valor ? Number(valor) : null);
  }

  asignar(idGrupo: number): void {
    this.store.asignarGrupo(idGrupo);
    this.asignarAbierto.set(false);
  }
}
