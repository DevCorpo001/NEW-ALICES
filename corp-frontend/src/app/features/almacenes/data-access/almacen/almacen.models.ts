export interface Almacen {
  idAlmacen: number;
  codigo: string;
  descripcion: string;
  direccion: string;
  horarioAtencion: string | null;
  contacto: string | null;
  observaciones: string | null;
}
