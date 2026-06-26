import {
  DataSourceConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

type PageFieldSetupListConfig = ListPageConfig & { dataSource: DataSourceConfig };

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
  searchFields: ['pageId', 'code', 'name'],
  searchPlaceholder: 'Search page id, code or name',
  dataSource: {
    endpoint: '/appPages',
    keyField: 'systemId',
    documentNoField: 'pageId',
    defaultSort: 'code asc',
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
        id: 'code',
        field: 'code',
        label: 'Code',
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 20, fallback: '-' },
      },
      {
        id: 'name',
        field: 'name',
        label: 'Name',
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 30, fallback: '-' },
      },
    ],
  },
  factPanel: {
    enabled: true,
    title: 'Page',
    binding: {
      titleField: 'name',
      titleFallbackFields: ['pageId'],
      subtitleField: 'code',
      summaryField: 'pageId',
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
          key: 'code',
          label: 'Page Code',
          type: 'text',
          valueType: 'text',
          readonly: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 20, fallback: '-' },
        },
        {
          key: 'name',
          label: 'Page Name',
          type: 'text',
          valueType: 'text',
          // readonly: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 30, fallback: '-' },
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
    endpoint: '/pageFields',
    keyField: 'systemId',
    parentKeyField: 'pageId',
    documentNoField: 'pageId',
    defaultSort: 'fieldId asc',
    createFields: ['pageId', 'fieldId', 'name', 'isSensitive', 'isActive'],
    updateBlockedFields: ['systemId', 'pageId'],
  },
  lineKeyField: 'fieldId',
  columns: [
    {
      id: 'fieldId',
      field: 'fieldId',
      label: 'Field ID',
      valueType: 'text',
      cellType: 'text',
      factPanel: { sectionId: 'line', sectionTitle: 'Field', order: 10, fallback: '-' },
    },
    {
      id: 'name',
      field: 'name',
      label: 'Field Name',
      valueType: 'text',
      cellType: 'text',
      factPanel: { sectionId: 'line', sectionTitle: 'Field', order: 20, fallback: '-' },
    },
    {
      id: 'isSensitive',
      field: 'isSensitive',
      label: 'Sensitive',
      valueType: 'boolean',
      cellType: 'select',
      options: yesNoOptions,
      factPanel: { sectionId: 'line', sectionTitle: 'Field', order: 30, fallback: 'false' },
    },
    {
      id: 'isActive',
      field: 'isActive',
      label: 'Active',
      valueType: 'boolean',
      cellType: 'select',
      options: yesNoOptions,
      factPanel: { sectionId: 'line', sectionTitle: 'Field', order: 40, fallback: 'true' },
    },
  ],
};
