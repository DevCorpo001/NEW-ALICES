import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PrecioProducto } from '../../../../data-access/producto/productos.models';
import { ConfirmService } from '@/shared/services/confirm.service';
import {
  PrecioDetalleGuardar,
  PrecioDetalleModalComponent,
} from './precio-detalle-modal.component';

/** Fila real del canal normal del producto 20740148. */
const PRECIO: PrecioProducto = {
  idPrecio: 3351,
  idProducto: 2337,
  idGrupo: 0,
  nombreGrupo: '',
  idCanal: 1,
  canal: 'CANAL NORMAL',
  observacion: 'Costeo revisado',
  usuario: 'DESARROLLO',
  precioUnitario: 1.4,
  precioMayorista: 0,
  precioDocena: 0,
  precioCosto: 2,
  precioCostoBase: 4,
  precioCostoDescuento: 4.01,
  unidadesComp: 4,
  unidadesBonificadas: 4,
  descuento1: 4,
  descuento2: 4,
  descuento3: 4,
  descuento4: 4,
  fechaModificacion: '2026-04-28T00:00:00',
  rangos: [
    { desde: 3, precio: 1.2 },
    { desde: 12, precio: 1.2 },
  ],
};

@Component({
  imports: [PrecioDetalleModalComponent],
  template: `
    <app-precio-detalle-modal
      [abierto]="abierto()"
      [precio]="precio()"
      usuarioActual="ADMIN"
      (guardar)="guardados.push($event)"
    />
  `,
})
class HostComponent {
  readonly abierto = signal(true);
  readonly precio = signal<PrecioProducto | null>(PRECIO);
  readonly guardados: PrecioDetalleGuardar[] = [];
}

