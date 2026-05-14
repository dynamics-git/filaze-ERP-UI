import {
  CommandConfig,
  DataSourceConfig,
  DataSurfaceConfig,
  EntryAttachmentsConfig,
  EntryCommandButtonConfig,
  EntryDialogConfig,
  EntryHeaderSectionConfig,
  EntryLineTotalsConfig,
  LineColumnConfig,
  ListFactPanelConfig,
  ListPageFactboxConfig,
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
    runModalMode: 'page',
    runModalSize: 'full',
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

export const prepaymentAttachmentsDefault: EntryAttachmentsConfig = {
  headerFilesCount: 0,
  lineFilesCount: 0,
  canUpload: true,
  primaryActionLabel: 'Add header file',
  primaryActionKey: 'dialog:attachments'
};

export const prepaymentListDataSource: DataSourceConfig = {
  endpoint: '/portalInvPrePayments',
  contractProfileKey: 'portalInvPrePayments',
  keyField: 'systemId',
  defaultSort: 'documentNo',
  pageSize: 20,
  supportsCreate: true,
  supportsUpdate: true,
  supportsDelete: true
};

export const prepaymentListCommandsConfig: CommandConfig[] = [];

export const prepaymentListConfig: DataSurfaceConfig = {
  id: 'prepayment-list',
  mode: 'table',
  idField: 'systemId',
  columns: [
    {
      id: 'documentNo',
      label: 'Document No',
      field: 'documentNo',
      type: 'text',
      isPrimary: true
    },
    {
      id: 'sourceLineNo',
      label: 'Source Line No',
      field: 'sourceLineNo',
      type: 'number',
      align: 'end'
    },
    {
      id: 'originalAmountToPrepayment',
      label: 'Original Amount',
      field: 'originalAmountToPrepayment',
      type: 'currency',
      currencyCode: 'MYR',
      align: 'end'
    },
    {
      id: 'percentage',
      label: 'Percentage',
      field: 'percentage',
      type: 'number',
      align: 'end'
    },
    {
      id: 'amount',
      label: 'Amount',
      field: 'amount',
      type: 'currency',
      currencyCode: 'MYR',
      align: 'end'
    },
    {
      id: 'remainingAmount',
      label: 'Remaining Amount',
      field: 'remainingAmount',
      type: 'currency',
      currencyCode: 'MYR',
      align: 'end'
    }
  ],
  selectable: true,
  multiSelect: false,
  sortable: true,
  resizable: true,
  infiniteScroll: false
};

export const prepaymentListFactPanelConfig: ListFactPanelConfig = {
  id: 'prepayment-popup-factbox',
  title: 'Prepayment',
  subtitle: 'Document factbox',
  binding: {
    titleField: 'documentNo',
    titleFallbackFields: ['documentNo', 'systemId'],
    subtitleFallbackFields: ['sourceLineNo', 'documentType'],
    summaryField: 'amount',
    summaryFallbackFields: ['amount', 'originalAmountToPrepayment'],
    summaryType: 'number'
  },
  width: '324px',
  sections: [
  {
    id: 'document-summary',
    title: 'Document Summary',
    fields: [
      { id: 'documentNo', label: 'Document No', field: 'documentNo' },
      { id: 'sourceLineNo', label: 'Source Line No', field: 'sourceLineNo' },
      { id: 'documentType', label: 'Document Type', field: 'documentType' }
    ]
  },
  {
    id: 'amounts',
    title: 'Amounts',
    fields: [
      { id: 'originalAmountToPrepayment', label: 'Original Amount', field: 'originalAmountToPrepayment' },
      { id: 'percentage', label: 'Percentage', field: 'percentage' },
      { id: 'amount', label: 'Amount', field: 'amount' },
      { id: 'remainingAmount', label: 'Remaining Amount', field: 'remainingAmount' }
    ]
  },
  {
    id: 'posting',
    title: 'Posting Groups',
    fields: [
      { id: 'genBusPostingGroup', label: 'Gen. Bus. Posting Group', field: 'genBusPostingGroup' },
      { id: 'genProdPostingGroup', label: 'Gen. Prod. Posting Group', field: 'genProdPostingGroup' }
    ]
  },
  {
    id: 'audit',
    title: 'Audit',
    fields: [
      { id: 'systemId', label: 'System ID', field: 'systemId' },
      { id: 'purchaseLineId', label: 'Purchase Line ID', field: 'purchaseLineId' }
    ]
  }
]
};

export const prepaymentFactboxConfig: ListPageFactboxConfig = prepaymentListFactPanelConfig;

export const prepaymentListPageConfig: ListPageConfig = {
  title: 'Prepayment',
  module: 'Purchase',
  company: 'Cronus International Ltd.',
  viewSuffix: 'prepayments',
  views: [
    { id: 'all', label: 'All' }
  ],
  activeViewId: 'all',
  tools: {
    advancedFilter: true
  },
  filterConfig: {
    enabled: true,
    storageKey: 'prepayment-list'
  },
  standardActions: {
    new: true,
    delete: true,
    refresh: true
  },
  commands: prepaymentListCommandsConfig,
  dataSurface: prepaymentListConfig,
  factPanel: prepaymentListFactPanelConfig,
  factbox: prepaymentFactboxConfig
};

type RunModalContext = Record<string, unknown>;

export function buildRunModalEntryDialogConfig(context: RunModalContext): EntryDialogConfig {
  const activeLine = toRecord(context['activeLine']) ?? {};
  const sourceHeader = toRecord(context['headerData']) ?? {};

  const purchaseLineId = pickValue(activeLine, ['Id', 'id', 'lineId', 'LineId', 'purchaseLineId', 'PurchaseLineId']);
  const sourceLineNo = pickNumber(activeLine, ['LineNo', 'lineNo', 'sourceLineNo', 'SourceLineNo']);
  const originalAmount = pickNumber(activeLine, [
    'originalAmountToPrepayment',
    'OriginalAmountToPrepayment',
    'amountIncludingVAT',
    'AmountIncludingVAT',
    'LineAmount',
    'lineAmount',
    'amount',
    'Amount'
  ]) ?? 0;

  const headerData: Record<string, unknown> = {
    systemId: '',
    purchaseLineId: purchaseLineId ?? '',
    documentNo: pickValue(sourceHeader, ['Number', 'number', 'documentNo', 'DocumentNo']) ?? '',
    sourceLineNo: sourceLineNo ?? '',
    genBusPostingGroup: pickValue(activeLine, ['GenBusPostingGroup', 'genBusPostingGroup']) ?? '',
    genProdPostingGroup: pickValue(activeLine, ['GenProdPostingGroup', 'genProdPostingGroup']) ?? '',
    originalAmountToPrepayment: originalAmount,
    percentage: 0,
    amount: 0
  };

  return {
    pageLabel: prepaymentDialogTitle.toUpperCase(),
    title: prepaymentDialogTitle,
    subtitle: headerData['documentNo']
      ? `${String(headerData['documentNo'])} - Line ${String(headerData['sourceLineNo'] ?? '-')}`
      : undefined,
    headerCommandBar: prepaymentHeaderCommandBar,
    lineCommandBar: prepaymentLineCommandBar,
    lineCommandPolicy: {
      injectDefaultLineNew: false,
      injectDefaultLineDelete: false
    },
    headerToolbarButtons: prepaymentHeaderToolbarButtons,
    lineToolbarButtons: prepaymentLineToolbarButtons,
    headerSections: prepaymentHeaderSections,
    headerData,
    lineColumns: prepaymentLineColumns,
    lineRows: [],
    lineTotals: prepaymentLineTotalsDefault,
    attachments: prepaymentAttachmentsDefault
  };
}

export function runModalOnHeaderChanged(args: {
  headerData: Record<string, unknown>;
  fieldKey: string;
  payload: unknown;
}): void {
  const { headerData, fieldKey } = args;
  const normalizedField = fieldKey.trim().toLowerCase();
  if (normalizedField !== 'percentage' && normalizedField !== 'amount') {
    return;
  }

  const baseAmount = toNumber(headerData['originalAmountToPrepayment']) ?? 0;
  if (normalizedField === 'percentage') {
    const percentage = toNumber(headerData['percentage']) ?? 0;
    headerData['amount'] = round2((baseAmount * percentage) / 100);
    return;
  }

  const amount = toNumber(headerData['amount']) ?? 0;
  headerData['percentage'] = baseAmount > 0 ? round2((amount / baseAmount) * 100) : 0;
}

export function runModalBuildHeaderPayload(args: {
  payload: Record<string, unknown>;
  headerData: Record<string, unknown>;
  headerSections: EntryHeaderSectionConfig[];
  entryDialogConfig: EntryDialogConfig;
  context: RunModalContext;
}): Record<string, unknown> {
  const { headerData, context } = args;
  const activeLine = toRecord(context['activeLine']) ?? {};

  const genBusPostingGroup = pickValue(headerData, ['genBusPostingGroup', 'GenBusPostingGroup'])
    ?? pickValue(activeLine, ['genBusPostingGroup', 'GenBusPostingGroup']);
  const genProdPostingGroup = pickValue(headerData, ['genProdPostingGroup', 'GenProdPostingGroup'])
    ?? pickValue(activeLine, ['genProdPostingGroup', 'GenProdPostingGroup']);

  const amount = toNumber(headerData['amount']) ?? 0;

  const nextPayload: Record<string, unknown> = {
    percentage: toNumber(headerData['percentage']) ?? 0,
    amount
  };

  if (genBusPostingGroup !== undefined) {
    nextPayload['genBusPostingGroup'] = genBusPostingGroup;
  }

  if (genProdPostingGroup !== undefined) {
    nextPayload['genProdPostingGroup'] = genProdPostingGroup;
  }

  return nextPayload;
}

export function runModalValidateBeforeSave(args: {
  scope: 'header' | 'line';
  headerData: Record<string, unknown>;
  row?: Record<string, unknown>;
  payload: Record<string, unknown>;
  entryDialogConfig: EntryDialogConfig;
  context: RunModalContext;
}): string | void {
  if (args.scope !== 'header') {
    return;
  }

  const originalAmount = toNumber(args.headerData['originalAmountToPrepayment']) ?? 0;
  const amount = toNumber(args.headerData['amount']) ?? 0;
  if (amount > originalAmount) {
    return 'Amount cannot exceed original amount!';
  }
}

export const runModalMode = 'page';
export const runModalSize = 'full';
export const runModalRelation = {
  parentEndpoint: '/purchaseInvoiceLines',
  childCollection: 'portalInvPrePayments',
  parentIdFields: ['Id', 'id', 'lineId', 'LineId'],
  top: 200
};

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

function pickValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (!(key in source)) {
      continue;
    }

    const value = source[key];
    if (value !== null && value !== undefined && String(value).trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
  const value = pickValue(source, keys);
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
