import { DataSourceConfig, ListPageConfig } from '../../shared/erp-core/public-api';

export const dummyMasterListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageId: 'dummy-master',
  title: 'Dummy Master',
  subtitle: 'Copy and replace API contract fields',
  module: 'Setup',
  viewSuffix: 'records',
  views: [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active', filter: "blocked eq ''" },
    { id: 'blocked', label: 'Blocked', filter: "blocked ne ''" },
  ],
  activeViewId: 'all',
  standardActions: {
    new: true,
    delete: true,
    refresh: true,
  },
  commands: [
    {
      id: 'dummy-master-sync',
      label: 'Sync Sample',
      actionKey: 'cmd:dummy-master-sync',
      surface: 'list',
      group: 'integration',
      order: 10,
      icon: 'bi bi-cloud-arrow-up',
    },
  ],
  tools: {
    refresh: true,
    filter: true,
    advancedFilter: true,
    export: true,
    columns: true,
  },
  filterConfig: {
    enabled: true,
    storageKey: 'dummy-master.filters',
    fields: [
      { field: 'no', label: 'No.', type: 'text' },
      { field: 'name', label: 'Name', type: 'text' },
      {
        field: 'blocked',
        label: 'Blocked',
        type: 'select',
        // Keep every branch here as a copy-ready reference for juniors.
        options: [
          { value: '', label: 'Open' },
          { value: 'All', label: 'All' },
          { value: 'Ship', label: 'Ship' },
          { value: 'Invoice', label: 'Invoice' },
        ],
      },
    ],
  },
  searchFields: ['no', 'name', 'city', 'phoneNo'],
  searchPlaceholder: 'Search no, name, city, phone',
  dataSource: {
    endpoint: '/dummyMasters',
    keyField: 'systemId',
    documentNoField: 'no',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    pageSize: 20,
    defaultSort: 'no',
  },
  dataSurface: {
    id: 'dummy-master-grid',
    idField: 'systemId',
    columns: [
      {
        id: 'no',
        field: 'no',
        label: 'No.',
        type: 'text',
        isPrimary: true,
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 10, fallback: '-' },
      },
      {
        id: 'name',
        field: 'name',
        label: 'Name',
        type: 'text',
        subtitleField: 'groupCode',
        factPanel: { sectionId: 'identity', sectionTitle: 'Identity', order: 20, fallback: '-' },
      },
      { id: 'city', field: 'city', label: 'City', type: 'text' },
      { id: 'phoneNo', field: 'phoneNo', label: 'Phone', type: 'text' },
      { id: 'blocked', field: 'blocked', label: 'Blocked', type: 'badge' },
    ],
  },
  factPanel: {
    id: 'dummy-master-fact-panel',
    label: 'Master',
    title: 'Master Insight',
    enabled: true,
    binding: {
      labelField: 'no',
      titleField: 'name',
      subtitleField: 'groupCode',
    },
    sections: [
      {
        id: 'identity',
        title: 'Identity',
        fields: [
          { id: 'mfp-no', label: 'No.', field: 'no' },
          { id: 'mfp-name', label: 'Name', field: 'name' },
        ],
      },
    ],
  },
};
