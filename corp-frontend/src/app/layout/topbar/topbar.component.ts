import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideLogOut, lucideMenu, lucideMoon, lucideSun } from '@ng-icons/lucide';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  // El sticky va en el host: dentro, su caja no tiene holgura para desplazarse.
  host: { class: 'sticky top-0 z-30 block' },
  imports: [NgIcon],
  providers: [provideIcons({ lucideBell, lucideLogOut, lucideMenu, lucideMoon, lucideSun })],
  templateUrl: './topbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopbarComponent {
  readonly menuToggled = output();
  readonly menuExpanded = input(false);
  readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');

  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly pageTitle = signal('');

  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.updateTitle());
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => {
        this.auth.clearSession();
        void this.router.navigate(['/login']);
      }
    });
  }

  private updateTitle(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.pageTitle.set(route.data['titulo'] ?? '');
  }
}
