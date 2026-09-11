import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeftRight,
  lucideEye,
  lucideEyeOff,
  lucidePlus,
  lucidePrinter,
  lucideSquarePen,
} from '@ng-icons/lucide';
import { BotonAccionComponent } from '../../../../../shared/ui/boton-accion/boton-accion.component';
import { ClaveOcultaComponent } from '../../../../../shared/ui/clave-oculta/clave-oculta.component';
import { EstadoChipComponent } from '../../../../../shared/ui/estado-chip/estado-chip.component';
import { ClaveAutorizacion } from '../../../data-access/permisos.models';
import { PermisosStore } from '../../../data-access/permisos.store';

/** Claves de autorización: las que teclea un supervisor para desbloquear una operación. */
@Component({
  selector: 'app-claves-tab',
  imports: [NgIcon, EstadoChipComponent, BotonAccionComponent, ClaveOcultaComponent],
  providers: [
    provideIcons({
      lucideArrowLeftRight,
      lucideEye,
      lucideEyeOff,
      lucidePlus,
      lucidePrinter,
      lucideSquarePen,
    }),
  ],
  templateUrl: './claves-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClavesTabComponent {
  readonly store = inject(PermisosStore);

  // TODO(backend): faltan los endpoints de alta, edición e impresión.
  agregar(): void {}

  editar(_clave: ClaveAutorizacion): void {}

  imprimir(_clave: ClaveAutorizacion): void {}
}
