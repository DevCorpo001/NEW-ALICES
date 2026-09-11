/** Fila de un catálogo como mapa campo → texto; las columnas las describe `CatalogoConfig`. */
export type CatalogoFila = Record<string, string>;

export interface CatalogoColumna {
  /** Clave dentro de la fila. */
  readonly campo: string;
  /** Encabezado mostrado en la tabla. */
  readonly titulo: string;
}

export interface CatalogoCampo {
  /** Clave dentro de la fila. */
  readonly campo: string;
  readonly etiqueta: string;
  readonly placeholder?: string;
  /** Solo aplica al formulario de alta. */
  readonly requerido?: boolean;
}

/** Descripción completa de un catálogo: qué se filtra, qué se lista y qué se da de alta. */
export interface CatalogoConfig {
  readonly titulo: string;
  readonly tituloAgregar: string;
  /** Campo cuyo valor se emite en `seleccionar` (ej. `codigo`, `ruc`). */
  readonly clave: string;
  readonly columnas: readonly CatalogoColumna[];
  readonly filtros: readonly CatalogoCampo[];
  readonly campos: readonly CatalogoCampo[];
  readonly mensajeVacio?: string;
  readonly ancho?: 'lg' | 'xl' | '2xl' | '3xl';
}
