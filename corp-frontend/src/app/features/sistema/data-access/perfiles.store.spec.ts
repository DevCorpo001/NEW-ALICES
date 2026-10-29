import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { Perfil } from './perfiles.models';
import { PerfilesStore } from './perfiles.store';
import { SistemaApiService } from './sistema-api.service';

const PERFILES: readonly Perfil[] = [
  { idPerfil: 1, tipo: 'vendedor', codigo: '44', nombre: 'ANTONIO', estado: 'A' },
  { idPerfil: 2, tipo: 'vendedor', codigo: '47', nombre: 'VICTOR', estado: 'A' },
  { idPerfil: 3, tipo: 'vendedor', codigo: '15', nombre: 'JORGE ALVA', estado: 'I' },
  { idPerfil: 4, tipo: 'cajero', codigo: '01', nombre: 'CAJA PRINCIPAL', estado: 'A' },
  { idPerfil: 5, tipo: 'cajero', codigo: '02', nombre: 'CAJA RAPIDA', estado: 'I' },
];

class ApiStub {
  listarPerfiles(): Observable<readonly Perfil[]> {
    return of(PERFILES);
  }
}

describe('PerfilesStore', () => {
  let store: PerfilesStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PerfilesStore, { provide: SistemaApiService, useClass: ApiStub }],
    });
    store = TestBed.inject(PerfilesStore);
  });

  it('arranca en vendedores y no mezcla los cajeros', () => {
    expect(store.tipo()).toBe('vendedor');
    expect(store.resultados()).toHaveLength(3);
    expect(store.total()).toBe(3);
    expect(store.activos()).toBe(2);
  });

  it('cambiar de pestaña cambia el conjunto', () => {
    store.cambiarTipo('cajero');

    expect(store.resultados()).toHaveLength(2);
    expect(store.resultados().every((fila) => fila.tipo === 'cajero')).toBe(true);
  });

  it('cambiar de pestaña limpia los filtros, que nombran al tipo anterior', () => {
    store.codigo.set('44');
    store.estado.set('activo');
    store.cambiarTipo('cajero');

    expect(store.hayFiltros()).toBe(false);
    expect(store.resultados()).toHaveLength(2);
  });

  it('filtra por código y por nombre', () => {
    store.codigo.set('4');
    expect(store.resultados()).toHaveLength(2);

    store.limpiar();
    store.nombre.set('jorge');
    expect(store.resultados()).toHaveLength(1);
  });

  it('el nombre se busca sin distinguir mayúsculas', () => {
    store.nombre.set('ANTONIO');
    expect(store.resultados()).toHaveLength(1);
  });

  it('filtra por estado', () => {
    store.estado.set('inactivo');
    expect(store.resultados().map((f) => f.codigo)).toEqual(['15']);
  });

  it('alternar el estado cambia la fila y el conteo de activos', () => {
    store.alternarEstado(1);

    expect(store.activos()).toBe(1);
    expect(store.resultados()[0].estado).toBe('I');
  });
});
