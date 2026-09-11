import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEraser, lucideEye, lucideSquarePen, lucideTrash2 } from '@ng-icons/lucide';
import { EnterNavigateDirective } from '../../../../../shared/directives/enter-navigate.directive';
import { ConfirmService } from '../../../../../shared/services/confirm.service';
import { BotonAccionComponent } from '../../../../../shared/ui/boton-accion/boton-accion.component';
import { Grupo } from '../../../data-access/grupo/grupo.models';
import { GruposStore } from '../../../data-access/grupo/grupos.store';
import { ProductosGrupoModalComponent } from '../modals/productos-grupo-modal.component';

/** Pestaña de mantenimiento de grupos. */
@Component({
  selector: 'app-grupos-tab',
  imports: [
    NgIcon,
    EnterNavigateDirective,
    BotonAccionComponent,
    ProductosGrupoModalComponent,
  ],
  providers: [provideIcons({ lucideEraser, lucideEye, lucideSquarePen, lucideTrash2 })],
  templateUrl: './grupos-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GruposTabComponent {
  readonly store = inject(GruposStore);
  private readonly dialogos = inject(ConfirmService);

  readonly verGrupo = signal<Grupo | null>(null);

  readonly productosDelGrupo = computed(() => {
    const grupo = this.verGrupo();
    return grupo ? this.store.productosDe(grupo.idGrupo) : [];
  });

  cambiarNombre(event: Event): void {
    this.store.nombre.set((event.target as HTMLInputElement).value);
  }

  cambiarCodigo(event: Event): void {
    this.store.codigo.set((event.target as HTMLInputElement).value);
  }

  cambiarAbreviacion(event: Event): void {
    this.store.abreviacion.set((event.target as HTMLInputElement).value);
  }

  cambiarCanal(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.store.idCanalGrupo.set(valor ? Number(valor) : null);
  }

  cambiarSoloConProductos(event: Event): void {
    this.store.soloConProductos.set((event.target as HTMLInputElement).checked);
  }

  async eliminar(grupo: Grupo): Promise<void> {
    const aviso =
      grupo.productos > 0
        ? `El grupo ${grupo.nombre} tiene ${grupo.productos} productos, que quedarán sin grupo.`
        : `Se eliminará el grupo ${grupo.nombre}.`;

    if (await this.dialogos.confirm(aviso, 'Eliminar', 'Cancelar', 'warning')) {
      this.store.eliminarGrupo(grupo.idGrupo);
    }
  }

  // TODO(backend): falta el endpoint de edición de grupo.
  editar(_grupo: Grupo): void {}
}
