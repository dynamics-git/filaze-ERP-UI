import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Actions } from '../actions/actions';
import { EntryDialogComponent, type EntryDialog } from '../entry-dialog/entry-dialog';
import { ActionDispatcherService } from '../../shared/erp-core/services/action-dispatcher.service';

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

  constructor(
    private readonly actionDispatcher: ActionDispatcherService,
    private readonly router: Router
  ) {}

  openEntryPane(): void {
    this.actionDispatcher.dispatch('new');

    if (this.router.url !== '/') {
      return;
    }

    this.showEntryPane = true;
  }

  dispatchAction(actionKey: string): void {
    this.actionDispatcher.dispatch(actionKey);
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
