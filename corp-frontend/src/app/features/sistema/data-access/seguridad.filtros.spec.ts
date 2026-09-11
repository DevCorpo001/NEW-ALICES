import { contarPorCobertura, filtrarRoles, filtrarUsuarios } from './seguridad.filtros';
import { Rol, Usuario, cobertura } from './seguridad.models';

const rol = (parcial: Partial<Rol>): Rol => ({
  idRol: 1,
  codigo: 'ADM',
  nombre: 'ADMINISTRADOR',
  descripcion: 'Acceso total',
  usuarios: 1,
  permisos: 10,
  totalPermisos: 10,
  estado: 'A',
  ...parcial,
});

const usuario = (parcial: Partial<Usuario>): Usuario => ({
  idUsuario: 1,
  usuario: 'ADMIN',
  clave: 'admin123',
  descripcion: 'CARLOS MENDOZA',
  idRol: 1,
  rol: 'ADMINISTRADOR',
  estado: 'A',
  maxSesiones: null,
  ...parcial,
});

describe('cobertura de permisos', () => {
  it('es completa cuando el rol tiene todas las vistas', () => {
    expect(cobertura(rol({ permisos: 10, totalPermisos: 10 }))).toBe('completo');
  });

  it('es parcial cuando tiene algunas', () => {
    expect(cobertura(rol({ permisos: 4, totalPermisos: 10 }))).toBe('parcial');
  });

  it('es ninguna cuando no tiene ninguna', () => {
    expect(cobertura(rol({ permisos: 0, totalPermisos: 10 }))).toBe('ninguno');
  });

  it('cuenta los roles de cada cobertura', () => {
    const roles = [
      rol({ idRol: 1, permisos: 10 }),
      rol({ idRol: 2, permisos: 5 }),
      rol({ idRol: 3, permisos: 0 }),
      rol({ idRol: 4, permisos: 0 }),
    ];

    expect(contarPorCobertura(roles)).toEqual({ completo: 1, parcial: 1, ninguno: 2 });
  });
});

describe('filtrarUsuarios', () => {
  const usuarios = [
    usuario({ idUsuario: 1, usuario: 'ADMIN', descripcion: 'CARLOS MENDOZA', idRol: 1, estado: 'A' }),
    usuario({ idUsuario: 2, usuario: 'JPEREZ', descripcion: 'JUANA PÉREZ', idRol: 2, estado: 'A' }),
    usuario({ idUsuario: 3, usuario: 'LMAMANI', descripcion: 'LUIS MAMANI', idRol: 2, estado: 'I' }),
  ];

  const sinFiltros = { texto: '', idRol: null, estado: 'todos' as const };

  it('sin filtros devuelve todo', () => {
    expect(filtrarUsuarios(usuarios, sinFiltros)).toHaveLength(3);
  });

  it('busca por usuario y por descripción', () => {
    expect(filtrarUsuarios(usuarios, { ...sinFiltros, texto: 'JPEREZ' })).toHaveLength(1);
    expect(filtrarUsuarios(usuarios, { ...sinFiltros, texto: 'mamani' })).toHaveLength(1);
  });

  it('ignora tildes y mayúsculas al buscar', () => {
    expect(filtrarUsuarios(usuarios, { ...sinFiltros, texto: 'perez' })).toHaveLength(1);
    expect(filtrarUsuarios(usuarios, { ...sinFiltros, texto: 'PÉREZ' })).toHaveLength(1);
  });

  it('filtra por rol', () => {
    expect(filtrarUsuarios(usuarios, { ...sinFiltros, idRol: 2 })).toHaveLength(2);
  });

  it('filtra por estado', () => {
    expect(filtrarUsuarios(usuarios, { ...sinFiltros, estado: 'inactivo' })).toHaveLength(1);
    expect(filtrarUsuarios(usuarios, { ...sinFiltros, estado: 'activo' })).toHaveLength(2);
  });

  it('combina los filtros', () => {
    const filtrados = filtrarUsuarios(usuarios, { texto: 'l', idRol: 2, estado: 'inactivo' });
    expect(filtrados.map((f) => f.usuario)).toEqual(['LMAMANI']);
  });
});

describe('filtrarRoles', () => {
  const roles = [
    rol({ idRol: 1, codigo: 'ADM', nombre: 'ADMINISTRADOR', permisos: 10 }),
    rol({ idRol: 2, codigo: 'VEN', nombre: 'VENDEDOR', descripcion: 'Ventas', permisos: 4 }),
    rol({ idRol: 3, codigo: 'TMP', nombre: 'TEMPORAL', descripcion: 'Sin accesos', permisos: 0 }),
  ];

  it('busca por código, nombre y descripción', () => {
    expect(filtrarRoles(roles, { texto: 'VEN', cobertura: 'todos' })).toHaveLength(1);
    expect(filtrarRoles(roles, { texto: 'temporal', cobertura: 'todos' })).toHaveLength(1);
    expect(filtrarRoles(roles, { texto: 'accesos', cobertura: 'todos' })).toHaveLength(1);
  });

  it('filtra por cobertura de permisos', () => {
    expect(filtrarRoles(roles, { texto: '', cobertura: 'completo' })).toHaveLength(1);
    expect(filtrarRoles(roles, { texto: '', cobertura: 'parcial' })).toHaveLength(1);
    expect(filtrarRoles(roles, { texto: '', cobertura: 'ninguno' })).toHaveLength(1);
  });

  it('mostrar todos no filtra por permisos', () => {
    expect(filtrarRoles(roles, { texto: '', cobertura: 'todos' })).toHaveLength(3);
  });
});
