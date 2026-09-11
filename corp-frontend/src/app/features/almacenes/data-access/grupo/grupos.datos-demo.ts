import { Grupo, ProductoAgrupable } from './grupo.models';

// TODO(backend): datos de muestra hasta que existan los SPs de grupos.
export const GRUPOS_DEMO: readonly Grupo[] = [
  { idGrupo: 1, codigo: 'GRP-001', nombre: 'ACEITE KALIMBO X275ML CORPORAL', abreviacion: 'KALIMBO275', idCanal: 4, canal: 'CANAL NORMAL', productos: 3 },
  { idGrupo: 2, codigo: 'GRP-002', nombre: 'ACEITE KATIVA X60ML', abreviacion: 'KATIVA60', idCanal: 4, canal: 'CANAL NORMAL', productos: 2 },
  { idGrupo: 3, codigo: 'GRP-003', nombre: 'ACEITE PLACENTA X50ML B.NAT', abreviacion: 'PLACENTA50', idCanal: 4, canal: 'CANAL NORMAL', productos: 1 },
  { idGrupo: 4, codigo: 'GRP-004', nombre: 'ACEITE VENA X250ML CORPORAL (MASAJES)', abreviacion: 'VENA250', idCanal: 4, canal: 'CANAL NORMAL', productos: 2 },
  { idGrupo: 5, codigo: 'GRP-005', nombre: 'ACON BE NATURAL X250ML TTO. SPRAY ALL IN ONE', abreviacion: 'ACONBE250', idCanal: 4, canal: 'CANAL NORMAL', productos: 0 },
  { idGrupo: 6, codigo: 'GRP-006', nombre: 'SHAMPOO ANYELUZ X400ML', abreviacion: 'ANYELUZ400', idCanal: 1, canal: 'CANAL DISTRIBUCION', productos: 2 },
  { idGrupo: 7, codigo: 'GRP-007', nombre: 'CREMA PLACENTA X120GR', abreviacion: 'CREMAPLA120', idCanal: 1, canal: 'CANAL DISTRIBUCION', productos: 0 },
  { idGrupo: 8, codigo: 'GRP-008', nombre: 'KIT FERIA PERFUMERIA', abreviacion: 'KITFERIA', idCanal: 2, canal: 'CANAL FERIA', productos: 1 },
];

export const PRODUCTOS_AGRUPABLES_DEMO: readonly ProductoAgrupable[] = [
  { idProducto: 1, codigo: 'PR-00841', producto: 'ACEITE KALIMBO X275ML CORPORAL', proveedor: 'DISTRIBUIDORA ANDINA SAC', idGrupo: 1, grupo: 'ACEITE KALIMBO X275ML CORPORAL', precioUnitario: 20.9, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 2, codigo: 'PR-00842', producto: 'ACEITE KALIMBO X275ML PROMO 2X1', proveedor: 'DISTRIBUIDORA ANDINA SAC', idGrupo: 1, grupo: 'ACEITE KALIMBO X275ML CORPORAL', precioUnitario: 38.5, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 3, codigo: 'PR-00843', producto: 'ACEITE KALIMBO X275ML PACK FAMILIAR', proveedor: 'DISTRIBUIDORA ANDINA SAC', idGrupo: 1, grupo: 'ACEITE KALIMBO X275ML CORPORAL', precioUnitario: 55, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 4, codigo: 'PR-00912', producto: 'ACEITE KATIVA X60ML', proveedor: 'COMERCIAL EL SOL EIRL', idGrupo: 2, grupo: 'ACEITE KATIVA X60ML', precioUnitario: 12.5, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 5, codigo: 'PR-00913', producto: 'ACEITE KATIVA X60ML DUO', proveedor: 'COMERCIAL EL SOL EIRL', idGrupo: 2, grupo: 'ACEITE KATIVA X60ML', precioUnitario: 22, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 6, codigo: 'PR-01020', producto: 'ACEITE PLACENTA X50ML B.NAT', proveedor: 'FERRETERIA UNION SRL', idGrupo: 3, grupo: 'ACEITE PLACENTA X50ML B.NAT', precioUnitario: 15.9, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 7, codigo: 'PR-01120', producto: 'ACEITE VENA X250ML CORPORAL', proveedor: 'DISTRIBUIDORA ANDINA SAC', idGrupo: 4, grupo: 'ACEITE VENA X250ML CORPORAL (MASAJES)', precioUnitario: 24.9, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 8, codigo: 'PR-01121', producto: 'ACEITE VENA X250ML MASAJES PRO', proveedor: 'DISTRIBUIDORA ANDINA SAC', idGrupo: 4, grupo: 'ACEITE VENA X250ML CORPORAL (MASAJES)', precioUnitario: 29.9, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 9, codigo: 'PR-01230', producto: 'SHAMPOO ANYELUZ X400ML', proveedor: 'COMERCIAL EL SOL EIRL', idGrupo: 6, grupo: 'SHAMPOO ANYELUZ X400ML', precioUnitario: 18, idCanal: 1, canal: 'CANAL DISTRIBUCION' },
  { idProducto: 10, codigo: 'PR-01231', producto: 'SHAMPOO ANYELUZ X400ML PACK', proveedor: 'COMERCIAL EL SOL EIRL', idGrupo: 6, grupo: 'SHAMPOO ANYELUZ X400ML', precioUnitario: 33, idCanal: 1, canal: 'CANAL DISTRIBUCION' },
  { idProducto: 11, codigo: 'PR-01340', producto: 'KIT PERFUMERIA FERIA 3 PIEZAS', proveedor: 'DISTRIBUIDORA ANDINA SAC', idGrupo: 8, grupo: 'KIT FERIA PERFUMERIA', precioUnitario: 79.9, idCanal: 2, canal: 'CANAL FERIA' },
  { idProducto: 12, codigo: 'PR-01450', producto: 'CREMA PLACENTA X120GR', proveedor: 'FERRETERIA UNION SRL', idGrupo: null, grupo: null, precioUnitario: 21.5, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 13, codigo: 'PR-01451', producto: 'CREMA PLACENTA X250GR', proveedor: 'FERRETERIA UNION SRL', idGrupo: null, grupo: null, precioUnitario: 36, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 14, codigo: 'PR-01500', producto: 'JABON LIQUIDO NEUTRO 1L', proveedor: 'COMERCIAL EL SOL EIRL', idGrupo: null, grupo: null, precioUnitario: 9.9, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 15, codigo: 'PR-01600', producto: 'TALCO PIES FRESH 200GR', proveedor: 'DISTRIBUIDORA ANDINA SAC', idGrupo: null, grupo: null, precioUnitario: 11.5, idCanal: 1, canal: 'CANAL DISTRIBUCION' },
];
