import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideColumns3 } from '@ng-icons/lucide';

export interface ColumnaFiltrable {
  readonly campo: string;
  readonly titulo: string;
}

/** Selector de columnas visibles de una tabla; se listan las **ocultas**, así el estado inicial es "todas". */
@Component({
  selector: 'app-columnas-visibles',
  imports: [NgIcon, CdkOverlayOrigin, CdkConnectedOverlay],
  providers: [provideIcons({ lucideCheck, lucideColumns3 })],
  templateUrl: './columnas-visibles.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnasVisiblesComponent {
  readonly columnas = input.required<readonly ColumnaFiltrable[]>();
  readonly ocultas = model<readonly string[]>([]);
  readonly etiqueta = input('Columnas');

  readonly abierto = signal(false);

  readonly visibles = computed(() => this.columnas().length - this.ocultas().length);
  readonly todasVisibles = computed(() => this.ocultas().length === 0);

  esVisible(campo: string): boolean {
    return !this.ocultas().includes(campo);
  }

  alternar(campo: string): void {
    const ocultas = this.ocultas();
    // No se permite ocultar la última: una tabla sin columnas no dice nada.
    if (!ocultas.includes(campo) && this.visibles() === 1) {
      return;
    }
    this.ocultas.set(
      ocultas.includes(campo) ? ocultas.filter((c) => c !== campo) : [...ocultas, campo]
    );
  }

  mostrarTodas(): void {
    this.ocultas.set([]);
  }

  abrir(): void {
    this.abierto.set(true);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  onKeydownPanel(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'F2') {
      event.preventDefault();
      this.cerrar();
    }
  }
}
