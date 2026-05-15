import {
  CommandConfig,
  DataSourceConfig,
  DataSurfaceConfig,
  EntryAttachmentsConfig,
  EntryCommandButtonConfig,
  EntryHeaderSectionConfig,
  EntryLinePlacementConfig,
  EntryLineTotalsConfig,
  LineAmountFields,
  LineColumnConfig,
  LineSelectionStrategy,
  ListFactPanelConfig,
  ListPageConfig,
  ListPageFactboxConfig
} from '../../shared/erp-core/public-api';

export const purchaseOrderDialogTitle = 'Purchase Order';

export const purchaseOrderHeaderCommandBar = {
  maxPrimaryActions: 3,
  maxVisibleGroups: 3
};

export const purchaseOrderLineCommandBar = {
  maxPrimaryActions: 1,
  maxVisibleGroups: 2
};

export const purchaseOrderLinePlacement: EntryLinePlacementConfig = {
  mode: 'after-section',
  afterSectionId: 'header-main'
};

export const purchaseOrderHeaderToolbarButtons: EntryCommandButtonConfig[] = [
  {
    label: 'Release',
    actionKey: 'cmd:release',
    group: 'Process',
    isPrimary: true,
    order: 10,
    tone: 'primary',
    icon: 'bi bi-arrow-repeat'
  },
  {
    label: 'Re-Open',
    actionKey: 'cmd:reopen',
    group: 'Process',
    order: 20,
    icon: 'bi bi-box-arrow-in-right'
  },
  {
    label: 'Pre payment',
    actionKey: 'cmd:prepayment',
    group: 'Process',
    order: 30,
    icon: 'bi bi-credit-card',
    runModalPageId: 'prepayment',
    runModalMode: 'page',
    runModalSize: 'full'
  },
  {
    label: 'Send Approval Request',
    actionKey: 'cmd:SendApprovalRequest',
    group: 'Approval',
    isPrimary: true,
    order: 40,
    icon: 'bi bi-send'
  },
  {
    label: 'Cancel Approval Request',
    actionKey: 'cmd:CancelApprovalRequest',
    group: 'Approval',
    order: 50,
    icon: 'bi bi-x-circle'
  },
  {
    label: 'GRN Review',
    actionKey: 'cmd:GRNReview',
    group: 'Review',
    order: 60,
    icon: 'bi bi-file-earmark-check'
  },
  {
    label: 'Cancel GRN Review',
    actionKey: 'cmd:CancelGRNReview',
    group: 'Review',
    order: 70,
    icon: 'bi bi-file-earmark-x'
  },
  {
    label: 'Invoice Review',
    actionKey: 'cmd:InvoiceReview',
    group: 'Review',
    order: 80,
    icon: 'bi bi-receipt'
  },
  {
    label: 'Cancel Invoice Review',
    actionKey: 'cmd:CancelInvoiceReview',
    group: 'Review',
    order: 90,
    icon: 'bi bi-x-square'
  },
  {
    label: 'Post',
    actionKey: 'dialog:posting',
    group: 'Process',
    isPrimary: true,
    order: 100,
    icon: 'bi bi-cloud-upload'
  },
  {
    label: 'Convert to Variation Order',
    actionKey: 'cmd:ConverttoVariationOrder',
    group: 'Process',
    order: 110,
    icon: 'bi bi-arrow-left-right'
  },
  {
    label: 'Manual PO Cancel',
    actionKey: 'cmd:manualPOCancel',
    group: 'More',
    order: 120,
    icon: 'bi bi-ban'
  },
  {
    label: 'Submit Workflow',
    actionKey: 'cmd:SubmitWorkflow',
    group: 'Approval',
    order: 130,
    icon: 'bi bi-send'
  },
  {
    label: 'Cancel Workflow',
    actionKey: 'cmd:CancelWorkflow',
    group: 'Approval',
    order: 140,
    icon: 'bi bi-x-circle'
  }
];

