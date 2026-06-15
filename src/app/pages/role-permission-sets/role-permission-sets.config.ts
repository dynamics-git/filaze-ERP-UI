import {
  DataSourceConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

export const rolePermissionSetsListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageId: 'role-permission-sets',
  pageCode: 'ROLE_PERMISSION_SETS',
  pageType: 'worksheet',
  defaultOpenTarget: 'list',
  title: 'Role Permission Sets',
  module: 'Admin',
  viewSuffix: 'role permission sets',
  dataSource: {
    endpoint: '/role-permission-sets',
    keyField: 'systemId',
    documentNoField: 'code',
    pageSize: 25,
  },
  dataSurface: {
    id: 'role-permission-sets-grid',
    idField: 'systemId',
    columns: [
      { id: 'code', field: 'code', label: 'Code', isPrimary: true },
      { id: 'role_id', field: 'role_id', label: 'Role' },
      { id: 'description', field: 'description', label: 'Description' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
};

export const rolePermissionSetsHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Role Permission Set',
  toolbarButtons: [],
  sections: [
    {
      id: 'header-main',
      title: 'Primary Details',
      fields: [
        { key: 'code', label: 'Code', type: 'text', required: true },
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
        { key: 'description', label: 'Description', type: 'textarea', width: 'wide' },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
};

export const rolePermissionSetsLineConfig: LineConfig = {
  placement: {
    mode: 'after-section',
    afterSectionId: 'header-main',
  },
  dataSource: {
    endpoint: '/role-permission-set-lines',
    keyField: 'systemId',
    parentKeyField: 'role_permission_set_id',
    documentNoField: 'systemId',
    createFields: ['role_permission_set_id', 'permission_set_id', 'is_default'],
    updateBlockedFields: ['systemId', 'id', 'role_permission_set_id'],
    defaultSort: 'line_no',
  },
  lineKeyField: 'line_no',
  toolbarButtons: [
    {
      label: 'Line',
      actionKey: 'cmd:line-new',
      group: 'Process',
      isPrimary: true,
      order: 10,
      icon: 'bi bi-plus-lg',
    },
    {
      label: 'Delete',
      actionKey: 'cmd:line-delete',
      group: 'Process',
      order: 20,
      icon: 'bi bi-trash',
    },
  ],
  columns: [
    {
      id: 'permission_set_id',
      label: 'Permission Set',
      field: 'permission_set_id',
      valueType: 'text',
      cellType: 'dropdown',
      api: '/permission-sets',
      valueField: ['systemId', 'SystemId', 'id', 'Id', 'permission_set_id', 'permissionSetId', 'PermissionSetId'],
      labelField: ['name', 'Name', 'code', 'Code'],
    },
    {
      id: 'is_default',
      label: 'Default',
      field: 'is_default',
      valueType: 'boolean',
      cellType: 'text',
      align: 'center',
    },
    {
      id: 'is_active',
      label: 'Active',
      field: 'is_active',
      valueType: 'boolean',
      cellType: 'text',
      align: 'center',
    },
  ],
};
