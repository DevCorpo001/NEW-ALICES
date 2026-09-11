export interface ProductoAutocomplete {
  idProducto: number;
  codigoProducto: string | null;
  descripcion: string | null;
  estado: string | null;
}

/** Respuesta de `GET /api/productos/validar` (SP `sp_ValidarCreacionProducto`). */
export interface ValidacionProducto {
  existeCodigo: boolean;
  existeBarra: boolean;
}

/** Criterio de validación; se envía solo lo que se quiere comprobar. */
export interface CriterioValidacionProducto {
  codigo?: string;
  idProducto?: number;
  codigoBarra?: string;
}

/** Forma común de línea, familia, clase, marca y categoría dentro de la ficha. */
export interface CatalogoRelacionado {
  id: number | null;
  codigo: string | null;
  nombre: string | null;
  abreviado: string | null;
}

export interface ProveedorRelacionado {
  idProveedor: number | null;
  ruc: string | null;
  razonSocial: string | null;
  nombreComercial: string | null;
  direccion: string | null;
  fechaRegistro: string | null;
}

export interface ProductoProveedor {
  readonly idProductoProveedor: number;
  readonly idProducto: number;
  readonly idProveedor: number;
  readonly ruc: string | null;
  readonly razonSocial: string | null;
}

export interface GrupoRelacionado {
  idGrupo: number | null;
  descripcion: string | null;
}

/** Ficha completa devuelta por `GET /api/productos/buscar` (SP `sp_BuscarProducto`). */
export interface ProductoDetalle {
  idProducto: number;
  codigoProducto: string | null;
  descripcion: string | null;
  nombreCorto: string | null;
  percepcion: string | null;
  estado: string | null;
  observacionCosteo: string | null;
  /** `L` local, `I` importado. */
  origen: string | null;
  unidad: string | null;
  fechaRegistro: string | null;
  imagen?: string | null;
  linea: CatalogoRelacionado;
  familia: CatalogoRelacionado;
  clase: CatalogoRelacionado;
  marca: CatalogoRelacionado;
  categoria: CatalogoRelacionado;
  proveedor: ProveedorRelacionado;
  grupo: GrupoRelacionado;
}

export interface StockAlmacen {
  idAlmacen: number;
  descripcionAlmacen: string;
  cantidad: number;
}

export interface AjusteStockItem {
  idAlmacen: number;
  cantidad: number;
  operacion: 'sumar' | 'actualizar';
}

export interface PrecioRango {
  desde: number;
  precio: number;
}

/** Precio de un producto en un canal (`sp_ListarPreciosXProducto`). */
export interface PrecioProducto {
  idPrecio: number;
  idProducto: number;
  idGrupo: number;
  nombreGrupo: string | null;
  idCanal: number | null;
  canal: string | null;
  observacion: string | null;
  usuario: string | null;
  precioUnitario: number;
  precioMayorista: number;
  precioDocena: number;
  precioCosto: number;
  precioCostoBase: number;
  precioCostoDescuento: number;
  unidadesComp: number;
  unidadesBonificadas: number;
  descuento1: number;
  descuento2: number;
  descuento3: number;
  descuento4: number;
  fechaModificacion: string | null;
  rangos: PrecioRango[];
}

export interface CodigoBarra {
  idBarra: number;
  codigo: string | null;
}

/** Tipo de movimiento registrado en `PRECIO_LOG`. */
export type TipoCambioPrecio = 'INSERT' | 'UPDATE' | 'DELETE';

/** Una línea del historial de cambios de un precio (`SP_ALMACEN_PRECIO_LOG_POR_PRECIO`). */
export interface CambioPrecio {
  idCambio: number;
  fecha: string | null;
  tipo: TipoCambioPrecio | null;
  usuario: string | null;
  desde: number | null;
  precioUnitario: number | null;
  /** Unidades compradas (`UND_COMP`); la tabla lo rotula UNIDAD. */
  unidadesComp: number | null;
  unidadesBonificadas: number | null;
  descuento1: number | null;
  descuento2: number | null;
}

/** Cuerpo del alta y la actualización; los catálogos viajan por **id**, no por código. */
export interface GuardarProducto {
  codigo: string;
  descripcion: string;
  nombreCorto: string | null;
  idLinea: number | null;
  idFamilia: number | null;
  idClase: number | null;
  idMarca: number | null;
  idCategoria: number | null;
  idProveedor: number | null;
  idGrupo: number | null;
  percepcion: string | null;
  estado: string | null;
  origen: string | null;
  fechaRegistro: string | null;
  unidad: string | null;
  codigoBarra?: string | null;
}
