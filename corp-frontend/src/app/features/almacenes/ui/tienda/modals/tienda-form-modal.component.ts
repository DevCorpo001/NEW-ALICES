import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideX } from '@ng-icons/lucide';
import { EnterNavigateDirective } from '../../../../../shared/directives/enter-navigate.directive';
import { AppModalComponent } from '../../../../../shared/ui/modal/app-modal.component';
import { TabItem, TabsComponent } from '../../../../../shared/ui/tabs/tabs.component';
import { Canal, Empresa, GuardarTienda } from '../../../data-access/tienda/tienda.models';

const TABS: readonly TabItem[] = [
  { id: 'generales', etiqueta: 'Datos Generales' },
  { id: 'configuracion', etiqueta: 'Configuración' },
];

/** Alta de tienda: los datos de identidad y los de operación, separados en pestañas. */
@Component({
  selector: 'app-tienda-form-modal',
  imports: [ReactiveFormsModule, NgIcon, AppModalComponent, TabsComponent, EnterNavigateDirective],
  providers: [provideIcons({ lucideCheck, lucideX })],
  templateUrl: './tienda-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TiendaFormModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly abierto = input(false);
  readonly canales = input.required<readonly Canal[]>();
  readonly empresas = input.required<readonly Empresa[]>();

  readonly cerrar = output();
  readonly guardar = output<GuardarTienda>();

  readonly tabs = TABS;
  readonly activa = signal('generales');

  readonly formulario = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    direccion: ['', Validators.required],
    idEmpresa: ['', Validators.required],
    idEmpresaEnvio: ['', Validators.required],
    ubigeo: ['', Validators.required],
    serie: [''],
    cantidadImpresiones: [1],
    manejaStock: [true],
    idCanal: [''],
    activo: [true],
  });

  /** Los obligatorios viven en la primera pestaña; si faltan, hay que volver a ella. */
  readonly faltanGenerales = computed(() => this.intentado() && this.formulario.invalid);

  private readonly intentado = signal(false);

  constructor() {
    effect(() => {
      const abierto = this.abierto();
      untracked(() => {
        if (abierto) {
          this.formulario.reset({ cantidadImpresiones: 1, manejaStock: true, activo: true });
          this.activa.set('generales');
          this.intentado.set(false);
        }
      });
    });
  }

  confirmar(): void {
    this.intentado.set(true);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.activa.set('generales');
      return;
    }

    const valores = this.formulario.getRawValue();
    this.guardar.emit({
      codigo: valores.codigo.trim().toUpperCase(),
      direccion: valores.direccion.trim().toUpperCase(),
      idEmpresa: valores.idEmpresa ? Number(valores.idEmpresa) : null,
      idEmpresaEnvio: valores.idEmpresaEnvio ? Number(valores.idEmpresaEnvio) : null,
      ubigeo: valores.ubigeo.trim().toUpperCase(),
      cantidadImpresiones: Number(valores.cantidadImpresiones) || 1,
      serie: valores.serie.trim(),
      manejaStock: valores.manejaStock,
      idCanal: valores.idCanal ? Number(valores.idCanal) : null,
      activo: valores.activo,
    });
  }
}
