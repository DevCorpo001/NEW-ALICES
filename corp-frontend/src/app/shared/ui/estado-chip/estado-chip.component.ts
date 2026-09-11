import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Etiqueta de estado activo/inactivo; unifica el mismo distintivo en todas las tablas. */
@Component({
  selector: 'app-estado-chip',
  template: `
    <span
      class="inline-flex rounded-sm px-2 py-1 text-[11px] font-bold"
      [class.bg-success-light]="activo()"
      [class.text-success]="activo()"
      [class.bg-slate-100]="!activo()"
      [class.text-slate-500]="!activo()"
      [class.dark:bg-slate-800]="!activo()"
    >
      {{ activo() ? textoActivo() : textoInactivo() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoChipComponent {
  readonly activo = input.required<boolean>();
  readonly textoActivo = input('Activo');
  readonly textoInactivo = input('Inactivo');
}