describe('PrecioDetalleModalComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function modal(): PrecioDetalleModalComponent {
    return fixture.debugElement.query(By.directive(PrecioDetalleModalComponent)).componentInstance;
  }

  function valor(campo: string): string {
    return (modal().formulario.getRawValue() as Record<string, string>)[campo];
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('vuelca el costeo del precio recibido', () => {
    expect(valor('canal')).toBe('CANAL NORMAL');
    expect(valor('precioBase')).toBe('4.00');
    expect(valor('unidades')).toBe('4');
    expect(valor('bonificacion')).toBe('4');
  });

  it('deriva el precio costo del costeo, sin leerlo de la API', () => {
    // 4 x 4/(4+4) x 0.96^4 x 1.18 → coincide con el 2.00 que guarda la base
    expect(valor('precioCosto')).toBe('2.00');
  });

  it('deriva el costo con descuento al guardar, aunque no se muestre', () => {
    modal().emitirGuardar();

    // 4 x 0.96^4 x 1.18 → coincide con el 4.01 que guarda la base
    expect(host.guardados[0].precioCostoDescuento).toBe(4.01);
  });

  it('vuelca los cuatro descuentos', () => {
    expect(valor('descuento1er')).toBe('4.00');
    expect(valor('descuento2do')).toBe('4.00');
    expect(valor('descuento3er')).toBe('4.00');
    expect(valor('descuento4to')).toBe('4.00');
  });

  it('vuelca los precios de venta, la observación y la fecha', () => {
    expect(valor('precioVentaUnitario')).toBe('1.40');
    expect(valor('precioRefUndDoc')).toBe('0.00');
    expect(valor('observacionesCosto')).toBe('Costeo revisado');
    expect(valor('ultimaVariacion')).toBe('2026-04-28');
  });

  it('calcula el neto sumando el IGV al base', () => {
    expect(valor('precioNeto')).toBe('4.72');
  });

  it('el bruto es el base con IGV', () => {
    expect(valor('precioBruto')).toBe('4.72');
  });

  it('recalcula el costo al cambiar la bonificación', () => {
    modal().formulario.controls.bonificacion.setValue('0');
    fixture.detectChanges();

    // Sin bonificación desaparece el reparto: 4 x 0.96^4 x 1.18
    expect(valor('precioCosto')).toBe('4.01');
  });

  it('calcula los márgenes sobre el costo', () => {
    // 1.40 sobre un costo de 2.00 → -30%
    expect(valor('precioUnitVenta')).toBe('-30.00');
    // sin mayorista informado el margen es 0, no Infinity
    expect(valor('precioUnitMayor')).toBe('0.00');
  });

  it('recalcula los derivados al editar el costeo', () => {
    modal().formulario.controls.precioBase.setValue('10');
    fixture.detectChanges();

    expect(valor('precioNeto')).toBe('11.80');
  });

  it('garantiza el rango unitario y conserva los demás ordenados', () => {
    expect(modal().rangos()).toEqual([
      { desde: 1, precio: 1.4 },
      { desde: 3, precio: 1.2 },
      { desde: 12, precio: 1.2 },
    ]);
  });

  it('calcula la variación de cada rango sobre el costo', () => {
    // 1.40 → -30%, 1.20 → -40%
    expect(modal().variaciones()).toEqual([-30, -40, -40]);
  });

  it('no deja eliminar los rangos base', () => {
    modal().eliminarRango(0);
    expect(modal().rangos().length).toBe(3);

    modal().eliminarRango(2);
    expect(modal().rangos().map((r) => r.desde)).toEqual([1, 3]);
  });

  it('toma el usuario del precio, no el de la sesión', () => {
    expect(modal().usuario()).toBe('DESARROLLO');
  });

  it('fija el canal cuando se edita un precio existente', () => {
    expect(modal().canalFijo()).toBe(true);
  });

  it('con un precio nuevo arranca vacío y con el canal editable', () => {
    host.precio.set(null);
    host.abierto.set(false);
    fixture.detectChanges();
    host.abierto.set(true);
    fixture.detectChanges();

    expect(modal().canalFijo()).toBe(false);
    expect(valor('precioBase')).toBe('');
    expect(modal().rangos()).toEqual([]);
    expect(modal().usuario()).toBe('ADMIN');
  });

  it('devuelve lo editado con los rangos garantizados', () => {
    modal().formulario.controls.precioRefUndDoc.setValue('1.25');
    fixture.detectChanges();

    modal().emitirGuardar();

    expect(host.guardados.length).toBe(1);
    const guardado = host.guardados[0];
    expect(guardado.precioCosto).toBe(2);
    expect(guardado.precioUnitario).toBe(1.4);
    expect(guardado.precioMayorista).toBe(1.25);
    expect(guardado.unidadesComp).toBe(4);
    expect(guardado.observacion).toBe('Costeo revisado');
    // El mayorista informado se refleja en el rango 3.
    expect(guardado.rangos).toContainEqual({ desde: 3, precio: 1.25 });
  });

  it('no guarda si faltan los precios obligatorios', () => {
    modal().formulario.controls.precioVentaUnitario.setValue('');
    fixture.detectChanges();

    modal().emitirGuardar();

    expect(host.guardados).toEqual([]);
  });

  describe('cierre con cambios sin guardar', () => {
    it('arranca sin cambios pendientes tras cargar el precio', () => {
      expect(modal().hayCambios()).toBe(false);
    });

    it('cierra directo cuando no se tocó nada', async () => {
      let cerrado = false;
      modal().cerrar.subscribe(() => (cerrado = true));

      await modal().intentarCerrar();

      expect(cerrado).toBe(true);
    });

    it('detecta que el formulario fue editado', () => {
      modal().formulario.controls.precioBase.markAsDirty();
      expect(modal().hayCambios()).toBe(true);
    });

    it('detecta que los rangos fueron tocados', () => {
      modal().actualizarRango(0, 'precio', '5');
      expect(modal().hayCambios()).toBe(true);
    });

    it('pide confirmación y respeta el "seguir editando"', async () => {
      const confirmar = vi
        .spyOn(TestBed.inject(ConfirmService), 'confirm')
        .mockResolvedValue(false);
      let cerrado = false;
      modal().cerrar.subscribe(() => (cerrado = true));

      modal().formulario.controls.precioBase.markAsDirty();
      await modal().intentarCerrar();

      expect(confirmar).toHaveBeenCalled();
      expect(cerrado).toBe(false);
    });

    it('cierra cuando se confirma el descarte', async () => {
      vi.spyOn(TestBed.inject(ConfirmService), 'confirm').mockResolvedValue(true);
      let cerrado = false;
      modal().cerrar.subscribe(() => (cerrado = true));

      modal().formulario.controls.precioBase.markAsDirty();
      await modal().intentarCerrar();

      expect(cerrado).toBe(true);
    });
  });
});
