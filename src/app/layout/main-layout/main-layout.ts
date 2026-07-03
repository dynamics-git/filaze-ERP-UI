import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Actions } from '../actions/actions';
import { ActionDispatcherService, DrawerHostComponent } from '../../shared/erp-core/public-api';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Header, Actions, DrawerHostComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  constructor(
    private readonly actionDispatcher: ActionDispatcherService,
    private readonly router: Router
  ) {}

  get showCommandBar(): boolean {
    const path = this.router.url.split('?')[0];
    return path !== '' && path !== '/';
  }

  openNew(): void {
    this.actionDispatcher.dispatch('new');
  }

  dispatchAction(actionKey: string): void {
    this.actionDispatcher.dispatch(actionKey);
  }
}
