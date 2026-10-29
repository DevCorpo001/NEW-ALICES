import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEraser, lucidePlus, lucideSearch } from '@ng-icons/lucide';
import { EnterNavigateDirective } from '@/shared/directives/enter-navigate.directive';
import { ColumnasVisiblesComponent } from '@/shared/ui/columnas-visibles/columnas-visibles.component';
import { RolesFiltroStore } from '../../../data-access/roles-filtro.store';
import {
  Cobertura,
  ETIQUETAS_COBERTURA,
  FiltroCobertura,
  Rol,
  cobertura,
} from '../../../data-access/seguridad.models';
import { COLUMNAS_ROLES } from './roles.columnas';

/** Pestaña de roles: filtros, selector de columnas y listado. */
@Component({
  selector: 'app-roles-tab',
  imports: [NgIcon, EnterNavigateDirective, ColumnasVisiblesComponent],
  providers: [provideIcons({ lucideEraser, lucidePlus, lucideSearch })],
  templateUrl: './roles-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesTabComponent {
  readonly store = inject(RolesFiltroStore);

  readonly columnas = COLUMNAS_ROLES;
  readonly etiquetas = ETIQUETAS_COBERTURA;

  /** Columnas visibles, para el `colspan` de las filas de estado vacío. */
  readonly visibles = computed(
    () => this.columnas.length - this.store.columnasOcultas().length + 1
  );

  esVisible(campo: string): boolean {
    return !this.store.columnasOcultas().includes(campo);
  }

  coberturaDe(rol: Rol): Cobertura {
    return cobertura(rol);
  }

  cambiarTexto(event: Event): void {
    this.store.texto.set((event.target as HTMLInputElement).value);
  }

  cambiarCobertura(event: Event): void {
    this.store.cobertura.set((event.target as HTMLSelectElement).value as FiltroCobertura);
  }

  // TODO(backend): falta el endpoint de alta de rol.
  agregarRol(): void {}
}
