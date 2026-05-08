import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Actions } from '../actions/actions';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Header, Actions],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  showEntryPane = false;
  entryMaximized = false;

  openEntryPane(): void {
    this.showEntryPane = true;
  }

  closeEntryPane(): void {
    this.showEntryPane = false;
    this.entryMaximized = false;
  }

  toggleEntrySize(): void {
    this.entryMaximized = !this.entryMaximized;
  }
}
