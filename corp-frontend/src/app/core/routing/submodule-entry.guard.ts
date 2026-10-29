import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ConfirmService } from '@/shared/services/confirm.service';

/** Pide confirmación antes de entrar a un submódulo, salvo en la carga inicial. */
export const submoduleEntryGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  if (!router.navigated) {
    return true;
  }
  const titulo = route.data['titulo'];
  const modulo = route.parent?.data['titulo'];
  const nombre = modulo && modulo !== titulo ? `${modulo} → ${titulo}` : titulo;
  return inject(ConfirmService).confirm(`¿Desea ingresar a ${nombre}?`, 'Sí, ingresar', 'No', 'question');
};
