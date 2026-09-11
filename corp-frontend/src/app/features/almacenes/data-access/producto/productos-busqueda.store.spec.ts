import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { ProductosBusquedaStore } from './productos-busqueda.store';

function crearStore() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), ProductosBusquedaStore],
  });
  return {
    store: TestBed.inject(ProductosBusquedaStore),
    http: TestBed.inject(HttpTestingController),
  };
}

const URL = `${environment.apiBaseUrl}/productos/autocomplete`;

describe('ProductosBusquedaStore', () => {
  it('no llama a la API mientras el término está vacío', () => {
    const { store, http } = crearStore();
    TestBed.tick();

    expect(store.resultados()).toEqual([]);
    expect(store.buscando()).toBe(false);
    http.expectNone(() => true);
  });

  it('traduce el estado seleccionado al código que espera la API', () => {
    const { store, http } = crearStore();
    TestBed.tick();

    store.termino.set('arroz');
    store.estado.set('inactivo');
    TestBed.tick();

    const peticion = http.expectOne((r) => r.url === URL);
    expect(peticion.request.params.get('busqueda')).toBe('arroz');
    expect(peticion.request.params.get('estado')).toBe('I');

    peticion.flush([{ idProducto: 1, codigoProducto: 'A1', descripcion: 'ARROZ', estado: 'I' }]);
    expect(store.resultados().length).toBe(1);
    expect(store.buscando()).toBe(false);
  });

  it('omite el parámetro estado cuando el filtro es "todos"', () => {
    const { store, http } = crearStore();
    TestBed.tick();

    store.termino.set('leche');
    TestBed.tick();

    const peticion = http.expectOne((r) => r.url === URL);
    expect(peticion.request.params.has('estado')).toBe(false);
    peticion.flush([]);
  });

  it('marca error y vacía resultados cuando la API falla', () => {
    const { store, http } = crearStore();
    TestBed.tick();

    store.termino.set('fallo');
    TestBed.tick();

    http.expectOne((r) => r.url === URL).flush(null, { status: 500, statusText: 'Server Error' });

    expect(store.error()).toBe(true);
    expect(store.buscando()).toBe(false);
    expect(store.resultados()).toEqual([]);
  });

  it('limpiar() devuelve el filtro a su estado inicial', () => {
    const { store, http } = crearStore();
    TestBed.tick();

    store.termino.set('algo');
    store.estado.set('activo');
    TestBed.tick();
    http.expectOne((r) => r.url === URL).flush([
      { idProducto: 9, codigoProducto: 'X', descripcion: 'X', estado: 'A' },
    ]);

    store.limpiar();
    TestBed.tick();

    expect(store.termino()).toBe('');
    expect(store.estado()).toBe('todos');
    expect(store.resultados()).toEqual([]);
  });
});
