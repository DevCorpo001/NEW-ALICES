import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, of, throwError } from 'rxjs';
import { CatalogoModalComponent } from './catalogo-modal.component';
import { CatalogoDataSource } from './catalogo-modal.datasource';
import { CatalogoConfig, CatalogoFila } from './catalogo-modal.models';

const config: CatalogoConfig = {
  titulo: 'Búsqueda de Línea',
  tituloAgregar: 'Agregar Línea',
  clave: 'codigo',
  mensajeVacio: 'Sin líneas registradas.',
  columnas: [
    { campo: 'codigo', titulo: 'CÓDIGO' },
    { campo: 'nombre', titulo: 'NOMBRE' },
  ],
  filtros: [
    { campo: 'codigo', etiqueta: 'Código Línea' },
    { campo: 'nombre', etiqueta: 'Nombre Línea' },
  ],
  campos: [
    { campo: 'codigo', etiqueta: 'Código Línea', requerido: true },
    { campo: 'nombre', etiqueta: 'Nombre Línea', requerido: true },
    { campo: 'abreviado', etiqueta: 'Abreviado Línea' },
  ],
};

const TODAS: readonly CatalogoFila[] = [
  { codigo: '001', nombre: 'ALIMENTOS', abreviado: 'A' },
  { codigo: '002', nombre: 'BEBIDAS', abreviado: 'B' },
  { codigo: '003', nombre: 'LÁCTEOS', abreviado: 'L' },
];

class FuenteFalsa implements CatalogoDataSource {
  readonly busquedas: CatalogoFila[] = [];
  readonly sugerenciasPedidas: { campo: string; termino: string }[] = [];
  readonly creados: CatalogoFila[] = [];

  filas: readonly CatalogoFila[] = TODAS;
  errorAlCrear: string | null = null;
  errorAlBuscar = false;
  codigoSugerido: string | null = '004';

  sugerencias(campo: string, termino: string): Observable<readonly CatalogoFila[]> {
    this.sugerenciasPedidas.push({ campo, termino });
    return of(this.filas);
  }

  buscar(filtros: CatalogoFila): Observable<readonly CatalogoFila[]> {
    this.busquedas.push({ ...filtros });
    if (this.errorAlBuscar) {
      return throwError(() => new Error('No se pudieron cargar las líneas.'));
    }
    return of(this.filas);
  }

  crear(fila: CatalogoFila): Observable<void> {
    if (this.errorAlCrear) {
      return throwError(() => new Error(this.errorAlCrear!));
    }
    this.creados.push(fila);
    return of(undefined);
  }

  siguienteCodigo(): Observable<string> {
    return this.codigoSugerido === null
      ? throwError(() => new Error('sin código'))
      : of(this.codigoSugerido);
  }
}

@Component({
  imports: [CatalogoModalComponent],
  template: `
    <app-catalogo-modal
      [abierto]="abierto()"
      [config]="config"
      [fuente]="fuente"
      (seleccionar)="seleccionados.push($event)"
    />
  `,
})
class HostComponent {
  readonly config = config;
  readonly abierto = signal(true);
  fuente = new FuenteFalsa();
  readonly seleccionados: CatalogoFila[] = [];
}

