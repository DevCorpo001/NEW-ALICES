import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { submoduleEntryGuard } from './core/routing/submodule-entry.guard';
import { SubmoduleViews } from './core/routing/submodule-views';
import { almacenesViews } from './features/almacenes/feature-almacenes.routes';
import { sistemaViews } from './features/sistema/feature-sistema.routes';
import { authRoutes } from './features/auth/feature-auth.routes';
import { navItems } from './layout/shell/nav-items';

const comingSoon = () =>
  import('./shared/ui/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent);

// Registro de vistas reales; cada feature aporta las suyas.
const submoduleViews: SubmoduleViews = {
  ...almacenesViews,
  ...sistemaViews,
};

export const moduleRoutes: Routes = navItems
  .filter((item) => item.route && item.route !== '/')
  .map((item) => {
    const path = item.route!.slice(1);
    if (!item.children?.length) {
      return {
        path,
        loadComponent: comingSoon,
        data: { titulo: item.label },
        canActivate: [submoduleEntryGuard],
      };
    }
    return {
      path,
      children: [
        {
          path: '',
          loadComponent: comingSoon,
          data: { titulo: item.label },
        },
        ...item.children.map((sub) => {
          const subPath = sub.route!.split('/').slice(2).join('/');
          return {
            path: subPath,
            loadComponent: submoduleViews[`${path}/${subPath}`] ?? comingSoon,
            data: { titulo: sub.label },
            canActivate: [submoduleEntryGuard],
          };
        }),
      ],
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
