import { VendorDocumentTemplate } from './document-import.models';

export const VENDOR_DOCUMENT_TEMPLATES: VendorDocumentTemplate[] = [
  {
    templateCode: 'TECSA-INVOICE-V1',
    vendorNamePattern: 'Tecsa Software Services',
    documentType: 'PurchaseRequisition',
    headerRules: [
      {
        fieldCode: 'DocumentNo',
        labelPatterns: ['Invoice'],
        valueRegex: '\\b(TS[A-Z0-9-]{5,})\\b',
      },
      {
        fieldCode: 'DocumentDate',
        labelPatterns: ['Document Date'],
        valueRegex:
          'Document\\s+Date\\s+([A-Za-z]+\\s+\\d{1,2},\\s+\\d{4}|\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{2,4})',
        required: true,
      },
      {
        fieldCode: 'RequiredDate',
        labelPatterns: ['Due Date'],
        valueRegex:
          'Due\\s+Date\\s+([A-Za-z]+\\s+\\d{1,2},\\s+\\d{4}|\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{2,4})',
      },
      {
        fieldCode: 'SupplierName',
        labelPatterns: ['Tecsa Software Services'],
        valueRegex: '(Tecsa\\s+Software\\s+Services\\s+Sdn\\s+Bhd)',
      },
      {
        fieldCode: 'CurrencyCode',
        labelPatterns: ['Total RM', 'RM'],
        valueRegex: '\\b(RM|MYR)\\b',
        required: true,
      },
      {
        fieldCode: 'TotalAmount',
        labelPatterns: ['Total RM'],
        valueRegex: 'Total\\s+RM\\s+([0-9,]+(?:\\.\\d{2})?)',
      },
    ],
    lineTableRules: {
      startPatterns: ['No.\\s+Description', 'Quantity\\s+Unit', 'Line\\s+Amount'],
      endPatterns: ['Subtotal', 'Total\\s+RM', 'Bank', 'VAT\\s+Registration'],
      columnHints: {
        itemNo: ['No.', 'Item', 'Code'],
        description: ['Description'],
        quantity: ['Quantity', 'Qty'],
        uom: ['Unit', 'UOM'],
        unitCost: ['Unit Price', 'Unit Cost'],
        lineAmount: ['Line Amount', 'Amount'],
      },
    },
  },
];
