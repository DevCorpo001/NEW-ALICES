import { Routes } from '@angular/router';
import { moduleRoutes } from './app.routes';
import { navItems } from './layout/shell/nav-items';

function collectSegments(routes: Routes): string[] {
  const out: string[] = [];
  for (const route of routes) {
    if (route.path && route.path !== '') {
      out.push(route.path);
    }
    for (const child of route.children ?? []) {
      if (child.path && child.path !== '') {
        out.push(child.path);
      }
    }
  }
  return out;
}

describe('moduleRoutes', () => {
  it('no genera paths que empiecen con /', () => {
    for (const path of collectSegments(moduleRoutes)) {
      expect(path.startsWith('/')).toBe(false);
      expect(path).not.toContain('//');
    }
  });

  it('cubre todos los módulos y submódulos de navItems', () => {
    const segments = collectSegments(moduleRoutes);
    const expected = navItems
      .filter((item) => item.route && item.route !== '/')
      .flatMap((item) => [
        item.route!.slice(1),
        ...(item.children ?? []).map((sub) => sub.route!.split('/').pop()!)
      ]);

    for (const segment of expected) {
      expect(segments).toContain(segment);
    }
  });
});
