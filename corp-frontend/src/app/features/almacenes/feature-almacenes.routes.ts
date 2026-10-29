import { SubmoduleViews } from '@/core/routing/submodule-views';

/** Submódulos de Almacenes con vista; el resto cae en `coming-soon` sin declararse. */
export const almacenesViews: SubmoduleViews = {
  'almacenes/productos': () =>
    import('./ui/productos/productos.component').then((m) => m.ProductosComponent),
  'almacenes/almacen': () => import('./ui/almacen/almacen.component').then((m) => m.AlmacenComponent),
  'almacenes/tienda': () => import('./ui/tienda/tienda.component').then((m) => m.TiendaComponent),
  'almacenes/grupo-productos': () =>
    import('./ui/grupo-producto/grupo-producto.component').then((m) => m.GrupoProductoComponent),
};
