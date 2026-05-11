import { ErpCommandConfig } from '../../shared/erp-core/models/command-config.model';
import { ErpDataSourceConfig } from '../../shared/erp-core/models/data-source-config.model';
import { ErpDataSurfaceConfig } from '../../shared/erp-core/models/data-surface-config.model';
import { ErpFactboxConfig } from '../../shared/erp-core/models/factbox-config.model';
import type { ErpListPageConfig } from '../../shared/erp-core/components/list-page/list-page';

export const purchaseOrderListDataSource: ErpDataSourceConfig = {
  endpoint: '/purchaseOrderHeaders',
  keyField: 'Id',
  documentNoField: 'Number',
  defaultSort: 'Number',
  defaultFilter: "VariationOrder ne true and ManualPOCancel eq false",
  pageSize: 20,
  supportsCreate: false,
  supportsUpdate: false,
  supportsDelete: false
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
    },

 {
      id: 'BaseLine',
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
    filter: true,
    export: true,
    columns: true
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
