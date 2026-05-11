import { ErpEntryHeaderSectionConfig, ErpEntryLineTotalsConfig } from '../../shared/erp-core/models/entry-dialog-config.model';
import { ErpLineColumnConfig } from '../../shared/erp-core/models/line-config.model';

export const DEFAULT_ENTRY_HEADER_SECTIONS: ErpEntryHeaderSectionConfig[] = [
  {
    id: 'header',
    title: 'Header',
    actionLabel: 'Details',
    actionDialog: 'header',
    fields: [
      { key: 'journalNo', label: 'Journal no.', type: 'text' },
      { key: 'postingDate', label: 'Posting date', type: 'text' },
      {
        key: 'documentType',
        label: 'Document type',
        type: 'select',
        options: [{ label: 'General journal', value: 'General journal' }]
      },
      {
        key: 'currency',
        label: 'Currency',
        type: 'select',
        options: [{ label: 'MYR', value: 'MYR' }]
      },
      { key: 'description', label: 'Description', type: 'text', width: 'wide' },
      { key: 'responsibilityCenter', label: 'Responsibility center', type: 'text' }
    ]
  },
  {
    id: 'address',
    title: 'Address',
    metaText: 'Optional',
    fields: [
      { key: 'payToBillToName', label: 'Pay-to / bill-to name', type: 'text', width: 'wide' },
      {
        key: 'countryRegion',
        label: 'Country/region',
        type: 'select',
        options: [{ label: 'Malaysia', value: 'Malaysia' }]
      },
      { key: 'address', label: 'Address', type: 'text', width: 'wide' },
      { key: 'city', label: 'City', type: 'text' }
    ]
  },
  {
    id: 'payment-details',
    title: 'Payment details',
    metaText: 'Bank transfer',
    fields: [
      {
        key: 'paymentMethod',
        label: 'Payment method',
        type: 'select',
        options: [{ label: 'Bank transfer', value: 'Bank transfer' }]
      },
      { key: 'dueDate', label: 'Due date', type: 'text' },
      { key: 'bankAccount', label: 'Bank account', type: 'text' }
    ]
  },
  {
    id: 'e-invoice',
    title: 'E-Invoice',
    metaText: 'Not submitted',
    fields: [
      {
        key: 'invoiceClassification',
        label: 'Classification',
        type: 'select',
        options: [{ label: 'General expenses', value: 'General expenses' }]
      },
      { key: 'taxRegistrationNo', label: 'Tax registration no.', type: 'text' },
      {
        key: 'consolidatedInvoice',
        label: 'Consolidated invoice',
        type: 'select',
        options: [{ label: 'No', value: 'No' }]
      }
    ]
  }
];

export const DEFAULT_ENTRY_HEADER_DATA: Record<string, unknown> = {
  journalNo: 'GJ-000147',
  postingDate: '08 May 2026',
  documentType: 'General journal',
  currency: 'MYR',
  description: 'Monthly operating adjustment',
  responsibilityCenter: 'FINANCE',
  payToBillToName: 'Cronus International Ltd.',
  countryRegion: 'Malaysia',
  address: 'Level 18, Finance Tower',
  city: 'Kuala Lumpur',
  paymentMethod: 'Bank transfer',
  dueDate: '31 May 2026',
  bankAccount: '1110',
  invoiceClassification: 'General expenses',
  taxRegistrationNo: 'MY-1029384756',
  consolidatedInvoice: 'No'
};

