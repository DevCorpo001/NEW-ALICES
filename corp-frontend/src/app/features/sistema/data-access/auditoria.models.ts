export type TipoAccion =
  | 'CREACION'
  | 'ACTUALIZACION'
  | 'ELIMINACION'
  | 'VISUALIZACION_CLAVE'
  | 'INICIO_SESION';

export interface RegistroAuditoria {
  idAuditoria: number;
  /** Fecha y hora del movimiento, en ISO. */
  fechaHora: string;
  usuario: string;
  modulo: string;
  accion: TipoAccion;
  /** Clave del registro tocado: código de producto, usuario afectado… */
  registroAfectado: string;
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
}

export const ETIQUETAS_ACCION: Record<TipoAccion, string> = {
  CREACION: 'CREACION',
  ACTUALIZACION: 'ACTUALIZACION',
  ELIMINACION: 'ELIMINACION',
  VISUALIZACION_CLAVE: 'VISUALIZACION_CLAVE',
  INICIO_SESION: 'INICIO_SESION',
};

/** Color por acción, no aleatorio: el tono dice si el movimiento crea, cambia o borra. */
export const TONOS_ACCION: Record<TipoAccion, string> = {
  CREACION: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  ACTUALIZACION: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  ELIMINACION: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  VISUALIZACION_CLAVE: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
  INICIO_SESION: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
};

/** Campos cuyo valor no se enseña de entrada; se destapan uno a uno. */
const CAMPOS_SENSIBLES = ['CLAVE', 'CONTRASENA', 'CONTRASEÑA', 'PASSWORD'];

export function esCampoSensible(campo: string): boolean {
  const normalizado = campo.trim().toUpperCase();
  return CAMPOS_SENSIBLES.some((sensible) => normalizado.includes(sensible));
}
