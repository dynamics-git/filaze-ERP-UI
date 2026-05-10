import { Component } from '@angular/core';
import { ThemeOptions } from '../theme-options.model';

@Component({
  standalone: false,
  selector: 'app-base-layout',
  templateUrl: './base-layout.component.html'
})

export class BaseLayoutComponent {
  constructor(public globals: ThemeOptions) {}
}



