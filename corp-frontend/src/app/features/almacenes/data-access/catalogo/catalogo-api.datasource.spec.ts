import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@/environments/environment';
import { CatalogoFila } from '@/shared/ui/catalogo-modal/catalogo-modal.models';
import { CatalogoApiDataSource } from './catalogo-api.datasource';
import { catalogosEndpoints } from './catalogos.endpoints';

const LINEAS = `${environment.apiBaseUrl}/lineas`;
const PROVEEDORES = `${environment.apiBaseUrl}/proveedores`;

describe('CatalogoApiDataSource', () => {
  let http: HttpTestingController;
  let cliente: HttpClient;

  function fuente(id: keyof typeof catalogosEndpoints) {
    return new CatalogoApiDataSource(cliente, catalogosEndpoints[id]);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    cliente = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pide sugerencias por el campo tecleado y solo por ese', () => {
    fuente('linea').sugerencias('nombre', 'LACT').subscribe();

    const peticion = http.expectOne((r) => r.url === `${LINEAS}/autocomplete`);
    expect(peticion.request.params.get('nombre')).toBe('LACT');
    expect(peticion.request.params.has('codigo')).toBe(false);
    peticion.flush([]);
  });

  it('usa los campos propios de cada catálogo', () => {
    fuente('proveedor').sugerencias('razonSocial', 'NESTLE').subscribe();

    const peticion = http.expectOne((r) => r.url === `${PROVEEDORES}/autocomplete`);
    expect(peticion.request.params.get('razonSocial')).toBe('NESTLE');
    peticion.flush([]);
  });

  it('no envía filtros vacíos al listar todo', () => {
    fuente('linea').buscar({ codigo: '', nombre: '' }).subscribe();

    const peticion = http.expectOne((r) => r.url === LINEAS);
    expect(peticion.request.params.keys()).toEqual([]);
    peticion.flush([]);
  });

  it('convierte el DTO tipado en filas de texto y los nulos en cadenas vacías', () => {
    let filas: readonly CatalogoFila[] = [];
    fuente('linea').buscar({}).subscribe((resultado) => (filas = resultado));

    http.expectOne((r) => r.url === LINEAS).flush([
      { idLinea: 1, codigo: '001', nombre: 'ALIMENTOS', abreviado: null },
    ]);

    expect(filas).toEqual([
      { idLinea: '1', codigo: '001', nombre: 'ALIMENTOS', abreviado: '' },
    ]);
  });

  it('traduce un fallo de listado al mensaje del catálogo', () => {
    let mensaje = '';
    fuente('familia')
      .buscar({})
      .subscribe({ error: (error: Error) => (mensaje = error.message) });

    http
      .expectOne((r) => r.url === `${environment.apiBaseUrl}/familias`)
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(mensaje).toBe('No se pudieron cargar las familias.');
  });

  it('envía el alta tal cual y traduce el 409 al mensaje del backend', () => {
    let mensaje = '';
    fuente('clase')
      .crear({ codigo: 'ARR', nombre: 'ARROCES', nombreCorto: 'AR' })
      .subscribe({ error: (error: Error) => (mensaje = error.message) });

    const peticion = http.expectOne(`${environment.apiBaseUrl}/clases`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ codigo: 'ARR', nombre: 'ARROCES', nombreCorto: 'AR' });

    peticion.flush(
      { error: 'Clase.YaExiste', message: 'Error al insertar. La Clase ya existe' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(mensaje).toBe('Error al insertar. La Clase ya existe');
  });

  it('traduce el 400 de validación a un aviso de revisión', () => {
    let mensaje = '';
    fuente('marca')
      .crear({ codigo: '', nombre: '' })
      .subscribe({ error: (error: Error) => (mensaje = error.message) });

    http
      .expectOne(`${environment.apiBaseUrl}/marcas`)
      .flush(null, { status: 400, statusText: 'Bad Request' });

    expect(mensaje).toBe('Revisa los datos ingresados.');
  });

  it('expone código sugerido solo en los catálogos que lo declaran', () => {
    expect(fuente('linea').siguienteCodigo).toBeDefined();
    expect(fuente('familia').siguienteCodigo).toBeDefined();
    expect(fuente('clase').siguienteCodigo).toBeDefined();
    expect(fuente('marca').siguienteCodigo).toBeUndefined();
    expect(fuente('categoria').siguienteCodigo).toBeUndefined();
    expect(fuente('proveedor').siguienteCodigo).toBeUndefined();
  });

  it('devuelve el código sugerido como texto plano', () => {
    let codigo = '';
    fuente('linea').siguienteCodigo!().subscribe((valor) => (codigo = valor));

    http.expectOne(`${LINEAS}/siguiente-codigo`).flush({ codigo: '008' });

    expect(codigo).toBe('008');
  });
});
