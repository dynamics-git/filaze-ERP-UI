import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { purchaseOrderHeaderSections, purchaseOrderListDataSource } from '../../pages/purchase-order/purchase-order.config';
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
    if (!this.isPurchaseOrderScope(request)) {
      return of({
        saved: true,
        modifiedAt: new Date().toISOString()
      });
    }

    const id = this.entryRecord.resolveRecordId(request.headerData, purchaseOrderListDataSource);
    if (!id) {
      return of({
        saved: false,
        errorMessage: 'Missing purchase order identifier.'
      });
    }

    const payload = this.entryPayload.buildHeaderUpdatePayload(request.headerData, purchaseOrderHeaderSections);

    return this.dataSource.update(purchaseOrderListDataSource, id, payload).pipe(
      map((response) => ({
        saved: true,
        modifiedAt: this.resolveModifiedAt(response) ?? new Date().toISOString()
      })),
      catchError((error: unknown) =>
        of({
          saved: false,
          errorMessage: this.resolveErrorMessage(error)
        })
      )
    );
  }

  private isPurchaseOrderScope(request: EntrySaveRequest): boolean {
    if (request.scope === 'purchase-order-entry') {
      return true;
    }

    const page = this.asRecord(request.meta)?.['page'];
    return String(page ?? '').trim().toLowerCase() === 'purchase-order';
  }

  private resolveModifiedAt(response: unknown): string | null {
    const record = this.asRecord(response);
    if (!record) {
      return null;
    }

    const modifiedAt = record['ModifiedAt'];
    if (modifiedAt === null || modifiedAt === undefined || modifiedAt === '') {
      return null;
    }

    return String(modifiedAt);
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
