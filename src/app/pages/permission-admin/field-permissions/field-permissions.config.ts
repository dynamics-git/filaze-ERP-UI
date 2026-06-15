import { DataSourceConfig, EntryHeaderConfig, ListPageConfig } from '../../../shared/erp-core/public-api';

export const fieldPermissionsListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageId: 'field-permissions',
  pageCode: 'FIELD_PERMISSIONS',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Field Permissions',
  module: 'Admin',
  viewSuffix: 'field permissions',
  dataSource: {
    endpoint: '/field-permissions',
    keyField: 'systemId',
    documentNoField: 'field_key',
    pageSize: 25,
  },
  dataSurface: {
    id: 'field-permissions-grid',
    idField: 'systemId',
    columns: [
      { id: 'permission_set_id', field: 'permission_set_id', label: 'Permission Set', isPrimary: true },
      { id: 'page_id', field: 'page_id', label: 'Page' },
      { id: 'field_key', field: 'field_key', label: 'Field Key' },
      { id: 'visible', field: 'visible', label: 'Visible', type: 'boolean', align: 'center' },
      { id: 'editable', field: 'editable', label: 'Editable', type: 'boolean', align: 'center' },
      { id: 'disabled', field: 'disabled', label: 'Disabled', type: 'boolean', align: 'center' },
      { id: 'required', field: 'required', label: 'Required', type: 'boolean', align: 'center' },
      { id: 'masked', field: 'masked', label: 'Masked', type: 'boolean', align: 'center' },
    ],
  },
};

export const fieldPermissionsHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Field Permission',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        {
          key: 'permission_set_id',
          label: 'Permission Set',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/permission-sets',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'permission_set_id', 'permissionSetId', 'PermissionSetId'],
          labelField: ['name', 'Name', 'code', 'Code'],
        },
        {
          key: 'page_id',
          label: 'Page',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: '/pages',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'page_id', 'pageId', 'PageId'],
          labelField: ['name', 'Name', 'code', 'Code', 'pageCode', 'PageCode'],
        },
        {
          key: 'field_key',
          label: 'Field Key',
          type: 'dropdown',
          valueType: 'text',
          required: true,
          api: ['/page-fields', '/fields'],
          valueField: ['field_key', 'fieldKey', 'key', 'Key', 'name', 'Name', 'code', 'Code'],
          labelField: ['label', 'Label', 'name', 'Name', 'field_key', 'fieldKey', 'code', 'Code'],
        },
        { key: 'visible', label: 'Visible', type: 'boolean', valueType: 'boolean', defaultValue: true },
        { key: 'editable', label: 'Editable', type: 'boolean', valueType: 'boolean', defaultValue: true },
        { key: 'disabled', label: 'Disabled', type: 'boolean', valueType: 'boolean' },
        { key: 'required', label: 'Required', type: 'boolean', valueType: 'boolean' },
        { key: 'masked', label: 'Masked', type: 'boolean', valueType: 'boolean' },
        { key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
      ],
    },
  ],
};