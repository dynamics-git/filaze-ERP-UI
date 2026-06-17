import { DataSourceConfig, EntryHeaderConfig, LineConfig, ListPageConfig } from '../../shared/erp-core/public-api';

export const pagePermissionsListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageId: 'permission-set-rules',
  pageCode: 'PERMISSION_SET_RULES',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Permission Set Rules',
  module: 'Admin',
  viewSuffix: 'permission set rules',
  dataSource: {
    endpoint: '/permission-sets',
    keyField: 'systemId',
    documentNoField: 'permissionSetId',
    defaultSort: 'permissionSetCode',
    pageSize: 25,
  },
  dataSurface: {
    id: 'permission-set-rules-grid',
    idField: 'systemId',
    columns: [
      { id: 'permissionSetId', field: 'permissionSetId', label: 'Permission Set', isPrimary: true },
      { id: 'permissionSetCode', field: 'permissionSetCode', label: 'Permission Set Code' },
      { id: 'permissionSetName', field: 'permissionSetName', label: 'Permission Set Name' },
      { id: 'description', field: 'description', label: 'Description' },
      { id: 'isActive', field: 'isActive', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
  searchFields: ['permissionSetId', 'permissionSetCode', 'permissionSetName', 'description'],
  searchPlaceholder: 'Search permission set',
};

export const pagePermissionsHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Permission Set Rule',
  toolbarButtons: [],
  sections: [
    {
      id: 'header-main',
      title: 'Rule Header',
      fields: [
        {
          key: 'permissionSetId',
          label: 'Permission Set',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/permission-sets',
          valueField: ['systemId', 'SystemId', 'permissionSetId', 'PermissionSetId', 'id', 'Id'],
          labelField: ['permissionSetName', 'PermissionSetName', 'permissionSetCode', 'PermissionSetCode', 'name', 'Name'],
          fill: {
            permissionSetCode: ['permissionSetCode', 'PermissionSetCode', 'code', 'Code'],
            permissionSetName: ['permissionSetName', 'PermissionSetName', 'name', 'Name'],
            isActive: ['isActive', 'IsActive', 'is_active'],
          },
        },
        { key: 'permissionSetCode', label: 'Permission Set Code', type: 'text', valueType: 'text', readonly: true },
        { key: 'permissionSetName', label: 'Permission Set Name', type: 'text', valueType: 'text', readonly: true },
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

export const pagePermissionsLineConfig: LineConfig = {
  placement: { mode: 'after-section', afterSectionId: 'header-main' },
  dataSource: {
    endpoint: '/permission-set-rules',
    keyField: 'systemId',
    parentKeyField: 'permissionSetId',
    documentNoField: 'systemId',
    defaultSort: 'lineNo',
    navigation: {
      parentEndpoint: '/permission-sets',
      childCollection: 'permission-set-rules',
      parentIdFields: ['systemId', 'SystemId', 'id', 'Id'],
      top: 200,
    },
    createFields: [
      'permissionSetId',
      'pageId',
      'actionId',
      'lineNo',
      'canRead',
      'canCreate',
      'canUpdate',
      'canDelete',
      'canExecute',
      'isIndirect',
      'isActive',
    ],
    updateBlockedFields: ['systemId', 'permissionSetId'],
  },
  lineKeyField: 'lineNo',
  toolbarButtons: [
    {
      label: 'Line',
      actionKey: 'cmd:line-new',
      group: 'Process',
      isPrimary: true,
      order: 10,
      icon: 'bi bi-plus-lg',
    },
    {
      label: 'Delete',
      actionKey: 'cmd:line-delete',
      group: 'Process',
      order: 20,
      icon: 'bi bi-trash',
    },
  ],
  columns: [
    {
      id: 'pageId',
      label: 'Page',
      field: 'pageId',
      valueType: 'text',
      cellType: 'dropdown',
      api: '/app-pages',
      valueField: ['systemId', 'SystemId', 'pageId', 'PageId', 'id', 'Id'],
      labelField: ['pageName', 'PageName', 'pageCode', 'PageCode', 'name', 'Name'],
    },
    {
      id: 'actionId',
      label: 'Action',
      field: 'actionId',
      valueType: 'text',
      cellType: 'dropdown',
      api: '/page-actions',
      valueField: ['systemId', 'SystemId', 'actionId', 'ActionId', 'id', 'Id'],
      labelField: ['actionName', 'ActionName', 'actionCode', 'ActionCode', 'name', 'Name'],
    },
    { id: 'lineNo', field: 'lineNo', label: 'Line No.', valueType: 'number', cellType: 'text', align: 'end' },
    { id: 'canRead', field: 'canRead', label: 'Read', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'canCreate', field: 'canCreate', label: 'Create', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'canUpdate', field: 'canUpdate', label: 'Update', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'canDelete', field: 'canDelete', label: 'Delete', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'canExecute', field: 'canExecute', label: 'Execute', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'isIndirect', field: 'isIndirect', label: 'Indirect', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'isActive', field: 'isActive', label: 'Active', valueType: 'boolean', cellType: 'text', align: 'center' },
  ]
};