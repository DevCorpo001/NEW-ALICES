import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AlmacenesApiService } from '../almacen/almacenes-api.service';
import { Canal, Empresa, Tienda } from './tienda.models';
import { TiendaStore } from './tienda.store';

const EMPRESAS: readonly Empresa[] = [
  { idEmpresa: 1, ruc: '20511916926', razonSocial: 'PERFUMERIA' },
  { idEmpresa: 2, ruc: '20478155256', razonSocial: 'CORPORACION' },
];

const CANALES: readonly Canal[] = [
  { idCanal: 1, nombre: 'CANAL DISTRIBUCION', descripcion: 'A distribuidores' },
  { idCanal: 4, nombre: 'CANAL NORMAL', descripcion: 'Venta regular' },
];

const base = (parcial: Partial<Tienda> & Pick<Tienda, 'idTienda' | 'codigo'>): Tienda => ({
  direccion: 'JR CUZCO 572',
  ruc: '20511916926',
  razonSocial: 'PERFUMERIA',
  empresaEnvio: 'PERFUMERIA',
  ubigeo: 'LIMA 150101',
  cantidadImpresiones: 1,
  serie: '21',
  manejaStock: true,
  idCanal: 4,
  canal: 'CANAL NORMAL',
  activo: true,
  ...parcial,
});

const TIENDAS: readonly Tienda[] = [
  base({ idTienda: 1, codigo: 'TIENDA LUC' }),
  base({ idTienda: 2, codigo: 'TIENDA MAR', idCanal: 1, canal: 'CANAL DISTRIBUCION' }),
  base({ idTienda: 3, codigo: 'CENTRO BAR', ruc: '20478155256', razonSocial: 'CORPORACION' }),
  base({ idTienda: 4, codigo: 'TIENDA ANT', activo: false }),
];

class ApiStub {
  listarTiendas(): Observable<readonly Tienda[]> {
    return of(TIENDAS);
  }
  listarCanales(): Observable<readonly Canal[]> {
    return of(CANALES);
  }
  listarEmpresas(): Observable<readonly Empresa[]> {
    return of(EMPRESAS);
  }
}

describe('TiendaStore', () => {
  let store: TiendaStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TiendaStore, { provide: AlmacenesApiService, useClass: ApiStub }],
    });
    store = TestBed.inject(TiendaStore);
  });

  it('carga tiendas, canales y empresas de una vez', () => {
    expect(store.cargando()).toBe(false);
    expect(store.total()).toBe(4);
    expect(store.canales()).toHaveLength(2);
    expect(store.empresas()).toHaveLength(2);
  });

  it('cuenta las activas aparte del total', () => {
    expect(store.activas()).toBe(3);
  });

  it('filtra por código, canal y estado', () => {
    store.codigo.set('TIENDA');
    expect(store.resultados()).toHaveLength(3);

    store.limpiar();
    store.idCanal.set(1);
    expect(store.resultados().map((f) => f.codigo)).toEqual(['TIENDA MAR']);

    store.limpiar();
    store.estado.set('inactivo');
    expect(store.resultados().map((f) => f.codigo)).toEqual(['TIENDA ANT']);
  });

  it('la razón social filtra por el RUC de la empresa elegida', () => {
    store.idRazonSocial.set(2);

    expect(store.resultados().map((f) => f.codigo)).toEqual(['CENTRO BAR']);
  });

  it('el alta resuelve empresa y canal a partir de sus ids', () => {
    store.agregar({
      codigo: 'TIENDA NUEVA',
      direccion: 'AV. NUEVA 100',
      idEmpresa: 2,
      idEmpresaEnvio: 1,
      ubigeo: 'LIMA 150101',
      cantidadImpresiones: 2,
      serie: '40',
      manejaStock: false,
      idCanal: 1,
      activo: true,
    });

    const nueva = store.resultados().find((f) => f.codigo === 'TIENDA NUEVA');
    expect(nueva?.razonSocial).toBe('CORPORACION');
    expect(nueva?.ruc).toBe('20478155256');
    expect(nueva?.empresaEnvio).toBe('PERFUMERIA');
    expect(nueva?.canal).toBe('CANAL DISTRIBUCION');
    expect(nueva?.idTienda).toBe(5);
  });

  it('alternar el estado cambia la fila y el conteo de activas', () => {
    store.alternarEstado(1);

    expect(store.activas()).toBe(2);
  });

  it('guardar un canal existente lo edita en vez de duplicarlo', () => {
    store.guardarCanal({ idCanal: 4, nombre: 'CANAL NORMAL', descripcion: 'CAMBIADO' });

    expect(store.canales()).toHaveLength(2);
    expect(store.canales().find((c) => c.idCanal === 4)?.descripcion).toBe('CAMBIADO');
  });

  it('el id sugerido para un canal nuevo no pisa a los existentes', () => {
    expect(store.siguienteIdCanal()).toBe(5);

    store.guardarCanal({ idCanal: 5, nombre: 'CANAL WEB', descripcion: 'Ecommerce' });
    expect(store.canales()).toHaveLength(3);
    expect(store.siguienteIdCanal()).toBe(6);
  });
});
