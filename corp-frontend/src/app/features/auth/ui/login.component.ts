import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { TiendaOption } from '../../../core/auth/auth.models';
import { TiendaApiService } from '../data-access/tienda-api.service';
import { EnterNavigateDirective } from '../../../shared/directives/enter-navigate.directive';
import { EnterPrimaryDirective } from '../../../shared/directives/enter-primary.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, EnterNavigateDirective, EnterPrimaryDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <section class="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div class="w-full rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl sm:p-9">
          <div class="mb-8">
            <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">ALICES</p>
            <h1 class="text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
            <p class="mt-2 text-sm text-slate-400">Ingresa a tu espacio de trabajo.</p>
          </div>

          <form appEnterNavigate [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="space-y-5">
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-200" for="usuario">Usuario</label>
                <input
                  id="usuario"
                  type="text"
                  formControlName="usuario"
                  autocomplete="username"
                  class="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Tu usuario"
                />
                @if (form.controls.usuario.touched && form.controls.usuario.invalid) {
                  <p class="mt-2 text-sm text-red-400">Ingresa un usuario válido.</p>
                }
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-200" for="clave">Clave</label>
                <input
                  id="clave"
                  type="password"
                  formControlName="clave"
                  autocomplete="current-password"
                  class="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Tu clave"
                />
                @if (form.controls.clave.touched && form.controls.clave.invalid) {
                  <p class="mt-2 text-sm text-red-400">La clave es obligatoria.</p>
                }
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-200" for="idTienda">Tienda</label>
                <select
                  id="idTienda"
                  formControlName="idTienda"
                  [disabled]="loadingTiendas() || tiendas().length === 0"
                  class="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option [ngValue]="0">Selecciona una tienda</option>
                  @for (tienda of tiendas(); track tienda.idTienda) {
                    <option [ngValue]="tienda.idTienda">
                      {{ tienda.codigoTienda }} - {{ tienda.direccion }}
                    </option>
                  }
                </select>
                @if (form.controls.idTienda.touched && form.controls.idTienda.invalid) {
                  <p class="mt-2 text-sm text-red-400">Selecciona una tienda.</p>
                }
              </div>

              @if (errorMessage()) {
                <p class="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300" role="alert">
                  {{ errorMessage() }}
                </p>
              }

              <button
                type="submit"
                appEnterPrimary
                [disabled]="form.invalid || loading() || loadingTiendas()"
                class="h-12 w-full rounded-lg bg-blue-600 px-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ loading() ? 'Ingresando...' : 'Ingresar' }}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  `
})
export class LoginComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly tiendaApi = inject(TiendaApiService);

  readonly form = this.formBuilder.nonNullable.group({
    usuario: ['', [Validators.required, Validators.maxLength(25)]],
    clave: ['', [Validators.required, Validators.maxLength(50)]],
    idTienda: [0, [Validators.required, Validators.min(1)]]
  });

  readonly tiendas = signal<TiendaOption[]>([]);
  readonly loadingTiendas = signal(true);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.tiendaApi.getActive().subscribe({
      next: (tiendas) => this.tiendas.set(tiendas),
      error: () => this.errorMessage.set('No se pudieron cargar las tiendas.'),
      complete: () => this.loadingTiendas.set(false)
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/']),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.status === 401
            ? 'Usuario, clave o tienda incorrectos.'
            : 'No se pudo iniciar sesión. Intenta nuevamente.');
        }
      });
  }
}
