import { HttpErrorResponse } from '@angular/common/http';
import { FormularioProducto } from './producto-formulario';

/** Campo obligatorio: nombre del control y su etiqueta visible. */
export type CampoObligatorio = readonly [control: string, etiqueta: string];

/** Campos obligatorios con su nombre visible, en orden de pantalla. */
const CAMPOS_OBLIGATORIOS: readonly CampoObligatorio[] = [
  ['codigo', 'Código de Producto'],
  ['nombreTecnico', 'Nombre Técnico'],
  ['proveedor', 'Proveedor'],
  ['unidadMedida', 'Unidad de Medida'],
  ['fechaRegistro', 'Fecha de Registro'],
];

export function camposFaltantes(formulario: FormularioProducto): readonly CampoObligatorio[] {
  return CAMPOS_OBLIGATORIOS.filter(([control]) => formulario.get(control)?.invalid);
}

export function mensajeCamposFaltantes(faltantes: readonly CampoObligatorio[]): string {
  const nombres = faltantes.map(([, etiqueta]) => etiqueta);
  return nombres.length === 1
    ? `Falta completar el campo ${nombres[0]}.`
    : `Faltan completar estos campos: ${nombres.join(', ')}.`;
}

export function mensajeDeGuardado(error: HttpErrorResponse): string {
  // 404 al actualizar: el SP no guardó nada y el backend no reencuentra la ficha.
  if (error.status === 404) {
    return 'La actualización no se guardó: el producto no existe.';
  }
  // 409: código o código de barra duplicado. 400: validación de FluentValidation.
  if (error.status === 409) {
    return typeof error.error?.message === 'string'
      ? error.error.message
      : 'El producto ya existe.';
  }
  if (error.status === 400) {
    return 'Revisa los datos ingresados.';
  }
  return 'No se pudo guardar el producto.';
}
