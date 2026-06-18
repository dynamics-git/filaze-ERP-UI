import {
  DataSourceConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

export const permissionFieldRuleListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageType: 'setup',
  defaultOpenTarget: 'list',
  pageId: 'permission-field-rule-setup',
  title: 'Permission Field Rules',
  subtitle: 'Field visibility and edit rules',
  module: 'Admin',
  viewSuffix: 'field rules',
  views: [{ id: 'all', label: 'All' }],
  activeViewId: 'all',
  tools: {
    refresh: true,
    filter: true,
    advancedFilter: true,
    export: false,
    columns: true,
  },
  searchFields: ['permissionSetId', 'permissionSetCode', 'permissionSetName'],
  searchPlaceholder: 'Search permission set',
  dataSource: {
    endpoint: '/permission-sets',
    keyField: 'systemId',
    documentNoField: 'permissionSetId',
    defaultSort: 'permissionSetCode asc',
    supportsCreate: false,
    supportsUpdate: false,
    supportsDelete: false,
    pageSize: 25,
  },
  dataSurface: {
    id: 'permission-field-rule-setup-grid',
    idField: 'systemId',
    columns: [
      { id: 'permissionSetId', field: 'permissionSetId', label: 'Permission Set ID', isPrimary: true },
      { id: 'permissionSetCode', field: 'permissionSetCode', label: 'Code' },
      { id: 'permissionSetName', field: 'permissionSetName', label: 'Name' },
      { id: 'description', field: 'description', label: 'Description' },
    ],
  },
};

export const permissionFieldRuleHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Permission Field Rule Setup',
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
      title: 'Selected Permission Set',
      fields: [
        { key: 'permissionSetId', label: 'Permission Set ID', type: 'text', valueType: 'text', readonly: true },
        { key: 'permissionSetCode', label: 'Permission Set Code', type: 'text', valueType: 'text', readonly: true },
        { key: 'permissionSetName', label: 'Permission Set Name', type: 'text', valueType: 'text', readonly: true },
        { key: 'description', label: 'Description', type: 'textarea', valueType: 'text', readonly: true },
      ],
    },
  ],
};

export const permissionFieldRuleLineConfig: LineConfig = {
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
    endpoint: '/permission-field-rules',
    keyField: 'systemId',
    parentKeyField: 'permissionSetId',
    documentNoField: 'permissionSetId',
    lineNo: true,
    defaultSort: 'lineNo asc',
    createFields: ['permissionSetId', 'pageId', 'fieldId', 'canView', 'canEdit', 'isHidden'],
    updateBlockedFields: ['systemId', 'permissionSetId'],
  },
  lineKeyField: 'lineNo',
  columns: [
    { id: 'lineNo', field: 'lineNo', label: 'Line No.', valueType: 'number', cellType: 'text', align: 'end' },
    {
      id: 'pageId',
      field: 'pageId',
      label: 'Page',
      valueType: 'text',
      cellType: 'dropdown',
      api: '/app-pages',
      valueField: 'pageId',
      labelField: ['pageName', 'pageCode', 'routePath'],
    },
    {
      id: 'fieldId',
      field: 'fieldId',
      label: 'Field',
      valueType: 'text',
      cellType: 'dropdown',
      api: '/page-fields',
      valueField: 'systemId',
      labelField: ['fieldName', 'fieldCode'],
    },
    {
      id: 'canView',
      field: 'canView',
      label: 'View',
      valueType: 'boolean',
      cellType: 'select',
      options: [
        { label: 'No', value: false },
        { label: 'Yes', value: true },
      ],
    },
    {
      id: 'canEdit',
      field: 'canEdit',
      label: 'Edit',
      valueType: 'boolean',
      cellType: 'select',
      options: [
        { label: 'No', value: false },
        { label: 'Yes', value: true },
      ],
    },
    {
      id: 'isHidden',
      field: 'isHidden',
      label: 'Hidden',
      valueType: 'boolean',
      cellType: 'select',
      options: [
        { label: 'No', value: false },
        { label: 'Yes', value: true },
      ],
    },
  ],
};
