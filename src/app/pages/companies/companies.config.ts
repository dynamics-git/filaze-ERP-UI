import {
  DataSourceConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

export const companiesListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageId: 'companies',
  pageType: 'list',
  title: 'Companies',
  subtitle: 'Company directory',
  module: 'Admin',
  viewSuffix: 'companies',
  views: [{ id: 'all', label: 'All' }],
  activeViewId: 'all',
  commands: [
    {
      id: 'companies-refresh',
      label: 'Refresh',
      actionKey: 'refresh',
      surface: 'list',
      icon: 'bi bi-arrow-clockwise',
      group: 'system',
      order: 10,
    },
  ],
  tools: {
    refresh: true,
    filter: true,
    advancedFilter: true,
    export: false,
    columns: true,
  },
  searchFields: ['systemId', 'code', 'name'],
  searchPlaceholder: 'Search company id, code or name',
  dataSource: {
    endpoint: '/companies',
    keyField: 'systemId',
    documentNoField: 'code',
    defaultSort: 'name asc',
    supportsCreate: false,
    supportsUpdate: false,
    supportsDelete: false,
    pageSize: 25,
  },
  dataSurface: {
    id: 'companies-grid',
    idField: 'systemId',
    columns: [
      { id: 'code', field: 'code', label: 'Code', isPrimary: true },
      { id: 'name', field: 'name', label: 'Name' },
      { id: 'systemId', field: 'systemId', label: 'System ID' },
      { id: 'isActive', field: 'isActive', label: 'Active', type: 'badge', align: 'center' },
    ],
  },
};

export const companiesHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Companies',
  toolbarButtons: [],
  sections: [],
};

export const companiesLineConfig: LineConfig = {
  placement: { mode: 'end' },
  dataSource: {
    endpoint: '/companies',
    keyField: 'systemId',
    documentNoField: 'code',
    defaultSort: 'name asc',
    supportsCreate: false,
    supportsUpdate: false,
    supportsDelete: false,
    pageSize: 100,
  },
  toolbarButtons: [],
  selectable: true,
  editable: false,
  lineKeyField: 'systemId',
  columns: [
    { id: 'code', field: 'code', label: 'Code', cellType: 'text', valueType: 'text', readonly: true },
    { id: 'name', field: 'name', label: 'Name', cellType: 'text', valueType: 'text', readonly: true },
    { id: 'systemId', field: 'systemId', label: 'System ID', cellType: 'text', valueType: 'text', readonly: true },
    { id: 'isActive', field: 'isActive', label: 'Active', cellType: 'text', valueType: 'text', readonly: true },
  ],
};
