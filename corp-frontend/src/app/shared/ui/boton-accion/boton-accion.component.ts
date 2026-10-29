import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/** Tono del botón; `peligro` y `exito` se reservan para activar/desactivar. */
export type TonoAccion = 'neutro' | 'peligro' | 'exito';

const TONOS: Record<TonoAccion, string> = {
  neutro:
    'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
  peligro: 'bg-primary-light text-primary hover:bg-primary hover:text-white',
  exito: 'bg-success-light text-success hover:bg-success hover:text-white',
};

/** Botón cuadrado de icono para la columna de acciones de una tabla. */
@Component({
  selector: 'app-boton-accion',
  imports: [NgIcon],
  template: `
    <button
      type="button"
      (click)="accion.emit()"
      [attr.aria-label]="etiqueta()"
      [title]="etiqueta()"
      class="flex h-8 w-8 items-center justify-center rounded-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary {{ clases() }}"
    >
      <ng-icon [name]="icono()" size="0.95rem" />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BotonAccionComponent {
  readonly icono = input.required<string>();
  /** Texto para lectores de pantalla y tooltip; siempre en infinitivo con su objeto. */
  readonly etiqueta = input.required<string>();
  readonly tono = input<TonoAccion>('neutro');
  readonly accion = output();

  readonly clases = computed(() => TONOS[this.tono()]);
}
