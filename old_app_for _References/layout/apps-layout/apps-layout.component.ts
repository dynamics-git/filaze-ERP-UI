import { Component, Inject } from '@angular/core';
import { ThemeOptions } from '../theme-options.model';

@Component({
  standalone: false,
  selector: 'app-apps-layout',
  templateUrl: './apps-layout.component.html'
})

export class AppsLayoutComponent {
  constructor(@Inject(ThemeOptions) public globals: ThemeOptions) {}
}



