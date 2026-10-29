import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalculator,
  lucideChevronDown,
  lucideHouse,
  lucideMenu,
  lucidePackage,
  lucideSettings,
  lucideShoppingCart,
  lucideTruck,
  lucideWarehouse,
} from '@ng-icons/lucide';
import { filter } from 'rxjs';
import { NavItem, navItems } from '../shell/nav-items';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIcon],
  providers: [
    provideIcons({
      lucideCalculator,
      lucideChevronDown,
      lucideHouse,
      lucideMenu,
      lucidePackage,
      lucideSettings,
      lucideShoppingCart,
      lucideTruck,
      lucideWarehouse,
    }),
  ],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly isOpen = input(false);
  readonly closed = output();

  readonly navItems = navItems;
  readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');

  readonly activeUrl = signal('');
  readonly expandedModules = signal<string[]>([]);

  private readonly router = inject(Router);

  constructor() {
    this.syncFromUrl();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.syncFromUrl());
  }

  isActive(item: NavItem): boolean {
    if (!item.route) {
      return false;
    }
    if (item.exact) {
      return this.activeUrl() === item.route;
    }
    return this.activeUrl().startsWith(item.route);
  }

  isExpanded(route: string): boolean {
    return this.expandedModules().includes(route);
  }

  onModuleClick(route: string): void {
    this.expandedModules.update((list) =>
      list.includes(route)
        ? list.filter((entry) => entry !== route)
        : [...list, route],
    );
  }

  private syncFromUrl(): void {
    this.activeUrl.set(this.router.url);
    this.expandedModules.update((list) => {
      const matched = navItems
        .filter(
          (item) =>
            item.route && item.children?.length && this.router.url.startsWith(item.route),
        )
        .map((item) => item.route as string);
      return Array.from(new Set([...list, ...matched]));
    });
  }
}
