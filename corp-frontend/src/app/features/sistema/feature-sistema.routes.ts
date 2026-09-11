import { SubmoduleViews } from '../../core/routing/submodule-views';

/** Submódulos de Sistema con vista; el resto cae en `coming-soon` sin declararse. */
export const sistemaViews: SubmoduleViews = {
  'sistema/usuarios-rol': () =>
    import('./ui/usuarios-rol/usuarios-rol.component').then((m) => m.UsuariosRolComponent),
  'sistema/vendedor-caja': () =>
    import('./ui/perfiles/perfiles.component').then((m) => m.PerfilesComponent),
  'sistema/permisos': () =>
    import('./ui/permisos/permisos.component').then((m) => m.PermisosComponent),
  'sistema/mensajes': () =>
    import('./ui/mensajes/mensajes.component').then((m) => m.MensajesComponent),
  'sistema/conductor': () =>
    import('./ui/conductores/conductores.component').then((m) => m.ConductoresComponent),
  'sistema/cliente': () =>
    import('./ui/clientes/clientes.component').then((m) => m.ClientesComponent),
  'sistema/notificaciones': () =>
    import('./ui/notificaciones/notificaciones.component').then((m) => m.NotificacionesComponent),
  'sistema/auditoria': () =>
    import('./ui/auditoria/auditoria.component').then((m) => m.AuditoriaComponent),
};
