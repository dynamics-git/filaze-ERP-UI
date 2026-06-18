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
    pageType: 'list',
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

export const userSetupListConfig = listConfig({
  pageId: 'user-setup',
  title: 'Users',
  subtitle: 'User setup and company roles',
  viewSuffix: 'users',
  searchFields: ['userId', 'userName', 'email'],
  searchPlaceholder: 'Search user id, name or email',
  dataSource: {
    endpoint: '/users',
    keyField: 'systemId',
    documentNoField: 'userId',
    defaultSort: 'userName asc',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    pageSize: 25,
  },
  dataSurface: {
    id: 'user-setup-grid',
    idField: 'systemId',
    columns: [
      { id: 'userId', field: 'userId', label: 'User ID', isPrimary: true },
      { id: 'userName', field: 'userName', label: 'Name' },
      { id: 'email', field: 'email', label: 'Email' },
      { id: 'isActive', field: 'isActive', label: 'Active', type: 'badge', align: 'center' },
    ],
  },
});

export const userSetupHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'User Setup',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        { key: 'userId', label: 'User ID', type: 'text', valueType: 'text', required: true },
        { key: 'userName', label: 'User Name', type: 'text', valueType: 'text', required: true },
        { key: 'email', label: 'Email', type: 'text', valueType: 'text', required: true },
        { key: 'isActive', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
    auditSection,
  ],
};

export const userSetupLineConfig = lineConfig({
  placement: { mode: 'after-section', afterSectionId: 'general' },
  dataSource: {
    endpoint: '/user-company-roles',
    keyField: 'systemId',
    parentKeyField: 'userId',
    documentNoField: 'systemId',
    defaultSort: 'lineNo asc',
    createFields: ['userId', 'lineNo', 'companyId', 'roleId'],
    updateBlockedFields: ['systemId', 'userId'],
  },
  lineKeyField: 'lineNo',
  columns: [
    { id: 'lineNo', field: 'lineNo', label: 'Line No.', valueType: 'number', cellType: 'text', align: 'end' },
    {
      id: 'companyId',
      field: 'companyId',
      label: 'Company',
      valueType: 'text',
      cellType: 'dropdown',
      api: '/companies',
      valueField: 'systemId',
      labelField: ['companyName', 'companyCode'],
    },
    {
      id: 'roleId',
      field: 'roleId',
      label: 'Role',
      valueType: 'text',
      cellType: 'dropdown',
      api: '/roles',
      valueField: 'systemId',
      labelField: ['roleName', 'roleCode'],
    },
  ],
});