describe('CatalogoModalComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function modal(): CatalogoModalComponent {
    return fixture.debugElement.query(By.directive(CatalogoModalComponent)).componentInstance;
  }

  function raiz(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function filasVisibles(): string[] {
    return Array.from(raiz().querySelectorAll<HTMLElement>('tbody tr')).map(
      (fila) => fila.textContent?.trim() ?? ''
    );
  }

  function pulsarEnLista(key: string): void {
    raiz()
      .querySelector<HTMLElement>('[role="listbox"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  }

  /** El modal ya no lista al abrirse, así que casi todo parte de una búsqueda. */
  function buscar(): void {
    modal().aplicarFiltros();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('no consulta nada al abrirse: el listado solo aparece al buscar', () => {
    expect(host.fuente.busquedas).toEqual([]);
    expect(modal().filas()).toEqual([]);
    expect(modal().busquedaRealizada()).toBe(false);
    expect(raiz().textContent).toContain('para listar');
  });

  it('Buscar sin filtros pide todo el catálogo', () => {
    modal().aplicarFiltros();
    fixture.detectChanges();

    expect(host.fuente.busquedas.at(-1)).toEqual({ codigo: '', nombre: '' });
    expect(filasVisibles().length).toBe(3);
  });

  it('tras buscar deja activa la primera fila y el foco en la lista', async () => {
    modal().aplicarFiltros();
    fixture.detectChanges();

    expect(modal().indiceActivo()).toBe(0);

    // El foco se mueve en un microtask, tras pintar los resultados.
    await Promise.resolve();
    expect(document.activeElement).toBe(raiz().querySelector('[role="listbox"]'));
  });

  it('distingue "aún no has buscado" de "sin resultados"', () => {
    host.fuente.filas = [];
    modal().aplicarFiltros();
    fixture.detectChanges();

    expect(raiz().textContent).toContain('Sin líneas registradas.');
    expect(raiz().textContent).not.toContain('para listar');
  });

  it('teclear en un filtro vacía los demás', () => {
    modal().control(modal().formularioFiltro(), 'codigo').setValue('001');
    modal().onBuscarSugerencias('nombre', 'LACT');
    fixture.detectChanges();

    expect(modal().campoActivo()).toBe('nombre');
    expect(modal().control(modal().formularioFiltro(), 'codigo').value).toBe('');
    expect(host.fuente.sugerenciasPedidas.at(-1)).toEqual({ campo: 'nombre', termino: 'LACT' });
  });

  it('elegir una sugerencia rellena el filtro y lanza la búsqueda', () => {
    modal().onElegirSugerencia('codigo', { codigo: '002', nombre: 'BEBIDAS' });
    fixture.detectChanges();

    expect(modal().control(modal().formularioFiltro(), 'codigo').value).toBe('002');
    expect(host.fuente.busquedas.at(-1)).toEqual({ codigo: '002', nombre: '' });
  });

  it('las flechas recorren los resultados y Enter selecciona', () => {
    buscar();

    pulsarEnLista('ArrowDown');
    expect(modal().indiceActivo()).toBe(1);

    pulsarEnLista('ArrowDown');
    expect(modal().indiceActivo()).toBe(2);

    pulsarEnLista('Enter');
    // Emite la fila entera: el consumidor necesita el id, no solo el código.
    expect(host.seleccionados).toEqual([{ codigo: '003', nombre: 'LÁCTEOS', abreviado: 'L' }]);
  });

  it('Inicio y Fin saltan a los extremos', () => {
    buscar();

    pulsarEnLista('End');
    expect(modal().indiceActivo()).toBe(2);

    pulsarEnLista('Home');
    expect(modal().indiceActivo()).toBe(0);
  });

  it('↑ en la primera fila devuelve el foco a los filtros', () => {
    buscar();
    expect(modal().indiceActivo()).toBe(0);

    pulsarEnLista('ArrowUp');

    expect(document.activeElement?.id).toBe('filtro-codigo');
  });

  it('Enter sin resultados no selecciona nada', () => {
    pulsarEnLista('Enter');
    expect(host.seleccionados).toEqual([]);
  });

  it('muestra el mensaje de error si falla la búsqueda', () => {
    host.fuente.errorAlBuscar = true;
    modal().aplicarFiltros();
    fixture.detectChanges();

    expect(modal().errorBusqueda()).toContain('No se pudieron cargar');
    expect(modal().filas()).toEqual([]);
  });

  it('Agregar pide el siguiente código y lo rellena', () => {
    modal().irAAgregar();
    fixture.detectChanges();

    expect(modal().vista()).toBe('agregar');
    expect(modal().control(modal().formularioAlta(), 'codigo').value).toBe('004');
  });

  it('si no se puede obtener el código avisa pero deja continuar', () => {
    host.fuente.codigoSugerido = null;
    modal().irAAgregar();
    fixture.detectChanges();

    expect(modal().vista()).toBe('agregar');
    expect(modal().errorAlta()).toContain('Escríbelo manualmente');
  });

  it('no guarda si faltan campos obligatorios', () => {
    modal().irAAgregar();
    modal().control(modal().formularioAlta(), 'nombre').setValue('');
    modal().guardarNuevo();

    expect(host.fuente.creados).toEqual([]);
    expect(modal().vista()).toBe('agregar');
  });

  it('guarda, avisa y vuelve a búsqueda sin listar nada', () => {
    modal().irAAgregar();
    modal().control(modal().formularioAlta(), 'nombre').setValue('CONGELADOS');
    modal().control(modal().formularioAlta(), 'abreviado').setValue('C');
    const busquedasPrevias = host.fuente.busquedas.length;

    modal().guardarNuevo();
    fixture.detectChanges();

    expect(host.fuente.creados).toEqual([
      { codigo: '004', nombre: 'CONGELADOS', abreviado: 'C' },
    ]);
    expect(modal().vista()).toBe('buscar');
    expect(modal().mensajeExito()).toContain('guardado correctamente');
    // No se relanza ninguna búsqueda automática.
    expect(host.fuente.busquedas.length).toBe(busquedasPrevias);
    expect(modal().filas()).toEqual([]);
  });

  it('muestra el mensaje del backend si el alta es rechazada', () => {
    host.fuente.errorAlCrear = 'Error al insertar. La Linea ya existe';
    modal().irAAgregar();
    modal().control(modal().formularioAlta(), 'nombre').setValue('ALIMENTOS');

    modal().guardarNuevo();
    fixture.detectChanges();

    expect(modal().errorAlta()).toBe('Error al insertar. La Linea ya existe');
    expect(modal().vista()).toBe('agregar');
  });

  it('cada apertura vuelve a la vista de búsqueda', () => {
    modal().irAAgregar();
    fixture.detectChanges();

    host.abierto.set(false);
    fixture.detectChanges();
    host.abierto.set(true);
    fixture.detectChanges();

    expect(modal().vista()).toBe('buscar');
  });
});
