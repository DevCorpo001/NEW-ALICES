import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { AutocompleteComponent } from './autocomplete.component';
import { AutocompleteOpcion } from './autocomplete.models';

@Component({
  imports: [AutocompleteComponent, ReactiveFormsModule],
  template: `
    <app-autocomplete
      idControl="prueba"
      [formControl]="control"
      [opciones]="opciones()"
      (buscar)="terminos.push($event)"
      (seleccionar)="elegidos.push($event)"
    />
  `,
})
class HostComponent {
  readonly control = new FormControl('', { nonNullable: true });
  readonly opciones = signal<readonly AutocompleteOpcion<string>[]>([]);
  readonly terminos: string[] = [];
  readonly elegidos: string[] = [];
}

function opcion(codigo: string): AutocompleteOpcion<string> {
  return { clave: codigo, principal: codigo, secundario: `Nombre ${codigo}`, valor: codigo };
}

describe('AutocompleteComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let input: HTMLInputElement;

  function autocomplete(): AutocompleteComponent<string> {
    return fixture.debugElement.query(By.directive(AutocompleteComponent)).componentInstance;
  }

  function teclear(texto: string): void {
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function pulsar(key: string): void {
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    fixture.detectChanges();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emite el término una sola vez tras el debounce', () => {
    teclear('ar');
    teclear('arr');
    teclear('arro');

    expect(host.terminos).toEqual([]);

    vi.advanceTimersByTime(300);

    expect(host.terminos).toEqual(['arro']);
  });

  it('propaga el texto al FormControl del padre', () => {
    teclear('leche');
    expect(host.control.value).toBe('leche');
  });

  it('escribir abre el panel y vaciar lo cierra', () => {
    teclear('a');
    expect(autocomplete().abierto()).toBe(true);

    teclear('');
    expect(autocomplete().abierto()).toBe(false);
  });

  it('las flechas mueven la opción activa sin salirse de la lista', () => {
    host.opciones.set([opcion('A'), opcion('B'), opcion('C')]);
    teclear('x');
    fixture.detectChanges();

    expect(autocomplete().indiceActivo()).toBe(0);

    pulsar('ArrowDown');
    expect(autocomplete().indiceActivo()).toBe(1);

    pulsar('ArrowDown');
    pulsar('ArrowDown');
    expect(autocomplete().indiceActivo()).toBe(2);

    pulsar('ArrowUp');
    expect(autocomplete().indiceActivo()).toBe(1);
  });

  it('Enter selecciona la opción activa y cierra el panel', () => {
    host.opciones.set([opcion('A'), opcion('B')]);
    teclear('x');
    fixture.detectChanges();

    pulsar('ArrowDown');
    pulsar('Enter');

    expect(host.elegidos).toEqual(['B']);
    expect(autocomplete().abierto()).toBe(false);
  });

  it('Enter con el panel cerrado fuerza la búsqueda en lugar de seleccionar', () => {
    teclear('sin-resultados');
    vi.advanceTimersByTime(300);
    host.terminos.length = 0;
    autocomplete().cerrar();

    pulsar('Enter');

    expect(host.elegidos).toEqual([]);
    expect(host.terminos).toEqual(['sin-resultados']);
  });

  it('F2 y Escape cierran el panel', () => {
    host.opciones.set([opcion('A')]);

    teclear('a');
    pulsar('Escape');
    expect(autocomplete().abierto()).toBe(false);

    teclear('ab');
    pulsar('F2');
    expect(autocomplete().abierto()).toBe(false);
  });

  it('un lote nuevo de opciones vuelve a activar la primera fila', () => {
    host.opciones.set([opcion('A'), opcion('B'), opcion('C')]);
    teclear('x');
    fixture.detectChanges();
    pulsar('ArrowDown');
    expect(autocomplete().indiceActivo()).toBe(1);

    host.opciones.set([opcion('D'), opcion('E')]);
    fixture.detectChanges();

    expect(autocomplete().indiceActivo()).toBe(0);
  });

  it('expone la semántica ARIA de combobox', () => {
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-expanded')).toBe('false');

    host.opciones.set([opcion('A')]);
    teclear('a');
    fixture.detectChanges();

    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe('prueba-opcion-A');
  });
});
