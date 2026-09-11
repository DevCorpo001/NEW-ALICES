import { clasesPastel, iniciales } from './paleta';

describe('paleta de avatares', () => {
  it('toma las dos primeras letras en mayúscula', () => {
    expect(iniciales('venta')).toBe('VE');
    expect(iniciales('EDWIN')).toBe('ED');
  });

  it('tolera un usuario de una sola letra', () => {
    expect(iniciales('a')).toBe('A');
  });

  it('el mismo usuario recibe siempre el mismo color', () => {
    expect(clasesPastel('VENTA')).toBe(clasesPastel('VENTA'));
  });

  it('usuarios distintos suelen recibir colores distintos', () => {
    const colores = new Set(['VENTA', 'EDWIN', 'ADMIN', 'JPEREZ'].map(clasesPastel));
    expect(colores.size).toBeGreaterThan(1);
  });

  it('siempre devuelve un pastel de la paleta', () => {
    expect(clasesPastel('')).toContain('bg-');
  });
});
