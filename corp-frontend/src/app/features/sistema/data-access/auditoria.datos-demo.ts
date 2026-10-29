import { RegistroAuditoria } from './auditoria.models';

// TODO(backend): datos de muestra hasta que exista el SP de auditoría.
export const AUDITORIA_DEMO: readonly RegistroAuditoria[] = [
  { idAuditoria: 1, fechaHora: '2026-08-30T05:31:00', usuario: 'DESARROLLO', modulo: 'USUARIOS/ROL', accion: 'VISUALIZACION_CLAVE', registroAfectado: 'PRUEBA123', campo: 'CLAVE', valorAnterior: 'prb123456', valorNuevo: 'prb123456' },
  { idAuditoria: 2, fechaHora: '2026-08-30T04:10:00', usuario: 'ADMIN', modulo: 'USUARIOS/ROL', accion: 'ACTUALIZACION', registroAfectado: 'JPEREZ', campo: 'ESTADO', valorAnterior: 'A', valorNuevo: 'I' },
  { idAuditoria: 3, fechaHora: '2026-08-29T19:48:00', usuario: 'ADMIN', modulo: 'PERMISOS', accion: 'ACTUALIZACION', registroAfectado: 'CLAVE VENTA', campo: 'ESTADO', valorAnterior: 'I', valorNuevo: 'A' },
  { idAuditoria: 4, fechaHora: '2026-08-29T18:05:00', usuario: 'EDWIN', modulo: 'PRODUCTOS', accion: 'ACTUALIZACION', registroAfectado: 'PR-00841', campo: 'PRECIO_UNITARIO', valorAnterior: '18.50', valorNuevo: '20.90' },
  { idAuditoria: 5, fechaHora: '2026-08-29T17:22:00', usuario: 'EDWIN', modulo: 'PRODUCTOS', accion: 'CREACION', registroAfectado: 'PR-00912', campo: 'ALTA', valorAnterior: null, valorNuevo: 'CERA AGIVA 155 GR' },
  { idAuditoria: 6, fechaHora: '2026-08-29T16:40:00', usuario: 'JPEREZ', modulo: 'CLIENTES', accion: 'CREACION', registroAfectado: '20512345678', campo: 'ALTA', valorAnterior: null, valorNuevo: 'DISTRIBUIDORA ANDINA SAC' },
  { idAuditoria: 7, fechaHora: '2026-08-29T15:12:00', usuario: 'MCHAVEZ', modulo: 'CONDUCTORES', accion: 'ELIMINACION', registroAfectado: 'BLK933', campo: 'BAJA', valorAnterior: 'PEUGEOT- PARTNER', valorNuevo: null },
  { idAuditoria: 8, fechaHora: '2026-08-29T09:02:00', usuario: 'ADMIN', modulo: 'ACCESO', accion: 'INICIO_SESION', registroAfectado: 'ADMIN', campo: 'IP', valorAnterior: null, valorNuevo: '192.168.1.24' },
  { idAuditoria: 9, fechaHora: '2026-08-28T20:31:00', usuario: 'RTORRES', modulo: 'ACCESO', accion: 'INICIO_SESION', registroAfectado: 'RTORRES', campo: 'IP', valorAnterior: null, valorNuevo: '192.168.1.41' },
  { idAuditoria: 10, fechaHora: '2026-08-28T14:55:00', usuario: 'ADMIN', modulo: 'USUARIOS/ROL', accion: 'VISUALIZACION_CLAVE', registroAfectado: 'CAJA02', campo: 'CLAVE', valorAnterior: 'caja02x', valorNuevo: 'caja02x' },
  { idAuditoria: 11, fechaHora: '2026-08-28T11:18:00', usuario: 'ADMIN', modulo: 'PERFILES', accion: 'CREACION', registroAfectado: '61', campo: 'ALTA', valorAnterior: null, valorNuevo: 'ANA MELGAR' },
  { idAuditoria: 12, fechaHora: '2026-08-27T18:44:00', usuario: 'EDWIN', modulo: 'PRODUCTOS', accion: 'ELIMINACION', registroAfectado: 'PR-00455', campo: 'BAJA', valorAnterior: 'JABON LIQUIDO 1L', valorNuevo: null },
  { idAuditoria: 13, fechaHora: '2026-08-27T10:09:00', usuario: 'JPEREZ', modulo: 'CLIENTES', accion: 'ACTUALIZACION', registroAfectado: '20487654321', campo: 'ESTADO', valorAnterior: 'ACTIVO', valorNuevo: 'BAJA' },
  { idAuditoria: 14, fechaHora: '2026-08-26T08:37:00', usuario: 'DESARROLLO', modulo: 'MENSAJES', accion: 'ACTUALIZACION', registroAfectado: 'MSG-2', campo: 'TEXTO', valorAnterior: 'INCENTIVO LINEA AGIVA', valorNuevo: 'INCENTIVO EN LA LINEA AGIVA - 0.50 POR PRODUCTO' },
];
