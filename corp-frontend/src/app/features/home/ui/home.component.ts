import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalculator,
  lucidePackage,
  lucideSettings,
  lucideShoppingCart,
  lucideTruck,
  lucideWarehouse
} from '@ng-icons/lucide';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, NgIcon],
  providers: [
    provideIcons({
      lucideCalculator,
      lucidePackage,
      lucideSettings,
      lucideShoppingCart,
      lucideTruck,
      lucideWarehouse
    })
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  readonly auth = inject(AuthService);

  readonly modulos = [
    {
      titulo: 'Ventas',
      descripcion: 'Crea ventas, anulaciones e impresión de pedidos.',
      route: '/ventas',
      icon: 'lucideShoppingCart'
    },
    {
      titulo: 'Compras',
      descripcion: 'Registra compras y proveedores.',
      route: '/compras',
      icon: 'lucidePackage'
    },
    {
      titulo: 'Sistema',
      descripcion: 'Usuarios, permisos, vendedores y configuración.',
      route: '/sistema',
      icon: 'lucideSettings'
    },
    {
      titulo: 'Almacenes',
      descripcion: 'Productos, guías, stock y traslados.',
      route: '/almacenes',
      icon: 'lucideWarehouse'
    },
    {
      titulo: 'Despacho',
      descripcion: 'Facturación, embalaje y envíos.',
      route: '/despacho',
      icon: 'lucideTruck'
    },
    {
      titulo: 'Caja',
      descripcion: 'Apertura de caja, resúmenes y caja rápida.',
      route: '/caja',
      icon: 'lucideCalculator'
    }
  ];
}
