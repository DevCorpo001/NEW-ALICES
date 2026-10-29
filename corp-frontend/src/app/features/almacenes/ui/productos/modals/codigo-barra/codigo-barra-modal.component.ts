import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle, lucidePlus, lucideSave, lucideTrash } from '@ng-icons/lucide';
import { EnterNavigateDirective } from '@/shared/directives/enter-navigate.directive';
import { EnterPrimaryDirective } from '@/shared/directives/enter-primary.directive';
import { AppModalComponent } from '@/shared/ui/modal/app-modal.component';
import { ProductosApiService } from '../../../../data-access/producto/productos-api.service';

interface CodigoBarraRow {
  id: number;
  codigo: string;
}

@Component({
  selector: 'app-codigo-barra-modal',
  imports: [ReactiveFormsModule, NgIcon, AppModalComponent, EnterNavigateDirective, EnterPrimaryDirective],
  providers: [provideIcons({ lucideLoaderCircle, lucidePlus, lucideSave, lucideTrash })],
  templateUrl: './codigo-barra-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodigoBarraModalComponent {
  private readonly productosApi = inject(ProductosApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly abierto = input(false);
  readonly valorInicial = input('');

  readonly cerrar = output();
  readonly guardar = output<string>();

  readonly codigosBarra = signal<CodigoBarraRow[]>([]);
  readonly nuevoCodigoBarra = new FormControl('', { nonNullable: true });

  readonly validando = signal(false);
  readonly error = signal<string | null>(null);

  private codigoBarraId = 1;

  constructor() {
    // `untracked` obligatorio: sin él el efecto se suscribe a su propia salida (ver skill).
    effect(() => {
      if (!this.abierto()) {
        return;
      }
      const inicial = this.valorInicial();
      untracked(() => {
        const filas = this.extraerCodigosBarra(inicial);
        this.codigosBarra.set(filas);
        this.codigoBarraId = filas.reduce((max, row) => Math.max(max, row.id), 0) + 1;
        this.nuevoCodigoBarra.setValue('');
        this.validando.set(false);
        this.error.set(null);
      });
    });
  }

  limpiarError(): void {
    this.error.set(null);
  }

  /** Se valida contra el backend antes de añadir; si la consulta falla, no se añade. */
  agregarCodigoBarra(): void {
    if (this.validando()) {
      return;
    }

    const codigo = this.nuevoCodigoBarra.value.trim();
    if (!codigo) {
      this.error.set('Ingrese un código de barra.');
      return;
    }

    const duplicadoLocal = this.codigosBarra().some(
      (row) => row.codigo.toLowerCase() === codigo.toLowerCase()
    );
    if (duplicadoLocal) {
      this.error.set('Ese código de barra ya está en la lista.');
      return;
    }

    this.validando.set(true);
    this.error.set(null);

    this.productosApi
      .validar({ codigoBarra: codigo })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (validacion) => {
          this.validando.set(false);
          if (validacion.existeBarra) {
            this.error.set('El código de barra ya está registrado en otro producto.');
            return;
          }
          this.codigosBarra.update((list) => [...list, { id: this.codigoBarraId++, codigo }]);
          this.nuevoCodigoBarra.setValue('');
        },
        error: () => {
          this.validando.set(false);
          this.error.set('No se pudo validar el código de barra. Inténtalo de nuevo.');
        },
      });
  }

  eliminarCodigoBarra(id: number): void {
    this.codigosBarra.update((list) => list.filter((row) => row.id !== id));
    this.error.set(null);
  }

  guardarCodigos(): void {
    this.guardar.emit(this.codigosBarra().map((row) => row.codigo).join(', '));
  }

  private extraerCodigosBarra(valor: string): CodigoBarraRow[] {
    return valor
      .split(',')
      .map((codigo) => codigo.trim())
      .filter(Boolean)
      .map((codigo, index) => ({ id: index + 1, codigo }));
  }
}
