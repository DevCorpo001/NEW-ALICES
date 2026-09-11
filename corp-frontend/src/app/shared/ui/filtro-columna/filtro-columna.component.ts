import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFunnel, lucideX } from '@ng-icons/lucide';

/** Filtro de una columna de tabla: el embudo abre un cuadro para acotar solo esa columna. */
@Component({
  selector: 'app-filtro-columna',
  imports: [NgIcon, CdkOverlayOrigin, CdkConnectedOverlay],
  providers: [provideIcons({ lucideFunnel, lucideX })],
  templateUrl: './filtro-columna.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltroColumnaComponent {
  readonly columna = input.required<string>();
  readonly valor = model('');

  readonly abierto = signal(false);

  private readonly campo = viewChild<ElementRef<HTMLInputElement>>('campo');

  readonly activo = computed(() => this.valor().trim() !== '');

  readonly etiqueta = computed(
    () => `Filtrar por ${this.columna()}${this.activo() ? ` (aplicado: ${this.valor()})` : ''}`
  );

  abrir(): void {
    this.abierto.set(true);
    queueMicrotask(() => this.campo()?.nativeElement.focus());
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  alternar(): void {
    this.abierto() ? this.cerrar() : this.abrir();
  }

  escribir(event: Event): void {
    this.valor.set((event.target as HTMLInputElement).value);
  }

  limpiar(): void {
    this.valor.set('');
    this.cerrar();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'F2' || event.key === 'Enter') {
      event.preventDefault();
      this.cerrar();
    }
  }
}
