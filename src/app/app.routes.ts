import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { PurchaseOrderPage } from './pages/purchase-order/purchase-order';
import { CustomerMasterPage } from './pages/customer-master/customer-master';
import { authChildGuard, authGuard } from './core/guards/auth.guard';
import { LoginPage } from './pages/login/login';
import { ApplicationPageSetupPage } from './pages/application-page-setup/application-page-setup';
import { CompaniesPage } from './pages/companies/companies';
import { CompanySetupPage } from './pages/company-setup/company-setup';
import { PageFieldSetupPage } from './pages/page-field-setup/page-field-setup';
import { PermissionFieldRuleSetupPage } from './pages/permission-field-rule-setup/permission-field-rule-setup';
import { PermissionSetSetupPage } from './pages/permission-set-setup/permission-set-setup';
import { RoleSetupPage } from './pages/role-setup/role-setup';
import { UserSetupPage } from './pages/user-setup/user-setup';

export const routes: Routes = [
  {
    path: 'auth/login',
    component: LoginPage
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      { path: '', component: DashboardPage },
      { path: 'purchase-order', component: PurchaseOrderPage, data: { pageId: 'purchase-order' } },
      { path: 'customers', component: CustomerMasterPage, data: { pageId: 'customer-master' } },
      { path: 'admin/permission/users', component: UserSetupPage, data: { pageId: 'user-setup' } },
      { path: 'admin/permission/company-information', component: CompanySetupPage, data: { pageId: 'company-setup' } },
      { path: 'admin/permission/companies', component: CompaniesPage, data: { pageId: 'companies' } },
      { path: 'admin/permission/roles', component: RoleSetupPage, data: { pageId: 'role-setup' } },
      { path: 'admin/permission/permission-sets', component: PermissionSetSetupPage, data: { pageId: 'permission-set-setup' } },
      { path: 'admin/permission/app-pages', component: ApplicationPageSetupPage, data: { pageId: 'application-page-setup' } },
      { path: 'admin/permission/page-fields', component: PageFieldSetupPage, data: { pageId: 'page-field-setup' } },
      { path: 'admin/permission/field-rules', component: PermissionFieldRuleSetupPage, data: { pageId: 'permission-field-rule-setup' } }
    ]
  }
];
