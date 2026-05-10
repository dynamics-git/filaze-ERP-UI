export const purchaseInvoiceMockHeader = {
  SystemId: '8f7fd2f2-0f8d-4a11-b93c-f7bcb32a1001',
  No: 'PI-10027',
  VendorName: 'Northwind Traders',
  VendorInvoiceNo: 'NW-55620',
  PostingDate: '2026-05-09',
  DueDate: '2026-06-08',
  Status: 'Open',
  CurrencyCode: 'MYR',
  AmountIncludingVAT: 18420,
  ApprovalStatus: 'Pending Review',
  AssignedUser: 'AD',
  ReleasedBy: '-',
  AttachmentCount: 2,
  LastAttachment: 'vendor-invoice-nw-55620.pdf',
  CreatedAt: '2026-05-09T09:00:00Z',
  ModifiedAt: '2026-05-09T09:18:00Z'
};

export const purchaseInvoiceMockLines = [
  {
    SystemId: '0c3b9c88-e8b5-4b95-a2a8-fdf151d31001',
    DocumentNo: 'PI-10027',
    LineNo: 10000,
    Type: 'Item',
    No: 'CHAIR-001',
    Description: 'Office chairs',
    Quantity: 12,
    DirectUnitCost: 420,
    LineAmount: 5040,
    VATPercent: 8,
    DimensionSetID: 1101
  },
  {
    SystemId: '7906e60d-efdf-4ec8-9177-e0a33e7c1002',
    DocumentNo: 'PI-10027',
    LineNo: 20000,
    Type: 'G/L Account',
    No: '6120',
    Description: 'Installation services',
    Quantity: 1,
    DirectUnitCost: 2800,
    LineAmount: 2800,
    VATPercent: 8,
    DimensionSetID: 2104
  },
  {
    SystemId: '3799f698-2f4f-49ad-b5f8-f8058c2c1003',
    DocumentNo: 'PI-10027',
    LineNo: 30000,
    Type: 'Item',
    No: 'ARM-220',
    Description: 'Monitor arms',
    Quantity: 34,
    DirectUnitCost: 310,
    LineAmount: 10540,
    VATPercent: 8,
    DimensionSetID: 1101
  }
];
