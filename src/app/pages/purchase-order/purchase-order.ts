import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SessionService } from '../../core/services/session.service';
import {
  ActionDispatcherService,
  ApiErrorService,
  ConfirmationService,
  DataSourceService,
  DraftCreateService,
  EntryAttachmentsConfig,
  EntryDialogConfig,
  EntryLineTotalsConfig,
  EntryStatusMessage,
  EntryPayloadService,
  EntryRecordService,
  EntryStateService,
  FieldValidationService,
  GENERIC_MESSAGES,
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
  purchaseOrderAttachmentsDefault,
  purchaseOrderDetailToolbarButtons,
  purchaseOrderDialogTitle,
  purchaseOrderHeaderCommandBar,
  purchaseOrderHeaderSections,
  purchaseOrderHeaderToolbarButtons,
  purchaseOrderLineCommandBar,
  purchaseOrderLineColumns,
  purchaseOrderLineIdentifierFields,
  purchaseOrderLineAmountFields,
  purchaseOrderLineDataSource,
  purchaseOrderLineMasterEndpoints,
  purchaseOrderLineMasterOptionFields,
  purchaseOrderLineSelectionStrategy,
  purchaseOrderLinePlacement,
  purchaseOrderLineToolbarButtons,
  purchaseOrderModifiedAtKey,
  purchaseOrderLineTotalsDefault,
  purchaseOrderListDataSource,
  purchaseOrderListCommandsConfig,
  purchaseOrderListPageConfig
} from './purchase-order.config';

