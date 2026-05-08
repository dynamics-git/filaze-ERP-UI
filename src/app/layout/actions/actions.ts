import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-actions',
  templateUrl: './actions.html',
  styleUrl: './actions.scss'
})
export class Actions {
  @Output() newClick = new EventEmitter<void>();
  @Output() deleteClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() filterClick = new EventEmitter<void>();
  @Output() exportClick = new EventEmitter<void>();

  activeView = 'All';

  setView(view: string): void {
    this.activeView = view;
  }
}