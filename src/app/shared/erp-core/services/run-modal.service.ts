// NOTE:
// This file is currently a core ERP runtime/orchestration file.
// Future refactor should split loading, popup orchestration, line runtime,
// autosave, and command handling into smaller services.
// Do not change behavior during this cleanup.
import { Inject, Injectable, Optional, inject } from '@angular/core';
import { EntryAttachmentsConfig, EntryDialogConfig } from '../models/entry-dialog-config.model';
import { LineColumnConfig } from '../models/line-config.model';
import { PopupMode, PopupSize } from '../models/popup-config.model';
import { ListPageConfig } from '../models/page-config.model';
import { PopupStackService } from './popup-stack.service';
import { DataSourceService } from './data-source.service';
import { DataSourceConfig } from '../models/data-source-config.model';
import { PopupHostData, RunModalListPopupState } from '../models/popup-host-data.model';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { ConfirmationService } from './confirmation.service';
import { ApiErrorService } from './api-error.service';
import { EntryRecordService } from './entry-record.service';
import { EntryResponseNormalizerService } from './entry-response-normalizer.service';
import { EntryHydrationOrchestratorService } from './entry-hydration-orchestrator.service';
import { LineMasterRegistry, LineMasterService } from './line-master.service';
import { MasterDataService } from './master-data.service';
import { LineTotalsCalculationConfig } from '../models/line-calculation-config.model';
import { LineCalculationService } from './line-calculation.service';
import { RunModalLoadingService } from './run-modal-loading.service';
import { GENERIC_MESSAGES } from '../constants/generic-messages';
import { ERP_RUNTIME_TIMEOUT_POLICY } from './erp-runtime-timeout-policy.token';
import { ErpRuntimeValueMapperService } from './erp-runtime-value-mapper.service';
import { RunModalBindingStateService } from './run-modal-binding-state.service';
import {
  RUN_MODAL_CONFIG_RESOLVER,
  RunModalConfigModule,
  RunModalConfigResolver,
  RunModalContext,
} from './run-modal-config.token';

type RunModalPageDefinition = {
  pageId: string;
  module: RunModalConfigModule;
};

type RunModalBinding = {
  pageId: string;
  module: RunModalConfigModule;
  context: RunModalContext;
  dataSource?: DataSourceConfig;
  headerDataSource?: DataSourceConfig;
  lineDataSource?: DataSourceConfig;
  lineMasterRegistry?: LineMasterRegistry;
  lineOptionFieldMap?: Record<string, Array<{ label: string; value: unknown }>>;
  lineNumberOptionFieldKey?: string;
};

type RunModalActionEvent = {
  actionKey: string;
  payload?: unknown;
};

type HydrationResult = {
  lineHydrateFailed: boolean;
  lineHydrateMessage?: string;
};

export interface RunModalRequest {
  pageId: string;
  context?: RunModalContext;
  mode?: PopupMode;
  size?: PopupSize;
  target?: 'entry' | 'list';
  allowNested?: boolean;
  popupId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RunModalService {
  private readonly timeoutPolicy = inject(ERP_RUNTIME_TIMEOUT_POLICY);
  private readonly valueMapper = inject(ErpRuntimeValueMapperService);
  private readonly bindingState = inject(RunModalBindingStateService);

  private get bindings(): Map<string, RunModalBinding> {
    return this.bindingState.bindings as Map<string, RunModalBinding>;
  }

  private get autosaveTimers(): Map<string, ReturnType<typeof setTimeout>> {
    return this.bindingState.autosaveTimers;
  }

  private get lastOpenFailureReason(): string {
    return this.bindingState.lastOpenFailureReason;
  }

  private set lastOpenFailureReason(value: string) {
    this.bindingState.lastOpenFailureReason = value;
  }

  constructor(
    private readonly popupStack: PopupStackService,
    private readonly dataSource: DataSourceService,
    private readonly confirmation: ConfirmationService,
    private readonly apiError: ApiErrorService,
    private readonly entryRecord: EntryRecordService,
    private readonly entryResponseNormalizer: EntryResponseNormalizerService,
    private readonly entryHydration: EntryHydrationOrchestratorService,
    private readonly masterData: MasterDataService,
    private readonly lineMasters: LineMasterService,
    private readonly lineCalculation: LineCalculationService,
    private readonly runModalLoading: RunModalLoadingService,
    @Inject(RUN_MODAL_CONFIG_RESOLVER)
    private readonly configResolver: RunModalConfigResolver,
  ) {}

  async open(request: RunModalRequest): Promise<boolean> {
    const openScope = this.buildOpenScope(request.pageId);
    this.runModalLoading.begin(openScope, this.buildOpenMessage(request.pageId));

    try {
    const definition = await this.resolvePageDefinition(request.pageId);
    if (!definition) {
      this.lastOpenFailureReason = `config-not-found:${request.pageId}`;
      return false;
    }

    const target = this.resolveOpenTarget(definition.module, definition.pageId, request.target);
    if (target === 'list') {
      return this.openList(request, definition);
    }

    const context = request.context ?? {};
    const entryDialogConfig = this.buildGenericEntryDialogConfig(
      definition.module,
      definition.pageId,
      context,
    );
    const navigationDataSource = this.resolveNavigationDataSource(definition.module, context);
    const headerDataSource = navigationDataSource ?? this.pickDataSource(definition.module);
    const lineDataSource = this.pickLineDataSource(definition.module);
    const popupId = request.popupId ?? `run-modal-${request.pageId}-${Date.now()}`;

    const opened = this.popupStack.open({
      id: popupId,
      title: entryDialogConfig.title,
      mode: request.mode ?? 'page',
      size: request.size ?? 'full',
      allowNested: request.allowNested ?? true,
      data: {
        entryDialogConfig,
      },
    });

    if (!opened) {
      this.lastOpenFailureReason = `popup-open-blocked:${request.pageId}`;
      return false;
    }

    this.lastOpenFailureReason = '';

    this.bindings.set(popupId, {
      pageId: definition.pageId,
      module: definition.module,
      context,
      dataSource: navigationDataSource,
      headerDataSource,
      lineDataSource,
    });

    void this.hydrateEntryDialog(definition.module, entryDialogConfig, context, navigationDataSource, popupId);

    return true;
    } finally {
      this.runModalLoading.end(openScope);
    }
  }

  private async hydrateEntryDialog(
    module: RunModalConfigModule,
    entryDialogConfig: EntryDialogConfig,
    context: RunModalContext,
    dataSource: DataSourceConfig | undefined,
    popupId: string,
  ): Promise<void> {
    const scope = this.buildHydrationScope(popupId);
    this.runModalLoading.begin(scope, 'Loading header and lines...');
    this.setInteractionLock(entryDialogConfig, true);
    entryDialogConfig.statusMessage = {
      tone: 'info',
      title: 'Loading',
      message: 'Loading lines...',
      blocking: true,
    };
    this.refreshPopup(popupId);

    try {
      const hydration = await this.hydrateFromApi(module, entryDialogConfig, context, dataSource);
      this.recalculateLineTotals(module, entryDialogConfig);
      this.setInteractionLock(entryDialogConfig, hydration.lineHydrateFailed);
      entryDialogConfig.statusMessage = hydration.lineHydrateFailed
        ? {
          tone: 'error',
          title: 'Line load failed',
          message: hydration.lineHydrateMessage ?? 'Unable to load lines. Retry to continue.',
        }
        : undefined;
      this.refreshPopup(popupId);
      if (!hydration.lineHydrateFailed) {
        this.scheduleEntryOptionHydration(module, entryDialogConfig, popupId);
      }
    } catch {
      this.setInteractionLock(entryDialogConfig, true);
      entryDialogConfig.statusMessage = {
        tone: 'error',
        title: 'Line load failed',
        message: 'Unable to load lines. Retry to continue.',
      };
      this.refreshPopup(popupId);
    } finally {
      this.runModalLoading.end(scope);
    }
  }

  private async retryHydration(
    popupId: string,
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
  ): Promise<void> {
    const scope = this.buildHydrationScope(popupId);
    this.runModalLoading.begin(scope, 'Retrying header and lines...');
    this.setInteractionLock(entryDialogConfig, true);
    entryDialogConfig.statusMessage = {
      tone: 'info',
      title: 'Retrying',
      message: 'Loading lines...',
      blocking: true,
    };
    this.refreshPopup(popupId);

    try {
      const hydration = await this.hydrateFromApi(
        binding.module,
        entryDialogConfig,
        binding.context,
        binding.dataSource,
      );

      this.recalculateLineTotals(binding.module, entryDialogConfig);
      this.setInteractionLock(entryDialogConfig, hydration.lineHydrateFailed);
      entryDialogConfig.statusMessage = hydration.lineHydrateFailed
        ? {
          tone: 'error',
          title: 'Line load failed',
          message: hydration.lineHydrateMessage ?? 'Unable to load lines. Retry to continue.',
        }
        : undefined;

      if (!hydration.lineHydrateFailed) {
        this.scheduleEntryOptionHydration(binding.module, entryDialogConfig, popupId);
      }
    } catch {
      this.setInteractionLock(entryDialogConfig, true);
      entryDialogConfig.statusMessage = {
        tone: 'error',
        title: 'Line load failed',
        message: 'Unable to load lines. Retry to continue.',
      };
    } finally {
      this.refreshPopup(popupId);
      this.runModalLoading.end(scope);
    }
  }

  async openEntryFromList(popupId: string, row: unknown): Promise<boolean> {
    const binding = this.bindings.get(popupId);
    if (!binding) {
      this.lastOpenFailureReason = `binding-not-found:${popupId}`;
      return false;
    }

    const headerData = this.toRecord(row) ?? {};
    // Generate a NEW popup ID for the entry so it stacks on top of the list
    const entryPopupId = `${popupId}-entry-${Date.now()}`;
    return this.open({
      pageId: binding.pageId,
      target: 'entry',
      popupId: entryPopupId,
      context: {
        ...binding.context,
        headerData,
      },
      mode: 'page',
      size: 'full',
      allowNested: true,
    });
  }

  private async loadFreshHeaderData(
    binding: RunModalBinding,
    row: unknown,
  ): Promise<Record<string, unknown>> {
    const headerData = this.toRecord(row) ?? {};
    const dataSource = binding.headerDataSource ?? binding.dataSource;
    if (!dataSource?.endpoint?.trim()) {
      return headerData;
    }

    const recordId = this.entryRecord.resolvePersistedRecordId(headerData, dataSource);
    if (recordId === null || recordId === undefined || String(recordId).trim().length === 0) {
      return headerData;
    }

    try {
      const response = await firstValueFrom(this.dataSource.loadById(dataSource, recordId));
      return this.entryResponseNormalizer.normalizeSingleRecordResponse(response, headerData);
    } catch {
      return headerData;
    }
  }

  async handleListCommand(popupId: string, event: RunModalActionEvent): Promise<boolean> {
    const binding = this.bindings.get(popupId);
    if (!binding) {
      return false;
    }

    const actionKey = event.actionKey.trim().toLowerCase();
    if (actionKey === 'new') {
      return this.openEntryFromList(popupId, {});
    }

    if (actionKey === 'refresh') {
      const definition = await this.resolvePageDefinition(binding.pageId);
      if (!definition) {
        return false;
      }

      return this.openList(
        {
          pageId: binding.pageId,
          context: binding.context,
          mode: 'page',
          size: 'full',
          target: 'list',
          allowNested: true,
          popupId,
        },
        definition,
        true,
      );
    }

    return false;
  }

  handlePopupAction(
    popupId: string,
    entryDialogConfig: EntryDialogConfig,
    event: RunModalActionEvent,
  ): boolean {
    const binding = this.bindings.get(popupId);
    if (!binding) {
      return false;
    }

    if (event.actionKey === 'header:changed') {
      this.applyHeaderChange(entryDialogConfig, event.payload);
      return true;
    }

    if (event.actionKey === 'line:changed') {
      this.applyLineChange(binding, entryDialogConfig, event.payload);
      return true;
    }

    if (event.actionKey === 'cmd:retry-hydrate') {
      void this.retryHydration(popupId, binding, entryDialogConfig);
      return true;
    }

    if (event.actionKey === 'cmd:autosave') {
      if (this.usesManualSaveMode(entryDialogConfig)) {
        return true;
      }

      this.scheduleAutosave(popupId, binding, entryDialogConfig, event.payload);
      return true;
    }

    if (event.actionKey === 'cmd:apply' || event.actionKey === 'cmd:save') {
      this.clearAutosave(popupId);
      void this.saveHeader(popupId, binding, entryDialogConfig);
      return true;
    }

    if (event.actionKey === 'cmd:line-delete') {
      void this.deleteLines(popupId, binding, entryDialogConfig, event.payload);
      return true;
    }

    if (event.actionKey === 'cmd:line-new' || event.actionKey === 'cmd:line-insert') {
      void this.insertAndSaveLine(binding, entryDialogConfig, event.payload);
      return true;
    }

    if (event.actionKey === 'cmd:delete') {
      void this.deleteHeader(popupId, binding, entryDialogConfig);
      return true;
    }

    return false;
  }

  releasePopup(popupId: string): void {
    this.bindingState.releasePopup(popupId);
  }

  private clearAutosave(popupId: string): void {
    this.bindingState.clearAutosave(popupId);
  }

  private scheduleEntryOptionHydration(
    module: RunModalConfigModule,
    entryDialogConfig: EntryDialogConfig,
    popupId: string,
  ): void {
    void this.hydrateEntryOptions(module, entryDialogConfig, popupId);
  }

  private async hydrateEntryOptions(
    module: RunModalConfigModule,
    entryDialogConfig: EntryDialogConfig,
    popupId: string,
  ): Promise<void> {
    try {
      const optionState = await this.hydrateOptions(module, entryDialogConfig);
      const binding = this.bindings.get(popupId);
      if (binding) {
        Object.assign(binding, optionState);
      }
      this.refreshPopup(popupId);
    } catch {
      // Option lists are non-blocking; fields remain editable while lookups retry on the next open.
    }
  }

  private refreshPopup(popupId: string): void {
    this.bindingState.refreshPopup(popupId);
  }

  private scheduleAutosave(
    popupId: string,
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    payload: unknown,
  ): void {
    const existing = this.autosaveTimers.get(popupId);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.autosaveTimers.delete(popupId);
      void this.saveFromAutosave(popupId, binding, entryDialogConfig, payload);
    }, 350);

