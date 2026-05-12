import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SessionService } from '../../core/services/session.service';
import { ErpListPageComponent } from '../../shared/erp-core/components/list-page/list-page';
import { ErpListFilterPanelComponent } from '../../shared/erp-core/components/list-filter-panel/list-filter-panel';
import { ErpPopupHostComponent } from '../../shared/erp-core/components/popup-host/popup-host';
import {
  ErpEntryAttachmentsConfig,
  ErpEntryDialogConfig,
  ErpEntryLineTotalsConfig,
  ErpEntryStatusMessage,
  ErpFactPanelSectionConfig
} from '../../shared/erp-core/models/entry-dialog-config.model';
import { ActionDispatcherService } from '../../shared/erp-core/services/action-dispatcher.service';
import { DataSourceService } from '../../shared/erp-core/services/data-source.service';
import { DraftCreateService } from '../../shared/erp-core/services/draft-create.service';
import { EntryPayloadService } from '../../shared/erp-core/services/entry-payload.service';
import { EntryRecordService } from '../../shared/erp-core/services/entry-record.service';
import { EntryStateService } from '../../shared/erp-core/services/entry-state.service';
import { ErpLineMasterRegistry, LineMasterService } from '../../shared/erp-core/services/line-master.service';
import { LineCommandService } from '../../shared/erp-core/services/line-command.service';
import { ListFilterStateService } from '../../shared/erp-core/services/list-filter-state.service';
import { MasterDataService } from '../../shared/erp-core/services/master-data.service';
import { PageCommandService } from '../../shared/erp-core/services/page-command.service';
import { FieldValidationService } from '../../shared/erp-core/services/field-validation.service';
import { PopupStackService } from '../../shared/erp-core/services/popup-stack.service';
import {
  purchaseOrderAttachmentsDefault,
  purchaseOrderDetailToolbarButtons,
  purchaseOrderDialogTitle,
  purchaseOrderHeaderCommandBar,
  purchaseOrderHeaderSections,
  purchaseOrderHeaderToolbarButtons,
  purchaseOrderLineCommandBar,
  purchaseOrderLineColumns,
  purchaseOrderLineDataSource,
  purchaseOrderLinePlacement,
  purchaseOrderLineNumberIdentifierFields,
  purchaseOrderLineSelectionStrategy,
  purchaseOrderLineToolbarButtons,
  purchaseOrderLineTypeChangeProfile,
  purchaseOrderLineTotalsDefault,
  purchaseOrderListDataSource,
  purchaseOrderListCommandsConfig,
  purchaseOrderListPageConfig
} from './purchase-order.config';

