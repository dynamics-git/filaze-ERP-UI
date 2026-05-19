import {
  CommandConfig,
  DataSourceConfig,
  DataSurfaceConfig,
  DOCUMENT_TOTAL_FOOTER_SECTIONS,
  EntryAttachmentsConfig,
  EntryCommandButtonConfig,
  EntryHeaderSectionConfig,
  EntryLinePlacementConfig,
  EntryLineTotalsConfig,
  LineColumnConfig,
  LineTotalsCalculationConfig,
  ListFactPanelConfig,
  LineSelectionStrategy,
  ListPageConfig,
  ListPageFactboxConfig
} from '../../shared/erp-core/public-api';

export const purchaseInvoiceDialogTitle = 'Purchase Invoice';

export const purchaseInvoiceHeaderCommandBar = {
  maxPrimaryActions: 3,
  maxVisibleGroups: 3
};

export const purchaseInvoiceLineCommandBar = {
  maxPrimaryActions: 1,
  maxVisibleGroups: 2
};

export const purchaseInvoiceLinePlacement: EntryLinePlacementConfig = {
  mode: 'after-section',
  afterSectionId: 'header-main'
};

export const purchaseInvoiceHeaderToolbarButtons: EntryCommandButtonConfig[] = [
  {
    label: 'Post',
    actionKey: 'dialog:posting',
    group: 'Process',
    isPrimary: true,
    order: 10,
    tone: 'primary',
    icon: 'bi bi-cloud-upload'
  },
  {
    label: 'Send Approval Request',
    actionKey: 'cmd:PortalSendApprovalRequest',
    group: 'Approval',
    isPrimary: true,
    order: 20,
    icon: 'bi bi-send'
  },
  {
    label: 'Cancel Request',
    actionKey: 'cmd:PortalCancelApprovalRequest',
    group: 'Approval',
    order: 30,
    icon: 'bi bi-x-circle'
  },
  {
    label: 'Dimensions',
    actionKey: 'dialog:dimensions',
    group: 'More',
    order: 40,
    icon: 'bi bi-diagram-3'
  }
];

export const purchaseInvoiceLineToolbarButtons: EntryCommandButtonConfig[] = [
  { label: 'Line', actionKey: 'cmd:line-new', group: 'Process', isPrimary: true, order: 10, icon: 'bi bi-plus-lg' },
  { label: 'Insert', actionKey: 'cmd:line-insert', group: 'Process', order: 20 },
  { label: 'Delete', actionKey: 'cmd:line-delete', group: 'Process', order: 30, icon: 'bi bi-trash' },
  {
    label: 'Pre payment',
    actionKey: 'cmd:prepayment',
    group: 'Process',
    order: 40,
    icon: 'bi bi-credit-card',
    runModalPageId: 'prepayment'
  },
  { label: 'Dimensions', actionKey: 'dialog:dimensions', group: 'Review', order: 50 },
  { label: 'Attachments', actionKey: 'dialog:attachments', group: 'More', order: 60, icon: 'bi bi-paperclip' }
];

