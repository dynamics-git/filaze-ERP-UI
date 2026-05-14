export type ContractOperation = 'create' | 'update' | 'delete';

export interface EntityContractProfile {
  key: string;
  endpointAliases: string[];
  outboundFieldMap?: Record<string, string>;
  createAllowList?: string[];
  updateAllowList?: string[];
  deleteKeyCandidates?: string[];
}
