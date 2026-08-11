import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

const interceptedUrls: string[] = [];

const markingInterceptor: HttpInterceptorFn = (request, next) => {
  interceptedUrls.push(request.url);
  return next(request);
};

describe('AuthService', () => {
  beforeEach(() => {
    interceptedUrls.length = 0;
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([markingInterceptor])), provideHttpClientTesting()]
    });
  });

  it('restoreSession no pasa por interceptores para no crear el Router durante el arranque', () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    let user: unknown = null;
    auth.restoreSession().subscribe((value) => (user = value));

    const request = http.expectOne(`${environment.apiBaseUrl}/autenticacion/me`);
    request.flush({ usuarioId: '1', nombre: 'Prueba' }, { status: 200, statusText: 'OK' });

    expect(interceptedUrls).not.toContain(`${environment.apiBaseUrl}/autenticacion/me`);
    expect(user).toBeTruthy();
  });

  it('login sí pasa por interceptores', () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    auth
      .login({ usuario: 'admin', clave: '1234', idTienda: 1 })
      .subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/autenticacion/login`);
    request.flush({ expiraEn: '2026-12-31T00:00:00' }, { status: 200, statusText: 'OK' });

    expect(interceptedUrls).toContain(`${environment.apiBaseUrl}/autenticacion/login`);
  });
});
