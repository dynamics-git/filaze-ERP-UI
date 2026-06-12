import { DataSourceConfig, EntryHeaderConfig, LineConfig, ListPageConfig } from '../../shared/erp-core/public-api';

export const applicationsListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'applications',
  pageCode: 'APPLICATIONS',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Applications',
  module: 'Admin',
  viewSuffix: 'permission applications',
  dataSource: {
    endpoint: '/applications',
    keyField: 'systemId',
    documentNoField: 'code',
    pageSize: 25,
  },
  dataSurface: {
    id: 'applications-grid',
    idField: 'systemId',
    columns: [
      { id: 'code', field: 'code', label: 'Code', isPrimary: true },
      { id: 'name', field: 'name', label: 'Name' },
      { id: 'effective_from', field: 'effective_from', label: 'Effective From', type: 'date' },
      { id: 'effective_to', field: 'effective_to', label: 'Effective To', type: 'date' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
  searchFields: ['code', 'name'],
  searchPlaceholder: 'Search applications',
};

export const applicationsHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Application',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        { key: 'code', label: 'Code', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'effective_from', label: 'Effective From', type: 'date', valueType: 'date' },
        { key: 'effective_to', label: 'Effective To', type: 'date', valueType: 'date' },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
    {
      id: 'meta',
      title: 'Meta',
      fields: [{ key: 'meta', label: 'Meta JSON', type: 'textarea', width: 'wide' }],
    },
  ],
};

export const modulesListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'modules',
  pageCode: 'MODULES',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Modules',
  module: 'Admin',
  viewSuffix: 'permission modules',
  dataSource: {
    endpoint: '/modules',
    keyField: 'systemId',
    documentNoField: 'code',
    pageSize: 25,
  },
  dataSurface: {
    id: 'modules-grid',
    idField: 'systemId',
    columns: [
      { id: 'code', field: 'code', label: 'Code', isPrimary: true },
      { id: 'name', field: 'name', label: 'Name' },
      { id: 'application_id', field: 'application_id', label: 'Application' },
      { id: 'slug', field: 'slug', label: 'Slug' },
      { id: 'sort_order', field: 'sort_order', label: 'Sort Order', type: 'number', align: 'end' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
  searchFields: ['code', 'name', 'slug'],
  searchPlaceholder: 'Search modules',
};

export const modulesHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Module',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        {
          key: 'application_id',
          label: 'Application',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/applications',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'application_id', 'applicationId', 'ApplicationId'],
          labelField: ['name', 'Name', 'code', 'Code'],
        },
        { key: 'code', label: 'Code', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'slug', label: 'Slug', type: 'text' },
        { key: 'sort_order', label: 'Sort Order', type: 'number', valueType: 'number', defaultValue: 10 },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
};

export const pagesListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'pages',
  pageCode: 'PAGES',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Pages',
  module: 'Admin',
  viewSuffix: 'permission pages',
  dataSource: {
    endpoint: '/pages',
    keyField: 'systemId',
    documentNoField: 'code',
    pageSize: 25,
  },
  dataSurface: {
    id: 'pages-grid',
    idField: 'systemId',
    columns: [
      { id: 'code', field: 'code', label: 'Code', isPrimary: true },
      { id: 'name', field: 'name', label: 'Name' },
      { id: 'module_id', field: 'module_id', label: 'Module' },
      { id: 'route_path', field: 'route_path', label: 'Route Path' },
      { id: 'component_key', field: 'component_key', label: 'Component Key' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
  searchFields: ['code', 'name', 'route_path', 'component_key'],
  searchPlaceholder: 'Search pages',
};

export const pagesHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Page',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        {
          key: 'module_id',
          label: 'Module',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/modules',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'module_id', 'moduleId', 'ModuleId'],
          labelField: ['name', 'Name', 'code', 'Code'],
        },
        { key: 'code', label: 'Code', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'route_path', label: 'Route Path', type: 'text' },
        { key: 'component_key', label: 'Component Key', type: 'text' },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
};

