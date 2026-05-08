import { Component, EventEmitter, Input, Output } from '@angular/core';

export type EntryDialog = 'header' | 'dimensions' | 'attachments' | 'line' | 'posting';

@Component({
  selector: 'app-entry-dialog',
  standalone: true,
  templateUrl: './entry-dialog.html',
  styleUrl: './entry-dialog.scss'
})
export class EntryDialogComponent {
  @Input({ required: true }) dialog!: EntryDialog;
  @Output() closed = new EventEmitter<void>();

  get title(): string {
    switch (this.dialog) {
      case 'header':
        return 'Header details';
      case 'dimensions':
        return 'Line dimensions';
      case 'attachments':
        return 'Attachments';
      case 'line':
        return 'Line details';
      case 'posting':
        return 'Posting preview';
    }
  }
}
