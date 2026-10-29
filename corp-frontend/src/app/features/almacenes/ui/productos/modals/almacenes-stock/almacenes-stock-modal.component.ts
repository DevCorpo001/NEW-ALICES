import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideWarehouse, lucideX } from '@ng-icons/lucide';
import { ConfirmService } from '@/shared/services/confirm.service';
import { AppModalComponent } from '@/shared/ui/modal/app-modal.component';
import { ProductosApiService } from '../../../../data-access/producto/productos-api.service';
import { AjusteStockItem, StockAlmacen } from '../../../../data-access/producto/productos.models';

export interface FilaStockAlmacen {
  readonly idAlmacen: number;
  readonly descripcion: string;
  readonly existencias: number;
  cantidadSuma: number | null;
  cantidadActualizacion: number | null;
}

@Component({
  selector: 'app-almacenes-stock-modal',
  imports: [FormsModule, AppModalComponent, NgIcon],
  providers: [provideIcons({ lucideCheck, lucideWarehouse, lucideX })],
  templateUrl: './almacenes-stock-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlmacenesStockModalComponent {
  readonly abierto = input(false);
  readonly idPrecio = input<number | null>(null);
  readonly canal = input<string | null>(null);
  readonly cerrar = output();
  readonly guardado = output();

  private readonly productosApi = inject(ProductosApiService);
  private readonly dialogos = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  readonly filas = signal<FilaStockAlmacen[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);

  readonly titulo = computed(() => {
    const canal = this.canal()?.trim();
    return canal ? `Almacenes - Canal: ${canal}` : 'Almacenes';
  });

  constructor() {
    effect(() => {
      const abierto = this.abierto();
      const idPrecio = this.idPrecio();

      if (!abierto || idPrecio === null) {
        untracked(() => this.limpiar());
        return;
      }

      untracked(() => this.cargar(idPrecio));
    });
  }

  private cargar(idPrecio: number): void {
    this.cargando.set(true);
    this.error.set(null);

    this.productosApi
      .listarStockAlmacen(idPrecio)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (almacenes) => {
          this.filas.set(
            almacenes.map((a) => ({
              idAlmacen: a.idAlmacen,
              descripcion: a.descripcionAlmacen,
              existencias: a.cantidad,
              cantidadSuma: null,
              cantidadActualizacion: null,
            })),
          );
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(
            err.status === 404
              ? 'No se encontraron almacenes registrados.'
              : 'Error al consultar almacenes. Inténtalo de nuevo.',
          );
          this.cargando.set(false);
        },
      });
  }

  async guardar(): Promise<void> {
    const idPrecio = this.idPrecio();
    if (!idPrecio) {
      return;
    }

    const ajustes: AjusteStockItem[] = [];

    for (const fila of this.filas()) {
      if (fila.cantidadActualizacion !== null && fila.cantidadActualizacion !== undefined && !Number.isNaN(fila.cantidadActualizacion)) {
        ajustes.push({
          idAlmacen: fila.idAlmacen,
          cantidad: Number(fila.cantidadActualizacion),
          operacion: 'actualizar',
        });
      } else if (fila.cantidadSuma !== null && fila.cantidadSuma !== undefined && !Number.isNaN(fila.cantidadSuma) && fila.cantidadSuma !== 0) {
        ajustes.push({
          idAlmacen: fila.idAlmacen,
          cantidad: Number(fila.cantidadSuma),
          operacion: 'sumar',
        });
      }
    }

    if (ajustes.length === 0) {
      await this.dialogos.advertencia('No has ingresado ninguna cantidad para sumar o actualizar.');
      return;
    }

    this.guardando.set(true);

    this.productosApi
      .actualizarStockAlmacen(idPrecio, ajustes)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          void this.dialogos.exito('Existencias actualizadas correctamente.');
          this.guardado.emit();
          this.cerrar.emit();
        },
        error: () => {
          this.guardando.set(false);
          void this.dialogos.error('No se pudieron actualizar las existencias. Inténtalo de nuevo.');
        },
      });
  }

  private limpiar(): void {
    this.filas.set([]);
    this.cargando.set(false);
    this.guardando.set(false);
    this.error.set(null);
  }
}
