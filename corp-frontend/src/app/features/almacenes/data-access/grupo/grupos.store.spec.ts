import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AlmacenesApiService } from '../almacen/almacenes-api.service';
import { Grupo, ProductoAgrupable } from './grupo.models';
import { GruposStore } from './grupos.store';
import { Canal } from '../tienda/tienda.models';

const CANALES: readonly Canal[] = [
  { idCanal: 1, nombre: 'CANAL DISTRIBUCION', descripcion: '' },
  { idCanal: 4, nombre: 'CANAL NORMAL', descripcion: '' },
];

const GRUPOS: readonly Grupo[] = [
  { idGrupo: 1, codigo: 'GRP-001', nombre: 'ACEITE KALIMBO', abreviacion: 'KALIMBO', idCanal: 4, canal: 'CANAL NORMAL', productos: 2 },
  { idGrupo: 2, codigo: 'GRP-002', nombre: 'ACEITE KATIVA', abreviacion: 'KATIVA', idCanal: 4, canal: 'CANAL NORMAL', productos: 0 },
  { idGrupo: 3, codigo: 'GRP-003', nombre: 'SHAMPOO ANYELUZ', abreviacion: 'ANYELUZ', idCanal: 1, canal: 'CANAL DISTRIBUCION', productos: 0 },
];

const PRODUCTOS: readonly ProductoAgrupable[] = [
  { idProducto: 1, codigo: 'PR-1', producto: 'KALIMBO X275', proveedor: 'ANDINA', idGrupo: 1, grupo: 'ACEITE KALIMBO', precioUnitario: 20.9, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 2, codigo: 'PR-2', producto: 'KALIMBO PROMO', proveedor: 'ANDINA', idGrupo: 1, grupo: 'ACEITE KALIMBO', precioUnitario: 38.5, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 3, codigo: 'PR-3', producto: 'CREMA PLACENTA', proveedor: 'UNION', idGrupo: null, grupo: null, precioUnitario: 21.5, idCanal: 4, canal: 'CANAL NORMAL' },
  { idProducto: 4, codigo: 'PR-4', producto: 'TALCO FRESH', proveedor: 'ANDINA', idGrupo: null, grupo: null, precioUnitario: 11.5, idCanal: 1, canal: 'CANAL DISTRIBUCION' },
];

class ApiStub {
  listarGrupos(): Observable<readonly Grupo[]> {
    return of(GRUPOS);
  }
  listarProductosAgrupables(): Observable<readonly ProductoAgrupable[]> {
    return of(PRODUCTOS);
  }
  listarCanales(): Observable<readonly Canal[]> {
    return of(CANALES);
  }
}

describe('GruposStore', () => {
  let store: GruposStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GruposStore, { provide: AlmacenesApiService, useClass: ApiStub }],
    });
    store = TestBed.inject(GruposStore);
  });

  it('carga grupos, productos y canales de una vez', () => {
    expect(store.cargando()).toBe(false);
    expect(store.totalGrupos()).toBe(3);
    expect(store.totalProductos()).toBe(4);
  });

  it('"solo con productos" descarta los grupos vacíos', () => {
    store.soloConProductos.set(true);

    expect(store.gruposFiltrados().map((g) => g.codigo)).toEqual(['GRP-001']);
  });

  it('los filtros de cada pestaña son independientes', () => {
    store.idCanalGrupo.set(1);

    expect(store.gruposFiltrados()).toHaveLength(1);
    expect(store.productosFiltrados()).toHaveLength(4);
  });

  it('marcar todos solo alcanza a lo que está a la vista', () => {
    store.idCanalProducto.set(1);
    store.alternarTodos();

    expect(store.seleccionados()).toEqual([4]);
    expect(store.todosSeleccionados()).toBe(true);
  });

  it('asignar mueve lo marcado y recuenta los grupos', () => {
    store.alternarSeleccion(3);
    store.alternarSeleccion(4);
    store.asignarGrupo(2);

    const movido = store.productosFiltrados().find((p) => p.idProducto === 3);
    expect(movido?.grupo).toBe('ACEITE KATIVA');
    expect(store.listaGrupos().find((g) => g.idGrupo === 2)?.productos).toBe(2);
    expect(store.seleccionados()).toEqual([]);
  });

  it('asignar sin nada marcado no cambia nada', () => {
    store.asignarGrupo(2);

    expect(store.listaGrupos().find((g) => g.idGrupo === 2)?.productos).toBe(0);
  });

  it('eliminar un grupo deja sus productos sin grupo', () => {
    store.eliminarGrupo(1);

    expect(store.totalGrupos()).toBe(2);
    expect(store.productosFiltrados().filter((p) => p.grupo === null)).toHaveLength(4);
  });

  it('el destino de una asignación no depende de los filtros de la otra pestaña', () => {
    store.nombre.set('KALIMBO');

    expect(store.gruposFiltrados()).toHaveLength(1);
    expect(store.listaGrupos()).toHaveLength(3);
  });
});
