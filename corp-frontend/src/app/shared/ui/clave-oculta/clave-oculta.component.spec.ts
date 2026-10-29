import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClaveOcultaComponent } from './clave-oculta.component';

describe('ClaveOcultaComponent', () => {
  let fixture: ComponentFixture<ClaveOcultaComponent>;
  let component: ClaveOcultaComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ClaveOcultaComponent] });
    fixture = TestBed.createComponent(ClaveOcultaComponent);
    fixture.componentRef.setInput('clave', 'ABC123');
    fixture.componentRef.setInput('de', 'ADMIN');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('arranca oculta y no pinta la clave', () => {
    expect(component.visible()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('ABC123');
  });

  it('al alternar muestra la clave', () => {
    component.alternar();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('ABC123');
  });

  it('el botón nombra a quién pertenece la clave', () => {
    expect(component.textoBoton()).toBe('Ver clave de ADMIN');

    component.alternar();
    expect(component.textoBoton()).toBe('Ocultar clave de ADMIN');
  });

  it('sin dueño el botón sigue teniendo nombre', () => {
    fixture.componentRef.setInput('de', '');
    expect(component.textoBoton()).toBe('Ver clave');
  });
});
