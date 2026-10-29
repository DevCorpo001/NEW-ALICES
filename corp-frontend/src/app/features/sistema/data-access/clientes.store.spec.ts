import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { Cliente } from './clientes.models';
import { CLIENTES_POR_PAGINA, ClientesStore } from './clientes.store';
import { SistemaApiService } from './sistema-api.service';

const base = (parcial: Partial<Cliente>): Cliente => ({
  idCliente: 1,
  documento: '10000001',
  nombre: 'CLIENTE UNO',
  abreviatura: null,
  nombreComercial: null,
  direccion: null,
  fechaRegistro: '2026-08-29',
  condicion: null,
  ultimaValidacion: null,
  ubigeo: null,
  estado: null,
  ...parcial,
});

const CLIENTES: readonly Cliente[] = [
  base({ idCliente: 1, documento: '10089614', nombre: 'JANNET ZUTA' }),
  base({ idCliente: 2, documento: '20512345678', nombre: 'DISTRIBUIDORA ANDINA SAC', nombreComercial: 'ANDINA', condicion: 'HABIDO', estado: 'ACTIVO' }),
  base({ idCliente: 3, documento: '20487654321', nombre: 'COMERCIAL EL SOL', nombreComercial: 'BODEGA EL SOL', condicion: 'NO HABIDO', estado: 'BAJA' }),
  ...Array.from({ length: 12 }, (_, i) =>
    base({ idCliente: 10 + i, documento: `4400000${i}`, nombre: `PERSONA ${i}` })
  ),
];

class ApiStub {
  listarClientes(): Observable<readonly Cliente[]> {
    return of(CLIENTES);
  }
}

describe('ClientesStore', () => {
  let store: ClientesStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClientesStore, { provide: SistemaApiService, useClass: ApiStub }],
    });
    store = TestBed.inject(ClientesStore);
  });

  it('carga y pagina el padrón', () => {
    expect(store.total()).toBe(15);
    expect(store.paginados()).toHaveLength(CLIENTES_POR_PAGINA);
    expect(store.totalPaginas()).toBe(2);
  });

  it('la barra superior filtra por documento, nombre y nombre comercial', () => {
    store.cambiarDocumento('2051');
    expect(store.resultados()).toHaveLength(1);

    store.limpiar();
    store.cambiarNombre('sol');
    expect(store.resultados()).toHaveLength(1);

    store.limpiar();
    store.cambiarNombreComercial('andina');
    expect(store.resultados()).toHaveLength(1);
  });

  it('el embudo de una columna filtra solo esa columna', () => {
    store.filtrarColumna('condicion', 'HABIDO');

    // 'NO HABIDO' también contiene 'HABIDO': el filtro es por coincidencia, como en la grilla antigua.
    expect(store.resultados()).toHaveLength(2);

    store.filtrarColumna('estado', 'ACTIVO');
    expect(store.resultados()).toHaveLength(1);
  });

  it('cuenta cuántas columnas tienen filtro puesto', () => {
    store.filtrarColumna('condicion', 'HABIDO');
    store.filtrarColumna('estado', 'BAJA');
    expect(store.columnasFiltradas()).toBe(2);

    store.filtrarColumna('estado', '');
    expect(store.columnasFiltradas()).toBe(1);
  });

  it('los filtros de columna se combinan con los de la barra', () => {
    store.cambiarNombre('comercial');
    store.filtrarColumna('estado', 'ACTIVO');

    expect(store.resultados()).toHaveLength(0);
  });

  it('filtrar vuelve a la primera página', () => {
    store.irAPagina(2);
    store.filtrarColumna('nombre', 'PERSONA');

    expect(store.paginaActual()).toBe(1);
  });

  it('limpiar quita también los filtros de columna', () => {
    store.cambiarDocumento('2051');
    store.filtrarColumna('condicion', 'HABIDO');
    store.limpiar();

    expect(store.hayFiltros()).toBe(false);
    expect(store.resultados()).toHaveLength(15);
  });
});