export const purchaseInvoiceHeaderSections: EntryHeaderSectionConfig[] = [
  {
    id: 'header-main',
    title: 'Overview',
    fields: [
      { key: 'number', label: 'No', type: 'text', valueType: 'text', readonly: true, factPanel: { sectionId: 'document', sectionTitle: 'Document', order: 10, fallback: '-' } },
      {
        key: 'buyFromVendorNo',
        label: 'Vendor No',
        type: 'dropdown',
        valueType: 'text',
        optionsDataKey: '__options_buyFromVendorNo',
        optionsEndpoints: ['/vendorsAPI', '/vendors'],
        bindValue: 'number',
        bindLabel: 'displayName',
        displayFormat: '[number] - [displayName]',
        targets: [
          {
            key: 'buyFromVendorName',
            source: 'displayName',
            fallbackSources: ['name', 'name'],
            clearOnEmpty: true
          }
        ]
      },
      { key: 'buyFromVendorName', label: 'Vendor Name', type: 'text', valueType: 'text', width: 'wide', readonly: true, factPanel: { sectionId: 'document', sectionTitle: 'Document', label: 'Vendor', order: 20, fallback: '-' } },
      { key: 'documentDate', label: 'Document Date', type: 'date', valueType: 'date', factPanel: { sectionId: 'document', sectionTitle: 'Document', order: 30, fallback: '-' } },
      { key: 'postingDate', label: 'Posting Date', type: 'date', valueType: 'date', factPanel: { sectionId: 'document', sectionTitle: 'Document', order: 40, fallback: '-' } },
      { key: 'status', label: 'Status', type: 'text', valueType: 'text', readonly: true, defaultValue: 'Open', factPanel: { sectionId: 'review', sectionTitle: 'Review', order: 10, fallback: 'Open' } },
      { key: 'vendorInvoiceNumber', label: 'Vendor Invoice No', type: 'text', valueType: 'text' },
      {
        key: 'currencyCode',
        label: 'Currency Code',
        type: 'dropdown',
        valueType: 'text',
        optionsDataKey: '__options_currencyCode',
        optionsEndpoints: ['/currencyCodes'],
        bindValue: 'code',
        bindLabel: 'code',
        displayFormat: '[code]'
      },
      { key: 'approvalStatus', label: 'Approval Status', type: 'text', valueType: 'text', readonly: true, hidden: true, defaultValue: 'Pending', factPanel: { sectionId: 'review', sectionTitle: 'Review', label: 'Approval', order: 20, fallback: 'Pending' } },
      { key: 'pendingApproversId', label: 'Pending Approvers', type: 'text', valueType: 'text', readonly: true, hidden: true, defaultValue: 'None', factPanel: { sectionId: 'review', sectionTitle: 'Review', order: 30, fallback: 'None' } },
      { key: 'approvalComment', label: 'Approval Comment', type: 'text', valueType: 'text', readonly: true },
      { key: 'remark', label: 'Remark', type: 'textarea', valueType: 'text', width: 'wide' }
    ]
  }
];

export const purchaseInvoiceLineColumns: LineColumnConfig[] = [
  {
    id: 'type',
    label: 'Type',
    field: 'type',
    valueType: 'text',
    cellType: 'dropdown',
    options: [
      { label: 'G/L Account', value: 'G/L Account' },
      { label: 'Item', value: 'Item' },
      { label: 'Fixed Asset', value: 'Fixed Asset' },
      { label: 'Comment', value: ' ' }
    ]
  },
  {
    id: 'no',
    label: 'No',
    field: 'no',
    valueType: 'text',
    cellType: 'dropdown',
    options: [{ label: '', value: '' }],
    optionsDataKey: '__options_no'
  },
  {
    id: 'description',
    label: 'Description',
    field: 'description',
    valueType: 'text',
    cellType: 'text',
    factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 10, fallback: '-' }
  },
  {
    id: 'unitOfMeasureCode',
    label: 'Unit Of Measure',
    field: 'unitOfMeasureCode',
    valueType: 'text',
    cellType: 'dropdown',
    options: [{ label: '', value: '' }],
    optionsDataKey: '__options_unitOfMeasureCode',
    optionsEndpoints: ['/unitOfMeasures']
  },
  {
    id: 'locationCode',
    label: 'Location',
    field: 'locationCode',
    valueType: 'text',
    cellType: 'dropdown',
    options: [{ label: '', value: '' }],
    optionsDataKey: '__options_locationCode',
    optionsEndpoints: ['/locations']
  },
  { id: 'quantity', label: 'Quantity', field: 'quantity', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 20, fallback: '0' } },
  { id: 'directUnitCost', label: 'Unit Cost', field: 'directUnitCost', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 30, fallback: '0' } },
  { id: 'vat', label: 'VAT Amount', field: 'vat', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 40, fallback: '0' } },
  { id: 'lineAmount', label: 'Line Amount', field: 'lineAmount', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 50, fallback: '0' } },
  { id: 'amountIncludingVat', label: 'Amount Incl. VAT', field: 'amountIncludingVat', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 60, fallback: '0' } }
];

export const purchaseInvoiceAttachmentsDefault: EntryAttachmentsConfig = {
  headerFilesCount: 0,
  lineFilesCount: 0,
  canUpload: true,
  primaryActionLabel: 'Add header file',
  primaryActionKey: 'dialog:attachments'
};