export const purchaseOrderLineToolbarButtons: EntryCommandButtonConfig[] = [
  { label: 'Line', actionKey: 'cmd:line-new', group: 'Process', isPrimary: true, order: 10, icon: 'bi bi-plus-lg' },
  { label: 'Insert', actionKey: 'cmd:line-insert', group: 'Process', order: 20 },
  { label: 'Delete', actionKey: 'cmd:line-delete', group: 'Process', order: 25, icon: 'bi bi-trash' },
  { label: 'Dimensions', actionKey: 'dialog:dimensions', group: 'Review', order: 30 },
  { label: 'Attachments', actionKey: 'dialog:attachments', group: 'More', order: 40, icon: 'bi bi-paperclip' }
];

export const purchaseOrderDetailToolbarButtons: EntryCommandButtonConfig[] = [
  { label: 'Apply', actionKey: 'cmd:apply', tone: 'primary', icon: 'bi bi-check2' },
  { label: 'Validate', actionKey: 'cmd:validate' },
  { label: 'Clear', actionKey: 'cmd:clear' },
  { label: 'Close', actionKey: 'cmd:close' }
];

export const purchaseOrderHeaderSections: EntryHeaderSectionConfig[] = [
  {
    id: 'header-main',
    title: 'Primary Details',
    fields: [
      { key: 'number', label: 'No', type: 'text', valueType: 'text', readonly: true, factPanel: { sectionId: 'document', sectionTitle: 'Document', order: 10, fallback: '-' } },
      { key: 'dueDate', label: 'Due Date', type: 'date', valueType: 'date', readonly: true },
      {
        key: 'buyFromVendorNumber',
        label: 'Vendor No',
        type: 'dropdown',
        valueType: 'text',
        optionsDataKey: '__options_buyFromVendorNumber',
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
      { key: 'orderDate', label: 'Order Date', type: 'date', valueType: 'date', readonly: true, factPanel: { sectionId: 'document', sectionTitle: 'Document', order: 30, fallback: '-' } },
      { key: 'buyFromVendorName', label: 'Vendor Name', type: 'text', valueType: 'text', width: 'wide', readonly: true, factPanel: { sectionId: 'document', sectionTitle: 'Document', label: 'Vendor', order: 20, fallback: '-' } },
      { key: 'requestedReceiptDate', label: 'Requested Receipt Date', type: 'date', valueType: 'date', readonly: true },
      { key: 'buyFromAddress', label: 'Address', type: 'text', valueType: 'text', width: 'wide', readonly: true },
      {
        key: 'purchaserCode',
        label: 'Purchaser Code',
        type: 'dropdown',
        valueType: 'text',
        optionsDataKey: '__options_purchaserCode',
        optionsEndpoints: ['/salespersonPurchasers'],
        bindValue: 'code',
        bindLabel: 'name',
        displayFormat: '[code] - [name]'
      },
      { key: 'buyFromCountryOrRegionCode', label: 'Country', type: 'text', valueType: 'text', readonly: true },
      { key: 'status', label: 'Status', type: 'text', valueType: 'text', readonly: true, defaultValue: 'Open', factPanel: { sectionId: 'review', sectionTitle: 'Review', order: 10, fallback: 'Open' } },
      { key: 'buyFromPostCode', label: 'Post Code', type: 'text', valueType: 'text', readonly: true },
      { key: 'documentDate', label: 'Document Date', type: 'date', valueType: 'date' },
      { key: 'buyFromCity', label: 'City', type: 'text', valueType: 'text', readonly: true },
      { key: 'orderNumber', label: 'Order No', type: 'text', valueType: 'text', readonly: true },
      { key: 'buyFromContactNo', label: 'Contact No', type: 'text', valueType: 'text', readonly: true },
      { key: 'vendorOrderNumber', label: 'Vendor Order No', type: 'text', valueType: 'text' },
      { key: 'vendorInvoiceNumber', label: 'Vendor Invoice No', type: 'text', valueType: 'text' },
      { key: 'vendorShipmentNumber', label: 'Vendor Shipment No', type: 'text', valueType: 'text' },
      { key: 'quoteNumber', label: 'Quote No', type: 'text', valueType: 'text', readonly: true }
    ]
  },
  {
    id: 'financial',
    title: 'Financial & Delivery Info',
    fields: [
      {
        key: 'shortcutDimension1Code',
        label: 'PROJECT',
        type: 'dropdown',
        valueType: 'text',
        optionsDataKey: '__options_shortcutDimension1Code',
        optionsEndpoints: ['/dimensionsValues?$filter=DimensionCode eq \'PROJECT\'', '/shortcutDimension1Values', '/dimensionValues?$filter=DimensionCode eq \'PROJECT\''],
        optionsSkipWhenSuperAdmin: true,
        bindValue: 'code',
        bindLabel: 'name',
        displayFormat: '[code] - [name]'
      },
      {
        key: 'shortcutDimension2Code',
        label: 'DEPARTMENT/COST CNTR',
        type: 'dropdown',
        valueType: 'text',
        optionsDataKey: '__options_shortcutDimension2Code',
        optionsEndpoints: ['/dimensionsValues?$filter=DimensionCode eq \'DEPARTMENT/COST CNTR\'', '/shortcutDimension2Values', '/dimensionValues?$filter=DimensionCode eq \'DEPARTMENT\''],
        optionsSkipWhenSuperAdmin: true,
        bindValue: 'code',
        bindLabel: 'name',
        displayFormat: '[code] - [name]'
      },
      {
        key: 'paymentTermsCode',
        label: 'Payment Terms Code',
        type: 'dropdown',
        valueType: 'text',
        optionsDataKey: '__options_paymentTermsCode',
        optionsEndpoints: ['/paymentTerms'],
        bindValue: 'code',
        bindLabel: 'description',
        displayFormat: '[code] - [description]'
      },
      { key: 'validityDate', label: 'Validity Date', type: 'date', valueType: 'date' },
      { key: 'deliveryDate', label: 'Delivery Date', type: 'date', valueType: 'date' },
      { key: 'yourReference', label: 'Your Reference', type: 'text', valueType: 'text' },
      { key: 'paymentReference', label: 'Payment Reference', type: 'text', valueType: 'text' },
      {
        key: 'currencyCode',
        label: 'Currency',
        type: 'dropdown',
        valueType: 'text',
        readonly: true,
        optionsDataKey: '__options_currencyCode',
        optionsEndpoints: ['/currencyCodes', '/currencies'],
        bindValue: 'code',
        bindLabel: 'description',
        displayFormat: '[code] - [description]'
      },
      {
        key: 'responsibilityCenter',
        label: 'Responsibility center',
        type: 'dropdown',
        valueType: 'text',
        optionsDataKey: '__options_responsibilityCenter',
        optionsEndpoints: ['/portalResponsibilityCentres', '/responsibilityCenters', '/ResponsibilityCenters'],
        optionsSkipWhenSuperAdmin: true,
        bindValue: 'code',
        bindLabel: 'name',
        displayFormat: '[code] - [name]'
      },
      {
        key: 'approverGroup',
        label: 'Approver Group',
        type: 'dropdown',
        valueType: 'text',
        optionsDataKey: '__options_approverGroup',
        optionsEndpoints: ['/approvalGroups', '/pendingApprovers'],
        bindValue: 'code',
        bindLabel: 'description',
        displayFormat: '[code] - [description]'
      },
      { key: 'prepayment', label: 'Pre payment %', type: 'number', valueType: 'number' }
    ]
  },
  {
    id: 'vendor',
    title: 'Vendor Information',
    fields: [
      { key: 'buyFromVendorName', label: 'Pay-to / bill-to name', type: 'text', valueType: 'text', width: 'wide', readonly: true },
      { key: 'responsibilityCenter', label: 'Responsibility center', type: 'text', valueType: 'text' }
    ]
  },
  {
    id: 'remarks',
    title: 'Remarks & Approvals',
    fields: [
      { key: 'remark', label: 'Remark', type: 'textarea', valueType: 'text', width: 'wide' },
      { key: 'rejectReason', label: 'Approvers Comments', type: 'textarea', valueType: 'text', width: 'wide', readonly: true },
      { key: 'postingDate', label: 'Posting Date', type: 'date', valueType: 'date', factPanel: { sectionId: 'document', sectionTitle: 'Document', order: 40, fallback: '-' } }
    ]
  },
  {
    id: 'review',
    title: 'Review Status',
    fields: [
      { key: 'grnReviewStatus', label: 'GRN Review Status', type: 'text', valueType: 'text', readonly: true, defaultValue: 'Not Started', factPanel: { sectionId: 'review', sectionTitle: 'Review', label: 'GRN Review', order: 30, fallback: 'Not Started' } },
      { key: 'invoiceReviewStatus', label: 'Invoice Review Status', type: 'text', valueType: 'text', readonly: true, defaultValue: 'Not Started', factPanel: { sectionId: 'review', sectionTitle: 'Review', label: 'Invoice Review', order: 40, fallback: 'Not Started' } },
      { key: 'approvalStatus', label: 'Approval Status', type: 'text', valueType: 'text', readonly: true, defaultValue: 'Pending', factPanel: { sectionId: 'review', sectionTitle: 'Review', label: 'Approval', order: 20, fallback: 'Pending' } },
      { key: 'pendingApproversId', label: 'Pending Approvers', type: 'text', valueType: 'text', readonly: true, hidden: true, defaultValue: 'None', factPanel: { sectionId: 'review', sectionTitle: 'Review', order: 50, fallback: 'None' } },
      { key: 'systemModifiedAt', label: 'Modified At', type: 'text', valueType: 'text', readonly: true, defaultValue: '-' },
      { key: 'grnReviewerComment', label: 'GRN Reviewer Comment', type: 'text', valueType: 'text', readonly: true },
      { key: 'invoiceReviewerComment', label: 'Invoice Reviewer Comment', type: 'text', valueType: 'text', readonly: true }
    ]
  }
];

export const purchaseOrderLineColumns: LineColumnConfig[] = [
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
  { id: 'no', label: 'No', field: 'no', valueType: 'text', cellType: 'dropdown', options: [{ label: '', value: '' }], optionsDataKey: '__options_no' },
  {
    id: 'description',
    label: 'Description',
    field: 'description',
    valueType: 'text',
    cellType: 'text',
    factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 10, fallback: '-' }
  },
  {
    id: 'unitOfMeasure',
    label: 'Unit Of Measure',
    field: 'unitOfMeasure',
    valueType: 'text',
    cellType: 'dropdown',
    options: [{ label: '', value: '' }],
    optionsDataKey: '__options_unitOfMeasure',
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
  { id: 'originalCost', label: 'Original Cost/Unit', field: 'originalCost', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 30, fallback: '0' } },
  { id: 'tax', label: 'Tax/Unit', field: 'tax', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 40, fallback: '0' } },
  { id: 'directUnitCost', label: 'Unit Price', field: 'directUnitCost', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 50, fallback: '0' } },
  { id: 'lineDiscountAmount', label: 'Line Discount Amount', field: 'lineDiscountAmount', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 60, fallback: '0' } },
  { id: 'qtyToReceive', label: 'Qty. to Receive', field: 'qtyToReceive', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'quantityReceived', label: 'Quantity Received', field: 'quantityReceived', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'qtyToInvoice', label: 'Qty. to Invoice', field: 'qtyToInvoice', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'quantityInvoiced', label: 'Quantity Invoiced', field: 'quantityInvoiced', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'lineAmount', label: 'PO Amount', field: 'lineAmount', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 70, fallback: '0' } },
  { id: 'amountToInvoice', label: 'Amount To Invoice', field: 'amountToInvoice', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 80, fallback: '0' } },
  { id: 'amountInvoiced', label: 'Amount Invoiced', field: 'amountInvoiced', valueType: 'number', cellType: 'text', align: 'end', factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 90, fallback: '0' } },
  {
    id: 'Attachment',
    label: '',
    cellType: 'icon',
    buttonIcon: 'bi bi-paperclip',
    buttonTitle: 'Line attachment',
    actionKey: 'dialog:attachments'
  }
];

