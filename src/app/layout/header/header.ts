import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  isLive = false;
  company = 'Cronus International Ltd.';
  activeModule = 'Purchase';

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

  setActiveModule(module: string): void {
    this.activeModule = module;
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