export const purchaseInvoiceLineTotalsDefault: EntryLineTotalsConfig = {
  subtotal: '0.00',
  sst: '0.00',
  total: '0.00',
  difference: '0.00'
};

export const purchaseInvoiceLineTotalsCalculation: LineTotalsCalculationConfig = {
  defaults: purchaseInvoiceLineTotalsDefault,
  totals: {
    subtotal: { kind: 'sum', field: 'lineAmount' },
    sst: { kind: 'sum', field: 'vat' },
    total: { kind: 'sum', field: 'amountIncludingVat' },
    difference: { kind: 'default' }
  }
};

export const purchaseInvoiceFooterSections = DOCUMENT_TOTAL_FOOTER_SECTIONS;

export const purchaseInvoiceModifiedAtKey = 'systemModifiedAt';

export const purchaseInvoiceListDataSource: DataSourceConfig = {
  endpoint: '/purchaseInvoiceHeaders',
  keyField: 'systemId',
  documentNoField: 'number',
  autoGenerateNumber: true,
  lazyCreateOnFirstInput: false,
  defaultSort: 'number',
  pageSize: 20,
  supportsCreate: true,
  supportsUpdate: true,
  supportsDelete: true
};

export const purchaseInvoiceLineDataSource: DataSourceConfig = {
  endpoint: '/purchaseInvoiceLines',
  keyField: 'systemId',
  parentKeyField: 'documentNo',
  parentFixedFields: { documentType: 'Invoice' },
  createFields: ['documentType', 'documentNo', 'lineNo', 'type', 'no', 'quantity'],
  updateBlockedFields: ['systemId', 'id', 'documentNo', 'lineNo'],
  defaultSort: 'lineNo'
};

export const purchaseInvoiceLineMasterEndpoints = {
  glAccounts: ['/glAccounts'],
  items: ['/Items'],
  fixedAssets: ['/fixedAssets']
};

export const purchaseInvoiceLineMasterOptionFields = {
  glAccounts: {
    valueFields: ['no', 'number', 'code'],
    labelFields: ['name', 'description', 'displayName']
  },
  items: {
    valueFields: ['no', 'number', 'code'],
    labelFields: ['description', 'name', 'displayName']
  },
  fixedAssets: {
    valueFields: ['no', 'number', 'code'],
    labelFields: ['description', 'name', 'displayName']
  },
  unitOfMeasures: {
    valueFields: ['code', 'no', 'number'],
    labelFields: ['description', 'name', 'displayName']
  },
  locations: {
    valueFields: ['code', 'no', 'number'],
    labelFields: ['name', 'description', 'displayName']
  }
};

export const purchaseInvoiceLineIdentifierFields: string[] = ['no', 'number', 'code'];

export const purchaseInvoiceLineSelectionStrategy: LineSelectionStrategy = {
  descriptionField: 'description',
  descriptionSources: ['description', 'name'],
  unitOfMeasureField: 'unitOfMeasureCode',
  unitOfMeasureSources: ['baseUnitOfMeasure', 'unitOfMeasureCode'],
  unitCostField: 'directUnitCost',
  unitCostSources: ['directUnitCost', 'unitCost', 'unitPrice'],
  applyUnitCostOnlyWhenPositive: true
};

export const purchaseInvoiceListCommandsConfig: CommandConfig[] = [
  {
    id: 'process',
    label: 'Process',
    type: 'normal',
    group: 'process',
    actionKey: 'process'
  },
  {
    id: 'post',
    label: 'Post',
    type: 'normal',
    group: 'post',
    actionKey: 'post'
  },
  {
    id: 'more',
    label: 'More',
    type: 'menu',
    group: 'more',
    actionKey: 'more'
  }
];

