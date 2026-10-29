/** Estado en la BD legacy: `A` activo, `I` inactivo. */
export type EstadoRegistro = 'A' | 'I';

export type FiltroEstado = 'todos' | 'activo' | 'inactivo';

export interface Usuario {
  idUsuario: number;
  usuario: string;
  /** La BD legacy guarda la clave en claro; la pantalla la oculta salvo que se pida verla. */
  clave: string;
  descripcion: string;
  idRol: number;
  rol: string;
  estado: EstadoRegistro;
  /** Sesiones simultáneas permitidas; sin valor es sin límite definido. */
  maxSesiones: number | null;
}

export interface Rol {
  idRol: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  /** Cuántos usuarios tienen el rol asignado. */
  usuarios: number;
  /** Vistas concedidas sobre el total disponible. */
  permisos: number;
  totalPermisos: number;
  estado: EstadoRegistro;
}

/** Cuánto del total de vistas cubre un rol. */
export type Cobertura = 'completo' | 'parcial' | 'ninguno';

export type FiltroCobertura = 'todos' | Cobertura;

export function cobertura(rol: Rol): Cobertura {
  if (rol.permisos <= 0) {
    return 'ninguno';
  }
  return rol.permisos >= rol.totalPermisos ? 'completo' : 'parcial';
}

export const ETIQUETAS_COBERTURA: Record<Cobertura, string> = {
  completo: 'Todos los permisos',
  parcial: 'Permisos parciales',
  ninguno: 'Sin permisos',
};
