import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SessionService } from '../../core/services/session.service';
import {
  ActionDispatcherService,
  ApiErrorService,
  ConfirmationService,
  DataSourceService,
  EntryAttachmentsConfig,
  EntryDialogConfig,
  EntryLineTotalsConfig,
  EntryStatusMessage,
  EntryPayloadService,
  EntryRecordService,
  EntryStateService,
  FieldValidationService,
  GENERIC_MESSAGES,
  LineCalculationService,
  LineCommandService,
  LineMasterRegistry,
  LineMasterService,
  ListFilterPanelComponent,
  ListFilterStateService,
  ListPageComponent,
  MasterDataService,
  PageCommandService,
  PopupHostComponent,
  PopupStackService
} from '../../shared/erp-core/public-api';
import {
  purchaseInvoiceAttachmentsDefault,
  purchaseInvoiceDialogTitle,
  purchaseInvoiceHeaderCommandBar,
  purchaseInvoiceHeaderSections,
  purchaseInvoiceLineIdentifierFields,
  purchaseInvoiceHeaderToolbarButtons,
  purchaseInvoiceLineColumns,
  purchaseInvoiceLineCommandBar,
  purchaseInvoiceLineDataSource,
  purchaseInvoiceLineMasterEndpoints,
  purchaseInvoiceLineMasterOptionFields,
  purchaseInvoiceLinePlacement,
  purchaseInvoiceLineSelectionStrategy,
  purchaseInvoiceLineToolbarButtons,
  purchaseInvoiceLineTotalsCalculation,
  purchaseInvoiceListCommandsConfig,
  purchaseInvoiceListDataSource,
  purchaseInvoiceListPageConfig,
  purchaseInvoiceModifiedAtKey
} from './purchase-invoice.config';

