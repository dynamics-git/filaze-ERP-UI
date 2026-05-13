import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DataSourceConfig } from '../../shared/erp-core/models/data-source-config.model';
import { FormSectionConfig } from '../../shared/erp-core/models/field-config.model';
import { DataSourceService } from '../../shared/erp-core/services/data-source.service';
import { EntryPayloadService } from '../../shared/erp-core/services/entry-payload.service';
import { EntryRecordService } from '../../shared/erp-core/services/entry-record.service';
import { EntrySavePort, EntrySaveRequest, EntrySaveResult } from '../../shared/erp-core/services/entry-save.port';

@Injectable({
  providedIn: 'root'
})
export class EntrySaveService implements EntrySavePort {
  constructor(
    private readonly dataSource: DataSourceService,
    private readonly entryPayload: EntryPayloadService,
    private readonly entryRecord: EntryRecordService
  ) {}

  save(request: EntrySaveRequest): Observable<EntrySaveResult> {
    const dataSource = this.resolveDataSourceConfig(request);
    const headerSections = this.resolveHeaderSections(request);
    const modifiedAtKey = this.resolveModifiedAtKey(request);

    if (!dataSource || !headerSections.length) {
      return of({
        saved: false,
        errorMessage: 'Entry save configuration is missing (dataSourceConfig/headerSections).'
      });
    }

    const id = this.entryRecord.resolveRecordId(request.headerData, dataSource);
    if (!id) {
      return of({
        saved: false,
        errorMessage: 'Missing document identifier.'
      });
    }

    const payload = this.entryPayload.buildHeaderUpdatePayload(request.headerData, headerSections);

    return this.dataSource.update(dataSource, id, payload).pipe(
      map((response) => ({
        saved: true,
        modifiedAt: this.resolveModifiedAt(response, modifiedAtKey) ?? new Date().toISOString()
      })),
      catchError((error: unknown) =>
        of({
          saved: false,
          errorMessage: this.resolveErrorMessage(error)
        })
      )
    );
  }

  private resolveModifiedAt(response: unknown, modifiedAtKey: string): string | null {
    const record = this.asRecord(response);
    if (!record) {
      return null;
    }

    const modifiedAt = record[modifiedAtKey];
    if (modifiedAt === null || modifiedAt === undefined || modifiedAt === '') {
      return null;
    }

    return String(modifiedAt);
  }

  private resolveDataSourceConfig(request: EntrySaveRequest): DataSourceConfig | null {
    return request.dataSourceConfig ?? null;
  }

  private resolveHeaderSections(request: EntrySaveRequest): FormSectionConfig[] {
    return request.headerSections?.length ? request.headerSections : [];
  }

  private resolveModifiedAtKey(request: EntrySaveRequest): string {
    return request.modifiedAtKey?.trim() ?? '';
  }

  private resolveErrorMessage(error: unknown): string {
    const nestedMessage = this.extractNestedErrorMessage(error);
    if (nestedMessage) {
      return nestedMessage;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    const message = this.asRecord(error)?.['message'];
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return 'Unable to save changes.';
  }

  private extractNestedErrorMessage(error: unknown): string {
    const outer = this.asRecord(error);
    if (!outer) {
      return '';
    }

    const body = this.asRecord(outer['error']);
    const bodyMessage = body?.['message'];
    if (typeof bodyMessage === 'string' && bodyMessage.trim()) {
      return bodyMessage.trim();
    }

    const nested = this.asRecord(body?.['error']);
    const nestedMessage = nested?.['message'];
    if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
      return nestedMessage.trim();
    }

    const fromTopLevel = outer['message'];
    if (typeof fromTopLevel === 'string' && fromTopLevel.trim()) {
      return fromTopLevel.trim();
    }

    return '';
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return value as Record<string, unknown>;
  }
}
