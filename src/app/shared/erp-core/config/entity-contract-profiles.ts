import { EntityContractProfile } from '../models/entity-contract.model';

export const ENTITY_CONTRACT_PROFILES: EntityContractProfile[] = [
  {
    key: 'companyUsers',
    endpointAliases: ['users'],
    omitFields: [
      'createdby',
      'userid',
      'company',
      'companyid',
      'passwordhash',
      'id',
      'systemid',
    ],
    deleteKeyCandidates: ['systemId', 'id']
  },
  {
    key: 'purchaseOrderHeaders',
    endpointAliases: ['purchaseOrderHeaders'],
    createAllowList: [],
    updateAllowList: [],
    deleteKeyCandidates: ['systemId', 'SystemId', 'id', 'Id', 'number', 'Number', 'no', 'No']
  }
];
