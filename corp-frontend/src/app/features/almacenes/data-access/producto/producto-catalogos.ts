import { HttpClient } from '@angular/common/http';
import { CatalogoDataSource } from '../../../../shared/ui/catalogo-modal/catalogo-modal.datasource';
import { CatalogoFila } from '../../../../shared/ui/catalogo-modal/catalogo-modal.models';
import { CatalogoApiDataSource } from '../catalogo/catalogo-api.datasource';
import { catalogosEndpoints } from '../catalogo/catalogos.endpoints';
import { CatalogoId } from '../catalogo/catalogos.models';

/** Campo que trae el id en la fila de cada catálogo. */
const CAMPOS_ID: Record<CatalogoId, string> = {
  linea: 'idLinea',
  familia: 'idFamilia',
  categoria: 'idCategoria',
  clase: 'idClase',
  marca: 'idMarca',
  proveedor: 'idProveedor',
};

/** Campo visible en el input; al backend sigue viajando el id de `CAMPOS_ID`. */
const CAMPOS_TEXTO: Record<CatalogoId, string> = {
  linea: 'nombre',
  familia: 'nombre',
  categoria: 'nombre',
  clase: 'nombre',
  marca: 'nombre',
  proveedor: 'razonSocial',
};

/** Los seis catálogos se sirven desde la API con la misma implementación. */
export function crearFuentesCatalogo(http: HttpClient): Record<CatalogoId, CatalogoDataSource> {
  return {
    linea: new CatalogoApiDataSource(http, catalogosEndpoints.linea),
    familia: new CatalogoApiDataSource(http, catalogosEndpoints.familia),
    categoria: new CatalogoApiDataSource(http, catalogosEndpoints.categoria),
    clase: new CatalogoApiDataSource(http, catalogosEndpoints.clase),
    marca: new CatalogoApiDataSource(http, catalogosEndpoints.marca),
    proveedor: new CatalogoApiDataSource(http, catalogosEndpoints.proveedor),
  };
}

export function idDeFila(id: CatalogoId, fila: CatalogoFila): number | null {
  const idCatalogo = Number.parseInt(fila[CAMPOS_ID[id]] ?? '', 10);
  return Number.isNaN(idCatalogo) ? null : idCatalogo;
}

/** Si el catálogo no trae descripción, el código sirve de respaldo. */
export function textoDeFila(id: CatalogoId, fila: CatalogoFila, claveRespaldo: string): string {
  return fila[CAMPOS_TEXTO[id]]?.trim() || fila[claveRespaldo] || '';
}
