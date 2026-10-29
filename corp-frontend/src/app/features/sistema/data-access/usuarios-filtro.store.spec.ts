import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { SistemaApiService } from './sistema-api.service';
import { Rol, Usuario } from './seguridad.models';
import { USUARIOS_POR_PAGINA, UsuariosFiltroStore } from './usuarios-filtro.store';

const USUARIOS: readonly Usuario[] = Array.from({ length: 16 }, (_, i) => ({
  idUsuario: i + 1,
  usuario: `USUARIO${i + 1}`,
  clave: `clave${i + 1}`,
  descripcion: `Usuario de prueba ${i + 1}`,
  idRol: i % 2 === 0 ? 1 : 2,
  rol: i % 2 === 0 ? 'ADMINISTRADOR' : 'VENDEDOR',
  estado: i < 12 ? 'A' : 'I',
  maxSesiones: null,
}));

class ApiStub {
  listarUsuarios(): Observable<readonly Usuario[]> {
    return of(USUARIOS);
  }
  listarRoles(): Observable<readonly Rol[]> {
    return of([]);
  }
}

describe('UsuariosFiltroStore', () => {
  let store: UsuariosFiltroStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsuariosFiltroStore, { provide: SistemaApiService, useClass: ApiStub }],
    });
    store = TestBed.inject(UsuariosFiltroStore);
  });

  it('carga los usuarios y muestra solo la primera página', () => {
    expect(store.cargando()).toBe(false);
    expect(store.total()).toBe(16);
    expect(store.paginados()).toHaveLength(USUARIOS_POR_PAGINA);
    expect(store.totalPaginas()).toBe(2);
  });

  it('cuenta los activos aparte del total', () => {
    expect(store.activos()).toBe(12);
  });

  it('la última página trae el resto', () => {
    store.irAPagina(2);

    expect(store.paginados()).toHaveLength(6);
    expect(store.desde()).toBe(11);
    expect(store.hasta()).toBe(16);
  });

  it('no deja pasar de la última página ni bajar de la primera', () => {
    store.irAPagina(99);
    expect(store.paginaActual()).toBe(2);

    store.irAPagina(0);
    expect(store.paginaActual()).toBe(1);
  });

  it('filtrar vuelve a la primera página', () => {
    store.irAPagina(2);
    store.cambiarEstado('inactivo');

    expect(store.paginaActual()).toBe(1);
    expect(store.resultados()).toHaveLength(4);
  });

  it('con un filtro que deja una sola página no quedan huecos', () => {
    store.cambiarRol(1);

    expect(store.resultados()).toHaveLength(8);
    expect(store.totalPaginas()).toBe(1);
    expect(store.paginados()).toHaveLength(8);
  });

  it('limpiar restablece filtros y página', () => {
    store.cambiarTexto('USUARIO1');
    store.irAPagina(1);
    store.limpiar();

    expect(store.hayFiltros()).toBe(false);
    expect(store.resultados()).toHaveLength(16);
  });

  it('alternar el estado cambia la fila y el conteo de activos', () => {
    store.alternarEstado(1);

    expect(store.resultados()[0].estado).toBe('I');
    expect(store.activos()).toBe(11);

    store.alternarEstado(1);
    expect(store.activos()).toBe(12);
  });
});
