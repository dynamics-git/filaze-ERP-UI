import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ActionDispatcherService,
  ApiErrorService,
  DataSourceService,
  EntryDialogConfig,
  EntryLineTotalsConfig,
  EntryStatusMessage,
  EntryRecordService,
  EntryStateService,
  FieldValidationService,
  LineCalculationService,
  ListFilterPanelComponent,
  ListFilterStateService,
  ListPageComponent,
  PageCommandService,
  PopupHostComponent,
  PopupStackService
} from '../../shared/erp-core/public-api';
import {
  prepaymentAttachmentsDefault,
  prepaymentDialogTitle,
  prepaymentFooterSections,
  prepaymentHeaderCommandBar,
  prepaymentHeaderSections,
  prepaymentHeaderToolbarButtons,
  prepaymentLineColumns,
  prepaymentLineCommandBar,
  prepaymentLineToolbarButtons,
  prepaymentLineTotalsCalculation,
  prepaymentListCommandsConfig,
  prepaymentListDataSource,
  prepaymentListPageConfig
} from './prepayment.config';

@Component({
  selector: 'app-prepayment',
  standalone: true,
  imports: [ListPageComponent, ListFilterPanelComponent, PopupHostComponent],
  templateUrl: './prepayment.html'
})
export class PrepaymentPage implements OnInit, OnDestroy {
  private readonly actionDispatcher = inject(ActionDispatcherService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly dataSource = inject(DataSourceService);
  private readonly apiError = inject(ApiErrorService);
  private readonly entryRecord = inject(EntryRecordService);
  private readonly entryState = inject(EntryStateService);
  private readonly fieldValidation = inject(FieldValidationService);
  private readonly lineCalculation = inject(LineCalculationService);
  private readonly listFilterState = inject(ListFilterStateService);
  private readonly pageCommands = inject(PageCommandService);
  private readonly popupStack = inject(PopupStackService);
  private readonly subscriptions = new Subscription();
  private readonly headerFieldValueTypeMap = this.entryState.buildFieldValueTypeMap(prepaymentHeaderSections);
  private readonly headerFieldConfigMap = this.entryState.buildFieldConfigMap(prepaymentHeaderSections);
  private readonly defaultSaveFailedMessage = 'Unable to save prepayment changes.';

  readonly listPageConfig = prepaymentListPageConfig;
  readonly listFilterScope = this.listPageConfig.dataSurface?.id ?? this.listPageConfig.id ?? 'prepayment-list';
  readonly listFilterStorageKey = this.listPageConfig.filterConfig?.storageKey ?? this.listFilterScope;

  loading = false;
  popupLoading = false;
  popupLoadingMessage = 'Loading prepayment...';
  error?: string;
  hasMore = true;
  rows: unknown[] = [];
  selectedRow?: unknown;

  private listLoadSubscription?: Subscription;
  private activeEntryDialogConfig?: EntryDialogConfig;
  private pendingListSyncRecord?: Record<string, unknown>;

  constructor() {
    this.popupStack.closeAll();
  }

  ngOnInit(): void {
    this.actionDispatcher.setPageCommands(prepaymentListCommandsConfig);
    this.actionDispatcher.setPageContext({
      title: this.listPageConfig.title ?? 'Prepayment',
      module: this.listPageConfig.module ?? 'Purchase',
      company: this.listPageConfig.company ?? '',
      viewSuffix: this.listPageConfig.viewSuffix ?? 'prepayments',
      views: this.listPageConfig.views,
      activeViewId: this.listPageConfig.activeViewId,
      tools: this.listPageConfig.tools,
      dataSource: this.listPageConfig.dataSource
    });

    this.listFilterState.initializeFromConfig(
      this.listFilterScope,
      prepaymentListPageConfig,
      prepaymentListDataSource.defaultFilter
    );
    this.loadFirstPage();

    this.subscriptions.add(
      this.actionDispatcher.action$.subscribe((event) => this.handleCommand(event))
    );
  }

  ngOnDestroy(): void {
    this.actionDispatcher.clearPageCommands();
    this.actionDispatcher.clearPageContext();
    this.listLoadSubscription?.unsubscribe();
    this.entryState.clearAutosave('prepayment-entry');
    this.subscriptions.unsubscribe();
  }

  handlePopupAction(event: { popupId: string; actionKey: string; payload?: unknown }): void {
    this.entryState.handleEntryPopupAction(event, 'prepayment-entry', {
      headerChanged: (payload) => this.handlePrepaymentHeaderChanged(payload),
      autosave: () => undefined,
      commands: {
        save: () => this.applyPrepayment(),
        apply: () => this.applyPrepayment(),
        command: (command) => this.handleEntryCommand(command)
      }
    });
  }

  handlePopupClosed(event: { popupId: string; entryDialogConfig?: EntryDialogConfig }): void {
    if (event.popupId !== 'prepayment-entry') {
      return;
    }

    if (event.entryDialogConfig?.headerData && this.isRecord(event.entryDialogConfig.headerData) && !this.pendingListSyncRecord) {
      this.pendingListSyncRecord = this.buildListSyncRecord(event.entryDialogConfig.headerData);
    }

    this.applyDeferredListSync();
  }

  handleCommand(event: { actionKey: string; payload?: unknown }): void {
    if (this.listFilterState.applyCommand(this.listFilterScope, event.actionKey, event.payload)) {
      this.loadFirstPage();
      return;
    }

    this.pageCommands.handleListCommand(event, {
      refresh: () => this.loadFirstPage(),
      createNew: () => this.openNewPreview(),
      delete: () => this.deleteSelectedRow()
    });
  }

  openPrepayment(row: unknown, preserveLoader = false): void {
    if (!preserveLoader) {
      this.startPopupLoading('Loading prepayment...');
    } else {
      this.popupLoadingMessage = 'Loading prepayment...';
    }

    if (!this.isRecord(row)) {
      this.openPrepaymentPopup({}, []);
      this.stopPopupLoading();
      return;
    }

    this.subscriptions.add(
      this.loadPrepaymentLines(row).subscribe({
        next: (lines) => {
          this.openPrepaymentPopup(row, lines);
          this.stopPopupLoading();
        },
        error: () => {
          this.openPrepaymentPopup(row, []);
          this.stopPopupLoading();
        }
      })
    );
  }

  loadNextPage(): void {
    if (this.loading || !this.hasMore) {
      return;
    }

    this.loadPage(false);
  }

  private loadFirstPage(): void {
    this.loadPage(true);
  }

  private openPrepaymentPopup(row: Record<string, unknown>, lineRows: Record<string, unknown>[]): void {
    const entryDialogConfig = this.buildPrepaymentEntryDialogConfig(row, lineRows);
    this.activeEntryDialogConfig = entryDialogConfig;

    this.popupStack.open({
      id: 'prepayment-entry',
      title: this.getDocumentTitle(row),
      mode: 'page',
      size: 'full',
      allowNested: false,
      data: {
        entryDialogConfig
      }
    });
  }

  private openNewPreview(): void {
    this.startPopupLoading('Preparing prepayment...');
    this.openPrepayment(this.buildNewHeaderSeed(), true);
  }

  private loadPrepaymentLines(row: Record<string, unknown>): Observable<Record<string, unknown>[]> {
    const purchaseLineId = this.resolvePurchaseLineId(row);
    if (purchaseLineId === null) {
      return of(this.hasVisibleData(row) ? [row] : []);
    }

    const lineDataSource = {
      endpoint: `/purchaseInvoiceLines(${purchaseLineId})/portalInvPrePayments`,
      keyField: 'systemId'
    };

    return this.dataSource.loadList(lineDataSource, { top: 200 }).pipe(
      map((response) => this.toRecordList(response)),
      catchError(() => of(this.hasVisibleData(row) ? [row] : []))
    );
  }

  private hasVisibleData(row: Record<string, unknown>): boolean {
    const keys = ['systemId', 'documentNo', 'sourceLineNo', 'percentage', 'amount', 'remainingAmount'];
    return keys.some((key) => row[key] !== undefined && row[key] !== null && row[key] !== '');
  }

  private buildPrepaymentEntryDialogConfig(
    row: Record<string, unknown>,
    lineRowsSource: Record<string, unknown>[]
  ): EntryDialogConfig {
    const headerData = this.buildPrepaymentHeaderData(row);
    const lineRows = this.buildPrepaymentLineRows(lineRowsSource, headerData);
    this.syncHeaderFromFirstLineRow(headerData, lineRows);
    const lineTotals = this.buildPrepaymentLineTotals(lineRows);
    const attachments = prepaymentAttachmentsDefault;

    const documentNo = this.toText(headerData['documentNo']) || '-';
    const sourceLineNo = this.toText(headerData['sourceLineNo']) || '-';

    return {
      pageLabel: prepaymentDialogTitle.toUpperCase(),
      title: prepaymentDialogTitle,
      subtitle: `${documentNo} - Line ${sourceLineNo}`,
      headerCommandBar: prepaymentHeaderCommandBar,
      lineCommandBar: prepaymentLineCommandBar,
      lineCommandPolicy: {
        injectDefaultLineNew: false,
        injectDefaultLineDelete: false
      },
      headerToolbarButtons: prepaymentHeaderToolbarButtons,
      lineToolbarButtons: prepaymentLineToolbarButtons,
      headerSections: prepaymentHeaderSections,
      headerData,
      lineColumns: prepaymentLineColumns,
      lineRows,
      lineTotals,
      footerSections: prepaymentFooterSections,
      attachments
    };
  }

  private buildPrepaymentHeaderData(row: Record<string, unknown>): Record<string, unknown> {
    const headerData: Record<string, unknown> = {
      systemId: row['systemId'] ?? '',
      purchaseLineId: row['purchaseLineId'] ?? row['purchaseLineId'] ?? row['systemId'] ?? row['id'] ?? '',
      documentNo: row['documentNo'] ?? '',
      sourceLineNo: row['sourceLineNo'] ?? '',
      genBusPostingGroup: row['genBusPostingGroup'] ?? row['GenBusPostingGroup'] ?? '',
      genProdPostingGroup: row['genProdPostingGroup'] ?? row['GenProdPostingGroup'] ?? ''
    };

    for (const section of prepaymentHeaderSections) {
      for (const field of section.fields) {
        const rawValue = row[field.key];
        const fallback = rawValue === undefined || rawValue === null || rawValue === '' ? field.defaultValue : rawValue;
        headerData[field.key] = field.valueType === 'number'
          ? (this.toNumber(fallback) ?? this.toNumber(field.defaultValue) ?? 0)
          : this.toText(fallback);
      }
    }

    headerData['originalAmountToPrepayment'] = this.resolveOriginalAmountToPrepayment(row, headerData);

    return headerData;
  }

  private buildPrepaymentLineRows(
    lineRowsSource: Record<string, unknown>[],
    headerData: Record<string, unknown>
  ): Record<string, unknown>[] {
    if (lineRowsSource.length) {
      return lineRowsSource.map((line) => ({
        sourceLineNo: this.toNumber(line['sourceLineNo']) ?? 0,
        percentage: this.toNumber(line['percentage']) ?? 0,
        amount: this.toNumber(line['amount']) ?? 0,
        remainingAmount: this.toNumber(line['remainingAmount']) ?? 0
      }));
    }

    return [
      {
        sourceLineNo: this.toNumber(headerData['sourceLineNo']) ?? 0,
        percentage: this.toNumber(headerData['percentage']) ?? 0,
        amount: this.toNumber(headerData['amount']) ?? 0,
        remainingAmount: 0
      }
    ];
  }

  private buildPrepaymentLineTotals(lineRows: Record<string, unknown>[]): EntryLineTotalsConfig {
    return this.lineCalculation.calculateLineTotals(lineRows, prepaymentLineTotalsCalculation);
  }

  private getDocumentTitle(row: Record<string, unknown>): string {
    const documentNo = this.toText(row['documentNo']);
    return documentNo ? `${prepaymentDialogTitle} ${documentNo}` : prepaymentDialogTitle;
  }

  private buildNewHeaderSeed(): Record<string, unknown> {
    const seed: Record<string, unknown> = {
      systemId: '',
      purchaseLineId: '',
      documentNo: '',
      sourceLineNo: '',
      genBusPostingGroup: '',
      genProdPostingGroup: ''
    };

    for (const section of prepaymentHeaderSections) {
      for (const field of section.fields) {
        if (field.valueType === 'number') {
          seed[field.key] = this.toNumber(field.defaultValue) ?? 0;
          continue;
        }

        seed[field.key] = this.toText(field.defaultValue);
      }
    }

    return seed;
  }

  private loadPage(reset: boolean): void {
    if (this.loading) {
      return;
    }

    if (reset) {
      this.rows = [];
      this.selectedRow = undefined;
      this.hasMore = true;
      this.listLoadSubscription?.unsubscribe();
    }

    this.loading = true;
    this.error = undefined;

    const pageSize = prepaymentListDataSource.pageSize ?? 20;
    const skip = reset ? 0 : this.rows.length;
    const effectiveFilter = this.listFilterState.buildFilter(this.listFilterScope);
    const effectiveListDataSource = {
      ...prepaymentListDataSource,
      defaultFilter: effectiveFilter
    };

    this.listLoadSubscription = this.dataSource.loadList(effectiveListDataSource, {
      skip,
      top: pageSize
    }).subscribe({
      next: (response) => {
        const records = this.toRecords(response);
        this.listFilterState.hydrateTargetsFromRecords(this.listFilterScope, records);
        this.rows = reset ? records : [...this.rows, ...records];
        this.hasMore = records.length === pageSize;
        this.loading = false;
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        if (reset) {
          this.rows = [];
        }

        this.hasMore = false;
        this.error = this.getErrorMessage(error);
        this.loading = false;
        this.changeDetector.detectChanges();
      }
    });
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

  private toRecordList(response: unknown): Record<string, unknown>[] {
    return this.toRecords(response).filter((item): item is Record<string, unknown> => this.isRecord(item));
  }

  private deleteSelectedRow(): void {
    if (!this.isRecord(this.selectedRow)) {
      return;
    }

    const selectedKey = this.getRowKey(this.selectedRow);
    if (!selectedKey) {
      return;
    }

    const selectedId = this.entryRecord.resolveRecordId(this.selectedRow, prepaymentListDataSource);
    if (selectedId === null || selectedId === undefined || selectedId === '') {
      this.removeRowFromList(selectedKey);
      return;
    }

    let requestFailed = false;
    this.subscriptions.add(
      this.dataSource.delete(prepaymentListDataSource, selectedId).pipe(
        catchError((error: unknown) => {
          requestFailed = true;
          this.error = this.getErrorMessage(error);
          this.setEntryStatus({
            tone: 'error',
            title: 'Delete failed',
            message: this.error || 'Unable to delete prepayment.'
          });
          this.changeDetector.detectChanges();
          return of(undefined);
        })
      ).subscribe(() => {
        if (requestFailed) {
          return;
        }

        this.error = undefined;
        this.removeRowFromList(selectedKey);
      })
    );
  }

  private removeRowFromList(selectedKey: string): void {
    this.rows = this.rows.filter((row) => this.getRowKey(row) !== selectedKey);
    this.selectedRow = this.rows[0];
    this.popupStack.closeAll();
    this.changeDetector.detectChanges();
  }

  private handlePrepaymentHeaderChanged(payload: unknown): void {
    if (!this.isRecord(payload) || !this.activeEntryDialogConfig?.headerData) {
      return;
    }

    const fieldKey = this.toText(payload['fieldKey']);
    const fieldConfig = this.headerFieldConfigMap[fieldKey];
    const validation = this.fieldValidation.validateField(fieldConfig, payload['value']);
    if (!validation.valid) {
      const rolledBack = this.entryState.rollbackHeaderFieldChange(
        this.activeEntryDialogConfig.headerData,
        payload,
        this.headerFieldValueTypeMap
      );

      if (rolledBack) {
        this.changeDetector.detectChanges();
      }

      this.setEntryStatus({
        tone: 'error',
        title: 'Validation failed',
        message: fieldConfig?.messages?.validationFailed ?? validation.errors[0] ?? 'Invalid value.'
      });
      return;
    }

    const changed = this.entryState.applyHeaderFieldChange(
      this.activeEntryDialogConfig.headerData,
      payload,
      this.headerFieldValueTypeMap
    );

    if (!changed) {
      return;
    }

    this.applyAmountPercentageCoupling(fieldKey);
    this.syncHeaderToFirstLineRow();
    this.recalculateActiveLineTotals();
    this.clearEntryStatus();
    this.changeDetector.detectChanges();
  }

  private applyAmountPercentageCoupling(changedField: string): void {
    if (!this.activeEntryDialogConfig?.headerData) {
      return;
    }

    const headerData = this.activeEntryDialogConfig.headerData;
    const baseAmount = this.toNumber(headerData['originalAmountToPrepayment']) ?? 0;

    if (changedField === 'percentage') {
      const percentage = this.toNumber(headerData['percentage']) ?? 0;
      headerData['amount'] = this.round2((baseAmount * percentage) / 100);
      return;
    }

    if (changedField === 'amount') {
      const amount = this.toNumber(headerData['amount']) ?? 0;
      headerData['percentage'] = baseAmount > 0 ? this.round2((amount / baseAmount) * 100) : 0;
    }
  }

  private syncHeaderToFirstLineRow(): void {
    const lineRows = this.activeEntryDialogConfig?.lineRows;
    const headerData = this.activeEntryDialogConfig?.headerData;
    if (!lineRows?.length || !headerData) {
      return;
    }

    lineRows[0]['percentage'] = this.toNumber(headerData['percentage']) ?? 0;
    lineRows[0]['amount'] = this.toNumber(headerData['amount']) ?? 0;
    if (headerData['sourceLineNo'] !== undefined) {
      lineRows[0]['sourceLineNo'] = this.toNumber(headerData['sourceLineNo']) ?? 0;
    }
  }

  private applyPrepayment(): void {
    if (!this.activeEntryDialogConfig?.headerData) {
      return;
    }

    const headerData = this.activeEntryDialogConfig.headerData;
    const percentage = this.toNumber(headerData['percentage']) ?? 0;
    const amount = this.toNumber(headerData['amount']) ?? 0;
    if (percentage <= 0 && amount <= 0) {
      this.setEntryStatus({
        tone: 'warning',
        title: 'Apply blocked',
        message: 'Enter a valid percentage or amount before applying prepayment.'
      });
      this.changeDetector.detectChanges();
      return;
    }

    const purchaseLineId = this.resolvePurchaseLineId(headerData);
    if (purchaseLineId === null) {
      this.setEntryStatus({
        tone: 'error',
        title: 'Apply failed',
        message: 'Purchase line is missing. Select a line-backed record before applying prepayment.'
      });
      this.changeDetector.detectChanges();
      return;
    }

    const payload: Record<string, unknown> = {
      percentage,
      amount
    };

    const genBusPostingGroup = this.toText(headerData['genBusPostingGroup']);
    const genProdPostingGroup = this.toText(headerData['genProdPostingGroup']);

    if (genBusPostingGroup) {
      payload['genBusPostingGroup'] = genBusPostingGroup;
    }

    if (genProdPostingGroup) {
      payload['genProdPostingGroup'] = genProdPostingGroup;
    }

    const relationDataSource = {
      endpoint: `/purchaseInvoiceLines(${purchaseLineId})/portalInvPrePayments`,
      keyField: 'systemId',
      supportsCreate: true
    };

    this.startPopupLoading('Applying prepayment...');

    this.subscriptions.add(
      this.dataSource.loadList(relationDataSource, { top: 200 }).subscribe({
        next: (existingResponse) => {
          const existing = this.toRecordList(existingResponse)[0];
          const existingId = this.isRecord(existing)
            ? this.entryRecord.resolveRecordId(existing, prepaymentListDataSource)
            : null;

          const createNext = (): void => {
            this.subscriptions.add(
              this.dataSource.create(relationDataSource, payload).subscribe({
                next: () => {
                  this.subscriptions.add(
                    this.dataSource.loadList(relationDataSource, { top: 200 }).subscribe({
                      next: (refreshResponse) => {
                        this.applyPrepaymentRefreshData(refreshResponse, headerData);
                        this.stopPopupLoading();
                        this.setEntryStatus({
                          tone: 'success',
                          title: 'Applied',
                          message: 'Prepayment applied successfully.'
                        });
                        this.changeDetector.detectChanges();
                      },
                      error: (error: unknown) => {
                        this.stopPopupLoading();
                        this.setEntryStatus({
                          tone: 'error',
                          title: 'Apply failed',
                          message: this.getErrorMessage(error)
                        });
                        this.changeDetector.detectChanges();
                      }
                    })
                  );
                },
                error: (error: unknown) => {
                  this.stopPopupLoading();
                  this.setEntryStatus({
                    tone: 'error',
                    title: 'Apply failed',
                    message: this.getErrorMessage(error)
                  });
                  this.changeDetector.detectChanges();
                }
              })
            );
          };

          if (existingId === null || existingId === undefined || existingId === '') {
            createNext();
            return;
          }

          this.subscriptions.add(
            this.dataSource.delete(prepaymentListDataSource, existingId).subscribe({
              next: () => createNext(),
              error: (error: unknown) => {
                this.stopPopupLoading();
                this.setEntryStatus({
                  tone: 'error',
                  title: 'Apply failed',
                  message: this.getErrorMessage(error)
                });
                this.changeDetector.detectChanges();
              }
            })
          );
        },
        error: (error: unknown) => {
          this.stopPopupLoading();
          this.setEntryStatus({
            tone: 'error',
            title: 'Apply failed',
            message: this.getErrorMessage(error)
          });
          this.changeDetector.detectChanges();
        }
      })
    );
  }

  private applyPrepaymentRefreshData(
    refreshResponse: unknown,
    existingHeaderData: Record<string, unknown>
  ): void {
    if (!this.activeEntryDialogConfig?.headerData) {
      return;
    }

    const refreshedLines = this.toRecordList(refreshResponse);
    const originalAmount = this.toNumber(existingHeaderData['originalAmountToPrepayment']) ?? 0;

    const mergedHeader = {
      ...this.activeEntryDialogConfig.headerData,
      ...existingHeaderData,
      originalAmountToPrepayment: originalAmount
    };

    this.syncHeaderFromFirstLineRow(mergedHeader, refreshedLines);
    this.activeEntryDialogConfig.headerData = mergedHeader;
    this.activeEntryDialogConfig.lineRows = this.buildPrepaymentLineRows(refreshedLines, mergedHeader);
    this.recalculateActiveLineTotals();
    this.stageListSyncFromActiveHeader();
  }

  private syncHeaderFromFirstLineRow(
    headerData: Record<string, unknown>,
    lineRows: Record<string, unknown>[]
  ): void {
    if (!lineRows.length) {
      return;
    }

    const firstLine = lineRows[0];
    headerData['systemId'] = firstLine['systemId'] ?? headerData['systemId'] ?? '';
    headerData['sourceLineNo'] = this.toNumber(firstLine['sourceLineNo'])
      ?? this.toNumber(headerData['sourceLineNo'])
      ?? 0;
    headerData['percentage'] = this.toNumber(firstLine['percentage'])
      ?? this.toNumber(headerData['percentage'])
      ?? 0;
    headerData['amount'] = this.toNumber(firstLine['amount'])
      ?? this.toNumber(headerData['amount'])
      ?? 0;
    headerData['remainingAmount'] = this.toNumber(firstLine['remainingAmount'])
      ?? this.toNumber(headerData['remainingAmount'])
      ?? 0;
  }

  private resolveOriginalAmountToPrepayment(
    row: Record<string, unknown>,
    headerData: Record<string, unknown>
  ): number {
    const candidates: unknown[] = [
      row['originalAmountToPrepayment'],
      
      row['amountIncludingVat'],
      row['amountIncludingVat'],
      row['lineAmount'],
      row['lineAmount'],
      headerData['originalAmountToPrepayment']
    ];

    for (const candidate of candidates) {
      const resolved = this.toNumber(candidate);
      if (resolved !== null) {
        return resolved;
      }
    }

    return 0;
  }

  private toCreatedRecord(response: unknown): Record<string, unknown> | null {
    if (this.isRecord(response)) {
      return response;
    }

    const first = this.toRecords(response)[0];
    return this.isRecord(first) ? first : null;
  }

  private deleteActivePrepayment(): void {
    if (!this.activeEntryDialogConfig?.headerData) {
      return;
    }

    const id = this.entryRecord.resolveRecordId(this.activeEntryDialogConfig.headerData, prepaymentListDataSource);
    if (id === null || id === undefined || id === '') {
      this.setEntryStatus({
        tone: 'warning',
        title: 'Delete skipped',
        message: 'No persisted prepayment found to delete.'
      });
      this.changeDetector.detectChanges();
      return;
    }

    this.subscriptions.add(
      this.dataSource.delete(prepaymentListDataSource, id).subscribe({
        next: () => {
          const key = this.getRowKey(this.activeEntryDialogConfig?.headerData);
          if (key) {
            this.removeRowFromList(key);
          }
          this.setEntryStatus({
            tone: 'success',
            title: 'Deleted',
            message: 'Prepayment deleted.'
          });
          this.changeDetector.detectChanges();
        },
        error: (error: unknown) => {
          this.setEntryStatus({
            tone: 'error',
            title: 'Delete failed',
            message: this.getErrorMessage(error)
          });
          this.changeDetector.detectChanges();
        }
      })
    );
  }

  private handleEntryCommand(command: string): void {
    if (command === 'delete' || command === 'deletePrepayment') {
      this.deleteActivePrepayment();
      return;
    }

    if (command === 'applyPrepayment' || command === 'apply' || command === 'save') {
      this.applyPrepayment();
      return;
    }

    this.actionDispatcher.dispatch(command);
  }

  private recalculateActiveLineTotals(): void {
    if (!this.activeEntryDialogConfig?.lineRows) {
      return;
    }

    this.activeEntryDialogConfig.lineTotals = this.buildPrepaymentLineTotals(this.activeEntryDialogConfig.lineRows);
  }

  private buildListSyncRecord(source: Record<string, unknown>): Record<string, unknown> {
    const key = this.getRowKey(source);
    const existing = this.rows.find((row) => this.getRowKey(row) === key);
    const base = this.isRecord(existing)
      ? { ...existing }
      : (this.isRecord(this.selectedRow) ? { ...this.selectedRow } : {});

    const target = base;
    const keysToSync = [
      'systemId',
      'documentNo',
      'sourceLineNo',
      'originalAmountToPrepayment',
      'percentage',
      'amount',
      'remainingAmount',
      'purchaseLineId'
    ];

    for (const keyName of keysToSync) {
      if (keyName in source) {
        target[keyName] = source[keyName];
      }
    }

    return target;
  }

  private stageListSyncFromActiveHeader(): void {
    if (!this.activeEntryDialogConfig?.headerData) {
      return;
    }

    this.pendingListSyncRecord = this.buildListSyncRecord(this.activeEntryDialogConfig.headerData);
    this.applyDeferredListSync();
  }

  private applyDeferredListSync(): void {
    if (!this.pendingListSyncRecord) {
      return;
    }

    const record = this.pendingListSyncRecord;
    const key = this.getRowKey(record);
    this.pendingListSyncRecord = undefined;

    if (!key) {
      return;
    }

    const existingIndex = this.rows.findIndex((row) => this.getRowKey(row) === key);
    if (existingIndex >= 0) {
      const nextRows = [...this.rows];
      nextRows[existingIndex] = record;
      this.rows = nextRows;
    } else {
      this.rows = [record, ...this.rows];
    }

    this.selectedRow = record;
    this.changeDetector.detectChanges();
  }

  private getRowKey(row: unknown): string {
    if (!this.isRecord(row)) {
      return '';
    }

    const primary = row['systemId'];
    if (primary !== null && primary !== undefined && String(primary).trim().length > 0) {
      return String(primary);
    }

    const documentNo = this.toText(row['documentNo']);
    const sourceLineNo = this.toText(row['sourceLineNo']);
    return `${documentNo}:${sourceLineNo}`;
  }

  private resolvePurchaseLineId(record: Record<string, unknown>): number | string | null {
    const raw = record['purchaseLineId'] ?? record['purchaseLineId'] ?? record['systemId'] ?? record['id'];
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }

    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? raw : null;
    }

    const text = String(raw).trim();
    if (!text.length) {
      return null;
    }

    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : text;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private toText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(/,/g, '').trim();
      if (!normalized) {
        return null;
      }

      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private getErrorMessage(error: unknown): string {
    return this.apiError.toMessage(error, 'Unable to process prepayment request.');
  }

  private setEntryStatus(message: EntryStatusMessage): void {
    if (!this.activeEntryDialogConfig) {
      return;
    }

    this.activeEntryDialogConfig.statusMessage = message;
  }

  private clearEntryStatus(): void {
    if (!this.activeEntryDialogConfig) {
      return;
    }

    this.activeEntryDialogConfig.statusMessage = undefined;
  }

  private startPopupLoading(message: string): void {
    this.popupLoadingMessage = message;
    this.popupLoading = true;
    this.changeDetector.detectChanges();
  }

  private stopPopupLoading(): void {
    if (!this.popupLoading) {
      return;
    }

    this.popupLoading = false;
    this.changeDetector.detectChanges();
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
