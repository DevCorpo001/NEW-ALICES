import { PrecioRango } from '../../../data-access/producto/productos.models';

/** Aritmética de la ficha de precios: funciones puras, sin Angular, probables aparte. */

export const IGV = 0.18;

/** Rangos que la ficha siempre garantiza en la tabla por cantidad. */
export const RANGO_UNITARIO = 1;
export const RANGO_MAYORISTA = 3;

export interface Costeo {
  /** Precio base sin IGV. */
  readonly base: number;
  readonly unidades: number;
  readonly bonificacion: number;
  /** Los cuatro descuentos en porcentaje. */
  readonly descuentos: readonly number[];
}

/** Precio neto: el base más IGV. */
export function neto(base: number): number {
  return redondear(base * (1 + IGV));
}

/** Los cuatro descuentos encadenados, como factor multiplicador. */
export function cascadaDescuentos(descuentos: readonly number[]): number {
  return descuentos.reduce((acumulado, descuento) => acumulado * (1 - (descuento || 0) / 100), 1);
}

/** Base repartido entre las unidades recibidas, con los cuatro descuentos y con IGV. */
export function costo(costeo: Costeo): number {
  const { base, unidades, bonificacion, descuentos } = costeo;
  const recibidas = unidades + bonificacion;
  if (base <= 0 || unidades <= 0 || recibidas <= 0) {
    return 0;
  }
  return redondear(
    ((base * unidades) / recibidas) * cascadaDescuentos(descuentos) * (1 + IGV)
  );
}

/** Costo con descuentos pero **sin** el factor de bonificación. */
export function costoConDescuentos(base: number, descuentos: readonly number[]): number {
  if (base <= 0) {
    return 0;
  }
  return redondear(base * cascadaDescuentos(descuentos) * (1 + IGV));
}

/** Margen % de venta sobre costo; 0 si falta alguno, para no mostrar `Infinity` ni `NaN`. */
export function margen(precioVenta: number, costoUnitario: number): number {
  if (costoUnitario <= 0 || precioVenta <= 0) {
    return 0;
  }
  return redondear((precioVenta / costoUnitario - 1) * 100);
}

/** Margen de un precio por docena, comparando el unitario equivalente. */
export function margenDocena(precioDocena: number, costoUnitario: number): number {
  return margen(precioDocena > 0 ? precioDocena / 12 : 0, costoUnitario);
}

/** Garantiza los rangos base ordenados; el 3 solo se pisa si hay mayorista informado. */
export function asegurarRangosBase(
  rangos: readonly PrecioRango[],
  unitario: number,
  mayorista: number
): PrecioRango[] {
  const resultado = rangos.map((rango) => ({ ...rango }));

  const base = resultado.find((rango) => rango.desde === RANGO_UNITARIO);
  if (base) {
    base.precio = unitario;
  } else {
    resultado.push({ desde: RANGO_UNITARIO, precio: unitario });
  }

  const mayor = resultado.find((rango) => rango.desde === RANGO_MAYORISTA);
  if (!mayor) {
    resultado.push({ desde: RANGO_MAYORISTA, precio: mayorista });
  } else if (mayorista > 0) {
    mayor.precio = mayorista;
  }

  return resultado.sort((a, b) => a.desde - b.desde);
}

/** Los rangos base no se eliminan ni se les cambia la cantidad. */
export function esRangoBase(desde: number): boolean {
  return desde === RANGO_UNITARIO || desde === RANGO_MAYORISTA;
}

export function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/** Texto a número; la coma es separador de **miles** (`1,234.56`) y se quitan todas. */
export function aNumero(valor: string | number | null | undefined): number {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : 0;
  }
  const numero = Number.parseFloat(String(valor ?? '').replaceAll(',', ''));
  return Number.isFinite(numero) ? numero : 0;
}

export function aTextoDecimal(valor: number): string {
  return valor.toFixed(2);
}
