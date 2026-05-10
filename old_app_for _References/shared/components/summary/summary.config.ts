export interface SummaryFieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'amount' | 'boolean' | 'status';
}

export const DEFAULT_SUMMARY_FIELDS: SummaryFieldConfig[] = [
  { key: 'claimNo', label: 'Claim No.' },
  { key: 'employeeName', label: 'Employee' },
  { key: 'claimDate', label: 'Claim Date', type: 'date' },
  { key: 'approvalStatus', label: 'Approval Status', type: 'status' },
  { key: 'batchStatus', label: 'Batch Status' },
  { key: 'totalClaimAmount', label: 'Total Amount', type: 'amount' },
  { key: 'representorId', label: 'Representor ID', }
];


export const PurchaseInvoiceSummary: SummaryFieldConfig[] = [
  { key: 'Number', label: 'Invoice No' },
  { key: 'BuyFromVendorNumber', label: 'Vendor' },
  { key: 'PostingDate', label: 'Posting Date', type: 'date' },
  { key: 'Status', label: 'Status', type: 'status' },
  { key: 'amountIncludingVAT', label: 'Total Amount', type: 'amount' }
];

export const EMPLOYEE_CLAIM_LINE_SUMMARY: SummaryFieldConfig[] = [
  { label: 'Expense Type', key: 'expenseType' },
  { label: 'Receipt Date', key: 'receiptDate', type: 'date' },
  { label: 'Approval Status', key: 'approvalStatus', type: 'status' },
  { label: 'Amount', key: 'amount', type: 'amount' },

  { label: 'Limit Value', key: 'limitValue', type: 'amount' },
  { label: 'Rate', key: 'rate', type: 'amount' },
  { label: 'Motorcycle Rate', key: 'motorcycleRate', type: 'amount' },
  { label: 'Car Rate', key: 'carRate', type: 'amount' }
];

export const PURCHASE_INVOICE_LINE_SUMMARY: SummaryFieldConfig[] = [
  // 🔹 Line Identity
  { label: 'Line No', key: 'LineNo' },
  { label: 'Type', key: 'Type' },
  { label: 'Account / Item No', key: 'No' },
  { label: 'Description', key: 'Description' },
  // 🔹 Quantity & Cost
  // { label: 'Quantity', key: 'Quantity' },
  { label: 'Unit Cost', key: 'DirectUnitCost', type: 'amount' },
  { label: 'Line Amount', key: 'LineAmount', type: 'amount' },


  // // 🔹 Invoice Progress
  // { label: 'Qty To Invoice', key: 'QtyToInvoice' },
  // { label: 'Quantity Invoiced', key: 'QuantityInvoiced' },
  // { label: 'Amount Invoiced', key: 'amountInvoiced', type: 'amount' },
  // { label: 'Amount To Invoice', key: 'amountToInvoice', type: 'amount' },
  // 🔹 VAT
  // { label: 'VAT Base Amount', key: 'vatBaseAmount', type: 'amount' },
  { label: 'VAT Amount', key: 'vat', type: 'amount' },
  { label: 'Amount Incl. VAT', key: 'amountIncludingVAT', type: 'amount' },
  // 🔹 Prepayment Information
  { label: 'Prepayment Created', key: 'hasPrepayment', type: 'boolean' },
  { label: 'Allocation Created', key: 'hasAllocation', type: 'boolean' },
  // { label: 'Prepayment Line Amount', key: 'PrepmtLineAmount', type: 'amount' },
  // { label: 'Prepayment Amount Invoiced', key: 'PrepmtAmtInv', type: 'amount' },
  // { label: 'Prepayment To Deduct', key: 'PrepmtAmtToDeduct', type: 'amount' },
  // { label: 'Prepayment Deducted', key: 'PrepmtAmtDeducted', type: 'amount' },
]

