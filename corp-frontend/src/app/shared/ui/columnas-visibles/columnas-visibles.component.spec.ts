import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColumnaFiltrable, ColumnasVisiblesComponent } from './columnas-visibles.component';

const COLUMNAS: readonly ColumnaFiltrable[] = [
  { campo: 'codigo', titulo: 'Código' },
  { campo: 'nombre', titulo: 'Rol' },
  { campo: 'estado', titulo: 'Estado' },
];

describe('ColumnasVisiblesComponent', () => {
  let fixture: ComponentFixture<ColumnasVisiblesComponent>;
  let component: ColumnasVisiblesComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ColumnasVisiblesComponent] });
    fixture = TestBed.createComponent(ColumnasVisiblesComponent);
    fixture.componentRef.setInput('columnas', COLUMNAS);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('arranca con todas las columnas marcadas', () => {
    expect(component.todasVisibles()).toBe(true);
    expect(component.visibles()).toBe(3);
    expect(COLUMNAS.every((c) => component.esVisible(c.campo))).toBe(true);
  });

  it('desmarcar una columna la oculta', () => {
    component.alternar('nombre');

    expect(component.esVisible('nombre')).toBe(false);
    expect(component.visibles()).toBe(2);
    expect(component.ocultas()).toEqual(['nombre']);
  });

  it('volver a marcarla la muestra', () => {
    component.alternar('nombre');
    component.alternar('nombre');

    expect(component.esVisible('nombre')).toBe(true);
    expect(component.todasVisibles()).toBe(true);
  });

  it('no deja ocultar la última columna visible', () => {
    component.alternar('codigo');
    component.alternar('nombre');
    component.alternar('estado');

    expect(component.visibles()).toBe(1);
    expect(component.esVisible('estado')).toBe(true);
  });

  it('mostrar todas restablece el estado inicial', () => {
    component.alternar('codigo');
    component.alternar('nombre');
    component.mostrarTodas();

    expect(component.todasVisibles()).toBe(true);
  });

  it('F2 y Escape cierran el panel', () => {
    for (const key of ['Escape', 'F2']) {
      component.abrir();
      component.onKeydownPanel(new KeyboardEvent('keydown', { key }));
      expect(component.abierto()).toBe(false);
    }
  });
});
