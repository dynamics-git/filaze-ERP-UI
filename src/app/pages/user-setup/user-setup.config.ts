import {
  DataSourceConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

type UserSetupListConfig = ListPageConfig & { dataSource: DataSourceConfig };

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

export const userSetupListConfig: UserSetupListConfig = {
  pageType: 'setup',
  pageId: 'user-setup',
  title: 'User Setup',
  subtitle: 'Company access and role assignment',
  module: 'Admin',
  viewSuffix: 'users',
  views: [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active', filter: "status eq 'Active'" },
    { id: 'blocked', label: 'Blocked', filter: "status ne 'Active'" },
  ],
  activeViewId: 'all',
  tools: {
    refresh: true,
    filter: true,
    advancedFilter: true,
    export: false,
    columns: true,
  },
  searchFields: ['userName', 'email', 'firstName', 'lastName', 'roleId'],
  searchPlaceholder: 'Search user name, email or role',
  dataSource: {
    endpoint: '/users',
    keyField: 'systemId',
    documentNoField: 'userName',
    defaultSort: 'userName asc',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    pageSize: 25,
  },
  dataSurface: {
    id: 'user-setup-grid',
    idField: 'systemId',
    columns: [
      {
        id: 'userName',
        field: 'userName',
        label: 'User Name',
        isPrimary: true,
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 10, fallback: '-' },
      },
      {
        id: 'email',
        field: 'email',
        label: 'Email',
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 20, fallback: '-' },
      },
      {
        id: 'roleId',
        field: 'roleId',
        label: 'Default Role',
        factPanel: { sectionId: 'access', sectionTitle: 'Access', order: 10, fallback: '-' },
      },
      {
        id: 'companyName',
        field: 'companyName',
        label: 'Company',
        factPanel: { sectionId: 'access', sectionTitle: 'Access', order: 20, fallback: '-' },
      },
      {
        id: 'status',
        field: 'status',
        label: 'Status',
        type: 'badge',
        align: 'center',
        factPanel: { sectionId: 'access', sectionTitle: 'Access', order: 30, fallback: '-' },
      },
    ],
  },
  factPanel: {
    enabled: true,
    title: 'User',
    binding: {
      titleField: 'userName',
      subtitleField: 'email',
      summaryField: 'status',
    },
  },
};

export const userSetupHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'User Setup',
  toolbarButtons: [],
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        {
          key: 'userName',
          label: 'User Name',
          type: 'text',
          valueType: 'text',
          required: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 10, fallback: '-' },
        },
        {
          key: 'email',
          label: 'Email',
          type: 'text',
          valueType: 'text',
          required: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 20, fallback: '-' },
        },
        {
          key: 'firstName',
          label: 'First Name',
          type: 'text',
          valueType: 'text',
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 30, fallback: '-' },
        },
        {
          key: 'lastName',
          label: 'Last Name',
          type: 'text',
          valueType: 'text',
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 40, fallback: '-' },
        },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          valueType: 'text',
          defaultValue: 'Active',
          options: [
            { label: 'Active', value: 'Active' },
            { label: 'Blocked', value: 'Blocked' },
          ],
          factPanel: { sectionId: 'access', sectionTitle: 'Access', order: 10, fallback: 'Active' },
        },
      ],
    },
    {
      id: 'access',
      title: 'Default Access',
      fields: [
        {
          key: 'roleId',
          label: 'Default Role',
          type: 'dropdown',
          valueType: 'text',
          api: '/roles',
          valueField: 'code',
          labelField: ['name', 'code'],
          factPanel: { sectionId: 'access', sectionTitle: 'Access', order: 20, fallback: '-' },
        },
        {
          key: 'defaultAccessCenter',
          label: 'Default Access Center',
          type: 'dropdown',
          valueType: 'text',
          api: '/accessCenters',
          valueField: 'code',
          labelField: ['name', 'code'],
          factPanel: { sectionId: 'access', sectionTitle: 'Access', order: 30, fallback: '-' },
        },
        {
          key: 'accessCenter',
          label: 'Current Access Center',
          type: 'dropdown',
          valueType: 'text',
          api: '/accessCenters',
          valueField: 'code',
          labelField: ['name', 'code'],
          factPanel: { sectionId: 'access', sectionTitle: 'Access', order: 40, fallback: '-' },
        },
      ],
    },
    {
      id: 'audit',
      title: 'Audit',
      fields: [
        { key: 'systemId', label: 'System ID', type: 'text', valueType: 'text', readonly: true },
      ],
    },
  ],
};

export const userSetupLineConfig: LineConfig = {
  placement: { mode: 'after-section', afterSectionId: 'general' },
  selectable: true,
  editable: true,
  toolbarButtons: lineToolbarButtons,
  dataSource: {
    endpoint: '/user-company-roles',
    keyField: 'systemId',
    parentKeyField: 'userId',
    documentNoField: 'userName',
    lineNo: true,
    defaultSort: 'lineNo asc',
    createFields: ['userId', 'lineNo', 'companyId', 'roleId', 'isActive'],
    updateBlockedFields: ['systemId', 'userId'],
  },
  lineKeyField: 'lineNo',
  columns: [
    { id: 'lineNo', field: 'lineNo', label: 'Line No.', valueType: 'number', cellType: 'text', align: 'end' },
    {
      id: 'companyId',
      field: 'companyId',
      label: 'Company',
      valueType: 'text',
      cellType: 'dropdown',
      api: '/companies',
      valueField: 'systemId',
      labelField: ['name', 'code'],
      factPanel: { sectionId: 'line', sectionTitle: 'Company Role', order: 10, fallback: '-' },
    },
    {
      id: 'roleId',
      field: 'roleId',
      label: 'Role',
      valueType: 'text',
      cellType: 'dropdown',
      api: '/roles',
      valueField: 'code',
      labelField: ['name', 'code'],
      factPanel: { sectionId: 'line', sectionTitle: 'Company Role', order: 20, fallback: '-' },
    },
    {
      id: 'isActive',
      field: 'isActive',
      label: 'Active',
      valueType: 'boolean',
      cellType: 'select',
      options: yesNoOptions,
      factPanel: { sectionId: 'line', sectionTitle: 'Company Role', order: 30, fallback: 'true' },
    },
  ],
};
