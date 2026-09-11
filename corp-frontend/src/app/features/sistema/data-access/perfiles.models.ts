import { EstadoRegistro } from './seguridad.models';

/** Las dos pestañas de Perfiles; el sistema antiguo las trataba como pantallas distintas. */
export type TipoPerfil = 'vendedor' | 'cajero';

export interface Perfil {
  idPerfil: number;
  tipo: TipoPerfil;
  codigo: string;
  nombre: string;
  estado: EstadoRegistro;
}

export const ETIQUETAS_PERFIL: Record<TipoPerfil, { plural: string; singular: string }> = {
  vendedor: { plural: 'Vendedores', singular: 'Vendedor' },
  cajero: { plural: 'Cajeros', singular: 'Cajero' },
};
