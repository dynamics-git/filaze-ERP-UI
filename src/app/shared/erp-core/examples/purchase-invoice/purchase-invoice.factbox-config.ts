import { ErpFactboxConfig } from '../../models/factbox-config.model';

export const purchaseInvoiceFactboxConfig: ErpFactboxConfig = {
  id: 'purchase-invoice-factbox',
  title: 'Purchase Invoice',
  subtitle: 'Document factbox',
  width: '324px',
  sections: [
    {
      id: 'document-summary',
      title: 'Document Summary',
      badges: [{ id: 'Status', field: 'Status', tone: 'success' }],
      fields: [
        { id: 'No', label: 'No', field: 'No' },
        { id: 'PostingDate', label: 'Posting Date', field: 'PostingDate' },
        { id: 'AmountIncludingVAT', label: 'Amount Including VAT', field: 'AmountIncludingVAT' }
      ]
    },
    {
      id: 'vendor',
      title: 'Vendor',
      fields: [
        { id: 'VendorName', label: 'Vendor Name', field: 'VendorName' },
        { id: 'VendorInvoiceNo', label: 'Vendor Invoice No', field: 'VendorInvoiceNo' },
        { id: 'CurrencyCode', label: 'Currency Code', field: 'CurrencyCode' }
      ]
    },
    {
      id: 'workflow',
      title: 'Workflow',
      badges: [{ id: 'ApprovalStatus', field: 'ApprovalStatus', tone: 'warning' }],
      fields: [
        { id: 'Status', label: 'Status', field: 'Status' },
        { id: 'AssignedUser', label: 'Assigned User', field: 'AssignedUser' },
        { id: 'ReleasedBy', label: 'Released By', field: 'ReleasedBy' }
      ]
    },
    {
      id: 'attachments',
      title: 'Attachments',
      fields: [
        { id: 'AttachmentCount', label: 'Files', field: 'AttachmentCount' },
        { id: 'LastAttachment', label: 'Latest File', field: 'LastAttachment' }
      ]
    },
    {
      id: 'audit',
      title: 'Audit',
      fields: [
        { id: 'SystemId', label: 'System ID', field: 'SystemId' },
        { id: 'CreatedAt', label: 'Created At', field: 'CreatedAt' },
        { id: 'ModifiedAt', label: 'Modified At', field: 'ModifiedAt' }
      ]
    }
  ]
};
