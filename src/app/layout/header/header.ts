import { Component, HostListener } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { MenuItem } from '../../core/models/menu-item.model';
import { ActionDispatcherService } from '../../shared/erp-core/services/action-dispatcher.service';
import { ModuleMenuPanel } from '../module-menu-panel/module-menu-panel';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ModuleMenuPanel],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  isLive = false;
  company = 'Cronus International Ltd.';
  activeModule = '';

  modules = [
    'Finance',
    'Sales',
    'Purchase',
    'Inventory',
    'Manufacturing',
    'Projects',
    'HR',
    'Admin'
  ];

  constructor(
    private readonly router: Router,
    private readonly actionDispatcher: ActionDispatcherService
  ) {
    this.router.events
      .pipe(filter((event): event is NavigationStart => event instanceof NavigationStart))
      .subscribe(() => {
        this.activeModule = '';
      });
  }

  toggleModule(module: string): void {
    this.activeModule = this.activeModule === module ? '' : module;
  }

  closeModulePanel(): void {
    this.activeModule = '';
  }

  @HostListener('document:click', ['$event'])
  closeModulePanelOnOutsideClick(event: MouseEvent): void {
    if (!this.activeModule) {
      return;
    }

    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const clickedModuleButton = Boolean(target.closest('.module-menu-item'));
    const clickedPanel = Boolean(target.closest('.filaz-module-panel'));

    if (!clickedModuleButton && !clickedPanel) {
      this.activeModule = '';
    }
  }

  @HostListener('document:keydown.escape')
  closeModulePanelOnEscape(): void {
    this.activeModule = '';
  }

  onMenuNavigate(item: MenuItem): void {
    if (item.route) {
      this.activeModule = '';

      if (this.router.url.split('?')[0] === item.route) {
        this.actionDispatcher.dispatch('refresh');
        return;
      }

      void this.router.navigate([item.route]);
    }
  }

  changeCompany(): void {
    console.log('Change company clicked');
  }

  openGlobalSearch(): void {
    console.log('Global search clicked');
  }

  openNotifications(): void {
    console.log('Notifications clicked');
  }

  openUserMenu(): void {
    console.log('User menu clicked');
  }
}
