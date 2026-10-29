import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowLeftRight, lucidePrinter } from '@ng-icons/lucide';
import { BotonAccionComponent } from '@/shared/ui/boton-accion/boton-accion.component';
import { EstadoChipComponent } from '@/shared/ui/estado-chip/estado-chip.component';
import { ClaveQr } from '../../../data-access/permisos.models';
import { PermisosStore } from '../../../data-access/permisos.store';

/** Claves QR por rol; se imprimen para escanearlas en caja. */
@Component({
  selector: 'app-claves-qr-tab',
  imports: [EstadoChipComponent, BotonAccionComponent],
  providers: [provideIcons({ lucideArrowLeftRight, lucidePrinter })],
  templateUrl: './claves-qr-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClavesQrTabComponent {
  readonly store = inject(PermisosStore);

  // TODO(backend): falta el endpoint de impresión del QR.
  imprimir(_clave: ClaveQr): void {}
}
