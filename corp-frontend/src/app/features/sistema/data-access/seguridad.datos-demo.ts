import { Rol, Usuario } from './seguridad.models';

// TODO(backend): datos de muestra hasta que existan los SPs de usuarios y roles.
export const ROLES_DEMO: readonly Rol[] = [
  { idRol: 1, codigo: 'ADM', nombre: 'ADMINISTRADOR', descripcion: 'Acceso total al sistema', usuarios: 3, permisos: 42, totalPermisos: 42, estado: 'A' },
  { idRol: 2, codigo: 'SUP', nombre: 'SUPERVISOR', descripcion: 'Supervisión de tienda y caja', usuarios: 2, permisos: 28, totalPermisos: 42, estado: 'A' },
  { idRol: 3, codigo: 'VEN', nombre: 'VENDEDOR', descripcion: 'Ventas y consulta de productos', usuarios: 4, permisos: 12, totalPermisos: 42, estado: 'A' },
  { idRol: 4, codigo: 'CAJ', nombre: 'CAJERO', descripcion: 'Operación de caja', usuarios: 2, permisos: 9, totalPermisos: 42, estado: 'A' },
  { idRol: 5, codigo: 'ALM', nombre: 'ALMACENERO', descripcion: 'Ingresos, traslados y stock', usuarios: 2, permisos: 15, totalPermisos: 42, estado: 'A' },
  { idRol: 6, codigo: 'DES', nombre: 'DESPACHO', descripcion: 'Facturación y control de envíos', usuarios: 1, permisos: 11, totalPermisos: 42, estado: 'A' },
  { idRol: 7, codigo: 'AUD', nombre: 'AUDITOR', descripcion: 'Solo lectura de reportes', usuarios: 1, permisos: 7, totalPermisos: 42, estado: 'A' },
  { idRol: 8, codigo: 'TMP', nombre: 'TEMPORAL', descripcion: 'Rol en definición, sin accesos', usuarios: 0, permisos: 0, totalPermisos: 42, estado: 'I' },
  { idRol: 9, codigo: 'PRA', nombre: 'PRACTICANTE', descripcion: 'Pendiente de asignar permisos', usuarios: 1, permisos: 0, totalPermisos: 42, estado: 'A' },
];

export const USUARIOS_DEMO: readonly Usuario[] = [
  { idUsuario: 1, usuario: 'VENTA', clave: 'venta2026', descripcion: 'venta presencial mostrador', idRol: 3, rol: 'VENDEDOR', estado: 'A', maxSesiones: null },
  { idUsuario: 2, usuario: 'EDWIN', clave: 'edwin.2026', descripcion: 'EDWIN GARCIA', idRol: 1, rol: 'ADMINISTRADOR', estado: 'A', maxSesiones: 2 },
  { idUsuario: 3, usuario: 'ADMIN', clave: 'admin123', descripcion: 'CARLOS MENDOZA RÍOS', idRol: 1, rol: 'ADMINISTRADOR', estado: 'A', maxSesiones: 1 },
  { idUsuario: 4, usuario: 'JPEREZ', clave: 'jp2026*', descripcion: 'JUANA PÉREZ SALAZAR', idRol: 2, rol: 'SUPERVISOR', estado: 'A', maxSesiones: 3 },
  { idUsuario: 5, usuario: 'LMAMANI', clave: 'lm.quispe', descripcion: 'LUIS MAMANI QUISPE', idRol: 3, rol: 'VENDEDOR', estado: 'A', maxSesiones: null },
  { idUsuario: 6, usuario: 'RTORRES', clave: 'rosa2026', descripcion: 'ROSA TORRES VEGA', idRol: 4, rol: 'CAJERO', estado: 'A', maxSesiones: 1 },
  { idUsuario: 7, usuario: 'MCHAVEZ', clave: 'mch2026', descripcion: 'MIGUEL CHÁVEZ LEÓN', idRol: 5, rol: 'ALMACENERO', estado: 'A', maxSesiones: 2 },
  { idUsuario: 8, usuario: 'PDIAZ', clave: 'patty.01', descripcion: 'PATRICIA DÍAZ ROJAS', idRol: 3, rol: 'VENDEDOR', estado: 'I', maxSesiones: null },
  { idUsuario: 9, usuario: 'AVARGAS', clave: 'andres99', descripcion: 'ANDRÉS VARGAS SOTO', idRol: 6, rol: 'DESPACHO', estado: 'A', maxSesiones: 1 },
  { idUsuario: 10, usuario: 'NCONDORI', clave: 'norma.c', descripcion: 'NORMA CONDORI ALCA', idRol: 7, rol: 'AUDITOR', estado: 'A', maxSesiones: 1 },
  { idUsuario: 11, usuario: 'FQUISPE', clave: 'felipe22', descripcion: 'FELIPE QUISPE HUAMÁN', idRol: 3, rol: 'VENDEDOR', estado: 'I', maxSesiones: null },
  { idUsuario: 12, usuario: 'SGOMEZ', clave: 'sandra_g', descripcion: 'SANDRA GÓMEZ PAREDES', idRol: 4, rol: 'CAJERO', estado: 'A', maxSesiones: 2 },
  { idUsuario: 13, usuario: 'ECASTRO', clave: 'elena.cn', descripcion: 'ELENA CASTRO NÚÑEZ', idRol: 2, rol: 'SUPERVISOR', estado: 'A', maxSesiones: 3 },
  { idUsuario: 14, usuario: 'DSALAS', clave: 'diego.pr', descripcion: 'DIEGO SALAS ORTIZ', idRol: 9, rol: 'PRACTICANTE', estado: 'A', maxSesiones: 1 },
  { idUsuario: 15, usuario: 'ALMACEN', clave: 'alm2026', descripcion: 'almacén central turno noche', idRol: 5, rol: 'ALMACENERO', estado: 'A', maxSesiones: null },
  { idUsuario: 16, usuario: 'CAJA02', clave: 'caja02*', descripcion: 'caja rápida mostrador 2', idRol: 4, rol: 'CAJERO', estado: 'I', maxSesiones: 1 },
];
