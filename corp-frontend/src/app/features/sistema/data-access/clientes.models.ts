/** Condición del contribuyente en SUNAT. */
export type CondicionCliente = 'HABIDO' | 'NO HABIDO' | null;

/** Estado del contribuyente en SUNAT. */
export type EstadoCliente = 'ACTIVO' | 'BAJA' | null;

export interface Cliente {
  idCliente: number;
  documento: string;
  nombre: string;
  abreviatura: string | null;
  nombreComercial: string | null;
  direccion: string | null;
  fechaRegistro: string | null;
  condicion: CondicionCliente;
  /** Última vez que se validó contra SUNAT. */
  ultimaValidacion: string | null;
  ubigeo: string | null;
  estado: EstadoCliente;
}
