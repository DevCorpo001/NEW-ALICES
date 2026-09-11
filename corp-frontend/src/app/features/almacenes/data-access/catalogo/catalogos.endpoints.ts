import { CatalogoEndpoint } from './catalogo-api.datasource';
import { CatalogoId } from './catalogos.models';

/** Dónde vive cada catálogo en la API; solo cambian ruta, campos de filtro y mensajes. */
export const catalogosEndpoints: Record<CatalogoId, CatalogoEndpoint> = {
  linea: {
    ruta: 'lineas',
    campoCodigo: 'codigo',
    campoNombre: 'nombre',
    conSiguienteCodigo: true,
    errorListado: 'No se pudieron cargar las líneas.',
    errorAlta: 'No se pudo guardar la línea.',
  },
  familia: {
    ruta: 'familias',
    campoCodigo: 'codigo',
    campoNombre: 'nombre',
    conSiguienteCodigo: true,
    errorListado: 'No se pudieron cargar las familias.',
    errorAlta: 'No se pudo guardar la familia.',
  },
  categoria: {
    ruta: 'categorias',
    campoCodigo: 'codigo',
    campoNombre: 'nombre',
    errorListado: 'No se pudieron cargar las categorías.',
    errorAlta: 'No se pudo guardar la categoría.',
  },
  clase: {
    ruta: 'clases',
    campoCodigo: 'codigo',
    campoNombre: 'nombre',
    conSiguienteCodigo: true,
    errorListado: 'No se pudieron cargar las clases.',
    errorAlta: 'No se pudo guardar la clase.',
  },
  marca: {
    ruta: 'marcas',
    campoCodigo: 'codigo',
    campoNombre: 'nombre',
    errorListado: 'No se pudieron cargar las marcas.',
    errorAlta: 'No se pudo guardar la marca.',
  },
  proveedor: {
    ruta: 'proveedores',
    campoCodigo: 'ruc',
    campoNombre: 'razonSocial',
    errorListado: 'No se pudieron cargar los proveedores.',
    errorAlta: 'No se pudo guardar el proveedor.',
  },
};