export const permissionSetupListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'permission-setup',
  pageCode: 'PERMISSION_SETUP',
  pageType: 'document',
  defaultOpenTarget: 'list',
  title: 'Permission Setup',
  module: 'Admin',
  viewSuffix: 'role hierarchy setup',
  dataSource: {
    endpoint: '/roles',
    keyField: 'systemId',
    documentNoField: 'code',
    pageSize: 25,
  },
  dataSurface: {
    id: 'permission-setup-grid',
    idField: 'systemId',
    columns: [
      { id: 'code', field: 'code', label: 'Role Code', isPrimary: true },
      { id: 'name', field: 'name', label: 'Role Name', subtitleField: 'description' },
      { id: 'application_id', field: 'application_id', label: 'Application' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
  searchFields: ['code', 'name', 'description'],
  searchPlaceholder: 'Search roles for permission setup',
};

export const permissionSetupHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Permission Setup',
  toolbarButtons: [],
  sections: [
    {
      id: 'role-header',
      title: 'Role Header',
      fields: [
        {
          key: 'application_id',
          label: 'Application',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/applications',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'application_id', 'applicationId', 'ApplicationId'],
          labelField: ['name', 'Name', 'description', 'Description', 'code', 'Code'],
        },
        { key: 'code', label: 'Role Code', type: 'text', required: true },
        { key: 'name', label: 'Role Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', width: 'wide' },
        { key: 'is_system', label: 'System Role', type: 'boolean', valueType: 'boolean' },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
};

export const permissionSetupLineConfig: LineConfig = {
  placement: {
    mode: 'after-section',
    afterSectionId: 'role-header',
  },
  dataSource: {
    endpoint: '/role-permission-sets',
    keyField: 'systemId',
    parentKeyField: 'role_id',
    documentNoField: 'systemId',
    defaultSort: 'created_at desc',
    createFields: ['role_id', 'permission_set_id'],
    updateBlockedFields: ['systemId'],
    pageSize: 25,
  },
  toolbarButtons: [
    { label: 'Link Permission Set', actionKey: 'cmd:line-new', surface: 'line', group: 'Process', isPrimary: true, order: 10 },
    { label: 'Remove Link', actionKey: 'cmd:line-delete', surface: 'line', group: 'Process', tone: 'danger', order: 20 },
  ],
  columns: [
    {
      id: 'permission_set_id',
      field: 'permission_set_id',
      label: 'Permission Set',
      cellType: 'dropdown',
      valueType: 'text',
      api: '/permission-sets',
      valueField: ['systemId', 'SystemId', 'id', 'Id', 'permission_set_id', 'permissionSetId', 'PermissionSetId'],
      labelField: ['name', 'Name', 'code', 'Code'],
      fill: {
        permission_set_id: ['systemId', 'SystemId', 'id', 'Id', 'permission_set_id', 'permissionSetId', 'PermissionSetId'],
      },
    },
    {
      id: 'assigned_by_user_id',
      field: 'assigned_by_user_id',
      label: 'Assigned By',
      cellType: 'dropdown',
      valueType: 'text',
      api: '/users',
      valueField: ['systemId', 'SystemId', 'id', 'Id', 'user_id', 'userId', 'UserId'],
      labelField: ['userName', 'UserName', 'name', 'Name', 'email', 'Email'],
    },
    { id: 'effective_from', field: 'effective_from', label: 'Effective From', cellType: 'text', valueType: 'date' },
    { id: 'effective_to', field: 'effective_to', label: 'Effective To', cellType: 'text', valueType: 'date' },
    {
      id: 'is_active',
      field: 'is_active',
      label: 'Active',
      cellType: 'select',
      valueType: 'boolean',
      options: [
        { label: 'True', value: true },
        { label: 'False', value: false },
      ],
    },
  ],
};

export const rolesListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'roles',
  pageCode: 'ROLES',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Roles',
  module: 'Admin',
  viewSuffix: 'security roles',
  dataSource: {
    endpoint: '/roles',
    keyField: 'systemId',
    documentNoField: 'code',
    pageSize: 25,
  },
  dataSurface: {
    id: 'roles-grid',
    idField: 'systemId',
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
        {
          key: 'application_id',
          label: 'Application',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/applications',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'application_id', 'applicationId', 'ApplicationId'],
          labelField: ['name', 'Name', 'description', 'Description', 'code', 'Code'],
        },
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
  dataSource: {
    endpoint: '/permission-sets',
    keyField: 'systemId',
    documentNoField: 'code',
    pageSize: 25,
  },
  dataSurface: {
    id: 'permission-sets-grid',
    idField: 'systemId',
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
        {
          key: 'application_id',
          label: 'Application',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/applications',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'application_id', 'applicationId', 'ApplicationId'],
          labelField: ['name', 'Name', 'description', 'Description', 'code', 'Code'],
        },
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
  dataSource: {
    endpoint: '/user-roles',
    keyField: 'systemId',
    documentNoField: 'user_id',
    pageSize: 25,
  },
  dataSurface: {
    id: 'user-roles-grid',
    idField: 'systemId',
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
        {
          key: 'user_id',
          label: 'User',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/users',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'user_id', 'userId', 'UserId'],
          labelField: ['userName', 'UserName', 'name', 'Name', 'email', 'Email'],
        },
        {
          key: 'role_id',
          label: 'Role',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/roles',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'role_id', 'roleId', 'RoleId'],
          labelField: ['name', 'Name', 'code', 'Code'],
        },
        {
          key: 'assigned_by_user_id',
          label: 'Assigned By',
          type: 'dropdown',
          valueType: 'text',
          api: '/users',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'userId', 'UserId'],
          labelField: ['userName', 'UserName', 'name', 'Name', 'email', 'Email'],
        },
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
  dataSource: {
    endpoint: '/role-permission-sets',
    keyField: 'systemId',
    documentNoField: 'role_id',
    pageSize: 25,
  },
  dataSurface: {
    id: 'role-permission-sets-grid',
    idField: 'systemId',
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
        {
          key: 'role_id',
          label: 'Role',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/roles',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'role_id', 'roleId', 'RoleId'],
          labelField: ['name', 'Name', 'code', 'Code'],
        },
        {
          key: 'permission_set_id',
          label: 'Permission Set',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/permission-sets',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'permission_set_id', 'permissionSetId', 'PermissionSetId'],
          labelField: ['name', 'Name', 'code', 'Code'],
        },
        {
          key: 'assigned_by_user_id',
          label: 'Assigned By',
          type: 'dropdown',
          valueType: 'text',
          api: '/users',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'userId', 'UserId'],
          labelField: ['userName', 'UserName', 'name', 'Name', 'email', 'Email'],
        },
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
  dataSource: {
    endpoint: '/page-permissions',
    keyField: 'systemId',
    documentNoField: 'page_id',
    pageSize: 25,
  },
  dataSurface: {
    id: 'page-permissions-grid',
    idField: 'systemId',
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
        {
          key: 'permission_set_id',
          label: 'Permission Set',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/permission-sets',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'permission_set_id', 'permissionSetId', 'PermissionSetId'],
          labelField: ['name', 'Name', 'code', 'Code'],
        },
        {
          key: 'page_id',
          label: 'Page',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/pages',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'page_id', 'pageId', 'PageId'],
          labelField: ['name', 'Name', 'code', 'Code', 'pageCode', 'PageCode'],
        },
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
  dataSource: {
    endpoint: '/field-permissions',
    keyField: 'systemId',
    documentNoField: 'field_key',
    pageSize: 25,
  },
  dataSurface: {
    id: 'field-permissions-grid',
    idField: 'systemId',
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
        {
          key: 'permission_set_id',
          label: 'Permission Set',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/permission-sets',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'permission_set_id', 'permissionSetId', 'PermissionSetId'],
          labelField: ['name', 'Name', 'code', 'Code'],
        },
        {
          key: 'page_id',
          label: 'Page',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/pages',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'page_id', 'pageId', 'PageId'],
          labelField: ['name', 'Name', 'code', 'Code', 'pageCode', 'PageCode'],
        },
        {
          key: 'field_key',
          label: 'Field Key',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: ['/page-fields', '/fields'],
          valueField: ['field_key', 'fieldKey', 'key', 'Key', 'name', 'Name', 'code', 'Code'],
          labelField: ['label', 'Label', 'name', 'Name', 'field_key', 'fieldKey', 'code', 'Code'],
        },
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
  dataSource: {
    endpoint: '/data-access-rules',
    keyField: 'systemId',
    documentNoField: 'rule_key',
    pageSize: 25,
  },
  dataSurface: {
    id: 'data-access-rules-grid',
    idField: 'systemId',
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
        {
          key: 'permission_set_id',
          label: 'Permission Set',
          type: 'dropdown',
          valueType: 'text',
          api: '/permission-sets',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'permission_set_id', 'permissionSetId', 'PermissionSetId'],
          labelField: ['name', 'Name', 'code', 'Code'],
        },
        {
          key: 'module_id',
          label: 'Module',
          type: 'dropdown',
          valueType: 'text',
          api: '/modules',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'module_id', 'moduleId', 'ModuleId'],
          labelField: ['name', 'Name', 'code', 'Code', 'moduleCode', 'ModuleCode'],
        },
        {
          key: 'page_id',
          label: 'Page',
          type: 'dropdown',
          valueType: 'text',
          api: '/pages',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'page_id', 'pageId', 'PageId'],
          labelField: ['name', 'Name', 'code', 'Code', 'pageCode', 'PageCode'],
        },
        { key: 'rule_key', label: 'Rule Key', type: 'text', required: true },
        {
          key: 'operator',
          label: 'Operator',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: ['/data-access-operators', '/operators'],
          valueField: ['value', 'Value', 'code', 'Code', 'operator', 'Operator', 'id', 'Id'],
          labelField: ['label', 'Label', 'name', 'Name', 'description', 'Description', 'code', 'Code', 'value', 'Value'],
        },
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
    endpoint: '/permission-audit-logs',
    keyField: 'systemId',
    documentNoField: 'systemId',
    pageSize: 25,
    supportsCreate: false,
    supportsUpdate: false,
    supportsDelete: false,
  },
  dataSurface: {
    id: 'permission-audit-logs-grid',
    idField: 'systemId',
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

