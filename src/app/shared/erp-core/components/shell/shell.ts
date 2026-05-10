import { Component, Input } from '@angular/core';
import { ErpPageConfig } from '../../models/page-config.model';

@Component({
  selector: 'erp-shell',
  standalone: true,
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class ErpShellComponent {
  @Input() config?: ErpPageConfig;
}
