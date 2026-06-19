import {
  DataSourceConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

type AppPageSetupListConfig = ListPageConfig & { dataSource: DataSourceConfig };

const moduleOptions = [
  { label: 'Finance', value: 'Finance' },
  { label: 'Sales', value: 'Sales' },
  { label: 'Purchase', value: 'Purchase' },
  { label: 'Inventory', value: 'Inventory' },
  { label: 'Manufacturing', value: 'Manufacturing' },
  { label: 'Projects', value: 'Projects' },
  { label: 'HR', value: 'HR' },
  { label: 'Admin', value: 'Admin' },
];

const yesNoOptions = [
  { label: 'No', value: false },
  { label: 'Yes', value: true },
];

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

export const appPageSetupListConfig: AppPageSetupListConfig = {
  pageType: 'setup',
  pageId: 'application-page-setup',
  title: 'Application Page Setup',
  subtitle: 'ERP page and action registry',
  module: 'Admin',
  viewSuffix: 'application pages',
  views: [{ id: 'all', label: 'All' }],
  activeViewId: 'all',
  tools: {
    refresh: true,
    filter: true,
    advancedFilter: true,
    export: false,
    columns: true,
  },
  searchFields: ['pageId', 'pageCode', 'pageName', 'moduleName', 'routePath'],
  searchPlaceholder: 'Search page id, code, name or route',
  dataSource: {
    endpoint: '/app-pages',
    keyField: 'systemId',
    documentNoField: 'pageId',
    defaultSort: 'moduleName asc,pageCode asc',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    pageSize: 25,
  },
  dataSurface: {
    id: 'application-page-setup-grid',
    idField: 'systemId',
    columns: [
      {
        id: 'pageId',
        field: 'pageId',
        label: 'Page ID',
        isPrimary: true,
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 10, fallback: '-' },
      },
      {
        id: 'pageCode',
        field: 'pageCode',
        label: 'Code',
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 20, fallback: '-' },
      },
      {
        id: 'pageName',
        field: 'pageName',
        label: 'Name',
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 30, fallback: '-' },
      },
      {
        id: 'moduleName',
        field: 'moduleName',
        label: 'Module',
        factPanel: { sectionId: 'routing', sectionTitle: 'Routing', order: 10, fallback: '-' },
      },
      {
        id: 'routePath',
        field: 'routePath',
        label: 'Route',
        factPanel: { sectionId: 'routing', sectionTitle: 'Routing', order: 20, fallback: '-' },
      },
      {
        id: 'isActive',
        field: 'isActive',
        label: 'Active',
        type: 'badge',
        align: 'center',
        factPanel: { sectionId: 'routing', sectionTitle: 'Routing', order: 30, fallback: 'true' },
      },
    ],
  },
  factPanel: {
    enabled: true,
    title: 'Application Page',
    binding: {
      titleField: 'pageName',
      titleFallbackFields: ['pageId'],
      subtitleField: 'routePath',
      summaryField: 'moduleName',
    },
  },
};

export const appPageSetupHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Application Page Setup',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        {
          key: 'pageId',
          label: 'Page ID',
          type: 'text',
          valueType: 'text',
          required: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 10, fallback: '-' },
        },
        {
          key: 'pageCode',
          label: 'Page Code',
          type: 'text',
          valueType: 'text',
          required: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 20, fallback: '-' },
        },
        {
          key: 'pageName',
          label: 'Page Name',
          type: 'text',
          valueType: 'text',
          required: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 30, fallback: '-' },
        },
        {
          key: 'isActive',
          label: 'Active',
          type: 'boolean',
          valueType: 'boolean',
          defaultValue: true,
          factPanel: { sectionId: 'routing', sectionTitle: 'Routing', order: 30, fallback: 'true' },
        },
      ],
    },
    {
      id: 'routing',
      title: 'Routing',
      fields: [
        {
          key: 'moduleName',
          label: 'Module',
          type: 'select',
          valueType: 'text',
          options: moduleOptions,
          required: true,
          factPanel: { sectionId: 'routing', sectionTitle: 'Routing', order: 10, fallback: '-' },
        },
        {
          key: 'routePath',
          label: 'Route Path',
          type: 'text',
          valueType: 'text',
          required: true,
          factPanel: { sectionId: 'routing', sectionTitle: 'Routing', order: 20, fallback: '-' },
        },
      ],
    },
    {
      id: 'audit',
      title: 'Audit',
      fields: [
        { key: 'systemId', label: 'System ID', type: 'text', valueType: 'text', readonly: true },
        { key: 'createdAt', label: 'Created At', type: 'date', valueType: 'date', readonly: true },
        { key: 'updatedAt', label: 'Updated At', type: 'date', valueType: 'date', readonly: true },
      ],
    },
  ],
};

export const appPageSetupLineConfig: LineConfig = {
  placement: { mode: 'after-section', afterSectionId: 'general' },
  selectable: true,
  editable: true,
  toolbarButtons: lineToolbarButtons,
  dataSource: {
    endpoint: '/page-actions',
    keyField: 'systemId',
    parentKeyField: 'pageId',
    documentNoField: 'pageId',
    lineNo: true,
    defaultSort: 'lineNo asc',
    createFields: ['pageId', 'lineNo', 'actionId', 'actionCode', 'actionName', 'isActive'],
    updateBlockedFields: ['systemId', 'pageId'],
  },
  lineKeyField: 'lineNo',
  columns: [
    { id: 'lineNo', field: 'lineNo', label: 'Line No.', valueType: 'number', cellType: 'text', align: 'end' },
    {
      id: 'actionId',
      field: 'actionId',
      label: 'Action ID',
      valueType: 'text',
      cellType: 'text',
      factPanel: { sectionId: 'line', sectionTitle: 'Action', order: 10, fallback: '-' },
    },
    {
      id: 'actionCode',
      field: 'actionCode',
      label: 'Action Code',
      valueType: 'text',
      cellType: 'text',
      factPanel: { sectionId: 'line', sectionTitle: 'Action', order: 20, fallback: '-' },
    },
    {
      id: 'actionName',
      field: 'actionName',
      label: 'Action Name',
      valueType: 'text',
      cellType: 'text',
      factPanel: { sectionId: 'line', sectionTitle: 'Action', order: 30, fallback: '-' },
    },
    {
      id: 'isActive',
      field: 'isActive',
      label: 'Active',
      valueType: 'boolean',
      cellType: 'select',
      options: yesNoOptions,
      factPanel: { sectionId: 'line', sectionTitle: 'Action', order: 40, fallback: 'true' },
    },
  ],
};
