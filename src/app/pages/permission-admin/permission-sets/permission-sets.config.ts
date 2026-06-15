import { DataSourceConfig, EntryHeaderConfig, ListPageConfig } from '../../../shared/erp-core/public-api';

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
      { id: 'code', field: 'code', label: 'Code', isPrimary: true },
      { id: 'name', field: 'name', label: 'Name' },
      { id: 'role_id', field: 'role_id', label: 'Role' },
      { id: 'description', field: 'description', label: 'Description' },
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
      id: 'header-main',
      title: 'Primary Details',
      fields: [
        { key: 'code', label: 'Code', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        {
          key: 'role_id',
          label: 'Role',
          type: 'dropdown',
          valueType: 'text',
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
