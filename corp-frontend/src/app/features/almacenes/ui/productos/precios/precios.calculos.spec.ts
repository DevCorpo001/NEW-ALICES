import {
  aNumero,
  asegurarRangosBase,
  costo,
  costoConDescuentos,
  esRangoBase,
  margen,
  margenDocena,
  neto,
} from './precios.calculos';

describe('precios.calculos', () => {
  describe('neto', () => {
    it('añade el IGV al precio base', () => {
      expect(neto(100)).toBe(118);
      expect(neto(4)).toBe(4.72);
    });

    it('mantiene el cero', () => {
      expect(neto(0)).toBe(0);
    });
  });

  describe('costo', () => {
    it('reproduce el costo real que devuelve la base', () => {
      // Producto 20740148: base 4, 4 compradas, 4 bonificadas, 4% x4 → la API guarda 2.00
      expect(costo({ base: 4, unidades: 4, bonificacion: 4, descuentos: [4, 4, 4, 4] })).toBe(2);
    });

    it('sin bonificación ni descuentos es el base con IGV', () => {
      expect(costo({ base: 10, unidades: 1, bonificacion: 0, descuentos: [] })).toBe(11.8);
    });

    it('la bonificación abarata el costo unitario', () => {
      const sinBonificacion = costo({ base: 10, unidades: 10, bonificacion: 0, descuentos: [] });
      const conBonificacion = costo({ base: 10, unidades: 10, bonificacion: 10, descuentos: [] });
      expect(conBonificacion).toBeLessThan(sinBonificacion);
    });

    it('devuelve 0 cuando no hay base o no hay unidades', () => {
      expect(costo({ base: 0, unidades: 4, bonificacion: 0, descuentos: [] })).toBe(0);
      expect(costo({ base: 10, unidades: 0, bonificacion: 0, descuentos: [] })).toBe(0);
    });
  });

  describe('costoConDescuentos', () => {
    it('reproduce el costo con descuento real de la base', () => {
      // Mismo caso, sin el factor de bonificación → la API guarda 4.01
      expect(costoConDescuentos(4, [4, 4, 4, 4])).toBe(4.01);
    });

    it('sin descuentos es el base con IGV', () => {
      expect(costoConDescuentos(10, [])).toBe(11.8);
    });

    it('devuelve 0 sin base', () => {
      expect(costoConDescuentos(0, [4])).toBe(0);
    });
  });

  describe('margen', () => {
    it('calcula el porcentaje sobre el costo', () => {
      expect(margen(1.4, 2)).toBe(-30);
      expect(margen(3, 2)).toBe(50);
    });

    it('devuelve 0 si falta el costo o el precio, en vez de Infinity o NaN', () => {
      expect(margen(1.4, 0)).toBe(0);
      expect(margen(0, 2)).toBe(0);
    });
  });

  describe('margenDocena', () => {
    it('compara el unitario equivalente de la docena', () => {
      // 24 la docena → 2 la unidad → 0% sobre un costo de 2
      expect(margenDocena(24, 2)).toBe(0);
      expect(margenDocena(36, 2)).toBe(50);
    });
  });

  describe('asegurarRangosBase', () => {
    it('crea los rangos 1 y 3 cuando no existen', () => {
      expect(asegurarRangosBase([], 1.4, 1.2)).toEqual([
        { desde: 1, precio: 1.4 },
        { desde: 3, precio: 1.2 },
      ]);
    });

    it('sobrescribe el rango 1 con el precio de venta unitario', () => {
      const resultado = asegurarRangosBase([{ desde: 1, precio: 9 }], 1.4, 1.2);
      expect(resultado[0]).toEqual({ desde: 1, precio: 1.4 });
    });

    it('respeta el rango 3 existente si no hay mayorista informado', () => {
      const resultado = asegurarRangosBase([{ desde: 3, precio: 1.25 }], 1.4, 0);
      expect(resultado).toContainEqual({ desde: 3, precio: 1.25 });
    });

    it('conserva los rangos adicionales y los deja ordenados', () => {
      const resultado = asegurarRangosBase([{ desde: 12, precio: 1.1 }], 1.4, 1.2);
      expect(resultado.map((r) => r.desde)).toEqual([1, 3, 12]);
    });

    it('no muta la lista recibida', () => {
      const original = [{ desde: 1, precio: 9 }];
      asegurarRangosBase(original, 1.4, 1.2);
      expect(original).toEqual([{ desde: 1, precio: 9 }]);
    });
  });

  describe('esRangoBase', () => {
    it('marca como base solo el 1 y el 3', () => {
      expect(esRangoBase(1)).toBe(true);
      expect(esRangoBase(3)).toBe(true);
      expect(esRangoBase(12)).toBe(false);
    });
  });

  describe('aNumero', () => {
    it('trata la coma como separador de miles, no como decimal', () => {
      expect(aNumero('1,234.56')).toBe(1234.56);
      expect(aNumero('1,234,567.89')).toBe(1234567.89);
    });

    it('tolera decimales, texto y valores vacíos', () => {
      expect(aNumero('3.50')).toBe(3.5);
      expect(aNumero('')).toBe(0);
      expect(aNumero(null)).toBe(0);
      expect(aNumero('abc')).toBe(0);
    });
  });
});
