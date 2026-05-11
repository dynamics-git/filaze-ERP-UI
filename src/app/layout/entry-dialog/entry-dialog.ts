import { Component, EventEmitter, Input, Output } from '@angular/core';

export type EntryDialog = 'header' | 'dimensions' | 'attachments' | 'line' | 'posting';

@Component({
  selector: 'app-entry-dialog',
  standalone: true,
  templateUrl: './entry-dialog.html',
  styleUrl: './entry-dialog.scss'
})
export class EntryDialogComponent {
  @Input() pageLabel = 'New';
  @Input() title = 'Account journal';
  @Input() subtitle = 'General ledger · Cronus International Ltd.';
  @Output() closed = new EventEmitter<void>();

  entryMaximized = false;
  activeEntryDialog: EntryDialog | null = null;

  toggleEntrySize(): void {
    this.entryMaximized = !this.entryMaximized;
  }

  openEntryDialog(dialog: EntryDialog): void {
    this.activeEntryDialog = dialog;
  }

  closeEntryDialog(): void {
    this.activeEntryDialog = null;
  }

  get detailTitle(): string {
    switch (this.activeEntryDialog) {
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
      default:
        return '';
    }
  }
}
