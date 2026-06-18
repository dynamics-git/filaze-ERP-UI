import {
  DataSourceConfig,
  EntryHeaderConfig,
  SetupPageConfig,
} from '../../shared/erp-core/public-api';

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

export const companySetupPageConfig: SetupPageConfig & { dataSource: DataSourceConfig } = {
  pageType: 'setup',
  pageId: 'company-setup',
  title: 'Company Information',
  subtitle: 'Active company information setup',
  module: 'Admin',
  viewSuffix: 'companyInformation',
  views: setupViews,
  activeViewId: 'all',
  commands: standardCommands,
  tools: setupTools,
  searchFields: ['systemId', 'companyId', 'name', 'city', 'phoneNo', 'email'],
  searchPlaceholder: 'Search company information',
  dataSource: {
    endpoint: '/companies',
    keyField: 'systemId',
    documentNoField: 'systemId',
    defaultSort: 'name asc',
    supportsCreate: false,
    supportsUpdate: true,
    supportsDelete: true,
    pageSize: 1,
    navigation: {
      parentEndpoint: '/companies',
      childCollection: 'companyInformation',
      parentIdFields: ['systemId', 'companyId'],
      top: 1,
    },
  },
  dataSurface: {
    id: 'company-information-grid',
    idField: 'systemId',
    columns: [
      { id: 'systemId', field: 'systemId', label: 'Company ID', isPrimary: true },
      { id: 'name', field: 'name', label: 'Name' },
      { id: 'city', field: 'city', label: 'City' },
      { id: 'phoneNo', field: 'phoneNo', label: 'Phone No' },
      { id: 'email', field: 'email', label: 'Email' },
    ],
  },
};

// Backward-compatible alias for existing consumers.
export const companySetupListConfig = companySetupPageConfig;

export const companySetupHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Company Information',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        { key: 'systemId', label: 'Company ID', type: 'text', valueType: 'text', readonly: true },
        { key: 'companyId', label: 'Tenant Company ID', type: 'text', valueType: 'text', readonly: true },
        { key: 'name', label: 'Company Name', type: 'text', valueType: 'text', required: true },
        { key: 'address', label: 'Address', type: 'text', valueType: 'text' },
        { key: 'address2', label: 'Address 2', type: 'text', valueType: 'text' },
        { key: 'city', label: 'City', type: 'text', valueType: 'text' },
        { key: 'postCode', label: 'Post Code', type: 'text', valueType: 'text' },
        { key: 'phoneNo', label: 'Phone No', type: 'text', valueType: 'text' },
        { key: 'email', label: 'Email', type: 'text', valueType: 'text' },
        { key: 'homePage', label: 'Home Page', type: 'text', valueType: 'text' },
      ],
    },
    {
      ...auditSection,
      fields: [
        { key: 'createdDate', label: 'Created At', type: 'date' as const, valueType: 'date' as const, readonly: true },
        { key: 'modifiedDate', label: 'Updated At', type: 'date' as const, valueType: 'date' as const, readonly: true },
        { key: 'createdBy', label: 'Created By', type: 'text' as const, valueType: 'text' as const, readonly: true },
        { key: 'modifiedBy', label: 'Modified By', type: 'text' as const, valueType: 'text' as const, readonly: true },
      ],
    },
  ],
};
