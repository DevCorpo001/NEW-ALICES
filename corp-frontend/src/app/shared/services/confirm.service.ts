import { Injectable } from '@angular/core';
import type { SweetAlertOptions } from 'sweetalert2';

const DEFAULT_MESSAGE = '¿Confirma esta acción?';

/** Tema ALICES para SweetAlert2; las clases viven en `styles.css`. */
const COLOR_PRIMARIO = '#ED1B24';
const COLOR_NEUTRO = '#64748b';
const CLASES: SweetAlertOptions['customClass'] = {
  popup: 'alices-confirm-popup',
  title: 'alices-confirm-title',
  htmlContainer: 'alices-confirm-html',
};

/** Diálogos de la app; `sweetalert2` se importa diferido para no entrar en el bundle inicial. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  async confirm(
    message = DEFAULT_MESSAGE,
    confirmLabel = 'Sí',
    cancelLabel = 'Cancelar',
    icon: 'warning' | 'question' = 'question'
  ): Promise<boolean> {
    const { default: Swal } = await import('sweetalert2');
    const options: SweetAlertOptions = {
      title: '¿Estás seguro?',
      html: `<p class="alices-confirm-message">${message}</p>`,
      icon,
      showCancelButton: true,
      confirmButtonText: confirmLabel,
      cancelButtonText: cancelLabel,
      confirmButtonColor: COLOR_PRIMARIO,
      cancelButtonColor: COLOR_NEUTRO,
      customClass: CLASES,
    };
    const result = await Swal.fire(options);
    return result.isConfirmed;
  }

  /** Aviso de operación correcta; se resuelve al cerrar, por si hay que devolver el foco. */
  async exito(message: string, title = 'Operación correcta'): Promise<void> {
    await this.avisar('success', title, message);
  }

  /** Aviso de operación fallida, con el mismo aspecto que `exito`. */
  async error(message: string, title = 'No se pudo completar'): Promise<void> {
    await this.avisar('error', title, message);
  }

  /** Aviso de que falta algo por completar; mismo aspecto que `exito` y `error`. */
  async advertencia(message: string, title = 'Faltan datos'): Promise<void> {
    await this.avisar('warning', title, message);
  }

  /** Diálogo de un solo botón; `text` en lugar de `html` para no interpolar HTML. */
  private async avisar(
    icon: 'success' | 'error' | 'warning',
    title: string,
    text: string
  ): Promise<void> {
    const { default: Swal } = await import('sweetalert2');
    await Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: COLOR_PRIMARIO,
      customClass: CLASES,
    });
  }
}
