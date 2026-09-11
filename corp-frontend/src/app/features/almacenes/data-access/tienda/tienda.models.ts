/** Canal de venta al que pertenece una tienda. */
export interface Canal {
  idCanal: number;
  nombre: string;
  descripcion: string;
}

export interface Empresa {
  idEmpresa: number;
  ruc: string;
  razonSocial: string;
}

export interface Tienda {
  idTienda: number;
  codigo: string;
  direccion: string;
  ruc: string;
  razonSocial: string;
  empresaEnvio: string;
  ubigeo: string;
  /** Copias que se imprimen de cada comprobante. */
  cantidadImpresiones: number;
  serie: string;
  /** Si la tienda descuenta stock al vender. */
  manejaStock: boolean;
  idCanal: number;
  canal: string;
  activo: boolean;
}

/** Lo que devuelve el formulario de alta y edición. */
export interface GuardarTienda {
  codigo: string;
  direccion: string;
  idEmpresa: number | null;
  idEmpresaEnvio: number | null;
  ubigeo: string;
  cantidadImpresiones: number;
  serie: string;
  manejaStock: boolean;
  idCanal: number | null;
  activo: boolean;
}
