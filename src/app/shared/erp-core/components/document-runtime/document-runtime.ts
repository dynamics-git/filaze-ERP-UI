import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { SessionService } from '../../../../core/services/session.service';
import { PermissionService } from '../../../../core/services/permission.service';
import {
  EntryAttachmentsConfig,
  EntryCommandButtonConfig,
  EntryDialogConfig,
  EntryHeaderConfig,
  EntryHeaderSectionConfig,
  EntryLineTotalsConfig,
  EntryStatusMessage,
} from '../../models/entry-dialog-config.model';
import { FieldConfig } from '../../models/field-config.model';
import { LineColumnConfig, LineConfig } from '../../models/line-config.model';
import { CommandConfig } from '../../models/command-config.model';
import { ListCommandSelectionMode, ListPageConfig } from '../../models/page-config.model';
import { DataSourceConfig } from '../../models/data-source-config.model';
import { GENERIC_MESSAGES } from '../../constants/generic-messages';
import { ListPageComponent } from '../list-page/list-page';
import { ListFilterPanelComponent } from '../list-filter-panel/list-filter-panel';
import { PopupHostComponent } from '../popup-host/popup-host';
import { ActionDispatcherService } from '../../services/action-dispatcher.service';
import { ApiErrorService } from '../../services/api-error.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { DataSourceService } from '../../services/data-source.service';
import { DraftCreateService } from '../../services/draft-create.service';
import { EntryConfigDataService } from '../../services/entry-config-data.service';
import { EntryPayloadService } from '../../services/entry-payload.service';
import { EntryRecordService } from '../../services/entry-record.service';
import { EntryStateService } from '../../services/entry-state.service';
import { FieldValidationService } from '../../services/field-validation.service';
import { LineCommandService } from '../../services/line-command.service';
import { LineMasterRegistry, LineMasterService } from '../../services/line-master.service';
import { ListFilterStateService } from '../../services/list-filter-state.service';
import { MasterDataService } from '../../services/master-data.service';
import { PageCommandService } from '../../services/page-command.service';
import { PopupStackService } from '../../services/popup-stack.service';
import { RunModalLoadingService } from '../../services/run-modal-loading.service';
import { RunModalService } from '../../services/run-modal.service';

type RequiredListConfig = ListPageConfig & { dataSource: DataSourceConfig };
type SelectOption = { label: string; value: string };

export interface DocumentRuntimeCommandEvent {
  actionKey: string;
  payload?: unknown;
  context: {
    pageId: string;
    selectedRow?: unknown;
    checkedRowKeys: string[];
    headerData?: Record<string, unknown>;
    lineRows?: Record<string, unknown>[];
  };
}

