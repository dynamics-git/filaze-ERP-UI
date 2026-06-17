import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { PurchaseOrderPage } from './pages/purchase-order/purchase-order';
import { CustomerMasterPage } from './pages/customer-master/customer-master';

import { PermissionSetsPage } from './pages/permission-sets/permission-sets';

import { authChildGuard, authGuard } from './core/guards/auth.guard';
import { LoginPage } from './pages/login/login';
import { FieldPermissionsPage } from './pages/field-permissions/field-permissions';
import { PagePermissionsPage } from './pages/page-permissions/page-permissions';
import { PagesConfigurationPage } from './pages/pages-configuration/pages-configuration';
import { PermissionAuditLogsPage } from './pages/permission-audit-logs/permission-audit-logs';
import { RolePermissionSetsPage } from './pages/role-permission-sets/role-permission-sets';
import { RolesPage } from './pages/roles/roles';
import { UsersPage } from './pages/users/users';

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
      { path: 'users/users', component: UsersPage, data: { pageId: 'users' } },
      { path: 'admin/security/page-configuration', component: PagesConfigurationPage, data: { pageId: 'page-configuration' } },
      { path: 'admin/security/roles', component: RolesPage, data: { pageId: 'roles' } },
      { path: 'admin/security/permission-sets', component: PermissionSetsPage, data: { pageId: 'permission-sets' } },
      { path: 'admin/security/role-permission-sets', component: RolePermissionSetsPage, data: { pageId: 'role-permission-sets' } },
      { path: 'admin/security/page-permissions', component: PagePermissionsPage, data: { pageId: 'permission-set-rules' } },
      { path: 'admin/security/field-permissions', component: FieldPermissionsPage, data: { pageId: 'field-permissions' } },
      { path: 'admin/security/permission-audit-logs', component: PermissionAuditLogsPage, data: { pageId: 'permission-audit-logs' } }
    ]
  }
];
