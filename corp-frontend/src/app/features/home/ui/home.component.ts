import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-screen bg-slate-950 p-6 text-slate-100 sm:p-10">
      <div class="mx-auto max-w-5xl">
        <div class="flex items-start justify-between gap-6">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">ALICES</p>
            <h1 class="mt-3 text-3xl font-semibold">Bienvenido, {{ auth.user()?.nombre }}</h1>
            <p class="mt-2 text-slate-400">Sesión iniciada como {{ auth.user()?.rolNombre }}.</p>
          </div>
          <button class="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-slate-500" (click)="logout()">
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  `
})
export class HomeComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => {
        this.auth.clearSession();
        void this.router.navigate(['/login']);
      }
    });
  }
}
