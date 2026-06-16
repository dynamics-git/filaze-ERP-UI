import { DataSourceConfig, EntryHeaderConfig, LineConfig, ListPageConfig } from '../../shared/erp-core/public-api';

export const pagePermissionsListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageId: 'page-permissions',
  pageCode: 'PAGE_PERMISSIONS',
  pageType: 'worksheet',
  defaultOpenTarget: 'list',
  title: 'Page Permissions',
  module: 'Admin',
  viewSuffix: 'page permissions',
  dataSource: {
    endpoint: '/role-permissions',
    keyField: 'systemId',
    documentNoField: 'page_id',
    pageSize: 25,
  },
  dataSurface: {
    id: 'page-permissions-grid',
    idField: 'systemId',
    columns: [
      { id: 'roleCode', field: 'roleCode', label: 'Role', isPrimary: true },
      // { id: 'page_id', field: 'page_id', label: 'Page' },
      // { id: 'can_view', field: 'can_view', label: 'View', type: 'boolean', align: 'center' },
      // { id: 'can_insert', field: 'can_insert', label: 'Insert', type: 'boolean', align: 'center' },
      // { id: 'can_edit', field: 'can_edit', label: 'Edit', type: 'boolean', align: 'center' },
      // { id: 'can_delete', field: 'can_delete', label: 'Delete', type: 'boolean', align: 'center' },
      // { id: 'can_approve', field: 'can_approve', label: 'Approve', type: 'boolean', align: 'center' },
      // { id: 'can_post', field: 'can_post', label: 'Post', type: 'boolean', align: 'center' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
};

export const pagePermissionsHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Page Permission',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        {
          key: 'role_id',
          label: 'Role',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/roles',
          valueField: ['systemId'],
          labelField: ['name'],
        },
         { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
}

export const pagePermissionsLineConfig: LineConfig = {
  placement: { mode: 'after-section', afterSectionId: 'header-main' },
  dataSource: {
    endpoint: '/page-permissions',
    keyField: 'systemId',
    parentKeyField: 'role_id',
    documentNoField: 'systemId',
    defaultSort: 'lineNo',
    navigation: {
      parentEndpoint: '/role-permissions',
      childCollection: 'page-permissions',
      parentIdFields: ['systemId'],
      top: 200,
    },
    createFields: ['documentNo', 'lineNo', 'type', 'no', 'quantity'],
    updateBlockedFields: ['systemId', 'documentNo', 'lineNo'],
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
      id: 'page_id',
      label: 'Page',
      field: 'page_id',
      valueType: 'text',
      cellType: 'dropdown',
      api: '/pages',
      valueField: ['systemId', 'SystemId', 'id', 'Id', 'page_id', 'pageId'],
      labelField: ['name', 'Name', 'code', 'Code', 'pageCode', 'PageCode'],
    },
    { id: 'can_view', field: 'can_view', label: 'View', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'can_insert', field: 'can_insert', label: 'Insert', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'can_edit', field: 'can_edit', label: 'Edit', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'can_delete', field: 'can_delete', label: 'Delete', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'can_approve', field: 'can_approve', label: 'Approve', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'can_export', field: 'can_export', label: 'Export', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'can_post', field: 'can_post', label: 'Post', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'can_assign', field: 'can_assign', label: 'Assign', valueType: 'boolean', cellType: 'text', align: 'center' },
    { id: 'is_active', field: 'is_active', label: 'Active', valueType: 'boolean', cellType: 'text', align: 'center' },
  ]
};