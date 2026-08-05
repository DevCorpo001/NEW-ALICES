import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './core/services/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('corp-frontend');
  protected readonly backendStatus = signal('Verificando conexión con el backend...');

  private readonly api = inject(ApiService);

  ngOnInit(): void {
    this.api.ping().subscribe({
      next: (res) => this.backendStatus.set(res.message),
      error: () => this.backendStatus.set('No se pudo conectar con el backend')
    });
  }
}
