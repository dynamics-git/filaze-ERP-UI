import {
  DataSourceConfig,
  DataSurfaceConfig,
  ListPageConfig,
} from '../../shared/erp-core/public-api';

const dataSurface: DataSurfaceConfig = {
  id: 'customer-ledger-entry-grid',
  idField: 'systemId',
  columns: [
    {
      id: 'entryNo',
      label: 'Entry No.',
      field: 'entryNo',
      isPrimary: true,
    },
    {
      id: 'customerNo',
      label: 'Customer No.',
      field: 'customerNo',
    },
    {
      id: 'postingDate',
      label: 'Posting Date',
      field: 'postingDate',
      type: 'date',
    },
    {
      id: 'documentType',
      label: 'Document Type',
      field: 'documentType',
    },
    {
      id: 'documentNo',
      label: 'Document No.',
      field: 'documentNo',
    },
    {
      id: 'amount',
      label: 'Amount',
      field: 'amount',
      type: 'currency',
      align: 'end',
    },
    {
      id: 'remainingAmount',
      label: 'Remaining Amount',
      field: 'remainingAmount',
      type: 'currency',
      align: 'end',
    },
    {
      id: 'open',
      label: 'Open',
      field: 'open',
      type: 'boolean',
      align: 'center',
    },
  ],
};

export const customerLedgerEntryListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  id: 'customer-ledger-entry',
  pageCode: 'CUSTOMER_LEDGER_ENTRY',
  pageType: 'list',
  defaultOpenTarget: 'list',
  title: 'Customer Ledger Entries',
  subtitle: 'Sales Ledger Entries',
  module: 'Sales',
  company: 'TECSA',
  viewSuffix: 'Customer List',
  views: [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open', filter: 'open eq true' },
    { id: 'blocked', label: 'Blocked', filter: 'open eq false' },
  ],
  activeViewId: 'all',
  tools: {
    refresh: true,
    filter: true,
    advancedFilter: true,
    export: false,
    columns: true,
  },
  behavior: {
    keyFallbackFields: ['systemId', 'entryNo'],
    statusField: 'open',
    statusDefault: 'Open',
  },
  searchFields: ['entryNo', 'customerNo', 'documentNo', 'documentType'],
  searchPlaceholder: 'Search entry no, customer no, document no or document type',
  dataSource: {
    endpoint: '/customerLedgerEntry',
    keyField: 'systemId',
    documentNoField: 'entryNo',
    supportsCreate: false,
    supportsUpdate: false,
    supportsDelete: false,
    pageSize: 30,
  },
  factPanel: {
    id: 'customer-ledger-fact-panel',
    label: 'Entry',
    title: 'Customer Ledger Entry',
    subtitle: 'Selection insights',
    enabled: true,
    defaultSectionId: 'entry',
    binding: {
      labelField: 'entryNo',
      titleField: 'documentNo',
      subtitleField: 'documentType',
      summaryField: 'remainingAmount',
      summaryType: 'currency',
    },
    sections: [
      {
        id: 'entry',
        title: 'Entry',
        fields: [
          { id: 'entryNo', label: 'Entry No.', field: 'entryNo' },
          { id: 'customerNo', label: 'Customer No.', field: 'customerNo' },
          { id: 'postingDate', label: 'Posting Date', field: 'postingDate' },
          { id: 'documentNo', label: 'Document No.', field: 'documentNo' },
        ],
      },
      {
        id: 'amounts',
        title: 'Amounts',
        fields: [
          { id: 'amount', label: 'Amount', field: 'amount' },
          { id: 'remainingAmount', label: 'Remaining Amount', field: 'remainingAmount' },
        ],
      },
    ],
  },
  dataSurface,
};
