import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { RegistroAuditoria, esCampoSensible } from './auditoria.models';
import { AuditoriaStore } from './auditoria.store';
import { SistemaApiService } from './sistema-api.service';

const REGISTROS: readonly RegistroAuditoria[] = [
  { idAuditoria: 1, fechaHora: '2026-08-30T05:31:00', usuario: 'DESARROLLO', modulo: 'USUARIOS/ROL', accion: 'VISUALIZACION_CLAVE', registroAfectado: 'PRUEBA123', campo: 'CLAVE', valorAnterior: 'x', valorNuevo: 'x' },
  { idAuditoria: 2, fechaHora: '2026-08-29T10:00:00', usuario: 'ADMIN', modulo: 'PRODUCTOS', accion: 'ACTUALIZACION', registroAfectado: 'PR-1', campo: 'PRECIO', valorAnterior: '1', valorNuevo: '2' },
  { idAuditoria: 3, fechaHora: '2026-08-28T10:00:00', usuario: 'ADMIN', modulo: 'CLIENTES', accion: 'CREACION', registroAfectado: 'C-1', campo: 'ALTA', valorAnterior: null, valorNuevo: 'CLIENTE' },
  { idAuditoria: 4, fechaHora: '2026-08-27T10:00:00', usuario: 'EDWIN', modulo: 'PRODUCTOS', accion: 'ELIMINACION', registroAfectado: 'PR-2', campo: 'BAJA', valorAnterior: 'ALGO', valorNuevo: null },
];

class ApiStub {
  listarAuditoria(): Observable<readonly RegistroAuditoria[]> {
    return of(REGISTROS);
  }
}

describe('AuditoriaStore', () => {
  let store: AuditoriaStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuditoriaStore, { provide: SistemaApiService, useClass: ApiStub }],
    });
    store = TestBed.inject(AuditoriaStore);
  });

  it('sin filtros muestra toda la bitácora', () => {
    expect(store.resultados()).toHaveLength(4);
    expect(store.hayFiltros()).toBe(false);
  });

  it('los módulos y las acciones del selector salen de los datos, sin repetirse', () => {
    expect(store.modulos()).toEqual(['CLIENTES', 'PRODUCTOS', 'USUARIOS/ROL']);
    expect(store.acciones()).toHaveLength(4);
  });

  it('escribir un filtro no cambia la tabla hasta pulsar Aplicar', () => {
    store.cambiar('usuario', 'ADMIN');

    expect(store.resultados()).toHaveLength(4);
    expect(store.sinAplicar()).toBe(true);

    store.aplicar();
    expect(store.resultados()).toHaveLength(2);
    expect(store.sinAplicar()).toBe(false);
  });

  it('filtra por módulo y por acción de forma exacta', () => {
    store.cambiar('modulo', 'PRODUCTOS');
    store.aplicar();
    expect(store.resultados()).toHaveLength(2);

    store.cambiar('accion', 'ELIMINACION');
    store.aplicar();
    expect(store.resultados().map((f) => f.idAuditoria)).toEqual([4]);
  });

  it('el rango de fechas incluye los días de los extremos', () => {
    store.cambiar('desde', '2026-08-28');
    store.cambiar('hasta', '2026-08-29');
    store.aplicar();

    expect(store.resultados().map((f) => f.idAuditoria)).toEqual([2, 3]);
  });

  it('limpiar borra lo escrito y lo aplicado', () => {
    store.cambiar('usuario', 'ADMIN');
    store.aplicar();
    store.limpiar();

    expect(store.hayFiltros()).toBe(false);
    expect(store.sinAplicar()).toBe(false);
    expect(store.resultados()).toHaveLength(4);
  });
});

describe('esCampoSensible', () => {
  it('reconoce las variantes del campo de clave', () => {
    expect(esCampoSensible('CLAVE')).toBe(true);
    expect(esCampoSensible('clave_nueva')).toBe(true);
    expect(esCampoSensible('PASSWORD')).toBe(true);
    expect(esCampoSensible('CONTRASEÑA')).toBe(true);
  });

  it('deja en claro los campos normales', () => {
    expect(esCampoSensible('ESTADO')).toBe(false);
    expect(esCampoSensible('PRECIO_UNITARIO')).toBe(false);
  });
});
