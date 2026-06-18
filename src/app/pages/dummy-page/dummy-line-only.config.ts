import {
  DataSourceConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

export const dummyLineOnlyListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageId: 'dummy-line-only',
  title: 'Dummy Line Focused',
  module: 'Operations',
  viewSuffix: 'line workspaces',
  views: [{ id: 'all', label: 'All' }],
  activeViewId: 'all',
  dataSource: {
    endpoint: '/dummyLineWorkspaces',
    keyField: 'systemId',
    documentNoField: 'number',
    pageSize: 20,
    defaultSort: 'number',
  },
  dataSurface: {
    id: 'dummy-line-only-grid',
    idField: 'systemId',
    columns: [
      { id: 'number', field: 'number', label: 'No.', isPrimary: true },
      { id: 'description', field: 'description', label: 'Description' },
    ],
  },
};

export const dummyLineOnlyHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Dummy Line Focused',
  toolbarButtons: [],
  sections: [
    {
      id: 'technical',
      title: 'Context',
      fields: [{ key: 'number', label: 'No.', type: 'text', valueType: 'text', readonly: true }],
    },
  ],
};

export const dummyLineOnlyLineConfig: LineConfig = {
  placement: { mode: 'end' },
  dataSource: {
    endpoint: '/dummyLineOnlyLines',
    keyField: 'systemId',
    parentKeyField: 'documentNo',
    documentNoField: 'number',
    defaultSort: 'lineNo',
  },
  toolbarButtons: [
    { label: 'Line', actionKey: 'cmd:line-new', group: 'Process', isPrimary: true, order: 10 },
    { label: 'Delete', actionKey: 'cmd:line-delete', group: 'Process', order: 20 },
  ],
  columns: [
    { id: 'lineNo', field: 'lineNo', label: 'Line No.', valueType: 'number', cellType: 'text', readonly: true },
    { id: 'description', field: 'description', label: 'Description', valueType: 'text', cellType: 'text' },
    { id: 'quantity', field: 'quantity', label: 'Qty', valueType: 'number', cellType: 'text', align: 'end' },
    { id: 'rate', field: 'rate', label: 'Rate', valueType: 'number', cellType: 'text', align: 'end' },
    {
      id: 'amount',
      field: 'amount',
      label: 'Amount',
      valueType: 'number',
      cellType: 'text',
      align: 'end',
      readonly: true,
    },
  ],
  calculation: [{ target: 'amount', formula: 'quantity * rate' }],
};
