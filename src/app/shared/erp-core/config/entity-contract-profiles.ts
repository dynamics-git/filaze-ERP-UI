import { EntityContractProfile } from '../models/entity-contract.model';

export const ENTITY_CONTRACT_PROFILES: EntityContractProfile[] = [
  {
    key: 'purchaseOrderHeaders',
    endpointAliases: ['purchaseOrderHeaders'],
    createAllowList: [
      'CreatedBy',
      'UserId',
      'Company',
      'CompanyId',
      'PortalResponsibilityCentre'
    ],
    updateAllowList: [
      'BuyFromVendorNumber',
      'PurchaserCode',
      'DocumentDate',
      'VendorOrderNumber',
      'VendorInvoiceNumber',
      'VendorShipmentNumber',
      'ShortcutDimension1Code',
      'ShortcutDimension2Code',
      'PaymentTermsCode',
      'ValidityDate',
      'DeliveryDate',
      'YourReference',
      'PaymentReference',
      'ResponsibilityCenter',
      'ApproverGroup',
      'Prepayment',
      'Remark',
      'PostingDate'
    ],
    deleteKeyCandidates: ['Id', 'id', 'SystemId', 'systemId', 'Number', 'No']
  },
  {
    key: 'purchaseOrderLines',
    endpointAliases: ['purchaseOrderLines'],
    outboundFieldMap: {
      Number: 'No',
      UnitOfMeasure: 'UnitOfMeasureCode'
    },
    createAllowList: [
      'DocumentNo',
      'LineNo',
      'Type',
      'No',
      'Description',
      'UnitOfMeasureCode',
      'LocationCode',
      'Quantity',
      'DirectUnitCost',
      'LineDiscountAmount',
      'QtyToReceive',
      'QtyToInvoice'
    ],
    updateAllowList: [
      'Type',
      'No',
      'Description',
      'UnitOfMeasureCode',
      'LocationCode',
      'Quantity',
      'DirectUnitCost',
      'LineDiscountAmount',
      'QtyToReceive',
      'QtyToInvoice'
    ],
    deleteKeyCandidates: ['Id', 'id', 'SystemId', 'systemId']
  },
  {
    key: 'purchaseInvoiceHeaders',
    endpointAliases: ['purchaseInvoiceHeaders'],
    createAllowList: [
      'BuyFromVendorNumber',
      'DocumentDate',
      'PostingDate',
      'VendorInvoiceNumber',
      'CurrencyCode',
      'Remark'
    ],
    updateAllowList: [
      'BuyFromVendorNumber',
      'DocumentDate',
      'PostingDate',
      'VendorInvoiceNumber',
      'CurrencyCode',
      'Remark'
    ],
    deleteKeyCandidates: ['Id', 'id', 'SystemId', 'systemId']
  },
  {
    key: 'purchaseInvoiceLines',
    endpointAliases: ['purchaseInvoiceLines'],
    createAllowList: [
      'DocumentNo',
      'LineNo',
      'Type',
      'No',
      'Description',
      'UnitOfMeasureCode',
      'LocationCode',
      'Quantity',
      'DirectUnitCost',
      'LineAmount'
    ],
    updateAllowList: [
      'Type',
      'No',
      'Description',
      'UnitOfMeasureCode',
      'LocationCode',
      'Quantity',
      'DirectUnitCost',
      'LineAmount'
    ],
    deleteKeyCandidates: ['Id', 'id', 'SystemId', 'systemId']
  },
  {
    key: 'portalInvPrePayments',
    endpointAliases: ['portalInvPrePayments'],
    createAllowList: [
      'documentNo',
      'sourceLineNo',
      'purchaseLineId',
      'percentage',
      'amount'
    ],
    updateAllowList: [
      'percentage',
      'amount'
    ],
    deleteKeyCandidates: ['systemId', 'SystemId', 'id', 'Id']
  }
];
