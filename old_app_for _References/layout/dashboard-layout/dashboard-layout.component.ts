import { Component } from '@angular/core';
import { ThemeOptions } from '../theme-options.model';


@Component({
  standalone: false,
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html'
})
export class DashboardLayoutComponent {
  constructor(public globals: ThemeOptions) {}
}
