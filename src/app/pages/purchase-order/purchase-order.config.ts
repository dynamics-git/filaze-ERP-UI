import { ErpCommandConfig } from '../../shared/erp-core/models/command-config.model';
import { ErpDataSourceConfig } from '../../shared/erp-core/models/data-source-config.model';
import { ErpDataSurfaceConfig } from '../../shared/erp-core/models/data-surface-config.model';
import { ErpDocumentPageConfig } from '../../shared/erp-core/models/document-page-config.model';
import { ErpFactboxConfig } from '../../shared/erp-core/models/factbox-config.model';
import { ErpHeaderConfig } from '../../shared/erp-core/models/header-config.model';
import { ErpLineConfig } from '../../shared/erp-core/models/line-config.model';
import type { ErpListPageConfig } from '../../shared/erp-core/components/list-page/list-page';

const purchaseOrderHeaderDataSource: ErpDataSourceConfig = {
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

const purchaseOrderLineDataSource: ErpDataSourceConfig = {
  endpoint: '/purchaseOrderLines',
  keyField: 'Id',
  parentKeyField: 'DocumentNo',
  documentNoField: 'Number',
  pageSize: 50,
  supportsCreate: false,
  supportsUpdate: false,
  supportsDelete: false
};

export const purchaseOrderCommandsConfig: ErpCommandConfig[] = [
  {
    id: 'release',
    label: 'Release',
    icon: 'bi bi-check2',
    type: 'primary',
    group: 'process',
    actionKey: 'release'
  },
  {
    id: 'reopen',
    label: 'Re-Open',
    icon: 'bi bi-box-arrow-in-right',
    type: 'normal',
    group: 'process',
    actionKey: 'reopen'
  },
  {
    id: 'send-for-approval',
    label: 'Send Approval Request',
    icon: 'bi bi-send',
    type: 'normal',
    group: 'process',
    actionKey: 'sendForApproval'
  },
  {
    id: 'post',
    label: 'Post',
    icon: 'bi bi-cloud-upload',
    type: 'menu',
    group: 'post',
    actionKey: 'post'
  },
  {
    id: 'print-report',
    label: 'Print/Report',
    icon: 'bi bi-printer',
    type: 'menu',
    group: 'report',
    actionKey: 'printReport'
  }
];

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

export type PurchaseOrderHeaderConfig = ErpHeaderConfig & {
  id: string;
  dataSource: ErpDataSourceConfig;
};

export const purchaseOrderHeaderConfig: PurchaseOrderHeaderConfig = {
  id: 'purchase-order-header',
  layout: 'summary',
  readonly: true,
  collapsible: false,
  dataSource: purchaseOrderHeaderDataSource,
  sections: [
    {
      id: 'general',
      title: 'General',
      layout: 'summary',
      readonly: true,
      collapsible: false,
      fields: [
        { id: 'Number', label: 'No', field: 'Number', readonly: true },
        { id: 'BuyFromVendorName', label: 'Buy-from Vendor Name', field: 'BuyFromVendorName', readonly: true },
        { id: 'OrderDate', label: 'Order Date', field: 'OrderDate', readonly: true },
        { id: 'PostingDate', label: 'Posting Date', field: 'PostingDate', readonly: true },
        { id: 'Status', label: 'Status', field: 'Status', readonly: true },
        { id: 'CurrencyCode', label: 'Currency Code', field: 'CurrencyCode', readonly: true },
        { id: 'AmountIncludingVAT', label: 'Amount Including VAT', field: 'AmountIncludingVAT', readonly: true }
      ]
    }
  ]
};

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
    } as ErpDataSurfaceConfig['columns'][number] & { subtitleField: string },
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

export type PurchaseOrderLinesConfig = ErpLineConfig & ErpDataSurfaceConfig & {
  dataSource: ErpDataSourceConfig;
};

export const purchaseOrderLinesConfig: PurchaseOrderLinesConfig = {
  id: 'purchase-order-lines',
  mode: 'documentLines',
  idField: 'Id',
  lineKeyField: 'Id',
  parentKeyField: 'DocumentNo',
  selectable: true,
  multiSelect: true,
  editable: false,
  supportsSubLines: false,
  lineType: 'generic',
  dataSource: purchaseOrderLineDataSource,
  columns: [
    { id: 'Type', label: 'Type', field: 'Type', type: 'text', width: '130px' },
    { id: 'No', label: 'No', field: 'No', type: 'text', isPrimary: true, width: '120px' },
    { id: 'Description', label: 'Description', field: 'Description', type: 'text', width: '280px' },
    { id: 'Quantity', label: 'Quantity', field: 'Quantity', type: 'number', align: 'end', width: '110px' },
    {
      id: 'DirectUnitCost',
      label: 'Direct Unit Cost',
      field: 'DirectUnitCost',
      type: 'currency',
      currencyCode: 'MYR',
      align: 'end',
      width: '150px'
    },
    {
      id: 'LineAmount',
      label: 'Line Amount',
      field: 'LineAmount',
      type: 'currency',
      currencyCode: 'MYR',
      align: 'end',
      width: '140px'
    },
    { id: 'VATPercent', label: 'VAT %', field: 'VATPercent', type: 'number', align: 'end', width: '90px' },
    {
      id: 'DimensionSetID',
      label: 'Dimension Set ID',
      field: 'DimensionSetID',
      type: 'number',
      align: 'end',
      width: '150px'
    }
  ]
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

export const purchaseOrderConfig: ErpDocumentPageConfig & { id: string } = {
  id: 'purchase-order',
  title: 'Purchase Order',
  subtitle: 'Purchase',
  pageType: 'document',
  commands: purchaseOrderCommandsConfig,
  header: purchaseOrderHeaderConfig,
  lines: purchaseOrderLinesConfig,
  dataSource: purchaseOrderHeaderDataSource,
  factbox: purchaseOrderFactboxConfig
};

export const purchaseOrderListPageConfig: ErpListPageConfig = {
  id: 'purchase-order-list',
  title: 'Purchase Order',
  subtitle: 'Read-only list',
  pageType: 'list',
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
