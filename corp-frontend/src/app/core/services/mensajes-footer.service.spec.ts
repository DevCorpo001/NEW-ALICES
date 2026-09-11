import { TestBed } from '@angular/core/testing';
import { MensajesFooterService } from './mensajes-footer.service';

describe('MensajesFooterService', () => {
  let service: MensajesFooterService;

  beforeEach(() => {
    localStorage.removeItem('alices-footer');
    TestBed.configureTestingModule({});
    service = TestBed.inject(MensajesFooterService);
  });

  afterEach(() => localStorage.removeItem('alices-footer'));

  it('arranca con el mensaje de bienvenida', () => {
    expect(service.textos()).toEqual(['BIENVENIDO AL SISTEMA ALICE´S']);
  });

  it('agrega mensajes al final', () => {
    service.agregar('PROMOCIÓN DE LA SEMANA');

    expect(service.textos()).toHaveLength(2);
    expect(service.textos()[1]).toBe('PROMOCIÓN DE LA SEMANA');
  });

  it('ignora un mensaje vacío o de solo espacios', () => {
    service.agregar('   ');

    expect(service.textos()).toHaveLength(1);
  });

  it('recorta los espacios del texto', () => {
    service.agregar('  CON ESPACIOS  ');

    expect(service.textos()[1]).toBe('CON ESPACIOS');
  });

  it('actualiza por id sin tocar los demás', () => {
    service.agregar('SEGUNDO');
    const id = service.mensajes()[1].id;
    service.actualizar(id, 'SEGUNDO CORREGIDO');

    expect(service.textos()).toEqual(['BIENVENIDO AL SISTEMA ALICE´S', 'SEGUNDO CORREGIDO']);
  });

  it('no deja vaciar un mensaje al editarlo', () => {
    const id = service.mensajes()[0].id;
    service.actualizar(id, '  ');

    expect(service.textos()[0]).toBe('BIENVENIDO AL SISTEMA ALICE´S');
  });

  it('elimina por id', () => {
    service.agregar('TEMPORAL');
    const id = service.mensajes()[1].id;
    service.eliminar(id);

    expect(service.textos()).toHaveLength(1);
  });

  it('los ids nunca colisionan, aunque se borren mensajes intermedios', () => {
    service.agregar('A');
    service.agregar('B');
    service.agregar('C');
    service.eliminar(service.mensajes()[1].id);
    service.agregar('D');

    const ids = service.mensajes().map((mensaje) => mensaje.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('guarda mensajes y colores entre sesiones', () => {
    service.agregar('PERSISTE');
    service.cambiarColores('#000000', '#FFFFFF');

    const otra = new MensajesFooterService();
    expect(otra.textos()).toContain('PERSISTE');
    expect(otra.colorFondo()).toBe('#FFFFFF');
  });

  it('restablecer devuelve los colores de marca', () => {
    service.cambiarColores('#111111', '#222222');
    service.restablecerColores();

    expect(service.colorTexto()).toBe('#FFFFFF');
    expect(service.colorFondo()).toBe('#ED1B24');
  });
});
