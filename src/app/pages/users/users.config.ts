import {
  DataSourceConfig,
  EntryHeaderConfig,
  DataSurfaceConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

const usersDataSurface: DataSurfaceConfig = {
  id: 'users-grid',
  idField: 'systemId',
  columns: [
    { id: 'userName', field: 'userName', label: 'User Name', isPrimary: true, subtitleField: 'email' },
    { id: 'firstName', field: 'firstName', label: 'First Name' },
    { id: 'lastName', field: 'lastName', label: 'Last Name' },
    { id: 'roleId', field: 'roleId', label: 'Role' },
    { id: 'accessCenter', field: 'accessCenter', label: 'Access Center' },
    { id: 'status', field: 'status', label: 'Status', type: 'badge' },
  ],
};

export const usersListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'users',
  pageCode: 'USERS',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Users',
  module: 'Admin',
  viewSuffix: 'company users',
  views: [
    { id: 'all', label: 'All' },
  ],
  activeViewId: 'all',
  tools: {
    refresh: true,
    filter: true,
    advancedFilter: false,
    export: true,
    columns: true,
  },
  filterConfig: {
    enabled: true,
    storageKey: 'users.filters',
    fields: [
      { field: 'userName', label: 'User Name', type: 'text' },
      { field: 'email', label: 'Email', type: 'text' },
      {
        field: 'roleId',
        label: 'Role',
        type: 'dropdown',
        apiUrl: '/roles',
        valueField: 'id',
        labelField: 'name',
      },
      { field: 'id', label: 'Id', type: 'text' },
      { field: 'systemId', label: 'System Id', type: 'text' },
    ],
  },
  searchFields: ['email', 'userName', 'roleId', 'id', 'systemId'],
  searchPlaceholder: 'Search by email, user name, role, id, or system id',
  dataSource: {
    endpoint: '/users',
    contractProfileKey: 'companyUsers',
    keyField: 'systemId',
    documentNoField: 'userName',
    autoGenerateNumber: true,
    lazyCreateOnFirstInput: true,
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    pageSize: 50,
    updateBlockedFields: ['id', 'systemId', 'userId', 'companyId', 'companyName', 'passwordHash'],
  },
  dataSurface: usersDataSurface,
};

export const usersHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'User',
  toolbarButtons: [],
  sections: [
    {
      id: 'account',
      title: 'Account',
      fields: [
        { key: 'email', label: 'Email', type: 'text', required: true },
        { key: 'userName', label: 'User Name', type: 'text' },
        { key: 'password', label: 'Password', type: 'text', required: true, masked: true },
        { key: 'status', label: 'Status', type: 'select', options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
        ], defaultValue: 'Active' },
        {
          key: 'roleId',
          label: 'Role',
          type: 'dropdown',
          valueType: 'text',
          api: '/roles',
          valueField: ['id', 'Id', 'code', 'Code', 'roleId', 'RoleId'],
          labelField: ['name', 'Name', 'description', 'Description', 'code', 'Code'],
        },
      ],
    },
    {
      id: 'profile',
      title: 'Profile',
      fields: [
        { key: 'firstName', label: 'First Name', type: 'text' },
        { key: 'lastName', label: 'Last Name', type: 'text' },
        {
          key: 'defaultAccessCenter',
          label: 'Default Access Center',
          type: 'dropdown',
          valueType: 'text',
          api: ['/accessCenters', '/AccessCenters'],
          valueField: ['code', 'Code', 'id', 'Id', 'accessCenter', 'AccessCenter'],
          labelField: ['name', 'Name', 'description', 'Description', 'code', 'Code'],
        },
        {
          key: 'accessCenter',
          label: 'Access Center',
          type: 'dropdown',
          valueType: 'text',
          api: ['/accessCenters', '/AccessCenters'],
          valueField: ['code', 'Code', 'id', 'Id', 'accessCenter', 'AccessCenter'],
          labelField: ['name', 'Name', 'description', 'Description', 'code', 'Code'],
        },
      ],
    },
  ],
};
