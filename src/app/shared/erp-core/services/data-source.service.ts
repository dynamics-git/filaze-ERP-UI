import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ErpDataSourceConfig } from '../models/data-source-config.model';

export interface ErpRestService {
  get(endpoint: string): Observable<unknown>;
}

export const ERP_REST_SERVICE = new InjectionToken<ErpRestService>('RestService');

@Injectable({
  providedIn: 'root'
})
export class DataSourceService {
  constructor(@Optional() @Inject(ERP_REST_SERVICE) private readonly restService: ErpRestService | null) {}

  loadList(config: ErpDataSourceConfig): Observable<unknown> {
    const endpoint = this.getListEndpoint(config);

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

  create(config: ErpDataSourceConfig, payload: unknown): Observable<never> {
    void config;
    void payload;
    return this.writeNotConnected();
  }

  update(config: ErpDataSourceConfig, id: unknown, payload: unknown): Observable<never> {
    void config;
    void id;
    void payload;
    return this.writeNotConnected();
  }

  delete(config: ErpDataSourceConfig, id: unknown): Observable<never> {
    void config;
    void id;
    return this.writeNotConnected();
  }

  private getEndpoint(config: ErpDataSourceConfig): string {
    return config.endpoint?.trim() ?? '';
  }

  private getListEndpoint(config: ErpDataSourceConfig): string {
    const endpoint = this.getEndpoint(config);
    const queryParts: string[] = [];

    if (config.defaultFilter) {
      queryParts.push(`$filter=${encodeURIComponent(config.defaultFilter)}`);
    }

    if (config.defaultSort) {
      queryParts.push(`$orderby=${encodeURIComponent(config.defaultSort)}`);
    }

    if (config.pageSize) {
      queryParts.push(`$top=${config.pageSize}`);
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

    return `'${String(id).replace(/'/g, "''")}'`;
  }

  private missingEndpoint(): Observable<never> {
    return throwError(() => new Error('ERP data source endpoint is required'));
  }

  private restServiceUnavailable(): Observable<never> {
    return throwError(() => new Error('Existing RestService provider is not available to ERP data source service'));
  }

  private writeNotConnected(): Observable<never> {
    return throwError(() => new Error('ERP data source write operations are not connected yet'));
  }
}
