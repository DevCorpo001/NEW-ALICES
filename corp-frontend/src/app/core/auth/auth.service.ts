import { HttpBackend, HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { environment } from '@/environments/environment';
import { LoginRequest, LoginResponse, SessionUser } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionHttp = new HttpClient(inject(HttpBackend));
  private readonly session = signal<SessionUser | null>(null);
  private readonly checked = signal(false);

  readonly user = this.session.asReadonly();
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly sessionChecked = this.checked.asReadonly();

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/autenticacion/login`, request, {
        withCredentials: true
      })
      .pipe(tap((response) => this.setSession(response)));
  }

  restoreSession(): Observable<SessionUser | null> {
    if (this.checked()) {
      return of(this.session());
    }

    return this.sessionHttp
      .get<SessionUser>(`${environment.apiBaseUrl}/autenticacion/me`, {
        withCredentials: true
      })
      .pipe(
        tap((user) => {
          this.session.set(user);
          this.checked.set(true);
        }),
        catchError(() => {
          this.clearSession();
          return of(null);
        })
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${environment.apiBaseUrl}/autenticacion/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.clearSession()));
  }

  clearSession(): void {
    this.session.set(null);
    this.checked.set(true);
  }

  private setSession(user: SessionUser): void {
    this.session.set(user);
    this.checked.set(true);
  }
}
