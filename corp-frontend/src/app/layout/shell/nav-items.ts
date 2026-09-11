export interface NavItem {
  label: string;
  route?: string;
  icon?: string;
  exact?: boolean;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  { label: 'Inicio', route: '/', icon: 'lucideHouse', exact: true },
  {
    label: 'Ventas',
    route: '/ventas',
    icon: 'lucideShoppingCart',
    children: [
      { label: 'Crear Nuevo', route: '/ventas/crear-nuevo' },
      { label: 'Anulaciones Derivadas', route: '/ventas/anulaciones-derivadas' },
      { label: 'Impresión de Pedidos', route: '/ventas/impresion-pedidos' },
      { label: 'Búsqueda de Producto', route: '/ventas/busqueda-producto' }
    ]
  },
  { label: 'Compras', route: '/compras', icon: 'lucidePackage' },
  {
    label: 'Sistema',
    route: '/sistema',
    icon: 'lucideSettings',
    children: [
      { label: 'Mensajes', route: '/sistema/mensajes' },
      { label: 'Notificaciones', route: '/sistema/notificaciones' },
      { label: 'Perfiles', route: '/sistema/vendedor-caja' },
      { label: 'Permisos', route: '/sistema/permisos' },
      { label: 'Usuarios / Roles', route: '/sistema/usuarios-rol' },
      { label: 'Clave Sesión', route: '/sistema/clave-sesion' },
      { label: 'Conductor y Vehículos', route: '/sistema/conductor' },
      { label: 'Clientes', route: '/sistema/cliente' },
      { label: 'Auditoría', route: '/sistema/auditoria' }
    ]
  },
  {
    label: 'Almacenes',
    route: '/almacenes',
    icon: 'lucideWarehouse',
    children: [
      { label: 'Guías Remisión', route: '/almacenes/guias-remision' },
      { label: 'Productos', route: '/almacenes/productos' },
      { label: 'Grupo Productos', route: '/almacenes/grupo-productos' },
      { label: 'Almacén', route: '/almacenes/almacen' },
      { label: 'Tienda', route: '/almacenes/tienda' },
      { label: 'Empresa', route: '/almacenes/empresa' },
      { label: 'Tienda y Almacén', route: '/almacenes/tienda-almacen' },
      { label: 'Lista de Precios', route: '/almacenes/lista-precios' },
      { label: 'Actualizar Producto', route: '/almacenes/actualizar-producto' },
      { label: 'Transportistas', route: '/almacenes/transportistas' },
      { label: 'Producto por Grupo', route: '/almacenes/producto-por-grupo' },
      { label: 'Factura Compras', route: '/almacenes/factura-compras' },
      { label: 'Almacenados', route: '/almacenes/almacenados' },
      { label: 'Proveedores', route: '/almacenes/proveedores' },
      { label: 'Guías Internas', route: '/almacenes/guias-internas' },
      { label: 'Historial de Precios', route: '/almacenes/historial-precios' },
      { label: 'Ingreso de Stock', route: '/almacenes/ingreso-stock' },
      { label: 'Listado de Órdenes Recepción', route: '/almacenes/ordenes-recepcion' },
      { label: 'Listado de Almacenes', route: '/almacenes/lista-almacenes' },
      { label: 'Traslado Interno de Mercadería', route: '/almacenes/traslado-interno-mercaderia' },
      { label: 'Recepción Interno de Mercadería', route: '/almacenes/recepcion-interno-mercaderia' },
      { label: 'Corrección de Stock', route: '/almacenes/correccion-stock' }
    ]
  },
  {
    label: 'Despacho',
    route: '/despacho',
    icon: 'lucideTruck',
    children: [
      { label: 'Facturar', route: '/despacho/facturar' },
      { label: 'Comprobantes Emitidos', route: '/despacho/comprobantes-emitidos' },
      { label: 'Anulación', route: '/despacho/anulacion' },
      { label: 'Pedidos Cobrados', route: '/despacho/pedidos-cobrados' },
      { label: 'Validación', route: '/despacho/validacion' },
      { label: 'Control de Embalaje', route: '/despacho/control-embalaje' },
      { label: 'Pedidos por Enviar', route: '/despacho/pedidos-por-enviar' },
      { label: 'Resumen de Envíos', route: '/despacho/resumen-envios' }
    ]
  },
  {
    label: 'Caja',
    route: '/caja',
    icon: 'lucideCalculator',
    children: [
      { label: 'Caja', route: '/caja/caja' },
      { label: 'Resumen Caja', route: '/caja/resumen-caja' },
      { label: 'Resumen Caja General', route: '/caja/resumen-caja-general' },
      { label: 'Resumen por Empresa', route: '/caja/resumen-empresa' },
      { label: 'Devoluciones Pendientes', route: '/caja/devoluciones-pendientes' },
      { label: 'Caja Rápida', route: '/caja/caja-rapida' }
    ]
  }
];
