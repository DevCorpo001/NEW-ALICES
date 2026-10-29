import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConfirmService } from '@/shared/services/confirm.service';
import { ProductosApiService } from '../../../../data-access/producto/productos-api.service';
import { ProductoProveedor } from '../../../../data-access/producto/productos.models';
import {
  DesvincularProveedorEvento,
  ProveedoresAsociadosModalComponent,
} from './proveedores-asociados-modal.component';

const PROVEEDORES_MOCK: ProductoProveedor[] = [
  {
    idProductoProveedor: 10,
    idProducto: 123,
    idProveedor: 456,
    ruc: '20502121147',
    razonSocial: 'I.Q.S.ANDINA S.A.',
  },
  {
    idProductoProveedor: 11,
    idProducto: 123,
    idProveedor: 789,
    ruc: '20100055231',
    razonSocial: 'DISTRIBUIDORA LIMA S.A.C.',
  },
];

@Component({
  imports: [ProveedoresAsociadosModalComponent],
  template: `
    <app-proveedores-asociados-modal
      [abierto]="abierto()"
      [idProducto]="idProducto()"
      [codigoProducto]="codigo()"
      [descripcionProducto]="descripcion()"
      (desvincular)="desvinculado = $event"
      (cerrar)="abierto.set(false)"
    />
  `,
})
class HostComponent {
  abierto = signal(false);
  idProducto = signal<number | null>(null);
  codigo = signal<string | null>('P001');
  descripcion = signal<string | null>('Producto Test');
  desvinculado: DesvincularProveedorEvento | null = null;
}

describe('ProveedoresAsociadosModalComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let productosApi: ProductosApiService;
  let confirmService: ConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    productosApi = TestBed.inject(ProductosApiService);
    confirmService = TestBed.inject(ConfirmService);
  });

  it('al abrirse con idProducto carga la lista de proveedores asociados', () => {
    const spy = vi.spyOn(productosApi, 'listarProveedoresProducto').mockReturnValue(of(PROVEEDORES_MOCK));

    host.idProducto.set(123);
    host.abierto.set(true);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(123);
  });

  it('al asociar un proveedor seleccionado invoca a la API y recarga la lista', () => {
    vi.spyOn(productosApi, 'listarProveedoresProducto').mockReturnValue(of(PROVEEDORES_MOCK));
    const spyAsociar = vi.spyOn(productosApi, 'asociarProveedorProducto').mockReturnValue(of({ mensaje: 'ok' }));

    host.idProducto.set(123);
    host.abierto.set(true);
    fixture.detectChanges();

    const modal = fixture.debugElement.children[0].componentInstance as ProveedoresAsociadosModalComponent;
    modal.seleccionarYAsociar({
      idProveedor: 999,
      ruc: '20123456789',
      razonSocial: 'NUEVO PROVEEDOR',
    });

    expect(spyAsociar).toHaveBeenCalledWith(123, 999);
  });

  it('al eliminar pide confirmación y desvincula el proveedor', async () => {
    vi.spyOn(productosApi, 'listarProveedoresProducto').mockReturnValue(of(PROVEEDORES_MOCK));
    const spyEliminar = vi.spyOn(productosApi, 'eliminarProveedorProducto').mockReturnValue(of(undefined));
    const spyConfirm = vi.spyOn(confirmService, 'confirm').mockResolvedValue(true);

    host.idProducto.set(123);
    host.abierto.set(true);
    fixture.detectChanges();

    const modal = fixture.debugElement.children[0].componentInstance as ProveedoresAsociadosModalComponent;
    await modal.eliminarProveedor(PROVEEDORES_MOCK[0]);

    expect(spyConfirm).toHaveBeenCalled();
    expect(spyEliminar).toHaveBeenCalledWith(123, 10);
    expect(host.desvinculado).toEqual({
      proveedor: PROVEEDORES_MOCK[0],
      quedanProveedores: true,
    });
  });

  it('si el usuario cancela la confirmación no llama a la API de eliminación', async () => {
    vi.spyOn(productosApi, 'listarProveedoresProducto').mockReturnValue(of(PROVEEDORES_MOCK));
    const spyEliminar = vi.spyOn(productosApi, 'eliminarProveedorProducto').mockReturnValue(of(undefined));
    vi.spyOn(confirmService, 'confirm').mockResolvedValue(false);

    host.idProducto.set(123);
    host.abierto.set(true);
    fixture.detectChanges();

    const modal = fixture.debugElement.children[0].componentInstance as ProveedoresAsociadosModalComponent;
    await modal.eliminarProveedor(PROVEEDORES_MOCK[0]);

    expect(spyEliminar).not.toHaveBeenCalled();
  });

  it('al teclear en el autocomplete de razon social consulta el endpoint de sugerencias', () => {
    const httpTesting = TestBed.inject(HttpTestingController);
    host.abierto.set(true);
    fixture.detectChanges();

    const modal = fixture.debugElement.children[0].componentInstance as ProveedoresAsociadosModalComponent;
    modal.onBuscarSugerencias('razonSocial', 'LIMA');

    const req = httpTesting.expectOne((r) => r.url.includes('/api/proveedores/autocomplete') && r.params.get('razonSocial') === 'LIMA');
    req.flush([
      { idProveedor: 789, ruc: '20100055231', razonSocial: 'DISTRIBUIDORA LIMA S.A.C.' },
    ]);

    expect(modal.sugerencias().length).toBe(1);
    expect(modal.opcionesSugeridas().length).toBe(1);
    expect(modal.opcionesSugeridas()[0].principal).toBe('DISTRIBUIDORA LIMA S.A.C.');
    expect(modal.opcionesSugeridas()[0].secundario).toBe('20100055231');
  });

  it('al elegir una sugerencia de autocompletado actualiza los controles y resultados', () => {
    host.abierto.set(true);
    fixture.detectChanges();

    const modal = fixture.debugElement.children[0].componentInstance as ProveedoresAsociadosModalComponent;
    const prov = { idProveedor: 789, ruc: '20100055231', razonSocial: 'DISTRIBUIDORA LIMA S.A.C.' };

    modal.onElegirSugerencia('razonSocial', prov);

    expect(modal.filtroRucControl.value).toBe('20100055231');
    expect(modal.filtroRazonSocialControl.value).toBe('DISTRIBUIDORA LIMA S.A.C.');
    expect(modal.resultadosBusqueda()).toEqual([prov]);
    expect(modal.haBuscado()).toBe(true);
  });
});
