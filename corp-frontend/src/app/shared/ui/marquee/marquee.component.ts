import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-marquee',
  imports: [],
  templateUrl: './marquee.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarqueeComponent {
  readonly text = input.required<string>();
}
