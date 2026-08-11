import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { authRoutes } from './features/auth/feature-auth.routes';
import { navItems } from './layout/shell/nav-items';

const comingSoon = () => import('./shared/ui/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent);

const moduleRoutes: Routes = navItems
  .filter((item) => item.route && item.route !== '/')
  .map((item) => {
    const path = item.route!.slice(1);
    if (!item.children?.length) {
      return { path, loadComponent: comingSoon, data: { titulo: item.label } };
    }
    return {
      path,
      children: [
        { path: '', loadComponent: comingSoon, data: { titulo: item.label } },
        ...item.children.map((sub) => ({
          path: sub.route!.slice(path.length + 1),
          loadComponent: comingSoon,
          data: { titulo: sub.label }
        }))
      ]
    };
  });

export const routes: Routes = [
  ...authRoutes,
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/ui/home.component').then((m) => m.HomeComponent),
        data: { titulo: 'Inicio' }
      },
      ...moduleRoutes
    ]
  },
  { path: '**', redirectTo: '' }
];