export const purchaseOrderLineMasterEndpoints = {
  glAccounts: ['/glAccounts'],
  items: ['/Items'],
  fixedAssets: ['/fixedAssets']
};

export const purchaseOrderLineMasterOptionFields = {
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

export const purchaseOrderModifiedAtKey = 'systemModifiedAt';

export const purchaseOrderLineAmountFields: LineAmountFields = {
  quantityField: 'quantity',
  qtyToInvoiceField: 'qtyToInvoice',
  unitCostField: 'directUnitCost',
  lineAmountField: 'lineAmount',
  amountToInvoiceField: 'amountToInvoice'
};

export const purchaseOrderLineIdentifierFields: string[] = ['no', 'number', 'code'];

export const purchaseOrderLineSelectionStrategy: LineSelectionStrategy = {
  descriptionField: 'description',
  descriptionSources: ['description', 'name'],
  unitOfMeasureField: 'unitOfMeasure',
  unitOfMeasureSources: ['baseUnitOfMeasure', 'unitOfMeasureCode'],
  unitCostField: 'directUnitCost',
  unitCostSources: ['directUnitCost', 'unitCost', 'unitPrice'],
  applyUnitCostOnlyWhenPositive: true
};

export const purchaseOrderAttachmentsDefault: EntryAttachmentsConfig = {
  headerFilesCount: 0,
  lineFilesCount: 0,
  canUpload: true,
  primaryActionLabel: 'Add header file',
  primaryActionKey: 'dialog:attachments'
};

export const purchaseOrderLineTotalsDefault: EntryLineTotalsConfig = {
  subtotal: '0.00',
  sst: '0.00',
  total: '0.00',
  difference: '0.00'
};

export const purchaseOrderListDataSource: DataSourceConfig = {
  endpoint: '/purchaseOrderHeaders',
  contractProfileKey: 'purchaseOrderHeaders',
  keyField: 'systemId',
  documentNoField: 'number',
  autoGenerateNumber: true,
  lazyCreateOnFirstInput: true,
  defaultSort: 'number',
  defaultFilter: "variationOrder ne true and manualPOCancel eq false",
  pageSize: 20,
  supportsCreate: true,
  supportsUpdate: true,
  supportsDelete: true
};

export const purchaseOrderLineDataSource: DataSourceConfig = {
  endpoint: '/purchaseOrderLines',
  keyField: 'systemId',
  parentKeyField: 'documentNo',
  parentFixedFields: { documentType: 'Order' },
  createFields: ['documentType', 'documentNo', 'lineNo', 'type', 'no', 'quantity'],
  updateBlockedFields: ['systemId', 'id', 'documentNo', 'lineNo'],
  defaultSort: 'lineNo'
};

export const purchaseOrderListCommandsConfig: CommandConfig[] = [
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
    id: 'reports',
    label: 'Reports',
    type: 'normal',
    group: 'report',
    actionKey: 'reports'
  },
  {
    id: 'more',
    label: 'More',
    type: 'menu',
    group: 'more',
    actionKey: 'more'
  }
];