export const purchaseInvoiceListConfig: DataSurfaceConfig = {
  id: 'purchase-invoice-list',
  mode: 'table',
  idField: 'systemId',
  columns: [
    { id: 'number', label: 'No', field: 'number', type: 'text', isPrimary: true },
    {
      id: 'buyFromVendorName',
      label: 'Vendor',
      field: 'buyFromVendorName',
      type: 'text',
      subtitleField: 'buyFromVendorNo'
    },
    { id: 'postingDate', label: 'Posting Date', field: 'postingDate', type: 'date' },
    { id: 'documentDate', label: 'Document Date', field: 'documentDate', type: 'date' },
    { id: 'status', label: 'Status', field: 'status', type: 'badge' },
    { id: 'pendingApproversId', label: 'Pending Approvers ID', field: 'pendingApproversId', type: 'text' },
    { id: 'remark', label: 'Remark', field: 'remark', type: 'text' },
    { id: 'vendorInvoiceNumber', label: 'Vendor Invoice No', field: 'vendorInvoiceNumber', type: 'text' },
    { id: 'amount', label: 'Amount', field: 'amount', type: 'currency', currencyCode: 'MYR', align: 'end' }
  ],
  selectable: true,
  multiSelect: false,
  sortable: true,
  resizable: true,
  infiniteScroll: false
};

export const purchaseInvoiceListFactPanelConfig: ListFactPanelConfig = {
  id: 'purchase-invoice-factbox',
  title: 'Purchase Invoice',
  subtitle: 'Document factbox',
  binding: {
    titleField: 'number',
    titleFallbackFields: ['number', 'vendorInvoiceNumber', 'id'],
    subtitleFallbackFields: ['status', 'approvalStatus', 'postingDate', 'documentDate'],
    summaryField: 'amount',
    summaryFallbackFields: ['amount', 'amountIncludingVat'],
    summaryType: 'number'
  },
  width: '324px',
  sections: [
    {
      id: 'document-summary',
      title: 'Document Summary',
      badges: [{ id: 'status', field: 'status', tone: 'success' }],
      fields: [
        { id: 'number', label: 'No', field: 'number' },
        { id: 'documentDate', label: 'Document Date', field: 'documentDate' },
        { id: 'amount', label: 'Amount', field: 'amount' }
      ]
    },
    {
      id: 'vendor',
      title: 'Vendor',
      fields: [
        { id: 'buyFromVendorNo', label: 'Vendor No', field: 'buyFromVendorNo' },
        { id: 'buyFromVendorName', label: 'Vendor Name', field: 'buyFromVendorName' },
        { id: 'currencyCode', label: 'Currency Code', field: 'currencyCode' }
      ]
    },
    {
      id: 'workflow',
      title: 'Workflow',
      badges: [{ id: 'approvalStatus', field: 'approvalStatus', tone: 'warning' }],
      fields: [
        { id: 'status', label: 'Status', field: 'status' },
        { id: 'pendingApproversId', label: 'Pending Approvers', field: 'pendingApproversId' },
        { id: 'approvalComment', label: 'Approval Comment', field: 'approvalComment' },
        { id: 'remark', label: 'Remark', field: 'remark' }
      ]
    },
    {
      id: 'audit',
      title: 'Audit',
      fields: [
        { id: 'id', label: 'ID', field: 'id' },
        { id: 'systemId', label: 'System ID', field: 'systemId' },
        { id: 'vendorInvoiceNumber', label: 'Vendor Invoice No', field: 'vendorInvoiceNumber' }
      ]
    }
  ]
};

export const purchaseInvoiceFactboxConfig: ListPageFactboxConfig = purchaseInvoiceListFactPanelConfig;

export const purchaseInvoiceListPageConfig: ListPageConfig = {
  title: 'Purchase Invoice',
  module: 'Purchase',
  company: 'Cronus International Ltd.',
  viewSuffix: 'purchase invoices',
  views: [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'released', label: 'Released' },
    { id: 'pendingApproval', label: 'Pending Approval' }
  ],
  activeViewId: 'all',
  tools: {
    advancedFilter: true
  },
  filterConfig: {
    enabled: true,
    storageKey: 'purchase-invoice-list'
  },
  standardActions: {
    new: true,
    delete: true,
    refresh: true
  },
  commands: purchaseInvoiceListCommandsConfig,
  dataSurface: purchaseInvoiceListConfig,
  factPanel: purchaseInvoiceListFactPanelConfig,
  factbox: purchaseInvoiceFactboxConfig
};
