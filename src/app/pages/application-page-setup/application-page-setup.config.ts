import {
  DataSourceConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

export const appPageSetupListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageType: 'setup',
  defaultOpenTarget: 'list',
  pageId: 'application-page-setup',
  title: 'Application Pages',
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
    defaultSort: 'pageCode asc',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    pageSize: 25,
  },
  dataSurface: {
    id: 'application-page-setup-grid',
    idField: 'systemId',
    columns: [
      { id: 'pageId', field: 'pageId', label: 'Page ID', isPrimary: true },
      { id: 'pageCode', field: 'pageCode', label: 'Code' },
      { id: 'pageName', field: 'pageName', label: 'Name' },
      { id: 'moduleName', field: 'moduleName', label: 'Module' },
      { id: 'routePath', field: 'routePath', label: 'Route' },
      { id: 'isActive', field: 'isActive', label: 'Active', type: 'badge', align: 'center' },
    ],
  },
};

export const appPageSetupHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Application Page Setup',
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
      id: 'general',
      title: 'General',
      fields: [
        { key: 'pageId', label: 'Page ID', type: 'text', valueType: 'text', required: true },
        { key: 'pageCode', label: 'Page Code', type: 'text', valueType: 'text', required: true },
        { key: 'pageName', label: 'Page Name', type: 'text', valueType: 'text', required: true },
        {
          key: 'moduleName',
          label: 'Module',
          type: 'select',
          valueType: 'text',
          options: [
            { label: 'Sales', value: 'Sales' },
            { label: 'Purchase', value: 'Purchase' },
            { label: 'Finance', value: 'Finance' },
            { label: 'Inventory', value: 'Inventory' },
            { label: 'Admin', value: 'Admin' },
            { label: 'HR', value: 'HR' },
            { label: 'Project', value: 'Project' },
          ],
          required: true,
        },
        { key: 'routePath', label: 'Route Path', type: 'text', valueType: 'text', required: true },
        { key: 'isActive', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
    {
      id: 'audit',
      title: 'Audit',
      fields: [
        { key: 'createdAt', label: 'Created At', type: 'date', valueType: 'date', readonly: true },
        { key: 'updatedAt', label: 'Updated At', type: 'date', valueType: 'date', readonly: true },
        { key: 'createdBy', label: 'Created By', type: 'text', valueType: 'text', readonly: true },
        { key: 'modifiedBy', label: 'Modified By', type: 'text', valueType: 'text', readonly: true },
      ],
    },
  ],
};

export const appPageSetupLineConfig: LineConfig = {
  placement: { mode: 'after-section', afterSectionId: 'general' },
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
    endpoint: '/page-actions',
    keyField: 'systemId',
    parentKeyField: 'pageId',
    documentNoField: 'pageId',
    lineNo: true,
    defaultSort: 'lineNo asc',
    createFields: ['pageId', 'actionId', 'actionCode', 'actionName', 'isActive'],
    updateBlockedFields: ['systemId', 'pageId'],
  },
  lineKeyField: 'lineNo',
  columns: [
    { id: 'lineNo', field: 'lineNo', label: 'Line No.', valueType: 'number', cellType: 'text', align: 'end' },
    { id: 'actionId', field: 'actionId', label: 'Action ID', valueType: 'text', cellType: 'text' },
    { id: 'actionCode', field: 'actionCode', label: 'Action Code', valueType: 'text', cellType: 'text' },
    { id: 'actionName', field: 'actionName', label: 'Action Name', valueType: 'text', cellType: 'text' },
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
