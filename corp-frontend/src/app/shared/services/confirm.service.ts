import { Injectable } from '@angular/core';
import type { SweetAlertOptions } from 'sweetalert2';

const DEFAULT_MESSAGE = '¿Confirma esta acción?';

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
      confirmButtonColor: '#ED1B24',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'alices-confirm-popup',
        title: 'alices-confirm-title',
        htmlContainer: 'alices-confirm-html',
      },
    };
    const result = await Swal.fire(options);
    return result.isConfirmed;
  }
}
