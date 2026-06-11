import { DataSourceConfig, EntryHeaderConfig, ListPageConfig } from '../../shared/erp-core/public-api';

const globalLaravelSource = (endpoint: string, documentNoField = 'code'): DataSourceConfig => ({
  endpoint,
  keyField: 'id',
  documentNoField,
  queryStyle: 'laravel',
  idStyle: 'slash',
  scope: 'global',
  pageSize: 25,
});

export const rolesListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'roles',
  pageCode: 'ROLES',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Roles',
  module: 'Admin',
  viewSuffix: 'security roles',
  dataSource: globalLaravelSource('/roles'),
  dataSurface: {
    id: 'roles-grid',
    idField: 'id',
    columns: [
      { id: 'code', field: 'code', label: 'Role Code', isPrimary: true },
      { id: 'name', field: 'name', label: 'Role Name', subtitleField: 'description' },
      { id: 'application_id', field: 'application_id', label: 'Application' },
      { id: 'is_system', field: 'is_system', label: 'System', type: 'boolean', align: 'center' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
  searchFields: ['code', 'name', 'description'],
  searchPlaceholder: 'Search roles',
};

export const rolesHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Role',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        { key: 'application_id', label: 'Application ID', type: 'number', valueType: 'number', required: true },
        { key: 'code', label: 'Role Code', type: 'text', required: true },
        { key: 'name', label: 'Role Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', width: 'wide' },
        { key: 'is_system', label: 'System Role', type: 'boolean', valueType: 'boolean' },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
};

export const permissionSetsListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'permission-sets',
  pageCode: 'PERMISSION_SETS',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Permission Sets',
  module: 'Admin',
  viewSuffix: 'permission sets',
  dataSource: globalLaravelSource('/permission-sets'),
  dataSurface: {
    id: 'permission-sets-grid',
    idField: 'id',
    columns: [
      { id: 'code', field: 'code', label: 'Permission Set Code', isPrimary: true },
      { id: 'name', field: 'name', label: 'Permission Set Name', subtitleField: 'description' },
      { id: 'application_id', field: 'application_id', label: 'Application' },
      { id: 'priority', field: 'priority', label: 'Priority', type: 'number', align: 'end' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
  searchFields: ['code', 'name', 'description'],
  searchPlaceholder: 'Search permission sets',
};

export const permissionSetsHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Permission Set',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        { key: 'application_id', label: 'Application ID', type: 'number', valueType: 'number', required: true },
        { key: 'code', label: 'Permission Set Code', type: 'text', required: true },
        { key: 'name', label: 'Permission Set Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', width: 'wide' },
        { key: 'priority', label: 'Priority', type: 'number', valueType: 'number', defaultValue: 0 },
        { key: 'effective_from', label: 'Effective From', type: 'date', valueType: 'date' },
        { key: 'effective_to', label: 'Effective To', type: 'date', valueType: 'date' },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
};

export const userRolesListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'user-roles',
  pageCode: 'USER_ROLES',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'User Roles',
  module: 'Admin',
  viewSuffix: 'user role assignments',
  dataSource: globalLaravelSource('/user-roles', 'user_id'),
  dataSurface: {
    id: 'user-roles-grid',
    idField: 'id',
    columns: [
      { id: 'user_id', field: 'user_id', label: 'User ID', isPrimary: true },
      { id: 'role_id', field: 'role_id', label: 'Role ID' },
      { id: 'assigned_by_user_id', field: 'assigned_by_user_id', label: 'Assigned By' },
      { id: 'assigned_at', field: 'assigned_at', label: 'Assigned At', type: 'date' },
      { id: 'expires_at', field: 'expires_at', label: 'Expires At', type: 'date' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
};

export const userRolesHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'User Role',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        { key: 'user_id', label: 'User ID', type: 'number', valueType: 'number', required: true },
        { key: 'role_id', label: 'Role ID', type: 'number', valueType: 'number', required: true },
        { key: 'assigned_by_user_id', label: 'Assigned By User ID', type: 'number', valueType: 'number' },
        { key: 'assigned_at', label: 'Assigned At', type: 'date', valueType: 'date' },
        { key: 'expires_at', label: 'Expires At', type: 'date', valueType: 'date' },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
};

export const rolePermissionSetsListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'role-permission-sets',
  pageCode: 'ROLE_PERMISSION_SETS',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Role Permission Sets',
  module: 'Admin',
  viewSuffix: 'role permission set assignments',
  dataSource: globalLaravelSource('/role-permission-sets', 'role_id'),
  dataSurface: {
    id: 'role-permission-sets-grid',
    idField: 'id',
    columns: [
      { id: 'role_id', field: 'role_id', label: 'Role ID', isPrimary: true },
      { id: 'permission_set_id', field: 'permission_set_id', label: 'Permission Set ID' },
      { id: 'assigned_by_user_id', field: 'assigned_by_user_id', label: 'Assigned By' },
      { id: 'effective_from', field: 'effective_from', label: 'Effective From', type: 'date' },
      { id: 'effective_to', field: 'effective_to', label: 'Effective To', type: 'date' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
};

export const rolePermissionSetsHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Role Permission Set',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        { key: 'role_id', label: 'Role ID', type: 'number', valueType: 'number', required: true },
        { key: 'permission_set_id', label: 'Permission Set ID', type: 'number', valueType: 'number', required: true },
        { key: 'assigned_by_user_id', label: 'Assigned By User ID', type: 'number', valueType: 'number' },
        { key: 'effective_from', label: 'Effective From', type: 'date', valueType: 'date' },
        { key: 'effective_to', label: 'Effective To', type: 'date', valueType: 'date' },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
};

export const pagePermissionsListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'page-permissions',
  pageCode: 'PAGE_PERMISSIONS',
  pageType: 'worksheet',
  defaultOpenTarget: 'list',
  title: 'Page Permissions',
  module: 'Admin',
  viewSuffix: 'page permissions',
  dataSource: globalLaravelSource('/page-permissions', 'page_id'),
  dataSurface: {
    id: 'page-permissions-grid',
    idField: 'id',
    columns: [
      { id: 'permission_set_id', field: 'permission_set_id', label: 'Permission Set', isPrimary: true },
      { id: 'page_id', field: 'page_id', label: 'Page' },
      { id: 'can_view', field: 'can_view', label: 'View', type: 'boolean', align: 'center' },
      { id: 'can_insert', field: 'can_insert', label: 'Insert', type: 'boolean', align: 'center' },
      { id: 'can_edit', field: 'can_edit', label: 'Edit', type: 'boolean', align: 'center' },
      { id: 'can_delete', field: 'can_delete', label: 'Delete', type: 'boolean', align: 'center' },
      { id: 'can_approve', field: 'can_approve', label: 'Approve', type: 'boolean', align: 'center' },
      { id: 'can_post', field: 'can_post', label: 'Post', type: 'boolean', align: 'center' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
};

export const pagePermissionsHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Page Permission',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        { key: 'permission_set_id', label: 'Permission Set ID', type: 'number', valueType: 'number', required: true },
        { key: 'page_id', label: 'Page ID', type: 'number', valueType: 'number', required: true },
        { key: 'can_view', label: 'View', type: 'boolean', valueType: 'boolean' },
        { key: 'can_insert', label: 'Insert', type: 'boolean', valueType: 'boolean' },
        { key: 'can_edit', label: 'Edit', type: 'boolean', valueType: 'boolean' },
        { key: 'can_delete', label: 'Delete', type: 'boolean', valueType: 'boolean' },
        { key: 'can_submit', label: 'Submit', type: 'boolean', valueType: 'boolean' },
        { key: 'can_approve', label: 'Approve', type: 'boolean', valueType: 'boolean' },
        { key: 'can_reject', label: 'Reject', type: 'boolean', valueType: 'boolean' },
        { key: 'can_reopen', label: 'Reopen', type: 'boolean', valueType: 'boolean' },
        { key: 'can_cancel', label: 'Cancel', type: 'boolean', valueType: 'boolean' },
        { key: 'can_assign', label: 'Assign', type: 'boolean', valueType: 'boolean' },
        { key: 'can_export', label: 'Export', type: 'boolean', valueType: 'boolean' },
        { key: 'can_print', label: 'Print', type: 'boolean', valueType: 'boolean' },
        { key: 'can_post', label: 'Post', type: 'boolean', valueType: 'boolean' },
        { key: 'can_archive', label: 'Archive', type: 'boolean', valueType: 'boolean' },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
};

export const fieldPermissionsListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'field-permissions',
  pageCode: 'FIELD_PERMISSIONS',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Field Permissions',
  module: 'Admin',
  viewSuffix: 'field permissions',
  dataSource: globalLaravelSource('/field-permissions', 'field_key'),
  dataSurface: {
    id: 'field-permissions-grid',
    idField: 'id',
    columns: [
      { id: 'permission_set_id', field: 'permission_set_id', label: 'Permission Set', isPrimary: true },
      { id: 'page_id', field: 'page_id', label: 'Page' },
      { id: 'field_key', field: 'field_key', label: 'Field Key' },
      { id: 'visible', field: 'visible', label: 'Visible', type: 'boolean', align: 'center' },
      { id: 'editable', field: 'editable', label: 'Editable', type: 'boolean', align: 'center' },
      { id: 'disabled', field: 'disabled', label: 'Disabled', type: 'boolean', align: 'center' },
      { id: 'required', field: 'required', label: 'Required', type: 'boolean', align: 'center' },
      { id: 'masked', field: 'masked', label: 'Masked', type: 'boolean', align: 'center' },
    ],
  },
};

export const fieldPermissionsHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Field Permission',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        { key: 'permission_set_id', label: 'Permission Set ID', type: 'number', valueType: 'number', required: true },
        { key: 'page_id', label: 'Page ID', type: 'number', valueType: 'number', required: true },
        { key: 'field_key', label: 'Field Key', type: 'text', required: true },
        { key: 'visible', label: 'Visible', type: 'boolean', valueType: 'boolean', defaultValue: true },
        { key: 'editable', label: 'Editable', type: 'boolean', valueType: 'boolean', defaultValue: true },
        { key: 'disabled', label: 'Disabled', type: 'boolean', valueType: 'boolean' },
        { key: 'required', label: 'Required', type: 'boolean', valueType: 'boolean' },
        { key: 'masked', label: 'Masked', type: 'boolean', valueType: 'boolean' },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
};

export const dataAccessRulesListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'data-access-rules',
  pageCode: 'DATA_ACCESS_RULES',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Data Access Rules',
  module: 'Admin',
  viewSuffix: 'data access rules',
  dataSource: globalLaravelSource('/data-access-rules', 'rule_key'),
  dataSurface: {
    id: 'data-access-rules-grid',
    idField: 'id',
    columns: [
      { id: 'rule_key', field: 'rule_key', label: 'Rule Key', isPrimary: true },
      { id: 'permission_set_id', field: 'permission_set_id', label: 'Permission Set' },
      { id: 'module_id', field: 'module_id', label: 'Module' },
      { id: 'page_id', field: 'page_id', label: 'Page' },
      { id: 'operator', field: 'operator', label: 'Operator' },
      { id: 'effect', field: 'effect', label: 'Effect', type: 'badge' },
      { id: 'priority', field: 'priority', label: 'Priority', type: 'number', align: 'end' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
};

export const dataAccessRulesHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Data Access Rule',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        { key: 'permission_set_id', label: 'Permission Set ID', type: 'number', valueType: 'number' },
        { key: 'module_id', label: 'Module ID', type: 'number', valueType: 'number' },
        { key: 'page_id', label: 'Page ID', type: 'number', valueType: 'number' },
        { key: 'rule_key', label: 'Rule Key', type: 'text', required: true },
        { key: 'operator', label: 'Operator', type: 'text', required: true },
        { key: 'effect', label: 'Effect', type: 'select', options: [{ label: 'Allow', value: 'allow' }, { label: 'Deny', value: 'deny' }] },
        { key: 'priority', label: 'Priority', type: 'number', valueType: 'number', defaultValue: 100 },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
    {
      id: 'rule-value',
      title: 'Rule Value',
      fields: [
        { key: 'rule_value', label: 'Rule Value JSON', type: 'textarea', width: 'wide' },
      ],
    },
  ],
};

export const auditLogsListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'permission-audit-logs',
  pageCode: 'PERMISSION_AUDIT_LOGS',
  pageType: 'list',
  defaultOpenTarget: 'list',
  title: 'Permission Audit Logs',
  module: 'Admin',
  viewSuffix: 'audit entries',
  standardActions: { new: false, delete: false, refresh: true },
  dataSource: {
    ...globalLaravelSource('/permission-audit-logs', 'id'),
    supportsCreate: false,
    supportsUpdate: false,
    supportsDelete: false,
  },
  dataSurface: {
    id: 'permission-audit-logs-grid',
    idField: 'id',
    columns: [
      { id: 'created_at', field: 'created_at', label: 'Date Time', type: 'date', isPrimary: true },
      { id: 'user_id', field: 'user_id', label: 'User' },
      { id: 'event_type', field: 'event_type', label: 'Event', type: 'badge' },
      { id: 'entity_type', field: 'entity_type', label: 'Entity Type' },
      { id: 'entity_id', field: 'entity_id', label: 'Entity ID' },
      { id: 'ip_address', field: 'ip_address', label: 'IP Address' },
    ],
  },
};

export const auditLogsHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Permission Audit Log',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'Audit',
      fields: [
        { key: 'created_at', label: 'Date Time', type: 'date', readonly: true },
        { key: 'user_id', label: 'User ID', type: 'text', readonly: true },
        { key: 'event_type', label: 'Event Type', type: 'text', readonly: true },
        { key: 'entity_type', label: 'Entity Type', type: 'text', readonly: true },
        { key: 'entity_id', label: 'Entity ID', type: 'text', readonly: true },
        { key: 'ip_address', label: 'IP Address', type: 'text', readonly: true },
      ],
    },
  ],
};
