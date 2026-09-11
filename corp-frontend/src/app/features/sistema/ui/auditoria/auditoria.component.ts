import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEraser, lucideEye, lucideEyeOff, lucideFunnel } from '@ng-icons/lucide';
import { EnterNavigateDirective } from '../../../../shared/directives/enter-navigate.directive';
import { ClaveOcultaComponent } from '../../../../shared/ui/clave-oculta/clave-oculta.component';
import {
  RegistroAuditoria,
  TONOS_ACCION,
  TipoAccion,
  esCampoSensible,
} from '../../data-access/auditoria.models';
import { AuditoriaStore, CriterioAuditoria } from '../../data-access/auditoria.store';

/** Bitácora de movimientos del sistema, con filtros que se aplican a mano. */
@Component({
  selector: 'app-auditoria',
  imports: [NgIcon, DatePipe, EnterNavigateDirective, ClaveOcultaComponent],
  providers: [
    AuditoriaStore,
    provideIcons({ lucideEraser, lucideEye, lucideEyeOff, lucideFunnel }),
  ],
  templateUrl: './auditoria.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditoriaComponent {
  readonly store = inject(AuditoriaStore);

  tono(accion: TipoAccion): string {
    return TONOS_ACCION[accion];
  }

  esSensible(fila: RegistroAuditoria): boolean {
    return esCampoSensible(fila.campo);
  }

  cambiar(campo: keyof CriterioAuditoria, event: Event): void {
    const valor = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.store.cambiar(campo, valor as CriterioAuditoria[typeof campo]);
  }
}
