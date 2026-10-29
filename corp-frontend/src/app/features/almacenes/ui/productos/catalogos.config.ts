import { CatalogoConfig } from '@/shared/ui/catalogo-modal/catalogo-modal.models';
import { CatalogoId } from '../../data-access/catalogo/catalogos.models';

/** Presentación de cada catálogo en `app-catalogo-modal`: añadir uno es añadir una entrada aquí. */
export const catalogosConfig: Record<CatalogoId, CatalogoConfig> = {
  linea: {
    titulo: 'Búsqueda de Línea',
    tituloAgregar: 'Agregar Línea',
    clave: 'codigo',
    mensajeVacio: 'Sin líneas registradas.',
    columnas: [
      { campo: 'codigo', titulo: 'CÓDIGO DE LÍNEA' },
      { campo: 'nombre', titulo: 'NOMBRE DE LÍNEA' },
    ],
    filtros: [
      { campo: 'codigo', etiqueta: 'Código Línea' },
      { campo: 'nombre', etiqueta: 'Nombre Línea' },
    ],
    campos: [
      { campo: 'codigo', etiqueta: 'Código Línea', requerido: true },
      { campo: 'nombre', etiqueta: 'Nombre Línea', requerido: true },
      { campo: 'abreviado', etiqueta: 'Abreviado Línea' },
    ],
  },
  familia: {
    titulo: 'Búsqueda de Familia',
    tituloAgregar: 'Agregar Familia',
    clave: 'codigo',
    mensajeVacio: 'Sin familias registradas.',
    columnas: [
      { campo: 'codigo', titulo: 'CÓDIGO DE FAMILIA' },
      { campo: 'nombre', titulo: 'NOMBRE DE FAMILIA' },
    ],
    filtros: [
      { campo: 'codigo', etiqueta: 'Código Familia' },
      { campo: 'nombre', etiqueta: 'Nombre Familia' },
    ],
    campos: [
      { campo: 'codigo', etiqueta: 'Código Familia', requerido: true },
      { campo: 'nombre', etiqueta: 'Nombre Familia', requerido: true },
      { campo: 'abreviado', etiqueta: 'Abreviado Familia' },
      { campo: 'codigoLinea', etiqueta: 'Código Línea' },
    ],
  },
  categoria: {
    titulo: 'Búsqueda de Categoría',
    tituloAgregar: 'Agregar Categoría',
    clave: 'codigo',
    mensajeVacio: 'Sin categorías registradas.',
    columnas: [
      { campo: 'codigo', titulo: 'CÓDIGO DE CATEGORÍA' },
      { campo: 'nombre', titulo: 'NOMBRE DE CATEGORÍA' },
    ],
    filtros: [
      { campo: 'codigo', etiqueta: 'Código Categoría' },
      { campo: 'nombre', etiqueta: 'Nombre Categoría' },
    ],
    campos: [
      { campo: 'codigo', etiqueta: 'Código Categoría', requerido: true },
      { campo: 'nombre', etiqueta: 'Nombre Categoría', requerido: true },
    ],
  },
  clase: {
    titulo: 'Búsqueda de Clase',
    tituloAgregar: 'Agregar Clase',
    clave: 'codigo',
    mensajeVacio: 'Sin clases registradas.',
    columnas: [
      { campo: 'codigo', titulo: 'CÓDIGO DE CLASE' },
      { campo: 'nombre', titulo: 'NOMBRE DE CLASE' },
    ],
    filtros: [
      { campo: 'codigo', etiqueta: 'Código Clase' },
      { campo: 'nombre', etiqueta: 'Nombre Clase' },
    ],
    campos: [
      { campo: 'codigo', etiqueta: 'Código Clase', requerido: true },
      { campo: 'nombre', etiqueta: 'Nombre Clase', requerido: true },
      { campo: 'nombreCorto', etiqueta: 'Nombre Corto' },
      { campo: 'codigoLinea', etiqueta: 'Código Línea' },
      { campo: 'codigoFamilia', etiqueta: 'Código Familia' },
    ],
  },
  marca: {
    titulo: 'Búsqueda de Marca',
    tituloAgregar: 'Agregar Marca',
    clave: 'codigo',
    mensajeVacio: 'Sin marcas registradas.',
    columnas: [
      { campo: 'codigo', titulo: 'CÓDIGO DE MARCA' },
      { campo: 'nombre', titulo: 'NOMBRE DE MARCA' },
    ],
    filtros: [
      { campo: 'codigo', etiqueta: 'Código Marca' },
      { campo: 'nombre', etiqueta: 'Nombre Marca' },
    ],
    campos: [
      { campo: 'codigo', etiqueta: 'Código Marca', requerido: true },
      { campo: 'nombre', etiqueta: 'Nombre Marca', requerido: true },
    ],
  },
  proveedor: {
    titulo: 'Búsqueda de Proveedor',
    tituloAgregar: 'Agregar Proveedor',
    clave: 'ruc',
    mensajeVacio: 'Sin proveedores registrados.',
    columnas: [
      { campo: 'ruc', titulo: 'RUC PROVEEDOR' },
      { campo: 'razonSocial', titulo: 'RAZÓN SOCIAL' },
    ],
    filtros: [
      { campo: 'ruc', etiqueta: 'RUC Proveedor' },
      { campo: 'razonSocial', etiqueta: 'Nombre Proveedor' },
    ],
    campos: [
      { campo: 'ruc', etiqueta: 'RUC Proveedor', requerido: true },
      { campo: 'razonSocial', etiqueta: 'Nombre Proveedor', requerido: true },
      { campo: 'nombreComercial', etiqueta: 'Nombre Comercial' },
      { campo: 'direccion', etiqueta: 'Dirección' },
      { campo: 'nombreVendedor', etiqueta: 'Nombre Vendedor' },
    ],
  },
};

/** Campos de clasificación de la ficha: el id coincide con el control y con el catálogo. */
export const camposClasificacion: readonly { readonly id: CatalogoId; readonly etiqueta: string }[] =
  [
    { id: 'linea', etiqueta: 'Línea:' },
    { id: 'marca', etiqueta: 'Marca:' },
    { id: 'familia', etiqueta: 'Familia:' },
    { id: 'categoria', etiqueta: 'Categoría:' },
    { id: 'clase', etiqueta: 'Clase:' },
  ];
