import {
  CommandConfig,
  DataSourceConfig,
  EntryFooterSectionConfig,
  EntryHeaderConfig,
  LineConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

export const dummyHeaderLineListCommands: CommandConfig[] = [
  {
    id: 'dummy-send-approval',
    label: 'Send Approval',
    actionKey: 'cmd:send-approval',
    surface: 'list',
    group: 'approval',
    icon: 'bi bi-send',
  },
  {
    id: 'dummy-bulk-review',
    label: 'Bulk Review',
    actionKey: 'cmd:bulk-review',
    surface: 'list',
    group: 'review',
    icon: 'bi bi-check2-square',
  },
  {
    id: 'dummy-open-history',
    label: 'Approval History',
    actionKey: 'cmd:approval-history',
    surface: 'header',
    group: 'approval',
    icon: 'bi bi-clock-history',
    runModalPageId: 'approval-history',
    runModalTarget: 'entry',
  },
  {
    id: 'dummy-factpanel-action',
    label: 'Fact Action',
    actionKey: 'cmd:fact-action',
    surface: 'factPanel',
    group: 'insight',
    icon: 'bi bi-lightning-charge',
  },
];

export const dummyHeaderLineListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'dummy-header-line',
  title: 'Dummy Header + Line',
  module: 'Purchase',
  viewSuffix: 'documents',
  views: [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open', filter: "status eq 'Open'" },
  ],
  activeViewId: 'all',
  commands: dummyHeaderLineListCommands,
  commandSelectionPolicy: {
    defaultMode: 'single',
    commands: {
      'cmd:bulk-review': 'multiple',
    },
  },
  tools: {
    refresh: true,
    filter: true,
    advancedFilter: true,
    export: false,
    columns: true,
  },
  searchFields: ['number', 'vendorNo', 'vendorName'],
  searchPlaceholder: 'Search number, vendor no, vendor name',
  dataSource: {
    endpoint: '/dummyHeaderLines',
    keyField: 'systemId',
    documentNoField: 'number',
    autoGenerateNumber: true,
    lazyCreateOnFirstInput: true,
    pageSize: 20,
    defaultSort: 'number',
  },
  dataSurface: {
    id: 'dummy-header-line-grid',
    idField: 'systemId',
    columns: [
      {
        id: 'number',
        field: 'number',
        label: 'No.',
        type: 'text',
        isPrimary: true,
        factPanel: { sectionId: 'document', sectionTitle: 'Document', order: 10, fallback: '-' },
      },
      {
        id: 'vendorName',
        field: 'vendorName',
        label: 'Vendor',
        type: 'text',
        subtitleField: 'vendorNo',
        factPanel: { sectionId: 'document', sectionTitle: 'Document', order: 20, fallback: '-' },
      },
      {
        id: 'status',
        field: 'status',
        label: 'Status',
        type: 'badge',
        factPanel: { sectionId: 'review', sectionTitle: 'Review', order: 10, fallback: '-' },
      },
      {
        id: 'amount',
        field: 'amount',
        label: 'Amount',
        type: 'currency',
        align: 'end',
        factPanel: { sectionId: 'amounts', sectionTitle: 'Amounts', order: 10, fallback: '0' },
      },
    ],
  },
  factPanel: {
    id: 'dummy-header-line-fact-panel',
    label: 'Document',
    title: 'Document Insight',
    subtitle: 'Realtime context',
    enabled: true,
    defaultSectionId: 'document',
    binding: {
      labelField: 'number',
      titleField: 'vendorName',
      subtitleField: 'status',
      summaryField: 'amount',
      summaryType: 'currency',
    },
    sections: [
      {
        id: 'document',
        title: 'Document',
        fields: [
          { id: 'fp-number', label: 'No.', field: 'number' },
          { id: 'fp-vendor', label: 'Vendor', field: 'vendorName' },
          { id: 'fp-vendor-no', label: 'Vendor No.', field: 'vendorNo' },
        ],
      },
      {
        id: 'review',
        title: 'Review',
        fields: [{ id: 'fp-status', label: 'Status', field: 'status' }],
        badges: [{ id: 'fp-status-badge', label: 'Current', field: 'status' }],
      },
    ],
  },
};

