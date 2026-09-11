import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AppModalComponent } from '../../../../../shared/ui/modal/app-modal.component';
import { Grupo, ProductoAgrupable } from '../../../data-access/grupo/grupo.models';

/** Qué productos tiene un grupo; solo consulta. */
@Component({
  selector: 'app-productos-grupo-modal',
  imports: [DecimalPipe, AppModalComponent],
  templateUrl: './productos-grupo-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosGrupoModalComponent {
  readonly abierto = input(false);
  readonly grupo = input<Grupo | null>(null);
  readonly productos = input.required<readonly ProductoAgrupable[]>();

  readonly cerrar = output();
}
