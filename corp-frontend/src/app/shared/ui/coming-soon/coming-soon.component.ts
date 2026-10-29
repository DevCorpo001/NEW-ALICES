import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideConstruction } from '@ng-icons/lucide';

@Component({
  selector: 'app-coming-soon',
  imports: [NgIcon],
  providers: [provideIcons({ lucideConstruction })],
  templateUrl: './coming-soon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComingSoonComponent {
  private readonly route = inject(ActivatedRoute);

  readonly titulo = (this.route.snapshot.data['titulo'] as string) ?? 'Módulo';
}
