import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { DataSourceConfig } from '../models/data-source-config.model';
import { EntryDialogConfig } from '../models/entry-dialog-config.model';

export interface DocumentRuntimeListLifecycleContext {
  listDataSource: DataSourceConfig;
  listLoadingScope: string;
  listFilterScope: string;
  listTitle: unknown;
  hydrationTimeoutMs: number;

  rows: unknown[];
  hasMore: boolean;
  error?: string;
  selectedRow?: unknown;
  pendingFirstPageReload: boolean;
  filterReloadTimer?: ReturnType<typeof setTimeout>;
  listLoadSubscription?: { unsubscribe(): void };
  activeEntryDialogConfig?: EntryDialogConfig;
  checkedRowKeys: Set<string>;
  readonly loading: boolean;

  buildFilter(scope: string): string;
  hydrateTargetsFromRecords(scope: string, records: unknown[]): void;
  loadList(dataSource: DataSourceConfig, options: {
    skip: number;
    top: number;
    forceRefresh: boolean;
    useCache?: boolean;
  }): Observable<unknown>;
  toRecords(response: unknown): unknown[];
  getErrorMessage(error: unknown): string;
  detectChanges(): void;

  isScopeLoading(scope: string): boolean;
  setScopeMessage(scope: string, message: string): void;
  beginScopeLoading(scope: string, message: string): void;
  endScopeLoading(scope: string): void;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentRuntimeListLifecycleService {
  loadNextPage(ctx: DocumentRuntimeListLifecycleContext): void {
    if (ctx.loading || !ctx.hasMore) {
      return;
    }

    this.loadPage(ctx, false);
  }

  clearListError(ctx: DocumentRuntimeListLifecycleContext): void {
    ctx.error = undefined;
    ctx.detectChanges();
  }

  loadFirstPage(ctx: DocumentRuntimeListLifecycleContext, forceRefresh = false): void {
    this.clearFilterReloadTimer(ctx);
    if (ctx.loading) {
      ctx.pendingFirstPageReload = true;
      return;
    }

    ctx.pendingFirstPageReload = false;
    this.loadPage(ctx, true, forceRefresh);
  }

  loadPage(
    ctx: DocumentRuntimeListLifecycleContext,
    reset: boolean,
    forceRefresh = false,
  ): void {
    if (ctx.loading) {
      return;
    }

    const pageSize = ctx.listDataSource.pageSize ?? 20;
    const effectiveFilter = ctx.buildFilter(ctx.listFilterScope);
    const effectiveListDataSource = {
      ...ctx.listDataSource,
      defaultFilter: effectiveFilter,
    };
    const loadOptions = {
      skip: reset ? 0 : ctx.rows.length,
      top: pageSize,
      forceRefresh,
      useCache: !forceRefresh,
    };

    const preserveRowsDuringReset = reset && ctx.rows.length > 0;

    if (reset) {
      if (!preserveRowsDuringReset) {
        ctx.rows = [];
        ctx.selectedRow = undefined;
      }
      ctx.activeEntryDialogConfig = undefined;
      ctx.checkedRowKeys.clear();
      ctx.hasMore = true;
      ctx.listLoadSubscription?.unsubscribe();
    }

    // Preserve side-effect order for list loading lifecycle.
    this.startListLoading(ctx);
    ctx.error = undefined;
    ctx.detectChanges();

    ctx.listLoadSubscription = ctx
      .loadList(effectiveListDataSource, loadOptions)
      .pipe(timeout(ctx.hydrationTimeoutMs))
      .subscribe({
        next: (response) => {
          const records = ctx.toRecords(response);
          ctx.hydrateTargetsFromRecords(ctx.listFilterScope, records);
          ctx.rows = reset ? records : [...ctx.rows, ...records];
          ctx.hasMore = records.length === pageSize;

          this.stopListLoading(ctx);
          ctx.detectChanges();
          this.runPendingFirstPageReload(ctx);
        },
        error: (error: unknown) => {
          if (reset && !preserveRowsDuringReset) {
            ctx.rows = [];
          }

          ctx.hasMore = false;
          ctx.error = ctx.getErrorMessage(error);
          this.stopListLoading(ctx);
          ctx.detectChanges();
          this.runPendingFirstPageReload(ctx);
        },
      });
  }

  runPendingFirstPageReload(ctx: DocumentRuntimeListLifecycleContext): void {
    if (!ctx.pendingFirstPageReload || ctx.loading) {
      return;
    }

    ctx.pendingFirstPageReload = false;
    this.loadPage(ctx, true);
  }

  scheduleFilterReload(ctx: DocumentRuntimeListLifecycleContext): void {
    this.clearFilterReloadTimer(ctx);
    ctx.filterReloadTimer = setTimeout(() => {
      ctx.filterReloadTimer = undefined;
      this.loadFirstPage(ctx, true);
    }, 250);
  }

  clearFilterReloadTimer(ctx: DocumentRuntimeListLifecycleContext): void {
    if (!ctx.filterReloadTimer) {
      return;
    }

    clearTimeout(ctx.filterReloadTimer);
    ctx.filterReloadTimer = undefined;
  }

  startListLoading(ctx: DocumentRuntimeListLifecycleContext): void {
    const message = `Loading ${String(ctx.listTitle ?? '').trim().toLowerCase() || 'list'}...`;
    if (ctx.isScopeLoading(ctx.listLoadingScope)) {
      ctx.setScopeMessage(ctx.listLoadingScope, message);
      return;
    }

    ctx.beginScopeLoading(ctx.listLoadingScope, message);
  }

  stopListLoading(ctx: DocumentRuntimeListLifecycleContext): void {
    if (!ctx.isScopeLoading(ctx.listLoadingScope)) {
      return;
    }

    while (ctx.isScopeLoading(ctx.listLoadingScope)) {
      ctx.endScopeLoading(ctx.listLoadingScope);
    }
    ctx.detectChanges();
  }
}