@Component({
  selector: 'app-purchase-order',
  standalone: true,
  imports: [ErpListPageComponent, ErpListFilterPanelComponent, ErpPopupHostComponent],
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
  private readonly lineMasters = inject(LineMasterService);
  private readonly lineCommands = inject(LineCommandService);
  private readonly listFilterState = inject(ListFilterStateService);
  private readonly masterData = inject(MasterDataService);
  private readonly pageCommands = inject(PageCommandService);
  private readonly popupStack = inject(PopupStackService);
  private readonly sessionService = inject(SessionService);
  private readonly subscriptions = new Subscription();
  private readonly headerFieldValueTypeMap = this.entryState.buildFieldValueTypeMap(purchaseOrderHeaderSections);
  private readonly headerFieldConfigMap = this.entryState.buildFieldConfigMap(purchaseOrderHeaderSections);
  private readonly defaultSaveFailedMessage = 'Unable to save this change. Previous value was restored.';
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
  private activeEntryDialogConfig?: ErpEntryDialogConfig;
  private glAccountOptions: Array<{ label: string; value: string }> = [];
  private itemOptions: Array<{ label: string; value: string }> = [];
  private fixedAssetOptions: Array<{ label: string; value: string }> = [];
  private unitOfMeasureOptions: Array<{ label: string; value: string }> = [];
  private locationOptions: Array<{ label: string; value: string }> = [];
  private vendorRecords: Record<string, unknown>[] = [];
  private currencyRecords: Record<string, unknown>[] = [];
  private responsibilityCenterRecords: Record<string, unknown>[] = [];
  private pendingApproverRecords: Record<string, unknown>[] = [];
  private purchaserRecords: Record<string, unknown>[] = [];
  private paymentTermsRecords: Record<string, unknown>[] = [];
  private approverGroupRecords: Record<string, unknown>[] = [];
  private shortcutDimension1Records: Record<string, unknown>[] = [];
  private shortcutDimension2Records: Record<string, unknown>[] = [];
  private glAccountRecords: Record<string, unknown>[] = [];
  private itemRecords: Record<string, unknown>[] = [];
  private fixedAssetRecords: Record<string, unknown>[] = [];

  private readonly emptyHeaderMasters = {
    currencies: [] as Record<string, unknown>[],
    responsibilityCenters: [] as Record<string, unknown>[],
    pendingApprovers: [] as Record<string, unknown>[],
    purchasers: [] as Record<string, unknown>[],
    paymentTerms: [] as Record<string, unknown>[],
    approverGroups: [] as Record<string, unknown>[],
    shortcutDimension1: [] as Record<string, unknown>[],
    shortcutDimension2: [] as Record<string, unknown>[]
  };

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

  handlePopupClosed(event: { popupId: string; entryDialogConfig?: ErpEntryDialogConfig }): void {
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
      delete: () => this.deleteSelectedRow()
    });
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

    const documentNo = this.toODataString(row['Number']);

    const lineDataSource = {
      ...purchaseOrderLineDataSource,
      defaultFilter: `DocumentNo eq '${documentNo}'`
    };

    const masters$ = this.loadLineMasterOptions();
    const lines$ = documentNo
      ? this.dataSource.loadList(lineDataSource, { top: 200 }).pipe(catchError(() => of([] as unknown[])))
      : of([] as unknown[]);
    const vendors$ = this.loadVendorMasterOptions();
    const headerMasters$ = this.loadHeaderMasterOptions();

    this.subscriptions.add(
      forkJoin({ lines: lines$, masters: masters$, vendors: vendors$, headerMasters: headerMasters$ }).subscribe({
        next: ({ lines, masters, vendors, headerMasters }) => {
          this.glAccountRecords = masters.glAccountsRecords;
          this.itemRecords = masters.itemsRecords;
          this.fixedAssetRecords = masters.fixedAssetsRecords;
          this.glAccountOptions = masters.glAccounts;
          this.itemOptions = masters.items;
          this.fixedAssetOptions = masters.fixedAssets;
          this.unitOfMeasureOptions = masters.unitOfMeasures;
          this.locationOptions = masters.locations;
          this.vendorRecords = vendors;
          this.currencyRecords = headerMasters.currencies;
          this.responsibilityCenterRecords = headerMasters.responsibilityCenters;
          this.pendingApproverRecords = headerMasters.pendingApprovers;
          this.purchaserRecords = headerMasters.purchasers;
          this.paymentTermsRecords = headerMasters.paymentTerms;
          this.approverGroupRecords = headerMasters.approverGroups;
          this.shortcutDimension1Records = headerMasters.shortcutDimension1;
          this.shortcutDimension2Records = headerMasters.shortcutDimension2;
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

  private deleteSelectedRow(): void {
    if (!this.isRecord(this.selectedRow)) {
      return;
    }

    const selectedKey = this.getRowKey(this.selectedRow);
    if (!selectedKey) {
      return;
    }

    const selectedId = this.entryRecord.resolveRecordId(this.selectedRow, purchaseOrderListDataSource);
    if (selectedId !== null && selectedId !== undefined && selectedId !== '') {
      let requestFailed = false;
      this.subscriptions.add(
        this.dataSource.delete(purchaseOrderListDataSource, selectedId).pipe(
          catchError((error: unknown) => {
            requestFailed = true;
            this.error = this.getErrorMessage(error);
            this.setEntryStatus({
              tone: 'error',
              title: 'Delete failed',
              message: this.error || 'Unable to delete purchase order.'
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
      return;
    }

    this.removeRowFromList(selectedKey);
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

    return `Purchase Order ${row['Number'] ?? ''}`.trim();
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
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unable to load Purchase Order rows from the API.';
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

    const value = row['Id'] ?? row['Number'];
    return value === null || value === undefined ? '' : String(value);
  }

  private buildPurchaseOrderEntryDialogConfig(row?: unknown, lineSource?: unknown[]): ErpEntryDialogConfig {
    const record = this.isRecord(row) ? row : {};
    const lines = Array.isArray(lineSource) ? lineSource : [];

    const orderNumber = this.toText(record['Number'] ?? record['No']) || 'New';
    const vendorName = this.toText(record['BuyFromVendorName']);
    const status = this.toText(record['Status']) || this.getHeaderDefaultText('Status');
    const postingDate = this.toText(record['PostingDate']) || '';
    const orderDate = this.toText(record['OrderDate']) || postingDate;
    const currency = this.toText(record['CurrencyCode']) || this.getHeaderDefaultText('CurrencyCode');

    const attachments: ErpEntryAttachmentsConfig = {
      headerFilesCount: this.toNumber(record['HeaderAttachmentCount']) ?? purchaseOrderAttachmentsDefault.headerFilesCount,
      lineFilesCount: this.toNumber(record['LineAttachmentCount']) ?? purchaseOrderAttachmentsDefault.lineFilesCount,
      canUpload: this.toBoolean(record['CanUploadAttachment']) ?? purchaseOrderAttachmentsDefault.canUpload,
      primaryActionLabel: this.toText(record['AttachmentActionLabel']) || purchaseOrderAttachmentsDefault.primaryActionLabel,
      primaryActionKey: this.toText(record['AttachmentActionKey']) || purchaseOrderAttachmentsDefault.primaryActionKey
    };

    const lineRows = this.buildPurchaseOrderLineRows(record, lines);
    const lineTotals = this.buildPurchaseOrderLineTotals(lineRows, currency);

    return {
      pageLabel: 'PAGE',
      title: `${purchaseOrderDialogTitle} ${orderNumber}`,
      subtitle: `${vendorName || 'New'} - ${status}`,
      headerCommandBar: purchaseOrderHeaderCommandBar,
      lineCommandBar: purchaseOrderLineCommandBar,
      linePlacement: purchaseOrderLinePlacement,
      headerToolbarButtons: purchaseOrderHeaderToolbarButtons,
      lineToolbarButtons: purchaseOrderLineToolbarButtons.map((button) => ({ ...button })),
      detailToolbarButtons: purchaseOrderDetailToolbarButtons,
      headerSections: purchaseOrderHeaderSections,
      headerData: this.buildPurchaseOrderHeaderData(record),
      lineColumns: purchaseOrderLineColumns,
      lineRows,
      lineTotals,
      attachments,
      factPanelSections: this.buildPurchaseOrderFactPanelSections(record, attachments, lineTotals)
    };
  }

  private buildPurchaseOrderLineRows(
    record: Record<string, unknown>,
    lines: unknown[]
  ): Record<string, unknown>[] {
    const registry = this.getLineMasterRegistry();
    const optionFieldMap = this.getLineOptionFieldMap();

    if (lines.length) {
      return lines.filter((line): line is Record<string, unknown> => this.isRecord(line)).map((line) => ({
        Id: line['Id'] ?? line['id'] ?? '',
        Type: this.lineMasters.resolveType(line['Type'], registry),
        Number: this.toText(line['Number'] ?? line['No']),
        Description: this.toText(line['Description'] ?? line['Description2']),
        UnitOfMeasure: this.toText(line['UnitOfMeasureCode'] ?? line['UnitOfMeasure'] ?? line['BaseUnitOfMeasure']),
        LocationCode: this.toText(line['LocationCode']),
        Quantity: this.toNumber(line['Quantity']) ?? 0,
        OriginalCost: this.toNumber(line['OriginalCost']) ?? 0,
        Tax: this.toNumber(line['Tax']) ?? 0,
        DirectUnitCost: this.toNumber(line['DirectUnitCost'] ?? line['UnitCost']) ?? 0,
        LineDiscountAmount: this.toNumber(line['LineDiscountAmount']) ?? 0,
        QtyToReceive: this.toNumber(line['QtyToReceive']) ?? 0,
        QuantityReceived: this.toNumber(line['QuantityReceived']) ?? 0,
        QtyToInvoice: this.toNumber(line['QtyToInvoice']) ?? 0,
        QuantityInvoiced: this.toNumber(line['QuantityInvoiced']) ?? 0,
        LineAmount: this.toNumber(line['LineAmount']) ?? 0,
        AmountToInvoice: this.toNumber(line['AmountToInvoice']) ?? 0,
        AmountInvoiced: this.toNumber(line['AmountInvoiced']) ?? 0,
        LineStatus: this.toText(record['Status']) || this.getHeaderDefaultText('Status'),
        ...this.buildRowOptions(this.lineMasters.resolveType(line['Type'], registry), registry, optionFieldMap)
      }));
    }

    return [
      this.createEmptyLineRow(this.toText(record['Status']) || this.getHeaderDefaultText('Status'), registry, optionFieldMap)
    ];
  }

  private buildPurchaseOrderLineTotals(
    lineRows: Record<string, unknown>[],
    currencyCode: string
  ): ErpEntryLineTotalsConfig {
    const subtotal = lineRows.reduce((sum, row) => sum + (this.toNumber(row['LineAmount']) ?? 0), 0);
    const amountToInvoice = lineRows.reduce((sum, row) => sum + (this.toNumber(row['AmountToInvoice']) ?? 0), 0);
    const amountInvoiced = lineRows.reduce((sum, row) => sum + (this.toNumber(row['AmountInvoiced']) ?? 0), 0);
    const difference = amountToInvoice - amountInvoiced;

    return {
      subtotal: this.formatAmount(subtotal, currencyCode),
      sst: purchaseOrderLineTotalsDefault.sst,
      total: this.formatAmount(amountToInvoice, currencyCode),
      difference: this.formatAmount(difference, currencyCode)
    };
  }

  private buildPurchaseOrderFactPanelSections(
    record: Record<string, unknown>,
    attachments: ErpEntryAttachmentsConfig,
    totals: ErpEntryLineTotalsConfig
  ): ErpFactPanelSectionConfig[] {
    return [
      {
        id: 'review',
        title: 'Review',
        rows: [
          { label: 'Status', value: this.toText(record['Status']) || this.getHeaderDefaultText('Status') },
          { label: 'Approval', value: this.toText(record['ApprovalStatus']) || this.getHeaderDefaultText('ApprovalStatus') },
          { label: 'GRN Review', value: this.toText(record['GRNReviewStatus']) || this.getHeaderDefaultText('GRNReviewStatus') },
          { label: 'Invoice Review', value: this.toText(record['InvoiceReviewStatus']) || this.getHeaderDefaultText('InvoiceReviewStatus') },
          { label: 'Pending Approvers', value: this.toText(record['PendingApproversID']) || 'None' }
        ]
      },
      {
        id: 'document',
        title: 'Document',
        rows: [
          { label: 'No', value: this.toText(record['Number']) || '-' },
          { label: 'Vendor', value: this.toText(record['BuyFromVendorName']) || '-' },
          { label: 'Order Date', value: this.toText(record['OrderDate']) || '-' },
          { label: 'Posting Date', value: this.toText(record['PostingDate']) || '-' },
          { label: 'Subtotal', value: totals.subtotal },
          { label: 'Total', value: totals.total }
        ]
      },
      {
        id: 'attachments',
        title: 'Attachments',
        buttons: [
          {
            label: attachments.primaryActionLabel,
            actionKey: attachments.primaryActionKey,
            icon: 'bi bi-paperclip',
            disabled: !attachments.canUpload
          }
        ],
        rows: [
          { label: 'Header files', value: String(attachments.headerFilesCount) },
          { label: 'Line files', value: String(attachments.lineFilesCount) }
        ]
      }
    ];
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
    return this.masterData.loadMasterLists({
      glAccounts: ['/glAccounts'],
      items: ['/Items'],
      fixedAssets: ['/fixedAssets'],
      unitOfMeasures: ['/unitOfMeasures'],
      locations: ['/locations']
    }).pipe(
      map((masters) => ({
        glAccountsRecords: masters.glAccounts,
        itemsRecords: masters.items,
        fixedAssetsRecords: masters.fixedAssets,
        glAccounts: this.masterData.toSelectOptions(masters.glAccounts),
        items: this.masterData.toSelectOptions(masters.items),
        fixedAssets: this.masterData.toSelectOptions(masters.fixedAssets),
        unitOfMeasures: this.masterData.toSelectOptions(masters.unitOfMeasures),
        locations: this.masterData.toSelectOptions(masters.locations)
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

    if (field !== 'Type') {
      if (field === 'Number') {
        this.applyNumberSelection(row);
      } else if (field === 'Quantity' || field === 'DirectUnitCost' || field === 'QtyToInvoice') {
        this.entryState.recalculateLineAmounts(row);
      }
      return;
    }

    this.lineMasters.applyTypeChange(row, value, this.getLineMasterRegistry(), {
      clearFields: purchaseOrderLineTypeChangeProfile.clearFields,
      zeroFields: this.getLineFieldsByValueType('number'),
      optionFieldMap: this.getLineOptionFieldMap()
    });
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
    const type = this.lineMasters.resolveType(row['Type'], registry);
    const master = this.lineMasters.findRecordByNumber(type, row['Number'], registry, purchaseOrderLineNumberIdentifierFields);
    if (!master) {
      return;
    }

    const unitCost = this.lineMasters.applySelection(row, master, purchaseOrderLineSelectionStrategy);
    if (unitCost > 0) {
      this.entryState.recalculateLineAmounts(row);
    }
  }

  private getLineMasterRegistry(): ErpLineMasterRegistry {
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
    return {
      __options_UnitOfMeasure: this.unitOfMeasureOptions,
      __options_LocationCode: this.locationOptions
    };
  }

  private buildRowOptions(
    type: string,
    registry: ErpLineMasterRegistry,
    optionFieldMap: Record<string, Array<{ label: string; value: string }>>
  ): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    row['Id'] = '';
    this.lineMasters.assignTypeOptions(row, type, registry, optionFieldMap);
    return row;
  }

  private getLineFieldsByValueType(valueType: 'text' | 'number' | 'boolean' | 'date'): string[] {
    return purchaseOrderLineColumns
      .filter((column) => column.valueType === valueType)
      .map((column) => String(column.field ?? column.id));
  }

  private buildPurchaseOrderHeaderData(record: Record<string, unknown>): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    data['Id'] = record['Id'] ?? record['id'] ?? '';

    for (const section of purchaseOrderHeaderSections) {
      for (const field of section.fields) {
        const source = record[field.key];
        const fallback = source === null || source === undefined || source === ''
          ? field.defaultValue
          : source;
        data[field.key] = this.toText(fallback);
      }
    }

    data['Status'] = this.toText(record['Status']) || this.getHeaderDefaultText('Status');
    data['PendingApproversID'] = this.toText(record['PendingApproversID']) || 'None';
    data['GRNReviewStatus'] = this.toText(record['GRNReviewStatus']) || this.getHeaderDefaultText('GRNReviewStatus');
    data['InvoiceReviewStatus'] = this.toText(record['InvoiceReviewStatus']) || this.getHeaderDefaultText('InvoiceReviewStatus');
    data['ApprovalStatus'] = this.toText(record['ApprovalStatus']) || this.getHeaderDefaultText('ApprovalStatus');
    data['ModifiedAt'] = this.toText(record['ModifiedAt']) || this.getHeaderDefaultText('ModifiedAt');
    data['BuyFromVendorNumber'] = this.toText(
      record['BuyFromVendorNumber'] ?? record['BuyFromVendorNo'] ?? record['VendorNo'] ?? record['VendorNumber']
    );
    data['__options_BuyFromVendorNumber'] = this.vendorRecords;
    data['__options_CurrencyCode'] = this.currencyRecords;
    data['__options_ResponsibilityCenter'] = this.responsibilityCenterRecords;
    data['__options_PendingApproversID'] = this.pendingApproverRecords;
    data['__options_PurchaserCode'] = this.purchaserRecords;
    data['__options_PaymentTermsCode'] = this.paymentTermsRecords;
    data['__options_ApproverGroup'] = this.approverGroupRecords;
    data['__options_ShortcutDimension1Code'] = this.shortcutDimension1Records;
    data['__options_ShortcutDimension2Code'] = this.shortcutDimension2Records;

    return data;
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

    seed['Number'] = generatedNo;
    return seed;
  }

  private getHeaderDefaultText(fieldKey: string): string {
    const field = this.headerFieldConfigMap[fieldKey];
    if (!field || field.defaultValue === undefined || field.defaultValue === null) {
      return '';
    }

    return this.toText(field.defaultValue);
  }

  private loadVendorMasterOptions() {
    return this.masterData.loadFirstAvailableList(['/vendorsAPI', '/vendors']);
  }

  private loadHeaderMasterOptions(): Observable<{
    currencies: Record<string, unknown>[];
    responsibilityCenters: Record<string, unknown>[];
    pendingApprovers: Record<string, unknown>[];
    purchasers: Record<string, unknown>[];
    paymentTerms: Record<string, unknown>[];
    approverGroups: Record<string, unknown>[];
    shortcutDimension1: Record<string, unknown>[];
    shortcutDimension2: Record<string, unknown>[];
  }> {
    const isSuperAdmin = this.sessionService.SuperAdmin;

    return this.masterData.loadMasterLists({
      currencies: ['/currencyCodes', '/currencies'],
      responsibilityCenters: isSuperAdmin ? [] : ['/responsibilityCenters', '/ResponsibilityCenters'],
      pendingApprovers: ['/approvalGroups', '/pendingApprovers'],
      purchasers: ['/salespersonPurchasers'],
      paymentTerms: ['/paymentTerms'],
      approverGroups: ['/approvalGroups'],
      shortcutDimension1: isSuperAdmin ? [] : ['/shortcutDimension1Values', '/dimensionValues?$filter=DimensionCode eq \'PROJECT\''],
      shortcutDimension2: isSuperAdmin ? [] : ['/shortcutDimension2Values', '/dimensionValues?$filter=DimensionCode eq \'DEPARTMENT\'']
    }).pipe(
      catchError(() => of(this.emptyHeaderMasters))
    );
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

    const resolved = this.entryRecord.resolveRecordId(record, purchaseOrderListDataSource);
    return resolved !== null && resolved !== undefined && String(resolved).trim().length > 0;
  }

  private buildListSyncRecord(source: Record<string, unknown>): Record<string, unknown> {
    const key = this.getRowKey(source);
    const existing = this.rows.find((row) => this.getRowKey(row) === key);
    const base = this.isRecord(existing)
      ? { ...existing }
      : (this.isRecord(this.selectedRow) ? { ...this.selectedRow } : {});

    const target = base;
    const keysToSync = [
      'Id',
      'Number',
      'No',
      'BuyFromVendorNumber',
      'BuyFromVendorName',
      'OrderDate',
      'PostingDate',
      'Status',
      'CurrencyCode',
      'AmountIncludingVAT',
      'ApprovalStatus',
      'GRNReviewStatus',
      'InvoiceReviewStatus',
      'PendingApproversID',
      'ModifiedAt'
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
      this.changeDetector.detectChanges();
    }
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
              title: 'Create failed',
              message: 'Unable to create a new purchase order draft.'
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
            title: 'Create failed',
            message: 'Unable to create a new purchase order draft.'
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

    if (this.pendingDraftCreateFromNew || this.draftCreateInProgress || !this.hasPersistedIdentity(this.activeEntryDialogConfig.headerData)) {
      this.autosaveDeferredUntilDraftCreate = true;
      return;
    }

    const previousSnapshot = { ...this.activeEntryDialogConfig.headerData };

    this.entryState.scheduleHeaderAutosave('purchase-order-entry', this.activeEntryDialogConfig.headerData, {
      lineRows: this.activeEntryDialogConfig.lineRows,
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
          title: 'Saved',
          message: 'All changes saved.'
        });
        this.changeDetector.detectChanges();
      }
    });
  }

  private setEntryStatus(message: ErpEntryStatusMessage): void {
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
      this.deleteLine(payload);
      return;
    }

    // Shared service resolves command routing; page keeps document-specific reactions.
    this.actionDispatcher.dispatch(command, payload);
  }

  private removeRowFromList(selectedKey: string): void {
    this.rows = this.rows.filter((row) => this.getRowKey(row) !== selectedKey);
    this.selectedRow = this.rows[0];
    this.popupStack.closeAll();
    this.changeDetector.detectChanges();
  }

  private appendNewLine(mode: 'append' | 'prepend'): void {
    if (!this.activeEntryDialogConfig) {
      return;
    }

    const lineRows = this.activeEntryDialogConfig.lineRows ?? [];
    const status = this.toText(this.activeEntryDialogConfig.headerData?.['Status']) || this.getHeaderDefaultText('Status');
    const newRow = this.createEmptyLineRow(status, this.getLineMasterRegistry(), this.getLineOptionFieldMap());

    this.activeEntryDialogConfig.lineRows = mode === 'prepend' ? [newRow, ...lineRows] : [...lineRows, newRow];
    this.recalculateActiveLineTotals();
    this.changeDetector.detectChanges();
  }

  private deleteLine(payload: unknown): void {
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

    this.subscriptions.add(
      this.lineCommands.executePersistedDeletes(
        deletePlan.persistedIds,
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
            title: 'Delete failed',
            message: this.getErrorMessage(error) || 'Unable to delete selected line(s).'
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
      const status = this.toText(this.activeEntryDialogConfig.headerData?.['Status']) || this.getHeaderDefaultText('Status');
      nextRows.push(this.createEmptyLineRow(status, this.getLineMasterRegistry(), this.getLineOptionFieldMap()));
    }

    this.activeEntryDialogConfig.lineRows = nextRows;
    this.activeLineRow = nextRows[nextRows.length - 1];
    this.selectedLineIndexes = [];
    this.recalculateActiveLineTotals();
    this.changeDetector.detectChanges();
  }

  private createEmptyLineRow(
    status: string,
    registry: ErpLineMasterRegistry,
    optionFieldMap: Record<string, Array<{ label: string; value: string }>>
  ): Record<string, unknown> {
    const defaultType = this.resolveDefaultLineType(registry);
    const row: Record<string, unknown> = {};

    for (const column of purchaseOrderLineColumns) {
      const field = column.field;
      if (!field) {
        continue;
      }

      if (field === 'Type') {
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

    const currencyCode = this.toText(this.activeEntryDialogConfig.headerData?.['CurrencyCode']) || this.getHeaderDefaultText('CurrencyCode');
    this.activeEntryDialogConfig.lineTotals = this.buildPurchaseOrderLineTotals(this.activeEntryDialogConfig.lineRows, currencyCode);
  }

  private resolveDefaultLineType(registry: ErpLineMasterRegistry): string {
    const typeColumn = purchaseOrderLineColumns.find((column) => column.field === 'Type');
    const firstOptionValue = Array.isArray(typeColumn?.options) && typeColumn.options.length
      ? this.toText(typeColumn.options[0].value)
      : '';

    return firstOptionValue || registry.defaultType;
  }

}
