import { EntityContractProfile } from '../models/entity-contract.model';

export const ENTITY_CONTRACT_PROFILES: EntityContractProfile[] = [
  {
    key: 'purchaseOrderHeaders',
    endpointAliases: ['purchaseOrderHeaders'],
    deleteKeyCandidates: ['Id', 'id', 'SystemId', 'systemId', 'Number', 'No']
  },
  {
    key: 'purchaseOrderLines',
    endpointAliases: ['purchaseOrderLines'],
    outboundFieldMap: {
      Number: 'No',
      UnitOfMeasure: 'UnitOfMeasureCode'
    },
    omitFields: [
      'OriginalCost',
      'Tax',
      'AmountToInvoice',
      'AmountInvoiced'
    ],
    deleteKeyCandidates: ['Id', 'id', 'SystemId', 'systemId']
  },
  {
    key: 'purchaseInvoiceHeaders',
    endpointAliases: ['purchaseInvoiceHeaders'],
    deleteKeyCandidates: ['Id', 'id', 'SystemId', 'systemId']
  },
  {
    key: 'purchaseInvoiceLines',
    endpointAliases: ['purchaseInvoiceLines'],
    omitFields: [
      'vat',
      'amountIncludingVAT'
    ],
    deleteKeyCandidates: ['Id', 'id', 'SystemId', 'systemId']
  },
  {
    key: 'portalInvPrePayments',
    endpointAliases: ['portalInvPrePayments'],
    deleteKeyCandidates: ['systemId', 'SystemId', 'id', 'Id']
  }
];
