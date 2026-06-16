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
    documentNoField: 'roleCode',
    defaultSort: 'roleCode',
    pageSize: 25,
  },
  dataSurface: {
    id: 'page-permissions-grid',
    idField: 'systemId',
    columns: [
      { id: 'roleCode', field: 'roleCode', label: 'Role', isPrimary: true },
      { id: 'description', field: 'description', label: 'Description' },
      { id: 'effective_from', field: 'effective_from', label: 'Effective From', type: 'date' },
      { id: 'effective_to', field: 'effective_to', label: 'Effective To', type: 'date' },
      { id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
    ],
  },
  searchFields: ['roleCode', 'description'],
  searchPlaceholder: 'Search role code or description',
};

export const pagePermissionsHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Page Permission',
  toolbarButtons: [],
  sections: [
    {
      id: 'header-main',
      title: 'General',
      fields: [
        {
          key: 'role_id',
          label: 'Role',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/roles',
          valueField: ['description', 'SystemId', 'id', 'Id', 'role_id', 'roleId', 'RoleId'],
          labelField: ['code', 'Code', 'name', 'Name'],
          fill: {
            roleCode: ['code', 'Code', 'name', 'Name'],
          },
        },
        { key: 'roleCode', label: 'Role Code', type: 'text', valueType: 'text', readonly: true },
        { key: 'description', label: 'Description', type: 'textarea', valueType: 'text', width: 'wide' },
        { key: 'effective_from', label: 'Effective From', type: 'date', valueType: 'date' },
        { key: 'effective_to', label: 'Effective To', type: 'date', valueType: 'date' },
        {
          key: 'assigned_by_user_id',
          label: 'Assigned By User',
          type: 'text',
          valueType: 'text',
          readonly: true,
        },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
    {
      id: 'audit',
      title: 'Audit',
      fields: [
        { key: 'created_at', label: 'Created At', type: 'date', valueType: 'date', readonly: true },
        { key: 'updated_at', label: 'Updated At', type: 'date', valueType: 'date', readonly: true },
        { key: 'createdBy', label: 'Created By', type: 'text', valueType: 'text', readonly: true },
        { key: 'modifiedBy', label: 'Modified By', type: 'text', valueType: 'text', readonly: true },
      ],
    },
  ],
};

export const pagePermissionsLineConfig: LineConfig = {
  placement: { mode: 'after-section', afterSectionId: 'header-main' },
  dataSource: {
    endpoint: '/page-permissions',
    keyField: 'systemId',
    parentKeyField: 'role_permission_id',
    documentNoField: 'systemId',
    defaultSort: 'created_at',
    navigation: {
      parentEndpoint: '/role-permissions',
      childCollection: 'page-permissions',
      parentIdFields: ['systemId'],
      top: 200,
    },
    createFields: [
      'role_permission_id',
      'page_id',
      'can_view',
      'can_insert',
      'can_edit',
      'can_delete',
      'can_approve',
      'can_export',
      'can_post',
      'can_assign',
      'is_active',
    ],
    updateBlockedFields: ['systemId', 'role_permission_id'],
  },
  lineKeyField: 'systemId',
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
        labelField: ['code', 'Code', 'name', 'Name', 'pageCode', 'PageCode'],
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