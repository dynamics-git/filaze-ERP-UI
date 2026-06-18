import {
  DataSourceConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

type PermissionListConfig = ListPageConfig & { dataSource: DataSourceConfig };

const lineToolbarButtons = [
  {
    id: 'line-new',
    label: 'Line',
    actionKey: 'cmd:line-new',
    group: 'Process',
    isPrimary: true,
    order: 10,
    icon: 'bi bi-plus-lg',
  },
  {
    id: 'line-delete',
    label: 'Delete',
    actionKey: 'cmd:line-delete',
    group: 'Process',
    order: 20,
    icon: 'bi bi-trash',
  },
];

const moduleOptions = [
  { label: 'Sales', value: 'Sales' },
  { label: 'Purchase', value: 'Purchase' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Inventory', value: 'Inventory' },
  { label: 'Admin', value: 'Admin' },
  { label: 'HR', value: 'HR' },
  { label: 'Project', value: 'Project' },
];

const fieldTypeOptions = [
  { label: 'Text', value: 'Text' },
  { label: 'Numeric', value: 'Numeric' },
  { label: 'Date', value: 'Date' },
  { label: 'Boolean', value: 'Boolean' },
  { label: 'Option', value: 'Option' },
  { label: 'Lookup', value: 'Lookup' },
];

const booleanOptions = [
  { label: 'No', value: false },
  { label: 'Yes', value: true },
];

const setupTools = {
  refresh: true,
  filter: true,
  advancedFilter: true,
  export: false,
  columns: true,
};

const setupViews = [{ id: 'all', label: 'All' }];

const standardCommands = [
  {
    id: 'refresh',
    label: 'Refresh',
    actionKey: 'refresh',
    surface: 'list' as const,
    icon: 'bi bi-arrow-clockwise',
    group: 'system',
    order: 10,
  },
];

const saveHeaderButtons = [
  {
    id: 'header-save',
    label: 'Save',
    actionKey: 'save',
    surface: 'header' as const,
    icon: 'bi bi-save',
    group: 'Process',
    isPrimary: true,
    order: 10,
  },
];

const auditSection = {
  id: 'audit',
  title: 'Audit',
  fields: [
    { key: 'createdAt', label: 'Created At', type: 'date' as const, valueType: 'date' as const, readonly: true },
    { key: 'updatedAt', label: 'Updated At', type: 'date' as const, valueType: 'date' as const, readonly: true },
    { key: 'createdBy', label: 'Created By', type: 'text' as const, valueType: 'text' as const, readonly: true },
    { key: 'modifiedBy', label: 'Modified By', type: 'text' as const, valueType: 'text' as const, readonly: true },
  ],
};

function listConfig(config: PermissionListConfig): PermissionListConfig {
  return {
    pageType: 'setup',
    defaultOpenTarget: 'list',
    module: 'Admin',
    views: setupViews,
    activeViewId: 'all',
    commands: standardCommands,
    tools: setupTools,
    ...config,
  };
}

function lineConfig(config: Omit<LineConfig, 'toolbarButtons'> & Partial<Pick<LineConfig, 'toolbarButtons'>>): LineConfig {
  return {
    selectable: true,
    editable: true,
    ...config,
    toolbarButtons: config.toolbarButtons ?? lineToolbarButtons,
  };
}

export const companySetupListConfig = listConfig({
  pageId: 'company-setup',
  title: 'Companies',
  subtitle: 'Company master setup',
  viewSuffix: 'companies',
  searchFields: ['companyId', 'companyCode', 'companyName'],
  searchPlaceholder: 'Search company id, code or name',
  dataSource: {
    endpoint: '/companies',
    keyField: 'systemId',
    documentNoField: 'companyId',
    defaultSort: 'companyCode asc',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    pageSize: 25,
  },
  dataSurface: {
    id: 'company-setup-grid',
    idField: 'systemId',
    columns: [
      { id: 'companyId', field: 'companyId', label: 'Company ID', isPrimary: true },
      { id: 'companyCode', field: 'companyCode', label: 'Code' },
      { id: 'companyName', field: 'companyName', label: 'Name' },
      { id: 'isActive', field: 'isActive', label: 'Active', type: 'badge', align: 'center' },
    ],
  },
});

export const companySetupHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Company Setup',
  toolbarButtons: saveHeaderButtons,
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        { key: 'companyId', label: 'Company ID', type: 'text', valueType: 'text', required: true },
        { key: 'companyCode', label: 'Company Code', type: 'text', valueType: 'text', required: true },
        { key: 'companyName', label: 'Company Name', type: 'text', valueType: 'text', required: true },
        { key: 'isActive', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
    auditSection,
  ],
};
