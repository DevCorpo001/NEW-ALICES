import { ChangeDetectionStrategy, Component, effect, input, output, signal, untracked } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideX } from '@ng-icons/lucide';
import { AppModalComponent } from '../../../../../shared/ui/modal/app-modal.component';
import { Grupo } from '../../../data-access/grupo/grupo.models';

/** Elige a qué grupo se mueven los productos marcados. */
@Component({
  selector: 'app-asignar-grupo-modal',
  imports: [NgIcon, AppModalComponent],
  providers: [provideIcons({ lucideCheck, lucideX })],
  templateUrl: './asignar-grupo-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsignarGrupoModalComponent {
  readonly abierto = input(false);
  readonly grupos = input.required<readonly Grupo[]>();
  readonly cantidad = input(0);

  readonly cerrar = output();
  readonly asignar = output<number>();

  readonly idGrupo = signal<number | null>(null);

  constructor() {
    effect(() => {
      const abierto = this.abierto();
      untracked(() => {
        if (abierto) {
          this.idGrupo.set(null);
        }
      });
    });
  }

  elegir(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.idGrupo.set(valor ? Number(valor) : null);
  }

  confirmar(): void {
    const id = this.idGrupo();
    if (id !== null) {
      this.asignar.emit(id);
    }
  }
}