@Component({
  selector: 'app-purchase-invoice',
  standalone: true,
  imports: [ListPageComponent, ListFilterPanelComponent, PopupHostComponent],
  templateUrl: './purchase-invoice.html'
})
export class PurchaseInvoicePage implements OnInit, OnDestroy {
  private readonly actionDispatcher = inject(ActionDispatcherService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly dataSource = inject(DataSourceService);
  private readonly entryPayload = inject(EntryPayloadService);
  private readonly entryRecord = inject(EntryRecordService);
  private readonly entryState = inject(EntryStateService);
  private readonly apiError = inject(ApiErrorService);
  private readonly fieldValidation = inject(FieldValidationService);
  private readonly listFilterState = inject(ListFilterStateService);
  private readonly lineCalculation = inject(LineCalculationService);
  private readonly masterData = inject(MasterDataService);
  private readonly lineCommands = inject(LineCommandService);
  private readonly lineMasters = inject(LineMasterService);
  private readonly pageCommands = inject(PageCommandService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly popupStack = inject(PopupStackService);
  private readonly sessionService = inject(SessionService);
  private readonly subscriptions = new Subscription();
  private readonly headerFieldValueTypeMap = this.entryState.buildFieldValueTypeMap(purchaseInvoiceHeaderSections);
  private readonly headerFieldConfigMap = this.entryState.buildFieldConfigMap(purchaseInvoiceHeaderSections);
  private readonly defaultSaveFailedMessage = GENERIC_MESSAGES.saveFailedDefault;

  readonly listPageConfig = purchaseInvoiceListPageConfig;
  readonly listFilterScope = this.listPageConfig.dataSurface?.id ?? this.listPageConfig.id ?? 'purchase-invoice-list';
  readonly listFilterStorageKey = this.listPageConfig.filterConfig?.storageKey ?? this.listFilterScope;

  loading = false;
  popupLoading = false;
  popupLoadingMessage = 'Loading purchase invoice...';
  error?: string;
  hasMore = true;
  rows: unknown[] = [];
  selectedRow?: unknown;

  private listLoadSubscription?: Subscription;
  private activeEntryDialogConfig?: EntryDialogConfig;
  private pendingListSyncRecord?: Record<string, unknown>;
  private activeLineRow?: Record<string, unknown>;
  private selectedLineIndexes: number[] = [];
  private headerDropdownRecords: Record<string, Record<string, unknown>[]> = {};
  private glAccountOptions: Array<{ label: string; value: string }> = [];
  private itemOptions: Array<{ label: string; value: string }> = [];
  private fixedAssetOptions: Array<{ label: string; value: string }> = [];
  private unitOfMeasureOptions: Array<{ label: string; value: string }> = [];
  private locationOptions: Array<{ label: string; value: string }> = [];
  private glAccountRecords: Record<string, unknown>[] = [];
  private itemRecords: Record<string, unknown>[] = [];
  private fixedAssetRecords: Record<string, unknown>[] = [];
  private checkedRowKeys = new Set<string>();

  constructor() {
    this.popupStack.closeAll();
  }

  ngOnInit(): void {
    this.actionDispatcher.setPageCommands(purchaseInvoiceListCommandsConfig);
    this.actionDispatcher.setPageContext({
      title: this.listPageConfig.title,
      module: this.listPageConfig.module,
      company: this.listPageConfig.company,
      viewSuffix: this.listPageConfig.viewSuffix,
      tools: this.listPageConfig.tools
    });

    this.listFilterState.initializeFromConfig(
      this.listFilterScope,
      purchaseInvoiceListPageConfig,
      purchaseInvoiceListDataSource.defaultFilter
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
    this.entryState.clearAutosave('purchase-invoice-entry');
    this.subscriptions.unsubscribe();
  }

  handlePopupAction(event: { popupId: string; actionKey: string; payload?: unknown }): void {
    this.entryState.handleEntryPopupAction(event, 'purchase-invoice-entry', {
      lineChanged: (payload) => this.handlePurchaseInvoiceLineChanged(payload),
      lineSelectionChanged: (payload) => this.handlePurchaseInvoiceLineSelectionChanged(payload),
      headerChanged: (payload) => this.handlePurchaseInvoiceHeaderChanged(payload),
      autosave: () => this.queueLocalAutosave(),
      commands: {
        save: () => this.handleSaveCommand(),
        apply: () => this.handleSaveCommand(),
        lineNew: (payload) => this.handleEntryCommand('line-new', payload),
        lineInsert: (payload) => this.handleEntryCommand('line-insert', payload),
        command: (command, payload) => this.handleEntryCommand(command, payload)
      }
    });
  }

  handlePopupClosed(event: { popupId: string; entryDialogConfig?: EntryDialogConfig }): void {
    if (event.popupId !== 'purchase-invoice-entry') {
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
      delete: () => {
        void this.deleteSelectedRow();
      }
    });
  }

  handleCheckedKeysChanged(keys: string[]): void {
    this.checkedRowKeys = new Set(keys.filter((key) => key.trim().length > 0));
  }

  openPurchaseInvoice(row: unknown, preserveLoader = false): void {
    if (!preserveLoader) {
      this.startPopupLoading('Loading purchase invoice...');
    } else {
      this.popupLoadingMessage = 'Loading purchase invoice...';
    }

    if (!this.isRecord(row)) {
      this.openPurchaseInvoicePopup({}, []);
      this.stopPopupLoading();
      return;
    }

    const documentNo = this.toODataString(row['number']);
    const lineDataSource = {
      ...purchaseInvoiceLineDataSource,
      defaultFilter: documentNo ? `documentType eq 'Invoice' and documentNo eq '${documentNo}'` : ''
    };

    const lines$ = documentNo
      ? this.dataSource.loadList(lineDataSource, { top: 200 }).pipe(catchError(() => of([] as unknown[])))
      : of([] as unknown[]);
    const masters$ = this.loadLineMasterOptions();
    const headerDropdownOptions$ = this.loadConfiguredHeaderDropdownOptions();

    this.subscriptions.add(
      forkJoin({ lines: lines$, masters: masters$, headerDropdownOptions: headerDropdownOptions$ }).subscribe({
        next: ({ lines, masters, headerDropdownOptions }) => {
          this.glAccountRecords = masters.glAccountsRecords;
          this.itemRecords = masters.itemsRecords;
          this.fixedAssetRecords = masters.fixedAssetsRecords;
          this.glAccountOptions = masters.glAccounts;
          this.itemOptions = masters.items;
          this.fixedAssetOptions = masters.fixedAssets;
          this.unitOfMeasureOptions = masters.unitOfMeasures;
          this.locationOptions = masters.locations;
          this.setHeaderDropdownRecords(headerDropdownOptions);
          this.openPurchaseInvoicePopup(row, this.buildPurchaseInvoiceLineRows(this.toRecordList(lines)));
          this.stopPopupLoading();
        },
        error: () => {
          this.openPurchaseInvoicePopup(row, []);
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

  clearListError(): void {
    this.error = undefined;
    this.changeDetector.detectChanges();
  }

  private loadFirstPage(): void {
    this.loadPage(true);
  }

  private loadPage(reset: boolean): void {
    if (this.loading) {
      return;
    }

    if (reset) {
      this.rows = [];
      this.selectedRow = undefined;
      this.checkedRowKeys.clear();
      this.hasMore = true;
      this.listLoadSubscription?.unsubscribe();
    }

    this.loading = true;
    this.error = undefined;

    const pageSize = purchaseInvoiceListDataSource.pageSize ?? 20;
    const skip = reset ? 0 : this.rows.length;
    const effectiveFilter = this.listFilterState.buildFilter(this.listFilterScope);
    const effectiveListDataSource = {
      ...purchaseInvoiceListDataSource,
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

  private openPurchaseInvoicePopup(row: unknown, lineRows: Record<string, unknown>[]): void {
    const entryDialogConfig = this.buildPurchaseInvoiceEntryDialogConfig(row, lineRows);
    this.activeEntryDialogConfig = entryDialogConfig;
    this.activeLineRow = undefined;
    this.selectedLineIndexes = [];

    this.popupStack.open({
      id: 'purchase-invoice-entry',
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
    this.startPopupLoading('Preparing purchase invoice...');
    this.openPurchaseInvoice(this.buildNewHeaderSeed(''), true);
  }

  private buildPurchaseInvoiceEntryDialogConfig(row: unknown, lineRows: Record<string, unknown>[]): EntryDialogConfig {
    const record = this.isRecord(row) ? row : {};
    const number = this.toText(record['number']) || 'New';
    const vendorName = this.toText(record['buyFromVendorName']) || 'Vendor';
    const status = this.toText(record['status']) || this.getHeaderDefaultText('status');

    const attachments: EntryAttachmentsConfig = {
      headerFilesCount: this.toNumber(record['HeaderAttachmentCount']) ?? purchaseInvoiceAttachmentsDefault.headerFilesCount,
      lineFilesCount: this.toNumber(record['LineAttachmentCount']) ?? purchaseInvoiceAttachmentsDefault.lineFilesCount,
      canUpload: this.toBoolean(record['CanUploadAttachment']) ?? purchaseInvoiceAttachmentsDefault.canUpload,
      primaryActionLabel: this.toText(record['AttachmentActionLabel']) || purchaseInvoiceAttachmentsDefault.primaryActionLabel,
      primaryActionKey: this.toText(record['AttachmentActionKey']) || purchaseInvoiceAttachmentsDefault.primaryActionKey
    };

    const headerData = this.buildHeaderData(record);
    const lines = lineRows.length ? lineRows : [this.createEmptyLineRow()];
    const totals = this.buildLineTotals(lines);

    return {
      pageLabel: purchaseInvoiceDialogTitle.toUpperCase(),
      title: `${purchaseInvoiceDialogTitle} ${number}`,
      subtitle: `${vendorName} - ${status}`,
      headerCommandBar: purchaseInvoiceHeaderCommandBar,
      lineCommandBar: purchaseInvoiceLineCommandBar,
      lineCommandPolicy: {
        injectDefaultLineNew: false,
        injectDefaultLineDelete: false
      },
      linePlacement: purchaseInvoiceLinePlacement,
      headerToolbarButtons: purchaseInvoiceHeaderToolbarButtons,
      lineToolbarButtons: purchaseInvoiceLineToolbarButtons,
      headerSections: purchaseInvoiceHeaderSections,
      headerData,
      lineColumns: purchaseInvoiceLineColumns,
      lineRows: lines,
      lineTotals: totals,
      attachments
    };
  }

  private buildHeaderData(record: Record<string, unknown>): Record<string, unknown> {
    const data: Record<string, unknown> = {
      id: record['id'] ?? record['id'] ?? ''
    };

    for (const section of purchaseInvoiceHeaderSections) {
      for (const field of section.fields) {
        const source = record[field.key];
        const fallback = source === null || source === undefined || source === '' ? field.defaultValue : source;
        data[field.key] = field.valueType === 'number'
          ? (this.toNumber(fallback) ?? this.toNumber(field.defaultValue) ?? 0)
          : this.toText(fallback);
      }
    }

    for (const section of purchaseInvoiceHeaderSections) {
      for (const field of section.fields) {
        const optionsKey = field.optionsDataKey?.trim();
        if (!optionsKey) {
          continue;
        }

        data[optionsKey] = this.headerDropdownRecords[optionsKey] ?? [];
      }
    }

    return data;
  }

  private buildLineTotals(lineRows: Record<string, unknown>[]): EntryLineTotalsConfig {
    return this.lineCalculation.calculateLineTotals(lineRows, purchaseInvoiceLineTotalsCalculation);
  }

  private createEmptyLineRow(): Record<string, unknown> {
    const registry = this.getLineMasterRegistry();
    const optionFieldMap = this.getLineOptionFieldMap();
    const defaultType = this.resolveDefaultLineType(registry);
    return {
      id: '',
      type: defaultType,
      no: '',
      description: '',
      unitOfMeasureCode: '',
      locationCode: '',
      quantity: 0,
      directUnitCost: 0,
      vat: 0,
      lineAmount: 0,
      amountIncludingVat: 0,
      ...this.buildRowOptions(defaultType, registry, optionFieldMap)
    };
  }

  private handlePurchaseInvoiceHeaderChanged(payload: unknown): void {
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

    this.clearEntryStatus();
    this.changeDetector.detectChanges();
  }

  private handlePurchaseInvoiceLineChanged(payload: unknown): void {
    const change = this.entryState.resolveLineChange(payload);
    if (!change || !this.activeEntryDialogConfig?.lineRows) {
      return;
    }

    const { row, field, value } = change;
    this.activeLineRow = row;

    if (field === 'type') {
      const registry = this.getLineMasterRegistry();
      this.lineMasters.applyTypeChange(row, value, registry, {
        clearFields: ['no', 'description', 'unitOfMeasureCode', 'locationCode'],
        zeroFields: ['quantity', 'directUnitCost', 'vat', 'lineAmount', 'amountIncludingVat'],
        optionFieldMap: this.getLineOptionFieldMap(),
        numberOptionFieldKey: '__options_no'
      });
      this.clearEntryStatus();
      this.queueLocalAutosave();
      this.changeDetector.detectChanges();
      return;
    }

    if (field === 'no') {
      this.applyNumberSelection(row);
    }

    if (field === 'quantity' || field === 'directUnitCost' || field === 'vat') {
      const quantity = this.toNumber(row['quantity']) ?? 0;
      const unitCost = this.toNumber(row['directUnitCost']) ?? 0;
      const vat = this.toNumber(row['vat']) ?? 0;
      row['lineAmount'] = this.round2(quantity * unitCost);
      row['amountIncludingVat'] = this.round2((this.toNumber(row['lineAmount']) ?? 0) + vat);
    }

    this.activeEntryDialogConfig.lineTotals = this.buildLineTotals(this.activeEntryDialogConfig.lineRows);
    this.clearEntryStatus();
    this.queueLocalAutosave();
    this.changeDetector.detectChanges();
  }

  private handlePurchaseInvoiceLineSelectionChanged(payload: unknown): void {
    if (!this.isRecord(payload)) {
      return;
    }

    const activeRow = payload['activeRow'];
    if (this.isRecord(activeRow)) {
      this.activeLineRow = activeRow;
    }

    const selectedIndexes = payload['selectedIndexes'];
    this.selectedLineIndexes = Array.isArray(selectedIndexes)
      ? selectedIndexes.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0)
      : [];
  }

  private queueLocalAutosave(): void {
    if (!this.activeEntryDialogConfig?.headerData) {
      return;
    }

    const id = this.entryRecord.resolveRecordId(this.activeEntryDialogConfig.headerData, purchaseInvoiceListDataSource);
    if (id === null || id === undefined || id === '') {
      return;
    }

    const previousSnapshot = { ...this.activeEntryDialogConfig.headerData };

    this.entryState.scheduleHeaderAutosave('purchase-invoice-entry', this.activeEntryDialogConfig.headerData, {
      modifiedAtKey: purchaseInvoiceModifiedAtKey,
      lineRows: this.activeEntryDialogConfig.lineRows,
      lineDataSourceConfig: purchaseInvoiceLineDataSource,
      dataSourceConfig: purchaseInvoiceListDataSource,
      headerSections: purchaseInvoiceHeaderSections,
      meta: {
        page: 'purchase-invoice'
      },
      onFailed: (result) => {
        Object.assign(this.activeEntryDialogConfig?.headerData ?? {}, previousSnapshot);
        this.setEntryStatus({
          tone: 'error',
          title: 'Save failed',
          message: result.errorMessage || this.defaultSaveFailedMessage
        });
        this.changeDetector.detectChanges();
      },
      onCompleted: () => {
        this.stageListSyncFromActiveHeader();
        this.setEntryStatus({
          tone: 'success',
          title: GENERIC_MESSAGES.saveSuccessTitle,
          message: GENERIC_MESSAGES.saveSuccessMessage
        });
        this.changeDetector.detectChanges();
      }
    });
  }

  private handleSaveCommand(): void {
    if (!this.activeEntryDialogConfig?.headerData) {
      return;
    }

    const id = this.entryRecord.resolveRecordId(this.activeEntryDialogConfig.headerData, purchaseInvoiceListDataSource);
    if (id === null || id === undefined || id === '') {
      this.createPurchaseInvoice();
      return;
    }

    this.queueLocalAutosave();
  }

  private createPurchaseInvoice(): void {
    if (!this.activeEntryDialogConfig?.headerData) {
      return;
    }

    const payload = {
      ...this.entryPayload.buildSessionCreatePayload(),
      ...this.entryPayload.buildHeaderUpdatePayload(this.activeEntryDialogConfig.headerData, purchaseInvoiceHeaderSections)
    };

    this.subscriptions.add(
      this.dataSource.create(purchaseInvoiceListDataSource, payload).pipe(
        catchError((error: unknown) => {
          this.setEntryStatus({
            tone: 'error',
            title: 'Create failed',
            message: this.getErrorMessage(error)
          });
          this.changeDetector.detectChanges();
          return of(undefined);
        })
      ).subscribe((created) => {
        if (!this.isRecord(created) || !this.activeEntryDialogConfig?.headerData) {
          return;
        }

        this.activeEntryDialogConfig.headerData = {
          ...this.activeEntryDialogConfig.headerData,
          ...this.buildHeaderData(created)
        };
        this.stageListSyncFromActiveHeader();
        this.setEntryStatus({
          tone: 'success',
          title: GENERIC_MESSAGES.createSuccessTitle,
          message: GENERIC_MESSAGES.createSuccessMessage
        });
        this.changeDetector.detectChanges();
      })
    );
  }

  private handleEntryCommand(command: string, payload: unknown): void {
    if (command === 'line-new') {
      this.appendNewLine('append');
      return;
    }

    if (command === 'line-insert') {
      this.appendNewLine('prepend');
      return;
    }

    if (command === 'line-delete') {
      void this.deleteLine(payload);
      return;
    }

    this.actionDispatcher.dispatch(command, payload);
  }

  private appendNewLine(mode: 'append' | 'prepend'): void {
    if (!this.activeEntryDialogConfig) {
      return;
    }

    const lineRows = this.activeEntryDialogConfig.lineRows ?? [];
    const newRow = this.createEmptyLineRow();
    this.activeEntryDialogConfig.lineRows = mode === 'prepend' ? [newRow, ...lineRows] : [...lineRows, newRow];
    this.activeEntryDialogConfig.lineTotals = this.buildLineTotals(this.activeEntryDialogConfig.lineRows);
    this.clearEntryStatus();
    this.changeDetector.detectChanges();
  }

  private async deleteLine(payload: unknown): Promise<void> {
    if (!this.activeEntryDialogConfig?.lineRows?.length) {
      return;
    }

    try {
      const result = await this.lineCommands.deleteRows({
        lineRows: this.activeEntryDialogConfig.lineRows,
        payload,
        activeRow: this.activeLineRow,
        selectedIndexes: this.selectedLineIndexes,
        resolveId: (row) => this.entryRecord.resolveRecordId(row, purchaseInvoiceLineDataSource),
        deleteById: (id) => this.dataSource.delete(purchaseInvoiceLineDataSource, id),
        confirmDelete: (count) => this.confirmation.confirmIntent({
          intent: 'delete',
          count,
          entityLabel: 'line'
        })
      });

      if (!result.deleted) {
        return;
      }

      const latestRows = this.activeEntryDialogConfig?.lineRows ?? [];
      const remainingRows = latestRows.filter((row) => !result.targetRows.includes(row));
      this.applyLineDeletionResult(remainingRows);
    } catch (error: unknown) {
      this.setEntryStatus({
        tone: 'error',
        title: GENERIC_MESSAGES.deleteFailedTitle,
        message: this.getErrorMessage(error) || GENERIC_MESSAGES.lineDeleteFailedMessage
      });
      this.changeDetector.detectChanges();
    }
  }

  private applyLineDeletionResult(nextRows: Record<string, unknown>[]): void {
    if (!this.activeEntryDialogConfig) {
      return;
    }

    this.activeEntryDialogConfig.lineRows = nextRows.length ? nextRows : [this.createEmptyLineRow()];
    this.activeLineRow = this.activeEntryDialogConfig.lineRows[this.activeEntryDialogConfig.lineRows.length - 1];
    this.selectedLineIndexes = [];
    this.activeEntryDialogConfig.lineTotals = this.buildLineTotals(this.activeEntryDialogConfig.lineRows);
    this.clearEntryStatus();
    this.changeDetector.detectChanges();
  }

  private async deleteSelectedRow(): Promise<void> {
    const targets = this.resolveDeleteTargets();
    if (!targets.length) {
      return;
    }

    const confirmed = await this.confirmation.confirmIntent({
      intent: 'delete',
      count: targets.length,
      entity: 'purchaseInvoice'
    });

    if (!confirmed) {
      return;
    }

    const operations = targets.map((target) => {
      if (target.id === null || target.id === undefined || target.id === '') {
        return of({ key: target.key, success: true, error: undefined as unknown });
      }

      return this.dataSource.delete(purchaseInvoiceListDataSource, target.id).pipe(
        map(() => ({ key: target.key, success: true, error: undefined as unknown })),
        catchError((error: unknown) => of({ key: target.key, success: false, error }))
      );
    });

    this.subscriptions.add(
      forkJoin(operations).subscribe((results) => {
        const deletedKeys = results.filter((result) => result.success).map((result) => result.key);
        if (deletedKeys.length) {
          this.removeRowsFromList(deletedKeys);
        }

        const failed = results.find((result) => !result.success);
        if (failed) {
          this.error = this.getErrorMessage(failed.error);
          this.changeDetector.detectChanges();
          return;
        }

        this.error = undefined;
        this.changeDetector.detectChanges();
      })
    );
  }

  private removeRowFromList(selectedKey: string): void {
    this.rows = this.rows.filter((row) => this.getRowKey(row) !== selectedKey);
    this.checkedRowKeys.delete(selectedKey);
    this.selectedRow = this.rows[0];
    this.popupStack.closeAll();
    this.changeDetector.detectChanges();
  }

  private removeRowsFromList(keys: string[]): void {
    const deleteSet = new Set(keys);
    this.rows = this.rows.filter((row) => !deleteSet.has(this.getRowKey(row)));
    for (const key of deleteSet) {
      this.checkedRowKeys.delete(key);
    }
    this.selectedRow = this.rows[0];
    this.popupStack.closeAll();
    this.changeDetector.detectChanges();
  }

  private resolveDeleteTargets(): Array<{ key: string; id: unknown }> {
    const selectedTargets = this.rows
      .filter((row) => this.checkedRowKeys.has(this.getRowKey(row)))
      .filter((row): row is Record<string, unknown> => this.isRecord(row))
      .map((row) => ({
        key: this.getRowKey(row),
        id: this.entryRecord.resolveRecordId(row, purchaseInvoiceListDataSource)
      }))
      .filter((target) => target.key.length > 0);

    if (selectedTargets.length) {
      return selectedTargets;
    }

    if (!this.isRecord(this.selectedRow)) {
      return [];
    }

    const key = this.getRowKey(this.selectedRow);
    if (!key) {
      return [];
    }

    return [{
      key,
      id: this.entryRecord.resolveRecordId(this.selectedRow, purchaseInvoiceListDataSource)
    }];
  }

  private stageListSyncFromActiveHeader(): void {
    if (!this.activeEntryDialogConfig?.headerData) {
      return;
    }

    this.pendingListSyncRecord = this.buildListSyncRecord(this.activeEntryDialogConfig.headerData);
    this.applyDeferredListSync();
  }

  private buildListSyncRecord(source: Record<string, unknown>): Record<string, unknown> {
    const key = this.getRowKey(source);
    const existing = this.rows.find((row) => this.getRowKey(row) === key);
    const base = this.isRecord(existing)
      ? { ...existing }
      : (this.isRecord(this.selectedRow) ? { ...this.selectedRow } : {});

    const target = base;
    const keysToSync = [
      'id',
      'number',
      'buyFromVendorNo',
      'buyFromVendorName',
      'postingDate',
      'documentDate',
      'status',
      'pendingApproversId',
      'Remark',
      'vendorInvoiceNumber',
      'amount',
      'systemModifiedAt'
    ];

    for (const syncKey of keysToSync) {
      if (syncKey in source) {
        target[syncKey] = source[syncKey];
      }
    }

    return target;
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

  private getDocumentTitle(row: unknown): string {
    if (!this.isRecord(row)) {
      return purchaseInvoiceDialogTitle;
    }

    return `${purchaseInvoiceDialogTitle} ${row['number'] ?? ''}`.trim();
  }

  private getRowKey(row: unknown): string {
    if (!this.isRecord(row)) {
      return '';
    }

    const value = row['id'] ?? row['number'];
    return value === null || value === undefined ? '' : String(value);
  }

  private buildNewHeaderSeed(generatedNo: string): Record<string, unknown> {
    const seed: Record<string, unknown> = {};

    for (const section of purchaseInvoiceHeaderSections) {
      for (const field of section.fields) {
        if (field.defaultValue !== undefined) {
          seed[field.key] = field.defaultValue;
          continue;
        }

        if (field.valueType === 'number') {
          seed[field.key] = 0;
          continue;
        }

        seed[field.key] = '';
      }
    }

    seed['number'] = generatedNo;
    return seed;
  }

  private getHeaderDefaultText(fieldKey: string): string {
    const field = this.headerFieldConfigMap[fieldKey];
    if (!field || field.defaultValue === undefined || field.defaultValue === null) {
      return '';
    }

    return this.toText(field.defaultValue);
  }

  private loadConfiguredHeaderDropdownOptions(): Observable<Record<string, Record<string, unknown>[]>> {
    const dropdownSources: Record<string, Observable<Record<string, unknown>[]>> = {};

    for (const section of purchaseInvoiceHeaderSections) {
      for (const field of section.fields) {
        const optionsKey = field.optionsDataKey?.trim();
        if (field.type !== 'dropdown' || !optionsKey || dropdownSources[optionsKey]) {
          continue;
        }

        const endpoints = (field.optionsEndpoints ?? [])
          .map((endpoint) => endpoint.trim())
          .filter((endpoint) => endpoint.length > 0);

        if (field.optionsSkipWhenSuperAdmin && this.sessionService.SuperAdmin) {
          dropdownSources[optionsKey] = of([] as Record<string, unknown>[]);
          continue;
        }

        if (!endpoints.length) {
          dropdownSources[optionsKey] = of([] as Record<string, unknown>[]);
          continue;
        }

        dropdownSources[optionsKey] = this.masterData.loadFirstAvailableList(endpoints).pipe(
          catchError(() => of([] as Record<string, unknown>[]))
        );
      }
    }

    if (!Object.keys(dropdownSources).length) {
      return of({});
    }

    return forkJoin(dropdownSources);
  }

  private buildPurchaseInvoiceLineRows(lines: Record<string, unknown>[]): Record<string, unknown>[] {
    const registry = this.getLineMasterRegistry();
    const optionFieldMap = this.getLineOptionFieldMap();

    if (!lines.length) {
      return [this.createEmptyLineRow()];
    }

    return lines.map((line) => {
      const type = this.lineMasters.resolveType(line['type'], registry);
      return {
        systemId: line['systemId'] ?? line['id'] ?? '',
        id: line['id'] ?? line['systemId'] ?? '',
        type: type,
        no: this.toText(line['no'] ?? line['number']),
        description: this.toText(line['description'] ?? line['description2']),
        unitOfMeasureCode: this.toText(line['unitOfMeasureCode'] ?? line['unitOfMeasure']),
        locationCode: this.toText(line['locationCode']),
        quantity: this.toNumber(line['quantity']) ?? 0,
        directUnitCost: this.toNumber(line['directUnitCost'] ?? line['unitCost']) ?? 0,
        vat: this.toNumber(line['vat'] ?? line['vatAmount']) ?? 0,
        lineAmount: this.toNumber(line['lineAmount']) ?? 0,
        amountIncludingVat: this.toNumber(line['amountIncludingVat'] ?? line['amountIncludingVat']) ?? 0,
        ...this.buildRowOptions(type, registry, optionFieldMap)
      };
    });
  }

  private loadLineMasterOptions() {
    const unitOfMeasureEndpoints = this.getLineColumnEndpoints('unitOfMeasureCode');
    const locationEndpoints = this.getLineColumnEndpoints('locationCode');

    return this.masterData.loadMasterLists({
      glAccounts: purchaseInvoiceLineMasterEndpoints.glAccounts,
      items: purchaseInvoiceLineMasterEndpoints.items,
      fixedAssets: purchaseInvoiceLineMasterEndpoints.fixedAssets,
      unitOfMeasures: unitOfMeasureEndpoints,
      locations: locationEndpoints
    }).pipe(
      map((masters) => ({
        glAccountsRecords: masters.glAccounts,
        itemsRecords: masters.items,
        fixedAssetsRecords: masters.fixedAssets,
        glAccounts: this.masterData.toSelectOptions(
          masters.glAccounts,
          purchaseInvoiceLineMasterOptionFields.glAccounts.valueFields,
          purchaseInvoiceLineMasterOptionFields.glAccounts.labelFields
        ),
        items: this.masterData.toSelectOptions(
          masters.items,
          purchaseInvoiceLineMasterOptionFields.items.valueFields,
          purchaseInvoiceLineMasterOptionFields.items.labelFields
        ),
        fixedAssets: this.masterData.toSelectOptions(
          masters.fixedAssets,
          purchaseInvoiceLineMasterOptionFields.fixedAssets.valueFields,
          purchaseInvoiceLineMasterOptionFields.fixedAssets.labelFields
        ),
        unitOfMeasures: this.masterData.toSelectOptions(
          masters.unitOfMeasures,
          purchaseInvoiceLineMasterOptionFields.unitOfMeasures.valueFields,
          purchaseInvoiceLineMasterOptionFields.unitOfMeasures.labelFields
        ),
        locations: this.masterData.toSelectOptions(
          masters.locations,
          purchaseInvoiceLineMasterOptionFields.locations.valueFields,
          purchaseInvoiceLineMasterOptionFields.locations.labelFields
        )
      })),
      catchError(() =>
        of({
          glAccountsRecords: [] as Record<string, unknown>[],
          itemsRecords: [] as Record<string, unknown>[],
          fixedAssetsRecords: [] as Record<string, unknown>[],
          glAccounts: [] as Array<{ label: string; value: string }>,
          items: [] as Array<{ label: string; value: string }>,
          fixedAssets: [] as Array<{ label: string; value: string }>,
          unitOfMeasures: [] as Array<{ label: string; value: string }>,
          locations: [] as Array<{ label: string; value: string }>
        })
      )
    );
  }

  private getLineMasterRegistry(): LineMasterRegistry {
    return {
      defaultType: 'G/L Account',
      emptyType: ' ',
      byType: {
        'G/L Account': {
          options: this.glAccountOptions,
          records: this.glAccountRecords
        },
        Item: {
          options: this.itemOptions,
          records: this.itemRecords
        },
        'Fixed Asset': {
          options: this.fixedAssetOptions,
          records: this.fixedAssetRecords
        }
      },
      aliases: {
        Comment: ' '
      }
    };
  }

  private getLineOptionFieldMap(): Record<string, Array<{ label: string; value: string }>> {
    const optionFieldMap: Record<string, Array<{ label: string; value: string }>> = {};

    const uomKey = this.getLineColumnOptionsDataKey('unitOfMeasureCode');
    const locationKey = this.getLineColumnOptionsDataKey('locationCode');

    if (uomKey) {
      optionFieldMap[uomKey] = this.unitOfMeasureOptions;
    }

    if (locationKey) {
      optionFieldMap[locationKey] = this.locationOptions;
    }

    return optionFieldMap;
  }

  private getLineColumnOptionsDataKey(fieldName: string): string {
    const column = purchaseInvoiceLineColumns.find((item) => String(item.field ?? item.id) === fieldName);
    return column?.optionsDataKey?.trim() ?? '';
  }

  private getLineColumnEndpoints(fieldName: string): string[] {
    const column = purchaseInvoiceLineColumns.find((item) => String(item.field ?? item.id) === fieldName);
    return (column?.optionsEndpoints ?? [])
      .map((endpoint) => endpoint.trim())
      .filter((endpoint) => endpoint.length > 0);
  }

  private buildRowOptions(
    type: string,
    registry: LineMasterRegistry,
    optionFieldMap: Record<string, Array<{ label: string; value: string }>>
  ): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    this.lineMasters.assignTypeOptions(row, type, registry, optionFieldMap, '__options_no');
    return row;
  }

  private applyNumberSelection(row: Record<string, unknown>): void {
    const registry = this.getLineMasterRegistry();
    const type = this.lineMasters.resolveType(row['type'], registry);
    const master = this.lineMasters.findRecordByNumber(type, row['no'], registry, purchaseInvoiceLineIdentifierFields);
    if (!master) {
      return;
    }

    const unitCost = this.lineMasters.applySelection(row, master, purchaseInvoiceLineSelectionStrategy);
    if (unitCost > 0) {
      const quantity = this.toNumber(row['quantity']) ?? 0;
      const vat = this.toNumber(row['vat']) ?? 0;
      row['lineAmount'] = this.round2(quantity * unitCost);
      row['amountIncludingVat'] = this.round2((this.toNumber(row['lineAmount']) ?? 0) + vat);
    }
  }

  private resolveDefaultLineType(registry: LineMasterRegistry): string {
    const typeColumn = purchaseInvoiceLineColumns.find((column) => column.field === 'type');
    const firstOptionValue = Array.isArray(typeColumn?.options) && typeColumn.options.length
      ? this.toText(typeColumn.options[0].value)
      : '';

    return firstOptionValue || registry.defaultType;
  }

  private setHeaderDropdownRecords(source: Record<string, Record<string, unknown>[]>): void {
    const next: Record<string, Record<string, unknown>[]> = {};
    for (const [key, records] of Object.entries(source)) {
      next[key] = this.toRecordList(records);
    }

    this.headerDropdownRecords = next;
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
    return this.toRecords(response).filter((record): record is Record<string, unknown> => this.isRecord(record));
  }

  private toODataString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).replace(/'/g, "''").trim();
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
      if (!normalized.length) {
        return null;
      }

      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private toBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') {
        return true;
      }

      if (normalized === 'false') {
        return false;
      }
    }

    return null;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private getErrorMessage(error: unknown): string {
    return this.apiError.toMessage(error, GENERIC_MESSAGES.requestFailed);
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
