import { ChangeDetectionStrategy, Component, HostListener, computed, input, signal } from '@angular/core';

/** Velocidad de lectura del ticker. Las ofertas tienen que dar tiempo a leerse de reojo. */
const VELOCIDAD_PX_S = 70;
/** Ancho medio de carácter a 16px en negrita; solo sirve para estimar el recorrido. */
const PIXELES_POR_CARACTER = 9;
const DURACION_MINIMA_S = 15;
const ANCHO_POR_DEFECTO = 1280;

/** Ticker inferior: los mensajes cruzan la pantalla una vez por vuelta, uno tras otro. */
@Component({
  selector: 'app-marquee',
  templateUrl: './marquee.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarqueeComponent {
  readonly mensajes = input<readonly string[]>([]);
  readonly colorTexto = input('#FFFFFF');
  readonly colorFondo = input('#ED1B24');

  private readonly anchoPantalla = signal(
    typeof window === 'undefined' ? ANCHO_POR_DEFECTO : window.innerWidth
  );

  readonly visibles = computed(() => this.mensajes().filter((mensaje) => mensaje.trim()));

  readonly hayMensajes = computed(() => this.visibles().length > 0);

  /** El recorrido es la pantalla más el ancho del texto; a velocidad fija, eso da la duración. */
  readonly duracion = computed(() => {
    const caracteres = this.visibles().join(' • ').length;
    const recorrido = this.anchoPantalla() + caracteres * PIXELES_POR_CARACTER;
    return `${Math.max(DURACION_MINIMA_S, Math.round(recorrido / VELOCIDAD_PX_S))}s`;
  });

  readonly leido = computed(() => this.visibles().join('. '));

  @HostListener('window:resize')
  alRedimensionar(): void {
    this.anchoPantalla.set(window.innerWidth);
  }
}
