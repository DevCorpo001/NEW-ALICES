import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideKeyRound, lucideQrCode } from '@ng-icons/lucide';
import { TabItem, TabsComponent } from '@/shared/ui/tabs/tabs.component';
import { PermisosStore } from '../../data-access/permisos.store';
import { ClavesQrTabComponent } from './qr/claves-qr-tab.component';
import { ClavesTabComponent } from './claves/claves-tab.component';

type PestanaId = 'claves' | 'qr';

/** Permisos: claves de autorización y claves QR por rol. */
@Component({
  selector: 'app-permisos',
  imports: [TabsComponent, ClavesTabComponent, ClavesQrTabComponent],
  providers: [PermisosStore, provideIcons({ lucideKeyRound, lucideQrCode })],
  templateUrl: './permisos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermisosComponent {
  private readonly store = inject(PermisosStore);

  readonly activa = signal<PestanaId>('claves');

  readonly tabs = computed<readonly TabItem[]>(() => [
    {
      id: 'claves',
      etiqueta: 'Permisos',
      icono: 'lucideKeyRound',
      contador: this.store.claves().length,
    },
    {
      id: 'qr',
      etiqueta: 'Claves QR',
      icono: 'lucideQrCode',
      contador: this.store.clavesQr().length,
    },
  ]);
}
