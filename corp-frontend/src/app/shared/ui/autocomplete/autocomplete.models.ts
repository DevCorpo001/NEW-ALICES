/** Opción normalizada de `app-autocomplete`; `valor` conserva la fila original del feature. */
export interface AutocompleteOpcion<T = unknown> {
  /** Identificador estable de la fila. Se usa para `track` y para el id ARIA. */
  readonly clave: string | number;
  /** Texto destacado a la izquierda (normalmente el código). */
  readonly principal: string;
  /** Texto descriptivo, se trunca si no cabe. */
  readonly secundario?: string;
  /** Distintivo opcional alineado a la derecha (ej. `INACTIVO`). */
  readonly etiqueta?: string;
  /** Fila original tal como la entregó el feature. */
  readonly valor: T;
  /** Excluye la opción de la navegación por teclado (`ListKeyManagerOption`). */
  readonly disabled?: boolean;
}
