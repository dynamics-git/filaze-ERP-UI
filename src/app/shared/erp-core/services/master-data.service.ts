import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DataSourceService } from './data-source.service';

export type MasterEndpointMap = Record<string, string[]>;

@Injectable({
  providedIn: 'root',
})
export class MasterDataService {
  private readonly endpointCache = new Map<string, Record<string, unknown>[]>();
  private readonly failedEndpoints = new Set<string>();

  constructor(private readonly dataSource: DataSourceService) {}

  loadFirstAvailableList(endpoints: string[]): Observable<Record<string, unknown>[]> {
    const normalized = endpoints
      .map((endpoint) => endpoint.trim())
      .filter((endpoint) => endpoint.length > 0);

    const [first, ...rest] = normalized;
    if (!first) {
      return of([] as Record<string, unknown>[]);
    }

    if (this.endpointCache.has(first)) {
      return of(this.endpointCache.get(first) ?? []);
    }

    if (this.failedEndpoints.has(first)) {
      return rest.length ? this.loadFirstAvailableList(rest) : of([] as Record<string, unknown>[]);
    }

    return this.dataSource.loadList({ endpoint: first }).pipe(
      map((response) => {
        const records = this.toRecordList(response);
        this.endpointCache.set(first, records);
        return records;
      }),
      catchError(() => {
        this.failedEndpoints.add(first);
        return rest.length
          ? this.loadFirstAvailableList(rest)
          : of([] as Record<string, unknown>[]);
      }),
    );
  }

  loadMasterLists<T extends MasterEndpointMap>(
    mapConfig: T,
  ): Observable<{ [K in keyof T]: Record<string, unknown>[] }> {
    const sources = {} as { [K in keyof T]: Observable<Record<string, unknown>[]> };

    for (const [key, endpoints] of Object.entries(mapConfig) as Array<[keyof T, string[]]>) {
      sources[key] = this.loadFirstAvailableList(endpoints);
    }

    if (!Object.keys(sources).length) {
      return of({} as { [K in keyof T]: Record<string, unknown>[] });
    }

    return forkJoin(sources) as Observable<{ [K in keyof T]: Record<string, unknown>[] }>;
  }

  toSelectOptions(
    source: unknown,
    valueFields: string[] = [],
    labelFields: string[] = [],
  ): Array<{ label: string; value: string }> {
    const valueKeys = valueFields.map((field) => field.trim()).filter((field) => field.length > 0);
    const labelKeys = labelFields.map((field) => field.trim()).filter((field) => field.length > 0);
    if (!valueKeys.length) {
      return [];
    }

    const records = this.toRecordList(source);
    return records
      .map((record) => {
        const value = this.readFirstText(record, valueKeys);
        const name = this.readFirstText(record, labelKeys);
        const label = name ? `${value} - ${name}` : value;
        return { label, value, record };
      })
      .filter((option) => option.value.length > 0);
  }

  toRecordList(source: unknown): Record<string, unknown>[] {
    if (Array.isArray(source)) {
      return source.filter((record): record is Record<string, unknown> => this.isRecord(record));
    }

    if (this.isRecord(source) && Array.isArray(source['value'])) {
      return source['value'].filter((record): record is Record<string, unknown> =>
        this.isRecord(record),
      );
    }

    return [];
  }

  private readFirstText(record: Record<string, unknown>, fields: string[]): string {
    for (const field of fields) {
      const value = this.toText(record[field]);
      if (value.length > 0) {
        return value;
      }
    }

    return '';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }
}