@Component({
  selector: 'app-document-runtime',
  standalone: true,
  imports: [ListPageComponent, ListFilterPanelComponent, PopupHostComponent],
  templateUrl: './document-runtime.html',
})
export class DocumentRuntimeComponent implements OnInit, OnDestroy {
  private readonly actionDispatcher = inject(ActionDispatcherService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly dataSource = inject(DataSourceService);
  private readonly draftCreate = inject(DraftCreateService);
  private readonly entryConfigData = inject(EntryConfigDataService);
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
  private readonly runModalLoading = inject(RunModalLoadingService);
  private readonly runModal = inject(RunModalService);
  private readonly sessionService = inject(SessionService);
  private readonly permissionService = inject(PermissionService);
  private readonly subscriptions = new Subscription();

  @Input({ required: true }) pageId = 'document';
  @Input({ required: true }) listConfig!: RequiredListConfig;
  @Input({ required: true }) headerConfig!: EntryHeaderConfig;
  @Input() lineConfig?: LineConfig;
  @Output() businessCommand = new EventEmitter<DocumentRuntimeCommandEvent>();

  loading = false;
  popupLoading = false;
  popupLoadingMessage = 'Loading document...';
  error?: string;
  hasMore = true;
  rows: unknown[] = [];
  selectedRow?: unknown;

  private listLoadSubscription?: Subscription;
  private activeEntryDialogConfig?: EntryDialogConfig;
  private optionFieldMap: Record<string, SelectOption[]> = {};
  private headerDropdownRecords: Record<string, Record<string, unknown>[]> = {};
  private lineMasterRecordsByType: Record<string, Record<string, unknown>[]> = {};
  private lineMasterOptionsByType: Record<string, SelectOption[]> = {};
  private checkedRowKeys = new Set<string>();
  private pendingDraftCreateFromNew = false;
  private draftCreateInProgress = false;
  private autosaveDeferredUntilDraftCreate = false;
  private pendingListSyncRecord?: Record<string, unknown>;
  private activeLineRow?: Record<string, unknown>;
  private selectedLineIndexes: number[] = [];

  constructor() {
    this.popupStack.closeAll();
  }

  get listFilterScope(): string {
    return this.listConfig.dataSurface?.id ?? this.listConfig.id ?? this.pageId;
  }

  get listFilterStorageKey(): string {
    return this.listConfig.filterConfig?.storageKey ?? this.listFilterScope;
  }

  ngOnInit(): void {
    this.actionDispatcher.setPageCommands(this.listConfig.commands ?? []);
    this.actionDispatcher.setPageContext({
      title: this.listConfig.title,
      module: this.listConfig.module,
      company: this.listConfig.company,
      viewSuffix: this.listConfig.viewSuffix,
      views: this.listConfig.views,
      activeViewId: this.listConfig.activeViewId,
      tools: this.listConfig.tools,
      dataSource: this.listConfig.dataSource,
    });
    this.listFilterState.initializeFromConfig(
      this.listFilterScope,
      this.listConfig,
      this.listConfig.dataSource.defaultFilter,
    );
    this.loadFirstPage();

    this.subscriptions.add(
      this.actionDispatcher.action$.subscribe((event) => this.handleCommand(event)),
    );
  }

  ngOnDestroy(): void {
    this.actionDispatcher.clearPageCommands();
    this.actionDispatcher.clearPageContext();
    this.listLoadSubscription?.unsubscribe();
    this.entryState.clearAutosave(this.pageId);
    this.subscriptions.unsubscribe();
  }

  handlePopupAction(event: { popupId: string; actionKey: string; payload?: unknown }): void {
    this.entryState.handleEntryPopupAction(
      event,
      this.entryPopupId,
      {
        lineChanged: (payload) => this.handleLineChanged(payload),
        lineSelectionChanged: (payload) => this.handleLineSelectionChanged(payload),
        headerChanged: (payload) => this.handleHeaderChanged(payload),
        headerInteracted: (payload) => this.handleHeaderInteracted(payload),
        autosave: (payload) => this.handleAutosave(payload),
        commands: {
          save: () => this.queueLocalAutosave(),
          lineNew: () => this.appendNewLine('append'),
          lineInsert: () => this.appendNewLine('prepend'),
          command: (command, payload) => this.handleEntryCommand(command, payload),
        },
      },
      {
        entryDialogConfig: this.activeEntryDialogConfig,
        lineConfig: this.lineConfig,
      },
    );
  }

  handlePopupClosed(event: { popupId: string; entryDialogConfig?: EntryDialogConfig }): void {
    if (event.popupId !== this.entryPopupId) {
      return;
    }

    if (this.isRecord(event.entryDialogConfig?.headerData) && !this.pendingListSyncRecord) {
      this.pendingListSyncRecord = this.buildListSyncRecord(event.entryDialogConfig.headerData);
    }

    this.applyDeferredListSync();
  }

  handleCommand(event: { actionKey: string; payload?: unknown }): void {
    if (this.listFilterState.applyCommand(this.listFilterScope, event.actionKey, event.payload)) {
      this.loadFirstPage();
      return;
    }

    if (!this.canRunActionKey(event.actionKey)) {
      return;
    }

    this.pageCommands.handleListCommand(event, {
      refresh: () => this.loadFirstPage(),
      createNew: () => this.openNewPreview(),
      delete: () => {
        void this.deleteSelectedRows();
      },
      command: (actionKey, payload) => this.handleCustomListCommand(actionKey, payload),
    });
  }

  handleCheckedKeysChanged(keys: string[]): void {
    this.checkedRowKeys = new Set(keys.filter((key) => key.trim().length > 0));
  }

  openRecord(row: unknown, preserveLoader = false): void {
    if (!preserveLoader) {
      this.startPopupLoading(`Loading ${this.documentLabel.toLowerCase()}...`);
    } else {
      this.popupLoadingMessage = `Loading ${this.documentLabel.toLowerCase()}...`;
    }

    const hasPersistedId = this.hasPersistedIdentity(row);
    this.pendingDraftCreateFromNew =
      !hasPersistedId &&
      Boolean(this.listConfig.dataSource.autoGenerateNumber) &&
      Boolean(this.listConfig.dataSource.lazyCreateOnFirstInput);
    this.autosaveDeferredUntilDraftCreate = false;
    this.pendingListSyncRecord = undefined;

    if (!this.isRecord(row)) {
      this.openDocumentPopup(row, []);
      this.stopPopupLoading();
      return;
    }

    const masters$ = this.loadLineMasterOptions();
    const headerDropdownOptions$ = this.loadConfiguredHeaderDropdownOptions();

    this.subscriptions.add(
      this.loadHeaderRecord(row)
        .pipe(
          switchMap((headerRecord) =>
            forkJoin({
              headerRecord: of(headerRecord),
              lines: this.loadLineRows(headerRecord),
              masters: masters$,
              headerDropdownOptions: headerDropdownOptions$,
            }),
          ),
        )
        .subscribe({
          next: ({ headerRecord, lines, masters, headerDropdownOptions }) => {
            this.lineMasterRecordsByType = masters.lineMasterRecordsByType;
            this.lineMasterOptionsByType = masters.lineMasterOptionsByType;
            this.optionFieldMap = masters.optionFieldMap;
            this.setHeaderDropdownRecords(headerDropdownOptions);
            this.openDocumentPopup(headerRecord, this.toRecords(lines));
            this.stopPopupLoading();
          },
          error: () => this.stopPopupLoading(),
        }),
    );
  }

  private loadHeaderRecord(row: Record<string, unknown>): Observable<Record<string, unknown>> {
    const recordId = this.resolvePersistedRecordId(row, this.listConfig.dataSource);
    if (!this.hasValue(recordId)) {
      return of(row);
    }

    return this.dataSource.loadById(this.listConfig.dataSource, recordId).pipe(
      map((response) => this.resolveHeaderRecordResponse(response, row)),
      catchError(() => of(row)),
    );
  }

  private resolveHeaderRecordResponse(
    response: unknown,
    fallback: Record<string, unknown>,
  ): Record<string, unknown> {
    const mergeWithFallback = (source: Record<string, unknown>): Record<string, unknown> => {
      const merged: Record<string, unknown> = { ...fallback };
      for (const [key, value] of Object.entries(source)) {
        if (value !== null && value !== undefined && String(value).trim().length > 0) {
          merged[key] = value;
        }
      }
      return merged;
    };

    if (this.isRecord(response)) {
      if (this.isRecord(response['value'])) {
        return mergeWithFallback(response['value']);
      }

      if (Array.isArray(response['value'])) {
        const first = response['value'].find((item) => this.isRecord(item));
        return this.isRecord(first) ? mergeWithFallback(first) : fallback;
      }

      const nested = response['d'];
      if (this.isRecord(nested) && Array.isArray(nested['results'])) {
        const first = nested['results'].find((item) => this.isRecord(item));
        return this.isRecord(first) ? mergeWithFallback(first) : fallback;
      }

      return mergeWithFallback(response);
    }

    if (Array.isArray(response)) {
      const first = response.find((item) => this.isRecord(item));
      return this.isRecord(first) ? mergeWithFallback(first) : fallback;
    }

    return fallback;
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

  private get entryPopupId(): string {
    return `${this.pageId}-entry`;
  }

  private get documentLabel(): string {
    return this.headerConfig.dialogTitle || this.listConfig.title || 'Document';
  }

  private get headerFieldValueTypeMap() {
    return this.entryState.buildFieldValueTypeMap(this.headerConfig.sections);
  }

  private get headerFieldConfigMap() {
    return this.entryState.buildFieldConfigMap(this.headerConfig.sections);
  }

  private get defaultAttachments(): EntryAttachmentsConfig {
    return this.headerConfig.attachmentsDefault ?? {
      headerFilesCount: 0,
      lineFilesCount: 0,
      canUpload: true,
      primaryActionLabel: 'Add header file',
      primaryActionKey: 'dialog:attachments',
    };
  }

  private openDocumentPopup(row: unknown, lineRows: unknown[]): void {
    const entryDialogConfig = this.buildEntryDialogConfig(row, lineRows);
    this.activeEntryDialogConfig = entryDialogConfig;
    this.activeLineRow = undefined;
    this.selectedLineIndexes = [];

    this.popupStack.open({
      id: this.entryPopupId,
      title: this.getDocumentTitle(row),
      mode: 'page',
      size: 'full',
      allowNested: false,
      data: {
        entryDialogConfig,
      },
    });
  }

  private openNewPreview(): void {
    this.startPopupLoading(`Preparing ${this.documentLabel.toLowerCase()}...`);
    this.pendingDraftCreateFromNew =
      Boolean(this.listConfig.dataSource.autoGenerateNumber) &&
      Boolean(this.listConfig.dataSource.lazyCreateOnFirstInput);
    this.draftCreateInProgress = false;
    this.autosaveDeferredUntilDraftCreate = false;
    this.openRecord(this.buildNewHeaderSeed(), true);
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

    const pageSize = this.listConfig.dataSource.pageSize ?? 20;
    const effectiveFilter = this.listFilterState.buildFilter(this.listFilterScope);
    const effectiveListDataSource = {
      ...this.listConfig.dataSource,
      defaultFilter: effectiveFilter,
    };

    this.listLoadSubscription = this.dataSource
      .loadList(effectiveListDataSource, {
        skip: reset ? 0 : this.rows.length,
        top: pageSize,
      })
      .subscribe({
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
        },
      });
  }

  private loadLineRows(header: Record<string, unknown>): Observable<unknown> {
    if (!this.lineConfig) {
      return of([]);
    }

    const filter = this.buildLineFilter(header);
    if (!filter) {
      return of([]);
    }

    return this.dataSource
      .loadList({ ...this.lineConfig.dataSource, defaultFilter: filter }, { top: 200 })
      .pipe(catchError(() => of([])));
  }

  private buildEntryDialogConfig(row?: unknown, lineSource?: unknown[]): EntryDialogConfig {
    const record = this.isRecord(row) ? row : {};
    const documentNoField = this.listConfig.dataSource.documentNoField;
    const orderNumber = documentNoField ? this.toText(record[documentNoField]) || 'New' : 'New';
    const headerData = this.buildHeaderData(record);
    const lineRows = this.lineConfig ? this.buildLineRows(headerData, lineSource ?? []) : [];
    const lineTotals = this.lineConfig ? this.buildLineTotals(lineRows, headerData) : this.emptyTotals();

    const headerSections = this.applyHeaderFieldPermissions(this.headerConfig.sections);
    const lineColumns = this.applyLineColumnPermissions(this.lineConfig?.columns ?? []);

    return {
      pageLabel: this.documentLabel.toUpperCase(),
      title: `${this.documentLabel} ${orderNumber}`.trim(),
      subtitle: this.buildSubtitle(headerData),
      headerCommandBar: this.headerConfig.commandBar,
      lineCommandBar: this.lineConfig?.commandBar,
      lineCommandPolicy: {
        injectDefaultLineNew: false,
        injectDefaultLineDelete: false,
      },
      linePlacement: this.lineConfig?.placement,
      headerToolbarButtons: this.filterButtons(this.headerConfig.toolbarButtons),
      lineToolbarButtons: this.filterButtons(this.lineConfig?.toolbarButtons ?? []),
      detailToolbarButtons: this.headerConfig.detailToolbarButtons ?? [
        { label: 'Close', actionKey: 'cmd:close' },
      ],
      headerSections,
      headerData,
      lineColumns,
      lineRows,
      lineTotals,
      footerSections: this.lineConfig?.footerSections,
      attachments: { ...this.defaultAttachments },
    };
  }

  private get resolvedPageCode(): string | undefined {
    return this.listConfig.pageCode;
  }

  private filterButtons<T extends EntryCommandButtonConfig | CommandConfig>(buttons: T[]): T[] {
    const pageCode = this.resolvedPageCode;
    return buttons
      .filter((button) => !button.hidden)
      .filter((button) => this.permissionService.canCommand(pageCode, button))
      .map((button) => ({ ...button }));
  }

  private applyHeaderFieldPermissions(sections: EntryHeaderSectionConfig[]): EntryHeaderSectionConfig[] {
    const pageCode = this.resolvedPageCode;
    const canEdit = this.permissionService.can(pageCode, 'edit');

    return sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) => this.applyFieldPermission(field, canEdit)),
    }));
  }

  private applyFieldPermission(field: FieldConfig, canEdit: boolean): FieldConfig {
    const permission = this.permissionService.getFieldPermission(this.resolvedPageCode, field.key);
    const visible = permission?.visible;
    const editable = permission?.editable;

    return {
      ...field,
      hidden: field.hidden === true || visible === false,
      readonly: field.readonly === true || !canEdit || editable === false,
      disabled: field.disabled === true || permission?.disabled === true,
      required: permission?.required ?? field.required,
      masked: field.masked === true || permission?.masked === true,
    };
  }

  private applyLineColumnPermissions(columns: LineColumnConfig[]): LineColumnConfig[] {
    const pageCode = this.resolvedPageCode;
    const canEdit = this.permissionService.can(pageCode, 'edit');

    return columns.map((column) => {
      const fieldKey = this.getColumnField(column);
      const permission = fieldKey ? this.permissionService.getFieldPermission(pageCode, fieldKey) : undefined;

      return {
        ...column,
        hidden: column.hidden === true || permission?.visible === false,
        readonly: column.readonly === true || !canEdit || permission?.editable === false || permission?.disabled === true,
      };
    }).filter((column) => column.hidden !== true);
  }

  private buildSubtitle(headerData: Record<string, unknown>): string {
    const primary = this.resolveFirstConfiguredText(headerData, ['name', 'vendor', 'customer']);
    const status = this.resolveFirstConfiguredText(headerData, ['status']);
    return [primary || 'New', status].filter((part) => part.length > 0).join(' - ');
  }

  private resolveFirstConfiguredText(data: Record<string, unknown>, hints: string[]): string {
    const normalizedHints = hints.map((hint) => hint.toLowerCase());
    for (const section of this.headerConfig.sections) {
      for (const field of section.fields) {
        const normalized = field.key.toLowerCase();
        if (normalizedHints.some((hint) => normalized.includes(hint))) {
          const value = this.toText(data[field.key]).trim();
          if (value.length) {
            return value;
          }
        }
      }
    }

    return '';
  }

  private buildHeaderData(record: Record<string, unknown>): Record<string, unknown> {
    return this.entryConfigData.buildHeaderData(
      record,
      this.headerConfig.sections,
      this.headerDropdownRecords,
    );
  }

  private buildLineRows(
    headerData: Record<string, unknown>,
    lines: unknown[],
  ): Record<string, unknown>[] {
    if (!this.lineConfig) {
      return [];
    }

    return this.entryConfigData.buildLineRows(
      this.lineConfig,
      headerData,
      lines,
      this.getLineMasterRegistry(),
      this.optionFieldMap,
    );
  }

  private buildLineTotals(
    lineRows: Record<string, unknown>[],
    headerData: Record<string, unknown>,
  ): EntryLineTotalsConfig {
    if (!this.lineConfig) {
      return this.emptyTotals();
    }

    return this.entryState.calculateLineTotals(lineRows, headerData, this.lineConfig);
  }

  private emptyTotals(): EntryLineTotalsConfig {
    return {
      subtotal: '0.00',
      sst: '0.00',
      total: '0.00',
      difference: '0.00',
    };
  }

  private loadLineMasterOptions(): Observable<{
    lineMasterRecordsByType: Record<string, Record<string, unknown>[]>;
    lineMasterOptionsByType: Record<string, SelectOption[]>;
    optionFieldMap: Record<string, SelectOption[]>;
  }> {
    if (!this.lineConfig) {
      return of({
        lineMasterRecordsByType: {},
        lineMasterOptionsByType: {},
        optionFieldMap: {},
      });
    }

    const lineTypeMasterEndpoints = this.getLineTypeMasterEndpoints();
    const columnEndpointSources = this.getLineColumnEndpointSources();

    return this.masterData
      .loadMasterLists({
        ...lineTypeMasterEndpoints,
        ...columnEndpointSources,
      })
      .pipe(
        map((masters) => {
          const masterRecords = masters as Record<string, Record<string, unknown>[]>;
          const lineMasterRecordsByType: Record<string, Record<string, unknown>[]> = {};
          const lineMasterOptionsByType: Record<string, SelectOption[]> = {};
          const optionFieldMap: Record<string, SelectOption[]> = {};

          for (const type of Object.keys(lineTypeMasterEndpoints)) {
            const records = masterRecords[type] ?? [];
            lineMasterRecordsByType[type] = records;
            lineMasterOptionsByType[type] = this.masterData.toSelectOptions(
              records,
              this.getLineMasterValueFields(),
              this.getLineMasterLabelFields(),
            );
          }

          for (const [optionsKey, records] of Object.entries(masterRecords)) {
            if (optionsKey in lineTypeMasterEndpoints) {
              continue;
            }

            const column = this.getLineColumnByOptionsKey(optionsKey);
            optionFieldMap[optionsKey] = this.masterData.toSelectOptions(
              records,
              this.resolveConfiguredFields(column?.valueField),
              this.resolveConfiguredFields(column?.labelField),
            );
          }

          return {
            lineMasterRecordsByType,
            lineMasterOptionsByType,
            optionFieldMap,
          };
        }),
        catchError(() =>
          of({
            lineMasterRecordsByType: {},
            lineMasterOptionsByType: {},
            optionFieldMap: {},
          }),
        ),
      );
  }

  private getLineColumnEndpointSources(): Record<string, string[]> {
    const sources: Record<string, string[]> = {};
    for (const column of this.lineConfig?.columns ?? []) {
      const endpoints = this.resolveApiEndpoints(column.api ?? column.optionsEndpoints);
      const field = this.getColumnField(column);
      if (!field || !endpoints.length || field === this.getLineTypeField()) {
        continue;
      }

      sources[this.getLineColumnOptionsDataKey(field)] = endpoints;
    }

    return sources;
  }

  private getLineTypeMasterEndpoints(): Record<string, string[]> {
    const typeColumn = this.lineConfig?.columns.find(
      (column) => this.getColumnField(column) === this.getLineTypeField(),
    );
    const result: Record<string, string[]> = {};

    for (const option of typeColumn?.options ?? []) {
      const type = this.toText(option.value);
      const endpoints = this.resolveApiEndpoints(option.api);
      if (type && endpoints.length) {
        result[type] = endpoints;
      }
    }

    return result;
  }

  private getLineMasterRegistry(): LineMasterRegistry {
    const typeField = this.getLineTypeField();
    const typeColumn = this.lineConfig?.columns.find(
      (column) => this.getColumnField(column) === typeField,
    );
    const typeOptions = typeColumn?.options ?? [];
    const byType: LineMasterRegistry['byType'] = {};

    for (const option of typeOptions) {
      const type = this.toText(option.value);
      if (!type) {
        continue;
      }

      byType[type] = {
        options: this.lineMasterOptionsByType[type] ?? [],
        records: this.lineMasterRecordsByType[type] ?? [],
      };
    }

    return {
      defaultType: this.toText(typeOptions[0]?.value) || ' ',
      emptyType: ' ',
      byType,
    };
  }

  private handleLineChanged(payload: unknown): void {
    if (!this.lineConfig) {
      return;
    }

    const change = this.entryState.resolveLineChange(payload);
    if (!change) {
      return;
    }

    const { row, field, value } = change;
    this.activeLineRow = row;
    const typeField = this.getLineTypeField();
    const numberField = this.getLineNumberField();

    if (!typeField || field !== typeField) {
      if (numberField && field === numberField) {
        this.applyLineNumberSelection(row);
      }

      const fieldsToPersist = new Set<string>([field, ...(change.calculatedFields ?? [])]);
      if (numberField && field === numberField) {
        for (const fillField of this.getLineFillTargetFields(numberField)) {
          fieldsToPersist.add(fillField);
        }
      }

      this.clearEntryStatus();
      this.saveLineFields(row, [...fieldsToPersist]);
      return;
    }

    this.lineMasters.applyTypeChange(row, value, this.getLineMasterRegistry(), {
      clearFields: this.getLineFieldsByValueType('text').filter((fieldName) => fieldName !== typeField),
      zeroFields: this.getLineFieldsByValueType('number'),
      optionFieldMap: this.optionFieldMap,
      numberOptionFieldKey: numberField ? this.getLineColumnOptionsDataKey(numberField) : '',
    });
    this.clearEntryStatus();
    this.saveLineFields(row, [typeField, ...(change.calculatedFields ?? [])]);
    this.changeDetector.detectChanges();
  }

  private handleLineSelectionChanged(payload: unknown): void {
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
      selectedIndexes: this.selectedLineIndexes,
    }).selectedIndexes;
  }

  private applyLineNumberSelection(row: Record<string, unknown>): void {
    void row;
  }

  private handleHeaderChanged(payload: unknown): void {
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
        this.headerFieldValueTypeMap,
      );
      if (rolledBack) {
        this.changeDetector.detectChanges();
      }

      this.setEntryStatus({
        tone: 'error',
        title: 'Validation failed',
        message: fieldConfig?.messages?.validationFailed ?? validation.errors[0] ?? 'Invalid value.',
      });
      return;
    }

    this.clearEntryStatus();
    const changed = this.entryState.applyHeaderFieldChange(
      this.activeEntryDialogConfig.headerData,
      payload,
      this.headerFieldValueTypeMap,
    );
    if (changed) {
      this.triggerDraftCreateIfReady();
      this.saveHeaderFields(payload);
      this.changeDetector.detectChanges();
    }
  }

  private saveHeaderFields(payload: Record<string, unknown>): void {
    const headerData = this.activeEntryDialogConfig?.headerData;
    if (!headerData) {
      return;
    }

    if (this.pendingDraftCreateFromNew || this.draftCreateInProgress || !this.hasPersistedIdentity(headerData)) {
      this.autosaveDeferredUntilDraftCreate = true;
      return;
    }

    const fieldKey = this.toText(payload['fieldKey']).trim();
    const headerId = this.resolvePersistedRecordId(headerData, this.listConfig.dataSource);
    if (!fieldKey.length || !this.hasValue(headerId)) {
      this.autosaveDeferredUntilDraftCreate = true;
      return;
    }

    const updatePayload: Record<string, unknown> = {
      [fieldKey]: headerData[fieldKey],
    };

    // Some APIs validate required fields on PATCH as well.
    // Include required header fields so autosave updates remain valid.
    for (const section of this.headerConfig.sections ?? []) {
      for (const field of section.fields ?? []) {
        const requiredKey = this.toText(field.key).trim();
        if (!requiredKey.length || field.readonly || field.required !== true) {
          continue;
        }

        if (!(requiredKey in headerData)) {
          continue;
        }

        updatePayload[requiredKey] = headerData[requiredKey];
      }
    }

    if (this.isRecord(payload['updates'])) {
      Object.assign(updatePayload, payload['updates']);
    }

    this.stripIdentityFields(updatePayload);
    if (!Object.keys(updatePayload).length) {
      return;
    }

    this.subscriptions.add(
      this.dataSource
        .update(this.listConfig.dataSource, headerId, updatePayload)
        .pipe(
          catchError((error: unknown) => {
            const rolledBack = this.entryState.rollbackHeaderFieldChange(
              this.activeEntryDialogConfig?.headerData ?? {},
              payload,
              this.headerFieldValueTypeMap,
            );
            if (rolledBack) {
              this.changeDetector.detectChanges();
            }

            this.setEntryStatus({
              tone: 'error',
              title: 'Save failed',
              message: this.getErrorMessage(error) || GENERIC_MESSAGES.saveFailedDefault,
            });
            this.changeDetector.detectChanges();
            return of(undefined);
          }),
        )
        .subscribe((updated) => {
          if (!this.isRecord(updated) || !this.activeEntryDialogConfig?.headerData) {
            return;
          }

          Object.assign(this.activeEntryDialogConfig.headerData, updated);
          this.stageListSyncFromActiveHeader();
          this.changeDetector.detectChanges();
        }),
    );
  }

  private saveLineFields(row: Record<string, unknown>, fields: string[]): void {
    if (!this.lineConfig || !this.activeEntryDialogConfig?.headerData) {
      return;
    }

    if (
      this.pendingDraftCreateFromNew ||
      this.draftCreateInProgress ||
      !this.hasPersistedIdentity(this.activeEntryDialogConfig.headerData)
    ) {
      this.autosaveDeferredUntilDraftCreate = true;
      return;
    }

    const uniqueFields = [...new Set(fields.map((field) => field.trim()).filter(Boolean))];
    if (!uniqueFields.length) {
      return;
    }

    this.applyParentFieldsToLine(row);
    const rowId = this.resolveRecordId(row, this.lineConfig.dataSource);
    if (!this.hasValue(rowId)) {
      this.createLine(row);
      return;
    }

    const payload = this.entryConfigData.buildLineUpdatePayload(row, uniqueFields, this.lineConfig);
    this.subscriptions.add(
      this.dataSource
        .update(this.lineConfig.dataSource, rowId, payload)
        .pipe(
          catchError((error: unknown) => {
            this.setEntryStatus({
              tone: 'error',
              title: 'Save failed',
              message: this.getErrorMessage(error) || GENERIC_MESSAGES.saveFailedDefault,
            });
            this.changeDetector.detectChanges();
            return of(undefined);
          }),
        )
        .subscribe((updated) => {
          if (this.isRecord(updated)) {
            Object.assign(row, updated);
          }

          this.recalculateActiveLineTotals();
          this.changeDetector.detectChanges();
        }),
    );
  }

  private createLine(row: Record<string, unknown>): void {
    if (!this.lineConfig) {
      return;
    }

    const lineNoField = this.resolveLineNoField();
    if (lineNoField && !this.toNumber(row[lineNoField])) {
      row[lineNoField] = this.resolveNextLineNo(row, lineNoField);
    }

    const payload = this.entryConfigData.buildLineCreatePayload(row, this.lineConfig);
    if (!payload) {
      return;
    }

    this.subscriptions.add(
      this.dataSource
        .create(this.lineConfig.dataSource, payload)
        .pipe(
          catchError((error: unknown) => {
            this.setEntryStatus({
              tone: 'error',
              title: 'Save failed',
              message: this.getErrorMessage(error) || GENERIC_MESSAGES.saveFailedDefault,
            });
            this.changeDetector.detectChanges();
            return of(undefined);
          }),
        )
        .subscribe((created) => {
          if (this.isRecord(created)) {
            Object.assign(row, created);
          }

          this.recalculateActiveLineTotals();
          this.changeDetector.detectChanges();
        }),
    );
  }

  private handleAutosave(payload: unknown): void {
    if (this.isRecord(payload) && 'fieldKey' in payload) {
      return;
    }

    this.queueLocalAutosave();
  }

  private handleHeaderInteracted(payload: unknown): void {
    if (!this.pendingDraftCreateFromNew || this.draftCreateInProgress || !this.isRecord(payload)) {
      return;
    }

    const fieldKey = this.toText(payload['fieldKey']);
    const fieldConfig = this.headerFieldConfigMap[fieldKey];
    if (!fieldKey.length || !fieldConfig || fieldConfig.readonly || fieldConfig.disabled) {
      return;
    }

    if (
      !this.activeEntryDialogConfig?.headerData ||
      this.hasPersistedIdentity(this.activeEntryDialogConfig.headerData)
    ) {
      this.pendingDraftCreateFromNew = false;
      return;
    }

    if (!this.canCreateDraft(this.activeEntryDialogConfig.headerData)) {
      return;
    }

    this.startDraftCreate(this.activeEntryDialogConfig.headerData);
  }

  private triggerDraftCreateIfReady(): void {
    const headerData = this.activeEntryDialogConfig?.headerData;
    if (!headerData || !this.pendingDraftCreateFromNew || this.draftCreateInProgress) {
      return;
    }

    if (this.hasPersistedIdentity(headerData)) {
      this.pendingDraftCreateFromNew = false;
      return;
    }

    if (!this.canCreateDraft(headerData)) {
      return;
    }

    this.startDraftCreate(headerData);
  }

  private startDraftCreate(headerData: Record<string, unknown>): void {
    this.draftCreateInProgress = true;
    this.startPopupLoading(`Creating ${this.documentLabel.toLowerCase()} draft...`);

    this.subscriptions.add(
      this.createDraftRecord(headerData).subscribe({
        next: (createdRecord) => {
          this.draftCreateInProgress = false;
          this.stopPopupLoading();

          if (!createdRecord || !this.activeEntryDialogConfig?.headerData) {
            this.setEntryStatus({
              tone: 'error',
              title: GENERIC_MESSAGES.createFailedTitle,
              message: GENERIC_MESSAGES.createFailedMessage,
            });
            this.changeDetector.detectChanges();
            return;
          }

          const localEdits = { ...this.activeEntryDialogConfig.headerData };
          const createdHeader = this.buildHeaderData(createdRecord);
          Object.assign(this.activeEntryDialogConfig.headerData, createdHeader);
          this.restoreEditableLocalEdits(localEdits, this.activeEntryDialogConfig.headerData);
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
            message: GENERIC_MESSAGES.createFailedMessage,
          });
          this.changeDetector.detectChanges();
        },
      }),
    );
  }

  private canCreateDraft(headerData: Record<string, unknown>): boolean {
    for (const section of this.headerConfig.sections) {
      for (const field of section.fields) {
        if (!field.required || field.readonly || field.disabled) {
          continue;
        }

        if (!this.hasValue(headerData[field.key])) {
          return false;
        }
      }
    }

    return true;
  }

  private queueLocalAutosave(): void {
    const headerData = this.activeEntryDialogConfig?.headerData;
    if (!headerData) {
      return;
    }

    const headerId = this.resolvePersistedRecordId(headerData, this.listConfig.dataSource);
    if (this.pendingDraftCreateFromNew || this.draftCreateInProgress || !this.hasValue(headerId)) {
      this.autosaveDeferredUntilDraftCreate = true;
      return;
    }

    const previousSnapshot = { ...headerData };
    this.entryState.scheduleHeaderAutosave(this.pageId, headerData, {
      dataSourceConfig: this.listConfig.dataSource,
      headerSections: this.headerConfig.sections,
      meta: {
        page: this.pageId,
      },
      onFailed: (result) => {
        Object.assign(this.activeEntryDialogConfig?.headerData ?? {}, previousSnapshot);
        this.setEntryStatus({
          tone: 'error',
          title: 'Save failed',
          message: result.errorMessage || GENERIC_MESSAGES.saveFailedDefault,
        });
        this.changeDetector.detectChanges();
      },
      onCompleted: () => {
        this.stageListSyncFromActiveHeader();
        this.setEntryStatus({
          tone: 'success',
          title: GENERIC_MESSAGES.saveSuccessTitle,
          message: GENERIC_MESSAGES.saveSuccessMessage,
        });
        this.changeDetector.detectChanges();
      },
    });
  }

  private handleEntryCommand(command: string, payload: unknown): void {
    if (!this.canRunActionKey(command)) {
      return;
    }

    if (this.tryOpenEntryRunModal(command, payload)) {
      return;
    }

    if (command === 'line-delete') {
      void this.deleteLine(payload);
      return;
    }

    this.emitBusinessCommand(command, payload);
  }

  private handleCustomListCommand(actionKey: string, payload: unknown): void {
    const command = this.findListCommand(actionKey);
    if (command && !this.permissionService.canCommand(this.resolvedPageCode, command)) {
      return;
    }

    const selectionError = this.validateCustomListCommandSelection(command);
    if (selectionError) {
      this.error = selectionError;
      this.changeDetector.detectChanges();
      return;
    }

    this.error = undefined;
    this.changeDetector.detectChanges();
    this.emitBusinessCommand(actionKey, payload);
  }

  private tryOpenEntryRunModal(command: string, payload: unknown): boolean {
    const button = this.findEntryCommandButton(command);
    const pageId = this.toText(button?.runModalPageId).trim();
    if (!pageId.length) {
      return false;
    }

    const runModalTarget = button?.runModalTarget ?? button?.runModalView;

    const headerData = this.activeEntryDialogConfig?.headerData ?? {};
    const lineRows = this.activeEntryDialogConfig?.lineRows ?? [];
    const payloadRecord = this.isRecord(payload) ? payload : {};
    const context: Record<string, unknown> = {
      headerData,
      lineRows,
      payload: payloadRecord,
    };

    const activeLine = this.resolveRunModalActiveLine(payloadRecord);
    if (activeLine) {
      context['activeLine'] = activeLine;
    }

    this.runModalLoading.begin();
    void this.runModal
      .open({
        pageId,
        context,
        mode: runModalTarget === 'list' ? 'modal' : undefined,
        size: runModalTarget === 'list' ? 'xl' : undefined,
        target: runModalTarget,
        // Navigation-style list pages should replace the current popup instead of stacking over it.
        allowNested: runModalTarget !== 'list',
      })
      .then((opened) => {
        if (!opened) {
          const reason = this.runModal.getLastOpenFailureReason();
          const detail = reason ? ` (${reason})` : '';
          void this.confirmation.message(`Unable to open run modal page${detail}.`);
        }
      })
      .finally(() => this.runModalLoading.end());

    return true;
  }

  private findEntryCommandButton(command: string): EntryCommandButtonConfig | undefined {
    const normalized = this.normalizeCommandAction(command);
    if (!normalized.length) {
      return undefined;
    }

    const allButtons = [
      ...(this.activeEntryDialogConfig?.headerToolbarButtons ?? []),
      ...(this.activeEntryDialogConfig?.lineToolbarButtons ?? []),
      ...(this.activeEntryDialogConfig?.detailToolbarButtons ?? []),
    ];

    return allButtons.find((button) => this.normalizeCommandAction(button.actionKey) === normalized);
  }

  private normalizeCommandAction(actionKey: unknown): string {
    const raw = this.toText(actionKey).trim().toLowerCase();
    if (!raw.length) {
      return '';
    }

    return raw.startsWith('cmd:') ? raw.slice('cmd:'.length) : raw;
  }

  private resolveRunModalActiveLine(payload: Record<string, unknown>): Record<string, unknown> | undefined {
    const payloadActiveRow = payload['activeRow'];
    if (this.isRecord(payloadActiveRow)) {
      return payloadActiveRow;
    }

    const lineRows = this.activeEntryDialogConfig?.lineRows ?? [];
    const selectedIndexes = Array.isArray(payload['selectedIndexes'])
      ? payload['selectedIndexes']
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value >= 0 && value < lineRows.length)
      : [];

    const selectedIndex = selectedIndexes[0] ?? this.selectedLineIndexes[0];
    if (selectedIndex !== undefined && lineRows[selectedIndex]) {
      return lineRows[selectedIndex];
    }

    if (this.activeLineRow) {
      return this.activeLineRow;
    }

    return this.activeEntryDialogConfig?.headerData;
  }

  private emitBusinessCommand(actionKey: string, payload: unknown): void {
    this.businessCommand.emit({
      actionKey,
      payload,
      context: {
        pageId: this.pageId,
        selectedRow: this.selectedRow,
        checkedRowKeys: [...this.checkedRowKeys],
        headerData: this.activeEntryDialogConfig?.headerData,
        lineRows: this.activeEntryDialogConfig?.lineRows,
      },
    });
  }

  private findListCommand(actionKey: string): CommandConfig | undefined {
    return this.listConfig.commands?.find((command) => command.actionKey === actionKey);
  }

  private validateCustomListCommandSelection(command?: CommandConfig): string | undefined {
    const mode = this.resolveCustomListCommandSelectionMode(command);
    if (mode === 'none') {
      return undefined;
    }

    const selectedCount = this.getSelectedListRecordCount();
    if (selectedCount === 0) {
      return mode === 'multiple'
        ? 'Select at least one record before running this action.'
        : 'Select one record before running this action.';
    }

    if (mode === 'single' && selectedCount !== 1) {
      return 'Select only one record before running this action.';
    }

    return undefined;
  }

  private resolveCustomListCommandSelectionMode(
    command?: CommandConfig,
  ): ListCommandSelectionMode {
    if (!command) {
      return 'none';
    }

    if (typeof command.surface === 'string' && command.surface !== 'list') {
      return 'none';
    }

    const policy = this.listConfig.commandSelectionPolicy;
    const commandOverride = command.actionKey ? policy?.commands?.[command.actionKey] : undefined;
    if (commandOverride) {
      return commandOverride;
    }

    if (command.requireSelection === false) {
      return 'none';
    }

    if (command.selectionMode === 'multiple') {
      return 'multiple';
    }

    if (command.selectionMode === 'single') {
      return 'single';
    }

    if (command.requireSelection === true) {
      return policy?.defaultMode ?? 'single';
    }

    return policy?.defaultMode ?? 'none';
  }

  private getSelectedListRecordCount(): number {
    if (this.checkedRowKeys.size > 0) {
      return this.checkedRowKeys.size;
    }

    return this.isRecord(this.selectedRow) ? 1 : 0;
  }

  private async deleteSelectedRows(): Promise<void> {
    const targets = this.resolveDeleteTargets();
    if (!targets.length) {
      return;
    }

    const confirmed = await this.confirmation.confirmIntent({
      intent: 'delete',
      count: targets.length,
      entityLabel: this.documentLabel,
    });
    if (!confirmed) {
      return;
    }

    const operations = targets.map((target) => {
      if (!this.hasValue(target.id)) {
        return of({ key: target.key, success: true, error: undefined as unknown });
      }

      return this.dataSource.delete(this.listConfig.dataSource, target.id).pipe(
        map(() => ({ key: target.key, success: true, error: undefined as unknown })),
        catchError((error: unknown) => of({ key: target.key, success: false, error })),
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
            message: this.error || GENERIC_MESSAGES.deleteFailedMessage,
          });
        } else {
          this.error = undefined;
        }

        this.changeDetector.detectChanges();
      }),
    );
  }

  private async deleteLine(payload: unknown): Promise<void> {
    if (!this.permissionService.can(this.resolvedPageCode, 'delete')) {
      return;
    }

    if (!this.activeEntryDialogConfig || !this.lineConfig) {
      return;
    }

    const lineRows = this.activeEntryDialogConfig.lineRows ?? [];
    if (!lineRows.length) {
      return;
    }

    try {
      const result = await this.lineCommands.deleteRows({
        lineRows,
        payload,
        activeRow: this.activeLineRow,
        selectedIndexes: this.selectedLineIndexes,
        resolveId: (row) => this.entryRecord.resolveRecordId(row, this.lineConfig?.dataSource),
        deleteById: (id) => this.dataSource.delete(this.lineConfig!.dataSource, id),
        confirmDelete: (count) =>
          this.confirmation.confirmIntent({
            intent: 'delete',
            count,
            entityLabel: 'line',
          }),
      });

      if (!result.deleted) {
        return;
      }

      const latestRows = this.activeEntryDialogConfig?.lineRows ?? [];
      this.applyLineDeletionResult(latestRows.filter((row) => !result.targetRows.includes(row)));
    } catch (error: unknown) {
      this.setEntryStatus({
        tone: 'error',
        title: GENERIC_MESSAGES.deleteFailedTitle,
        message: this.getErrorMessage(error) || GENERIC_MESSAGES.lineDeleteFailedMessage,
      });
      this.changeDetector.detectChanges();
    }
  }

  private appendNewLine(mode: 'append' | 'prepend'): void {
    if (!this.permissionService.can(this.resolvedPageCode, 'insert')) {
      return;
    }

    if (!this.activeEntryDialogConfig || !this.lineConfig) {
      return;
    }

    const lineRows = this.activeEntryDialogConfig.lineRows ?? [];
    const newRow = this.entryConfigData.createEmptyLineRow(
      this.lineConfig,
      this.activeEntryDialogConfig.headerData ?? {},
      this.getLineMasterRegistry(),
      this.optionFieldMap,
    );

    this.activeEntryDialogConfig.lineRows =
      mode === 'prepend' ? [newRow, ...lineRows] : [...lineRows, newRow];
    this.recalculateActiveLineTotals();
    this.clearEntryStatus();
    this.changeDetector.detectChanges();
  }

  private applyLineDeletionResult(nextRows: Record<string, unknown>[]): void {
    if (!this.activeEntryDialogConfig || !this.lineConfig) {
      return;
    }

    if (!nextRows.length) {
      nextRows.push(
        this.entryConfigData.createEmptyLineRow(
          this.lineConfig,
          this.activeEntryDialogConfig.headerData ?? {},
          this.getLineMasterRegistry(),
          this.optionFieldMap,
        ),
      );
    }

    this.activeEntryDialogConfig.lineRows = nextRows;
    this.activeLineRow = nextRows[nextRows.length - 1];
    this.selectedLineIndexes = [];
    this.recalculateActiveLineTotals();
    this.clearEntryStatus();
    this.changeDetector.detectChanges();
  }

  private recalculateActiveLineTotals(): void {
    if (!this.activeEntryDialogConfig?.lineRows || !this.lineConfig) {
      return;
    }

    this.activeEntryDialogConfig.lineTotals = this.buildLineTotals(
      this.activeEntryDialogConfig.lineRows,
      this.activeEntryDialogConfig.headerData ?? {},
    );
  }

  private createDraftRecord(newRecord: Record<string, unknown>): Observable<Record<string, unknown> | null> {
    return this.draftCreate
      .createWithUnknownPropertyFallback(
        this.listConfig.dataSource,
        this.entryPayload.buildHeaderCreatePayload(newRecord, this.headerConfig.sections),
      )
      .pipe(
        map((response) => this.toCreatedRecord(response)),
        catchError(() => of(null)),
      );
  }

  private loadConfiguredHeaderDropdownOptions(): Observable<Record<string, Record<string, unknown>[]>> {
    const dropdownSources: Record<string, Observable<Record<string, unknown>[]>> = {};

    for (const section of this.headerConfig.sections) {
      for (const field of section.fields) {
        const optionsKey = field.optionsDataKey?.trim() || `__options_${field.key}`;
        if (field.type !== 'dropdown' || !optionsKey || dropdownSources[optionsKey]) {
          continue;
        }

        const endpoints = this.resolveApiEndpoints(field.api ?? field.optionsEndpoints);
        if (field.optionsSkipWhenSuperAdmin && this.sessionService.SuperAdmin) {
          dropdownSources[optionsKey] = of([]);
          continue;
        }

        dropdownSources[optionsKey] = endpoints.length
          ? this.masterData.loadFirstAvailableList(endpoints).pipe(catchError(() => of([])))
          : of([]);
      }
    }

    return Object.keys(dropdownSources).length ? forkJoin(dropdownSources) : of({});
  }

  private setHeaderDropdownRecords(source: Record<string, Record<string, unknown>[]>): void {
    const next: Record<string, Record<string, unknown>[]> = {};
    for (const [key, records] of Object.entries(source)) {
      next[key] = this.toRecordList(records);
    }

    this.headerDropdownRecords = next;
  }

  private restoreEditableLocalEdits(
    localEdits: Record<string, unknown>,
    headerData: Record<string, unknown>,
  ): void {
    for (const section of this.headerConfig.sections) {
      for (const field of section.fields) {
        if (field.readonly) {
          continue;
        }

        const localValue = localEdits[field.key];
        if (this.hasValue(localValue)) {
          headerData[field.key] = localValue;
        }
      }
    }
  }

  private buildNewHeaderSeed(): Record<string, unknown> {
    const documentNoField = this.listConfig.dataSource.documentNoField;
    return this.entryConfigData.buildHeaderSeed(
      this.headerConfig.sections,
      documentNoField ? { [documentNoField]: '' } : {},
    );
  }

  private buildLineFilter(header: Record<string, unknown>): string {
    if (!this.lineConfig) {
      return '';
    }

    const clauses: string[] = [];
    const parentKeyField = this.lineConfig.dataSource.parentKeyField;
    const documentNoField =
      this.lineConfig.dataSource.documentNoField ?? this.listConfig.dataSource.documentNoField;
    const documentNo = documentNoField ? header[documentNoField] : undefined;

    if (parentKeyField) {
      if (!this.hasValue(documentNo)) {
        return '';
      }

      clauses.push(`${parentKeyField} eq ${this.toODataLiteral(documentNo)}`);
    }

    for (const [field, value] of Object.entries(this.lineConfig.dataSource.parentFixedFields ?? {})) {
      clauses.push(`${field} eq ${this.toODataLiteral(value)}`);
    }

    return clauses.join(' and ');
  }

  private applyParentFieldsToLine(row: Record<string, unknown>): void {
    if (!this.lineConfig || !this.activeEntryDialogConfig?.headerData) {
      return;
    }

    const parentKeyField = this.lineConfig.dataSource.parentKeyField;
    const documentNoField =
      this.lineConfig.dataSource.documentNoField ?? this.listConfig.dataSource.documentNoField;
    if (parentKeyField && !this.hasValue(row[parentKeyField])) {
      row[parentKeyField] =
        this.activeEntryDialogConfig.headerData[parentKeyField] ??
        (documentNoField ? this.activeEntryDialogConfig.headerData[documentNoField] : undefined);
    }

    for (const [field, value] of Object.entries(this.lineConfig.dataSource.parentFixedFields ?? {})) {
      if (!this.hasValue(row[field])) {
        row[field] = value;
      }
    }
  }

  private stageListSyncFromActiveHeader(): void {
    if (
      !this.activeEntryDialogConfig?.headerData ||
      !this.hasPersistedIdentity(this.activeEntryDialogConfig.headerData)
    ) {
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

  private buildListSyncRecord(source: Record<string, unknown>): Record<string, unknown> {
    const key = this.getRowKey(source);
    const existing = this.rows.find((row) => this.getRowKey(row) === key);
    return this.entryConfigData.mergeListRecord(
      source,
      this.isRecord(existing) ? existing : undefined,
      this.isRecord(this.selectedRow) ? this.selectedRow : undefined,
    );
  }

  private resolveDeleteTargets(): Array<{ key: string; id: unknown }> {
    const selectedTargets = this.rows
      .filter((row) => this.checkedRowKeys.has(this.getRowKey(row)))
      .filter((row): row is Record<string, unknown> => this.isRecord(row))
      .map((row) => ({
        key: this.getRowKey(row),
        id: this.entryRecord.resolveRecordId(row, this.listConfig.dataSource),
      }))
      .filter((target) => target.key.length > 0);

    if (selectedTargets.length) {
      return selectedTargets;
    }

    if (!this.isRecord(this.selectedRow)) {
      return [];
    }

    const key = this.getRowKey(this.selectedRow);
    return key
      ? [{ key, id: this.entryRecord.resolveRecordId(this.selectedRow, this.listConfig.dataSource) }]
      : [];
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

  private getDocumentTitle(row: unknown): string {
    if (!this.isRecord(row)) {
      return this.documentLabel;
    }

    const documentNoField = this.listConfig.dataSource.documentNoField;
    return `${this.documentLabel} ${documentNoField ? row[documentNoField] ?? '' : ''}`.trim();
  }

  private getRowKey(row: unknown): string {
    if (!this.isRecord(row)) {
      return '';
    }

    const id = this.resolveRecordId(row, this.listConfig.dataSource);
    return id === null || id === undefined ? '' : String(id);
  }

  private resolveRecordId(record: Record<string, unknown>, config?: DataSourceConfig): unknown {
    return this.entryRecord.resolveRecordId(record, config);
  }

  private resolvePersistedRecordId(record: Record<string, unknown>, config?: DataSourceConfig): unknown {
    return this.entryRecord.resolvePersistedRecordId(record, config);
  }

  private hasPersistedIdentity(record: unknown): boolean {
    if (!this.isRecord(record)) {
      return false;
    }

    return this.hasValue(this.resolvePersistedRecordId(record, this.listConfig.dataSource));
  }

  private getLineTypeField(): string {
    const configured = this.lineConfig?.columns.find((column) =>
      (column.options ?? []).some((option) => this.resolveApiEndpoints(option.api).length > 0),
    );
    return this.getColumnField(configured);
  }

  private getLineNumberField(): string {
    const configured = this.lineConfig?.columns.find((column) => Boolean(column.fill));
    return this.getColumnField(configured);
  }

  private getLineColumnOptionsDataKey(fieldName: string): string {
    const column = this.lineConfig?.columns.find((item) => this.getColumnField(item) === fieldName);
    return column?.optionsDataKey?.trim() || `__options_${fieldName}`;
  }

  private getLineColumnByOptionsKey(optionsKey: string): LineColumnConfig | undefined {
    return this.lineConfig?.columns.find((column) => {
      const field = this.getColumnField(column);
      const key = column.optionsDataKey?.trim() || (field ? `__options_${field}` : '');
      return key === optionsKey;
    });
  }

  private getLineMasterValueFields(): string[] {
    const column = this.lineConfig?.columns.find((item) => Boolean(item.fill));
    return this.resolveConfiguredFields(column?.valueField);
  }

  private getLineMasterLabelFields(): string[] {
    const column = this.lineConfig?.columns.find((item) => Boolean(item.fill));
    return this.resolveConfiguredFields(column?.labelField);
  }

  private resolveConfiguredFields(source: string | string[] | undefined): string[] {
    const fields = Array.isArray(source) ? source : source ? [source] : [];
    return fields.map((field) => field.trim()).filter((field) => field.length > 0);
  }

  private getLineFillTargetFields(fieldName: string): string[] {
    const column = this.lineConfig?.columns.find((item) => this.getColumnField(item) === fieldName);
    return column?.fill ? Object.keys(column.fill) : [];
  }

  private getLineFieldsByValueType(valueType: 'text' | 'number' | 'boolean' | 'date'): string[] {
    return (this.lineConfig?.columns ?? [])
      .filter((column) => column.valueType === valueType)
      .map((column) => this.getColumnField(column))
      .filter(Boolean);
  }

  private getColumnField(column: LineColumnConfig | undefined): string {
    return this.toText(column?.field ?? column?.id).trim();
  }

  private canRunActionKey(actionKey: string): boolean {
    return this.permissionService.canCommand(this.resolvedPageCode, { actionKey });
  }

  private resolveLineNoField(): string {
    return this.lineConfig?.lineKeyField ?? '';
  }

  private resolveNextLineNo(targetRow: Record<string, unknown>, lineNoField: string): number {
    const lineRows = this.activeEntryDialogConfig?.lineRows ?? [];
    const existingLineNos = new Set<number>();
    let maxLineNo = 0;

    for (const line of lineRows) {
      if (line === targetRow || !this.hasValue(this.resolveRecordId(line, this.lineConfig?.dataSource))) {
        continue;
      }

      const value = this.toNumber(line[lineNoField]);
      if (value === null || value <= 0) {
        continue;
      }

      existingLineNos.add(value);
      maxLineNo = Math.max(maxLineNo, value);
    }

    let candidate = maxLineNo > 0 ? maxLineNo + 10000 : 10000;
    while (existingLineNos.has(candidate)) {
      candidate += 10000;
    }

    return candidate;
  }

  private resolveApiEndpoints(source: string | string[] | undefined): string[] {
    const endpoints = Array.isArray(source) ? source : source ? [source] : [];
    return endpoints.map((endpoint) => endpoint.trim()).filter(Boolean);
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

  private setEntryStatus(message: EntryStatusMessage): void {
    if (this.activeEntryDialogConfig) {
      this.activeEntryDialogConfig.statusMessage = message;
    }
  }

  private clearEntryStatus(): void {
    if (this.activeEntryDialogConfig) {
      this.activeEntryDialogConfig.statusMessage = undefined;
    }
  }

  private stripIdentityFields(payload: Record<string, unknown>): void {
    if (this.listConfig.dataSource.keyField) {
      delete payload[this.listConfig.dataSource.keyField];
    }
  }

  private toCreatedRecord(response: unknown): Record<string, unknown> | null {
    if (this.isRecord(response)) {
      return response;
    }

    const first = this.toRecords(response)[0];
    return this.isRecord(first) ? first : null;
  }

  private toRecords(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (this.isRecord(response)) {
      if (Array.isArray(response['data'])) {
        return response['data'];
      }

      if (Array.isArray(response['value'])) {
        return response['value'];
      }
    }

    return [];
  }

  private toRecordList(source: unknown): Record<string, unknown>[] {
    return this.toRecords(source).filter((record): record is Record<string, unknown> =>
      this.isRecord(record),
    );
  }

  private getErrorMessage(error: unknown): string {
    return this.apiError.toMessage(error, GENERIC_MESSAGES.listLoadFailed);
  }

  private toODataLiteral(value: unknown): string {
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return `'${this.toText(value).replace(/'/g, "''").trim()}'`;
  }

  private hasValue(value: unknown): boolean {
    return value !== null && value !== undefined && String(value).trim().length > 0;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
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
}
