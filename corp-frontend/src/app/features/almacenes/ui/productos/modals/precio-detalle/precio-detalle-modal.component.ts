import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideLayers,
  lucidePencil,
  lucidePlus,
  lucideSave,
  lucideTrash,
} from '@ng-icons/lucide';
import { PrecioProducto, PrecioRango } from '../../../../data-access/producto/productos.models';
import { EnterNavigateDirective } from '../../../../../../shared/directives/enter-navigate.directive';
import { EnterPrimaryDirective } from '../../../../../../shared/directives/enter-primary.directive';
import { ConfirmService } from '../../../../../../shared/services/confirm.service';
import { AppModalComponent } from '../../../../../../shared/ui/modal/app-modal.component';
import {
  aNumero,
  aTextoDecimal,
  asegurarRangosBase,
  costo,
  costoConDescuentos,
  esRangoBase,
  margen,
  neto,
} from '../../precios/precios.calculos';

/** Valores editados que devuelve el modal, alineados con `PrecioProducto`. */
export interface PrecioDetalleGuardar {
  readonly canal: string;
  readonly precioCosto: number;
  readonly precioCostoBase: number;
  readonly precioCostoDescuento: number;
  readonly precioUnitario: number;
  readonly precioMayorista: number;
  readonly unidadesComp: number;
  readonly unidadesBonificadas: number;
  readonly descuento1: number;
  readonly descuento2: number;
  readonly descuento3: number;
  readonly descuento4: number;
  readonly observacion: string;
  /** `yyyy-MM-dd`, tal como lo entrega el input de fecha. */
  readonly fechaModificacion: string;
  readonly rangos: readonly PrecioRango[];
}

