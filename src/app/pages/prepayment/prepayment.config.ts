import { CommandConfig } from '../../shared/erp-core/models/command-config.model';
import { DataSourceConfig } from '../../shared/erp-core/models/data-source-config.model';
import { DataSurfaceConfig } from '../../shared/erp-core/models/data-surface-config.model';
import {
  EntryCommandButtonConfig,
  EntryHeaderSectionConfig,
  EntryLineTotalsConfig
} from '../../shared/erp-core/models/entry-dialog-config.model';
import { LineColumnConfig } from '../../shared/erp-core/models/line-config.model';
import type { ListPageConfig } from '../../shared/erp-core/models/page-config.model';

export const prepaymentDialogTitle = 'Prepayment';

export const prepaymentHeaderCommandBar = {
  maxPrimaryActions: 2,
  maxVisibleGroups: 1
};

export const prepaymentLineCommandBar = {
  maxPrimaryActions: 0,
  maxVisibleGroups: 0
};

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
  }
];

export const prepaymentHeaderSections: EntryHeaderSectionConfig[] = [
  {
    id: 'information',
    title: 'Information',
    fields: [
      {
        key: 'originalAmountToPrepayment',
        label: 'Original Amount To Prepayment',
        type: 'number',
        valueType: 'number',
        readonly: true,
        defaultValue: 0
      },
      {
        key: 'percentage',
        label: 'Percentage',
        type: 'number',
        valueType: 'number',
        defaultValue: 0
      },
      {
        key: 'amount',
        label: 'Amount',
        type: 'number',
        valueType: 'number',
        defaultValue: 0
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
    align: 'end'
  },
  {
    id: 'percentage',
    label: 'Percentage',
    field: 'percentage',
    valueType: 'number',
    cellType: 'text',
    align: 'end'
  },
  {
    id: 'amount',
    label: 'Amount',
    field: 'amount',
    valueType: 'number',
    cellType: 'text',
    align: 'end'
  },
  {
    id: 'remainingAmount',
    label: 'Remaining Amount',
    field: 'remainingAmount',
    valueType: 'number',
    cellType: 'text',
    align: 'end'
  }
];

export const prepaymentLineTotalsDefault: EntryLineTotalsConfig = {
  subtotal: '0.00',
  sst: '0.00',
  total: '0.00',
  difference: '0.00'
};

export const prepaymentListDataSource: DataSourceConfig = {
  endpoint: '/portalInvPrePayments',
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
  dataSurface: prepaymentListConfig
};

export const runModalMode = 'page';
export const runModalSize = 'full';
