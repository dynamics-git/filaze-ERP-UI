import { Injectable } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { DataSourceConfig } from '../models/data-source-config.model';
import { EntryDialogConfig } from '../models/entry-dialog-config.model';

export interface DocumentRuntimeEntryOpenHydrationContext {
  openRequestId: number;
  listDataSource: DataSourceConfig;
  hydrationTimeoutMs: number;
  perfScopePrefix?: string;

  getCurrentOpenRequestId(): number;
  getActiveEntryDialogConfig(): EntryDialogConfig | undefined;
  buildHeaderData(row: Record<string, unknown>): Record<string, unknown>;
  buildLineTotals(
    lineRows: Record<string, unknown>[],
    headerData: Record<string, unknown>,
  ): EntryDialogConfig['lineTotals'];
  canHydrateLines(headerData: Record<string, unknown>): boolean;
  setEntryLineLoading(active: boolean, message?: string): void;
  loadLineRows(headerData: Record<string, unknown>): Observable<unknown>;
  toRecords(response: unknown): Record<string, unknown>[];
  buildLineRows(
    headerData: Record<string, unknown>,
    records: Record<string, unknown>[],
  ): Record<string, unknown>[];
  applyLineOptions(rows: Record<string, unknown>[]): void;
  resolvePersistedRecordId(row: Record<string, unknown>, config: DataSourceConfig): unknown;
  hasValue(value: unknown): boolean;
  detectChanges(): void;
  markPerfStart?(scope: string): void;
  markPerfEnd?(scope: string): void;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentRuntimeEntryOpenService {
  private toPerfScope(ctx: DocumentRuntimeEntryOpenHydrationContext, phase: string): string {
    const prefix = (ctx.perfScopePrefix ?? '').trim();
    if (!prefix.length) {
      return '';
    }

    return `${prefix}:${phase}:${ctx.openRequestId}`;
  }

  hydrateOpenedDocumentInBackground(
    row: Record<string, unknown>,
    ctx: DocumentRuntimeEntryOpenHydrationContext,
  ): Subscription | undefined {
    const currentConfig = ctx.getActiveEntryDialogConfig();
    if (!currentConfig) {
      return undefined;
    }

    const headerData = ctx.buildHeaderData(row);
    currentConfig.headerData = headerData;
    currentConfig.lineTotals = ctx.buildLineTotals(currentConfig.lineRows ?? [], headerData);
    ctx.detectChanges();

    return this.hydrateOpenedDocumentLinesInBackground(headerData, ctx);
  }

  hydrateOpenedDocumentLinesInBackground(
    headerData: Record<string, unknown>,
    ctx: DocumentRuntimeEntryOpenHydrationContext,
  ): Subscription | undefined {
    const lineScope = this.toPerfScope(ctx, 'lines');
    if (lineScope.length) {
      ctx.markPerfStart?.(lineScope);
    }

    if (!ctx.canHydrateLines(headerData)) {
      ctx.setEntryLineLoading(false);
      if (lineScope.length) {
        ctx.markPerfEnd?.(lineScope);
      }
      return undefined;
    }

    ctx.setEntryLineLoading(true, 'Loading lines...');

    return ctx
      .loadLineRows(headerData)
      .pipe(
        timeout(ctx.hydrationTimeoutMs),
        catchError(() => of([])),
      )
      .subscribe((response) => {
        if (ctx.openRequestId !== ctx.getCurrentOpenRequestId()) {
          ctx.setEntryLineLoading(false);
          if (lineScope.length) {
            ctx.markPerfEnd?.(lineScope);
          }
          return;
        }

        const currentConfig = ctx.getActiveEntryDialogConfig();
        if (!currentConfig?.headerData) {
          ctx.setEntryLineLoading(false);
          if (lineScope.length) {
            ctx.markPerfEnd?.(lineScope);
          }
          return;
        }

        const expectedId = ctx.resolvePersistedRecordId(headerData, ctx.listDataSource);
        const activeId = ctx.resolvePersistedRecordId(currentConfig.headerData, ctx.listDataSource);
        if (
          ctx.hasValue(expectedId)
          && ctx.hasValue(activeId)
          && String(expectedId) !== String(activeId)
        ) {
          ctx.setEntryLineLoading(false);
          if (lineScope.length) {
            ctx.markPerfEnd?.(lineScope);
          }
          return;
        }

        const records = ctx.toRecords(response);
        currentConfig.lineRows = ctx.buildLineRows(currentConfig.headerData, records);
        currentConfig.lineTotals = ctx.buildLineTotals(currentConfig.lineRows, currentConfig.headerData);
        ctx.applyLineOptions(currentConfig.lineRows);
        ctx.setEntryLineLoading(false);
        ctx.detectChanges();
        if (lineScope.length) {
          ctx.markPerfEnd?.(lineScope);
        }
      });
  }
}