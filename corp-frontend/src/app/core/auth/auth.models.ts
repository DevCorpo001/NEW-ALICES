export interface LoginRequest {
  usuario: string;
  clave: string;
  idTienda: number;
}

export interface TiendaOption {
  idTienda: number;
  codigoTienda: string;
  direccion: string;
}

export interface SessionUser {
  usuarioId: string;
  nombre: string;
  rolId: string;
  rolCodigo: string;
  rolNombre: string;
  idTienda: number;
  rutaVista: string | null;
  maxSesiones: number | null;
  expiraEn: string | null;
}

export interface LoginResponse extends SessionUser {
  expiraEn: string;
}
