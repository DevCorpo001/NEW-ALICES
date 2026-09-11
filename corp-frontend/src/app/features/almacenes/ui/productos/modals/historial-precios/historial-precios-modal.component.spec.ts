import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../../../../environments/environment';
import { HistorialPreciosModalComponent } from './historial-precios-modal.component';

const BASE = `${environment.apiBaseUrl}/productos/precios`;

const CAMBIOS = [
  {
    idCambio: 91,
    fecha: '2026-04-28T15:42:00',
    tipo: 'UPDATE' as const,
    usuario: 'DESARROLLO',
    desde: 3,
    precioUnitario: 1.4,
    unidadesComp: 4,
    unidadesBonificadas: 4,
    descuento1: 4,
    descuento2: 4,
  },
  {
    idCambio: 90,
    fecha: '2026-04-01T09:05:00',
    tipo: 'INSERT' as const,
    usuario: 'ADMIN',
    desde: 1,
    precioUnitario: 1.2,
    unidadesComp: 1,
    unidadesBonificadas: 0,
    descuento1: 0,
    descuento2: 0,
  },
];

describe('HistorialPreciosModalComponent', () => {
  let fixture: ComponentFixture<HistorialPreciosModalComponent>;
  let componente: HistorialPreciosModalComponent;
  let http: HttpTestingController;

  function abrir(idPrecio = 3351, canal: string | null = 'CANAL NORMAL'): void {
    fixture.componentRef.setInput('idPrecio', idPrecio);
    fixture.componentRef.setInput('canal', canal);
    fixture.componentRef.setInput('abierto', true);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HistorialPreciosModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(HistorialPreciosModalComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('no pide nada mientras está cerrado', () => {
    http.expectNone(`${BASE}/3351/historial`);
  });

  it('pide el historial del precio al abrirse', () => {
    abrir();

    http.expectOne(`${BASE}/3351/historial`).flush(CAMBIOS);
    fixture.detectChanges();

    expect(componente.filas().length).toBe(2);
  });

  it('el título lleva el canal del precio', () => {
    abrir();
    http.expectOne(`${BASE}/3351/historial`).flush([]);

    expect(componente.titulo()).toBe('Historial De Cambios - CANAL NORMAL');
  });

  it('sin canal el título se queda sin el sufijo', () => {
    abrir(3351, null);
    http.expectOne(`${BASE}/3351/historial`).flush([]);

    expect(componente.titulo()).toBe('Historial De Cambios');
  });

  it('formatea fecha con hora, importes y porcentajes', () => {
    abrir();
    http.expectOne(`${BASE}/3351/historial`).flush(CAMBIOS);

    const [reciente] = componente.filas();
    expect(reciente.fecha).toBe('28/04/2026 15:42');
    expect(reciente.precio).toBe('1.40');
    expect(reciente.descuento1).toBe('4.00%');
    expect(reciente.desde).toBe('3');
    expect(reciente.unidadesComp).toBe('4');
    expect(reciente.unidadesBonificadas).toBe('4');
  });

  it('traduce el tipo de movimiento a un estado legible', () => {
    abrir();
    http.expectOne(`${BASE}/3351/historial`).flush(CAMBIOS);

    expect(componente.filas().map((fila) => fila.estado)).toEqual(['Modificación', 'Alta']);
  });

  it('sustituye por guion los campos que llegan vacíos', () => {
    abrir();
    http.expectOne(`${BASE}/3351/historial`).flush([
      {
        idCambio: 1,
        fecha: null,
        tipo: null,
        usuario: null,
        desde: null,
        precioUnitario: null,
        unidadesComp: null,
        unidadesBonificadas: null,
        descuento1: null,
        descuento2: null,
      },
    ]);

    const [fila] = componente.filas();
    expect(fila.usuario).toBe('—');
    expect(fila.precio).toBe('—');
    expect(fila.unidadesComp).toBe('—');
    expect(fila.estado).toBe('—');
  });

  it('muestra un mensaje cuando la consulta falla', () => {
    abrir();
    http
      .expectOne(`${BASE}/3351/historial`)
      .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(componente.error()).toBe('No se pudo cargar el historial de cambios.');
    expect(componente.cargando()).toBe(false);
  });
});
