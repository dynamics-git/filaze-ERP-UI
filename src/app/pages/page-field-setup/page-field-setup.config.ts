import {
  DataSourceConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

export const pageFieldSetupListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageType: 'list',
  pageId: 'page-field-setup',
  title: 'Page Field Setup',
  subtitle: 'Select a page and maintain field controls',
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
  searchFields: ['pageId', 'pageCode', 'pageName', 'routePath'],
  searchPlaceholder: 'Search page id, code, name, route',
  dataSource: {
    endpoint: '/app-pages',
    keyField: 'systemId',
    documentNoField: 'pageId',
    defaultSort: 'pageCode asc',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    pageSize: 25,
  },
  dataSurface: {
    id: 'page-field-setup-grid',
    idField: 'systemId',
    columns: [
      { id: 'pageId', field: 'pageId', label: 'Page ID', isPrimary: true },
      { id: 'pageCode', field: 'pageCode', label: 'Page Code' },
      { id: 'pageName', field: 'pageName', label: 'Page Name' },
      { id: 'moduleName', field: 'moduleName', label: 'Module' },
      { id: 'routePath', field: 'routePath', label: 'Route Path' },
      { id: 'isActive', field: 'isActive', label: 'Active', type: 'badge', align: 'center' },
    ],
  },
};

export const pageFieldSetupHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Page Field Setup',
  toolbarButtons: [
    {
      id: 'header-save',
      label: 'Save',
      actionKey: 'save',
      surface: 'header',
      icon: 'bi bi-save',
      group: 'Process',
      isPrimary: true,
      order: 10,
    },
  ],
  sections: [
    {
      id: 'header-main',
      title: 'Selected Page',
      fields: [
        { key: 'pageId', label: 'Page ID', type: 'text', valueType: 'text', },
        { key: 'pageName', label: 'Page Name', type: 'text', valueType: 'text', },
        { key: 'pageCode', label: 'Page Code', type: 'text', valueType: 'text', },
        { key: 'routePath', label: 'Route Path', type: 'text', valueType: 'text',},
      ],
    },
  ],
};

export const pageFieldSetupLineConfig: LineConfig = {
  placement: { mode: 'after-section', afterSectionId: 'header-main' },
  selectable: true,
  editable: true,
  toolbarButtons: [
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
  ],
  dataSource: {
    endpoint: '/page-fields',
    keyField: 'systemId',
    // BC relation key on line.
    parentKeyField: 'pageId',
    // BC relation source on header/list.
    documentNoField: 'pageId',
    lineNo: true,
    defaultSort: 'lineNo asc',
    createFields: ['pageId', 'fieldId', 'fieldCode', 'fieldName', 'fieldType', 'isActive'],
    updateBlockedFields: ['systemId', 'pageId'],
  },
  lineKeyField: 'lineNo',
  columns: [
    { id: 'lineNo', field: 'lineNo', label: 'Line No.', valueType: 'number', cellType: 'text', align: 'end' },
    { id: 'fieldId', field: 'fieldId', label: 'Field ID', valueType: 'text', cellType: 'text' },
    { id: 'fieldCode', field: 'fieldCode', label: 'Field Code', valueType: 'text', cellType: 'text' },
    { id: 'fieldName', field: 'fieldName', label: 'Field Name', valueType: 'text', cellType: 'text' },
    {
      id: 'fieldType',
      field: 'fieldType',
      label: 'Field Type',
      valueType: 'text',
      cellType: 'dropdown',
      options: [
        { label: 'Text', value: 'Text' },
        { label: 'Numeric', value: 'Numeric' },
        { label: 'Date', value: 'Date' },
        { label: 'Boolean', value: 'Boolean' },
        { label: 'Option', value: 'Option' },
        { label: 'Lookup', value: 'Lookup' },
      ],
    },
    {
      id: 'isActive',
      field: 'isActive',
      label: 'Active',
      valueType: 'boolean',
      cellType: 'select',
      options: [
        { label: 'No', value: false },
        { label: 'Yes', value: true },
      ],
    },
  ],
};
