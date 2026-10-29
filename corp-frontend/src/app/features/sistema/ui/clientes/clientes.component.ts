import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideEraser,
  lucideRefreshCw,
  lucideUserPen,
  lucideUserPlus,
} from '@ng-icons/lucide';
import { EnterNavigateDirective } from '@/shared/directives/enter-navigate.directive';
import { BotonAccionComponent } from '@/shared/ui/boton-accion/boton-accion.component';
import { FiltroColumnaComponent } from '@/shared/ui/filtro-columna/filtro-columna.component';
import { Cliente } from '../../data-access/clientes.models';
import {
  CLIENTES_POR_PAGINA,
  ClientesStore,
  ColumnaCliente,
} from '../../data-access/clientes.store';

interface ColumnaTabla {
  readonly campo: ColumnaCliente;
  readonly titulo: string;
  readonly ancho?: string;
}

const COLUMNAS: readonly ColumnaTabla[] = [
  { campo: 'documento', titulo: 'Documento' },
  { campo: 'nombre', titulo: 'Nombre' },
  { campo: 'abreviatura', titulo: 'Abreviatura' },
  { campo: 'nombreComercial', titulo: 'Nombre Comercial' },
  { campo: 'direccion', titulo: 'Dirección' },
  { campo: 'fechaRegistro', titulo: 'Fecha Reg.' },
  { campo: 'condicion', titulo: 'Condición' },
  { campo: 'ultimaValidacion', titulo: 'Última Val.' },
  { campo: 'ubigeo', titulo: 'Ubigeo' },
  { campo: 'estado', titulo: 'Estado' },
];

/** Padrón de clientes: filtros arriba y un embudo por columna en la cabecera. */
@Component({
  selector: 'app-clientes',
  imports: [NgIcon, EnterNavigateDirective, BotonAccionComponent, FiltroColumnaComponent],
  providers: [
    ClientesStore,
    provideIcons({
      lucideChevronLeft,
      lucideChevronRight,
      lucideEraser,
      lucideRefreshCw,
      lucideUserPen,
      lucideUserPlus,
    }),
  ],
  templateUrl: './clientes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesComponent {
  readonly store = inject(ClientesStore);
  readonly columnas = COLUMNAS;

  readonly paginas = computed(() => {
    const total = this.store.totalPaginas();
    const actual = this.store.paginaActual();
    const desde = Math.max(1, Math.min(actual - 2, total - 4));
    const hasta = Math.min(total, desde + 4);
    return Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);
  });

  numeroFila(indice: number): number {
    return (this.store.paginaActual() - 1) * CLIENTES_POR_PAGINA + indice + 1;
  }

  celda(cliente: Cliente, campo: ColumnaCliente): string {
    return String(cliente[campo] ?? '') || '—';
  }

  cambiarDocumento(event: Event): void {
    this.store.cambiarDocumento((event.target as HTMLInputElement).value);
  }

  cambiarNombre(event: Event): void {
    this.store.cambiarNombre((event.target as HTMLInputElement).value);
  }

  cambiarNombreComercial(event: Event): void {
    this.store.cambiarNombreComercial((event.target as HTMLInputElement).value);
  }

  // TODO(backend): faltan los endpoints de alta, edición y revalidación en SUNAT.
  registrar(): void {}

  editar(_cliente: Cliente): void {}

  revalidar(_cliente: Cliente): void {}
}