export const dummyHeaderLineHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Dummy Header + Line',
  commandBar: {
    maxPrimaryActions: 4,
    maxVisibleGroups: 4,
  },
  toolbarButtons: [
    {
      id: 'dummy-release',
      label: 'Release',
      actionKey: 'cmd:release',
      group: 'Process',
      isPrimary: true,
      order: 10,
      icon: 'bi bi-arrow-repeat',
    },
    {
      id: 'dummy-attachments',
      label: 'Attachments',
      actionKey: 'dialog:attachments',
      group: 'More',
      order: 20,
      icon: 'bi bi-paperclip',
    },
  ],
  detailToolbarButtons: [
    {
      id: 'dummy-detail-close',
      label: 'Close',
      actionKey: 'cmd:close',
      surface: 'detail',
      order: 10,
    },
    {
      id: 'dummy-detail-post',
      label: 'Post',
      actionKey: 'cmd:post',
      surface: 'detail',
      order: 20,
      isPrimary: true,
    },
  ],
  attachmentsDefault: {
    headerFilesCount: 0,
    lineFilesCount: 0,
    canUpload: true,
    primaryActionLabel: 'Add attachment',
    primaryActionKey: 'dialog:attachments',
    context: {
      documentNoField: 'number',
      documentType: 'dummy',
      documentStatusField: 'status',
    },
  },
  sections: [
    {
      id: 'header-main',
      title: 'General',
      fields: [
        { key: 'number', label: 'No.', type: 'text', valueType: 'text', readonly: true },
        {
          key: 'vendorNo',
          label: 'Vendor No.',
          type: 'dropdown',
          valueType: 'text',
          api: ['/vendorsAPI', '/vendors'],
          valueField: ['number', 'no', 'code'],
          labelField: ['name', 'description'],
          fill: {
            vendorName: ['name', 'description'],
          },
          required: true,
        },
        {
          key: 'vendorName',
          label: 'Vendor Name',
          type: 'text',
          valueType: 'text',
          readonly: true,
          factPanel: {
            sectionId: 'document',
            sectionTitle: 'Document',
            label: 'Vendor',
            order: 20,
            fallback: '-',
            buttons: [
              {
                id: 'dummy-open-vendor-card',
                label: 'Open Vendor Card',
                actionKey: 'cmd:open-vendor-card',
                surface: 'factPanel',
                icon: 'bi bi-box-arrow-up-right',
              },
            ],
          },
        },
        { key: 'postingDate', label: 'Posting Date', type: 'date', valueType: 'date', required: true },
        { key: 'currencyCode', label: 'Currency', type: 'text', valueType: 'text', readonly: true },
        {
          key: 'shipToCode',
          label: 'Ship To',
          type: 'lookup',
          valueType: 'text',
          lookup: {
            endpoint: '/shipToAddresses',
            valueField: 'code',
            displayField: 'name',
            searchFields: ['code', 'name'],
            allowOpenCard: true,
          },
          targets: [
            {
              key: 'shipToName',
              source: 'name',
              fallbackSources: ['description'],
              clearOnEmpty: true,
            },
          ],
        },
        { key: 'shipToName', label: 'Ship To Name', type: 'text', valueType: 'text', readonly: true },
      ],
    },
  ],
};

const dummyLineFooterSections: EntryFooterSectionConfig[] = [
  {
    id: 'document-totals',
    rows: [
      { id: 'subtotal', label: 'Subtotal', source: 'total', totalKey: 'subtotal', order: 10 },
      { id: 'sst', label: 'SST', source: 'total', totalKey: 'sst', order: 20 },
      { id: 'total', label: 'Total', source: 'total', totalKey: 'total', emphasis: true, order: 30 },
    ],
  },
];

export const dummyHeaderLineLineConfigWithTotals: LineConfig = {
  placement: { mode: 'after-section', afterSectionId: 'header-main' },
  dataSource: {
    endpoint: '/dummyLines',
    keyField: 'systemId',
    parentKeyField: 'documentNo',
    documentNoField: 'number',
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
  ],
  calculation: [{ target: 'lineAmount', formula: 'quantity * unitCost' }],
  totalsCalculation: {
    defaults: {
      subtotal: '0.00',
      sst: '0.00',
      total: '0.00',
      difference: '0.00',
    },
    format: {
      type: 'currency',
      currencyCodeHeaderField: 'currencyCode',
      currencyCodeFallback: 'MYR',
    },
    totals: {
      subtotal: { formula: 'sum(lineAmount)' },
      sst: { kind: 'default' },
      total: { formula: 'sum(lineAmount)' },
      difference: { formula: 'sum(lineAmount) - sum(amountInvoiced)' },
    },
  },
  footerSections: dummyLineFooterSections,
};

export const dummyHeaderLineLineConfigNoTotals: LineConfig = {
  ...dummyHeaderLineLineConfigWithTotals,
  totalsCalculation: undefined,
  footerSections: undefined,
};
