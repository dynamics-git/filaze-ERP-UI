import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { PurchaseOrderPage } from './pages/purchase-order/purchase-order';
import { CustomerMasterPage } from './pages/customer-master/customer-master';
import { PermissionAdminPage } from './pages/permission-admin/permission-admin';
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
      {
        path: 'purchase-order',
        component: PurchaseOrderPage,
        data: { pageCode: 'PURCHASE_ORDER' }
      },
      {
        path: 'customers',
        component: CustomerMasterPage,
        data: { pageCode: 'CUSTOMER_MASTER' }
      },
      {
        path: 'admin/security/roles',
        component: PermissionAdminPage,
        data: { pageCode: 'ROLES', permissionPage: 'roles' }
      },
      {
        path: 'admin/security/user-roles',
        component: PermissionAdminPage,
        data: { pageCode: 'USER_ROLES', permissionPage: 'user-roles' }
      },
      {
        path: 'admin/security/permission-sets',
        component: PermissionAdminPage,
        data: { pageCode: 'PERMISSION_SETS', permissionPage: 'permission-sets' }
      },
      {
        path: 'admin/security/role-permission-sets',
        component: PermissionAdminPage,
        data: { pageCode: 'ROLE_PERMISSION_SETS', permissionPage: 'role-permission-sets' }
      },
      {
        path: 'admin/security/page-permissions',
        component: PermissionAdminPage,
        data: { pageCode: 'PAGE_PERMISSIONS', permissionPage: 'page-permissions' }
      },
      {
        path: 'admin/security/field-permissions',
        component: PermissionAdminPage,
        data: { pageCode: 'FIELD_PERMISSIONS', permissionPage: 'field-permissions' }
      },
      {
        path: 'admin/security/data-access-rules',
        component: PermissionAdminPage,
        data: { pageCode: 'DATA_ACCESS_RULES', permissionPage: 'data-access-rules' }
      },
      {
        path: 'admin/security/permission-audit-logs',
        component: PermissionAdminPage,
        data: { pageCode: 'PERMISSION_AUDIT_LOGS', permissionPage: 'permission-audit-logs' }
      },
    ]
  }
];
