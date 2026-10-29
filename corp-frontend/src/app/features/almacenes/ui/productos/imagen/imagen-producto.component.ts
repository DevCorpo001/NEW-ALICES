import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideMaximize2, lucideUpload, lucideX, lucideZoomIn } from '@ng-icons/lucide';
import { ConfirmService } from '@/shared/services/confirm.service';
import { ProductosApiService } from '../../../data-access/producto/productos-api.service';

/** Carga, persistencia, eliminación y zoom de la imagen del producto. */
@Component({
  selector: 'app-imagen-producto',
  imports: [NgIcon],
  providers: [provideIcons({ lucideCheck, lucideMaximize2, lucideUpload, lucideX, lucideZoomIn })],
  templateUrl: './imagen-producto.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagenProductoComponent {
  readonly idProducto = input<number | null>(null);
  readonly imagenInicial = input<string | null>(null);

  private readonly productosApi = inject(ProductosApiService);
  private readonly dialogos = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  readonly imagen = signal<string | null>(null);
  readonly archivoSeleccionado = signal<File | null>(null);
  readonly guardando = signal(false);
  readonly zoomAbierto = signal(false);

  constructor() {
    effect(() => {
      const url = this.imagenInicial();
      untracked(() => {
        if (url) {
          this.imagen.set(url);
          this.archivoSeleccionado.set(null);
        }
      });
    });
  }

  cargar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) {
      return;
    }
    this.archivoSeleccionado.set(archivo);
    const lector = new FileReader();
    lector.onload = () => this.imagen.set(lector.result as string);
    lector.readAsDataURL(archivo);
    input.value = '';
  }

  async guardar(): Promise<void> {
    const id = this.idProducto();
    if (!id) {
      await this.dialogos.advertencia(
        'Debes guardar o seleccionar un producto antes de asociarle una imagen.',
      );
      return;
    }

    const archivo = this.archivoSeleccionado();
    if (!archivo) {
      if (!this.imagen()) {
        await this.dialogos.advertencia('Primero selecciona un archivo de imagen para cargar.');
      }
      return;
    }

    this.guardando.set(true);

    this.productosApi
      .subirImagen(id, archivo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.imagen.set(res.url);
          this.archivoSeleccionado.set(null);
          this.guardando.set(false);
          void this.dialogos.exito('Imagen guardada correctamente.', 'Imagen actualizada');
        },
        error: () => {
          this.guardando.set(false);
          void this.dialogos.error('No se pudo guardar la imagen. Inténtalo de nuevo.');
        },
      });
  }

  async eliminar(): Promise<void> {
    if (!this.imagen()) {
      return;
    }

    const id = this.idProducto();
    const esArchivoLocal = this.archivoSeleccionado() !== null;

    if (!id || esArchivoLocal) {
      this.imagen.set(null);
      this.archivoSeleccionado.set(null);
      return;
    }

    const confirmado = await this.dialogos.confirm(
      '¿Deseas eliminar la imagen del producto guardada en el servidor?',
      'Sí, eliminar',
      'Cancelar',
      'warning',
    );

    if (!confirmado) {
      return;
    }

    this.guardando.set(true);

    this.productosApi
      .eliminarImagen(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.imagen.set(null);
          this.archivoSeleccionado.set(null);
          this.guardando.set(false);
          void this.dialogos.exito('Imagen eliminada correctamente.');
        },
        error: () => {
          this.guardando.set(false);
          void this.dialogos.error('No se pudo eliminar la imagen del servidor.');
        },
      });
  }

  abrirZoom(): void {
    if (this.imagen()) {
      this.zoomAbierto.set(true);
    }
  }

  cerrarZoom(): void {
    this.zoomAbierto.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.zoomAbierto()) {
      this.cerrarZoom();
    }
  }

  /** Vacía la previsualización al cambiar de producto. */
  reiniciar(): void {
    this.imagen.set(null);
    this.archivoSeleccionado.set(null);
    this.guardando.set(false);
    this.zoomAbierto.set(false);
  }
}