export const purchaseOrderListConfig: DataSurfaceConfig = {
  id: 'purchase-order-list',
  mode: 'table',
  idField: 'systemId',
  columns: [
    {
      id: 'number',
      label: 'No',
      field: 'number',
      type: 'text',
      isPrimary: true
    },
    {
      id: 'buyFromVendorName',
      label: 'Buy-from Vendor Name',
      field: 'buyFromVendorName',
      type: 'text',
      subtitleField: 'buyFromVendorNumber'
    },
    {
      id: 'orderDate',
      label: 'Order Date',
      field: 'orderDate',
      type: 'date'
    },
    {
      id: 'postingDate',
      label: 'Posting Date',
      field: 'postingDate',
      type: 'date'
    },
    {
      id: 'status',
      label: 'Status',
      field: 'status',
      type: 'badge'
    },
    {
      id: 'currencyCode',
      label: 'Currency',
      field: 'currencyCode',
      type: 'text'
    },
    {
      id: 'amountIncludingVat',
      label: 'Amount Including VAT',
      field: 'amountIncludingVat',
      type: 'currency',
      currencyCode: 'MYR',
      align: 'end'
    },
    {
      id: 'pendingApproversId',
      label: 'Pending Approvers',
      field: 'pendingApproversId',
      type: 'text'
    },
    {
      id: 'grnReviewStatus',
      label: 'GRN Review',
      field: 'grnReviewStatus',
      type: 'text'
    },
    {
      id: 'invoiceReviewStatus',
      label: 'Invoice Review',
      field: 'invoiceReviewStatus',
      type: 'text'
    },
    {
      id: 'systemModifiedAt',
      label: 'Modified',
      field: 'systemModifiedAt',
      type: 'date'
    }
  ],
  selectable: true,
  multiSelect: false,
  sortable: true,
  resizable: true,
  infiniteScroll: false
};

