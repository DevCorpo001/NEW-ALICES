import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TiendaOption } from '../../../core/auth/auth.models';

@Injectable({ providedIn: 'root' })
export class TiendaApiService {
  private readonly http = inject(HttpClient);

  getActive(): Observable<TiendaOption[]> {
    return this.http.get<TiendaOption[]>(`${environment.apiBaseUrl}/tiendas`);
  }
}
