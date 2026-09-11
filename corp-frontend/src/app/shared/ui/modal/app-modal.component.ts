import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { ScrollBlockService } from '../../services/scroll-block.service';

@Component({
  selector: 'app-modal',
  imports: [NgIcon],
  providers: [provideIcons({ lucideX })],
  templateUrl: './app-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppModalComponent {
  readonly abierto = input(false);
  readonly titulo = input('');
  readonly hintF2 = input(false);
  readonly ancho = input<'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'>('lg');
  readonly usuario = input('');
  readonly cerrar = output();

  readonly anchoClass = computed(() => {
    switch (this.ancho()) {
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case '3xl':
        return 'max-w-3xl';
      case '4xl':
        return 'max-w-4xl';
      case '5xl':
        return 'max-w-5xl';
      default:
        return 'max-w-lg';
    }
  });

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly scrollBlock = inject(ScrollBlockService);
  private trigger?: HTMLElement;
  private scrollBloqueado = false;

  constructor() {
    effect(() => {
      if (this.abierto()) {
        this.bloquearScroll();
        this.trigger = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
        queueMicrotask(() => this.firstControl()?.focus());
      } else {
        this.liberarScroll();
        this.trigger?.focus();
        this.trigger = undefined;
      }
    });

    // Si el modal se destruye abierto (cambio de ruta, `@if` del padre) el scroll quedaría congelado.
    inject(DestroyRef).onDestroy(() => this.liberarScroll());
  }

  private bloquearScroll(): void {
    if (this.scrollBloqueado) {
      return;
    }
    this.scrollBloqueado = true;
    this.scrollBlock.bloquear();
  }

  private liberarScroll(): void {
    if (!this.scrollBloqueado) {
      return;
    }
    this.scrollBloqueado = false;
    this.scrollBlock.liberar();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.abierto()) {
      return;
    }
    if (event.key === 'F2' || event.key === 'Escape') {
      event.preventDefault();
      this.cerrar.emit();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const focusables = this.focusableControls();
    if (focusables.length === 0) {
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    if (!active || !focusables.includes(active)) {
      event.preventDefault();
      first.focus();
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private firstControl(): HTMLElement | undefined {
    return this.focusableControls()[0];
  }

  private focusableControls(): HTMLElement[] {
    return Array.from(
      this.elementRef.nativeElement.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), select, button, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null);
  }
}
