import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataSourceConfig, DocumentRuntimeComponent, EntryHeaderConfig, LineConfig, ListPageConfig } from '../../shared/erp-core/public-api';
import {
  applicationsHeaderConfig,
  applicationsListConfig,
  auditLogsHeaderConfig,
  auditLogsListConfig,
  dataAccessRulesHeaderConfig,
  dataAccessRulesListConfig,
  fieldPermissionsHeaderConfig,
  fieldPermissionsListConfig,
  modulesHeaderConfig,
  modulesListConfig,
  pagePermissionsHeaderConfig,
  pagePermissionsListConfig,
  pagesHeaderConfig,
  pagesListConfig,
  permissionSetupHeaderConfig,
  permissionSetupLineConfig,
  permissionSetupListConfig,
  permissionSetsHeaderConfig,
  permissionSetsListConfig,
  rolePermissionSetsHeaderConfig,
  rolePermissionSetsListConfig,
  rolesHeaderConfig,
  rolesListConfig,
  userRolesHeaderConfig,
  userRolesListConfig,
} from './permission-admin.config';

type PermissionAdminPageKey =
  | 'permission-setup'
  | 'applications'
  | 'modules'
  | 'pages'
  | 'roles'
  | 'user-roles'
  | 'permission-sets'
  | 'role-permission-sets'
  | 'page-permissions'
  | 'field-permissions'
  | 'data-access-rules'
  | 'permission-audit-logs';

type PermissionAdminPageConfig = {
  listConfig: ListPageConfig & { dataSource: DataSourceConfig };
  headerConfig: EntryHeaderConfig;
  lineConfig?: LineConfig;
};

const pageRegistry: Record<PermissionAdminPageKey, PermissionAdminPageConfig> = {
  'permission-setup': {
    listConfig: permissionSetupListConfig,
    headerConfig: permissionSetupHeaderConfig,
    lineConfig: permissionSetupLineConfig,
  },
  applications: {
    listConfig: applicationsListConfig,
    headerConfig: applicationsHeaderConfig,
  },
  modules: {
    listConfig: modulesListConfig,
    headerConfig: modulesHeaderConfig,
  },
  pages: {
    listConfig: pagesListConfig,
    headerConfig: pagesHeaderConfig,
  },
  roles: {
    listConfig: rolesListConfig,
    headerConfig: rolesHeaderConfig,
  },
  'user-roles': {
    listConfig: userRolesListConfig,
    headerConfig: userRolesHeaderConfig,
  },
  'permission-sets': {
    listConfig: permissionSetsListConfig,
    headerConfig: permissionSetsHeaderConfig,
  },
  'role-permission-sets': {
    listConfig: rolePermissionSetsListConfig,
    headerConfig: rolePermissionSetsHeaderConfig,
  },
  'page-permissions': {
    listConfig: pagePermissionsListConfig,
    headerConfig: pagePermissionsHeaderConfig,
  },
  'field-permissions': {
    listConfig: fieldPermissionsListConfig,
    headerConfig: fieldPermissionsHeaderConfig,
  },
  'data-access-rules': {
    listConfig: dataAccessRulesListConfig,
    headerConfig: dataAccessRulesHeaderConfig,
  },
  'permission-audit-logs': {
    listConfig: auditLogsListConfig,
    headerConfig: auditLogsHeaderConfig,
  },
};

@Component({
  selector: 'app-permission-admin',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './permission-admin.html',
})
export class PermissionAdminPage {
  private readonly route = inject(ActivatedRoute);
  private readonly pageKey = this.route.snapshot.data['permissionPage'] as PermissionAdminPageKey;
  private readonly page = pageRegistry[this.pageKey] ?? pageRegistry.roles;

  readonly pageId = this.page.listConfig.id ?? this.pageKey;
  readonly listConfig = this.page.listConfig;
  readonly headerConfig = this.page.headerConfig;
  readonly lineConfig = this.page.lineConfig;

}
