import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideEraser,
  lucideEye,
  lucideEyeOff,
  lucideLock,
  lucideLockOpen,
  lucidePencil,
  lucideSearch,
  lucideUserPlus,
} from '@ng-icons/lucide';
import { EnterNavigateDirective } from '../../../../../shared/directives/enter-navigate.directive';
import { BotonAccionComponent } from '../../../../../shared/ui/boton-accion/boton-accion.component';
import { ClaveOcultaComponent } from '../../../../../shared/ui/clave-oculta/clave-oculta.component';
import { EstadoChipComponent } from '../../../../../shared/ui/estado-chip/estado-chip.component';
import { RolesFiltroStore } from '../../../data-access/roles-filtro.store';
import { FiltroEstado, Usuario } from '../../../data-access/seguridad.models';
import { USUARIOS_POR_PAGINA, UsuariosFiltroStore } from '../../../data-access/usuarios-filtro.store';
import { clasesPastel, iniciales } from './paleta';

/** Pestaña de usuarios: bloque de filtros y bloque de tabla, separados. */
@Component({
  selector: 'app-usuarios-tab',
  imports: [
    NgIcon,
    EnterNavigateDirective,
    EstadoChipComponent,
    BotonAccionComponent,
    ClaveOcultaComponent,
  ],
  providers: [
    provideIcons({
      lucideChevronLeft,
      lucideChevronRight,
      lucideEraser,
      lucideEye,
      lucideEyeOff,
      lucideLock,
      lucideLockOpen,
      lucidePencil,
      lucideSearch,
      lucideUserPlus,
    }),
  ],
  templateUrl: './usuarios-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuariosTabComponent {
  readonly store = inject(UsuariosFiltroStore);
  readonly roles = inject(RolesFiltroStore);

  readonly iniciales = iniciales;
  readonly clasesPastel = clasesPastel;

  /** Ventana de como mucho cinco páginas alrededor de la actual. */
  readonly paginas = computed(() => {
    const total = this.store.totalPaginas();
    const actual = this.store.paginaActual();
    const desde = Math.max(1, Math.min(actual - 2, total - 4));
    const hasta = Math.min(total, desde + 4);
    return Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);
  });

  numeroFila(indice: number): number {
    return (this.store.paginaActual() - 1) * USUARIOS_POR_PAGINA + indice + 1;
  }

  cambiarTexto(event: Event): void {
    this.store.cambiarTexto((event.target as HTMLInputElement).value);
  }

  cambiarRol(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.store.cambiarRol(valor ? Number(valor) : null);
  }

  cambiarEstado(event: Event): void {
    this.store.cambiarEstado((event.target as HTMLSelectElement).value as FiltroEstado);
  }

  // TODO(backend): faltan los endpoints de alta y edición de usuario.
  agregarUsuario(): void {}

  editarUsuario(_usuario: Usuario): void {}
}
