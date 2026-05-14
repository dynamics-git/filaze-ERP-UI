import {
  CommandConfig,
  DataSourceConfig,
  DataSurfaceConfig,
  EntryAttachmentsConfig,
  EntryCommandButtonConfig,
  EntryHeaderSectionConfig,
  EntryLinePlacementConfig,
  EntryLineTotalsConfig,
  LineColumnConfig,
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
    runModalPageId: 'prepayment',
    runModalMode: 'page',
    runModalSize: 'full'
  },
  { label: 'Dimensions', actionKey: 'dialog:dimensions', group: 'Review', order: 50 },
  { label: 'Attachments', actionKey: 'dialog:attachments', group: 'More', order: 60, icon: 'bi bi-paperclip' }
];

export const purchaseInvoiceHeaderSections: EntryHeaderSectionConfig[] = [
  {
    id: 'header-main',
    title: 'Overview',
    fields: [
      { key: 'Number', label: 'No', type: 'text', valueType: 'text', readonly: true, factPanel: { sectionId: 'document', sectionTitle: 'Document', order: 10, fallback: '-' } },
      {
        key: 'BuyFromVendorNumber',
        label: 'Vendor No',
        type: 'dropdown',
        valueType: 'text',
        optionsDataKey: '__options_BuyFromVendorNumber',
        optionsEndpoints: ['/vendorsAPI', '/vendors'],
        bindValue: 'number',
        bindLabel: 'displayName',
        displayFormat: '[number] - [displayName]',
        targets: [
          {
            key: 'BuyFromVendorName',
            source: 'displayName',
            fallbackSources: ['name', 'Name'],
            clearOnEmpty: true
          }
        ]
      },
      { key: 'BuyFromVendorName', label: 'Vendor Name', type: 'text', valueType: 'text', width: 'wide', readonly: true, factPanel: { sectionId: 'document', sectionTitle: 'Document', label: 'Vendor', order: 20, fallback: '-' } },
      { key: 'DocumentDate', label: 'Document Date', type: 'date', valueType: 'date', factPanel: { sectionId: 'document', sectionTitle: 'Document', order: 30, fallback: '-' } },
      { key: 'PostingDate', label: 'Posting Date', type: 'date', valueType: 'date', factPanel: { sectionId: 'document', sectionTitle: 'Document', order: 40, fallback: '-' } },
      { key: 'Status', label: 'Status', type: 'text', valueType: 'text', readonly: true, defaultValue: 'Open', factPanel: { sectionId: 'review', sectionTitle: 'Review', order: 10, fallback: 'Open' } },
      { key: 'VendorInvoiceNumber', label: 'Vendor Invoice No', type: 'text', valueType: 'text' },
      {
        key: 'CurrencyCode',
        label: 'Currency Code',
        type: 'dropdown',
        valueType: 'text',
        optionsDataKey: '__options_CurrencyCode',
        optionsEndpoints: ['/currencyCodes'],
        bindValue: 'Code',
        bindLabel: 'Code',
        displayFormat: '[Code]'
      },
      { key: 'ApprovalStatus', label: 'Approval Status', type: 'text', valueType: 'text', readonly: true, hidden: true, defaultValue: 'Pending', factPanel: { sectionId: 'review', sectionTitle: 'Review', label: 'Approval', order: 20, fallback: 'Pending' } },
      { key: 'PendingApproversID', label: 'Pending Approvers', type: 'text', valueType: 'text', readonly: true, hidden: true, defaultValue: 'None', factPanel: { sectionId: 'review', sectionTitle: 'Review', order: 30, fallback: 'None' } },
      { key: 'ApprovalComment', label: 'Approval Comment', type: 'text', valueType: 'text', readonly: true },
      { key: 'Remark', label: 'Remark', type: 'textarea', valueType: 'text', width: 'wide' }
    ]
  }
];

export const purchaseInvoiceLineColumns: LineColumnConfig[] = [
  {
    id: 'Type',
    label: 'Type',
    field: 'Type',
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
    id: 'No',
    label: 'No',
    field: 'No',
    valueType: 'text',
    cellType: 'dropdown',
    options: [{ label: '', value: '' }],
    optionsDataKey: '__options_No'
  },
  {
    id: 'Description',
    label: 'Description',
    field: 'Description',
    valueType: 'text',
    cellType: 'text',
    factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 10, fallback: '-' }
  },
  {
    id: 'UnitOfMeasureCode',
    label: 'Unit Of Measure',
    field: 'UnitOfMeasureCode',
    valueType: 'text',
    cellType: 'dropdown',
    options: [{ label: '', value: '' }],
    optionsDataKey: '__options_UnitOfMeasureCode',
    optionsEndpoints: ['/unitOfMeasures']
  },
  {
    id: 'LocationCode',
    label: 'Location',
    field: 'LocationCode',
    valueType: 'text',
    cellType: 'dropdown',
    options: [{ label: '', value: '' }],
    optionsDataKey: '__options_LocationCode',
    optionsEndpoints: ['/locations']
  },
  { id: 'Quantity', label: 'Quantity', field: 'Quantity', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 20, fallback: '0' } },
  { id: 'DirectUnitCost', label: 'Unit Cost', field: 'DirectUnitCost', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 30, fallback: '0' } },
  { id: 'vat', label: 'VAT Amount', field: 'vat', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 40, fallback: '0' } },
  { id: 'LineAmount', label: 'Line Amount', field: 'LineAmount', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 50, fallback: '0' } },
  { id: 'amountIncludingVAT', label: 'Amount Incl. VAT', field: 'amountIncludingVAT', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 60, fallback: '0' } }
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

