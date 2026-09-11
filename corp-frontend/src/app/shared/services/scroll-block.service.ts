import { Injectable, inject } from '@angular/core';
import { ScrollStrategyOptions } from '@angular/cdk/overlay';

/** Congela el scroll del documento mientras haya capas abiertas (modales, paneles a pantalla completa). */
@Injectable({ providedIn: 'root' })
export class ScrollBlockService {
  /** La estrategia del CDK conserva la posición de scroll y compensa el ancho de la barra. */
  private readonly estrategia = inject(ScrollStrategyOptions).block();
  private capas = 0;

  /** Cuenta capas para que cerrar un modal anidado no libere el scroll del que sigue abierto. */
  bloquear(): void {
    if (this.capas++ === 0) {
      this.estrategia.enable();
    }
  }

  liberar(): void {
    if (this.capas === 0) {
      return;
    }
    if (--this.capas === 0) {
      this.estrategia.disable();
    }
  }
}
