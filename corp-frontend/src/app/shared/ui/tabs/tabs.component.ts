import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

export interface TabItem {
  readonly id: string;
  readonly etiqueta: string;
  /** Nombre de icono ng-icons; el consumidor lo registra con `provideIcons`. */
  readonly icono?: string;
  /** Se pinta a la derecha de la etiqueta; útil para el número de filas. */
  readonly contador?: number;
}

/** Cabecera de pestañas con roving tabindex; el contenido lo pinta el consumidor. */
@Component({
  selector: 'app-tabs',
  imports: [NgIcon],
  templateUrl: './tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent {
  readonly tabs = input.required<readonly TabItem[]>();
  readonly activo = model.required<string>();

  readonly indiceActivo = computed(() =>
    Math.max(
      0,
      this.tabs().findIndex((tab) => tab.id === this.activo())
    )
  );

  seleccionar(id: string): void {
    this.activo.set(id);
  }

  onKeydown(event: KeyboardEvent): void {
    const salto = SALTOS[event.key];
    if (!salto) {
      return;
    }

    event.preventDefault();
    const tabs = this.tabs();
    const destino = salto(this.indiceActivo(), tabs.length);
    this.activo.set(tabs[destino].id);

    // El foco sigue a la selección: es lo que espera un tablist con teclado.
    const boton = document.getElementById(this.idTab(tabs[destino].id));
    boton?.focus();
  }

  idTab(id: string): string {
    return `tab-${id}`;
  }

  idPanel(id: string): string {
    return `panel-${id}`;
  }
}

const SALTOS: Record<string, ((indice: number, total: number) => number) | undefined> = {
  ArrowRight: (indice, total) => (indice + 1) % total,
  ArrowLeft: (indice, total) => (indice - 1 + total) % total,
  Home: () => 0,
  End: (_indice, total) => total - 1,
};
