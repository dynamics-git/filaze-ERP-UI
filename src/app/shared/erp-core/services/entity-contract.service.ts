import { Injectable } from '@angular/core';
import { ERP_ENTITY_CONTRACT_PROFILES } from '../config/entity-contract-profiles';
import { ErpDataSourceConfig } from '../models/data-source-config.model';
import { ErpContractOperation, ErpEntityContractProfile } from '../models/entity-contract.model';

@Injectable({
  providedIn: 'root'
})
export class EntityContractService {
  private readonly profilesByKey = new Map<string, ErpEntityContractProfile>();
  private readonly profilesByEndpoint = new Map<string, ErpEntityContractProfile>();

  constructor() {
    for (const profile of ERP_ENTITY_CONTRACT_PROFILES) {
      const key = this.normalizeToken(profile.key);
      if (key) {
        this.profilesByKey.set(key, profile);
      }

      for (const alias of profile.endpointAliases) {
        const endpoint = this.normalizeToken(alias);
        if (endpoint) {
          this.profilesByEndpoint.set(endpoint, profile);
        }
      }
    }
  }

  sanitizePayload(
    config: ErpDataSourceConfig,
    operation: Exclude<ErpContractOperation, 'delete'>,
    payload: unknown
  ): unknown {
    if (!this.isRecord(payload)) {
      return payload;
    }

    const profile = this.resolveProfile(config);
    const allowList = operation === 'create' ? profile?.createAllowList : profile?.updateAllowList;
    if (!Array.isArray(allowList) || !allowList.length) {
      return payload;
    }

    const allowed = new Set(allowList.map((field) => this.normalizeToken(field)).filter((field) => field.length > 0));
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (!allowed.has(this.normalizeToken(key))) {
        continue;
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  getDeleteKeyCandidates(config?: ErpDataSourceConfig): string[] {
    const profile = config ? this.resolveProfile(config) : undefined;
    if (!profile?.deleteKeyCandidates?.length) {
      return [];
    }

    return [...profile.deleteKeyCandidates];
  }

  private resolveProfile(config: ErpDataSourceConfig): ErpEntityContractProfile | undefined {
    const key = this.normalizeToken(config.contractProfileKey);
    if (key && this.profilesByKey.has(key)) {
      return this.profilesByKey.get(key);
    }

    const endpoint = this.normalizeToken(this.extractEndpointName(config.endpoint));
    if (!endpoint) {
      return undefined;
    }

    return this.profilesByEndpoint.get(endpoint);
  }

  private extractEndpointName(endpoint: string): string {
    const trimmed = endpoint.trim();
    if (!trimmed.length) {
      return '';
    }

    const [withoutQuery] = trimmed.split('?');
    const withoutSlashes = withoutQuery.replace(/^\/+|\/+$/g, '');
    return withoutSlashes;
  }

  private normalizeToken(value: unknown): string {
    return String(value ?? '').trim().toLowerCase();
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
