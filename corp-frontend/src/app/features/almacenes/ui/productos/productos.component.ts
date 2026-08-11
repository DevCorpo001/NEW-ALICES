import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBox,
  lucideCheck,
  lucideCopy,
  lucideEraser,
  lucideEye,
  lucideHistory,
  lucideImage,
  lucideLayers,
  lucideLightbulb,
  lucideLock,
  lucidePackagePlus,
  lucidePackageSearch,
  lucidePencil,
  lucidePlus,
  lucideRotateCcw,
  lucideSave,
  lucideSearch,
  lucideTrash,
  lucideUpload,
  lucideX,
} from '@ng-icons/lucide';
import { EnterNavigateDirective } from '../../../../shared/directives/enter-navigate.directive';
import { EnterPrimaryDirective } from '../../../../shared/directives/enter-primary.directive';
interface ProductoBuscado {
  codigo: string;
  nombre: string;
}

interface PrecioRow {
  id: number;
  canal: string;
  costeo: number;
  unitario: number;
  fecha: string;
}

@Component({
  selector: 'app-productos',
  imports: [ReactiveFormsModule, NgIcon, EnterNavigateDirective, EnterPrimaryDirective],
  providers: [
    provideIcons({
      lucideBox,
      lucideCheck,
      lucideCopy,
      lucideEraser,
      lucideEye,
      lucideHistory,
      lucideImage,
      lucideLayers,
      lucideLightbulb,
      lucideLock,
      lucidePackagePlus,
      lucidePackageSearch,
      lucidePencil,
      lucidePlus,
      lucideRotateCcw,
      lucideSave,
      lucideSearch,
      lucideTrash,
      lucideUpload,
      lucideX,
    }),
  ],
  templateUrl: './productos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosComponent {
  private readonly fb = inject(FormBuilder);

  readonly buscarProducto = this.fb.nonNullable.control('');
  readonly estado = this.fb.nonNullable.control<'todos' | 'activo' | 'inactivo'>('todos');

  readonly productoBuscado = signal<ProductoBuscado | null>(null);
  readonly precios = signal<PrecioRow[]>([]);
  readonly imagen = signal<string | null>(null);
  readonly guardado = signal(false);

  private priceId = 1;

  readonly modo = computed<'nuevo' | 'editar'>(() =>
    this.productoBuscado() ? 'editar' : 'nuevo'
  );

  readonly formulario = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    abreviaventa: [''],
    codigoBarra: [''],
    nombreTecnico: ['', Validators.required],
    linea: [''],
    marca: [''],
    familia: [''],
    categoria: [''],
    clase: [''],
    proveedor: ['', Validators.required],
    procedencia: [''],
    unidadMedida: ['NIU', Validators.required],
    afectoPercepcion: ['N'],
    estadoProducto: ['A'],
    fechaRegistro: ['', Validators.required]
  });

  buscar(): void {
    const texto = this.buscarProducto.value.trim();
    if (!texto) {
      return;
    }
    this.productoBuscado.set({ codigo: texto, nombre: texto });
    this.formulario.patchValue({ codigo: texto });
    this.formulario.markAsDirty();
    this.guardado.set(false);
  }

  limpiar(): void {
    this.buscarProducto.setValue('');
    this.estado.setValue('todos');
    this.productoBuscado.set(null);
    this.formulario.reset();
    this.precios.set([]);
    this.imagen.set(null);
    this.guardado.set(false);
  }

  nuevo(): void {
    this.limpiar();
  }

  guardarProducto(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardado.set(true);
    this.formulario.markAsPristine();
  }

  buscarGrupoProducto(): void {}

  guardarImagen(): void {}

  onCargarImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.imagen.set(reader.result as string);
    reader.readAsDataURL(file);
    input.value = '';
  }

  eliminarImagen(): void {
    this.imagen.set(null);
  }

  agregarPrecio(): void {
    this.precios.update((list) => [
      ...list,
      { id: this.priceId++, canal: '', costeo: 0, unitario: 0, fecha: this.fechaHoy() },
    ]);
  }

  updatePrecio(id: number, field: 'canal' | 'costeo' | 'unitario', value: string): void {
    this.precios.update((list) =>
      list.map((row) =>
        row.id === id
          ? { ...row, [field]: field === 'canal' ? value : Number(value) || 0 }
          : row
      )
    );
  }

  duplicarPrecio(id: number): void {
    this.precios.update((list) => {
      const index = list.findIndex((row) => row.id === id);
      if (index < 0) {
        return list;
      }
      const copy = { ...list[index], id: this.priceId++, fecha: this.fechaHoy() };
      return [...list.slice(0, index + 1), copy, ...list.slice(index + 1)];
    });
  }

  eliminarPrecio(id: number): void {
    this.precios.update((list) => list.filter((row) => row.id !== id));
  }

  editarPrecio(id: number): void {}

  historialPrecio(id: number): void {}

  private fechaHoy(): string {
    return new Date().toLocaleDateString('es-PE');
  }
}
