import { ClaveAutorizacion, ClaveQr } from './permisos.models';

// TODO(backend): datos de muestra hasta que existan los SPs de claves y claves QR.
export const CLAVES_DEMO: readonly ClaveAutorizacion[] = [
  { idClave: 1, clave: 'ABC123', usuario: 'ADMIN', estado: 'A' },
  { idClave: 2, clave: '157GF2', usuario: 'VENTA', estado: 'I' },
  { idClave: 3, clave: '12123', usuario: 'CAJA', estado: 'I' },
  { idClave: 4, clave: '12', usuario: '99', estado: 'I' },
  { idClave: 5, clave: 'M123', usuario: 'MVALLADARES', estado: 'I' },
  { idClave: 6, clave: '235689741', usuario: 'AUTOSERVICIO', estado: 'A' },
  { idClave: 7, clave: '45103320', usuario: 'BSANCHEZ', estado: 'I' },
  { idClave: 8, clave: 'SUP2026', usuario: 'JPEREZ', estado: 'A' },
  { idClave: 9, clave: 'ALM0091', usuario: 'MCHAVEZ', estado: 'A' },
  { idClave: 10, clave: 'DSP7741', usuario: 'AVARGAS', estado: 'I' },
];

export const CLAVES_QR_DEMO: readonly ClaveQr[] = [
  { idClaveQr: 1, idRol: 3, rol: 'VENDEDOR', estado: 'I' },
  { idClaveQr: 2, idRol: 10, rol: 'T', estado: 'I' },
  { idClaveQr: 3, idRol: 4, rol: 'CAJERO', estado: 'I' },
  { idClaveQr: 4, idRol: 11, rol: 'PRUEBA', estado: 'A' },
  { idClaveQr: 5, idRol: 6, rol: 'DESPACHO', estado: 'I' },
  { idClaveQr: 6, idRol: 12, rol: 'PRUEBA', estado: 'A' },
  { idClaveQr: 7, idRol: 13, rol: 'PAQUETERO', estado: 'I' },
  { idClaveQr: 8, idRol: 1, rol: 'ADMINISTRADOR', estado: 'A' },
  { idClaveQr: 9, idRol: 5, rol: 'ALMACENERO', estado: 'I' },
];
