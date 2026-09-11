import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarqueeComponent } from './marquee.component';

describe('MarqueeComponent', () => {
  let fixture: ComponentFixture<MarqueeComponent>;
  let component: MarqueeComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [MarqueeComponent] });
    fixture = TestBed.createComponent(MarqueeComponent);
    component = fixture.componentInstance;
  });

  function conMensajes(mensajes: readonly string[]): void {
    fixture.componentRef.setInput('mensajes', mensajes);
    fixture.detectChanges();
  }

  function textoPista(): string {
    return (fixture.nativeElement.querySelector('.marquee-track') as HTMLElement).textContent ?? '';
  }

  it('sin mensajes no pinta la barra', () => {
    conMensajes([]);

    expect(component.hayMensajes()).toBe(false);
    expect(fixture.nativeElement.querySelector('.marquee-track')).toBeNull();
  });

  it('descarta los mensajes en blanco', () => {
    conMensajes(['UNO', '   ', 'DOS']);

    expect(component.visibles()).toEqual(['UNO', 'DOS']);
  });

  it('cada mensaje aparece una sola vez en la pista', () => {
    conMensajes(['OFERTA DEL DIA']);

    expect(textoPista().split('OFERTA DEL DIA')).toHaveLength(2);
  });

  it('separa los mensajes entre sí, pero no abre con separador', () => {
    conMensajes(['UNO', 'DOS']);
    const texto = textoPista();

    expect(texto.split('•')).toHaveLength(2);
    expect(texto.trimStart().startsWith('•')).toBe(false);
  });

  it('un texto más largo tarda más, porque la velocidad es fija', () => {
    conMensajes(['CORTO']);
    const corto = Number.parseInt(component.duracion(), 10);

    conMensajes(['X'.repeat(600)]);
    const largo = Number.parseInt(component.duracion(), 10);

    expect(largo).toBeGreaterThan(corto);
  });

  it('un mensaje corto nunca cruza por debajo del mínimo legible', () => {
    conMensajes(['HOLA']);

    expect(Number.parseInt(component.duracion(), 10)).toBeGreaterThanOrEqual(15);
  });

  it('los lectores de pantalla reciben los mensajes seguidos', () => {
    conMensajes(['UNO', 'DOS']);

    expect(component.leido()).toBe('UNO. DOS');
  });
});
