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
    deleteKeyCandidates: ['SystemId', 'systemId', 'Id', 'id', 'Number', 'No']
  }
];
