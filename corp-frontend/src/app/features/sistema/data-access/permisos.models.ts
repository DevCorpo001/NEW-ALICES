import { EstadoRegistro } from './seguridad.models';

/** Clave de autorización que un supervisor teclea para desbloquear una operación. */
export interface ClaveAutorizacion {
  idClave: number;
  clave: string;
  usuario: string;
  estado: EstadoRegistro;
}

/** Clave QR por rol; se imprime para escanearla en caja. */
export interface ClaveQr {
  idClaveQr: number;
  idRol: number;
  rol: string;
  estado: EstadoRegistro;
}
