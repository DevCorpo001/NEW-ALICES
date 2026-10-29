import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideBoxes, lucidePackage } from '@ng-icons/lucide';
import { TabItem, TabsComponent } from '@/shared/ui/tabs/tabs.component';
import { GruposStore } from '../../data-access/grupo/grupos.store';
import { GruposTabComponent } from './grupos/grupos-tab.component';
import { GrupoProductosTabComponent } from './productos/grupo-productos-tab.component';

type PestanaId = 'productos' | 'grupos';

/** Grupo Producto: asignar productos a un grupo, y el mantenimiento de los grupos. */
@Component({
  selector: 'app-grupo-producto',
  imports: [TabsComponent, GrupoProductosTabComponent, GruposTabComponent],
  providers: [GruposStore, provideIcons({ lucideBoxes, lucidePackage })],
  templateUrl: './grupo-producto.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrupoProductoComponent {
  private readonly store = inject(GruposStore);

  readonly activa = signal<PestanaId>('productos');

  readonly tabs = computed<readonly TabItem[]>(() => [
    {
      id: 'productos',
      etiqueta: 'Grupo Producto',
      icono: 'lucidePackage',
      contador: this.store.productosFiltrados().length,
    },
    {
      id: 'grupos',
      etiqueta: 'Grupos',
      icono: 'lucideBoxes',
      contador: this.store.gruposFiltrados().length,
    },
  ]);
}
