import {
  CommandConfig,
  DataSourceConfig,
  buildDocumentTotalFooterSections,
  EntryAttachmentsConfig,
  EntryCommandButtonConfig,
  EntryHeaderSectionConfig,
  EntryLineTotalsConfig,
  LineColumnConfig,
  LineTotalsCalculationConfig,
  ListPageConfig
} from '../../shared/erp-core/public-api';

export const prepaymentDialogTitle = 'Prepayment';

export const prepaymentHeaderCommandBar = {
  maxPrimaryActions: 2,
  maxVisibleGroups: 1
};

export const prepaymentLineCommandBar = {
  maxPrimaryActions: 3,
  maxVisibleGroups: 1
};

export const prepaymentLineToolbarButtons: EntryCommandButtonConfig[] = [
  {
    label: 'Line',
    actionKey: 'cmd:line-new',
    group: 'Process',
    isPrimary: true,
    order: 10,
    icon: 'bi bi-plus-lg'
  },
  {
    label: 'Insert',
    actionKey: 'cmd:line-insert',
    group: 'Process',
    isPrimary: true,
    order: 20
  },
  {
    label: 'Delete',
    actionKey: 'cmd:line-delete',
    group: 'Process',
    isPrimary: true,
    order: 30,
    icon: 'bi bi-trash'
  },
  {
    label: 'Attachments',
    actionKey: 'dialog:attachments',
    group: 'More',
    order: 40,
    icon: 'bi bi-paperclip'
  }
];

export const prepaymentHeaderToolbarButtons: EntryCommandButtonConfig[] = [
  {
    label: 'Apply Prepayment',
    actionKey: 'cmd:apply',
    group: 'Process',
    isPrimary: true,
    order: 10,
    tone: 'primary',
    icon: 'bi bi-check-circle'
  },
  {
    label: 'Delete Prepayment',
    actionKey: 'cmd:delete',
    group: 'Process',
    order: 20,
    icon: 'bi bi-trash'
  },
  {
    label: 'Purchase Order',
    actionKey: 'cmd:purchase-order',
    group: 'Process',
    order: 30,
    icon: 'bi bi-file-earmark-text',
    runModalPageId: 'purchase-order',
    runModalTarget: 'list'
  }
];

export const prepaymentHeaderSections: EntryHeaderSectionConfig[] = [
  {
    id: 'information',
    title: 'Information',
    fields: [
      {
        key: 'documentNo',
        label: 'Document No',
        type: 'text',
        valueType: 'text',
        readonly: true,
        hidden: true,
        factPanel: { sectionId: 'summary', sectionTitle: 'Summary', order: 10, fallback: '-' }
      },
      {
        key: 'sourceLineNo',
        label: 'Source Line No',
        type: 'number',
        valueType: 'number',
        readonly: true,
        hidden: true,
        factPanel: { sectionId: 'summary', sectionTitle: 'Summary', order: 20, fallback: '-' }
      },
      {
        key: 'purchaseLineId',
        label: 'Purchase Line ID',
        type: 'text',
        valueType: 'text',
        readonly: true,
        hidden: true,
        factPanel: { sectionId: 'summary', sectionTitle: 'Summary', order: 30, fallback: '-' }
      },
      {
        key: 'originalAmountToPrepayment',
        label: 'Original Amount To Prepayment',
        type: 'number',
        valueType: 'number',
        readonly: true,
        defaultValue: 0,
        factPanel: { sectionId: 'amounts', sectionTitle: 'Amounts', label: 'Original Amount', order: 10, fallback: '0.00' }
      },
      {
        key: 'percentage',
        label: 'Percentage',
        type: 'number',
        valueType: 'number',
        readonly: false,
        defaultValue: 0
      },
      {
        key: 'amount',
        label: 'Amount',
        type: 'number',
        valueType: 'number',
        readonly: false,
        defaultValue: 0,
        factPanel: { sectionId: 'amounts', sectionTitle: 'Amounts', label: 'Applied Amount', order: 20, fallback: '0.00' }
      }
    ]
  }
];

