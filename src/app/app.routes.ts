import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { PurchaseOrderPage } from './pages/purchase-order/purchase-order';
import { CustomerMasterPage } from './pages/customer-master/customer-master';
import { PagesPage } from './pages/permission-admin/pages/pages';
import { RolesPage } from './pages/permission-admin/roles/roles';
import { PermissionSetsPage } from './pages/permission-admin/permission-sets/permission-sets';
import { RolePermissionSetsPage } from './pages/permission-admin/role-permission-sets/role-permission-sets';
import { PagePermissionsPage } from './pages/permission-admin/page-permissions/page-permissions';
import { FieldPermissionsPage } from './pages/permission-admin/field-permissions/field-permissions';
import { PermissionAuditLogsPage } from './pages/permission-admin/permission-audit-logs/permission-audit-logs';
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
      { path: 'customers', component: CustomerMasterPage },
      { path: 'admin/security/pages', component: PagesPage },
      { path: 'admin/security/roles', component: RolesPage },
      { path: 'admin/security/permission-sets', component: PermissionSetsPage },
      { path: 'admin/security/role-permission-sets', component: RolePermissionSetsPage },
      { path: 'admin/security/page-permissions', component: PagePermissionsPage },
      { path: 'admin/security/field-permissions', component: FieldPermissionsPage },
      { path: 'admin/security/permission-audit-logs', component: PermissionAuditLogsPage }
    ]
  }
];
