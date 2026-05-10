import { Injectable } from '@angular/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { ErpDataSourceConfig } from '../models/data-source-config.model';
import { ErpDocumentPageConfig } from '../models/document-page-config.model';
import { DataSourceService } from './data-source.service';

export interface ErpDocumentData {
  header: unknown;
  lines: unknown[];
}

@Injectable({
  providedIn: 'root'
})
export class DocumentDataService {
  constructor(private readonly dataSource: DataSourceService) {}

  loadDocument(config: ErpDocumentPageConfig, id?: unknown): Observable<ErpDocumentData> {
    const headerSource = config.dataSource;

    if (!headerSource) {
      return of({ header: undefined, lines: [] });
    }

    const header$ = id === undefined || id === null || id === ''
      ? this.dataSource.loadList(headerSource).pipe(map((response) => this.firstRecord(response)))
      : this.dataSource.loadById(headerSource, id);

    return header$.pipe(
      switchMap((header) => this.loadLines(config).pipe(
        map((lines) => ({ header, lines }))
      ))
    );
  }

  private loadLines(config: ErpDocumentPageConfig): Observable<unknown[]> {
    const lineSource = this.getLineDataSource(config);

    if (!lineSource) {
      return of([]);
    }

    return this.dataSource.loadList(lineSource).pipe(
      map((response) => this.toRecords(response))
    );
  }

  private getLineDataSource(config: ErpDocumentPageConfig): ErpDataSourceConfig | undefined {
    const lines = config.lines as { dataSource?: ErpDataSourceConfig } | undefined;

    return lines?.dataSource;
  }

  private firstRecord(response: unknown): unknown {
    return this.toRecords(response)[0];
  }

  private toRecords(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (this.isRecord(response) && Array.isArray(response['value'])) {
      return response['value'];
    }

    return [];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
