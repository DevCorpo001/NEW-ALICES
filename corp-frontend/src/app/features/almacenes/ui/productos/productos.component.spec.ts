import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { ProductosComponent } from './productos.component';

const BASE = `${environment.apiBaseUrl}/productos`;

const DETALLE = {
  idProducto: 2337,
  codigoProducto: '20740148',
  descripcion: 'LIMA ANNY METAL*SIMPLE',
  nombreCorto: 'LIMA ANNY',
  percepcion: 'N',
  estado: 'A',
  observacionCosteo: '',
  origen: 'L',
  unidad: 'NIU',
  fechaRegistro: '2018-09-01T00:00:00',
  linea: { id: 356, codigo: '356', nombre: 'GRANBELL', abreviado: '' },
  familia: { id: 129, codigo: '124', nombre: 'LIMAS DE UÑAS', abreviado: '' },
  clase: { id: 0, codigo: '', nombre: '', abreviado: '' },
  marca: { id: null, codigo: '', nombre: '' },
  categoria: { id: null, codigo: '', nombre: '' },
  proveedor: {
    idProveedor: 462,
    ruc: '20502121147',
    razonSocial: 'I.Q.S.ANDINA S.A.',
    nombreComercial: '',
    direccion: 'CALLE OCTAVIO PAZ',
    fechaRegistro: '1908-10-04T00:00:00',
  },
  grupo: { idGrupo: 0, descripcion: '' },
};

const PRECIOS = [
  {
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
    rangos: [{ desde: 3, precio: 1.2 }],
  },
];

const BARRAS = [
  { idBarra: 1, codigo: '207481111489' },
  { idBarra: 2, codigo: '207481111490' },
];

