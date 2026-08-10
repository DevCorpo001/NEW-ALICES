import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { authRoutes } from './features/auth/feature-auth.routes';

export const routes: Routes = [
  ...authRoutes,
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/ui/home.component').then((m) => m.HomeComponent)
  },
  { path: '**', redirectTo: '' }
];