export const prepaymentLineColumns: LineColumnConfig[] = [
  {
    id: 'sourceLineNo',
    label: 'Source Line No',
    field: 'sourceLineNo',
    valueType: 'number',
    cellType: 'text',
    readonly: true,
    align: 'end',
    factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 10, fallback: '-' }
  },
  {
    id: 'percentage',
    label: 'Percentage',
    field: 'percentage',
    valueType: 'number',
    cellType: 'text',
    readonly: true,
    align: 'end',
    factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 20, fallback: '0' }
  },
  {
    id: 'amount',
    label: 'Amount',
    field: 'amount',
    valueType: 'number',
    cellType: 'text',
    readonly: true,
    align: 'end',
    factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 30, fallback: '0' }
  },
  {
    id: 'remainingAmount',
    label: 'Remaining Amount',
    field: 'remainingAmount',
    valueType: 'number',
    cellType: 'text',
    readonly: true,
    align: 'end',
    factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 40, fallback: '0' }
  }
];

export const prepaymentLineTotalsDefault: EntryLineTotalsConfig = {
  subtotal: '0.00',
  sst: '0.00',
  total: '0.00',
  difference: '0.00'
};

export const prepaymentLineTotalsCalculation: LineTotalsCalculationConfig = {
  defaults: prepaymentLineTotalsDefault,
  totals: {
    subtotal: { kind: 'sum', field: 'amount' },
    sst: { kind: 'default' },
    total: { kind: 'sum', field: 'amount' },
    difference: { kind: 'sum', field: 'remainingAmount' }
  }
};

export const prepaymentFooterSections = buildDocumentTotalFooterSections([
  { id: 'amount', label: 'Amount', source: 'total', totalKey: 'subtotal', order: 10 },
  { id: 'remaining-amount', label: 'Remaining Amount', source: 'total', totalKey: 'difference', emphasis: true, order: 20 }
]);

export const prepaymentAttachmentsDefault: EntryAttachmentsConfig = {
  headerFilesCount: 0,
  lineFilesCount: 0,
  canUpload: true,
  primaryActionLabel: 'Add header file',
  primaryActionKey: 'dialog:attachments'
};

export const prepaymentListDataSource: DataSourceConfig = {
  endpoint: '/portalInvPrePayments',
  keyField: 'systemId',
  defaultSort: 'documentNo',
  pageSize: 20,
  createFields: ['percentage', 'amount', 'genBusPostingGroup', 'genProdPostingGroup'],
  navigation: {
    parentEndpoint: '/purchaseInvoiceLines',
    childCollection: 'portalInvPrePayments',
    parentIdFields: ['systemId'],
    top: 200
  }
};

export const prepaymentListCommandsConfig: CommandConfig[] = [];

export const prepaymentListPageConfig: ListPageConfig = {
  title: 'Prepayment',
  module: 'Purchase',
  company: 'Cronus International Ltd.',
  viewSuffix: 'prepayments',
  views: [
    { id: 'all', label: 'All' }
  ],
  activeViewId: 'all',
  filterConfig: {
    enabled: true,
    storageKey: 'prepayment-list'
  },
  commands: prepaymentListCommandsConfig,
  dataSurface: {
    id: 'prepayment-list',
    mode: 'table',
    idField: 'systemId',
    columns: [
      { id: 'documentNo', label: 'Document No', field: 'documentNo', type: 'text', isPrimary: true },
      { id: 'sourceLineNo', label: 'Source Line No', field: 'sourceLineNo', type: 'number', align: 'end' },
      { id: 'originalAmountToPrepayment', label: 'Original Amount', field: 'originalAmountToPrepayment', type: 'currency', currencyCode: 'MYR', align: 'end' },
      { id: 'percentage', label: 'Percentage', field: 'percentage', type: 'number', align: 'end' },
      { id: 'amount', label: 'Amount', field: 'amount', type: 'currency', currencyCode: 'MYR', align: 'end' },
      { id: 'remainingAmount', label: 'Remaining Amount', field: 'remainingAmount', type: 'currency', currencyCode: 'MYR', align: 'end' }
    ],
    selectable: true,
    multiSelect: false,
    sortable: true,
    resizable: true,
    infiniteScroll: false
  }
};
