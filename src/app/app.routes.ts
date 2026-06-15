import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { PurchaseOrderPage } from './pages/purchase-order/purchase-order';
import { CustomerMasterPage } from './pages/customer-master/customer-master';
import { UsersPage } from './pages/permission-admin/users/users';
import { PagesPage } from './pages/permission-admin/pages/pages';
import { RolesPage } from './pages/permission-admin/roles/roles';
import { PermissionSetsPage } from './pages/permission-admin/permission-sets/permission-sets';
import { RolePermissionSetsPage } from './pages/permission-admin/role-permission-sets/role-permission-sets';
import { PagePermissionsPage } from './pages/permission-admin/page-permissions/page-permissions';
import { FieldPermissionsPage } from './pages/permission-admin/field-permissions/field-permissions';
import { PermissionAuditLogsPage } from './pages/permission-admin/permission-audit-logs/permission-audit-logs';
import { authChildGuard, authGuard } from './core/guards/auth.guard';
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
    canActivateChild: [authChildGuard],
    children: [
      { path: '', component: DashboardPage },
      { path: 'purchase-order', component: PurchaseOrderPage, data: { pageId: 'purchase-order' } },
      { path: 'customers', component: CustomerMasterPage, data: { pageId: 'customer-master' } },
      { path: 'users/users', component: UsersPage, data: { pageId: 'users' } },
      { path: 'admin/security/pages', component: PagesPage, data: { pageId: 'pages' } },
      { path: 'admin/security/roles', component: RolesPage, data: { pageId: 'roles' } },
      { path: 'admin/security/permission-sets', component: PermissionSetsPage, data: { pageId: 'permission-sets' } },
      { path: 'admin/security/role-permission-sets', component: RolePermissionSetsPage, data: { pageId: 'role-permission-sets' } },
      { path: 'admin/security/page-permissions', component: PagePermissionsPage, data: { pageId: 'page-permissions' } },
      { path: 'admin/security/field-permissions', component: FieldPermissionsPage, data: { pageId: 'field-permissions' } },
      { path: 'admin/security/permission-audit-logs', component: PermissionAuditLogsPage, data: { pageId: 'permission-audit-logs' } }
    ]
  }
];
