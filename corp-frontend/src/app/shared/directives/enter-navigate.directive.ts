import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appEnterNavigate]'
})
export class EnterNavigateDirective implements AfterViewInit {
  @Input() appEnterNavigateFocus = true;

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  ngAfterViewInit(): void {
    if (this.appEnterNavigateFocus) {
      queueMicrotask(() => this.firstControl()?.focus());
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement) || target instanceof HTMLTextAreaElement) {
      return;
    }

    const controls = this.focusableControls();
    const currentIndex = controls.indexOf(target);
    if (currentIndex < 0) {
      return;
    }

    event.preventDefault();
    const nextControl = controls[currentIndex + 1];
    if (nextControl) {
      nextControl.focus();
      return;
    }

    const primary = this.elementRef.nativeElement.querySelector<HTMLElement>(
      '[appEnterPrimary], button[type="submit"]'
    );
    primary?.click();
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
