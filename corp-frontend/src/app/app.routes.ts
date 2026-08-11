import { Type } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { submoduleEntryGuard } from './core/guards/submodule-entry.guard';
import { authRoutes } from './features/auth/feature-auth.routes';
import { navItems } from './layout/shell/nav-items';

const comingSoon = () =>
  import('./shared/ui/coming-soon/coming-soon.component').then((m) => m.ComingSoonComponent);

type ComponentLoader = () => Promise<Type<unknown>>;

// Vista real por submódulo ('modulo/submodulo' -> componente lazy). El resto usa coming-soon.
const submoduleViews: Record<string, ComponentLoader> = {
  'almacenes/productos': () =>
    import('./features/almacenes/ui/productos/productos.component').then(
      (m) => m.ProductosComponent
    ),
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
