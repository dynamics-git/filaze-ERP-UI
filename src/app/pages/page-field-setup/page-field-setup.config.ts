import {
  DataSourceConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

type PageFieldSetupListConfig = ListPageConfig & { dataSource: DataSourceConfig };

const fieldTypeOptions = [
  { label: 'Text', value: 'Text' },
  { label: 'Numeric', value: 'Numeric' },
  { label: 'Date', value: 'Date' },
  { label: 'Boolean', value: 'Boolean' },
  { label: 'Option', value: 'Option' },
  { label: 'Lookup', value: 'Lookup' },
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

export const pageFieldSetupListConfig: PageFieldSetupListConfig = {
  pageType: 'document',
  pageId: 'page-field-setup',
  title: 'Page Field Setup',
  subtitle: 'Select a page and maintain field registry lines',
  module: 'Admin',
  viewSuffix: 'page fields',
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
    supportsCreate: false,
    supportsUpdate: true,
    supportsDelete: false,
    pageSize: 25,
  },
  dataSurface: {
    id: 'page-field-setup-grid',
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
    ],
  },
  factPanel: {
    enabled: true,
    title: 'Page',
    binding: {
      titleField: 'pageName',
      titleFallbackFields: ['pageId'],
      subtitleField: 'routePath',
      summaryField: 'moduleName',
    },
  },
};

export const pageFieldSetupHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Page Field Setup',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'Selected Page',
      fields: [
        {
          key: 'pageId',
          label: 'Page ID',
          type: 'text',
          valueType: 'text',
          readonly: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 10, fallback: '-' },
        },
        {
          key: 'pageCode',
          label: 'Page Code',
          type: 'text',
          valueType: 'text',
          readonly: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 20, fallback: '-' },
        },
        {
          key: 'pageName',
          label: 'Page Name',
          type: 'text',
          valueType: 'text',
          // readonly: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 30, fallback: '-' },
        },
        {
          key: 'moduleName',
          label: 'Module',
          type: 'text',
          valueType: 'text',
          readonly: true,
          factPanel: { sectionId: 'routing', sectionTitle: 'Routing', order: 10, fallback: '-' },
        },
        {
          key: 'routePath',
          label: 'Route Path',
          type: 'text',
          valueType: 'text',
          readonly: true,
          factPanel: { sectionId: 'routing', sectionTitle: 'Routing', order: 20, fallback: '-' },
        },
      ],
    },
  ],
};

export const pageFieldSetupLineConfig: LineConfig = {
  placement: { mode: 'after-section', afterSectionId: 'general' },
  selectable: true,
  editable: true,
  toolbarButtons: lineToolbarButtons,
  dataSource: {
    endpoint: '/page-fields',
    keyField: 'systemId',
    parentKeyField: 'pageId',
    documentNoField: 'pageId',
    lineNo: true,
    defaultSort: 'lineNo asc',
    createFields: ['pageId', 'lineNo', 'fieldId', 'fieldCode', 'fieldName', 'fieldType', 'isActive'],
    updateBlockedFields: ['systemId', 'pageId'],
  },
  lineKeyField: 'lineNo',
  columns: [
    { id: 'lineNo', field: 'lineNo', label: 'Line No.', valueType: 'number', cellType: 'text', align: 'end' },
    {
      id: 'fieldId',
      field: 'fieldId',
      label: 'Field ID',
      valueType: 'text',
      cellType: 'text',
      factPanel: { sectionId: 'line', sectionTitle: 'Field', order: 10, fallback: '-' },
    },
    {
      id: 'fieldCode',
      field: 'fieldCode',
      label: 'Field Code',
      valueType: 'text',
      cellType: 'text',
      factPanel: { sectionId: 'line', sectionTitle: 'Field', order: 20, fallback: '-' },
    },
    {
      id: 'fieldName',
      field: 'fieldName',
      label: 'Field Name',
      valueType: 'text',
      cellType: 'text',
      factPanel: { sectionId: 'line', sectionTitle: 'Field', order: 30, fallback: '-' },
    },
    {
      id: 'fieldType',
      field: 'fieldType',
      label: 'Field Type',
      valueType: 'text',
      cellType: 'dropdown',
      options: fieldTypeOptions,
      factPanel: { sectionId: 'line', sectionTitle: 'Field', order: 40, fallback: '-' },
    },
    {
      id: 'isActive',
      field: 'isActive',
      label: 'Active',
      valueType: 'boolean',
      cellType: 'select',
      options: yesNoOptions,
      factPanel: { sectionId: 'line', sectionTitle: 'Field', order: 50, fallback: 'true' },
    },
  ],
};
