import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '@/environments/environment';
import { ConfirmService } from '@/shared/services/confirm.service';
import { PrecioProducto } from '../../../data-access/producto/productos.models';
import { PreciosProductoComponent } from './precios-producto.component';

const BASE = `${environment.apiBaseUrl}/productos`;

function precio(cambios: Partial<PrecioProducto> = {}): PrecioProducto {
  return {
    idPrecio: 3351,
    idProducto: 2337,
    idGrupo: 0,
    nombreGrupo: '',
    idCanal: 1,
    canal: 'CANAL NORMAL',
    observacion: '',
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
      { desde: 12, precio: 1.1 },
    ],
    ...cambios,
  };
}

describe('PreciosProductoComponent — eliminar precio', () => {
  let fixture: ComponentFixture<PreciosProductoComponent>;
  let componente: PreciosProductoComponent;
  let http: HttpTestingController;
  let dialogoConfirm: ReturnType<typeof vi.spyOn>;
  let dialogoExito: ReturnType<typeof vi.spyOn>;
  let dialogoError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PreciosProductoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(PreciosProductoComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);

    const dialogos = TestBed.inject(ConfirmService);
    dialogoConfirm = vi.spyOn(dialogos, 'confirm').mockResolvedValue(true);
    dialogoExito = vi.spyOn(dialogos, 'exito').mockResolvedValue(undefined);
    dialogoError = vi.spyOn(dialogos, 'error').mockResolvedValue(undefined);
  });

  afterEach(() => http.verify());

  it('el aviso nombra el canal y cuántos rangos se van a eliminar', async () => {
    componente.establecer([precio()]);

    await componente.eliminar(precio());
    http.expectOne(`${BASE}/2337/precios/canal/1`).flush(null);

    expect(dialogoConfirm).toHaveBeenCalledWith(
      'Vas a eliminar el precio del canal CANAL NORMAL. Se eliminarán también sus 2 rangos por cantidad. Esta acción no se puede deshacer.',
      'Sí, eliminar',
      'Cancelar',
      'warning'
    );
  });

  it('sin rangos el aviso lo dice en vez de contar cero', async () => {
    const sinRangos = precio({ rangos: [] });
    componente.establecer([sinRangos]);

    await componente.eliminar(sinRangos);
    http.expectOne(`${BASE}/2337/precios/canal/1`).flush(null);

    expect(dialogoConfirm.mock.calls[0][0]).toContain('No tiene rangos por cantidad.');
  });

  it('con un solo rango el aviso va en singular', async () => {
    const unRango = precio({ rangos: [{ desde: 3, precio: 1.2 }] });
    componente.establecer([unRango]);

    await componente.eliminar(unRango);
    http.expectOne(`${BASE}/2337/precios/canal/1`).flush(null);

    expect(dialogoConfirm.mock.calls[0][0]).toContain('su 1 rango por cantidad');
  });

  it('si se cancela no se llama a la API ni se quita la fila', async () => {
    dialogoConfirm.mockResolvedValue(false);
    componente.establecer([precio()]);

    await componente.eliminar(precio());

    http.expectNone(`${BASE}/2337/precios/canal/1`);
    expect(componente.precios().length).toBe(1);
  });

  it('borra el canal entero y quita la fila al confirmar', async () => {
    componente.establecer([precio()]);

    await componente.eliminar(precio());

    const peticion = http.expectOne(`${BASE}/2337/precios/canal/1`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null);

    expect(componente.precios().length).toBe(0);
    expect(dialogoExito).toHaveBeenCalled();
  });

  it('una fila añadida en pantalla se descarta sin tocar la base', async () => {
    componente.agregar();
    const enMemoria = precio({ idProducto: 0, idPrecio: 99, idCanal: null, canal: '' });
    componente.precios.set([enMemoria]);

    await componente.eliminar(enMemoria);

    http.expectNone((peticion) => peticion.method === 'DELETE');
    expect(componente.precios().length).toBe(0);
  });

  it('si la API falla se avisa y la fila se queda', async () => {
    componente.establecer([precio()]);

    await componente.eliminar(precio());
    http
      .expectOne(`${BASE}/2337/precios/canal/1`)
      .flush(null, { status: 404, statusText: 'Not Found' });

    expect(dialogoError).toHaveBeenCalledWith('Ese precio ya no existe en la base.', 'No se pudo eliminar');
    expect(componente.precios().length).toBe(1);
  });
});
