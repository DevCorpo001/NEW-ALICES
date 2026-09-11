import { Injectable, computed, signal } from '@angular/core';

export interface MensajeFooter {
  readonly id: number;
  readonly texto: string;
}

const CLAVE = 'alices-footer';

const POR_DEFECTO: readonly MensajeFooter[] = [
  { id: 1, texto: 'BIENVENIDO AL SISTEMA ALICE´S' },
];

const COLOR_TEXTO = '#FFFFFF';
const COLOR_FONDO = '#ED1B24';

interface FooterGuardado {
  mensajes: MensajeFooter[];
  colorTexto: string;
  colorFondo: string;
}

/** Mensajes del ticker inferior y sus colores. TODO(backend): falta el SP; hoy persiste en el navegador. */
@Injectable({ providedIn: 'root' })
export class MensajesFooterService {
  private readonly guardado = this.leer();

  readonly mensajes = signal<readonly MensajeFooter[]>(this.guardado.mensajes);
  readonly colorTexto = signal(this.guardado.colorTexto);
  readonly colorFondo = signal(this.guardado.colorFondo);

  readonly textos = computed(() => this.mensajes().map((mensaje) => mensaje.texto));

  agregar(texto: string): void {
    const limpio = texto.trim();
    if (!limpio) {
      return;
    }
    this.mensajes.update((actuales) => [...actuales, { id: this.siguienteId(actuales), texto: limpio }]);
    this.persistir();
  }

  actualizar(id: number, texto: string): void {
    const limpio = texto.trim();
    if (!limpio) {
      return;
    }
    this.mensajes.update((actuales) =>
      actuales.map((mensaje) => (mensaje.id === id ? { ...mensaje, texto: limpio } : mensaje))
    );
    this.persistir();
  }

  eliminar(id: number): void {
    this.mensajes.update((actuales) => actuales.filter((mensaje) => mensaje.id !== id));
    this.persistir();
  }

  cambiarColores(texto: string, fondo: string): void {
    this.colorTexto.set(texto);
    this.colorFondo.set(fondo);
    this.persistir();
  }

  restablecerColores(): void {
    this.cambiarColores(COLOR_TEXTO, COLOR_FONDO);
  }

  private siguienteId(mensajes: readonly MensajeFooter[]): number {
    return mensajes.reduce((mayor, mensaje) => Math.max(mayor, mensaje.id), 0) + 1;
  }

  private persistir(): void {
    const datos: FooterGuardado = {
      mensajes: [...this.mensajes()],
      colorTexto: this.colorTexto(),
      colorFondo: this.colorFondo(),
    };
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
    } catch {
      // Modo privado o almacenamiento lleno: el ticker sigue funcionando en memoria.
    }
  }

  private leer(): FooterGuardado {
    const vacio: FooterGuardado = {
      mensajes: [...POR_DEFECTO],
      colorTexto: COLOR_TEXTO,
      colorFondo: COLOR_FONDO,
    };

    try {
      const crudo = localStorage.getItem(CLAVE);
      if (!crudo) {
        return vacio;
      }
      const datos = JSON.parse(crudo) as Partial<FooterGuardado>;
      return {
        mensajes: Array.isArray(datos.mensajes) && datos.mensajes.length ? datos.mensajes : vacio.mensajes,
        colorTexto: datos.colorTexto ?? COLOR_TEXTO,
        colorFondo: datos.colorFondo ?? COLOR_FONDO,
      };
    } catch {
      return vacio;
    }
  }
}