export const purchaseInvoiceModifiedAtKey = 'ModifiedAt';

export const purchaseInvoiceListDataSource: DataSourceConfig = {
  endpoint: '/purchaseInvoiceHeaders',
  contractProfileKey: 'purchaseInvoiceHeaders',
  keyField: 'Id',
  documentNoField: 'Number',
  autoGenerateNumber: true,
  lazyCreateOnFirstInput: false,
  defaultSort: 'Number',
  pageSize: 20,
  supportsCreate: true,
  supportsUpdate: true,
  supportsDelete: true
};

export const purchaseInvoiceLineDataSource: DataSourceConfig = {
  endpoint: '/purchaseInvoiceLines',
  contractProfileKey: 'purchaseInvoiceLines',
  keyField: 'Id',
  parentKeyField: 'DocumentNo',
  defaultSort: 'LineNo'
};

export const purchaseInvoiceLineMasterEndpoints = {
  glAccounts: ['/glAccounts'],
  items: ['/Items'],
  fixedAssets: ['/fixedAssets']
};

export const purchaseInvoiceLineMasterOptionFields = {
  glAccounts: {
    valueFields: ['No', 'Number', 'Code'],
    labelFields: ['Name', 'Description', 'DisplayName']
  },
  items: {
    valueFields: ['No', 'Number', 'Code'],
    labelFields: ['Description', 'Name', 'DisplayName']
  },
  fixedAssets: {
    valueFields: ['No', 'Number', 'Code'],
    labelFields: ['Description', 'Name', 'DisplayName']
  },
  unitOfMeasures: {
    valueFields: ['Code', 'No', 'Number'],
    labelFields: ['Description', 'Name', 'DisplayName']
  },
  locations: {
    valueFields: ['Code', 'No', 'Number'],
    labelFields: ['Name', 'Description', 'DisplayName']
  }
};

export const purchaseInvoiceLineIdentifierFields: string[] = ['No', 'Number', 'Code'];

export const purchaseInvoiceLineSelectionStrategy: LineSelectionStrategy = {
  descriptionField: 'Description',
  descriptionSources: ['Description', 'Name'],
  unitOfMeasureField: 'UnitOfMeasureCode',
  unitOfMeasureSources: ['BaseUnitOfMeasure', 'UnitOfMeasureCode'],
  unitCostField: 'DirectUnitCost',
  unitCostSources: ['DirectUnitCost', 'UnitCost', 'UnitPrice'],
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
  idField: 'Id',
  columns: [
    { id: 'Number', label: 'No', field: 'Number', type: 'text', isPrimary: true },
    {
      id: 'BuyFromVendorName',
      label: 'Vendor',
      field: 'BuyFromVendorName',
      type: 'text',
      subtitleField: 'BuyFromVendorNumber'
    },
    { id: 'PostingDate', label: 'Posting Date', field: 'PostingDate', type: 'date' },
    { id: 'DocumentDate', label: 'Document Date', field: 'DocumentDate', type: 'date' },
    { id: 'Status', label: 'Status', field: 'Status', type: 'badge' },
    { id: 'PendingApproversID', label: 'Pending Approvers ID', field: 'PendingApproversID', type: 'text' },
    { id: 'Remark', label: 'Remark', field: 'Remark', type: 'text' },
    { id: 'VendorInvoiceNumber', label: 'Vendor Invoice No', field: 'VendorInvoiceNumber', type: 'text' },
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
    titleField: 'Number',
    titleFallbackFields: ['Number', 'VendorInvoiceNumber', 'Id'],
    subtitleFallbackFields: ['Status', 'ApprovalStatus', 'PostingDate', 'DocumentDate'],
    summaryField: 'amount',
    summaryFallbackFields: ['amount', 'AmountIncludingVAT'],
    summaryType: 'number'
  },
  width: '324px',
  sections: [
    {
      id: 'document-summary',
      title: 'Document Summary',
      badges: [{ id: 'Status', field: 'Status', tone: 'success' }],
      fields: [
        { id: 'Number', label: 'No', field: 'Number' },
        { id: 'DocumentDate', label: 'Document Date', field: 'DocumentDate' },
        { id: 'amount', label: 'Amount', field: 'amount' }
      ]
    },
    {
      id: 'vendor',
      title: 'Vendor',
      fields: [
        { id: 'BuyFromVendorNumber', label: 'Vendor No', field: 'BuyFromVendorNumber' },
        { id: 'BuyFromVendorName', label: 'Vendor Name', field: 'BuyFromVendorName' },
        { id: 'CurrencyCode', label: 'Currency Code', field: 'CurrencyCode' }
      ]
    },
    {
      id: 'workflow',
      title: 'Workflow',
      badges: [{ id: 'ApprovalStatus', field: 'ApprovalStatus', tone: 'warning' }],
      fields: [
        { id: 'Status', label: 'Status', field: 'Status' },
        { id: 'PendingApproversID', label: 'Pending Approvers', field: 'PendingApproversID' },
        { id: 'ApprovalComment', label: 'Approval Comment', field: 'ApprovalComment' },
        { id: 'Remark', label: 'Remark', field: 'Remark' }
      ]
    },
    {
      id: 'audit',
      title: 'Audit',
      fields: [
        { id: 'Id', label: 'ID', field: 'Id' },
        { id: 'SystemId', label: 'System ID', field: 'SystemId' },
        { id: 'VendorInvoiceNumber', label: 'Vendor Invoice No', field: 'VendorInvoiceNumber' }
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
