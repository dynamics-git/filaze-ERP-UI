import { DataSourceConfig, EntryHeaderConfig, ListPageConfig } from '../../../shared/erp-core/public-api';

export const rolesListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageId: 'roles',
  pageCode: 'ROLES',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Roles',
  module: 'Admin',
  viewSuffix: 'roles',
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
      { id: 'code', field: 'code', label: 'Code', isPrimary: true },
      { id: 'name', field: 'name', label: 'Name' },
      { id: 'description', field: 'description', label: 'Description' },
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
      id: 'header-main',
      title: 'Primary Details',
      fields: [
        { key: 'code', label: 'Code', type: 'text', required: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', width: 'wide' },
        { key: 'is_system', label: 'System Role', type: 'boolean', valueType: 'boolean' },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
};
