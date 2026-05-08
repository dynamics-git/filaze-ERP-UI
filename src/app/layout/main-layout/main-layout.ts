import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Actions } from '../actions/actions';
import { EntryDialogComponent, type EntryDialog } from '../entry-dialog/entry-dialog';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Header, Actions, EntryDialogComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  showEntryPane = false;
  entryMaximized = false;
  activeEntryDialog: EntryDialog | null = null;

  openEntryPane(): void {
    this.showEntryPane = true;
  }

  closeEntryPane(): void {
    this.showEntryPane = false;
    this.entryMaximized = false;
    this.activeEntryDialog = null;
  }

  toggleEntrySize(): void {
    this.entryMaximized = !this.entryMaximized;
  }

  openEntryDialog(dialog: EntryDialog): void {
    this.activeEntryDialog = dialog;
  }

  closeEntryDialog(): void {
    this.activeEntryDialog = null;
  }

  get entryDialogTitle(): string {
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
