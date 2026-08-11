import { ChangeDetectionStrategy, Component, computed, HostListener, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

const COLLAPSE_STORAGE_KEY = 'alices-sidebar-collapsed';
const DESKTOP_QUERY = '(min-width: 1024px)';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent {
  readonly mobileOpen = signal(false);
  readonly collapsed = signal(this.readStoredCollapse());
  readonly isDesktop = signal(false);

  readonly sidebarWidth = computed(() => (this.isDesktop() && this.collapsed() ? '5rem' : '18rem'));
  readonly mainPadding = computed(() => (this.isDesktop() ? (this.collapsed() ? '5rem' : '18rem') : '0rem'));

  private readonly sidebar = viewChild(SidebarComponent);
  private readonly topbar = viewChild(TopbarComponent);

  private readonly desktopQuery = window.matchMedia(DESKTOP_QUERY);

  constructor() {
    this.isDesktop.set(this.desktopQuery.matches);
    this.desktopQuery.addEventListener('change', (event) => this.onMediaChange(event));
  }

  toggleMenu(): void {
    if (this.mobileOpen()) {
      this.closeMenu();
    } else {
      this.mobileOpen.set(true);
      queueMicrotask(() => this.sidebar()?.menuButton()?.nativeElement.focus());
    }
  }

  closeMenu(): void {
    if (this.mobileOpen()) {
      this.mobileOpen.set(false);
      this.focusMenuButton();
    }
  }

  onSidebarMenuClicked(): void {
    if (this.isDesktop()) {
      this.toggleCollapsed();
    } else {
      this.closeMenu();
    }
  }

  onExpandRequested(): void {
    if (this.collapsed()) {
      this.collapsed.set(false);
      this.persistCollapse();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  private toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
    this.persistCollapse();
  }

  private onMediaChange(event: MediaQueryListEvent): void {
    this.isDesktop.set(event.matches);
    if (event.matches) {
      this.mobileOpen.set(false);
    }
  }

  private persistCollapse(): void {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(this.collapsed()));
  }

  private readStoredCollapse(): boolean {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private focusMenuButton(): void {
    this.topbar()?.menuButton()?.nativeElement.focus();
  }
}