export const purchaseOrderListFactPanelConfig: ListFactPanelConfig = {
  id: 'purchase-order-factbox',
  title: 'Purchase Order',
  subtitle: 'Document factbox',
  binding: {
    titleField: 'number',
    titleFallbackFields: ['number', 'orderNumber', 'id'],
    subtitleFallbackFields: ['status', 'approvalStatus', 'orderDate', 'documentDate'],
    summaryField: 'amountIncludingVat',
    summaryFallbackFields: ['amountIncludingVat', 'amount'],
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
        { id: 'orderDate', label: 'Order Date', field: 'orderDate' },
        { id: 'amountIncludingVat', label: 'Amount Including VAT', field: 'amountIncludingVat' }
      ]
    },
    {
      id: 'vendor',
      title: 'Vendor',
      fields: [
        { id: 'buyFromVendorNumber', label: 'Vendor No', field: 'buyFromVendorNumber' },
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
        { id: 'grnReviewStatus', label: 'GRN Review', field: 'grnReviewStatus' },
        { id: 'invoiceReviewStatus', label: 'Invoice Review', field: 'invoiceReviewStatus' }
      ]
    },
    {
      id: 'audit',
      title: 'Audit',
      fields: [
        { id: 'id', label: 'ID', field: 'id' },
        { id: 'systemId', label: 'System ID', field: 'systemId' },
        { id: 'systemModifiedAt', label: 'Modified At', field: 'systemModifiedAt' }
      ]
    }
  ]
};

export const purchaseOrderFactboxConfig: ListPageFactboxConfig = purchaseOrderListFactPanelConfig;

export const purchaseOrderListPageConfig: ListPageConfig = {
  title: 'Purchase Order',
  module: 'Purchase',
  company: 'Cronus International Ltd.',
  viewSuffix: 'purchase orders',
  views: [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'released', label: 'Released' },
    { id: 'pendingPrepayment', label: 'Pending Prepayment' }
  ],
  activeViewId: 'all',
  tools: {
    advancedFilter: true
  },
  filterConfig: {
    enabled: true,
    storageKey: 'purchase-order-list'
  },
  standardActions: {
    new: true,
    delete: true,
    refresh: true
  },
  commands: purchaseOrderListCommandsConfig,
  dataSurface: purchaseOrderListConfig,
  factPanel: purchaseOrderListFactPanelConfig,
  factbox: purchaseOrderFactboxConfig
};
