import { ChangeDetectionStrategy, Component, HostListener, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MarqueeComponent } from '../../shared/ui/marquee/marquee.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, MarqueeComponent],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent {
  readonly marqueeMessage = 'BIENVENIDO AL SISTEMA ALICE´S';

  readonly open = signal(false);

  private readonly sidebar = viewChild(SidebarComponent);
  private readonly topbar = viewChild(TopbarComponent);

  toggleMenu(): void {
    if (this.open()) {
      this.closeMenu();
    } else {
      this.open.set(true);
      queueMicrotask(() => this.sidebar()?.menuButton()?.nativeElement.focus());
    }
  }

  closeMenu(): void {
    if (this.open()) {
      this.open.set(false);
      this.focusMenuButton();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  private focusMenuButton(): void {
    this.topbar()?.menuButton()?.nativeElement.focus();
  }
}