    this.autosaveTimers.set(popupId, timer);
  }

  private usesManualSaveMode(entryDialogConfig: EntryDialogConfig): boolean {
    return this.hasManualSaveCommand(entryDialogConfig.headerToolbarButtons)
      || this.hasManualSaveCommand(entryDialogConfig.lineToolbarButtons)
      || this.hasManualSaveCommand(entryDialogConfig.detailToolbarButtons);
  }

  private hasManualSaveCommand(buttons: EntryDialogConfig['headerToolbarButtons']): boolean {
    return (buttons ?? []).some((button) => {
      const actionKey = this.toText(button.actionKey).trim().toLowerCase();
      return actionKey === 'save' || actionKey === 'apply' || actionKey === 'cmd:save' || actionKey === 'cmd:apply';
    });
  }

  getLastOpenFailureReason(): string {
    return this.bindingState.getLastOpenFailureReason();
  }

  private async openList(
    request: RunModalRequest,
    definition: RunModalPageDefinition,
    forceRefresh = false,
  ): Promise<boolean> {
    const listPageConfig = this.pickListPageConfig(definition.module);
    const listDataSource = this.resolveContextualListDataSource(
      this.pickDataSource(definition.module),
      request.context ?? {},
    );
    if (!listPageConfig || !listDataSource?.endpoint?.trim()) {
      this.lastOpenFailureReason = `list-config-or-datasource-missing:${definition.pageId}`;
      return false;
    }

    const popupId = request.popupId ?? `run-modal-list-${request.pageId}-${Date.now()}`;
    const listScope = this.buildListScope(popupId);
    this.runModalLoading.begin(listScope, `Loading ${definition.pageId} list...`);
    const loadOptions = {
      top: listDataSource.pageSize ?? 20,
      forceRefresh,
    };
    const cachedRows: Record<string, unknown>[] = [];
    const opened = this.popupStack.open({
      id: popupId,
      title: listPageConfig.title ?? definition.pageId,
      mode: request.mode ?? 'page',
      size: request.size ?? 'full',
      allowNested: request.allowNested ?? true,
      data: {
        runModalList: {
          pageId: definition.pageId,
          config: listPageConfig,
          rows: cachedRows,
          loading: true,
          errorMessage: undefined,
        },
      },
    });

    if (opened) {
      this.bindings.set(popupId, {
        pageId: definition.pageId,
        module: definition.module,
        context: request.context ?? {},
        dataSource: listDataSource,
        headerDataSource: listDataSource,
        lineDataSource: this.pickLineDataSource(definition.module),
      });
      this.lastOpenFailureReason = '';
      void this.refreshOpenListPopup(popupId, listDataSource, loadOptions);
    } else {
      this.lastOpenFailureReason = `popup-open-blocked:${definition.pageId}`;
      this.runModalLoading.end(listScope);
    }

    return opened;
  }

  private async refreshOpenListPopup(
    popupId: string,
    listDataSource: DataSourceConfig,
    loadOptions: { top: number; forceRefresh?: boolean },
  ): Promise<void> {
    const scope = this.buildListScope(popupId);
    try {
      const rows = await this.loadListRows(listDataSource, loadOptions);
      this.popupStack.update(popupId, (popup) => ({
        ...popup,
        data: this.patchRunModalListState(popup.data, {
          rows,
          loading: false,
          errorMessage: undefined,
        }),
      }));
    } catch (error: unknown) {
      this.popupStack.update(popupId, (popup) => ({
        ...popup,
        data: this.patchRunModalListState(popup.data, {
          loading: false,
          errorMessage: this.getErrorMessage(error, GENERIC_MESSAGES.listLoadFailed),
        }),
      }));
    } finally {
      this.runModalLoading.end(scope);
    }
  }

  private buildOpenScope(pageId: string): string {
    const normalized = pageId.trim().toLowerCase() || 'unknown';
    return `run-modal:open:${normalized}`;
  }

  private buildOpenMessage(pageId: string): string {
    const normalized = pageId.trim();
    return normalized.length ? `Opening ${normalized}...` : 'Opening page...';
  }

  private buildHydrationScope(popupId: string): string {
    return `run-modal:hydrate:${popupId}`;
  }

  private buildListScope(popupId: string): string {
    return `section:run-modal:list:${popupId}`;
  }

  private buildMutationScope(popupId: string): string {
    return `run-modal:mutate:${popupId}`;
  }

  private patchRunModalListState(
    popupData: unknown,
    patch: Partial<Pick<RunModalListPopupState, 'rows' | 'loading' | 'errorMessage'>>,
  ): PopupHostData {
    const currentData = this.toRecord(popupData) as PopupHostData | null;
    const currentList = currentData?.runModalList;
    if (!currentList) {
      return currentData ?? {};
    }

    return {
      ...currentData,
      runModalList: {
        ...currentList,
        ...patch,
      },
    };
  }

  private resolveContextualListDataSource(
    dataSource: DataSourceConfig | undefined,
    context: RunModalContext,
  ): DataSourceConfig | undefined {
    if (!dataSource) {
      return undefined;
    }

    const parentKeyField = this.toText(dataSource.parentKeyField).trim();
    if (!parentKeyField.length) {
      return dataSource;
    }

    const contextRecord = this.toRecord(context['headerData']) ?? this.toRecord(context['activeLine']);
    if (!contextRecord) {
      return dataSource;
    }

    const sourceFieldCandidates = [
      this.toText(dataSource.contextDocumentNoField).trim(),
      this.toText(dataSource.documentNoField).trim(),
      parentKeyField,
    ].filter((field) => field.length > 0);

    const parentValue = sourceFieldCandidates
      .map((field) => this.readFieldValue(contextRecord, field))
      .find((value) => value !== null && value !== undefined && String(value).trim().length > 0);

    if (parentValue === null || parentValue === undefined || String(parentValue).trim().length === 0) {
      return dataSource;
    }

    const contextFilter = `${parentKeyField} eq ${this.toODataFilterLiteral(parentValue)}`;
    return {
      ...dataSource,
      defaultFilter: dataSource.defaultFilter
        ? `(${dataSource.defaultFilter}) and (${contextFilter})`
        : contextFilter,
    };
  }

  private async loadListRows(
    dataSource: DataSourceConfig,
    options: { top: number } = { top: dataSource.pageSize ?? 20 },
  ): Promise<Record<string, unknown>[]> {
    const response = await firstValueFrom(
      this.dataSource.loadList(dataSource, options).pipe(timeout(this.timeoutPolicy.requestTimeoutMs)),
    );
    return this.toRecordList(response);
  }

  private pickLineDataSource(module: RunModalConfigModule): DataSourceConfig | undefined {
    const lineConfig = this.pickObject(module, 'LineConfig');
    const nestedDataSource = this.toRecord(lineConfig?.['dataSource']);
    if (typeof nestedDataSource?.['endpoint'] === 'string') {
      return nestedDataSource as unknown as DataSourceConfig;
    }

    for (const [key, value] of Object.entries(module)) {
      const record = this.toRecord(value);
      if (!key.endsWith('LineDataSource') || !record) {
        continue;
      }

      if (typeof record['endpoint'] === 'string') {
        return record as unknown as DataSourceConfig;
      }
    }

    return undefined;
  }

  private async resolvePageDefinition(pageId: string): Promise<RunModalPageDefinition | undefined> {
    const normalized = pageId.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }

    const module = await this.loadRunModalConfigModule(normalized);
    if (!module) {
      return undefined;
    }

    if (!this.moduleDeclaresPageId(module, normalized)) {
      return undefined;
    }

    return {
      pageId: normalized,
      module,
    };
  }

  private async loadRunModalConfigModule(
    pageId: string,
  ): Promise<RunModalConfigModule | undefined> {
    const normalized = pageId.trim().toLowerCase();
    if (!normalized.length) {
      return undefined;
    }

    try {
      const resolved = await this.configResolver(normalized);
      if (resolved && this.moduleDeclaresPageId(resolved, normalized)) {
        return resolved;
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  private moduleDeclaresPageId(module: RunModalConfigModule, normalizedPageId: string): boolean {
    const bucket = this.toRecord(module);
    if (!bucket) {
      return false;
    }

    for (const exportedValue of Object.values(bucket)) {
      const record = this.toRecord(exportedValue);
      if (!record) {
        continue;
      }

      const declaredPageId = this.toText(record['pageId']).trim().toLowerCase();
      if (declaredPageId === normalizedPageId) {
        return true;
      }
    }

    return false;
  }

  private buildGenericEntryDialogConfig(
    module: RunModalConfigModule,
    pageId: string,
    context: RunModalContext,
  ): EntryDialogConfig {
    const headerConfig = this.pickObject(module, 'HeaderConfig');
    const lineConfig = this.pickObject(module, 'LineConfig');
    const title = this.pickDialogTitle(module) || this.toTitleCase(pageId);
    const pageLabel = this.resolvePageLabel(module, pageId, title);
    const headerSections =
      this.pickNestedArray(headerConfig, 'sections') ?? this.pickArray(module, 'HeaderSections');
    const lineColumns =
      this.pickNestedArray(lineConfig, 'columns') ?? this.pickArray(module, 'LineColumns');
    const headerToolbarButtons =
      this.pickNestedArray(headerConfig, 'toolbarButtons') ??
      this.pickArray(module, 'HeaderToolbarButtons');
    const lineToolbarButtons =
      this.pickNestedArray(lineConfig, 'toolbarButtons') ??
      this.pickArray(module, 'LineToolbarButtons');
    const headerCommandBar =
      this.toRecord(headerConfig?.['commandBar']) ?? this.pickObject(module, 'HeaderCommandBar');
    const lineCommandBar =
      this.toRecord(lineConfig?.['commandBar']) ?? this.pickObject(module, 'LineCommandBar');
    const linePlacement =
      this.toRecord(lineConfig?.['placement']) ?? this.pickObject(module, 'LinePlacement');
    const lineTotalsDefault = this.pickObject(module, 'LineTotalsDefault');
    const footerSections = this.pickArray(module, 'FooterSections');
    const attachmentsDefault =
      this.toRecord(headerConfig?.['attachmentsDefault']) ??
      this.pickObject(module, 'AttachmentsDefault') ??
      this.getDefaultAttachments();

    const headerData = this.buildHeaderData(context, headerSections);
    const lineRows = this.buildLineRows(context);
    const lineTotals = this.buildLineTotals(lineTotalsDefault);

    const entryDialogConfig: EntryDialogConfig = {
      pageLabel,
      title,
      headerCommandBar: headerCommandBar as EntryDialogConfig['headerCommandBar'],
      lineCommandBar: lineCommandBar as EntryDialogConfig['lineCommandBar'],
      linePlacement: linePlacement as EntryDialogConfig['linePlacement'],
      lineCommandPolicy: {
        injectDefaultLineNew: false,
        injectDefaultLineDelete: false,
      },
      headerToolbarButtons: headerToolbarButtons as EntryDialogConfig['headerToolbarButtons'],
      lineToolbarButtons: lineToolbarButtons as EntryDialogConfig['lineToolbarButtons'],
      headerSections: headerSections as EntryDialogConfig['headerSections'],
      headerData,
      lineColumns: lineColumns as EntryDialogConfig['lineColumns'],
      lineRows,
      lineTotals,
      footerSections: footerSections as EntryDialogConfig['footerSections'],
      attachments: attachmentsDefault as EntryDialogConfig['attachments'],
    };

    return entryDialogConfig;
  }

  private getDefaultAttachments(): EntryAttachmentsConfig {
    return {
      headerFilesCount: 0,
      lineFilesCount: 0,
      canUpload: true,
      primaryActionLabel: 'Add attachment',
      primaryActionKey: 'dialog:attachments',
    };
  }

  private async hydrateFromApi(
    module: RunModalConfigModule,
    entryDialogConfig: EntryDialogConfig,
    context: RunModalContext,
    dataSource?: DataSourceConfig,
  ): Promise<HydrationResult> {
    if (!dataSource?.endpoint?.trim()) {
      return { lineHydrateFailed: false };
    }

    const contextRecordId = this.resolveContextRecordId(context, dataSource);
    try {
      const listTop = this.resolveEntryHydrationTop(module, dataSource);
      const response = await firstValueFrom(
        this.dataSource
          .loadList(dataSource, { top: listTop })
          .pipe(timeout(this.timeoutPolicy.hydrationTimeoutMs)),
      );
      const records = this.entryHydration.extractRecords(response);
      if (!records.length) {
        if (this.isWorksheetPage(module)) {
          entryDialogConfig.lineRows = [];
        }

        if (contextRecordId !== undefined && contextRecordId !== null && String(contextRecordId).trim().length > 0) {
          try {
            const byIdRecord = await this.entryHydration.loadHeaderById(
              dataSource,
              contextRecordId,
              {},
              this.timeoutPolicy.hydrationTimeoutMs,
            );
            if (Object.keys(byIdRecord).length) {
              this.mergeHeaderFromFirstRecord(byIdRecord, entryDialogConfig);
            }
          } catch {
            // Keep popup rendering even when API load fails.
          }
        }
        return { lineHydrateFailed: false };
      }

      const headerRecord = this.entryHydration.pickHeaderRecord(records, contextRecordId, dataSource);
      this.mergeHeaderFromFirstRecord(headerRecord, entryDialogConfig);
      if (this.isWorksheetPage(module)) {
        entryDialogConfig.lineRows = this.mapRecordsToLineRows(records, entryDialogConfig);
        return { lineHydrateFailed: false };
      }

      return this.hydrateRelatedLines(module, entryDialogConfig);
    } catch {
      if (!this.pickLineDataSource(module)) {
        return { lineHydrateFailed: false };
      }

      return {
        lineHydrateFailed: true,
        lineHydrateMessage: 'Unable to load lines. Retry to continue.',
      };
    }
  }

  private async hydrateRelatedLines(
    module: RunModalConfigModule,
    entryDialogConfig: EntryDialogConfig,
  ): Promise<HydrationResult> {
    if (!this.pickLineDataSource(module)) {
      return { lineHydrateFailed: false };
    }

    if (!entryDialogConfig.headerData) {
      return {
        lineHydrateFailed: true,
        lineHydrateMessage: 'Header data is missing for line loading. Retry to continue.',
      };
    }

    try {
      const records = await this.loadRelatedLineRows(module, entryDialogConfig.headerData);
      entryDialogConfig.lineRows = this.mapRecordsToLineRows(records, entryDialogConfig);
      return { lineHydrateFailed: false };
    } catch {
      entryDialogConfig.lineRows = [];
      return {
        lineHydrateFailed: true,
        lineHydrateMessage: 'Unable to load lines. Retry to continue.',
      };
    }
  }

  private async loadRelatedLineRows(
    module: RunModalConfigModule,
    headerData: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]> {
    const lineDataSource = this.pickLineDataSource(module);
    if (!lineDataSource?.endpoint?.trim()) {
      return [];
    }

    return this.entryHydration.loadLineRowsForHeader(
      lineDataSource,
      headerData,
      {
        timeoutMs: this.timeoutPolicy.hydrationTimeoutMs,
        defaultTop: 200,
        allowWithoutParentKey: false,
      },
    );
  }

  private resolveContextRecordId(context: RunModalContext, dataSource: DataSourceConfig): unknown {
    const providedHeader = this.toRecord(context['headerData']);
    if (providedHeader) {
      const persisted = this.entryRecord.resolvePersistedRecordId(providedHeader, dataSource);
      if (persisted !== null && persisted !== undefined && String(persisted).trim().length > 0) {
        return persisted;
      }
    }

    const directCandidates = ['recordId', 'systemId', 'id', 'companyId', 'CompanyId'];
    for (const key of directCandidates) {
      const value = context[key];
      if (value !== null && value !== undefined && String(value).trim().length > 0) {
        return value;
      }
    }

    return undefined;
  }

  private resolveNavigationDataSource(
    module: RunModalConfigModule,
    context: RunModalContext,
  ): DataSourceConfig | undefined {
    const baseDataSource = this.pickDataSource(module);
    const relation = baseDataSource?.navigation;
    if (!baseDataSource?.endpoint?.trim()) {
      return undefined;
    }

    if (!relation) {
      return baseDataSource;
    }

    const activeLine = this.toRecord(context['activeLine']);
    const idCandidates = relation.parentIdFields ?? [];
    const activeLineParentId = idCandidates
      .map((field) => activeLine?.[field])
      .find((value) => value !== null && value !== undefined && String(value).trim().length > 0);
    const contextRecordId = this.resolveContextRecordId(context, baseDataSource);
    const parentId =
      activeLineParentId !== undefined && activeLineParentId !== null && String(activeLineParentId).trim().length > 0
        ? activeLineParentId
        : contextRecordId;

    if (parentId === null || parentId === undefined || String(parentId).trim().length === 0) {
      return baseDataSource;
    }

    return {
      ...baseDataSource,
      endpoint: `${relation.parentEndpoint}(${this.toODataId(parentId)})/${relation.childCollection}`,
    };
  }

  private pickDataSource(module: RunModalConfigModule): DataSourceConfig | undefined {
    const listConfig = this.pickListPageConfig(module);
    const nestedDataSource = this.toRecord(listConfig?.['dataSource']);
    if (typeof nestedDataSource?.['endpoint'] === 'string') {
      return nestedDataSource as unknown as DataSourceConfig;
    }

    for (const [key, value] of Object.entries(module)) {
      const record = this.toRecord(value);
      if (!key.endsWith('ListDataSource') || !record) {
        continue;
      }

      if (typeof record['endpoint'] === 'string') {
        return record as unknown as DataSourceConfig;
      }
    }

    return undefined;
  }

  private toRecordList(response: unknown): Record<string, unknown>[] {
    return this.valueMapper.toRecordList(response);
  }

  private mapRecordsToLineRows(
    records: Record<string, unknown>[],
    entryDialogConfig: EntryDialogConfig,
  ): Record<string, unknown>[] {
    const columns = entryDialogConfig.lineColumns ?? [];
    if (!columns.length) {
      return records;
    }

    return records.map((record) => {
      const row: Record<string, unknown> = { ...record };
      for (const column of columns) {
        const field = this.toText(column.field ?? column.id).trim();
        if (!field) {
          continue;
        }

        row[field] = this.readFieldValue(record, field);
      }

      return row;
    });
  }

  private async hydrateOptions(
    module: RunModalConfigModule,
    entryDialogConfig: EntryDialogConfig,
  ): Promise<Partial<RunModalBinding>> {
    const optionState = await this.hydrateLineMasterOptions(module, entryDialogConfig);
    await this.hydrateHeaderOptions(entryDialogConfig);
    await this.hydrateLineEndpointOptions(entryDialogConfig);

    return optionState;
  }

  private async hydrateHeaderOptions(entryDialogConfig: EntryDialogConfig): Promise<void> {
    const headerData = entryDialogConfig.headerData ?? {};
    const jobs: Array<() => Promise<void>> = [];

    for (const section of entryDialogConfig.headerSections ?? []) {
      for (const field of section.fields) {
        const optionsKey = this.toText(field.optionsDataKey).trim();
        const endpoints = this.resolveApiEndpoints(field.api ?? field.optionsEndpoints);
        if (!optionsKey.length || !endpoints.length) {
          continue;
        }

        jobs.push(() =>
          firstValueFrom(this.masterData.loadFirstAvailableList(endpoints))
            .then((records) => {
              headerData[optionsKey] = records;
            })
            .catch(() => {
              headerData[optionsKey] = [];
            }),
        );
      }
    }

    await this.runJobsInBatches(jobs, 3);
    entryDialogConfig.headerData = headerData;
  }

  private async hydrateLineEndpointOptions(entryDialogConfig: EntryDialogConfig): Promise<void> {
    const rows = entryDialogConfig.lineRows ?? [];
    const jobs: Array<() => Promise<void>> = [];

    for (const column of entryDialogConfig.lineColumns ?? []) {
      const field = this.toText(column.field ?? column.id).trim();
      const optionsKey = this.toText(
        column.optionsDataKey ?? (field ? `__options_${field}` : ''),
      ).trim();
      const endpoints = this.resolveApiEndpoints(column.api ?? column.optionsEndpoints);
      if (!field.length || !optionsKey.length || !endpoints.length) {
        continue;
      }

      jobs.push(() =>
        firstValueFrom(this.masterData.loadFirstAvailableList(endpoints))
          .then((records) => {
            const options = this.masterData.toSelectOptions(
              records,
              this.resolveConfiguredFields(column.valueField),
              this.resolveConfiguredFields(column.labelField),
            );
            rows.forEach((row) => {
              row[optionsKey] = options;
            });
          })
          .catch(() => {
            rows.forEach((row) => {
              row[optionsKey] = [];
            });
          }),
      );
    }

    await this.runJobsInBatches(jobs, 3);
  }

  private async runJobsInBatches(jobs: Array<() => Promise<void>>, batchSize: number): Promise<void> {
    if (!jobs.length) {
      return;
    }

    const size = Math.max(1, Math.floor(batchSize));
    for (let index = 0; index < jobs.length; index += size) {
      await Promise.all(jobs.slice(index, index + size).map((job) => job()));
    }
  }

  private async hydrateLineMasterOptions(
    module: RunModalConfigModule,
    entryDialogConfig: EntryDialogConfig,
  ): Promise<Partial<RunModalBinding>> {
    const lineConfig = this.pickObject(module, 'LineConfig');
    const endpointMap = this.buildLineTypeMasterEndpointMap(entryDialogConfig);
    if (!Object.keys(endpointMap).length) {
      return {};
    }

    let masters: Record<string, Record<string, unknown>[]>;
    try {
      masters = await firstValueFrom(this.masterData.loadMasterLists(endpointMap));
    } catch {
      masters = {};
    }

    const registry = this.buildLineMasterRegistry(masters, entryDialogConfig);
    const optionFieldMap = this.buildLineOptionFieldMap(entryDialogConfig, masters);
    const numberOptionFieldKey = this.resolveLineNumberOptionFieldKey(entryDialogConfig);
    for (const row of entryDialogConfig.lineRows ?? []) {
      this.assignLineRowOptions(row, entryDialogConfig, registry, optionFieldMap, numberOptionFieldKey);
    }

    return {
      lineMasterRegistry: registry,
      lineOptionFieldMap: optionFieldMap,
      lineNumberOptionFieldKey: numberOptionFieldKey,
    };
  }

  private buildLineMasterRegistry(
    masters: Record<string, Record<string, unknown>[]>,
    entryDialogConfig?: EntryDialogConfig,
  ): LineMasterRegistry {
    const dynamicRegistry = this.buildDynamicLineMasterRegistry(
      masters,
      entryDialogConfig,
    );
    if (dynamicRegistry) {
      return dynamicRegistry;
    }

    return {
      defaultType: '',
      emptyType: ' ',
      byType: {},
    };
  }

  private buildEndpointMap(source: Record<string, unknown>): Record<string, string[]> {
    const endpointMap: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(source)) {
      if (Array.isArray(value)) {
        endpointMap[key] = value
          .map((endpoint) => this.toText(endpoint).trim())
          .filter((endpoint) => endpoint.length > 0);
      }
    }

    return endpointMap;
  }

  private resolveApiEndpoints(source: unknown): string[] {
    return this.valueMapper.resolveApiEndpoints(source);
  }

  private buildLineTypeMasterEndpointMap(
    entryDialogConfig: EntryDialogConfig,
  ): Record<string, string[]> {
    const typeColumn = this.resolveLineTypeColumn(entryDialogConfig);
    const endpointMap: Record<string, string[]> = {};

    for (const option of typeColumn?.options ?? []) {
      const type = this.toText(option.value).trim();
      const endpoints = this.resolveApiEndpoints(option.api);
      if (type.length && endpoints.length) {
        endpointMap[type] = endpoints;
      }
    }

    return endpointMap;
  }

  private buildDynamicLineMasterRegistry(
    masters: Record<string, Record<string, unknown>[]>,
    entryDialogConfig: EntryDialogConfig | undefined,
  ): LineMasterRegistry | undefined {
    const typeColumn = entryDialogConfig ? this.resolveLineTypeColumn(entryDialogConfig) : undefined;
    const typeOptions = typeColumn?.options ?? [];
    const byType: LineMasterRegistry['byType'] = {};

    for (const option of typeOptions) {
      const type = this.toText(option.value);
      if (!type.length) {
        continue;
      }

      byType[type] = {
        options: this.buildConfiguredOptions(
          masters[type],
          entryDialogConfig ? this.resolveLineMasterValueColumn(entryDialogConfig) : undefined,
        ),
        records: masters[type] ?? [],
      };
    }

    if (!Object.keys(byType).length) {
      return undefined;
    }

    return {
      defaultType: this.toText(typeOptions[0]?.value) || ' ',
      emptyType: ' ',
      byType,
    };
  }

  private buildLineOptionFieldMap(
    entryDialogConfig: EntryDialogConfig,
    masters: Record<string, Record<string, unknown>[]>,
  ): Record<string, Array<{ label: string; value: unknown }>> {
    const result: Record<string, Array<{ label: string; value: unknown }>> = {};

    for (const column of entryDialogConfig.lineColumns ?? []) {
      const field = this.toText(column.field ?? column.id).trim();
      const optionsKey = this.toText(
        column.optionsDataKey ?? (field ? `__options_${field}` : ''),
      ).trim();
      if (!optionsKey.length) {
        continue;
      }

      const endpoints = this.resolveApiEndpoints(column.api ?? column.optionsEndpoints);
      if (endpoints.length) {
        result[optionsKey] = this.buildConfiguredOptions(
          masters[optionsKey],
          column,
        );
      }
    }

    return result;
  }

  private buildConfiguredOptions(
    records: unknown,
    column?: { valueField?: string | string[]; labelField?: string | string[] },
  ): Array<{ label: string; value: unknown }> {
    const valueFields = this.resolveConfiguredFields(column?.valueField);
    const labelFields = this.resolveConfiguredFields(column?.labelField);

    return this.masterData.toSelectOptions(records, valueFields, labelFields);
  }

  private assignLineRowOptions(
    row: Record<string, unknown>,
    entryDialogConfig: EntryDialogConfig,
    registry: LineMasterRegistry,
    optionFieldMap: Record<string, Array<{ label: string; value: unknown }>>,
    numberOptionFieldKey: string,
  ): void {
    const typeField = this.resolveLineTypeField(entryDialogConfig);

    if (!typeField && !numberOptionFieldKey) {
      for (const [field, options] of Object.entries(optionFieldMap)) {
        row[field] = options;
      }
      return;
    }

    const type = typeField ? this.lineMasters.resolveType(row[typeField], registry) : registry.emptyType;
    this.lineMasters.assignTypeOptions(row, type, registry, optionFieldMap, numberOptionFieldKey);
  }

  private resolveLineNumberOptionFieldKey(entryDialogConfig: EntryDialogConfig): string {
    const numberColumn = this.resolveLineMasterValueColumn(entryDialogConfig);

    if (numberColumn) {
      const field = this.toText(numberColumn.field ?? numberColumn.id).trim();
      const optionsKey = this.toText(
        numberColumn.optionsDataKey ?? (field ? `__options_${field}` : ''),
      ).trim();
      if (optionsKey.length) {
        return optionsKey;
      }
    }
    return '';
  }

  private resolveLineTypeColumn(entryDialogConfig: EntryDialogConfig): LineColumnConfig | undefined {
    return (entryDialogConfig.lineColumns ?? []).find((column) =>
      (column.options ?? []).some((option) => this.resolveApiEndpoints(option.api).length > 0),
    );
  }

  private resolveLineTypeField(entryDialogConfig: EntryDialogConfig): string {
    const column = this.resolveLineTypeColumn(entryDialogConfig);
    return this.toText(column?.field ?? column?.id).trim();
  }

  private resolveLineMasterValueColumn(entryDialogConfig: EntryDialogConfig): LineColumnConfig | undefined {
    return (entryDialogConfig.lineColumns ?? []).find((column) => Boolean(column.fill));
  }

  private mergeHeaderFromFirstRecord(
    record: Record<string, unknown>,
    entryDialogConfig: EntryDialogConfig,
  ): void {
    const headerData = entryDialogConfig.headerData ?? {};
    const sections = entryDialogConfig.headerSections ?? [];
    for (const key of ['systemId', 'SystemId', 'id', 'Id']) {
      const value = this.readFieldValue(record, key);
      if (value !== null && value !== undefined && value !== '') {
        headerData[key] = value;
      }
    }

    for (const section of sections) {
      for (const field of section.fields) {
        const key = this.toText(field.key).trim();
        if (!key) {
          continue;
        }

        const value = this.readFieldValue(record, key);
        if (value !== null && value !== undefined && value !== '') {
          headerData[key] = value;
        }
      }
    }

    entryDialogConfig.headerData = headerData;
  }

  private readFieldValue(record: Record<string, unknown>, field: string): unknown {
    if (field in record) {
      return record[field];
    }

    const lower = field.toLowerCase();
    const matched = Object.keys(record).find((key) => key.toLowerCase() === lower);
    if (matched) {
      return record[matched];
    }

    const normalizedField = lower.replace(/[^a-z0-9]/g, '');
    if (normalizedField.length >= 3) {
      const suffixMatches = Object.keys(record).filter((key) =>
        key.toLowerCase().replace(/[^a-z0-9]/g, '').endsWith(normalizedField),
      );

      if (suffixMatches.length === 1) {
        return record[suffixMatches[0]];
      }
    }

    return '';
  }

  private async saveFromAutosave(
    popupId: string,
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    payload: unknown,
  ): Promise<void> {
    if (!this.isRecord(payload)) {
      return;
    }

    try {
      if (this.isRecord(payload['row'])) {
        await this.saveLine(popupId, binding, entryDialogConfig, payload['row'], payload, true, true);
        return;
      }

      if (typeof payload['fieldKey'] === 'string') {
        await this.saveHeaderField(popupId, binding, entryDialogConfig, payload, true, true);
      }
    } catch (error: unknown) {
      this.setErrorStatus(entryDialogConfig, 'Save failed', error, 'Unable to save changes.');
    }
  }

  private async saveHeaderField(
    popupId: string,
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    changePayload: Record<string, unknown>,
    showProgress = true,
    autosave = false,
  ): Promise<void> {
    const dataSource = this.resolveHeaderSaveDataSource(binding);
    const headerData = entryDialogConfig.headerData;
    if (!dataSource?.endpoint || !headerData) {
      return;
    }

    if (dataSource.supportsUpdate === false) {
      return;
    }

    const fieldKey = this.toText(changePayload['fieldKey']).trim();
    if (!fieldKey.length || !(fieldKey in headerData)) {
      return;
    }

    const id = this.entryRecord.resolvePersistedRecordId(headerData, dataSource);
    if (id === null || id === undefined || id === '') {
      return;
    }

    const payload: Record<string, unknown> = {
      [fieldKey]: headerData[fieldKey],
    };

    const scope = this.buildMutationScope(popupId);
    const shouldBlock = !autosave;
    if (shouldBlock) {
      this.runModalLoading.begin(scope, autosave ? 'Autosaving header...' : 'Saving header...');
    }

    try {
      const updated = await firstValueFrom(this.dataSource.update(dataSource, id, payload));
      this.mergeRecord(headerData, updated);
      this.recalculateLineTotals(binding.module, entryDialogConfig);
      if (showProgress) {
        entryDialogConfig.statusMessage = {
          tone: 'success',
          title: 'Saved',
          message: autosave ? 'Header autosaved.' : 'Header saved.',
        };
      }
    } catch (error: unknown) {
      this.setErrorStatus(entryDialogConfig, 'Save failed', error, 'Unable to save changes.');
    } finally {
      if (shouldBlock) {
        this.runModalLoading.end(scope);
      }
    }
  }

  private async saveHeader(
    popupId: string,
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
  ): Promise<void> {
    const scope = this.buildMutationScope(popupId);
    this.runModalLoading.begin(scope, 'Saving changes...');

    try {
    if (binding.dataSource?.navigation && binding.dataSource.endpoint) {
      await this.saveRelationHeader(binding, entryDialogConfig);
      return;
    }

    const dataSource = this.resolveHeaderSaveDataSource(binding);
    const headerData = entryDialogConfig.headerData;
    if (!dataSource?.endpoint || !headerData) {
      return;
    }

    if (dataSource.supportsUpdate === false) {
      return;
    }

    try {
      const payload = this.buildHeaderPayload(binding, entryDialogConfig);
      await this.createOrUpdateRecord(dataSource, headerData, payload);
      this.recalculateLineTotals(binding.module, entryDialogConfig);
      entryDialogConfig.statusMessage = {
        tone: 'success',
        title: 'Saved',
        message: 'Changes saved.',
      };
    } catch (error: unknown) {
      this.setErrorStatus(entryDialogConfig, 'Save failed', error, 'Unable to save changes.');
    }
    } finally {
      this.runModalLoading.end(scope);
    }
  }

  private async saveLine(
    popupId: string,
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    row: Record<string, unknown>,
    changePayload?: unknown,
    showProgress = true,
    autosave = false,
  ): Promise<void> {
    const dataSource = this.resolveLineSaveDataSource(
      binding,
      entryDialogConfig.headerData ?? undefined,
    );
    if (!dataSource?.endpoint) {
      entryDialogConfig.statusMessage = {
        tone: 'error',
        title: 'Save failed',
        message: 'Line datasource is not ready for save.',
      };
      return;
    }

    const scope = this.buildMutationScope(popupId);
    const shouldBlock = !autosave;
    if (shouldBlock) {
      this.runModalLoading.begin(scope, autosave ? 'Autosaving line...' : 'Saving line...');
    }

    try {
      const payload = this.buildLineSavePayload(
        binding,
        row,
        entryDialogConfig,
        dataSource,
        changePayload,
      );
      if (!Object.keys(payload).length) {
        entryDialogConfig.statusMessage = undefined;
        return;
      }

      await this.createOrUpdateRecord(dataSource, row, payload);
      this.recalculateLineTotals(binding.module, entryDialogConfig);
      if (showProgress) {
        entryDialogConfig.statusMessage = {
          tone: 'success',
          title: 'Saved',
          message: autosave ? 'Line autosaved.' : 'Line saved.',
        };
      }
    } catch (error: unknown) {
      this.setErrorStatus(entryDialogConfig, 'Save failed', error, 'Unable to save line.');
    } finally {
      if (shouldBlock) {
        this.runModalLoading.end(scope);
      }
    }
  }

  private async deleteLines(
    popupId: string,
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    payload: unknown,
  ): Promise<void> {
    const dataSource = this.resolveLineSaveDataSource(
      binding,
      entryDialogConfig.headerData ?? undefined,
    );
    if (!dataSource?.endpoint) {
      entryDialogConfig.statusMessage = {
        tone: 'error',
        title: 'Delete failed',
        message: 'Line datasource is not ready for delete.',
      };
      return;
    }

    const targets: Record<string, unknown>[] = [];
    if (
      this.isRecord(payload) &&
      Array.isArray(payload['selectedIndexes']) &&
      entryDialogConfig.lineRows?.length
    ) {
      const indexes = payload['selectedIndexes']
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0);

      for (const index of indexes) {
        const row = entryDialogConfig.lineRows[index];
        if (row) {
          targets.push(row);
        }
      }
    }

    if (!targets.length && this.isRecord(payload) && Array.isArray(payload['selectedRows'])) {
      targets.push(
        ...payload['selectedRows'].filter((item): item is Record<string, unknown> =>
          this.isRecord(item),
        ),
      );
    }

    if (!targets.length && this.isRecord(payload) && this.isRecord(payload['activeRow'])) {
      targets.push(payload['activeRow']);
    }

    if (!targets.length && entryDialogConfig.lineRows?.length) {
      targets.push(entryDialogConfig.lineRows[entryDialogConfig.lineRows.length - 1]);
    }

    if (!targets.length) {
      return;
    }

    const confirmed = await this.confirmation.confirmIntent({
      intent: 'delete',
      count: targets.length,
      entityLabel: 'line',
    });

    if (!confirmed) {
      return;
    }

    const scope = this.buildMutationScope(popupId);
    this.runModalLoading.begin(scope, 'Deleting selected line(s)...');

    try {
      for (const row of targets) {
        const id = this.entryRecord.resolvePersistedRecordId(row, dataSource);
        if (id !== null && id !== undefined && id !== '') {
          await firstValueFrom(this.dataSource.delete(dataSource, id));
        }
      }

      if (entryDialogConfig.lineRows) {
        entryDialogConfig.lineRows = entryDialogConfig.lineRows.filter(
          (row) => !targets.includes(row),
        );
      }
      this.recalculateLineTotals(binding.module, entryDialogConfig);

      entryDialogConfig.statusMessage = {
        tone: 'success',
        title: 'Deleted',
        message: 'Line deleted.',
      };
    } catch (error: unknown) {
      this.setErrorStatus(
        entryDialogConfig,
        GENERIC_MESSAGES.deleteFailedTitle,
        error,
        GENERIC_MESSAGES.lineDeleteFailedMessage,
      );
    } finally {
      this.runModalLoading.end(scope);
    }
  }

  private async deleteHeader(
    popupId: string,
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
  ): Promise<void> {
    const scope = this.buildMutationScope(popupId);
    this.runModalLoading.begin(scope, 'Deleting record...');

    try {
    if (binding.dataSource?.navigation && binding.dataSource.endpoint) {
      await this.deleteRelationHeader(binding, entryDialogConfig);
      return;
    }

    const dataSource = this.resolveHeaderSaveDataSource(binding);
    const headerData = entryDialogConfig.headerData;
    if (!dataSource?.endpoint || !headerData) {
      return;
    }

    const id = this.entryRecord.resolvePersistedRecordId(headerData, dataSource);
    if (id === null || id === undefined || id === '') {
      return;
    }

    const confirmed = await this.confirmation.confirmIntent({
      intent: 'delete',
      count: 1,
      entityLabel: this.resolvePageEntityLabel(binding.pageId),
    });

    if (!confirmed) {
      return;
    }

    try {
      await firstValueFrom(this.dataSource.delete(dataSource, id));
      entryDialogConfig.statusMessage = {
        tone: 'success',
        title: 'Deleted',
        message: 'Record deleted.',
      };
    } catch (error: unknown) {
      this.setErrorStatus(
        entryDialogConfig,
        GENERIC_MESSAGES.deleteFailedTitle,
        error,
        GENERIC_MESSAGES.deleteFailedMessage,
      );
    }
    } finally {
      this.runModalLoading.end(scope);
    }
  }

  private resolvePageEntityLabel(pageId: string): string {
    const normalized = pageId.trim();
    if (!normalized.length) {
      return 'record';
    }

    return this.toTitleCase(normalized);
  }

  private async createOrUpdateRecord(
    dataSource: DataSourceConfig,
    source: Record<string, unknown>,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const id = this.entryRecord.resolvePersistedRecordId(source, dataSource);
    if (id !== null && id !== undefined && id !== '' && dataSource.supportsUpdate !== false) {
      const updated = await firstValueFrom(this.dataSource.update(dataSource, id, payload));
      this.mergeRecord(source, updated);
      return;
    }

    const created = await firstValueFrom(this.dataSource.create(dataSource, this.stripTechnicalIdentity(payload)));
    this.mergeRecord(source, created);
  }

  private resolveHeaderSaveDataSource(binding: RunModalBinding): DataSourceConfig | undefined {
    return binding.headerDataSource ?? binding.dataSource;
  }

  private async saveRelationHeader(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
  ): Promise<void> {
    const relationDataSource = binding.dataSource;
    const baseDataSource = binding.headerDataSource ?? relationDataSource;
    const headerData = entryDialogConfig.headerData;
    if (!relationDataSource?.endpoint || !baseDataSource?.endpoint || !headerData) {
      return;
    }

    try {
      const payload = this.buildHeaderPayload(binding, entryDialogConfig);

      const existing = await this.loadFirstRelationRecord(relationDataSource);
      const existingId = existing
        ? this.entryRecord.resolvePersistedRecordId(existing, baseDataSource)
        : undefined;
      if (existingId !== null && existingId !== undefined && existingId !== '') {
        await firstValueFrom(this.dataSource.delete(baseDataSource, existingId));
      }

      await firstValueFrom(this.dataSource.create(relationDataSource, payload));
      await this.refreshRelationEntry(relationDataSource, entryDialogConfig, binding.module);
      this.recalculateLineTotals(binding.module, entryDialogConfig);

      entryDialogConfig.statusMessage = {
        tone: 'success',
        title: 'Saved',
        message: 'Changes saved.',
      };
    } catch (error: unknown) {
      this.setErrorStatus(entryDialogConfig, 'Save failed', error, 'Unable to save changes.');
    }
  }

  private async deleteRelationHeader(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
  ): Promise<void> {
    const relationDataSource = binding.dataSource;
    const baseDataSource = binding.headerDataSource ?? relationDataSource;
    const headerData = entryDialogConfig.headerData;
    if (!relationDataSource?.endpoint || !baseDataSource?.endpoint || !headerData) {
      return;
    }

    const existing = await this.loadFirstRelationRecord(relationDataSource);
    const id =
      this.entryRecord.resolvePersistedRecordId(headerData, baseDataSource) ??
      (existing ? this.entryRecord.resolvePersistedRecordId(existing, baseDataSource) : undefined);
    if (id === null || id === undefined || id === '') {
      entryDialogConfig.statusMessage = {
        tone: 'success',
        title: 'Delete skipped',
        message: 'No persisted record found to delete.',
      };
      return;
    }

    const confirmed = await this.confirmation.confirmIntent({
      intent: 'delete',
      count: 1,
      entityLabel: this.resolvePageEntityLabel(binding.pageId),
    });

    if (!confirmed) {
      return;
    }

    try {
      await firstValueFrom(this.dataSource.delete(baseDataSource, id));
      this.clearRelationEntry(binding, entryDialogConfig);
      this.recalculateLineTotals(binding.module, entryDialogConfig);
      entryDialogConfig.statusMessage = {
        tone: 'success',
        title: 'Deleted',
        message: 'Record deleted.',
      };
    } catch (error: unknown) {
      this.setErrorStatus(
        entryDialogConfig,
        GENERIC_MESSAGES.deleteFailedTitle,
        error,
        GENERIC_MESSAGES.deleteFailedMessage,
      );
    }
  }

  private async loadFirstRelationRecord(
    dataSource: DataSourceConfig,
  ): Promise<Record<string, unknown> | undefined> {
    try {
      const response = await firstValueFrom(this.dataSource.loadList(dataSource, { top: 1 }));
      return this.toRecordList(response)[0];
    } catch {
      return undefined;
    }
  }

  private async refreshRelationEntry(
    dataSource: DataSourceConfig,
    entryDialogConfig: EntryDialogConfig,
    module: RunModalConfigModule,
  ): Promise<void> {
    const response = await firstValueFrom(
      this.dataSource.loadList(dataSource, { top: this.resolveEntryHydrationTop(module, dataSource) }),
    );
    const records = this.toRecordList(response);
    entryDialogConfig.lineRows = this.mapRecordsToLineRows(records, entryDialogConfig);
    if (records.length) {
      this.mergeHeaderFromFirstRecord(records[0], entryDialogConfig);
    }
  }

  private clearRelationEntry(binding: RunModalBinding, entryDialogConfig: EntryDialogConfig): void {
    const headerData = entryDialogConfig.headerData;
    if (headerData) {
      const keyFields = this.getConfiguredIdentityFields(binding);
      for (const field of keyFields) {
        if (field in headerData) {
          headerData[field] = '';
        }
      }
    }

    entryDialogConfig.lineRows = [];
  }

  private resolveLineSaveDataSource(
    binding: RunModalBinding,
    headerData?: Record<string, unknown>,
  ): DataSourceConfig | undefined {
    const baseDataSource = binding.lineDataSource ?? binding.dataSource;
    if (!baseDataSource?.endpoint?.trim()) {
      return undefined;
    }

    const relation = baseDataSource.navigation;
    if (!relation) {
      return baseDataSource;
    }

    const parentEndpoint = this.toText(relation.parentEndpoint).trim();
    const childCollection = this.toText(relation.childCollection).trim();
    const parentIdFields = (relation.parentIdFields ?? [])
      .map((field) => this.toText(field).trim())
      .filter((field) => field.length > 0);

    if (!parentEndpoint.length || !childCollection.length || !parentIdFields.length || !headerData) {
      return undefined;
    }

    const parentId = this.resolveRelationParentId(headerData, parentIdFields);
    if (!this.hasMeaningfulPayloadValue(parentId)) {
      return undefined;
    }

    return {
      ...baseDataSource,
      endpoint: `${parentEndpoint}(${this.toODataId(parentId)})/${childCollection}`,
    };
  }

  private buildHeaderPayload(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
  ): Record<string, unknown> {
    const headerData = entryDialogConfig.headerData ?? {};
    const sections = entryDialogConfig.headerSections ?? [];
    const dataSource = this.resolveHeaderSaveDataSource(binding);
    const allowedFields = dataSource?.createFields?.length
      ? new Set(dataSource.createFields)
      : undefined;
    const payload: Record<string, unknown> = {};
    for (const section of sections) {
      for (const field of section.fields) {
        const key = this.toText(field.key).trim();
        if (!key || !(key in headerData)) {
          continue;
        }

        if (allowedFields && !allowedFields.has(key)) {
          continue;
        }

        payload[key] = headerData[key];
      }
    }

    return payload;
  }

  private buildLineSavePayload(
    binding: RunModalBinding,
    row: Record<string, unknown>,
    entryDialogConfig: EntryDialogConfig,
    dataSource: DataSourceConfig,
    changePayload?: unknown,
  ): Record<string, unknown> {
    if (this.hasPersistedRecordId(row, dataSource)) {
      return this.buildLineUpdatePayload(row, dataSource, changePayload);
    }

    return this.buildLineCreatePayload(binding, row, entryDialogConfig, dataSource);
  }

  private buildLineUpdatePayload(
    row: Record<string, unknown>,
    dataSource: DataSourceConfig,
    changePayload?: unknown,
  ): Record<string, unknown> {
    const field = this.resolveChangedLineField(changePayload);
    if (!field.length || this.isBlockedLineField(field, dataSource)) {
      return {};
    }

    return {
      [field]: this.readFieldValue(row, field),
    };
  }

  private buildLineCreatePayload(
    binding: RunModalBinding,
    row: Record<string, unknown>,
    entryDialogConfig: EntryDialogConfig,
    dataSource: DataSourceConfig,
  ): Record<string, unknown> {
    this.ensureLineParentFields(row, entryDialogConfig, dataSource);
    this.ensureLineNo(binding, row, entryDialogConfig);

    const source: Record<string, unknown> = { ...row };

    const payload: Record<string, unknown> = {};
    const allowedFields = dataSource.createFields?.length ? dataSource.createFields : undefined;
    if (allowedFields?.length) {
      for (const field of allowedFields) {
        const value = source[field];
        if (!this.hasMeaningfulPayloadValue(value)) {
          continue;
        }

        payload[field] = value;
      }
    } else {
      for (const column of entryDialogConfig.lineColumns ?? []) {
        const field = this.toText(column.field ?? column.id).trim();
        if (!field || !(field in source)) {
          continue;
        }

        if (!field.length || this.isBlockedLineField(field, dataSource) || field.startsWith('__')) {
          continue;
        }

        payload[field] = source[field];
      }
    }

    this.applyFixedParentFields(payload, dataSource.parentFixedFields);
    if (allowedFields?.length) {
      for (const key of Object.keys(payload)) {
        if (!allowedFields.includes(key)) {
          delete payload[key];
        }
      }
    }

    const parentKeyField = this.toText(dataSource.parentKeyField).trim();
    if (
      parentKeyField.length &&
      (allowedFields?.includes(parentKeyField) ?? false) &&
      !this.hasMeaningfulPayloadValue(payload[parentKeyField])
    ) {
      return {};
    }

    const requiredFields = allowedFields ?? dataSource.createFields ?? [];
    const hasAnyValue = requiredFields.some((field) => this.hasMeaningfulPayloadValue(payload[field]));
    if (!hasAnyValue) {
      return {};
    }

    return payload;
  }

  private resolveChangedLineField(changePayload?: unknown): string {
    const payload = this.toRecord(changePayload);
    if (!payload) {
      return '';
    }

    const column = this.toRecord(payload['column']);
    const columnField = this.toText(column?.['field'] ?? column?.['id']).trim();
    if (columnField.length) {
      return columnField;
    }

    return this.toText(payload['fieldKey'] ?? payload['field']).trim();
  }

  private ensureLineParentFields(
    row: Record<string, unknown>,
    entryDialogConfig: EntryDialogConfig,
    dataSource: DataSourceConfig,
  ): void {
    const headerData = entryDialogConfig.headerData ?? {};
    const parentKeyField = this.toText(dataSource.parentKeyField).trim();
    if (parentKeyField.length && !this.hasMeaningfulPayloadValue(row[parentKeyField])) {
      const documentNoField = this.toText(dataSource.documentNoField).trim();
      const parentValue = this.firstPresentValue([
        headerData[parentKeyField],
        documentNoField ? headerData[documentNoField] : undefined,
      ]);
      if (parentValue !== undefined) {
        row[parentKeyField] = parentValue;
      }
    }

    this.applyFixedParentFields(row, dataSource.parentFixedFields);
  }

  private ensureLineNo(
    binding: RunModalBinding,
    row: Record<string, unknown>,
    entryDialogConfig: EntryDialogConfig,
  ): void {
    const lineKeyField = this.resolveLineKeyField(binding);
    if (!lineKeyField || this.toNumber(row[lineKeyField]) > 0) {
      return;
    }

    row[lineKeyField] = this.resolveNextLineNo(entryDialogConfig.lineRows ?? [], row, lineKeyField);
  }

  private resolveLineKeyField(binding: RunModalBinding): string {
    const lineConfig = this.pickObject(binding.module, 'LineConfig');
    const configured = this.toText(lineConfig?.['lineKeyField']).trim();
    return configured;
  }

  private isBlockedLineField(field: string, dataSource: DataSourceConfig): boolean {
    return field.startsWith('__') || (dataSource.updateBlockedFields ?? []).includes(field);
  }

  private hasPersistedRecordId(
    row: Record<string, unknown>,
    dataSource: DataSourceConfig,
  ): boolean {
    const id = this.entryRecord.resolvePersistedRecordId(row, dataSource);
    return id !== null && id !== undefined && String(id).trim().length > 0;
  }

  private hasMeaningfulPayloadValue(value: unknown): boolean {
    return value !== null && value !== undefined && String(value).trim().length > 0;
  }

  private resolveNextLineNo(
    rows: Record<string, unknown>[],
    targetRow: Record<string, unknown>,
    lineKeyField: string,
  ): number {
    let maxLineNo = 0;
    for (const row of rows) {
      if (row === targetRow) {
        continue;
      }

      const lineNo = this.toNumber(row[lineKeyField]);
      if (lineNo > maxLineNo) {
        maxLineNo = lineNo;
      }
    }

    return maxLineNo > 0 ? maxLineNo + 10000 : 10000;
  }

  private resolveRecordId(source: Record<string, unknown>, config: DataSourceConfig): unknown {
    return this.entryRecord.resolveRecordId(source, config) ?? undefined;
  }

  private mergeRecord(target: Record<string, unknown>, response: unknown): void {
    if (!this.isRecord(response)) {
      return;
    }

    Object.assign(target, response);
  }

  private stripTechnicalIdentity(payload: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...payload };
    delete sanitized['systemId'];
    delete sanitized['SystemId'];
    return sanitized;
  }

  private applyHeaderChange(entryDialogConfig: EntryDialogConfig, payload: unknown): void {
    if (!entryDialogConfig.headerData || !this.isRecord(payload)) {
      return;
    }

    const fieldKey = this.toText(payload['fieldKey']).trim();
    if (fieldKey.length) {
      entryDialogConfig.headerData[fieldKey] = payload['value'];
    }

    if (this.isRecord(payload['updates'])) {
      for (const [key, value] of Object.entries(payload['updates'])) {
        entryDialogConfig.headerData[key] = value;
      }
    }
  }

  private applyLineChange(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    payload: unknown,
  ): void {
    if (!this.isRecord(payload)) {
      return;
    }

    const row = this.toRecord(payload['row']);
    const column = this.toRecord(payload['column']);
    if (!row || !column) {
      return;
    }

    const field = this.toText(column['field'] ?? column['id']).trim();
    if (!field) {
      return;
    }

    row[field] = payload['value'];

    if (field === this.resolveLineTypeField(entryDialogConfig) && binding.lineMasterRegistry) {
      this.assignLineRowOptions(
        row,
        entryDialogConfig,
        binding.lineMasterRegistry,
        binding.lineOptionFieldMap ?? {},
        binding.lineNumberOptionFieldKey ?? '',
      );
    }

    this.applyLineMasterSelection(binding, entryDialogConfig, row, field);
    this.recalculateLineTotals(binding.module, entryDialogConfig);
  }

  private applyLineMasterSelection(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    row: Record<string, unknown>,
    field: string,
  ): void {
    void binding;
    void entryDialogConfig;
    void row;
    void field;
  }

  private async insertAndSaveLine(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    payload: unknown,
  ): Promise<void> {
    const insertedRow = this.insertLine(binding, entryDialogConfig, payload);
    if (!insertedRow) {
      return;
    }
  }

  private insertLine(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    payload: unknown,
  ): Record<string, unknown> | undefined {
    const rows = entryDialogConfig.lineRows ?? [];
    const nextRow = this.buildEmptyLineRow(
      entryDialogConfig.lineColumns ?? [],
      entryDialogConfig.headerData,
    );
    this.copyLineOptionBuckets(nextRow, rows[0]);
    if (binding.lineMasterRegistry) {
      this.assignLineRowOptions(
        nextRow,
        entryDialogConfig,
        binding.lineMasterRegistry,
        binding.lineOptionFieldMap ?? {},
        binding.lineNumberOptionFieldKey ?? '',
      );
    }
    const insertIndex = this.resolveInsertIndex(payload, rows.length);
    rows.splice(insertIndex, 0, nextRow);
    entryDialogConfig.lineRows = rows;
    this.recalculateLineTotals(binding.module, entryDialogConfig);
    entryDialogConfig.statusMessage = {
      tone: 'success',
      title: 'Line inserted',
      message: 'A new line is ready.',
    };

    return nextRow;
  }

  private findLineColumn(
    entryDialogConfig: EntryDialogConfig,
    field: string,
  ): LineColumnConfig | undefined {
    return (entryDialogConfig.lineColumns ?? []).find(
      (column) => this.toText(column.field ?? column.id).trim() === field,
    );
  }

  private resolveInsertIndex(payload: unknown, rowCount: number): number {
    if (!this.isRecord(payload)) {
      return rowCount;
    }

    if (Array.isArray(payload['selectedIndexes'])) {
      const firstIndex = payload['selectedIndexes']
        .map((value) => Number(value))
        .find((value) => Number.isInteger(value) && value >= 0 && value < rowCount);
      if (firstIndex !== undefined) {
        return firstIndex + 1;
      }
    }

    return rowCount;
  }

  private buildEmptyLineRow(
    columns: LineColumnConfig[],
    headerData?: Record<string, unknown>,
  ): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    for (const column of columns) {
      const field = this.toText(column.field ?? column.id).trim();
      if (!field) {
        continue;
      }

      const valueType = this.toText(column.valueType).trim().toLowerCase();
      if (valueType === 'number') {
        row[field] = 0;
        continue;
      }

      if (valueType === 'boolean') {
        row[field] = false;
        continue;
      }

      row[field] = '';
    }

    if (headerData && 'sourceLineNo' in row) {
      const headerLineNo = headerData['sourceLineNo'];
      if (
        headerLineNo !== null &&
        headerLineNo !== undefined &&
        String(headerLineNo).trim().length > 0
      ) {
        row['sourceLineNo'] = headerLineNo;
      }
    }

    return row;
  }

  private copyLineOptionBuckets(
    target: Record<string, unknown>,
    source: Record<string, unknown> | undefined,
  ): void {
    if (!source) {
      return;
    }

    for (const [key, value] of Object.entries(source)) {
      if (key.startsWith('__options_') && Array.isArray(value)) {
        target[key] = value;
      }
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return this.valueMapper.isRecord(value);
  }

  private setErrorStatus(
    entryDialogConfig: EntryDialogConfig,
    title: string,
    error: unknown,
    fallbackMessage: string,
  ): void {
    entryDialogConfig.statusMessage = {
      tone: 'error',
      title,
      message: this.getErrorMessage(error, fallbackMessage),
    };
  }

  private setInteractionLock(entryDialogConfig: EntryDialogConfig, locked: boolean): void {
    this.bindingState.setInteractionLock(entryDialogConfig, locked);
  }

  private firstPresentValue(values: unknown[]): unknown {
    return values.find(
      (value) => value !== null && value !== undefined && String(value).trim().length > 0,
    );
  }

  private applyFixedParentFields(
    payload: Record<string, unknown>,
    fixedFields?: Record<string, unknown>,
  ): void {
    if (!fixedFields) {
      return;
    }

    for (const [key, value] of Object.entries(fixedFields)) {
      if (!key.trim()) {
        continue;
      }

      payload[key] = value;
    }
  }

  private toODataId(value: unknown): string {
    return this.valueMapper.toODataId(value);
  }

  private toODataFilterLiteral(value: unknown): string {
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return `'${this.toText(value).trim().replace(/'/g, "''")}'`;
  }

  private buildHeaderData(
    context: RunModalContext,
    headerSections: unknown[],
  ): Record<string, unknown> {
    const headerData = { ...(this.toRecord(context['headerData']) ?? {}) };
    const activeLine = this.toRecord(context['activeLine']);

    for (const section of headerSections ?? []) {
      const sectionRecord = this.toRecord(section);
      const sectionFields = Array.isArray(sectionRecord?.['fields']) ? sectionRecord['fields'] : [];
      for (const field of sectionFields) {
        const fieldRecord = this.toRecord(field);
        const key = this.toText(fieldRecord?.['key']).trim();
        if (!key.length) {
          continue;
        }

        const resolved = this.resolveContextHeaderValue(key, headerData, activeLine);
        if (resolved !== undefined) {
          headerData[key] = resolved;
          continue;
        }

        if (!(key in headerData)) {
          const valueType = this.toText(fieldRecord?.['valueType']).trim().toLowerCase();
          headerData[key] = valueType === 'number' ? 0 : '';
        }
      }
    }

    return headerData;
  }

  private resolveRelationParentId(
    headerData: Record<string, unknown>,
    parentIdFields: string[],
  ): unknown {
    for (const field of parentIdFields) {
      const value = this.readFieldValue(headerData, field);
      if (this.hasMeaningfulPayloadValue(value)) {
        return value;
      }
    }

    return undefined;
  }

  private resolveContextHeaderValue(
    key: string,
    headerData: Record<string, unknown> | undefined,
    activeLine: Record<string, unknown> | undefined,
  ): unknown {
    const direct = this.firstPresentValue([activeLine?.[key], headerData?.[key]]);
    if (direct !== undefined) {
      return direct;
    }

    return undefined;
  }

  private buildLineRows(context: RunModalContext): Record<string, unknown>[] {
    if (Array.isArray(context['lineRows'])) {
      return context['lineRows'].filter(
        (item): item is Record<string, unknown> => this.toRecord(item) !== undefined,
      );
    }

    const activeLine = this.toRecord(context['activeLine']);
    return activeLine ? [activeLine] : [];
  }

  private buildLineTotals(source: unknown): EntryDialogConfig['lineTotals'] {
    const totals = this.toRecord(source);
    if (
      totals &&
      'subtotal' in totals &&
      'sst' in totals &&
      'total' in totals &&
      'difference' in totals
    ) {
      return {
        subtotal: this.toText(totals['subtotal']),
        sst: this.toText(totals['sst']),
        total: this.toText(totals['total']),
        difference: this.toText(totals['difference']),
      };
    }

    return {
      subtotal: '0.00',
      sst: '0.00',
      total: '0.00',
      difference: '0.00',
    };
  }

  private recalculateLineTotals(
    module: RunModalConfigModule,
    entryDialogConfig: EntryDialogConfig,
  ): void {
    const lineConfig = this.pickObject(module, 'LineConfig');
    const config = (this.toRecord(lineConfig?.['totalsCalculation']) ??
      this.pickObject(module, 'LineTotalsCalculation')) as LineTotalsCalculationConfig | undefined;
    if (!config?.defaults || !config.totals) {
      return;
    }

    entryDialogConfig.lineTotals = this.lineCalculation.calculateLineTotals(
      entryDialogConfig.lineRows ?? [],
      config,
      entryDialogConfig.headerData,
    );
  }

  private pickDialogTitle(module: RunModalConfigModule): string {
    const headerConfig = this.pickObject(module, 'HeaderConfig');
    const nestedTitle = this.toText(headerConfig?.['dialogTitle']).trim();
    if (nestedTitle.length) {
      return nestedTitle;
    }

    for (const [key, value] of Object.entries(module)) {
      if (key.endsWith('DialogTitle') && typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return '';
  }

  private resolvePageLabel(module: RunModalConfigModule, pageId: string, title: string): string {
    for (const [key, value] of Object.entries(module)) {
      if (key.endsWith('PageLabel') && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    const base = title.trim() || this.toTitleCase(pageId);
    return base.toUpperCase();
  }

  private pickArray(module: RunModalConfigModule, suffix: string): unknown[] {
    for (const [key, value] of Object.entries(module)) {
      if (key.endsWith(suffix) && Array.isArray(value)) {
        return value;
      }
    }

    return [];
  }

  private pickObject(
    module: RunModalConfigModule,
    suffix: string,
  ): Record<string, unknown> | undefined {
    for (const [key, value] of Object.entries(module)) {
      const record = this.toRecord(value);
      if (key.endsWith(suffix) && record) {
        return record;
      }
    }

    return undefined;
  }

  private pickListPageConfig(module: RunModalConfigModule): ListPageConfig | undefined {
    const direct = this.pickObject(module, 'ListPageConfig') as ListPageConfig | undefined;
    if (direct) {
      return direct;
    }

    const bucket = this.pickObject(module, 'ListConfig') as ListPageConfig | undefined;
    if (bucket) {
      return bucket;
    }

    for (const value of Object.values(module)) {
      const record = this.toRecord(value);
      if (!record) {
        continue;
      }

      const pageId = this.toText(record['pageId']).trim();
      const pageType = this.toText(record['pageType']).trim();
      const dataSource = this.toRecord(record['dataSource']);
      if (pageId.length && pageType.length && dataSource && typeof dataSource['endpoint'] === 'string') {
        return record as unknown as ListPageConfig;
      }
    }

    return undefined;
  }

  private resolveEntryHydrationTop(module: RunModalConfigModule, dataSource: DataSourceConfig): number {
    const pageConfig = this.pickListPageConfig(module);
    const pageType = this.toText(pageConfig?.pageType).trim().toLowerCase();
    if (pageType === 'setup') {
      return 1;
    }

    return dataSource.navigation?.top ?? dataSource.pageSize ?? 20;
  }

  private isWorksheetPage(module: RunModalConfigModule): boolean {
    const pageConfig = this.pickListPageConfig(module);
    return this.toText(pageConfig?.pageType).trim().toLowerCase() === 'worksheet';
  }

  private resolveOpenTarget(
    module: RunModalConfigModule,
    pageId: string,
    requestedTarget?: 'entry' | 'list',
  ): 'entry' | 'list' {
    const pageType = this.resolvePageType(module, pageId);
    if (pageType === 'setup' || pageType === 'worksheet') {
      return 'entry';
    }

    if (pageType === 'list' || pageType === 'card' || pageType === 'document') {
      return requestedTarget ?? 'list';
    }

    return requestedTarget ?? 'entry';
  }

  private resolvePageType(module: RunModalConfigModule, pageId: string): string {
    const normalizedPageId = pageId.trim().toLowerCase();
    if (!normalizedPageId.length) {
      return '';
    }

    for (const exportedValue of Object.values(module)) {
      const record = this.toRecord(exportedValue);
      if (!record) {
        continue;
      }

      const declaredPageId = this.toText(record['pageId']).trim().toLowerCase();
      if (declaredPageId === normalizedPageId) {
        return this.toText(record['pageType']).trim().toLowerCase();
      }
    }

    return '';
  }

  private pickNestedArray(
    source: Record<string, unknown> | undefined,
    key: string,
  ): unknown[] | undefined {
    const value = source?.[key];
    return Array.isArray(value) ? value : undefined;
  }

  private resolveConfiguredFields(source: string | string[] | undefined): string[] {
    return this.valueMapper.resolveConfiguredFields(source);
  }

  private getConfiguredIdentityFields(binding: RunModalBinding): string[] {
    const fields = new Set<string>();
    const headerSource = this.resolveHeaderSaveDataSource(binding);
    const lineSource = binding.lineDataSource ?? binding.dataSource;
    for (const field of [headerSource?.keyField, lineSource?.keyField]) {
      const normalized = this.toText(field).trim();
      if (normalized.length) {
        fields.add(normalized);
      }
    }

    return [...fields];
  }

  private toRecord(value: unknown): Record<string, unknown> | undefined {
    if (typeof value === 'object' && value !== null) {
      return value as Record<string, unknown>;
    }

    return undefined;
  }

  private toText(value: unknown): string {
    return this.valueMapper.toText(value);
  }

  private toNumber(value: unknown): number {
    return this.valueMapper.toNumber(value) ?? 0;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    return this.apiError.toMessage(error, fallback);
  }

  private toTitleCase(value: string): string {
    const normalized = value.replace(/[-_]+/g, ' ').trim();
    if (!normalized.length) {
      return '';
    }

    return normalized
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
