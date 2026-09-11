import { Observable } from 'rxjs';
import { CatalogoFila } from './catalogo-modal.models';

/** Origen de un catálogo (API o memoria); el `message` del `Error` ya es lo que se muestra. */
export interface CatalogoDataSource {
  /** Sugerencias mientras se teclea en el filtro `campo`. */
  sugerencias(campo: string, termino: string): Observable<readonly CatalogoFila[]>;

  /** Búsqueda confirmada. Con `filtros` vacío devuelve todo el catálogo. */
  buscar(filtros: CatalogoFila): Observable<readonly CatalogoFila[]>;

  /** Alta de un registro nuevo. */
  crear(fila: CatalogoFila): Observable<void>;

  /** Código sugerido al abrir el alta; sin implementar, el campo clave queda vacío. */
  siguienteCodigo?(): Observable<string>;
}
