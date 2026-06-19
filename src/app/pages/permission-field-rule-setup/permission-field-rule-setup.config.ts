import {
  DataSourceConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

type PermissionFieldRuleListConfig = ListPageConfig & { dataSource: DataSourceConfig };

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

export const permissionFieldRuleListConfig: PermissionFieldRuleListConfig = {
  pageType: 'document',
  pageId: 'permission-field-rule-setup',
  title: 'Permission Field Rule Setup',
  subtitle: 'Select a permission set and maintain field visibility rules',
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
  searchFields: ['permissionSetId', 'permissionSetCode', 'permissionSetName', 'description'],
  searchPlaceholder: 'Search permission set id, code or name',
  dataSource: {
    endpoint: '/permission-sets',
    keyField: 'systemId',
    documentNoField: 'permissionSetId',
    defaultSort: 'permissionSetCode asc',
    supportsCreate: false,
    supportsUpdate: true,
    supportsDelete: false,
    pageSize: 25,
  },
  dataSurface: {
    id: 'permission-field-rule-setup-grid',
    idField: 'systemId',
    columns: [
      {
        id: 'permissionSetId',
        field: 'permissionSetId',
        label: 'Permission Set ID',
        isPrimary: true,
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 10, fallback: '-' },
      },
      {
        id: 'permissionSetCode',
        field: 'permissionSetCode',
        label: 'Code',
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 20, fallback: '-' },
      },
      {
        id: 'permissionSetName',
        field: 'permissionSetName',
        label: 'Name',
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 30, fallback: '-' },
      },
      {
        id: 'description',
        field: 'description',
        label: 'Description',
        factPanel: { sectionId: 'details', sectionTitle: 'Details', order: 10, fallback: '-' },
      },
    ],
  },
  factPanel: {
    enabled: true,
    title: 'Permission Set',
    binding: {
      titleField: 'permissionSetName',
      titleFallbackFields: ['permissionSetId'],
      subtitleField: 'permissionSetCode',
      summaryField: 'description',
    },
  },
};

export const permissionFieldRuleHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Permission Field Rule Setup',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'Selected Permission Set',
      fields: [
        {
          key: 'permissionSetId',
          label: 'Permission Set ID',
          type: 'text',
          valueType: 'text',
          readonly: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 10, fallback: '-' },
        },
        {
          key: 'permissionSetCode',
          label: 'Code',
          type: 'text',
          valueType: 'text',
          readonly: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 20, fallback: '-' },
        },
        {
          key: 'permissionSetName',
          label: 'Name',
          type: 'text',
          valueType: 'text',
          readonly: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 30, fallback: '-' },
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          valueType: 'text',
          readonly: true,
          factPanel: { sectionId: 'details', sectionTitle: 'Details', order: 10, fallback: '-' },
        },
      ],
    },
  ],
};

export const permissionFieldRuleLineConfig: LineConfig = {
  placement: { mode: 'after-section', afterSectionId: 'general' },
  selectable: true,
  editable: true,
  toolbarButtons: lineToolbarButtons,
  dataSource: {
    endpoint: '/permission-field-rules',
    keyField: 'systemId',
    parentKeyField: 'permissionSetId',
    documentNoField: 'permissionSetId',
    lineNo: true,
    defaultSort: 'lineNo asc',
    createFields: ['permissionSetId', 'lineNo', 'pageId', 'fieldId', 'canView', 'canEdit', 'isHidden'],
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
      factPanel: { sectionId: 'target', sectionTitle: 'Target', order: 10, fallback: '-' },
    },
    {
      id: 'fieldId',
      field: 'fieldId',
      label: 'Field',
      valueType: 'text',
      cellType: 'dropdown',
      api: '/page-fields',
      valueField: 'fieldId',
      labelField: ['fieldName', 'fieldCode'],
      factPanel: { sectionId: 'target', sectionTitle: 'Target', order: 20, fallback: '-' },
    },
    {
      id: 'canView',
      field: 'canView',
      label: 'View',
      valueType: 'boolean',
      cellType: 'select',
      options: yesNoOptions,
      factPanel: { sectionId: 'fieldAccess', sectionTitle: 'Field Access', order: 10, fallback: 'false' },
    },
    {
      id: 'canEdit',
      field: 'canEdit',
      label: 'Edit',
      valueType: 'boolean',
      cellType: 'select',
      options: yesNoOptions,
      factPanel: { sectionId: 'fieldAccess', sectionTitle: 'Field Access', order: 20, fallback: 'false' },
    },
    {
      id: 'isHidden',
      field: 'isHidden',
      label: 'Hidden',
      valueType: 'boolean',
      cellType: 'select',
      options: yesNoOptions,
      factPanel: { sectionId: 'fieldAccess', sectionTitle: 'Field Access', order: 30, fallback: 'false' },
    },
  ],
};
