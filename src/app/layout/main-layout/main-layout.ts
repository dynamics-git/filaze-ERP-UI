import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Actions } from '../actions/actions';
import { ActionDispatcherService } from '../../shared/erp-core/public-api';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Header, Actions],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  constructor(private readonly actionDispatcher: ActionDispatcherService) {}

  openNew(): void {
    this.actionDispatcher.dispatch('new');
  }

  dispatchAction(actionKey: string): void {
    this.actionDispatcher.dispatch(actionKey);
  }
}
