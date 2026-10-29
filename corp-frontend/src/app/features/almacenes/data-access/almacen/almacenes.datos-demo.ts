import { Almacen } from './almacen.models';
import { Canal, Empresa, Tienda } from '../tienda/tienda.models';

// TODO(backend): datos de muestra; `GET /api/tiendas` solo devuelve id, código y dirección.
export const ALMACENES_DEMO: readonly Almacen[] = [
  { idAlmacen: 1, codigo: 'CORP-1712', descripcion: 'CORP-COMPLETO', direccion: 'JR. CUZCO NRO. 572 INT. 141 LIMA - LIMA - LIMA', horarioAtencion: null, contacto: null, observaciones: null },
  { idAlmacen: 2, codigo: 'COSM-LIMA', descripcion: 'COSMETICOS ALICES-LIMA', direccion: 'JR. CUZCO NRO. 572 INT. 358 LIMA - LIMA - LIMA', horarioAtencion: '9:30AM - 8PM', contacto: '952940079', observaciones: 'VENTA REGULAR EN TIENDA' },
  { idAlmacen: 3, codigo: 'PERF-LIMA', descripcion: 'PERFUMERIA ALICES-LIMA', direccion: 'JR. CUZCO NRO. 572 INT. 141 LIMA - LIMA - LIMA', horarioAtencion: '9:30AM - 8PM', contacto: '952940079', observaciones: 'VENTA REGULAR EN TIENDA' },
  { idAlmacen: 4, codigo: 'CORP-LIMA', descripcion: 'CORPORACION PC-LIMA', direccion: 'JR. CUZCO NRO. 572 INT. 141 LIMA - LIMA - LIMA', horarioAtencion: '9:30AM - 8PM', contacto: '952940079', observaciones: 'VENTA REGULAR EN TIENDA' },
  { idAlmacen: 5, codigo: 'ALM-CENTRAL', descripcion: 'ALMACEN CENTRAL', direccion: 'AV. ARGENTINA NRO. 2020 LIMA - LIMA - LIMA', horarioAtencion: '7AM - 5PM', contacto: '952940080', observaciones: 'RECEPCION DE MERCADERIA' },
  { idAlmacen: 6, codigo: 'ALM-NORTE', descripcion: 'ALMACEN SUCURSAL NORTE', direccion: 'AV. TUPAC AMARU NRO. 890 INDEPENDENCIA - LIMA', horarioAtencion: '8AM - 6PM', contacto: '952940081', observaciones: null },
  { idAlmacen: 7, codigo: 'ALM-DEVOL', descripcion: 'ALMACEN DE DEVOLUCIONES', direccion: 'JR. CUZCO NRO. 572 SOTANO LIMA - LIMA - LIMA', horarioAtencion: null, contacto: null, observaciones: 'SOLO MERCADERIA OBSERVADA' },
];

export const CANALES_DEMO: readonly Canal[] = [
  { idCanal: 1, nombre: 'CANAL DISTRIBUCION', descripcion: 'VENTA A DISTRIBUIDORES Y TIENDAS' },
  { idCanal: 2, nombre: 'CANAL FERIA', descripcion: 'VENTA ESPECIAL EN EVENTOS' },
  { idCanal: 3, nombre: 'CANAL INTERNO', descripcion: 'VENTA INTERNA EXCLUSIVA' },
  { idCanal: 4, nombre: 'CANAL NORMAL', descripcion: 'VENTA REGULAR' },
];

export const EMPRESAS_DEMO: readonly Empresa[] = [
  { idEmpresa: 1, ruc: '20511916926', razonSocial: "PERFUMERIA ALICE'S S.A.C." },
  { idEmpresa: 2, ruc: '20478155256', razonSocial: 'CORPORACION P.C E.I.R.L.' },
  { idEmpresa: 3, ruc: '20609682714', razonSocial: 'COSMETICOS ALICES S.A.C.' },
];

const tienda = (parcial: Partial<Tienda> & Pick<Tienda, 'idTienda' | 'codigo' | 'serie'>): Tienda => ({
  direccion: 'JR CUZCO NRO 572 INT 141 LIMA - LIMA - LIMA',
  ruc: '20511916926',
  razonSocial: "PERFUMERIA ALICE'S S.A.C.",
  empresaEnvio: "PERFUMERIA ALICE'S S.A.C.",
  ubigeo: 'LIMA 150101',
  cantidadImpresiones: 1,
  manejaStock: true,
  idCanal: 4,
  canal: 'CANAL NORMAL',
  activo: true,
  ...parcial,
});

export const TIENDAS_DEMO: readonly Tienda[] = [
  tienda({ idTienda: 1, codigo: 'TIENDA LUC', serie: '21' }),
  tienda({ idTienda: 2, codigo: 'TIENDA MAR', serie: '22' }),
  tienda({ idTienda: 3, codigo: 'CENTRO BAR', serie: '23' }),
  tienda({ idTienda: 4, codigo: 'TIENDA STA', serie: '24', direccion: 'AV. MANUEL DE LA TORRE 455 - SJL', ruc: '20478155256', razonSocial: 'CORPORACION P.C E.I.R.L.', empresaEnvio: 'CORPORACION P.C E.I.R.L.' }),
  tienda({ idTienda: 5, codigo: 'TIENDA CEN', serie: '25' }),
  tienda({ idTienda: 6, codigo: 'TIENDA SUR', serie: '29', direccion: 'AV. MANUEL DE LA TORRE 890 - SJL', ruc: '20478155256', razonSocial: 'CORPORACION P.C E.I.R.L.', empresaEnvio: 'CORPORACION P.C E.I.R.L.', idCanal: 1, canal: 'CANAL DISTRIBUCION' }),
  tienda({ idTienda: 7, codigo: 'TIENDA FER', serie: '02', direccion: 'AV. MANUEL DE LA TORRE 122 - SJL', ruc: '20609682714', razonSocial: 'COSMETICOS ALICES S.A.C.', empresaEnvio: 'COSMETICOS ALICES S.A.C.', idCanal: 2, canal: 'CANAL FERIA', manejaStock: false }),
  tienda({ idTienda: 8, codigo: 'TIENDA INT', serie: '32', direccion: 'AV. MANUEL DE LA TORRE 300 - SJL', ruc: '20478155256', razonSocial: 'CORPORACION P.C E.I.R.L.', empresaEnvio: 'CORPORACION P.C E.I.R.L.', idCanal: 3, canal: 'CANAL INTERNO' }),
  tienda({ idTienda: 9, codigo: 'TIENDA ANT', serie: '35', idCanal: 1, canal: 'CANAL DISTRIBUCION', activo: false, manejaStock: false }),
  tienda({ idTienda: 10, codigo: 'TIENDA EVE', serie: '38', idCanal: 2, canal: 'CANAL FERIA', activo: false }),
];
