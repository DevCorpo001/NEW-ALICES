import { FormBuilder, Validators } from '@angular/forms';
import { CatalogoId } from '../catalogo/catalogos.models';
import {
  CatalogoRelacionado,
  CodigoBarra,
  GuardarProducto,
  ProductoDetalle,
} from './productos.models';

/** Ids de catálogo del producto en pantalla; es lo que viaja al backend, no los códigos. */
export type IdsCatalogo = Record<CatalogoId, number | null>;

export const SIN_IDS: IdsCatalogo = {
  linea: null,
  familia: null,
  categoria: null,
  clase: null,
  marca: null,
  proveedor: null,
};

export function crearFormularioProducto(fb: FormBuilder) {
  return fb.nonNullable.group({
    codigo: ['', Validators.required],
    abreviaventa: [''],
    codigoBarra: [''],
    nombreTecnico: ['', Validators.required],
    linea: [''],
    marca: [''],
    familia: [''],
    categoria: [''],
    clase: [''],
    proveedor: ['', Validators.required],
    procedencia: [''],
    unidadMedida: ['NIU', Validators.required],
    afectoPercepcion: ['N'],
    estadoProducto: ['A'],
    // Se propone hoy para no teclearla; `reset()` vuelve a este valor.
    fechaRegistro: [hoyEnInput(), Validators.required],
  });
}

export type FormularioProducto = ReturnType<typeof crearFormularioProducto>;
export type ValoresProducto = ReturnType<FormularioProducto['getRawValue']>;

/** Ficha de la API a valores de pantalla; de los catálogos se muestra el nombre. */
export function valoresDesdeDetalle(detalle: ProductoDetalle): Partial<ValoresProducto> {
  return {
    codigo: detalle.codigoProducto ?? '',
    abreviaventa: detalle.nombreCorto ?? '',
    nombreTecnico: detalle.descripcion ?? '',
    linea: textoCatalogo(detalle.linea),
    marca: textoCatalogo(detalle.marca),
    familia: textoCatalogo(detalle.familia),
    categoria: textoCatalogo(detalle.categoria),
    clase: textoCatalogo(detalle.clase),
    proveedor: detalle.proveedor.razonSocial?.trim() || detalle.proveedor.ruc?.trim() || '',
    procedencia: detalle.origen ?? '',
    unidadMedida: detalle.unidad || 'NIU',
    afectoPercepcion: detalle.percepcion || 'N',
    estadoProducto: detalle.estado === 'I' ? 'I' : 'A',
    fechaRegistro: aFechaInput(detalle.fechaRegistro),
  };
}

export function idsDesdeDetalle(detalle: ProductoDetalle): IdsCatalogo {
  return {
    linea: detalle.linea.id,
    familia: detalle.familia.id,
    categoria: detalle.categoria.id,
    clase: detalle.clase.id,
    marca: detalle.marca.id,
    proveedor: detalle.proveedor.idProveedor,
  };
}

/** Valores de pantalla al cuerpo del alta/actualización. */
export function construirCuerpo(valores: ValoresProducto, ids: IdsCatalogo): GuardarProducto {
  return {
    codigo: valores.codigo.trim(),
    descripcion: valores.nombreTecnico.trim(),
    nombreCorto: valores.abreviaventa.trim() || null,
    idLinea: ids.linea,
    idFamilia: ids.familia,
    idClase: ids.clase,
    idMarca: ids.marca,
    idCategoria: ids.categoria,
    idProveedor: ids.proveedor,
    // TODO(backend): el grupo aún no se edita en pantalla.
    idGrupo: null,
    percepcion: valores.afectoPercepcion || null,
    estado: valores.estadoProducto || null,
    origen: valores.procedencia || null,
    fechaRegistro: valores.fechaRegistro || null,
    unidad: valores.unidadMedida || null,
    // El SP de alta acepta un único código; se manda el primero de la lista.
    codigoBarra: primerCodigoBarra(valores.codigoBarra),
  };
}

/** El campo de pantalla muestra todos los códigos separados por coma. */
export function unirCodigosBarra(barras: readonly CodigoBarra[]): string {
  return barras
    .map((barra) => barra.codigo ?? '')
    .filter(Boolean)
    .join(', ');
}

/** Hoy en `yyyy-MM-dd` y en hora local: `toISOString()` adelantaría el día en Perú. */
export function hoyEnInput(): string {
  const ahora = new Date();
  const mes = `${ahora.getMonth() + 1}`.padStart(2, '0');
  const dia = `${ahora.getDate()}`.padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/** `<input type="date">` espera `yyyy-MM-dd`; la API entrega ISO completo. */
function aFechaInput(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const soloFecha = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(soloFecha) ? soloFecha : '';
}

/** Lo que se muestra de un catálogo: su nombre y, si falta, su código. */
function textoCatalogo(catalogo: CatalogoRelacionado): string {
  return catalogo.nombre?.trim() || catalogo.codigo?.trim() || '';
}

/** El SP de alta acepta un solo código de barra; el campo puede traer varios. */
function primerCodigoBarra(codigos: string): string | null {
  const primero = codigos
    .split(',')
    .map((codigo) => codigo.trim())
    .find(Boolean);
  return primero ?? null;
}
