import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { PurchaseInvoicePage } from './pages/purchase-invoice/purchase-invoice';
import { PurchaseOrderPage } from './pages/purchase-order/purchase-order';
import { authGuard } from './core/guards/auth.guard';
import { LoginPage } from './pages/login/login';

export const routes: Routes = [
  {
    path: 'auth/login',
    component: LoginPage
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardPage },
      { path: 'purchase-order', component: PurchaseOrderPage },
      { path: 'purchase-invoice', component: PurchaseInvoicePage }
    ]
  }
];
