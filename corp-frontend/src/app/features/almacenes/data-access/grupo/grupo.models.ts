/** Grupo de productos dentro de un canal de venta. */
export interface Grupo {
  idGrupo: number;
  codigo: string;
  nombre: string;
  abreviacion: string;
  idCanal: number;
  canal: string;
  /** Cuántos productos tiene asignados. */
  productos: number;
}

/** Producto visto desde el mantenimiento de grupos, con su grupo actual. */
export interface ProductoAgrupable {
  idProducto: number;
  codigo: string;
  producto: string;
  proveedor: string;
  idGrupo: number | null;
  grupo: string | null;
  precioUnitario: number;
  idCanal: number;
  canal: string;
}
