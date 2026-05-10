import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-dynamic-loader',
  templateUrl: './dynamic-loader.component.html',
  styleUrl: './dynamic-loader.component.scss',
  imports: [CommonModule]
})
export class DynamicLoaderComponent {
  @Input() loading: boolean = false;

}
