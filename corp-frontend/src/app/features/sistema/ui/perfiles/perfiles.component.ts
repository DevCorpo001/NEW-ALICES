import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideEraser,
  lucideRefreshCw,
  lucideStore,
  lucideUserPen,
  lucideUserPlus,
  lucideWallet,
} from '@ng-icons/lucide';
import { EnterNavigateDirective } from '@/shared/directives/enter-navigate.directive';
import { BotonAccionComponent } from '@/shared/ui/boton-accion/boton-accion.component';
import { EstadoChipComponent } from '@/shared/ui/estado-chip/estado-chip.component';
import { TabItem, TabsComponent } from '@/shared/ui/tabs/tabs.component';
import { ETIQUETAS_PERFIL, Perfil, TipoPerfil } from '../../data-access/perfiles.models';
import { PerfilesStore } from '../../data-access/perfiles.store';
import { FiltroEstado } from '../../data-access/seguridad.models';

/** Perfiles de venta y de caja: misma pantalla, cambia el tipo de la pestaña activa. */
@Component({
  selector: 'app-perfiles',
  imports: [
    NgIcon,
    EnterNavigateDirective,
    TabsComponent,
    EstadoChipComponent,
    BotonAccionComponent,
  ],
  providers: [
    PerfilesStore,
    provideIcons({
      lucideEraser,
      lucideRefreshCw,
      lucideStore,
      lucideUserPen,
      lucideUserPlus,
      lucideWallet,
    }),
  ],
  templateUrl: './perfiles.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilesComponent {
  readonly store = inject(PerfilesStore);

  readonly etiqueta = computed(() => ETIQUETAS_PERFIL[this.store.tipo()]);

  readonly tabs = computed<readonly TabItem[]>(() => [
    { id: 'vendedor', etiqueta: 'Vendedores', icono: 'lucideStore' },
    { id: 'cajero', etiqueta: 'Cajeros', icono: 'lucideWallet' },
  ]);

  cambiarTipo(tipo: string): void {
    this.store.cambiarTipo(tipo as TipoPerfil);
  }

  cambiarCodigo(event: Event): void {
    this.store.codigo.set((event.target as HTMLInputElement).value);
  }

  cambiarNombre(event: Event): void {
    this.store.nombre.set((event.target as HTMLInputElement).value);
  }

  cambiarEstado(event: Event): void {
    this.store.estado.set((event.target as HTMLSelectElement).value as FiltroEstado);
  }

  // TODO(backend): faltan los endpoints de alta y edición de perfiles.
  agregar(): void {}

  editar(_perfil: Perfil): void {}
}
