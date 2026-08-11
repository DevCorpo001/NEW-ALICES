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
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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
