import { ErpEntityContractProfile } from '../models/entity-contract.model';

export const ERP_ENTITY_CONTRACT_PROFILES: ErpEntityContractProfile[] = [
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
  }
];
