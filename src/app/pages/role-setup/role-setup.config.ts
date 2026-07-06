import {
  DataSourceConfig,
  EntryCommandButtonConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

type RoleSetupListConfig = ListPageConfig & { dataSource: DataSourceConfig };

const headerToolbarButtons: EntryCommandButtonConfig[] = [
  {
    id: 'nav-user-setup',
    label: 'Users',
    actionKey: 'cmd:open-user-setup',
    runModalPageId: 'user-setup',
    runModalTarget: 'list',
    group: 'Navigate',
    order: 10,
    icon: 'bi bi-people',
  },
  {
    id: 'nav-permission-set-setup',
    label: 'Permission Sets',
    actionKey: 'cmd:open-permission-set-setup',
    runModalPageId: 'permission-set-setup',
    runModalTarget: 'list',
    group: 'Navigate',
    order: 20,
    icon: 'bi bi-lock',
  },
];

const lineToolbarButtons: EntryCommandButtonConfig[] = [
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
  {
    id: 'line-open-permission-set',
    label: 'Open Permission Set',
    actionKey: 'cmd:open-line-permission-set',
    runModalPageId: 'permission-set-setup',
    runModalTarget: 'entry',
    group: 'Navigate',
    order: 30,
    icon: 'bi bi-box-arrow-up-right',
  },
];

export const roleSetupListConfig: RoleSetupListConfig = {
  pageType: 'document',
  pageId: 'role-setup',
  title: 'Role Setup',
  subtitle: 'Roles and assigned permission sets',
  module: 'Admin',
  viewSuffix: 'roles',
  views: [{ id: 'all', label: 'All' }],
  activeViewId: 'all',
  tools: {
    refresh: true,
    filter: true,
    advancedFilter: true,
    export: false,
    columns: true,
  },
  searchFields: ['code', 'name', 'description'],
  searchPlaceholder: 'Search role code, name or description',
  dataSource: {
    endpoint: '/roles',
    keyField: 'systemId',
    documentNoField: 'code',
    defaultSort: 'code asc',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    pageSize: 25,
  },
  dataSurface: {
    id: 'role-setup-grid',
    idField: 'systemId',
    columns: [
      {
        id: 'code',
        field: 'code',
        label: 'Code',
        isPrimary: true,
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 10, fallback: '-' },
      },
      {
        id: 'name',
        field: 'name',
        label: 'Name',
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 20, fallback: '-' },
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
    title: 'Role',
    binding: {
      titleField: 'name',
      titleFallbackFields: ['code'],
      subtitleField: 'code',
      summaryField: 'description',
    },
  },
};

export const roleSetupHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Role Setup',
  toolbarButtons: headerToolbarButtons,
  sections: [
    {
      id: 'general',
      title: 'General',
      fields: [
        {
          key: 'code',
          label: 'Code',
          type: 'text',
          valueType: 'text',
          required: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 10, fallback: '-' },
        },
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          valueType: 'text',
          required: true,
          factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 20, fallback: '-' },
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          valueType: 'text',
          factPanel: { sectionId: 'details', sectionTitle: 'Details', order: 10, fallback: '-' },
        },
      ],
    },
    {
      id: 'audit',
      title: 'Audit',
      fields: [
        { key: 'systemId', label: 'System ID', type: 'text', valueType: 'text', readonly: true },
        { key: 'createdAt', label: 'Created At', type: 'date', valueType: 'date', readonly: true },
        { key: 'updatedAt', label: 'Updated At', type: 'date', valueType: 'date', readonly: true },
      ],
    },
  ],
};

export const roleSetupLineConfig: LineConfig = {
  placement: { mode: 'after-section', afterSectionId: 'general' },
  selectable: true,
  editable: true,
  toolbarButtons: lineToolbarButtons,
  dataSource: {
    endpoint: '/role-permission-sets',
    keyField: 'systemId',
    headerPKProp: 'code',
    parentKeyField: 'roleId',
    lineFKProp: 'roleId',
    documentNoField: 'code',
    lineNo: true,
    defaultSort: 'lineNo asc',
    createFields: ['roleId', 'lineNo', 'permissionSetId'],
    updateBlockedFields: ['systemId', 'roleId'],
  },
  lineKeyField: 'lineNo',
  columns: [
    { id: 'lineNo', field: 'lineNo', label: 'Line No.', valueType: 'number', cellType: 'text', align: 'end' },
    {
      id: 'permissionSetId',
      field: 'permissionSetId',
      label: 'Permission Set',
      valueType: 'text',
      cellType: 'dropdown',
      api: '/permission-sets',
      valueField: 'permissionSetId',
      labelField: ['permissionSetName', 'permissionSetCode'],
      factPanel: { sectionId: 'line', sectionTitle: 'Permission Set', order: 10, fallback: '-' },
    },
  ],
};
