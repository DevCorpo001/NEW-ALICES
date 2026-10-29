import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideShield, lucideUser } from '@ng-icons/lucide';
import { RolesFiltroStore } from '../../data-access/roles-filtro.store';
import { UsuariosFiltroStore } from '../../data-access/usuarios-filtro.store';
import { TabItem, TabsComponent } from '@/shared/ui/tabs/tabs.component';
import { RolesTabComponent } from './roles/roles-tab.component';
import { UsuariosTabComponent } from './usuarios/usuarios-tab.component';

type PestanaId = 'usuarios' | 'roles';

/** Usuarios y roles en una sola vista; cada pestaña trae sus filtros y su tabla. */
@Component({
  selector: 'app-usuarios-rol',
  imports: [TabsComponent, UsuariosTabComponent, RolesTabComponent],
  providers: [UsuariosFiltroStore, RolesFiltroStore, provideIcons({ lucideShield, lucideUser })],
  templateUrl: './usuarios-rol.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuariosRolComponent {
  private readonly usuarios = inject(UsuariosFiltroStore);
  private readonly roles = inject(RolesFiltroStore);

  readonly activa = signal<PestanaId>('usuarios');

  readonly tabs = computed<readonly TabItem[]>(() => [
    {
      id: 'usuarios',
      etiqueta: 'Usuarios',
      icono: 'lucideUser',
      contador: this.usuarios.resultados().length,
    },
    {
      id: 'roles',
      etiqueta: 'Roles',
      icono: 'lucideShield',
      contador: this.roles.resultados().length,
    },
  ]);
}
