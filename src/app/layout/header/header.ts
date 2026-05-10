import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from '../../core/models/menu-item.model';
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

  constructor(private readonly router: Router) {}

  toggleModule(module: string): void {
    this.activeModule = this.activeModule === module ? '' : module;
  }

  closeModulePanel(): void {
    this.activeModule = '';
  }

  onMenuNavigate(item: MenuItem): void {
    if (item.route) {
      void this.router.navigate([item.route]);
      this.activeModule = '';
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