describe('ProductosComponent — carga de la ficha', () => {
  let fixture: ComponentFixture<ProductosComponent>;
  let componente: ProductosComponent;
  let http: HttpTestingController;
  let dialogoExito: ReturnType<typeof vi.spyOn>;
  let dialogoError: ReturnType<typeof vi.spyOn>;
  let dialogoAdvertencia: ReturnType<typeof vi.spyOn>;

  function seleccionar(): void {
    componente.seleccionarProducto({
      idProducto: 2337,
      codigoProducto: '20740148',
      descripcion: 'LIMA ANNY METAL*SIMPLE',
      estado: 'A',
    });
    fixture.detectChanges();
  }

  function responder(detalle = DETALLE, precios = PRECIOS, barras = BARRAS): void {
    http.expectOne((r) => r.url === `${BASE}/buscar`).flush(detalle);
    http.expectOne(`${BASE}/2337/precios`).flush(precios);
    http.expectOne(`${BASE}/2337/codigos-barra`).flush(barras);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductosComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(ProductosComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);

    // Se interceptan los diálogos: SweetAlert2 abriría ventanas reales en las pruebas.
    const dialogos = TestBed.inject(ConfirmService);
    dialogoExito = vi.spyOn(dialogos, 'exito').mockResolvedValue(undefined);
    dialogoError = vi.spyOn(dialogos, 'error').mockResolvedValue(undefined);
    dialogoAdvertencia = vi.spyOn(dialogos, 'advertencia').mockResolvedValue(undefined);
  });

  afterEach(() => http.verify());

  it('consulta la ficha por código y luego precios y barras por id', () => {
    seleccionar();

    const ficha = http.expectOne((r) => r.url === `${BASE}/buscar`);
    expect(ficha.request.params.get('codigoProducto')).toBe('20740148');
    ficha.flush(DETALLE);

    http.expectOne(`${BASE}/2337/precios`).flush(PRECIOS);
    http.expectOne(`${BASE}/2337/codigos-barra`).flush(BARRAS);
  });

  it('rellena el formulario con los datos del producto', () => {
    seleccionar();
    responder();

    const valores = componente.formulario.getRawValue();
    expect(valores.codigo).toBe('20740148');
    expect(valores.nombreTecnico).toBe('LIMA ANNY METAL*SIMPLE');
    expect(valores.abreviaventa).toBe('LIMA ANNY');
    expect(valores.procedencia).toBe('L');
    expect(valores.estadoProducto).toBe('A');
    expect(valores.afectoPercepcion).toBe('N');
  });

  it('muestra la descripción del catálogo, no su código', () => {
    seleccionar();
    responder();

    const valores = componente.formulario.getRawValue();
    expect(valores.linea).toBe('GRANBELL');
    expect(valores.familia).toBe('LIMAS DE UÑAS');
    expect(valores.proveedor).toBe('I.Q.S.ANDINA S.A.');
  });

  it('cae al código cuando el catálogo no tiene descripción', () => {
    seleccionar();
    responder({
      ...DETALLE,
      linea: { id: 356, codigo: '356', nombre: '', abreviado: '' },
      proveedor: { ...DETALLE.proveedor, razonSocial: '' },
    });

    const valores = componente.formulario.getRawValue();
    expect(valores.linea).toBe('356');
    expect(valores.proveedor).toBe('20502121147');
  });

  it('convierte la fecha ISO al formato del input de fecha', () => {
    seleccionar();
    responder();

    expect(componente.formulario.getRawValue().fechaRegistro).toBe('2018-09-01');
  });

  it('deja el formulario sin cambios pendientes tras cargar', () => {
    seleccionar();
    responder();

    expect(componente.formulario.pristine).toBe(true);
  });

  it('rellena el código de barra con todos los códigos del producto', () => {
    seleccionar();
    responder();

    expect(componente.formulario.getRawValue().codigoBarra).toBe(
      '207481111489, 207481111490'
    );
  });

  it('deja vacío el código de barra si el producto no tiene ninguno', () => {
    seleccionar();
    responder(DETALLE, PRECIOS, []);

    expect(componente.formulario.getRawValue().codigoBarra).toBe('');
  });

  it('rellena la lista de precios y formatea la fecha de modificación', () => {
    seleccionar();
    responder();

    const precios = fixture.nativeElement as HTMLElement;
    expect(precios.textContent).toContain('CANAL NORMAL');
    expect(precios.textContent).toContain('28/04/2026');
  });

  it('sigue rellenando el formulario aunque fallen precios y barras', () => {
    seleccionar();

    http.expectOne((r) => r.url === `${BASE}/buscar`).flush(DETALLE);
    http.expectOne(`${BASE}/2337/precios`).flush(null, { status: 500, statusText: 'Error' });
    http
      .expectOne(`${BASE}/2337/codigos-barra`)
      .flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(componente.formulario.getRawValue().codigo).toBe('20740148');
    expect(componente.errorFicha()).toBeNull();
  });

  it('avisa si no se puede recuperar la ficha', () => {
    seleccionar();

    http
      .expectOne((r) => r.url === `${BASE}/buscar`)
      .flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(componente.errorFicha()).toContain('No se pudieron cargar');
    expect(componente.cargandoFicha()).toBe(false);
  });

  it('limpiar deja la pantalla en blanco', () => {
    seleccionar();
    responder();

    componente.limpiar();
    fixture.detectChanges();

    expect(componente.productoSeleccionado()).toBeNull();
    expect(componente.formulario.getRawValue().codigo).toBe('');
    expect(componente.errorFicha()).toBeNull();
  });

  describe('fecha de registro', () => {
    /** `yyyy-MM-dd` de hoy en hora local, igual que el componente. */
    function hoy(): string {
      const ahora = new Date();
      const mes = `${ahora.getMonth() + 1}`.padStart(2, '0');
      const dia = `${ahora.getDate()}`.padStart(2, '0');
      return `${ahora.getFullYear()}-${mes}-${dia}`;
    }

    it('un producto nuevo arranca con la fecha de hoy', () => {
      expect(componente.formulario.getRawValue().fechaRegistro).toBe(hoy());
    });

    it('vuelve a la fecha de hoy al limpiar', () => {
      seleccionar();
      responder();
      expect(componente.formulario.getRawValue().fechaRegistro).toBe('2018-09-01');

      componente.limpiar();

      expect(componente.formulario.getRawValue().fechaRegistro).toBe(hoy());
    });

    it('la fecha propuesta no cuenta como un cambio del usuario', () => {
      expect(componente.formulario.pristine).toBe(true);

      componente.limpiar();

      expect(componente.formulario.pristine).toBe(true);
    });
  });

  describe('guardar y actualizar', () => {
    function rellenarNuevo(): void {
      componente.formulario.patchValue({
        codigo: 'NUEVO01',
        nombreTecnico: 'PRODUCTO NUEVO',
        abreviaventa: 'P NUEVO',
        proveedor: '20502121147',
        unidadMedida: 'NIU',
        estadoProducto: 'A',
        afectoPercepcion: 'N',
        procedencia: 'L',
        fechaRegistro: '2026-08-16',
        codigoBarra: '111, 222',
      });
      fixture.detectChanges();
    }

    it('sin producto cargado el modo es alta', () => {
      expect(componente.modoGuardado()).toBe('nuevo');
    });

    it('con producto cargado el modo es actualización', () => {
      seleccionar();
      responder();

      expect(componente.modoGuardado()).toBe('actualizar');
    });

    it('da de alta con POST cuando no hay producto cargado', () => {
      rellenarNuevo();
      componente.guardarProducto();

      const peticion = http.expectOne(BASE);
      expect(peticion.request.method).toBe('POST');
      expect(peticion.request.body.codigo).toBe('NUEVO01');
      expect(peticion.request.body.descripcion).toBe('PRODUCTO NUEVO');
      peticion.flush(null);

      // Tras el alta se recarga la ficha por código para obtener el id.
      http.expectOne((r) => r.url === `${BASE}/buscar`).flush(DETALLE);
      http.expectOne(`${BASE}/2337/precios`).flush([]);
      http.expectOne(`${BASE}/2337/codigos-barra`).flush([]);
      fixture.detectChanges();

      expect(dialogoExito).toHaveBeenCalledWith(expect.stringContaining('se registró'), 'Producto registrado');
      expect(componente.modoGuardado()).toBe('actualizar');
    });

    it('envía solo el primer código de barra en el alta', () => {
      rellenarNuevo();
      componente.guardarProducto();

      const peticion = http.expectOne(BASE);
      expect(peticion.request.body.codigoBarra).toBe('111');
      peticion.flush(null);

      http.expectOne((r) => r.url === `${BASE}/buscar`).flush(DETALLE);
      http.expectOne(`${BASE}/2337/precios`).flush([]);
      http.expectOne(`${BASE}/2337/codigos-barra`).flush([]);
    });

    it('actualiza con PUT sobre el id del producto cargado', () => {
      seleccionar();
      responder();

      componente.formulario.controls.nombreTecnico.setValue('LIMA ANNY EDITADA');
      componente.guardarProducto();

      const peticion = http.expectOne(`${BASE}/2337`);
      expect(peticion.request.method).toBe('PUT');
      expect(peticion.request.body.descripcion).toBe('LIMA ANNY EDITADA');
      peticion.flush({ ...DETALLE, descripcion: 'LIMA ANNY EDITADA' });
      fixture.detectChanges();

      expect(dialogoExito).toHaveBeenCalledWith(expect.stringContaining('se actualizó'), 'Producto actualizado');
      // No se recarga la ficha aparte: la respuesta del PUT ya la trae.
      http.expectNone((r) => r.url === `${BASE}/buscar`);
    });

    it('repinta el formulario con lo que devolvió la base, no con lo enviado', () => {
      seleccionar();
      responder();

      componente.formulario.controls.nombreTecnico.setValue('LO QUE ESCRIBÍ');
      componente.guardarProducto();

      // La base responde con el valor recortado y en mayúsculas.
      http
        .expectOne(`${BASE}/2337`)
        .flush({ ...DETALLE, descripcion: 'LO QUE GUARDÓ LA BASE' });
      fixture.detectChanges();

      expect(componente.formulario.getRawValue().nombreTecnico).toBe('LO QUE GUARDÓ LA BASE');
      expect(componente.productoSeleccionado()?.nombre).toBe('LO QUE GUARDÓ LA BASE');
    });

    it('avisa si el backend no encuentra el producto tras actualizar', () => {
      seleccionar();
      responder();
      componente.guardarProducto();

      http.expectOne(`${BASE}/2337`).flush(
        { error: 'Producto.NoEncontrado', message: 'No se encontró el producto' },
        { status: 404, statusText: 'Not Found' }
      );
      fixture.detectChanges();

      expect(componente.errorGuardado()).toContain('no se guardó');
      expect(dialogoExito).not.toHaveBeenCalled();
    });

    it('manda los ids de catálogo, no los códigos', () => {
      seleccionar();
      responder();
      componente.guardarProducto();

      const peticion = http.expectOne(`${BASE}/2337`);
      expect(peticion.request.body.idLinea).toBe(356);
      expect(peticion.request.body.idFamilia).toBe(129);
      expect(peticion.request.body.idProveedor).toBe(462);
      peticion.flush(DETALLE);
    });

    it('conserva el id al elegir en un catálogo y muestra su nombre', () => {
      componente.abrirCatalogo('marca');
      componente.aplicarCatalogo({ idMarca: '77', codigo: 'NID', nombre: 'NIDO' });

      expect(componente.formulario.getRawValue().marca).toBe('NIDO');

      rellenarNuevo();
      componente.guardarProducto();

      const peticion = http.expectOne(BASE);
      expect(peticion.request.body.idMarca).toBe(77);
      expect(peticion.request.body.marca).toBeUndefined();
      peticion.flush(null);

      http.expectOne((r) => r.url === `${BASE}/buscar`).flush(DETALLE);
      http.expectOne(`${BASE}/2337/precios`).flush([]);
      http.expectOne(`${BASE}/2337/codigos-barra`).flush([]);
    });

    it('no envía nada si el formulario es inválido', () => {
      componente.guardarProducto();

      http.expectNone(BASE);
      expect(componente.formulario.touched).toBe(true);
    });

    it('avisa con un modal y nombra los obligatorios que faltan', () => {
      componente.guardarProducto();

      expect(dialogoAdvertencia).toHaveBeenCalledWith(
        'Faltan completar estos campos: Código de Producto, Nombre Técnico, Proveedor.',
        'Faltan datos obligatorios'
      );
    });

    it('nombra solo el campo que falta cuando es uno', () => {
      rellenarNuevo();
      componente.formulario.controls.nombreTecnico.setValue('');

      componente.guardarProducto();

      http.expectNone(BASE);
      expect(dialogoAdvertencia).toHaveBeenCalledWith(
        'Falta completar el campo Nombre Técnico.',
        'Faltan datos obligatorios'
      );
    });

    it('sin proveedor no deja guardar aunque el resto esté completo', () => {
      rellenarNuevo();
      componente.formulario.controls.proveedor.setValue('');

      componente.guardarProducto();

      http.expectNone(BASE);
      expect(dialogoAdvertencia).toHaveBeenCalledWith(
        'Falta completar el campo Proveedor.',
        'Faltan datos obligatorios'
      );
    });

    it('muestra el mensaje del backend cuando el código ya existe', () => {
      rellenarNuevo();
      componente.guardarProducto();

      http.expectOne(BASE).flush(
        { error: 'Producto.CodigoYaExiste', message: 'El código del producto ya existe' },
        { status: 409, statusText: 'Conflict' }
      );
      fixture.detectChanges();

      expect(componente.errorGuardado()).toBe('El código del producto ya existe');
      expect(componente.guardando()).toBe(false);
    });

    it('confirma el alta con un diálogo que nombra el producto', () => {
      rellenarNuevo();
      componente.guardarProducto();
      http.expectOne(BASE).flush(null);

      http.expectOne((r) => r.url === `${BASE}/buscar`).flush(DETALLE);
      http.expectOne(`${BASE}/2337/precios`).flush([]);
      http.expectOne(`${BASE}/2337/codigos-barra`).flush([]);

      expect(dialogoExito).toHaveBeenCalledWith(
        expect.stringContaining('NUEVO01'),
        'Producto registrado'
      );
    });

    it('confirma la actualización con un diálogo', () => {
      seleccionar();
      responder();
      componente.guardarProducto();

      http.expectOne(`${BASE}/2337`).flush(DETALLE);

      expect(dialogoExito).toHaveBeenCalledWith(
        expect.stringContaining('20740148'),
        'Producto actualizado'
      );
    });

    it('avisa del fallo con un diálogo y no con el de éxito', () => {
      rellenarNuevo();
      componente.guardarProducto();

      http.expectOne(BASE).flush(
        { error: 'Producto.CodigoYaExiste', message: 'El código del producto ya existe' },
        { status: 409, statusText: 'Conflict' }
      );

      expect(dialogoError).toHaveBeenCalledWith(
        'El código del producto ya existe',
        'No se pudo guardar'
      );
      expect(dialogoExito).not.toHaveBeenCalled();
    });

    it('ignora pulsaciones repetidas mientras guarda', () => {
      rellenarNuevo();
      componente.guardarProducto();
      componente.guardarProducto();

      http.expectOne(BASE).flush(null);

      http.expectOne((r) => r.url === `${BASE}/buscar`).flush(DETALLE);
      http.expectOne(`${BASE}/2337/precios`).flush([]);
      http.expectOne(`${BASE}/2337/codigos-barra`).flush([]);
    });
  });

  describe('proveedores asociados', () => {
    it('seleccionarProveedor actualiza el control de proveedor y su id en idsCatalogo', () => {
      componente.seleccionarProveedor({
        idProveedor: 462,
        ruc: '20502121147',
        razonSocial: 'I.Q.S.ANDINA S.A.',
      });

      expect(componente.formulario.controls.proveedor.value).toBe('I.Q.S.ANDINA S.A.');
      expect((componente as any).idsCatalogo().proveedor).toBe(462);
      expect(componente.formulario.dirty).toBe(true);
    });

    it('desvincularProveedor limpia el input si el proveedor desvinculado coincide por id', () => {
      componente.seleccionarProveedor({
        idProveedor: 462,
        ruc: '20502121147',
        razonSocial: 'I.Q.S.ANDINA S.A.',
      });

      componente.desvincularProveedor({
        proveedor: {
          idProductoProveedor: 10,
          idProducto: 2337,
          idProveedor: 462,
          ruc: '20502121147',
          razonSocial: 'I.Q.S.ANDINA S.A.',
        },
        quedanProveedores: true,
      });

      expect(componente.formulario.controls.proveedor.value).toBe('');
      expect((componente as any).idsCatalogo().proveedor).toBeNull();
    });

    it('desvincularProveedor limpia el input si el proveedor desvinculado coincide por razón social o ruc', () => {
      componente.formulario.controls.proveedor.setValue('I.Q.S.ANDINA S.A.');
      componente.desvincularProveedor({
        proveedor: {
          idProductoProveedor: 10,
          idProducto: 2337,
          idProveedor: 999,
          ruc: '20502121147',
          razonSocial: 'I.Q.S.ANDINA S.A.',
        },
        quedanProveedores: true,
      });

      expect(componente.formulario.controls.proveedor.value).toBe('');
      expect((componente as any).idsCatalogo().proveedor).toBeNull();
    });

    it('desvincularProveedor limpia el input si ya no quedan proveedores asociados', () => {
      componente.formulario.controls.proveedor.setValue('OTRO PROVEEDOR');
      componente.desvincularProveedor({
        proveedor: {
          idProductoProveedor: 10,
          idProducto: 2337,
          idProveedor: 888,
          ruc: '20999999999',
          razonSocial: 'DISTINTO',
        },
        quedanProveedores: false,
      });

      expect(componente.formulario.controls.proveedor.value).toBe('');
      expect((componente as any).idsCatalogo().proveedor).toBeNull();
    });

    it('desvincularProveedor NO limpia el input si quedan proveedores y el desvinculado no es el seleccionado', () => {
      componente.seleccionarProveedor({
        idProveedor: 462,
        ruc: '20502121147',
        razonSocial: 'I.Q.S.ANDINA S.A.',
      });

      componente.desvincularProveedor({
        proveedor: {
          idProductoProveedor: 11,
          idProducto: 2337,
          idProveedor: 999,
          ruc: '20111111111',
          razonSocial: 'OTRO PROVEEDOR S.A.',
        },
        quedanProveedores: true,
      });

      expect(componente.formulario.controls.proveedor.value).toBe('I.Q.S.ANDINA S.A.');
      expect((componente as any).idsCatalogo().proveedor).toBe(462);
    });
  });
});
