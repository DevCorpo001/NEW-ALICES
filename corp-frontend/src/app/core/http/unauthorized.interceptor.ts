import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const unauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  const injector = inject(Injector);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const auth = injector.get(AuthService);
        const router = injector.get(Router);
        if (!router.url.startsWith('/login')) {
          auth.clearSession();
          void router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};
