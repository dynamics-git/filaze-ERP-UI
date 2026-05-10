import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ErpDataSourceConfig } from '../models/data-source-config.model';

@Injectable({
  providedIn: 'root'
})
export class DataSourceService {
  loadList(config: ErpDataSourceConfig): Observable<never> {
    return this.notConnected();
  }

  loadById(config: ErpDataSourceConfig, id: unknown): Observable<never> {
    return this.notConnected();
  }

  create(config: ErpDataSourceConfig, payload: unknown): Observable<never> {
    return this.notConnected();
  }

  update(config: ErpDataSourceConfig, id: unknown, payload: unknown): Observable<never> {
    return this.notConnected();
  }

  delete(config: ErpDataSourceConfig, id: unknown): Observable<never> {
    return this.notConnected();
  }

  private notConnected(): Observable<never> {
    return throwError(() => new Error('ERP data source service is not connected yet'));
  }
}
