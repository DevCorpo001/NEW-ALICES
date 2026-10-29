import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '@/environments/environment';
import { CatalogoDataSource } from '@/shared/ui/catalogo-modal/catalogo-modal.datasource';
import { CatalogoFila } from '@/shared/ui/catalogo-modal/catalogo-modal.models';

/** Describe dónde vive un catálogo y cómo se filtra. */
export interface CatalogoEndpoint {
  /** Ruta bajo `/api`, sin barras: `lineas`, `proveedores`… */
  readonly ruta: string;
  /** Campo de código y nombre del parámetro de filtro (`codigo`, `ruc`…). */
  readonly campoCodigo: string;
  /** Campo de nombre y nombre del parámetro de filtro (`nombre`, `razonSocial`…). */
  readonly campoNombre: string;
  /** Solo línea ofrece código sugerido de momento. */
  readonly conSiguienteCodigo?: boolean;
  readonly errorListado: string;
  readonly errorAlta: string;
}

/** Catálogo servido por la API; lo propio de cada uno va en `CatalogoEndpoint`. */
export class CatalogoApiDataSource implements CatalogoDataSource {
  /** Solo se define si el catálogo lo soporta; el modal comprueba su ausencia. */
  readonly siguienteCodigo?: () => Observable<string>;

  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    private readonly endpoint: CatalogoEndpoint
  ) {
    this.base = `${environment.apiBaseUrl}/${endpoint.ruta}`;

    if (endpoint.conSiguienteCodigo) {
      this.siguienteCodigo = () =>
        this.http
          .get<{ codigo: string }>(`${this.base}/siguiente-codigo`)
          .pipe(map((respuesta) => respuesta.codigo));
    }
  }

  sugerencias(campo: string, termino: string): Observable<readonly CatalogoFila[]> {
    return this.consultar(`${this.base}/autocomplete`, { [campo]: termino });
  }

  buscar(filtros: CatalogoFila): Observable<readonly CatalogoFila[]> {
    return this.consultar(this.base, filtros).pipe(
      catchError(() => throwError(() => new Error(this.endpoint.errorListado)))
    );
  }

  crear(fila: CatalogoFila): Observable<void> {
    return this.http
      .post<void>(this.base, fila)
      .pipe(catchError((error: HttpErrorResponse) => throwError(() => new Error(this.mensajeDeAlta(error)))));
  }

  private consultar(url: string, filtros: CatalogoFila): Observable<readonly CatalogoFila[]> {
    let params = new HttpParams();
    for (const campo of [this.endpoint.campoCodigo, this.endpoint.campoNombre]) {
      const valor = filtros[campo]?.trim();
      if (valor) {
        params = params.set(campo, valor);
      }
    }
    return this.http.get<Record<string, unknown>[]>(url, { params }).pipe(map(aFilas));
  }

  private mensajeDeAlta(error: HttpErrorResponse): string {
    // 409: el registro ya existe o el SP rechaza el alta. 400: FluentValidation.
    if (error.status === 409) {
      return typeof error.error?.message === 'string' ? error.error.message : this.endpoint.errorAlta;
    }
    if (error.status === 400) {
      return 'Revisa los datos ingresados.';
    }
    return this.endpoint.errorAlta;
  }
}

/** La API devuelve DTOs tipados; el modal trabaja con mapas de texto. */
function aFilas(objetos: readonly Record<string, unknown>[]): readonly CatalogoFila[] {
  return objetos.map((objeto) => {
    const fila: CatalogoFila = {};
    for (const [clave, valor] of Object.entries(objeto)) {
      fila[clave] = valor === null || valor === undefined ? '' : String(valor);
    }
    return fila;
  });
}
