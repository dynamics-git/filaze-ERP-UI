import { ErpCommandConfig } from '../../shared/erp-core/models/command-config.model';
import { ErpDataSourceConfig } from '../../shared/erp-core/models/data-source-config.model';
import { ErpDataSurfaceConfig } from '../../shared/erp-core/models/data-surface-config.model';
import {
  ErpEntryAttachmentsConfig,
  ErpEntryCommandButtonConfig,
  ErpEntryHeaderSectionConfig,
  ErpEntryLinePlacementConfig,
  ErpEntryLineTotalsConfig
} from '../../shared/erp-core/models/entry-dialog-config.model';
import { ErpFactboxConfig } from '../../shared/erp-core/models/factbox-config.model';
import { ErpLineColumnConfig } from '../../shared/erp-core/models/line-config.model';
import type { ErpListPageConfig } from '../../shared/erp-core/components/list-page/list-page';

export const purchaseOrderDialogTitle = 'Purchase Order';

export const purchaseOrderHeaderCommandBar = {
  maxPrimaryActions: 3,
  maxVisibleGroups: 3
};

export const purchaseOrderLineCommandBar = {
  maxPrimaryActions: 1,
  maxVisibleGroups: 2
};

export const purchaseOrderLinePlacement: ErpEntryLinePlacementConfig = {
  mode: 'after-section',
  afterSectionId: 'header-main'
};