/** Ficha de un precio; toda la aritmética vive en `precios.calculos.ts`. */
@Component({
  selector: 'app-precio-detalle-modal',
  imports: [ReactiveFormsModule, NgIcon, AppModalComponent, EnterNavigateDirective, EnterPrimaryDirective],
  providers: [
    provideIcons({ lucideCheck, lucideLayers, lucidePencil, lucidePlus, lucideSave, lucideTrash }),
  ],
  templateUrl: './precio-detalle-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrecioDetalleModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly confirmar = inject(ConfirmService);

  readonly abierto = input(false);
  readonly precio = input<PrecioProducto | null>(null);
  readonly usuarioActual = input('ADMIN');

  readonly cerrar = output();
  readonly guardar = output<PrecioDetalleGuardar>();

  readonly rangos = signal<readonly PrecioRango[]>([]);
  readonly editandoIndice = signal<number | null>(null);
  private readonly rangosTocados = signal(false);

  /** El canal no se cambia sobre un precio ya existente. */
  readonly canalFijo = computed(() => this.precio() !== null);

  /** En la cabecera manda el usuario que tocó el precio, no el de la sesión. */
  readonly usuario = computed(() => this.precio()?.usuario?.trim() || this.usuarioActual());

  readonly formulario = this.fb.nonNullable.group({
    canal: [''],
    precioBase: [''],
    precioBruto: [''],
    precioCosto: [''],
    precioNeto: [''],
    descuento1er: [''],
    descuento2do: [''],
    unidades: ['1'],
    bonificacion: ['0'],
    descuento3er: [''],
    descuento4to: [''],
    precioVentaUnitario: ['', Validators.required],
    precioUnitVenta: [''],
    precioRefUndDoc: ['', Validators.required],
    precioUnitMayor: [''],
    observacionesCosto: [''],
    ultimaVariacion: [''],
  });

  /** Porcentaje de cada rango respecto al costo, para pintarlo en la tabla. */
  readonly variaciones = computed(() => {
    const costoUnitario = aNumero(this.formulario.controls.precioCosto.value);
    return this.rangos().map((rango) => margen(rango.precio, costoUnitario));
  });

  constructor() {
    effect(() => {
      if (!this.abierto()) {
        return;
      }
      const precio = this.precio();
      untracked(() => this.volcar(precio));
    });

    // Las escrituras van con `emitEvent: false`, así que no se realimenta.
    this.formulario.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.recalcular());
  }

  // ── Carga ───────────────────────────────────────────────────────────────
  private volcar(precio: PrecioProducto | null): void {
    this.editandoIndice.set(null);
    this.rangosTocados.set(false);

    if (!precio) {
      this.formulario.reset({ unidades: '1', bonificacion: '0' });
      this.rangos.set([]);
      this.recalcular();
      this.formulario.markAsPristine();
      return;
    }

    this.formulario.patchValue(
      {
        canal: precio.canal ?? '',
        precioBase: aTextoDecimal(precio.precioCostoBase),
        unidades: `${precio.unidadesComp || 1}`,
        bonificacion: `${precio.unidadesBonificadas || 0}`,
        descuento1er: aTextoDecimal(precio.descuento1),
        descuento2do: aTextoDecimal(precio.descuento2),
        descuento3er: aTextoDecimal(precio.descuento3),
        descuento4to: aTextoDecimal(precio.descuento4),
        precioVentaUnitario: aTextoDecimal(precio.precioUnitario),
        precioRefUndDoc: aTextoDecimal(precio.precioMayorista),
        observacionesCosto: precio.observacion ?? '',
        ultimaVariacion: (precio.fechaModificacion ?? '').slice(0, 10),
      },
      { emitEvent: false }
    );

    this.rangos.set(
      asegurarRangosBase(precio.rangos ?? [], precio.precioUnitario, precio.precioMayorista)
    );
    this.recalcular();
    this.formulario.markAsPristine();
  }

  /** Rellena los derivados: el costo sale del costeo y los márgenes se miden contra él. */
  private recalcular(): void {
    const controles = this.formulario.controls;
    const base = aNumero(controles.precioBase.value);
    const descuentos = [
      aNumero(controles.descuento1er.value),
      aNumero(controles.descuento2do.value),
      aNumero(controles.descuento3er.value),
      aNumero(controles.descuento4to.value),
    ];

    const costoUnitario = costo({
      base,
      unidades: aNumero(controles.unidades.value),
      bonificacion: aNumero(controles.bonificacion.value),
      descuentos,
    });

    this.formulario.patchValue(
      {
        precioNeto: aTextoDecimal(neto(base)),
        precioBruto: aTextoDecimal(neto(base)),
        precioCosto: aTextoDecimal(costoUnitario),
        precioUnitVenta: aTextoDecimal(
          margen(aNumero(controles.precioVentaUnitario.value), costoUnitario)
        ),
        precioUnitMayor: aTextoDecimal(
          margen(aNumero(controles.precioRefUndDoc.value), costoUnitario)
        ),
      },
      { emitEvent: false }
    );
  }

  // ── Cierre con cambios sin guardar ──────────────────────────────────────
  /** Método y no `computed`: `formulario.dirty` no es señal y quedaría cacheado. */
  hayCambios(): boolean {
    return this.rangosTocados() || this.formulario.dirty;
  }

  async intentarCerrar(): Promise<void> {
    if (!this.hayCambios()) {
      this.cerrar.emit();
      return;
    }

    const descartar = await this.confirmar.confirm(
      'Hay cambios sin guardar en este precio. Si sales se perderán.',
      'Sí, descartar',
      'Seguir editando',
      'warning'
    );

    if (descartar) {
      this.cerrar.emit();
    }
  }

  // ── Rangos por cantidad ─────────────────────────────────────────────────
  esBase(desde: number): boolean {
    return esRangoBase(desde);
  }

  agregarRango(): void {
    this.rangos.update((lista) => [...lista, { desde: 0, precio: 0 }]);
    this.editandoIndice.set(this.rangos().length - 1);
    this.rangosTocados.set(true);
  }

  editarRango(indice: number): void {
    this.editandoIndice.set(indice);
  }

  actualizarRango(indice: number, campo: 'desde' | 'precio', valor: string): void {
    this.rangos.update((lista) =>
      lista.map((rango, i) => (i === indice ? { ...rango, [campo]: aNumero(valor) } : rango))
    );
    this.rangosTocados.set(true);
  }

  confirmarRango(): void {
    this.editandoIndice.set(null);
    this.rangos.update((lista) => [...lista].sort((a, b) => a.desde - b.desde));
  }

  eliminarRango(indice: number): void {
    const rango = this.rangos()[indice];
    if (!rango || esRangoBase(rango.desde)) {
      return;
    }
    this.rangos.update((lista) => lista.filter((_, i) => i !== indice));
    this.editandoIndice.set(null);
    this.rangosTocados.set(true);
  }

  // ── Guardar ─────────────────────────────────────────────────────────────
  emitirGuardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const unitario = aNumero(valores.precioVentaUnitario);
    const mayorista = aNumero(valores.precioRefUndDoc);
    const base = aNumero(valores.precioBase);
    const descuentos = [
      aNumero(valores.descuento1er),
      aNumero(valores.descuento2do),
      aNumero(valores.descuento3er),
      aNumero(valores.descuento4to),
    ];

    this.guardar.emit({
      canal: valores.canal,
      precioCosto: aNumero(valores.precioCosto),
      precioCostoBase: base,
      // La base lo guarda aunque el modal no lo muestre.
      precioCostoDescuento: costoConDescuentos(base, descuentos),
      precioUnitario: unitario,
      precioMayorista: mayorista,
      unidadesComp: aNumero(valores.unidades),
      unidadesBonificadas: aNumero(valores.bonificacion),
      descuento1: descuentos[0],
      descuento2: descuentos[1],
      descuento3: descuentos[2],
      descuento4: descuentos[3],
      observacion: valores.observacionesCosto,
      fechaModificacion: valores.ultimaVariacion,
      rangos: asegurarRangosBase(this.rangos(), unitario, mayorista),
    });
  }
}
