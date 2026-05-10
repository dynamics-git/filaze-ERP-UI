import { ErpDataSourceConfig } from '../../models/data-source-config.model';
import { ErpDataSurfaceConfig } from '../../models/data-surface-config.model';
import { ErpHeaderConfig } from '../../models/header-config.model';

export type PurchaseInvoiceHeaderConfig = ErpHeaderConfig & {
  id: string;
  columns: ErpDataSurfaceConfig['columns'];
  dataSource: ErpDataSourceConfig;
};

export const purchaseInvoiceHeaderConfig: PurchaseInvoiceHeaderConfig = {
  id: 'purchase-invoice-header',
  layout: 'summary',
  readonly: true,
  collapsible: false,
  dataSource: {
    endpoint: '/purchaseInvoiceHeaders',
    keyField: 'SystemId',
    documentNoField: 'No',
    defaultSort: 'No',
    pageSize: 20,
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true
  },
  fields: [
    { id: 'No', label: 'No', field: 'No', readonly: true },
    { id: 'VendorName', label: 'Vendor Name', field: 'VendorName', readonly: true },
    { id: 'VendorInvoiceNo', label: 'Vendor Invoice No', field: 'VendorInvoiceNo', readonly: true },
    { id: 'PostingDate', label: 'Posting Date', field: 'PostingDate', readonly: true },
    { id: 'DueDate', label: 'Due Date', field: 'DueDate', readonly: true },
    { id: 'Status', label: 'Status', field: 'Status', readonly: true },
    { id: 'CurrencyCode', label: 'Currency Code', field: 'CurrencyCode', readonly: true },
    { id: 'AmountIncludingVAT', label: 'Amount Including VAT', field: 'AmountIncludingVAT', readonly: true }
  ],
  sections: [
    {
      id: 'general',
      title: 'General',
      layout: 'summary',
      readonly: true,
      collapsible: false,
      fields: [
        { id: 'No', label: 'No', field: 'No', readonly: true },
        { id: 'VendorName', label: 'Vendor Name', field: 'VendorName', readonly: true },
        { id: 'VendorInvoiceNo', label: 'Vendor Invoice No', field: 'VendorInvoiceNo', readonly: true },
        { id: 'PostingDate', label: 'Posting Date', field: 'PostingDate', readonly: true },
        { id: 'DueDate', label: 'Due Date', field: 'DueDate', readonly: true },
        { id: 'Status', label: 'Status', field: 'Status', readonly: true },
        { id: 'CurrencyCode', label: 'Currency Code', field: 'CurrencyCode', readonly: true },
        { id: 'AmountIncludingVAT', label: 'Amount Including VAT', field: 'AmountIncludingVAT', readonly: true }
      ]
    }
  ],
  columns: [
    { id: 'No', label: 'No', type: 'text', isPrimary: true },
    { id: 'VendorName', label: 'Vendor Name', type: 'text' },
    { id: 'VendorInvoiceNo', label: 'Vendor Invoice No', type: 'text' },
    { id: 'PostingDate', label: 'Posting Date', type: 'date' },
    { id: 'DueDate', label: 'Due Date', type: 'date' },
    { id: 'Status', label: 'Status', type: 'badge' },
    { id: 'CurrencyCode', label: 'Currency Code', type: 'text' },
    {
      id: 'AmountIncludingVAT',
      label: 'Amount Including VAT',
      type: 'currency',
      currencyCode: 'MYR',
      align: 'end'
    }
  ]
};
