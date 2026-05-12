import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ErpDataSourceConfig } from '../models/data-source-config.model';
import { EntityContractService } from './entity-contract.service';

export interface ErpRestService {
  get(endpoint: string): Observable<unknown>;
  post(endpoint: string, payload: unknown): Observable<unknown>;
  patch(endpoint: string, payload: unknown, ifMatch?: string): Observable<unknown>;
  delete(endpoint: string): Observable<unknown>;
}

export const ERP_REST_SERVICE = new InjectionToken<ErpRestService>('RestService');

export interface ErpDataSourceLoadOptions {
  skip?: number;
  top?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataSourceService {
  constructor(
    @Optional() @Inject(ERP_REST_SERVICE) private readonly restService: ErpRestService | null,
    private readonly contractService: EntityContractService
  ) {}

  loadList(config: ErpDataSourceConfig, options?: ErpDataSourceLoadOptions): Observable<unknown> {
    const endpoint = this.getListEndpoint(config, options);

    if (!endpoint) {
      return this.missingEndpoint();
    }

    if (!this.restService) {
      return this.restServiceUnavailable();
    }

    return this.restService.get(endpoint);
  }

  loadById(config: ErpDataSourceConfig, id: unknown): Observable<unknown> {
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

    return this.restService.get(`${endpoint}(${this.formatId(id)})`);
  }

  create(config: ErpDataSourceConfig, payload: unknown): Observable<unknown> {
    const endpoint = this.getEndpoint(config);
    if (!endpoint) {
      return this.missingEndpoint();
    }

    if (!this.restService) {
      return this.restServiceUnavailable();
    }

    const sanitizedPayload = this.contractService.sanitizePayload(config, 'create', payload);
    return this.restService.post(endpoint, sanitizedPayload);
  }

  update(config: ErpDataSourceConfig, id: unknown, payload: unknown): Observable<unknown> {
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
    return this.restService.patch(`${endpoint}(${this.formatId(id)})`, sanitizedPayload, '*');
  }

  delete(config: ErpDataSourceConfig, id: unknown): Observable<unknown> {
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

    return this.restService.delete(`${endpoint}(${this.formatId(id)})`);
  }

  private getEndpoint(config: ErpDataSourceConfig): string {
    return config.endpoint?.trim() ?? '';
  }

  private getListEndpoint(config: ErpDataSourceConfig, options?: ErpDataSourceLoadOptions): string {
    const endpoint = this.getEndpoint(config);
    const queryParts: string[] = [];

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
