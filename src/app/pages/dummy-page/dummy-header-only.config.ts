import {
  DataSourceConfig,
  EntryHeaderConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

export const dummyHeaderOnlyListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'dummy-header-only',
  title: 'Dummy Header Only',
  module: 'Setup',
  viewSuffix: 'cards',
  views: [{ id: 'all', label: 'All' }],
  activeViewId: 'all',
  dataSource: {
    endpoint: '/dummyHeaderOnly',
    keyField: 'systemId',
    documentNoField: 'code',
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    pageSize: 20,
    defaultSort: 'code',
  },
  dataSurface: {
    id: 'dummy-header-only-grid',
    idField: 'systemId',
    columns: [
      { id: 'code', field: 'code', label: 'Code', isPrimary: true },
      { id: 'description', field: 'description', label: 'Description' },
    ],
  },
};

export const dummyHeaderOnlyHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Dummy Header Only',
  toolbarButtons: [{ label: 'Approve', actionKey: 'cmd:approve', group: 'Process', order: 10, isPrimary: true }],
  sections: [
    {
      id: 'main',
      title: 'General',
      fields: [
        { key: 'code', label: 'Code', type: 'text', valueType: 'text', required: true },
        { key: 'description', label: 'Description', type: 'text', valueType: 'text', required: true },
        { key: 'remarks', label: 'Remarks', type: 'textarea', valueType: 'text' },
      ],
    },
  ],
};
