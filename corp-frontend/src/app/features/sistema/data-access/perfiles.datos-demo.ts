import { Perfil } from './perfiles.models';

// TODO(backend): datos de muestra hasta que existan los SPs de vendedores y cajeros.
export const PERFILES_DEMO: readonly Perfil[] = [
  { idPerfil: 1, tipo: 'vendedor', codigo: '44', nombre: 'ANTONIO', estado: 'A' },
  { idPerfil: 2, tipo: 'vendedor', codigo: '47', nombre: 'VICTOR', estado: 'A' },
  { idPerfil: 3, tipo: 'vendedor', codigo: '99', nombre: 'TIENDA', estado: 'A' },
  { idPerfil: 4, tipo: 'vendedor', codigo: '12', nombre: 'ROSA MERINO', estado: 'A' },
  { idPerfil: 5, tipo: 'vendedor', codigo: '15', nombre: 'JORGE ALVA', estado: 'I' },
  { idPerfil: 6, tipo: 'vendedor', codigo: '21', nombre: 'MARTHA SILVA', estado: 'A' },
  { idPerfil: 7, tipo: 'vendedor', codigo: '33', nombre: 'CESAR PAREDES', estado: 'A' },
  { idPerfil: 8, tipo: 'vendedor', codigo: '38', nombre: 'LUCIA FLORES', estado: 'I' },
  { idPerfil: 9, tipo: 'vendedor', codigo: '52', nombre: 'MOSTRADOR 2', estado: 'A' },
  { idPerfil: 10, tipo: 'vendedor', codigo: '55', nombre: 'RAUL ZEGARRA', estado: 'A' },
  { idPerfil: 11, tipo: 'vendedor', codigo: '61', nombre: 'ANA MELGAR', estado: 'A' },
  { idPerfil: 12, tipo: 'vendedor', codigo: '70', nombre: 'FERIA DOMINICAL', estado: 'I' },
  { idPerfil: 13, tipo: 'cajero', codigo: '01', nombre: 'CAJA PRINCIPAL', estado: 'A' },
  { idPerfil: 14, tipo: 'cajero', codigo: '02', nombre: 'CAJA RAPIDA', estado: 'A' },
  { idPerfil: 15, tipo: 'cajero', codigo: '03', nombre: 'ELENA CASTRO', estado: 'A' },
  { idPerfil: 16, tipo: 'cajero', codigo: '04', nombre: 'SANDRA GOMEZ', estado: 'I' },
  { idPerfil: 17, tipo: 'cajero', codigo: '05', nombre: 'CAJA NOCHE', estado: 'A' },
  { idPerfil: 18, tipo: 'cajero', codigo: '06', nombre: 'ROSA TORRES', estado: 'A' },
  { idPerfil: 19, tipo: 'cajero', codigo: '07', nombre: 'CAJA EVENTOS', estado: 'I' },
];
