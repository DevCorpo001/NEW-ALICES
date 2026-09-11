import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/** Clave en claro con interruptor de visibilidad; cada fila decide la suya. */
@Component({
  selector: 'app-clave-oculta',
  imports: [NgIcon],
  template: `
    <div class="flex items-center gap-2">
      @if (visible()) {
        <span class="font-mono text-sm text-slate-700 dark:text-slate-200">{{ clave() }}</span>
      } @else {
        <span class="text-base tracking-[0.2em] text-slate-400" aria-hidden="true">••••••••</span>
        <span class="sr-only">Clave oculta</span>
      }
      <button
        type="button"
        (click)="alternar()"
        [attr.aria-pressed]="visible()"
        [attr.aria-label]="textoBoton()"
        [title]="textoBoton()"
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
      >
        <ng-icon [name]="visible() ? 'lucideEyeOff' : 'lucideEye'" size="0.9rem" />
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClaveOcultaComponent {
  readonly clave = input.required<string>();
  /** A quién pertenece la clave; se usa para nombrar el botón. */
  readonly de = input('');

  readonly visible = signal(false);

  readonly textoBoton = computed(
    () => `${this.visible() ? 'Ocultar' : 'Ver'} clave${this.de() ? ' de ' + this.de() : ''}`
  );

  alternar(): void {
    this.visible.update((actual) => !actual);
  }
}
