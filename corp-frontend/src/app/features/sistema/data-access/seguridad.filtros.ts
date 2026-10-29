import {
  Cobertura,
  FiltroCobertura,
  FiltroEstado,
  Rol,
  Usuario,
  cobertura,
} from './seguridad.models';

export interface CriterioUsuarios {
  readonly texto: string;
  readonly idRol: number | null;
  readonly estado: FiltroEstado;
}

export interface CriterioRoles {
  readonly texto: string;
  readonly cobertura: FiltroCobertura;
}

export function filtrarUsuarios(
  usuarios: readonly Usuario[],
  criterio: CriterioUsuarios
): readonly Usuario[] {
  const texto = normalizar(criterio.texto);

  return usuarios.filter((fila) => {
    if (texto && !normalizar(`${fila.usuario} ${fila.descripcion}`).includes(texto)) {
      return false;
    }
    if (criterio.idRol !== null && fila.idRol !== criterio.idRol) {
      return false;
    }
    return coincideEstado(fila.estado, criterio.estado);
  });
}

export function filtrarRoles(roles: readonly Rol[], criterio: CriterioRoles): readonly Rol[] {
  const texto = normalizar(criterio.texto);

  return roles.filter((fila) => {
    if (texto && !normalizar(`${fila.codigo} ${fila.nombre} ${fila.descripcion}`).includes(texto)) {
      return false;
    }
    return criterio.cobertura === 'todos' || cobertura(fila) === criterio.cobertura;
  });
}

export function coincideEstado(estado: string, filtro: FiltroEstado): boolean {
  if (filtro === 'todos') {
    return true;
  }
  return filtro === 'activo' ? estado === 'A' : estado === 'I';
}

export function contarPorCobertura(roles: readonly Rol[]): Record<Cobertura, number> {
  const conteo: Record<Cobertura, number> = { completo: 0, parcial: 0, ninguno: 0 };
  for (const rol of roles) {
    conteo[cobertura(rol)]++;
  }
  return conteo;
}

/** Sin tildes y en minúsculas: se busca como se teclea, no como está escrito en la BD. */
export function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
