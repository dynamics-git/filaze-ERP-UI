import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DataSourceService } from './data-source.service';

export interface ErpDocumentNumberConfig {
  endpoint: string;
  orderByField?: string;
  numberFieldCandidates?: string[];
  fallbackPrefix?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentNumberService {
  private readonly reservedNumbers = new Set<string>();

  constructor(private readonly dataSource: DataSourceService) {}

  generateNextNumber(config: ErpDocumentNumberConfig): Observable<string> {
    const endpoint = this.buildLatestRecordEndpoint(config);

    return this.dataSource.loadList({ endpoint }).pipe(
      map((response) => {
        const first = this.toRecordList(response)[0];
        const currentNumber = this.readNumber(first, config.numberFieldCandidates ?? ['Number', 'No']);
        return this.reserveNextAvailable(this.incrementNumber(currentNumber, config.fallbackPrefix ?? 'DOC'), config.fallbackPrefix ?? 'DOC');
      }),
      catchError(() => of(this.reserveNextAvailable(this.incrementNumber('', config.fallbackPrefix ?? 'DOC'), config.fallbackPrefix ?? 'DOC')))
    );
  }

  release(number: string): void {
    const normalized = number.trim();
    if (!normalized.length) {
      return;
    }

    this.reservedNumbers.delete(normalized);
  }

  private buildLatestRecordEndpoint(config: ErpDocumentNumberConfig): string {
    const endpoint = config.endpoint.trim();
    const orderByField = (config.orderByField ?? 'Number').trim();
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}$orderby=${encodeURIComponent(orderByField)}%20desc&$top=1`;
  }

  private readNumber(record: Record<string, unknown> | undefined, fields: string[]): string {
    if (!record) {
      return '';
    }

    for (const field of fields) {
      const value = this.toText(record[field]);
      if (value.length) {
        return value;
      }
    }

    return '';
  }

  private incrementNumber(current: string, fallbackPrefix: string): string {
    const trimmed = current.trim();
    if (!trimmed.length) {
      return this.buildDraftNumber(fallbackPrefix);
    }

    const match = trimmed.match(/^(.*?)(\d+)$/);
    if (!match) {
      return this.buildDraftNumber(fallbackPrefix);
    }

    const prefix = match[1];
    const serial = match[2];
    const next = String(Number(serial) + 1).padStart(serial.length, '0');
    return `${prefix}${next}`;
  }

  private buildDraftNumber(prefix: string): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    return `${prefix}-${datePart}-${timePart}`;
  }

  private reserveNextAvailable(candidate: string, fallbackPrefix: string): string {
    let next = candidate.trim();
    if (!next.length) {
      next = this.buildDraftNumber(fallbackPrefix);
    }

    for (let i = 0; i < 50; i += 1) {
      if (!this.reservedNumbers.has(next)) {
        this.reservedNumbers.add(next);
        return next;
      }

      next = this.incrementNumber(next, fallbackPrefix);
    }

    const forced = this.buildDraftNumber(fallbackPrefix);
    this.reservedNumbers.add(forced);
    return forced;
  }

  private toRecordList(source: unknown): Record<string, unknown>[] {
    if (Array.isArray(source)) {
      return source.filter((record): record is Record<string, unknown> => this.isRecord(record));
    }

    if (this.isRecord(source) && Array.isArray(source['value'])) {
      return source['value'].filter((record): record is Record<string, unknown> => this.isRecord(record));
    }

    return [];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }
}
