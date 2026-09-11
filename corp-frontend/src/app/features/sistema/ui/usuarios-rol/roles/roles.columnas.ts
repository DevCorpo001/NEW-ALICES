import { ColumnaFiltrable } from '../../../../../shared/ui/columnas-visibles/columnas-visibles.component';

/** Columnas ocultables de la tabla de roles; la de acciones no entra en el selector. */
export const COLUMNAS_ROLES: readonly ColumnaFiltrable[] = [
  { campo: 'codigo', titulo: 'Código' },
  { campo: 'nombre', titulo: 'Rol' },
  { campo: 'descripcion', titulo: 'Descripción' },
  { campo: 'usuarios', titulo: 'Usuarios' },
  { campo: 'permisos', titulo: 'Permisos' },
  { campo: 'estado', titulo: 'Estado' },
];
