import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { DataSourceConfig } from '../models/data-source-config.model';
import { EntityContractService } from './entity-contract.service';

export interface DataRestService {
  get(endpoint: string, options?: { skipCompanyScope?: boolean }): Observable<unknown>;
  post(endpoint: string, payload: unknown, options?: { skipCompanyScope?: boolean }): Observable<unknown>;
  patch(endpoint: string, payload: unknown, ifMatch?: string, options?: { skipCompanyScope?: boolean }): Observable<unknown>;
  delete(endpoint: string, options?: { skipCompanyScope?: boolean }): Observable<unknown>;
}

export const DATA_REST_SERVICE = new InjectionToken<DataRestService>('RestService');

export interface DataSourceLoadOptions {
  skip?: number;
  top?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataSourceService {
  constructor(
    @Optional() @Inject(DATA_REST_SERVICE) private readonly restService: DataRestService | null,
    private readonly contractService: EntityContractService
  ) {}

  loadList(config: DataSourceConfig, options?: DataSourceLoadOptions): Observable<unknown> {
    const endpoint = this.getListEndpoint(config, options);

    if (!endpoint) {
      return this.missingEndpoint();
    }

    if (!this.restService) {
      return this.restServiceUnavailable();
    }

    return this.restService.get(endpoint, this.getRestOptions(config));
  }

  loadById(config: DataSourceConfig, id: unknown): Observable<unknown> {
    const endpoint = this.getEndpoint(config);

    if (!endpoint) {
      return this.missingEndpoint();
    }

    if (id === null || id === undefined || id === '') {
      return throwError(() => new Error('ERP data source id is required'));
    }

    if (!this.restService) {
      return this.restServiceUnavailable();
    }

    return this.restService.get(this.buildIdEndpoint(config, id), this.getRestOptions(config));
  }

  create(config: DataSourceConfig, payload: unknown): Observable<unknown> {
    const endpoint = this.getEndpoint(config);
    if (!endpoint) {
      return this.missingEndpoint();
    }

    if (!this.restService) {
      return this.restServiceUnavailable();
    }

    const sanitizedPayload = this.contractService.sanitizePayload(config, 'create', payload);
    return this.restService.post(endpoint, sanitizedPayload, this.getRestOptions(config));
  }

  update(config: DataSourceConfig, id: unknown, payload: unknown): Observable<unknown> {
    const endpoint = this.getEndpoint(config);
    if (!endpoint) {
      return this.missingEndpoint();
    }

    if (id === null || id === undefined || id === '') {
      return throwError(() => new Error('ERP data source id is required'));
    }

    if (!this.restService) {
      return this.restServiceUnavailable();
    }

    const sanitizedPayload = this.contractService.sanitizePayload(config, 'update', payload);
    return this.restService.patch(this.buildIdEndpoint(config, id), sanitizedPayload, '*', this.getRestOptions(config));
  }

  delete(config: DataSourceConfig, id: unknown): Observable<unknown> {
    const endpoint = this.getEndpoint(config);
    if (!endpoint) {
      return this.missingEndpoint();
    }

    if (id === null || id === undefined || id === '') {
      return throwError(() => new Error('ERP data source id is required'));
    }

    if (!this.restService) {
      return this.restServiceUnavailable();
    }

    return this.restService.delete(this.buildIdEndpoint(config, id), this.getRestOptions(config));
  }

  private getEndpoint(config: DataSourceConfig): string {
    return config.endpoint?.trim() ?? '';
  }

  private getListEndpoint(config: DataSourceConfig, options?: DataSourceLoadOptions): string {
    const endpoint = this.getEndpoint(config);
    const queryParts: string[] = [];

    if (config.queryStyle === 'laravel') {
      const pageSize = options?.top ?? config.pageSize;
      const skip = options?.skip ?? 0;
      if (pageSize) {
        queryParts.push(`per_page=${pageSize}`);
        queryParts.push(`page=${Math.floor(skip / pageSize) + 1}`);
      }
      if (config.defaultSort) {
        queryParts.push(`sort_by=${encodeURIComponent(config.defaultSort)}`);
      }
      if (config.defaultFilter) {
        queryParts.push(config.defaultFilter);
      }
      return queryParts.length
        ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryParts.join('&')}`
        : endpoint;
    }

    if (config.defaultFilter) {
      queryParts.push(`$filter=${encodeURIComponent(config.defaultFilter)}`);
    }

    if (config.defaultSort) {
      queryParts.push(`$orderby=${encodeURIComponent(config.defaultSort)}`);
    }

    const top = options?.top ?? config.pageSize;
    const skip = options?.skip;

    if (top) {
      queryParts.push(`$top=${top}`);
    }

    if (skip) {
      queryParts.push(`$skip=${skip}`);
    }

    if (!queryParts.length) {
      return endpoint;
    }

    return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryParts.join('&')}`;
  }

  private buildIdEndpoint(config: DataSourceConfig, id: unknown): string {
    const endpoint = this.getEndpoint(config);
    if (config.idStyle === 'slash') {
      return `${endpoint}/${encodeURIComponent(String(id))}`;
    }

    return `${endpoint}(${this.formatId(id)})`;
  }

  private getRestOptions(config: DataSourceConfig): { skipCompanyScope?: boolean } {
    return {
      skipCompanyScope: config.scope === 'global',
    };
  }

  private formatId(id: unknown): string {
    if (typeof id === 'number' || typeof id === 'boolean') {
      return String(id);
    }

    if (typeof id === 'string') {
      const normalized = id.trim();
      if (this.isGuid(normalized)) {
        return normalized;
      }

      return `'${normalized.replace(/'/g, "''")}'`;
    }

    return `'${String(id).replace(/'/g, "''")}'`;
  }

  private isGuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  private missingEndpoint(): Observable<never> {
    return throwError(() => new Error('ERP data source endpoint is required'));
  }

  private restServiceUnavailable(): Observable<never> {
    return throwError(() => new Error('Existing RestService provider is not available to ERP data source service'));
  }

}
