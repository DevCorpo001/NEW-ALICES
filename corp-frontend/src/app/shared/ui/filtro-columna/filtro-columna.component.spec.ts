import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FiltroColumnaComponent } from './filtro-columna.component';

describe('FiltroColumnaComponent', () => {
  let fixture: ComponentFixture<FiltroColumnaComponent>;
  let component: FiltroColumnaComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FiltroColumnaComponent] });
    fixture = TestBed.createComponent(FiltroColumnaComponent);
    fixture.componentRef.setInput('columna', 'Condición');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('arranca cerrado y sin filtro', () => {
    expect(component.abierto()).toBe(false);
    expect(component.activo()).toBe(false);
  });

  it('un valor de solo espacios no cuenta como filtro', () => {
    component.valor.set('   ');
    expect(component.activo()).toBe(false);
  });

  it('la etiqueta dice qué columna filtra y con qué valor', () => {
    expect(component.etiqueta()).toBe('Filtrar por Condición');

    component.valor.set('HABIDO');
    expect(component.etiqueta()).toBe('Filtrar por Condición (aplicado: HABIDO)');
  });

  it('limpiar borra el valor y cierra el panel', () => {
    component.valor.set('HABIDO');
    component.abrir();
    component.limpiar();

    expect(component.valor()).toBe('');
    expect(component.abierto()).toBe(false);
  });

  it('Enter, Escape y F2 cierran el panel sin borrar lo escrito', () => {
    for (const key of ['Enter', 'Escape', 'F2']) {
      component.valor.set('HABIDO');
      component.abrir();
      component.onKeydown(new KeyboardEvent('keydown', { key }));

      expect(component.abierto()).toBe(false);
      expect(component.valor()).toBe('HABIDO');
    }
  });
});
