import { DataSourceConfig, EntryHeaderConfig, ListPageConfig } from '../../../shared/erp-core/public-api';

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