@Component({
  selector: 'app-purchase-order',
  standalone: true,
  imports: [ListPageComponent, ListFilterPanelComponent, PopupHostComponent],
  templateUrl: './purchase-order.html'
})
export class PurchaseOrderPage implements OnInit, OnDestroy {
  private readonly actionDispatcher = inject(ActionDispatcherService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly dataSource = inject(DataSourceService);
  private readonly draftCreate = inject(DraftCreateService);
  private readonly entryPayload = inject(EntryPayloadService);
  private readonly entryRecord = inject(EntryRecordService);
  private readonly entryState = inject(EntryStateService);
  private readonly fieldValidation = inject(FieldValidationService);
  private readonly apiError = inject(ApiErrorService);
  private readonly lineMasters = inject(LineMasterService);
  private readonly lineCommands = inject(LineCommandService);
  private readonly listFilterState = inject(ListFilterStateService);
  private readonly masterData = inject(MasterDataService);
  private readonly pageCommands = inject(PageCommandService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly popupStack = inject(PopupStackService);
  private readonly sessionService = inject(SessionService);
  private readonly subscriptions = new Subscription();
  private readonly headerFieldValueTypeMap = this.entryState.buildFieldValueTypeMap(purchaseOrderHeaderSections);
  private readonly headerFieldConfigMap = this.entryState.buildFieldConfigMap(purchaseOrderHeaderSections);
  private readonly defaultSaveFailedMessage = GENERIC_MESSAGES.saveFailedDefault;
  private draftCreateInProgress = false;
  private pendingDraftCreateFromNew = false;
  private autosaveDeferredUntilDraftCreate = false;
  private pendingListSyncRecord?: Record<string, unknown>;
  private activeLineRow?: Record<string, unknown>;
  private selectedLineIndexes: number[] = [];

  readonly listPageConfig = purchaseOrderListPageConfig;
  readonly listFilterScope = this.listPageConfig.dataSurface?.id ?? this.listPageConfig.id ?? 'list-page';
  readonly listFilterStorageKey = this.listPageConfig.filterConfig?.storageKey ?? this.listFilterScope;

  loading = false;
  popupLoading = false;
  popupLoadingMessage = 'Loading purchase order...';
  error?: string;
  hasMore = true;
  rows: unknown[] = [];
  selectedRow?: unknown;
  private listLoadSubscription?: Subscription;
  private activeEntryDialogConfig?: EntryDialogConfig;
  private glAccountOptions: Array<{ label: string; value: string }> = [];
  private itemOptions: Array<{ label: string; value: string }> = [];
  private fixedAssetOptions: Array<{ label: string; value: string }> = [];
  private unitOfMeasureOptions: Array<{ label: string; value: string }> = [];
  private locationOptions: Array<{ label: string; value: string }> = [];
  private headerDropdownRecords: Record<string, Record<string, unknown>[]> = {};
  private glAccountRecords: Record<string, unknown>[] = [];
  private itemRecords: Record<string, unknown>[] = [];
  private fixedAssetRecords: Record<string, unknown>[] = [];
  private checkedRowKeys = new Set<string>();

  constructor() {
    this.popupStack.closeAll();
  }

  ngOnInit(): void {
    this.actionDispatcher.setPageCommands(purchaseOrderListCommandsConfig);
    this.actionDispatcher.setPageContext({
      title: this.listPageConfig.title,
      module: this.listPageConfig.module,
      company: this.listPageConfig.company,
      viewSuffix: this.listPageConfig.viewSuffix,
      tools: this.listPageConfig.tools
    });
    this.listFilterState.initializeFromConfig(
      this.listFilterScope,
      purchaseOrderListPageConfig,
      purchaseOrderListDataSource.defaultFilter
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
    this.entryState.clearAutosave('purchase-order-entry');
    this.subscriptions.unsubscribe();
  }

  handlePopupAction(event: { popupId: string; actionKey: string; payload?: unknown }): void {
    this.entryState.handleEntryPopupAction(event, 'purchase-order-entry', {
      lineChanged: (payload) => this.handlePurchaseOrderLineChanged(payload),
      lineSelectionChanged: (payload) => this.handlePurchaseOrderLineSelectionChanged(payload),
      headerChanged: (payload) => this.handlePurchaseOrderHeaderChanged(payload),
      headerInteracted: (payload) => this.handlePurchaseOrderHeaderInteracted(payload),
      autosave: () => this.queueLocalAutosave(),
      commands: {
        save: () => this.queueLocalAutosave(),
        validate: (payload) => this.handleEntryCommand('validate', payload),
        release: (payload) => this.handleEntryCommand('release', payload),
        apply: (payload) => this.handleEntryCommand('apply', payload),
        clear: (payload) => this.handleEntryCommand('clear', payload),
        lineNew: (payload) => this.handleEntryCommand('line-new', payload),
        lineInsert: (payload) => this.handleEntryCommand('line-insert', payload),
        reopen: (payload) => this.handleEntryCommand('reopen', payload),
        prepayment: (payload) => this.handleEntryCommand('prepayment', payload),
        command: (command, payload) => this.handleEntryCommand(command, payload)
      }
    });
  }

  handlePopupClosed(event: { popupId: string; entryDialogConfig?: EntryDialogConfig }): void {
    if (event.popupId !== 'purchase-order-entry') {
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

  openPurchaseOrder(row: unknown, preserveLoader = false): void {
    if (!preserveLoader) {
      this.startPopupLoading('Loading purchase order...');
    } else {
      this.popupLoadingMessage = 'Loading purchase order...';
    }

    const hasPersistedId = this.hasPersistedIdentity(row);
    this.pendingDraftCreateFromNew = !hasPersistedId && Boolean(purchaseOrderListDataSource.autoGenerateNumber)
      && Boolean(purchaseOrderListDataSource.lazyCreateOnFirstInput);
    this.autosaveDeferredUntilDraftCreate = false;
    this.pendingListSyncRecord = undefined;

    if (!this.isRecord(row)) {
      this.openPurchaseOrderPopup(row, []);
      this.stopPopupLoading();
      return;
    }

    const documentNo = this.toODataString(row['number']);

    const lineDataSource = {
      ...purchaseOrderLineDataSource,
      defaultFilter: `documentType eq 'Order' and documentNo eq '${documentNo}'`
    };

    const masters$ = this.loadLineMasterOptions();
    const lines$ = documentNo
      ? this.dataSource.loadList(lineDataSource, { top: 200 }).pipe(catchError(() => of([] as unknown[])))
      : of([] as unknown[]);
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
          this.openPurchaseOrderPopup(row, this.toRecords(lines));
          this.stopPopupLoading();
        },
        error: () => {
          this.stopPopupLoading();
        }
      })
    );
  }

  private openPurchaseOrderPopup(row: unknown, lineRows: unknown[]): void {
    const entryDialogConfig = this.buildPurchaseOrderEntryDialogConfig(row, lineRows);
    this.activeEntryDialogConfig = entryDialogConfig;
    this.activeLineRow = undefined;
    this.selectedLineIndexes = [];

    this.popupStack.open({
      id: 'purchase-order-entry',
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
    this.startPopupLoading('Preparing purchase order...');
    this.pendingDraftCreateFromNew = Boolean(purchaseOrderListDataSource.autoGenerateNumber)
      && Boolean(purchaseOrderListDataSource.lazyCreateOnFirstInput);
    this.draftCreateInProgress = false;
    this.autosaveDeferredUntilDraftCreate = false;
    this.openPurchaseOrder(this.buildNewHeaderSeed(''), true);
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

  private async deleteSelectedRow(): Promise<void> {
    const targets = this.resolveDeleteTargets();
    if (!targets.length) {
      return;
    }

    const confirmed = await this.confirmation.confirmIntent({
      intent: 'delete',
      count: targets.length,
      entity: 'purchaseOrder'
    });

    if (!confirmed) {
      return;
    }

    const operations = targets.map((target) => {
      if (target.id === null || target.id === undefined || target.id === '') {
        return of({ key: target.key, success: true, error: undefined as unknown });
      }

      return this.dataSource.delete(purchaseOrderListDataSource, target.id).pipe(
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
          this.setEntryStatus({
            tone: 'error',
            title: GENERIC_MESSAGES.deleteFailedTitle,
            message: this.error || GENERIC_MESSAGES.deleteFailedMessage
          });
          this.changeDetector.detectChanges();
          return;
        }

        this.error = undefined;
        this.changeDetector.detectChanges();
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

    const pageSize = purchaseOrderListDataSource.pageSize ?? 20;
    const skip = reset ? 0 : this.rows.length;
    const effectiveFilter = this.listFilterState.buildFilter(this.listFilterScope);
    const effectiveListDataSource = {
      ...purchaseOrderListDataSource,
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

  private getDocumentTitle(row: unknown): string {
    if (!this.isRecord(row)) {
      return 'Purchase Order';
    }

    return `Purchase Order ${row['number'] ?? ''}`.trim();
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

  private getErrorMessage(error: unknown): string {
    return this.apiError.toMessage(error, GENERIC_MESSAGES.listLoadFailed);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toODataString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).replace(/'/g, "''").trim();
  }

  private getRowKey(row: unknown): string {
    if (!this.isRecord(row)) {
      return '';
    }

    const value = row['systemId'] ?? row['id'] ?? row['number'];
    return value === null || value === undefined ? '' : String(value);
  }

  private resolveHeaderSystemId(record: Record<string, unknown> | undefined): string {
    if (!record) {
      return '';
    }

    return this.toText(record['systemId'] ?? record['systemId']).trim();
  }

  private buildPurchaseOrderEntryDialogConfig(row?: unknown, lineSource?: unknown[]): EntryDialogConfig {
    const record = this.isRecord(row) ? row : {};
    const lines = Array.isArray(lineSource) ? lineSource : [];

    const orderNumber = this.toText(record['number'] ?? record['no']) || 'New';
    const vendorName = this.toText(record['buyFromVendorName']);
    const status = this.toText(record['status']) || this.getHeaderDefaultText('status');
    const postingDate = this.toText(record['postingDate']) || '';
    const orderDate = this.toText(record['orderDate']) || postingDate;
    const currency = this.toText(record['currencyCode']) || this.getHeaderDefaultText('CurrencyCode');

    const attachments: EntryAttachmentsConfig = {
      headerFilesCount: this.toNumber(record['HeaderAttachmentCount']) ?? purchaseOrderAttachmentsDefault.headerFilesCount,
      lineFilesCount: this.toNumber(record['LineAttachmentCount']) ?? purchaseOrderAttachmentsDefault.lineFilesCount,
      canUpload: this.toBoolean(record['CanUploadAttachment']) ?? purchaseOrderAttachmentsDefault.canUpload,
      primaryActionLabel: this.toText(record['AttachmentActionLabel']) || purchaseOrderAttachmentsDefault.primaryActionLabel,
      primaryActionKey: this.toText(record['AttachmentActionKey']) || purchaseOrderAttachmentsDefault.primaryActionKey
    };

    const headerData = this.buildPurchaseOrderHeaderData(record);
    const lineRows = this.buildPurchaseOrderLineRows(record, lines);
    const lineTotals = this.buildPurchaseOrderLineTotals(lineRows, currency);

    return {
      pageLabel: purchaseOrderDialogTitle.toUpperCase(),
      title: `${purchaseOrderDialogTitle} ${orderNumber}`,
      subtitle: `${vendorName || 'New'} - ${status}`,
      headerCommandBar: purchaseOrderHeaderCommandBar,
      lineCommandBar: purchaseOrderLineCommandBar,
      lineCommandPolicy: {
        injectDefaultLineNew: false,
        injectDefaultLineDelete: false
      },
      linePlacement: purchaseOrderLinePlacement,
      headerToolbarButtons: purchaseOrderHeaderToolbarButtons,
      lineToolbarButtons: purchaseOrderLineToolbarButtons.map((button) => ({ ...button })),
      detailToolbarButtons: purchaseOrderDetailToolbarButtons,
      headerSections: purchaseOrderHeaderSections,
      headerData,
      lineColumns: purchaseOrderLineColumns,
      lineRows,
      lineTotals,
      attachments
    };
  }

  private buildPurchaseOrderLineRows(
    record: Record<string, unknown>,
    lines: unknown[]
  ): Record<string, unknown>[] {
    const registry = this.getLineMasterRegistry();
    const optionFieldMap = this.getLineOptionFieldMap();
    const recordDocumentType = this.toText(record['documentType'] ?? record['documentType']).trim();

    if (lines.length) {
      return lines.filter((line): line is Record<string, unknown> => this.isRecord(line)).map((line) => ({
        systemId: line['systemId'] ?? line['systemId'] ?? line['id'] ?? line['id'] ?? '',
        id: line['id'] ?? line['id'] ?? line['systemId'] ?? line['systemId'] ?? '',
        lineNo: this.resolveLineNoFromRecord(line),
        documentNo: this.toText(line['documentNo'] ?? record['number']),
        documentType: this.toText(line['documentType'] ?? line['documentType'] ?? recordDocumentType),
        type: this.lineMasters.resolveType(line['type'], registry),
        no: this.toText(line['no'] ?? line['number']),
        description: this.toText(line['description'] ?? line['description2']),
        unitOfMeasure: this.toText(line['unitOfMeasureCode'] ?? line['unitOfMeasure'] ?? line['baseUnitOfMeasure']),
        locationCode: this.toText(line['locationCode']),
        quantity: this.toNumber(line['quantity']) ?? 0,
        originalCost: this.toNumber(line['originalCost']) ?? 0,
        tax: this.toNumber(line['tax']) ?? 0,
        directUnitCost: this.toNumber(line['directUnitCost'] ?? line['unitCost']) ?? 0,
        lineDiscountAmount: this.toNumber(line['lineDiscountAmount']) ?? 0,
        qtyToReceive: this.toNumber(line['qtyToReceive']) ?? 0,
        quantityReceived: this.toNumber(line['quantityReceived']) ?? 0,
        qtyToInvoice: this.toNumber(line['qtyToInvoice']) ?? 0,
        quantityInvoiced: this.toNumber(line['quantityInvoiced']) ?? 0,
        lineAmount: this.toNumber(line['lineAmount']) ?? 0,
        amountToInvoice: this.toNumber(line['amountToInvoice']) ?? 0,
        amountInvoiced: this.toNumber(line['amountInvoiced']) ?? 0,
        LineStatus: this.toText(record['status']) || this.getHeaderDefaultText('status'),
        ...this.buildRowOptions(this.lineMasters.resolveType(line['type'], registry), registry, optionFieldMap)
      }));
    }

    return [
      this.createEmptyLineRow(this.toText(record['status']) || this.getHeaderDefaultText('status'), registry, optionFieldMap)
    ];
  }

  private buildPurchaseOrderLineTotals(
    lineRows: Record<string, unknown>[],
    currencyCode: string
  ): EntryLineTotalsConfig {
    const subtotal = lineRows.reduce((sum, row) => sum + (this.toNumber(row['lineAmount']) ?? 0), 0);
    const amountToInvoice = lineRows.reduce((sum, row) => sum + (this.toNumber(row['amountToInvoice']) ?? 0), 0);
    const amountInvoiced = lineRows.reduce((sum, row) => sum + (this.toNumber(row['amountInvoiced']) ?? 0), 0);
    const difference = amountToInvoice - amountInvoiced;

    return {
      subtotal: this.formatAmount(subtotal, currencyCode),
      sst: purchaseOrderLineTotalsDefault.sst,
      total: this.formatAmount(amountToInvoice, currencyCode),
      difference: this.formatAmount(difference, currencyCode)
    };
  }

  private formatAmount(amount: number, currencyCode: string): string {
    return `${currencyCode} ${this.formatNumber(amount)}`;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
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

  private loadLineMasterOptions() {
    const unitOfMeasureEndpoints = this.getLineColumnEndpoints('unitOfMeasure');
    const locationEndpoints = this.getLineColumnEndpoints('locationCode');

    return this.masterData.loadMasterLists({
      glAccounts: purchaseOrderLineMasterEndpoints.glAccounts,
      items: purchaseOrderLineMasterEndpoints.items,
      fixedAssets: purchaseOrderLineMasterEndpoints.fixedAssets,
      unitOfMeasures: unitOfMeasureEndpoints,
      locations: locationEndpoints
    }).pipe(
      map((masters) => ({
        glAccountsRecords: masters.glAccounts,
        itemsRecords: masters.items,
        fixedAssetsRecords: masters.fixedAssets,
        glAccounts: this.masterData.toSelectOptions(
          masters.glAccounts,
          purchaseOrderLineMasterOptionFields.glAccounts.valueFields,
          purchaseOrderLineMasterOptionFields.glAccounts.labelFields
        ),
        items: this.masterData.toSelectOptions(
          masters.items,
          purchaseOrderLineMasterOptionFields.items.valueFields,
          purchaseOrderLineMasterOptionFields.items.labelFields
        ),
        fixedAssets: this.masterData.toSelectOptions(
          masters.fixedAssets,
          purchaseOrderLineMasterOptionFields.fixedAssets.valueFields,
          purchaseOrderLineMasterOptionFields.fixedAssets.labelFields
        ),
        unitOfMeasures: this.masterData.toSelectOptions(
          masters.unitOfMeasures,
          purchaseOrderLineMasterOptionFields.unitOfMeasures.valueFields,
          purchaseOrderLineMasterOptionFields.unitOfMeasures.labelFields
        ),
        locations: this.masterData.toSelectOptions(
          masters.locations,
          purchaseOrderLineMasterOptionFields.locations.valueFields,
          purchaseOrderLineMasterOptionFields.locations.labelFields
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

  private toRecordList(source: unknown): Record<string, unknown>[] {
    return this.toRecords(source).filter((record): record is Record<string, unknown> => this.isRecord(record));
  }

  private handlePurchaseOrderLineChanged(payload: unknown): void {
    const change = this.entryState.resolveLineChange(payload);
    if (!change) {
      return;
    }

    const { row, field, value } = change;
    this.activeLineRow = row;

    if (field !== 'type') {
      const fieldsToPersist = new Set<string>([field]);
      if (field === 'no') {
        this.applyNumberSelection(row);
        fieldsToPersist.add('description');
        fieldsToPersist.add('unitOfMeasure');
        fieldsToPersist.add('directUnitCost');
        fieldsToPersist.add('lineAmount');
        fieldsToPersist.add('amountToInvoice');
      } else if (field === 'quantity' || field === 'directUnitCost' || field === 'qtyToInvoice') {
        this.entryState.recalculateLineAmounts(row, purchaseOrderLineAmountFields);
        fieldsToPersist.add('lineAmount');
        fieldsToPersist.add('amountToInvoice');
      }

      this.clearEntryStatus();
      this.savePurchaseOrderLineFields(row, [...fieldsToPersist]);
      return;
    }

    this.lineMasters.applyTypeChange(row, value, this.getLineMasterRegistry(), {
      clearFields: this.getLineFieldsByValueType('text').filter((fieldName) => fieldName !== 'type'),
      zeroFields: this.getLineFieldsByValueType('number'),
      optionFieldMap: this.getLineOptionFieldMap(),
      numberOptionFieldKey: this.getLineColumnOptionsDataKey('no')
    });
    this.clearEntryStatus();
    this.savePurchaseOrderLineFields(row, ['type']);
    this.changeDetector.detectChanges();
  }

  private handlePurchaseOrderLineSelectionChanged(payload: unknown): void {
    if (!this.isRecord(payload)) {
      return;
    }

    const activeRow = payload['activeRow'];
    if (this.isRecord(activeRow)) {
      this.activeLineRow = activeRow;
    }

    this.selectedLineIndexes = this.lineCommands.planDeleteRequest({
      lineRows: this.activeEntryDialogConfig?.lineRows ?? [],
      payload,
      selectedIndexes: this.selectedLineIndexes
    }).selectedIndexes;
  }

  private applyNumberSelection(row: Record<string, unknown>): void {
    const registry = this.getLineMasterRegistry();
    const type = this.lineMasters.resolveType(row['type'], registry);
    const master = this.lineMasters.findRecordByNumber(type, row['no'], registry, purchaseOrderLineIdentifierFields);
    if (!master) {
      return;
    }

    const unitCost = this.lineMasters.applySelection(row, master, purchaseOrderLineSelectionStrategy);
    if (unitCost > 0) {
      this.entryState.recalculateLineAmounts(row, purchaseOrderLineAmountFields);
    }
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

    const unitOfMeasureOptionsKey = this.getLineColumnOptionsDataKey('unitOfMeasure');
    const locationOptionsKey = this.getLineColumnOptionsDataKey('locationCode');

    if (unitOfMeasureOptionsKey) {
      optionFieldMap[unitOfMeasureOptionsKey] = this.unitOfMeasureOptions;
    }

    if (locationOptionsKey) {
      optionFieldMap[locationOptionsKey] = this.locationOptions;
    }

    return optionFieldMap;
  }

  private getLineColumnOptionsDataKey(fieldName: string): string {
    const column = purchaseOrderLineColumns.find((item) => String(item.field ?? item.id) === fieldName);
    return column?.optionsDataKey?.trim() ?? '';
  }

  private getLineColumnEndpoints(fieldName: string): string[] {
    const column = purchaseOrderLineColumns.find((item) => String(item.field ?? item.id) === fieldName);
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

    row['id'] = '';
    this.lineMasters.assignTypeOptions(row, type, registry, optionFieldMap, this.getLineColumnOptionsDataKey('no'));
    return row;
  }

  private getLineFieldsByValueType(valueType: 'text' | 'number' | 'boolean' | 'date'): string[] {
    return purchaseOrderLineColumns
      .filter((column) => column.valueType === valueType)
      .map((column) => String(column.field ?? column.id));
  }

  private buildPurchaseOrderHeaderData(record: Record<string, unknown>): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    data['systemId'] = this.toText(record['systemId'] ?? record['systemId']);
    data['id'] = record['id'] ?? record['id'] ?? '';
    data['documentType'] = this.toText(record['documentType'] ?? record['documentType']);
    data['documentType'] = this.toText(record['documentType'] ?? record['documentType']);

    for (const section of purchaseOrderHeaderSections) {
      for (const field of section.fields) {
        const source = record[field.key];
        const fallback = source === null || source === undefined || source === ''
          ? field.defaultValue
          : source;
        data[field.key] = this.toText(fallback);
      }
    }

    data['status'] = this.toText(record['status']) || this.getHeaderDefaultText('status');
    data['pendingApproversId'] = this.toText(record['pendingApproversId']) || 'None';
    data['grnReviewStatus'] = this.toText(record['grnReviewStatus']) || this.getHeaderDefaultText('grnReviewStatus');
    data['invoiceReviewStatus'] = this.toText(record['invoiceReviewStatus']) || this.getHeaderDefaultText('invoiceReviewStatus');
    data['approvalStatus'] = this.toText(record['approvalStatus']) || this.getHeaderDefaultText('approvalStatus');
    data['systemModifiedAt'] = this.toText(record['systemModifiedAt']) || this.getHeaderDefaultText('systemModifiedAt');
    data['buyFromVendorNumber'] = this.toText(
      record['buyFromVendorNumber'] ?? record['buyFromVendorNumber'] ?? record['VendorNo'] ?? record['VendorNumber']
    );

    for (const section of purchaseOrderHeaderSections) {
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

  private setHeaderDropdownRecords(source: Record<string, Record<string, unknown>[]>): void {
    const next: Record<string, Record<string, unknown>[]> = {};
    for (const [key, records] of Object.entries(source)) {
      next[key] = this.toRecordList(records);
    }

    this.headerDropdownRecords = next;
  }

  private buildNewHeaderSeed(generatedNo: string): Record<string, unknown> {
    const seed: Record<string, unknown> = {};

    for (const section of purchaseOrderHeaderSections) {
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

    for (const section of purchaseOrderHeaderSections) {
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

  private createDraftPurchaseOrder(newRecord: Record<string, unknown>): Observable<Record<string, unknown> | null> {
    const payload = this.buildDraftCreatePayload(newRecord);
    return this.draftCreate.createWithUnknownPropertyFallback(purchaseOrderListDataSource, payload).pipe(
      map((response) => {
        const created = this.toCreatedRecord(response);
        return created;
      }),
      catchError(() => of(null))
    );
  }

  private buildDraftCreatePayload(newRecord: Record<string, unknown>): Record<string, unknown> {
    void newRecord;
    return this.entryPayload.buildSessionCreatePayload();
  }

  private toCreatedRecord(response: unknown): Record<string, unknown> | null {
    if (this.isRecord(response)) {
      return response;
    }

    const first = this.toRecords(response)[0];
    return this.isRecord(first) ? first : null;
  }

  private hasPersistedIdentity(record: unknown): boolean {
    if (!this.isRecord(record)) {
      return false;
    }

    return this.resolveHeaderSystemId(record).length > 0;
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
      'systemId',
      'documentType',
      'documentType',
      'id',
      'number',
      'no',
      'buyFromVendorNumber',
      'buyFromVendorName',
      'orderDate',
      'postingDate',
      'status',
      'CurrencyCode',
      'amountIncludingVat',
      'approvalStatus',
      'grnReviewStatus',
      'invoiceReviewStatus',
      'pendingApproversId',
      'systemModifiedAt'
    ];

    for (const key of keysToSync) {
      if (key in source) {
        target[key] = source[key];
      }
    }

    return target;
  }

  private stageListSyncFromActiveHeader(): void {
    if (!this.activeEntryDialogConfig?.headerData || !this.hasPersistedIdentity(this.activeEntryDialogConfig.headerData)) {
      return;
    }

    this.pendingListSyncRecord = this.buildListSyncRecord(this.activeEntryDialogConfig.headerData);
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

  private handlePurchaseOrderHeaderChanged(payload: unknown): void {
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

    this.clearEntryStatus();

    const changed = this.entryState.applyHeaderFieldChange(
      this.activeEntryDialogConfig.headerData,
      payload,
      this.headerFieldValueTypeMap
    );
    if (changed) {
      this.savePurchaseOrderHeaderFields(payload);
      this.changeDetector.detectChanges();
    }
  }

  private savePurchaseOrderHeaderFields(payload: Record<string, unknown>): void {
    if (!this.activeEntryDialogConfig?.headerData) {
      return;
    }

    if (this.pendingDraftCreateFromNew || this.draftCreateInProgress || !this.hasPersistedIdentity(this.activeEntryDialogConfig.headerData)) {
      this.autosaveDeferredUntilDraftCreate = true;
      return;
    }

    const fieldKey = this.toText(payload['fieldKey']).trim();
    if (!fieldKey.length) {
      return;
    }

    const headerSystemId = this.resolveHeaderSystemId(this.activeEntryDialogConfig.headerData);
    if (!headerSystemId.length) {
      this.autosaveDeferredUntilDraftCreate = true;
      return;
    }

    const updatePayload: Record<string, unknown> = {
      [fieldKey]: this.activeEntryDialogConfig.headerData[fieldKey]
    };

    if (this.isRecord(payload['updates'])) {
      for (const [key, value] of Object.entries(payload['updates'])) {
        updatePayload[key] = value;
      }
    }

    this.stripIdentityFields(updatePayload);
    if (!Object.keys(updatePayload).length) {
      return;
    }

    this.subscriptions.add(
      this.dataSource.update(purchaseOrderListDataSource, headerSystemId, updatePayload).pipe(
        catchError((error: unknown) => {
          const rolledBack = this.entryState.rollbackHeaderFieldChange(
            this.activeEntryDialogConfig?.headerData ?? {},
            payload,
            this.headerFieldValueTypeMap
          );
          if (rolledBack) {
            this.changeDetector.detectChanges();
          }

          this.setEntryStatus({
            tone: 'error',
            title: 'Save failed',
            message: this.getErrorMessage(error) || this.defaultSaveFailedMessage
          });
          this.changeDetector.detectChanges();
          return of(undefined);
        })
      ).subscribe((updated) => {
        if (!this.isRecord(updated) || !this.activeEntryDialogConfig?.headerData) {
          return;
        }

        Object.assign(this.activeEntryDialogConfig.headerData, updated);
        this.stageListSyncFromActiveHeader();
        this.changeDetector.detectChanges();
      })
    );
  }

  private savePurchaseOrderLineFields(row: Record<string, unknown>, fields: string[]): void {
    if (!this.activeEntryDialogConfig?.headerData) {
      return;
    }

    if (this.pendingDraftCreateFromNew || this.draftCreateInProgress || !this.hasPersistedIdentity(this.activeEntryDialogConfig.headerData)) {
      this.autosaveDeferredUntilDraftCreate = true;
      return;
    }

    const uniqueFields = [...new Set(fields.map((field) => field.trim()).filter((field) => field.length > 0))];
    if (!uniqueFields.length) {
      return;
    }

    if (!this.toText(row['documentNo']).trim()) {
      row['documentNo'] = this.toText(
        this.activeEntryDialogConfig.headerData['documentNo']
        ?? this.activeEntryDialogConfig.headerData['number']
        ?? this.activeEntryDialogConfig.headerData['no']
      ).trim();
    }

    if (!this.toText(row['documentType']).trim()) {
      row['documentType'] = this.toText(
        this.activeEntryDialogConfig.headerData['documentType']
        ?? this.activeEntryDialogConfig.headerData['documentType']
      ).trim();
    }

    const rowSystemId = this.toText(row['systemId']).trim();
    if (!rowSystemId.length) {
      const lineNo = this.resolveNextPurchaseOrderLineNo(row);
      if (lineNo > 0) {
        row['lineNo'] = lineNo;
      }

      const payload = this.buildPurchaseOrderLineCreatePayload(row);
      if (!payload) {
        this.setEntryStatus({
          tone: 'error',
          title: 'Line not saved',
          message: 'Please provide Document Type, Type and No before saving the line.'
        });
        this.changeDetector.detectChanges();
        return;
      }

      console.log('FINAL PO LINE CREATE PAYLOAD', payload);

      this.subscriptions.add(
        this.dataSource.create(purchaseOrderLineDataSource, payload).pipe(
          catchError((error: unknown) => {
            if (this.isDuplicateLineZeroError(error)) {
              const fallbackPayload = {
                ...payload,
                lineNo: this.resolveNextPurchaseOrderLineNo(row)
              };

              console.warn('Retry PO LINE CREATE PAYLOAD with LineNo', fallbackPayload);

              return this.dataSource.create(purchaseOrderLineDataSource, fallbackPayload).pipe(
                catchError((retryError: unknown) => {
                  this.setEntryStatus({
                    tone: 'error',
                    title: 'Save failed',
                    message: this.getErrorMessage(retryError) || this.defaultSaveFailedMessage
                  });
                  this.changeDetector.detectChanges();
                  return of(undefined);
                })
              );
            }

            this.setEntryStatus({
              tone: 'error',
              title: 'Save failed',
              message: this.getErrorMessage(error) || this.defaultSaveFailedMessage
            });
            this.changeDetector.detectChanges();
            return of(undefined);
          })
        ).subscribe((created) => {
          if (!this.isRecord(created)) {
            this.setEntryStatus({
              tone: 'error',
              title: 'Line not saved',
              message: 'The server did not return a saved line record.'
            });
            this.changeDetector.detectChanges();
            return;
          }

          Object.assign(row, created);
          const createdSystemId = this.toText(row['systemId']).trim();
          if (!createdSystemId.length) {
            this.setEntryStatus({
              tone: 'error',
              title: 'Line not saved',
              message: 'Saved response is missing SystemId. Refresh and try again.'
            });
            this.changeDetector.detectChanges();
            return;
          }

          this.recalculateActiveLineTotals();
          this.changeDetector.detectChanges();
        })
      );

      return;
    }

    const field = uniqueFields[0];
    const payload: Record<string, unknown> = {
      [field]: row[field]
    };

    this.stripIdentityFields(payload);

    this.subscriptions.add(
      this.dataSource.update(purchaseOrderLineDataSource, rowSystemId, payload).pipe(
        catchError((error: unknown) => {
          this.setEntryStatus({
            tone: 'error',
            title: 'Save failed',
            message: this.getErrorMessage(error) || this.defaultSaveFailedMessage
          });
          this.changeDetector.detectChanges();
          return of(undefined);
        })
      ).subscribe((updated) => {
        if (!this.isRecord(updated)) {
          return;
        }

        Object.assign(row, updated);
        this.recalculateActiveLineTotals();
        this.changeDetector.detectChanges();
      })
    );
  }

  private buildPurchaseOrderLineCreatePayload(row: Record<string, unknown>): Record<string, unknown> | null {
    const apiNo = this.toText(row['no']).trim();
    const documentNo = this.toText(row['documentNo']).trim();
    const type = this.toText(row['type']).trim();
    const lineNo = this.resolveLineNoFromRecord(row);
    const documentType = this.toText(
      row['documentType']
      ?? row['documentType']
      ?? this.activeEntryDialogConfig?.headerData?.['documentType']
      ?? this.activeEntryDialogConfig?.headerData?.['documentType']
    ).trim();

    if (!documentNo || !type || !apiNo || !documentType || lineNo <= 0) {
      return null;
    }

    const quantity = this.toNumber(row['quantity']);

    const payload: Record<string, unknown> = {
      documentType: documentType,
      documentNo: documentNo,
      lineNo: lineNo,
      type: this.normalizePurchaseLineType(type),
      no: apiNo
    };

    if (quantity !== null && quantity > 0) {
      payload['quantity'] = quantity;
    }

    return payload;
  }

  private isDuplicateLineZeroError(error: unknown): boolean {
    const normalized = JSON.stringify(error ?? '').toLowerCase();
    return normalized.includes('internal_entitywithsamekeyexists')
      && normalized.includes("line no.='0'");
  }

  private resolveNextPurchaseOrderLineNo(targetRow: Record<string, unknown>): number {
    const lineRows = this.activeEntryDialogConfig?.lineRows ?? [];
    const existingLineNos = new Set<number>();
    let maxLineNo = 0;

    for (const line of lineRows) {
      if (line === targetRow) {
        continue;
      }

      const lineSystemId = this.toText(line['systemId']).trim();
      if (!lineSystemId.length) {
        continue;
      }

      const value = this.resolveLineNoFromRecord(line);
      if (value <= 0) {
        continue;
      }

      existingLineNos.add(value);
      if (value > maxLineNo) {
        maxLineNo = value;
      }
    }

    let candidate = maxLineNo > 0 ? maxLineNo + 10000 : 10000;

    if (candidate <= 0) {
      candidate = 10000;
    }

    while (existingLineNos.has(candidate)) {
      candidate += 10000;
    }

    return candidate;
  }

  private resolveLineNoFromRecord(record: Record<string, unknown>): number {
    const candidates = [
      record['lineNo'],
      record['lineNo'],
      record['Line_No'],
      record['line_no'],
      record['Line No.']
    ];

    for (const candidate of candidates) {
      const value = this.toNumber(candidate);
      if (value !== null && value > 0) {
        return value;
      }
    }

    return 0;
  }

  private normalizePurchaseLineType(type: unknown): string {
    const normalized = this.toText(type).trim();
    if (normalized === 'Comment') {
      return ' ';
    }

    return normalized;
  }

  private stripIdentityFields(payload: Record<string, unknown>): void {
    delete payload['id'];
    delete payload['id'];
    delete payload['systemId'];
    delete payload['systemId'];
  }

  private handlePurchaseOrderHeaderInteracted(payload: unknown): void {
    if (!this.pendingDraftCreateFromNew || this.draftCreateInProgress) {
      return;
    }

    if (!this.isRecord(payload)) {
      return;
    }

    const fieldKey = this.toText(payload['fieldKey']);
    const fieldConfig = this.headerFieldConfigMap[fieldKey];
    if (!fieldKey.length || !fieldConfig || fieldConfig.readonly || fieldConfig.disabled) {
      return;
    }

    if (!this.activeEntryDialogConfig?.headerData || this.hasPersistedIdentity(this.activeEntryDialogConfig.headerData)) {
      this.pendingDraftCreateFromNew = false;
      return;
    }

    this.draftCreateInProgress = true;
    this.startPopupLoading('Creating purchase order draft...');

    this.subscriptions.add(
      this.createDraftPurchaseOrder(this.activeEntryDialogConfig.headerData).subscribe({
        next: (createdRecord) => {
          this.draftCreateInProgress = false;
          this.stopPopupLoading();

          if (!createdRecord || !this.activeEntryDialogConfig?.headerData) {
            this.setEntryStatus({
              tone: 'error',
              title: GENERIC_MESSAGES.createFailedTitle,
              message: GENERIC_MESSAGES.createFailedMessage
            });
            this.changeDetector.detectChanges();
            return;
          }

          const localEdits = { ...this.activeEntryDialogConfig.headerData };
          const createdHeader = this.buildPurchaseOrderHeaderData(createdRecord);
          Object.assign(this.activeEntryDialogConfig.headerData, createdHeader);

          for (const section of purchaseOrderHeaderSections) {
            for (const field of section.fields) {
              if (field.readonly) {
                continue;
              }

              const localValue = localEdits[field.key];
              if (localValue !== undefined && localValue !== null && String(localValue).trim().length > 0) {
                this.activeEntryDialogConfig.headerData[field.key] = localValue;
              }
            }
          }

          this.pendingListSyncRecord = this.buildListSyncRecord(createdRecord);
          this.pendingDraftCreateFromNew = false;

          if (this.autosaveDeferredUntilDraftCreate) {
            this.autosaveDeferredUntilDraftCreate = false;
            this.queueLocalAutosave();
          }

          this.changeDetector.detectChanges();
        },
        error: () => {
          this.draftCreateInProgress = false;
          this.stopPopupLoading();
          this.setEntryStatus({
            tone: 'error',
            title: GENERIC_MESSAGES.createFailedTitle,
            message: GENERIC_MESSAGES.createFailedMessage
          });
          this.changeDetector.detectChanges();
        }
      })
    );
  }

  private queueLocalAutosave(): void {
    if (!this.activeEntryDialogConfig?.headerData) {
      return;
    }

    if (this.pendingDraftCreateFromNew || this.draftCreateInProgress || !this.resolveHeaderSystemId(this.activeEntryDialogConfig.headerData).length) {
      this.autosaveDeferredUntilDraftCreate = true;
      return;
    }

    const previousSnapshot = { ...this.activeEntryDialogConfig.headerData };

    this.entryState.scheduleHeaderAutosave('purchase-order-entry', this.activeEntryDialogConfig.headerData, {
      modifiedAtKey: purchaseOrderModifiedAtKey,
      dataSourceConfig: purchaseOrderListDataSource,
      headerSections: purchaseOrderHeaderSections,
      meta: {
        page: 'purchase-order'
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

    // Shared service resolves command routing; page keeps document-specific reactions.
    this.actionDispatcher.dispatch(command, payload);
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
        id: this.entryRecord.resolveRecordId(row, purchaseOrderListDataSource)
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
      id: this.entryRecord.resolveRecordId(this.selectedRow, purchaseOrderListDataSource)
    }];
  }

  private appendNewLine(mode: 'append' | 'prepend'): void {
    if (!this.activeEntryDialogConfig) {
      return;
    }

    const lineRows = this.activeEntryDialogConfig.lineRows ?? [];
    const status = this.toText(this.activeEntryDialogConfig.headerData?.['status']) || this.getHeaderDefaultText('status');
    const newRow = this.createEmptyLineRow(status, this.getLineMasterRegistry(), this.getLineOptionFieldMap());

    this.activeEntryDialogConfig.lineRows = mode === 'prepend' ? [newRow, ...lineRows] : [...lineRows, newRow];
    this.recalculateActiveLineTotals();
    this.clearEntryStatus();
    this.queueLocalAutosave();
    this.changeDetector.detectChanges();
  }

  private async deleteLine(payload: unknown): Promise<void> {
    if (!this.activeEntryDialogConfig) {
      return;
    }

    const lineRows = this.activeEntryDialogConfig.lineRows ?? [];
    if (!lineRows.length) {
      return;
    }

    const deletePlan = this.lineCommands.planDeleteRequest({
      lineRows,
      payload,
      activeRow: this.activeLineRow,
      selectedIndexes: this.selectedLineIndexes
    });

    if (!deletePlan.targetRows.length) {
      return;
    }

    const confirmed = await this.confirmation.confirmIntent({
      intent: 'delete',
      count: deletePlan.targetRows.length,
      entityLabel: 'line'
    });

    if (!confirmed) {
      return;
    }

    const persistedIds = deletePlan.targetRows
      .map((row) => this.entryRecord.resolveRecordId(row, purchaseOrderLineDataSource))
      .filter((id) => id !== null && id !== undefined && String(id).trim().length > 0);

    this.subscriptions.add(
      this.lineCommands.executePersistedDeletes(
        persistedIds,
        (id) => this.dataSource.delete(purchaseOrderLineDataSource, id)
      ).subscribe({
        next: () => {
          const latestRows = this.activeEntryDialogConfig?.lineRows ?? [];
          const remainingRows = latestRows.filter((row) => !deletePlan.targetRows.includes(row));
          this.applyLineDeletionResult(remainingRows);
        },
        error: (error: unknown) => {
          this.setEntryStatus({
            tone: 'error',
            title: GENERIC_MESSAGES.deleteFailedTitle,
            message: this.getErrorMessage(error) || GENERIC_MESSAGES.lineDeleteFailedMessage
          });
          this.changeDetector.detectChanges();
        }
      })
    );
  }

  private applyLineDeletionResult(nextRows: Record<string, unknown>[]): void {
    if (!this.activeEntryDialogConfig) {
      return;
    }

    if (!nextRows.length) {
      const status = this.toText(this.activeEntryDialogConfig.headerData?.['status']) || this.getHeaderDefaultText('status');
      nextRows.push(this.createEmptyLineRow(status, this.getLineMasterRegistry(), this.getLineOptionFieldMap()));
    }

    this.activeEntryDialogConfig.lineRows = nextRows;
    this.activeLineRow = nextRows[nextRows.length - 1];
    this.selectedLineIndexes = [];
    this.recalculateActiveLineTotals();
    this.clearEntryStatus();
    this.queueLocalAutosave();
    this.changeDetector.detectChanges();
  }

  private createEmptyLineRow(
    status: string,
    registry: LineMasterRegistry,
    optionFieldMap: Record<string, Array<{ label: string; value: string }>>
  ): Record<string, unknown> {
    const defaultType = this.resolveDefaultLineType(registry);
    const row: Record<string, unknown> = {};

    for (const column of purchaseOrderLineColumns) {
      const field = column.field;
      if (!field) {
        continue;
      }

      if (field === 'type') {
        row[field] = defaultType;
        continue;
      }

      if (column.valueType === 'number') {
        row[field] = 0;
        continue;
      }

      row[field] = '';
    }

    row['LineStatus'] = status;
    return {
      ...row,
      ...this.buildRowOptions(defaultType, registry, optionFieldMap)
    };
  }

  private recalculateActiveLineTotals(): void {
    if (!this.activeEntryDialogConfig?.lineRows) {
      return;
    }

    const currencyCode = this.toText(this.activeEntryDialogConfig.headerData?.['currencyCode']) || this.getHeaderDefaultText('CurrencyCode');
    this.activeEntryDialogConfig.lineTotals = this.buildPurchaseOrderLineTotals(this.activeEntryDialogConfig.lineRows, currencyCode);
  }

  private resolveDefaultLineType(registry: LineMasterRegistry): string {
    const typeColumn = purchaseOrderLineColumns.find((column) => column.field === 'type');
    const firstOptionValue = Array.isArray(typeColumn?.options) && typeColumn.options.length
      ? this.toText(typeColumn.options[0].value)
      : '';

    return firstOptionValue || registry.defaultType;
  }

}
