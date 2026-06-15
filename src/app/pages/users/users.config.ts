import { DataSourceConfig, EntryHeaderConfig, LineConfig, ListPageConfig } from '../../shared/erp-core/public-api';

export const usersListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageId: 'users',
  pageCode: 'USERS',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Users',
  module: 'Admin',
  viewSuffix: 'users',
  dataSource: {
    endpoint: '/users',
    keyField: 'systemId',
    documentNoField: 'userName',
    pageSize: 25,
  },
  dataSurface: {
    id: 'users-grid',
    idField: 'systemId',
    columns: [
      { id: 'userName', field: 'userName', label: 'User Name', isPrimary: true },
      { id: 'email', field: 'email', label: 'Email' },
      { id: 'firstName', field: 'firstName', label: 'First Name' },
      { id: 'lastName', field: 'lastName', label: 'Last Name' },
      { id: 'roleId', field: 'roleId', label: 'Role' },
      { id: 'companyName', field: 'companyName', label: 'Company' },
      { id: 'status', field: 'status', label: 'Status' },
    ],
  },
  searchFields: ['userName', 'email', 'firstName', 'lastName', 'roleId', 'companyName'],
  searchPlaceholder: 'Search users',
};

export const usersHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'User',
  toolbarButtons: [],
  sections: [
    {
      id: 'header-main',
      title: 'Primary Details',
      fields: [
        { key: 'userName', label: 'User Name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'text', required: true },
        { key: 'firstName', label: 'First Name', type: 'text' },
        { key: 'lastName', label: 'Last Name', type: 'text' },
        {
          key: 'roleId',
          label: 'Role',
          type: 'dropdown',
          valueType: 'text',
          api: '/roles',
          valueField: ['systemId', 'SystemId', 'id', 'Id', 'roleId', 'RoleId'],
          labelField: ['name', 'Name', 'code', 'Code'],
        },
        { key: 'companyName', label: 'Company Name', type: 'text' },
        { key: 'defaultAccessCenter', label: 'Default Access Center', type: 'text' },
        { key: 'accessCenter', label: 'Access Center', type: 'text' },
        { key: 'status', label: 'Status', type: 'text' },
      ],
    },
  ],
};


export const userLineConfig: LineConfig = {
  placement: { mode: 'after-section', afterSectionId: 'header-main' },
  dataSource: {
    endpoint: '/role-permission-sets',
    keyField: 'systemId',
    parentKeyField: 'systemId',
    documentNoField: 'role_id',
    defaultSort: 'lineNo',
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
      id: 'type',
      label: 'Type',
      field: 'type',
      valueType: 'text',
      cellType: 'dropdown',
      options: [
        { label: 'Item', value: 'Item', api: '/items' },
        { label: 'G/L Account', value: 'G/L Account', api: '/glAccounts' },
      ],
    },
    {
      id: 'no',
      label: 'No.',
      field: 'no',
      valueType: 'text',
      cellType: 'dropdown',
      valueField: ['no', 'number', 'code'],
      labelField: ['description', 'name'],
      fill: {
        description: 'description',
        unitCost: ['directUnitCost', 'unitCost', 'unitPrice'],
      },
    },
    { id: 'description', label: 'Description', field: 'description', valueType: 'text', cellType: 'text' },
    { id: 'quantity', label: 'Quantity', field: 'quantity', valueType: 'number', cellType: 'text', align: 'end' },
    { id: 'unitCost', label: 'Unit Cost', field: 'unitCost', valueType: 'number', cellType: 'text', align: 'end' },
    {
      id: 'lineAmount',
      label: 'Line Amount',
      field: 'lineAmount',
      valueType: 'number',
      cellType: 'text',
      align: 'end',
      readonly: true,
    },
    {
      id: 'amountInvoiced',
      label: 'Invoiced',
      field: 'amountInvoiced',
      valueType: 'number',
      cellType: 'text',
      align: 'end',
      readonly: true,
    },
  ]
};