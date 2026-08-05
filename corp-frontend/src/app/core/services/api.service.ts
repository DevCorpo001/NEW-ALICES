import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface PingResponse {
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  ping() {
    return this.http.get<PingResponse>(`${environment.apiBaseUrl}/ping`);
  }
}
