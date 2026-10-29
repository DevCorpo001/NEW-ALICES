import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { environment } from '@/environments/environment';
import { CodigoBarraModalComponent } from './codigo-barra-modal.component';

const URL = `${environment.apiBaseUrl}/productos/validar`;

@Component({
  imports: [CodigoBarraModalComponent],
  template: `
    <app-codigo-barra-modal
      [abierto]="abierto()"
      [valorInicial]="valorInicial()"
      (guardar)="guardados.push($event)"
    />
  `,
})
class HostComponent {
  readonly abierto = signal(true);
  readonly valorInicial = signal('');
  readonly guardados: string[] = [];
}

describe('CodigoBarraModalComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let http: HttpTestingController;

  function modal(): CodigoBarraModalComponent {
    return fixture.debugElement.query(By.directive(CodigoBarraModalComponent)).componentInstance;
  }

  function escribir(codigo: string): void {
    modal().nuevoCodigoBarra.setValue(codigo);
    fixture.detectChanges();
  }

  function codigos(): string[] {
    return modal().codigosBarra().map((fila) => fila.codigo);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('consulta al backend solo con el código de barra', () => {
    escribir('7501234567890');
    modal().agregarCodigoBarra();

    const peticion = http.expectOne((r) => r.url === URL);
    expect(peticion.request.params.get('codigoBarra')).toBe('7501234567890');
    expect(peticion.request.params.has('codigo')).toBe(false);
    expect(peticion.request.params.has('idProducto')).toBe(false);

    peticion.flush({ existeCodigo: false, existeBarra: false });
  });

  it('agrega el código cuando el SP dice que no existe', () => {
    escribir('7501234567890');
    modal().agregarCodigoBarra();
    http.expectOne((r) => r.url === URL).flush({ existeCodigo: false, existeBarra: false });
    fixture.detectChanges();

    expect(codigos()).toEqual(['7501234567890']);
    expect(modal().error()).toBeNull();
    expect(modal().nuevoCodigoBarra.value).toBe('');
  });

  it('rechaza el código cuando ya está registrado en otro producto', () => {
    escribir('7501234567890');
    modal().agregarCodigoBarra();
    http.expectOne((r) => r.url === URL).flush({ existeCodigo: false, existeBarra: true });
    fixture.detectChanges();

    expect(codigos()).toEqual([]);
    expect(modal().error()).toContain('ya está registrado');
  });

  it('no agrega nada si la validación falla', () => {
    escribir('7501234567890');
    modal().agregarCodigoBarra();
    http
      .expectOne((r) => r.url === URL)
      .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(codigos()).toEqual([]);
    expect(modal().error()).toContain('No se pudo validar');
    expect(modal().validando()).toBe(false);
  });

  it('detecta duplicados en la lista sin llamar al backend', () => {
    host.valorInicial.set('7501234567890');
    host.abierto.set(false);
    fixture.detectChanges();
    host.abierto.set(true);
    fixture.detectChanges();

    escribir('7501234567890');
    modal().agregarCodigoBarra();

    http.expectNone((r) => r.url === URL);
    expect(modal().error()).toContain('ya está en la lista');
  });

  it('no llama al backend con el campo vacío', () => {
    escribir('   ');
    modal().agregarCodigoBarra();

    http.expectNone((r) => r.url === URL);
    expect(modal().error()).toContain('Ingrese un código');
  });

  it('ignora pulsaciones repetidas mientras valida', () => {
    escribir('7501234567890');
    modal().agregarCodigoBarra();
    modal().agregarCodigoBarra();

    http.expectOne((r) => r.url === URL).flush({ existeCodigo: false, existeBarra: false });
  });

  it('emite los códigos separados por coma al guardar', () => {
    escribir('111');
    modal().agregarCodigoBarra();
    http.expectOne((r) => r.url === URL).flush({ existeCodigo: false, existeBarra: false });

    escribir('222');
    modal().agregarCodigoBarra();
    http.expectOne((r) => r.url === URL).flush({ existeCodigo: false, existeBarra: false });

    modal().guardarCodigos();

    expect(host.guardados).toEqual(['111, 222']);
  });
});
