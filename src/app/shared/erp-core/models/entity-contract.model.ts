export type ErpContractOperation = 'create' | 'update' | 'delete';

export interface ErpEntityContractProfile {
  key: string;
  endpointAliases: string[];
  createAllowList?: string[];
  updateAllowList?: string[];
  deleteKeyCandidates?: string[];
}