export const DEFAULT_ENTRY_LINE_COLUMNS: ErpLineColumnConfig[] = [
  { id: 'No', label: 'No.', field: 'No', cellType: 'text' },
  {
    id: 'Type',
    label: 'Type',
    field: 'Type',
    cellType: 'select',
    options: [{ label: 'G/L', value: 'G/L' }, { label: 'Bank', value: 'Bank' }, { label: 'Vendor', value: 'Vendor' }]
  },
  { id: 'Account', label: 'Account', field: 'Account', cellType: 'text' },
  { id: 'Description', label: 'Description', field: 'Description', cellType: 'text' },
  { id: 'Debit', label: 'Debit', field: 'Debit', cellType: 'text', align: 'end' },
  { id: 'Credit', label: 'Credit', field: 'Credit', cellType: 'text', align: 'end' },
  {
    id: 'TaxGroup',
    label: 'Tax group',
    field: 'TaxGroup',
    cellType: 'select',
    options: [{ label: 'SST-P6', value: 'SST-P6' }, { label: 'NONE', value: 'NONE' }, { label: '', value: '' }]
  },
  {
    id: 'SST',
    label: 'SST',
    field: 'SST',
    cellType: 'select',
    options: [{ label: '6%', value: '6%' }, { label: '0%', value: '0%' }, { label: '', value: '' }]
  },
  { id: 'TaxAmount', label: 'Tax amount', field: 'TaxAmount', cellType: 'text', align: 'end' },
  { id: 'AmountInclSST', label: 'Amount incl. SST', field: 'AmountInclSST', cellType: 'text', align: 'end' },
  {
    id: 'Dimension',
    label: 'Dimension',
    field: 'Dimension',
    cellType: 'select',
    options: [{ label: 'FIN-OPEX', value: 'FIN-OPEX' }, { label: 'FIN-001', value: 'FIN-001' }, { label: 'TAX-MY', value: 'TAX-MY' }, { label: 'FIN-AP', value: 'FIN-AP' }, { label: '', value: '' }]
  },
  {
    id: 'Department',
    label: 'Department',
    field: 'Department',
    cellType: 'select',
    options: [{ label: 'FIN', value: 'FIN' }, { label: 'TAX', value: 'TAX' }, { label: '', value: '' }]
  },
  { id: 'Project', label: 'Project', field: 'Project', cellType: 'text' },
  { id: 'DueDate', label: 'Due date', field: 'DueDate', cellType: 'text' },
  {
    id: 'LineStatus',
    label: 'Line status',
    field: 'LineStatus',
    cellType: 'select',
    options: [{ label: 'Open', value: 'Open' }, { label: '', value: '' }]
  },
  {
    id: 'Attachment',
    label: '',
    cellType: 'icon',
    buttonIcon: 'bi bi-paperclip',
    buttonTitle: 'Line attachment',
    actionKey: 'attachments'
  }
];

export const DEFAULT_ENTRY_LINE_ROWS: Record<string, unknown>[] = [
  {
    No: '10000', Type: 'G/L', Account: '4100', Description: 'Operating expense control', Debit: '12,450.00', Credit: '',
    TaxGroup: 'SST-P6', SST: '6%', TaxAmount: '747.00', AmountInclSST: '13,197.00', Dimension: 'FIN-OPEX', Department: 'FIN', Project: '-', DueDate: '31 May', LineStatus: 'Open'
  },
  {
    No: '20000', Type: 'Bank', Account: '1110', Description: 'Main bank account', Debit: '', Credit: '12,450.00',
    TaxGroup: 'NONE', SST: '0%', TaxAmount: '', AmountInclSST: '12,450.00', Dimension: 'FIN-001', Department: 'FIN', Project: '-', DueDate: '31 May', LineStatus: 'Open'
  },
  {
    No: '30000', Type: 'G/L', Account: '4150', Description: 'SST input control', Debit: '747.00', Credit: '',
    TaxGroup: 'SST-P6', SST: '6%', TaxAmount: '44.82', AmountInclSST: '791.82', Dimension: 'TAX-MY', Department: 'TAX', Project: '-', DueDate: '31 May', LineStatus: 'Open'
  },
  {
    No: '40000', Type: 'Vendor', Account: '2110', Description: 'Trade payables', Debit: '', Credit: '747.00',
    TaxGroup: 'NONE', SST: '0%', TaxAmount: '', AmountInclSST: '747.00', Dimension: 'FIN-AP', Department: 'FIN', Project: '-', DueDate: '31 May', LineStatus: 'Open'
  },
  {
    No: '50000', Type: '', Account: '', Description: '', Debit: '', Credit: '',
    TaxGroup: '', SST: '', TaxAmount: '', AmountInclSST: '', Dimension: '', Department: '', Project: '', DueDate: '', LineStatus: ''
  },
  ...Array.from({ length: 15 }, (_, index) => ({
    No: String(60000 + (index * 10000)), Type: '', Account: '', Description: '', Debit: '', Credit: '',
    TaxGroup: '', SST: '', TaxAmount: '', AmountInclSST: '', Dimension: '', Department: '', Project: '', DueDate: '', LineStatus: ''
  }))
];

export const DEFAULT_ENTRY_LINE_TOTALS: ErpEntryLineTotalsConfig = {
  subtotal: 'RM 12,450.00',
  sst: 'RM 747.00',
  total: 'RM 13,197.00',
  difference: 'RM 0.00'
};