import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { ConfirmService } from '../../shared/services/confirm.service';

export const submoduleEntryGuard: CanActivateFn = (route) => {
  const titulo = route.data['titulo'];
  const modulo = route.parent?.data['titulo'];
  const nombre = modulo && modulo !== titulo ? `${modulo} → ${titulo}` : titulo;
  return inject(ConfirmService).confirm(`¿Desea ingresar a ${nombre}?`, 'Sí, ingresar', 'No', 'question');
};