export const purchaseOrderHeaderToolbarButtons: ErpEntryCommandButtonConfig[] = [
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
    icon: 'bi bi-credit-card'
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

export const purchaseOrderLineToolbarButtons: ErpEntryCommandButtonConfig[] = [
  { label: 'Line', actionKey: 'cmd:line-new', group: 'Process', isPrimary: true, order: 10, icon: 'bi bi-plus-lg' },
  { label: 'Insert', actionKey: 'cmd:line-insert', group: 'Process', order: 20 },
  { label: 'Delete', actionKey: 'cmd:line-delete', group: 'Process', order: 25, icon: 'bi bi-trash' },
  { label: 'Dimensions', actionKey: 'dialog:dimensions', group: 'Review', order: 30 },
  { label: 'Attachments', actionKey: 'dialog:attachments', group: 'More', order: 40, icon: 'bi bi-paperclip' }
];

export const purchaseOrderDetailToolbarButtons: ErpEntryCommandButtonConfig[] = [
  { label: 'Apply', actionKey: 'cmd:apply', tone: 'primary', icon: 'bi bi-check2' },
  { label: 'Validate', actionKey: 'cmd:validate' },
  { label: 'Clear', actionKey: 'cmd:clear' },
  { label: 'Close', actionKey: 'cmd:close' }
];

export const purchaseOrderHeaderSections: ErpEntryHeaderSectionConfig[] = [
  {
    id: 'header-main',
    title: 'Primary Details',
    fields: [
      { key: 'Number', label: 'No', type: 'text', valueType: 'text', readonly: true },
      { key: 'DueDate', label: 'Due Date', type: 'date', valueType: 'date', readonly: true },
      {
        key: 'BuyFromVendorNumber',
        label: 'Vendor No',
        type: 'select',
        valueType: 'text',
        optionsDataKey: '__options_BuyFromVendorNumber',
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
      { key: 'OrderDate', label: 'Order Date', type: 'date', valueType: 'date', readonly: true },
      { key: 'BuyFromVendorName', label: 'Vendor Name', type: 'text', valueType: 'text', width: 'wide', readonly: true },
      { key: 'RequestedReceiptDate', label: 'Requested Receipt Date', type: 'date', valueType: 'date', readonly: true },
      { key: 'BuyFromAddress', label: 'Address', type: 'text', valueType: 'text', width: 'wide', readonly: true },
      {
        key: 'PurchaserCode',
        label: 'Purchaser Code',
        type: 'select',
        valueType: 'text',
        optionsDataKey: '__options_PurchaserCode',
        bindValue: 'Code',
        bindLabel: 'Name',
        displayFormat: '[Code] - [Name]'
      },
      { key: 'BuyFromCountryOrRegionCode', label: 'Country', type: 'text', valueType: 'text', readonly: true },
      { key: 'Status', label: 'Status', type: 'text', valueType: 'text', readonly: true, defaultValue: 'Open' },
      { key: 'BuyFromPostCode', label: 'Post Code', type: 'text', valueType: 'text', readonly: true },
      { key: 'DocumentDate', label: 'Document Date', type: 'date', valueType: 'date' },
      { key: 'BuyFromCity', label: 'City', type: 'text', valueType: 'text', readonly: true },
      { key: 'OrderNumber', label: 'Order No', type: 'text', valueType: 'text', readonly: true },
      { key: 'BuyFromContactNumber', label: 'Contact No', type: 'text', valueType: 'text', readonly: true },
      { key: 'VendorOrderNumber', label: 'Vendor Order No', type: 'text', valueType: 'text' },
      { key: 'VendorInvoiceNumber', label: 'Vendor Invoice No', type: 'text', valueType: 'text' },
      { key: 'VendorShipmentNumber', label: 'Vendor Shipment No', type: 'text', valueType: 'text' },
      { key: 'QuoteNumber', label: 'Quote No', type: 'text', valueType: 'text', readonly: true }
    ]
  },
  {
    id: 'financial',
    title: 'Financial & Delivery Info',
    fields: [
      {
        key: 'ShortcutDimension1Code',
        label: 'PROJECT',
        type: 'select',
        valueType: 'text',
        optionsDataKey: '__options_ShortcutDimension1Code',
        bindValue: 'Code',
        bindLabel: 'Name',
        displayFormat: '[Code] - [Name]'
      },
      {
        key: 'ShortcutDimension2Code',
        label: 'DEPARTMENT/COST CNTR',
        type: 'select',
        valueType: 'text',
        optionsDataKey: '__options_ShortcutDimension2Code',
        bindValue: 'Code',
        bindLabel: 'Name',
        displayFormat: '[Code] - [Name]'
      },
      {
        key: 'PaymentTermsCode',
        label: 'Payment Terms Code',
        type: 'select',
        valueType: 'text',
        optionsDataKey: '__options_PaymentTermsCode',
        bindValue: 'Code',
        bindLabel: 'Description',
        displayFormat: '[Code] - [Description]'
      },
      { key: 'ValidityDate', label: 'Validity Date', type: 'date', valueType: 'date' },
      { key: 'DeliveryDate', label: 'Delivery Date', type: 'date', valueType: 'date' },
      { key: 'YourReference', label: 'Your Reference', type: 'text', valueType: 'text' },
      { key: 'PaymentReference', label: 'Payment Reference', type: 'text', valueType: 'text' },
      {
        key: 'CurrencyCode',
        label: 'Currency',
        type: 'select',
        valueType: 'text',
        readonly: true,
        optionsDataKey: '__options_CurrencyCode',
        bindValue: 'Code',
        bindLabel: 'Description',
        displayFormat: '[Code] - [Description]'
      },
      {
        key: 'ResponsibilityCenter',
        label: 'Responsibility center',
        type: 'select',
        valueType: 'text',
        optionsDataKey: '__options_ResponsibilityCenter',
        bindValue: 'Code',
        bindLabel: 'Name',
        displayFormat: '[Code] - [Name]'
      },
      {
        key: 'ApproverGroup',
        label: 'Approver Group',
        type: 'select',
        valueType: 'text',
        optionsDataKey: '__options_ApproverGroup',
        bindValue: 'Code',
        bindLabel: 'Description',
        displayFormat: '[Code] - [Description]'
      },
      { key: 'Prepayment', label: 'Pre payment %', type: 'number', valueType: 'number' }
    ]
  },
  {
    id: 'vendor',
    title: 'Vendor Information',
    fields: [
      { key: 'BuyFromVendorName', label: 'Pay-to / bill-to name', type: 'text', valueType: 'text', width: 'wide', readonly: true },
      { key: 'ResponsibilityCenter', label: 'Responsibility center', type: 'text', valueType: 'text' }
    ]
  },
  {
    id: 'remarks',
    title: 'Remarks & Approvals',
    fields: [
      { key: 'Remark', label: 'Remark', type: 'textarea', valueType: 'text', width: 'wide' },
      { key: 'RejectReason', label: 'Approvers Comments', type: 'textarea', valueType: 'text', width: 'wide', readonly: true },
      { key: 'PostingDate', label: 'Posting Date', type: 'date', valueType: 'date' }
    ]
  },
  {
    id: 'review',
    title: 'Review Status',
    fields: [
      { key: 'GRNReviewStatus', label: 'GRN Review Status', type: 'text', valueType: 'text', readonly: true, defaultValue: 'Not Started' },
      { key: 'InvoiceReviewStatus', label: 'Invoice Review Status', type: 'text', valueType: 'text', readonly: true, defaultValue: 'Not Started' },
      { key: 'ApprovalStatus', label: 'Approval Status', type: 'text', valueType: 'text', readonly: true, defaultValue: 'Pending' },
      { key: 'ModifiedAt', label: 'Modified At', type: 'text', valueType: 'text', readonly: true, defaultValue: '-' },
      { key: 'GRNReviewerComment', label: 'GRN Reviewer Comment', type: 'text', valueType: 'text', readonly: true },
      { key: 'InvoiceReviewerComment', label: 'Invoice Reviewer Comment', type: 'text', valueType: 'text', readonly: true }
    ]
  }
];

export const purchaseOrderLineColumns: ErpLineColumnConfig[] = [
  {
    id: 'Type',
    label: 'Type',
    field: 'Type',
    valueType: 'text',
    cellType: 'select',
    options: [
      { label: 'G/L Account', value: 'G/L Account' },
      { label: 'Item', value: 'Item' },
      { label: 'Fixed Asset', value: 'Fixed Asset' },
      { label: 'Comment', value: ' ' }
    ]
  },
  { id: 'Number', label: 'No', field: 'Number', valueType: 'text', cellType: 'select', options: [{ label: '', value: '' }] },
  { id: 'Description', label: 'Description', field: 'Description', valueType: 'text', cellType: 'text' },
  { id: 'UnitOfMeasure', label: 'Unit Of Measure', field: 'UnitOfMeasure', valueType: 'text', cellType: 'select', options: [{ label: '', value: '' }] },
  { id: 'LocationCode', label: 'Location', field: 'LocationCode', valueType: 'text', cellType: 'select', options: [{ label: '', value: '' }] },
  { id: 'Quantity', label: 'Quantity', field: 'Quantity', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'OriginalCost', label: 'Original Cost/Unit', field: 'OriginalCost', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'Tax', label: 'Tax/Unit', field: 'Tax', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'DirectUnitCost', label: 'Unit Price', field: 'DirectUnitCost', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'LineDiscountAmount', label: 'Line Discount Amount', field: 'LineDiscountAmount', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'QtyToReceive', label: 'Qty. to Receive', field: 'QtyToReceive', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'QuantityReceived', label: 'Quantity Received', field: 'QuantityReceived', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'QtyToInvoice', label: 'Qty. to Invoice', field: 'QtyToInvoice', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'QuantityInvoiced', label: 'Quantity Invoiced', field: 'QuantityInvoiced', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'LineAmount', label: 'PO Amount', field: 'LineAmount', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'AmountToInvoice', label: 'Amount To Invoice', field: 'AmountToInvoice', valueType: 'number', cellType: 'text', align: 'end' },
  { id: 'AmountInvoiced', label: 'Amount Invoiced', field: 'AmountInvoiced', valueType: 'number', cellType: 'text', align: 'end' },
  {
    id: 'Attachment',
    label: '',
    cellType: 'icon',
    buttonIcon: 'bi bi-paperclip',
    buttonTitle: 'Line attachment',
    actionKey: 'dialog:attachments'
  }
];

export const purchaseOrderLineNumberIdentifierFields = ['No', 'Number', 'Code'];

export const purchaseOrderLineSelectionStrategy = {
  descriptionField: 'Description',
  descriptionSources: ['Description', 'Name'],
  unitOfMeasureField: 'UnitOfMeasure',
  unitOfMeasureSources: ['BaseUnitOfMeasure', 'UnitOfMeasureCode'],
  unitCostField: 'DirectUnitCost',
  unitCostSources: ['DirectUnitCost', 'UnitCost', 'UnitPrice'],
  applyUnitCostOnlyWhenPositive: true
};

export const purchaseOrderLineTypeChangeProfile = {
  clearFields: ['Number', 'Description', 'UnitOfMeasure', 'LocationCode']
};

export const purchaseOrderAttachmentsDefault: ErpEntryAttachmentsConfig = {
  headerFilesCount: 0,
  lineFilesCount: 0,
  canUpload: true,
  primaryActionLabel: 'Add header file',
  primaryActionKey: 'dialog:attachments'
};

export const purchaseOrderLineTotalsDefault: ErpEntryLineTotalsConfig = {
  subtotal: '0.00',
  sst: '0.00',
  total: '0.00',
  difference: '0.00'
};

export const purchaseOrderListDataSource: ErpDataSourceConfig = {
  endpoint: '/purchaseOrderHeaders',
  contractProfileKey: 'purchaseOrderHeaders',
  keyField: 'Id',
  documentNoField: 'Number',
  autoGenerateNumber: true,
  lazyCreateOnFirstInput: true,
  defaultSort: 'Number',
  defaultFilter: "VariationOrder ne true and ManualPOCancel eq false",
  pageSize: 20,
  supportsCreate: true,
  supportsUpdate: true,
  supportsDelete: true
};

export const purchaseOrderDocumentNumbering = {
  endpoint: '/purchaseOrderHeaders',
  orderByField: 'Number',
  numberFieldCandidates: ['Number', 'No'],
  fallbackPrefix: 'PO'
};

export const purchaseOrderLineDataSource: ErpDataSourceConfig = {
  endpoint: '/purchaseOrderLines',
  keyField: 'Id',
  parentKeyField: 'DocumentNo',
  defaultSort: 'LineNo'
};

export const purchaseOrderListCommandsConfig: ErpCommandConfig[] = [
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

export const purchaseOrderListConfig: ErpDataSurfaceConfig = {
  id: 'purchase-order-list',
  mode: 'table',
  idField: 'Id',
  columns: [
    {
      id: 'Number',
      label: 'No',
      field: 'Number',
      type: 'text',
      isPrimary: true
    },
    {
      id: 'BuyFromVendorName',
      label: 'Buy-from Vendor Name',
      field: 'BuyFromVendorName',
      type: 'text',
      subtitleField: 'BuyFromVendorNumber'
    },
    {
      id: 'OrderDate',
      label: 'Order Date',
      field: 'OrderDate',
      type: 'date'
    },
    {
      id: 'PostingDate',
      label: 'Posting Date',
      field: 'PostingDate',
      type: 'date'
    },
    {
      id: 'Status',
      label: 'Status',
      field: 'Status',
      type: 'badge'
    },
    {
      id: 'CurrencyCode',
      label: 'Currency',
      field: 'CurrencyCode',
      type: 'text'
    },
    {
      id: 'AmountIncludingVAT',
      label: 'Amount Including VAT',
      field: 'AmountIncludingVAT',
      type: 'currency',
      currencyCode: 'MYR',
      align: 'end'
    },
    {
      id: 'PendingApproversID',
      label: 'Pending Approvers',
      field: 'PendingApproversID',
      type: 'text'
    },
    {
      id: 'GRNReviewStatus',
      label: 'GRN Review',
      field: 'GRNReviewStatus',
      type: 'text'
    },
    {
      id: 'InvoiceReviewStatus',
      label: 'Invoice Review',
      field: 'InvoiceReviewStatus',
      type: 'text'
    },
    {
      id: 'ModifiedAt',
      label: 'Modified',
      field: 'ModifiedAt',
      type: 'date'
    }
  ],
  selectable: true,
  multiSelect: false,
  sortable: true,
  resizable: true,
  infiniteScroll: false
};

export const purchaseOrderFactboxConfig: ErpFactboxConfig = {
  id: 'purchase-order-factbox',
  title: 'Purchase Order',
  subtitle: 'Document factbox',
  width: '324px',
  sections: [
    {
      id: 'document-summary',
      title: 'Document Summary',
      badges: [{ id: 'Status', field: 'Status', tone: 'success' }],
      fields: [
        { id: 'Number', label: 'No', field: 'Number' },
        { id: 'OrderDate', label: 'Order Date', field: 'OrderDate' },
        { id: 'AmountIncludingVAT', label: 'Amount Including VAT', field: 'AmountIncludingVAT' }
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
        { id: 'GRNReviewStatus', label: 'GRN Review', field: 'GRNReviewStatus' },
        { id: 'InvoiceReviewStatus', label: 'Invoice Review', field: 'InvoiceReviewStatus' }
      ]
    },
    {
      id: 'audit',
      title: 'Audit',
      fields: [
        { id: 'Id', label: 'ID', field: 'Id' },
        { id: 'SystemId', label: 'System ID', field: 'SystemId' },
        { id: 'ModifiedAt', label: 'Modified At', field: 'ModifiedAt' }
      ]
    }
  ]
};

export const purchaseOrderListPageConfig: ErpListPageConfig = {
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
  factbox: purchaseOrderFactboxConfig
};
