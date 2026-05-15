import { Inject, Injectable, Optional } from '@angular/core';
import { EntryDialogConfig, EntryHeaderSectionConfig } from '../models/entry-dialog-config.model';
import { LineColumnConfig } from '../models/line-config.model';
import { PopupMode, PopupSize } from '../models/popup-config.model';
import { ListPageConfig } from '../models/page-config.model';
import { PopupStackService } from './popup-stack.service';
import { DataSourceService } from './data-source.service';
import { DataSourceConfig } from '../models/data-source-config.model';
import { firstValueFrom } from 'rxjs';
import { ConfirmationService } from './confirmation.service';
import { ApiErrorService } from './api-error.service';
import { EntryRecordService } from './entry-record.service';
import { LineMasterRegistry, LineMasterService } from './line-master.service';
import { MasterDataService } from './master-data.service';
import { GENERIC_MESSAGES } from '../constants/generic-messages';
import {
  RUN_MODAL_CONFIG_RESOLVER,
  RunModalConfigModule,
  RunModalConfigResolver,
  RunModalContext
} from './run-modal-config.token';

type RunModalPageDefinition = {
  pageId: string;
  mode?: PopupMode;
  size?: PopupSize;
  buildEntryDialogConfig: (context: RunModalContext) => EntryDialogConfig;
  module: RunModalConfigModule;
};

type RunModalBinding = {
  pageId: string;
  module: RunModalConfigModule;
  context: RunModalContext;
  dataSource?: DataSourceConfig;
  headerDataSource?: DataSourceConfig;
  lineDataSource?: DataSourceConfig;
};

type RunModalActionEvent = {
  actionKey: string;
  payload?: unknown;
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
  providedIn: 'root'
})
export class RunModalService {
  private readonly bindings = new Map<string, RunModalBinding>();

  constructor(
    private readonly popupStack: PopupStackService,
    private readonly dataSource: DataSourceService,
    private readonly confirmation: ConfirmationService,
    private readonly apiError: ApiErrorService,
    private readonly entryRecord: EntryRecordService,
    private readonly masterData: MasterDataService,
    private readonly lineMasters: LineMasterService,
    @Optional() @Inject(RUN_MODAL_CONFIG_RESOLVER) private readonly configResolver: RunModalConfigResolver | null
  ) {}

  async open(request: RunModalRequest): Promise<boolean> {
    const definition = await this.resolvePageDefinition(request.pageId);
    if (!definition) {
      return false;
    }

    if (request.target === 'list') {
      return this.openList(request, definition);
    }

    const context = request.context ?? {};
    const entryDialogConfig = definition.buildEntryDialogConfig(context);
    const runModalDataSource = this.resolveRunModalDataSource(definition.module, context);
    const headerDataSource = this.pickDataSource(definition.module);
    const lineDataSource = this.pickLineDataSource(definition.module);
    await this.hydrateFromApi(definition.module, entryDialogConfig, context, runModalDataSource);
    await this.hydrateOptions(definition.module, entryDialogConfig);
    const popupId = request.popupId ?? `run-modal-${request.pageId}-${Date.now()}`;

    const opened = this.popupStack.open({
      id: popupId,
      title: entryDialogConfig.title,
      mode: request.mode ?? definition.mode ?? 'page',
      size: request.size ?? definition.size ?? 'full',
      allowNested: request.allowNested ?? true,
      data: {
        entryDialogConfig
      }
    });

    if (!opened) {
      return false;
    }

    this.bindings.set(popupId, {
      pageId: definition.pageId,
      module: definition.module,
      context,
      dataSource: runModalDataSource,
      headerDataSource,
      lineDataSource
    });

    return true;
  }

  async openEntryFromList(popupId: string, row: unknown): Promise<boolean> {
    const binding = this.bindings.get(popupId);
    if (!binding) {
      return false;
    }

    const headerData = this.toRecord(row) ?? {};
    const lineRows = await this.loadRelatedLineRows(binding.module, headerData);
    return this.open({
      pageId: binding.pageId,
      context: {
        ...binding.context,
        headerData,
        lineRows
      },
      mode: 'page',
      size: 'full',
      allowNested: true
    });
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

      return this.openList({
        pageId: binding.pageId,
        context: binding.context,
        mode: 'page',
        size: 'full',
        target: 'list',
        allowNested: true,
        popupId
      }, definition);
    }

    return false;
  }

  handlePopupAction(popupId: string, entryDialogConfig: EntryDialogConfig, event: RunModalActionEvent): boolean {
    const binding = this.bindings.get(popupId);
    if (!binding) {
      return false;
    }

    if (event.actionKey === 'header:changed') {
      this.applyHeaderChange(binding, entryDialogConfig, event.payload);
      return true;
    }

    if (event.actionKey === 'line:changed') {
      this.applyLineChange(event.payload);
      return true;
    }

    if (event.actionKey === 'cmd:autosave') {
      void this.saveFromAutosave(binding, entryDialogConfig, event.payload);
      return true;
    }

    if (event.actionKey === 'cmd:apply' || event.actionKey === 'cmd:save') {
      void this.saveHeader(binding, entryDialogConfig);
      return true;
    }

    if (event.actionKey === 'cmd:line-delete') {
      void this.deleteLines(binding, entryDialogConfig, event.payload);
      return true;
    }

    if (event.actionKey === 'cmd:line-new' || event.actionKey === 'cmd:line-insert') {
      void this.insertAndSaveLine(binding, entryDialogConfig, event.payload);
      return true;
    }

    if (event.actionKey === 'cmd:delete') {
      void this.deleteHeader(binding, entryDialogConfig);
      return true;
    }

    return false;
  }

  releasePopup(popupId: string): void {
    this.bindings.delete(popupId);
  }

  private async openList(request: RunModalRequest, definition: RunModalPageDefinition): Promise<boolean> {
    const listPageConfig = this.pickObject(definition.module, 'ListPageConfig') as ListPageConfig | undefined;
    const listDataSource = this.pickDataSource(definition.module);
    if (!listPageConfig || !listDataSource?.endpoint?.trim()) {
      return false;
    }

    const popupId = request.popupId ?? `run-modal-list-${request.pageId}-${Date.now()}`;
    const rows = await this.loadListRows(listDataSource);
    const opened = this.popupStack.open({
      id: popupId,
      title: listPageConfig.title ?? definition.pageId,
      mode: request.mode ?? definition.mode ?? 'page',
      size: request.size ?? definition.size ?? 'full',
      allowNested: request.allowNested ?? true,
      data: {
        runModalListPageId: definition.pageId,
        listPageConfig,
        listRows: rows,
        listErrorMessage: undefined
      }
    });

    if (opened) {
      this.bindings.set(popupId, {
        pageId: definition.pageId,
        module: definition.module,
        context: request.context ?? {},
        dataSource: listDataSource,
        headerDataSource: listDataSource,
        lineDataSource: this.pickLineDataSource(definition.module)
      });
    }

    return opened;
  }

  private async loadListRows(dataSource: DataSourceConfig): Promise<Record<string, unknown>[]> {
    try {
      const response = await firstValueFrom(this.dataSource.loadList(dataSource, {
        top: dataSource.pageSize ?? 20
      }));
      return this.toRecordList(response);
    } catch {
      return [];
    }
  }

  private async loadRelatedLineRows(
    module: RunModalConfigModule,
    headerData: Record<string, unknown>
  ): Promise<Record<string, unknown>[]> {
    const lineDataSource = this.pickLineDataSource(module);
    const parentKeyField = this.toText(lineDataSource?.parentKeyField).trim();
    if (!lineDataSource?.endpoint?.trim() || !parentKeyField.length) {
      return [];
    }

    const documentNo = this.resolveDocumentNo(module, headerData);
    if (!documentNo.length) {
      return [];
    }

    const effectiveDataSource: DataSourceConfig = {
      ...lineDataSource,
      defaultFilter: this.buildParentFilter(parentKeyField, documentNo, lineDataSource.parentFixedFields)
    };

    try {
      const response = await firstValueFrom(this.dataSource.loadList(effectiveDataSource, { top: 200 }));
      return this.toRecordList(response);
    } catch {
      return [];
    }
  }

  private pickLineDataSource(module: RunModalConfigModule): DataSourceConfig | undefined {
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

  private resolveDocumentNo(module: RunModalConfigModule, headerData: Record<string, unknown>): string {
    const listDataSource = this.pickDataSource(module);
    const configuredField = this.toText(listDataSource?.documentNoField).trim();
    const candidates = [configuredField, 'documentNo', 'number'].filter((field) => field.length > 0);

    for (const field of candidates) {
      const value = this.readFieldValue(headerData, field);
      if (value !== null && value !== undefined && String(value).trim().length > 0) {
        return String(value).trim();
      }
    }

    return '';
  }

  private buildParentFilter(parentKeyField: string, parentValue: string, fixedFields?: Record<string, unknown>): string {
    const filters = [`${parentKeyField} eq '${parentValue.replace(/'/g, "''")}'`];
    for (const [field, value] of Object.entries(fixedFields ?? {})) {
      const fieldName = field.trim();
      if (!fieldName || value === null || value === undefined || String(value).trim().length === 0) {
        continue;
      }

      filters.push(`${fieldName} eq ${this.toODataFilterLiteral(value)}`);
    }

    return filters.join(' and ');
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

    const buildEntryDialogConfig = module.buildRunModalEntryDialogConfig
      ? module.buildRunModalEntryDialogConfig
      : (context: RunModalContext) => this.buildGenericEntryDialogConfig(module, normalized, context);

    return {
      pageId: normalized,
      mode: module.runModalMode,
      size: module.runModalSize,
      buildEntryDialogConfig,
      module
    };
  }

  private async loadRunModalConfigModule(pageId: string): Promise<RunModalConfigModule | undefined> {
    const normalized = pageId.trim().toLowerCase();
    if (!normalized.length || !this.configResolver) {
      return undefined;
    }

    try {
      return await this.configResolver(normalized);
    } catch {
      return undefined;
    }
  }

  private buildGenericEntryDialogConfig(
    module: RunModalConfigModule,
    pageId: string,
    context: RunModalContext
  ): EntryDialogConfig {
    const title = this.pickDialogTitle(module) || this.toTitleCase(pageId);
    const pageLabel = this.resolvePageLabel(module, pageId, title);
    const headerSections = this.pickArray(module, 'HeaderSections');
    const lineColumns = this.pickArray(module, 'LineColumns');
    const headerToolbarButtons = this.pickArray(module, 'HeaderToolbarButtons');
    const lineToolbarButtons = this.pickArray(module, 'LineToolbarButtons');
    const headerCommandBar = this.pickObject(module, 'HeaderCommandBar');
    const lineCommandBar = this.pickObject(module, 'LineCommandBar');
    const linePlacement = this.pickObject(module, 'LinePlacement');
    const lineTotalsDefault = this.pickObject(module, 'LineTotalsDefault');
    const attachmentsDefault = this.pickObject(module, 'AttachmentsDefault');

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
        injectDefaultLineDelete: false
      },
      headerToolbarButtons: headerToolbarButtons as EntryDialogConfig['headerToolbarButtons'],
      lineToolbarButtons: lineToolbarButtons as EntryDialogConfig['lineToolbarButtons'],
      headerSections: headerSections as EntryDialogConfig['headerSections'],
      headerData,
      lineColumns: lineColumns as EntryDialogConfig['lineColumns'],
      lineRows,
      lineTotals,
      attachments: attachmentsDefault as EntryDialogConfig['attachments']
    };

    return entryDialogConfig;
  }

  private async hydrateFromApi(
    module: RunModalConfigModule,
    entryDialogConfig: EntryDialogConfig,
    context: RunModalContext,
    dataSource?: DataSourceConfig
  ): Promise<void> {
    if (!dataSource?.endpoint?.trim()) {
      return;
    }

    try {
      const response = await firstValueFrom(this.dataSource.loadList(dataSource, { top: module.runModalRelation?.top ?? 200 }));
      const records = this.toRecordList(response);
      if (!records.length) {
        return;
      }

      entryDialogConfig.lineRows = this.mapRecordsToLineRows(records, entryDialogConfig);
      this.mergeHeaderFromFirstRecord(records[0], entryDialogConfig);
    } catch {
      // Keep popup rendering even when API load fails.
    }
  }

  private resolveRunModalDataSource(module: RunModalConfigModule, context: RunModalContext): DataSourceConfig | undefined {
    const explicitDataSource = module.runModalDataSource;
    const relation = module.runModalRelation;
    const baseDataSource = explicitDataSource ?? (relation ? this.pickDataSource(module) : undefined);
    if (!baseDataSource?.endpoint?.trim()) {
      return undefined;
    }

    if (!relation) {
      return baseDataSource;
    }

    const activeLine = this.toRecord(context['activeLine']);
    const idCandidates = relation.parentIdFields?.length ? relation.parentIdFields : ['Id', 'id'];
    const parentId = idCandidates
      .map((field) => activeLine?.[field])
      .find((value) => value !== null && value !== undefined && String(value).trim().length > 0);

    if (parentId === null || parentId === undefined || String(parentId).trim().length === 0) {
      return baseDataSource;
    }

    return {
      ...baseDataSource,
      endpoint: `${relation.parentEndpoint}(${this.toODataId(parentId)})/${relation.childCollection}`
    };
  }

  private pickDataSource(module: RunModalConfigModule): DataSourceConfig | undefined {
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
    if (Array.isArray(response)) {
      return response.filter((item): item is Record<string, unknown> => this.toRecord(item) !== undefined);
    }

    const wrapped = this.toRecord(response);
    if (wrapped && Array.isArray(wrapped['value'])) {
      return wrapped['value'].filter((item): item is Record<string, unknown> => this.toRecord(item) !== undefined);
    }

    return [];
  }

  private mapRecordsToLineRows(records: Record<string, unknown>[], entryDialogConfig: EntryDialogConfig): Record<string, unknown>[] {
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

  private async hydrateOptions(module: RunModalConfigModule, entryDialogConfig: EntryDialogConfig): Promise<void> {
    await Promise.all([
      this.hydrateHeaderOptions(entryDialogConfig),
      this.hydrateLineEndpointOptions(entryDialogConfig),
      this.hydrateLineMasterOptions(module, entryDialogConfig)
    ]);
  }

  private async hydrateHeaderOptions(entryDialogConfig: EntryDialogConfig): Promise<void> {
    const headerData = entryDialogConfig.headerData ?? {};
    const jobs: Array<Promise<void>> = [];

    for (const section of entryDialogConfig.headerSections ?? []) {
      for (const field of section.fields) {
        const optionsKey = this.toText(field.optionsDataKey).trim();
        const endpoints = (field.optionsEndpoints ?? [])
          .map((endpoint) => endpoint.trim())
          .filter((endpoint) => endpoint.length > 0);
        if (!optionsKey.length || !endpoints.length) {
          continue;
        }

        jobs.push(firstValueFrom(this.masterData.loadFirstAvailableList(endpoints))
          .then((records) => {
            headerData[optionsKey] = records;
          })
          .catch(() => {
            headerData[optionsKey] = [];
          }));
      }
    }

    await Promise.all(jobs);
    entryDialogConfig.headerData = headerData;
  }

  private async hydrateLineEndpointOptions(entryDialogConfig: EntryDialogConfig): Promise<void> {
    const rows = entryDialogConfig.lineRows ?? [];
    const jobs: Array<Promise<void>> = [];

    for (const column of entryDialogConfig.lineColumns ?? []) {
      const field = this.toText(column.field ?? column.id).trim();
      const optionsKey = this.toText(column.optionsDataKey ?? (field ? `__options_${field}` : '')).trim();
      const endpoints = (column.optionsEndpoints ?? [])
        .map((endpoint) => endpoint.trim())
        .filter((endpoint) => endpoint.length > 0);
      if (!field.length || !optionsKey.length || !endpoints.length) {
        continue;
      }

      jobs.push(firstValueFrom(this.masterData.loadFirstAvailableList(endpoints))
        .then((records) => {
          const options = this.masterData.toSelectOptions(records, ['code', 'no', 'number', 'id'], ['name', 'description', 'displayName']);
          rows.forEach((row) => {
            row[optionsKey] = options;
          });
        })
        .catch(() => {
          rows.forEach((row) => {
            row[optionsKey] = [];
          });
        }));
    }

    await Promise.all(jobs);
  }

  private async hydrateLineMasterOptions(module: RunModalConfigModule, entryDialogConfig: EntryDialogConfig): Promise<void> {
    const endpoints = this.pickObject(module, 'LineMasterEndpoints');
    const optionFields = this.pickObject(module, 'LineMasterOptionFields');
    if (!endpoints || !Object.keys(endpoints).length) {
      return;
    }

    const endpointMap: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(endpoints)) {
      if (Array.isArray(value)) {
        endpointMap[key] = value.map((endpoint) => this.toText(endpoint).trim()).filter((endpoint) => endpoint.length > 0);
      }
    }

    if (!Object.keys(endpointMap).length) {
      return;
    }

    let masters: Record<string, Record<string, unknown>[]>;
    try {
      masters = await firstValueFrom(this.masterData.loadMasterLists(endpointMap));
    } catch {
      masters = {};
    }

    const registry = this.buildLineMasterRegistry(masters, optionFields);
    const optionFieldMap = this.buildLineOptionFieldMap(entryDialogConfig, masters, optionFields);
    for (const row of entryDialogConfig.lineRows ?? []) {
      this.assignLineRowOptions(row, registry, optionFieldMap);
    }
  }

  private buildLineMasterRegistry(
    masters: Record<string, Record<string, unknown>[]>,
    optionFields?: Record<string, unknown>
  ): LineMasterRegistry {
    const glOptions = this.buildConfiguredOptions(masters['glAccounts'], optionFields?.['glAccounts']);
    const itemOptions = this.buildConfiguredOptions(masters['items'], optionFields?.['items']);
    const fixedAssetOptions = this.buildConfiguredOptions(masters['fixedAssets'], optionFields?.['fixedAssets']);

    return {
      defaultType: 'G/L Account',
      emptyType: ' ',
      byType: {
        'G/L Account': { options: glOptions, records: masters['glAccounts'] ?? [] },
        Item: { options: itemOptions, records: masters['items'] ?? [] },
        'Fixed Asset': { options: fixedAssetOptions, records: masters['fixedAssets'] ?? [] }
      },
      aliases: {
        Comment: ' '
      }
    };
  }

  private buildLineOptionFieldMap(
    entryDialogConfig: EntryDialogConfig,
    masters: Record<string, Record<string, unknown>[]>,
    optionFields?: Record<string, unknown>
  ): Record<string, Array<{ label: string; value: unknown }>> {
    const result: Record<string, Array<{ label: string; value: unknown }>> = {};

    for (const column of entryDialogConfig.lineColumns ?? []) {
      const field = this.toText(column.field ?? column.id).trim();
      const optionsKey = this.toText(column.optionsDataKey ?? (field ? `__options_${field}` : '')).trim();
      if (!optionsKey.length) {
        continue;
      }

      const normalized = field.toLowerCase();
      if (normalized.includes('unitofmeasure')) {
        result[optionsKey] = this.buildConfiguredOptions(masters['unitOfMeasures'], optionFields?.['unitOfMeasures']);
      } else if (normalized.includes('location')) {
        result[optionsKey] = this.buildConfiguredOptions(masters['locations'], optionFields?.['locations']);
      }
    }

    return result;
  }

  private buildConfiguredOptions(
    records: unknown,
    config: unknown
  ): Array<{ label: string; value: unknown }> {
    const record = this.toRecord(config);
    const valueFields = Array.isArray(record?.['valueFields'])
      ? record['valueFields'].map((field) => this.toText(field))
      : ['no', 'number', 'code', 'id'];
    const labelFields = Array.isArray(record?.['labelFields'])
      ? record['labelFields'].map((field) => this.toText(field))
      : ['name', 'description', 'displayName'];

    return this.masterData.toSelectOptions(records, valueFields, labelFields);
  }

  private assignLineRowOptions(
    row: Record<string, unknown>,
    registry: LineMasterRegistry,
    optionFieldMap: Record<string, Array<{ label: string; value: unknown }>>
  ): void {
    const type = this.lineMasters.resolveType(row['type'], registry);
    this.lineMasters.assignTypeOptions(row, type, registry, optionFieldMap);
  }

  private mergeHeaderFromFirstRecord(record: Record<string, unknown>, entryDialogConfig: EntryDialogConfig): void {
    const headerData = entryDialogConfig.headerData ?? {};
    const sections = entryDialogConfig.headerSections ?? [];

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
    return matched ? record[matched] : '';
  }

  private async saveFromAutosave(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    payload: unknown
  ): Promise<void> {
    if (!this.isRecord(payload)) {
      return;
    }

    try {
      if (this.isRecord(payload['row'])) {
        await this.saveLine(binding, entryDialogConfig, payload['row'], payload);
        return;
      }

      if (typeof payload['fieldKey'] === 'string') {
        await this.saveHeader(binding, entryDialogConfig);
      }
    } catch (error: unknown) {
      this.setErrorStatus(entryDialogConfig, 'Save failed', error, 'Unable to save changes.');
    }
  }

  private async saveHeader(binding: RunModalBinding, entryDialogConfig: EntryDialogConfig): Promise<void> {
    const dataSource = this.resolveHeaderSaveDataSource(binding);
    const headerData = entryDialogConfig.headerData;
    if (!dataSource?.endpoint || !headerData) {
      return;
    }

    entryDialogConfig.statusMessage = {
      tone: 'info',
      title: 'Saving',
      message: 'Saving changes...'
    };

    try {
      const payload = this.buildHeaderPayload(binding, entryDialogConfig);
      this.validateBeforeSave(binding, {
        scope: 'header',
        headerData,
        payload,
        entryDialogConfig,
        context: binding.context
      });
      await this.createOrUpdateRecord(dataSource, headerData, payload);
      entryDialogConfig.statusMessage = {
        tone: 'success',
        title: 'Saved',
        message: 'Changes saved.'
      };
    } catch (error: unknown) {
      this.setErrorStatus(entryDialogConfig, 'Save failed', error, 'Unable to save changes.');
    }
  }

  private async saveLine(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    row: Record<string, unknown>,
    changePayload?: unknown
  ): Promise<void> {
    const dataSource = this.resolveLineSaveDataSource(binding);
    if (!dataSource?.endpoint) {
      return;
    }

    entryDialogConfig.statusMessage = {
      tone: 'info',
      title: 'Saving',
      message: 'Saving line...'
    };

    try {
      const payload = this.buildLineSavePayload(row, entryDialogConfig, dataSource, changePayload);
      if (!Object.keys(payload).length) {
        entryDialogConfig.statusMessage = undefined;
        return;
      }

      this.validateBeforeSave(binding, {
        scope: 'line',
        headerData: entryDialogConfig.headerData ?? {},
        row,
        payload,
        entryDialogConfig,
        context: binding.context
      });
      await this.createOrUpdateRecord(dataSource, row, payload);
      entryDialogConfig.statusMessage = {
        tone: 'success',
        title: 'Saved',
        message: 'Line saved.'
      };
    } catch (error: unknown) {
      this.setErrorStatus(entryDialogConfig, 'Save failed', error, 'Unable to save line.');
    }
  }

  private async deleteLines(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    payload: unknown
  ): Promise<void> {
    const dataSource = this.resolveLineSaveDataSource(binding);
    if (!dataSource?.endpoint) {
      return;
    }

    const targets: Record<string, unknown>[] = [];
    if (this.isRecord(payload) && Array.isArray(payload['selectedIndexes']) && entryDialogConfig.lineRows?.length) {
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
      targets.push(...payload['selectedRows'].filter((item): item is Record<string, unknown> => this.isRecord(item)));
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
      entityLabel: 'line'
    });

    if (!confirmed) {
      return;
    }

    entryDialogConfig.statusMessage = {
      tone: 'info',
      title: 'Deleting',
      message: 'Deleting selected line(s)...'
    };

    try {
      for (const row of targets) {
        const id = this.resolveRecordId(row, dataSource);
        if (id !== null && id !== undefined && id !== '') {
          await firstValueFrom(this.dataSource.delete(dataSource, id));
        }
      }

      if (entryDialogConfig.lineRows) {
        entryDialogConfig.lineRows = entryDialogConfig.lineRows.filter((row) => !targets.includes(row));
      }

      entryDialogConfig.statusMessage = {
        tone: 'success',
        title: 'Deleted',
        message: 'Line deleted.'
      };
    } catch (error: unknown) {
      this.setErrorStatus(entryDialogConfig, GENERIC_MESSAGES.deleteFailedTitle, error, GENERIC_MESSAGES.lineDeleteFailedMessage);
    }
  }

  private async deleteHeader(binding: RunModalBinding, entryDialogConfig: EntryDialogConfig): Promise<void> {
    const dataSource = this.resolveHeaderSaveDataSource(binding);
    const headerData = entryDialogConfig.headerData;
    if (!dataSource?.endpoint || !headerData) {
      return;
    }

    const id = this.resolveRecordId(headerData, dataSource);
    if (id === null || id === undefined || id === '') {
      return;
    }

    const confirmed = await this.confirmation.confirmIntent({
      intent: 'delete',
      count: 1,
      entityLabel: this.resolvePageEntityLabel(binding.pageId)
    });

    if (!confirmed) {
      return;
    }

    entryDialogConfig.statusMessage = {
      tone: 'info',
      title: 'Deleting',
      message: 'Deleting record...'
    };

    try {
      await firstValueFrom(this.dataSource.delete(dataSource, id));
      entryDialogConfig.statusMessage = {
        tone: 'success',
        title: 'Deleted',
        message: 'Record deleted.'
      };
    } catch (error: unknown) {
      this.setErrorStatus(entryDialogConfig, GENERIC_MESSAGES.deleteFailedTitle, error, GENERIC_MESSAGES.deleteFailedMessage);
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
    payload: Record<string, unknown>
  ): Promise<void> {
    const id = this.resolveRecordId(source, dataSource);
    if (id !== null && id !== undefined && id !== '' && dataSource.supportsUpdate !== false) {
      const updated = await firstValueFrom(this.dataSource.update(dataSource, id, payload));
      this.mergeRecord(source, updated);
      return;
    }

    const created = await firstValueFrom(this.dataSource.create(dataSource, payload));
    this.mergeRecord(source, created);
  }

  private resolveHeaderSaveDataSource(binding: RunModalBinding): DataSourceConfig | undefined {
    return binding.headerDataSource ?? binding.dataSource;
  }

  private resolveLineSaveDataSource(binding: RunModalBinding): DataSourceConfig | undefined {
    return binding.lineDataSource ?? binding.dataSource;
  }

  private buildHeaderPayload(binding: RunModalBinding, entryDialogConfig: EntryDialogConfig): Record<string, unknown> {
    const headerData = entryDialogConfig.headerData ?? {};
    const sections = entryDialogConfig.headerSections ?? [];
    const payload: Record<string, unknown> = {};
    for (const section of sections) {
      for (const field of section.fields) {
        const key = this.toText(field.key).trim();
        if (!key || !(key in headerData)) {
          continue;
        }

        payload[key] = headerData[key];
      }
    }

    const customPayload = binding.module.runModalBuildHeaderPayload?.({
      payload,
      headerData,
      headerSections: sections,
      entryDialogConfig,
      context: binding.context
    });

    return this.isRecord(customPayload) ? customPayload : payload;
  }

  private buildLineSavePayload(
    row: Record<string, unknown>,
    entryDialogConfig: EntryDialogConfig,
    dataSource: DataSourceConfig,
    changePayload?: unknown
  ): Record<string, unknown> {
    if (this.hasPersistedRecordId(row, dataSource)) {
      return this.buildLineUpdatePayload(row, dataSource, changePayload);
    }

    return this.buildLineCreatePayload(row, entryDialogConfig, dataSource);
  }

  private buildLineUpdatePayload(
    row: Record<string, unknown>,
    dataSource: DataSourceConfig,
    changePayload?: unknown
  ): Record<string, unknown> {
    const field = this.resolveChangedLineField(changePayload);
    if (!field.length || this.isBlockedLineField(field, dataSource)) {
      return {};
    }

    return {
      [field]: this.readFieldValue(row, field)
    };
  }

  private buildLineCreatePayload(
    row: Record<string, unknown>,
    entryDialogConfig: EntryDialogConfig,
    dataSource: DataSourceConfig
  ): Record<string, unknown> {
    this.ensureLineParentFields(row, entryDialogConfig, dataSource);
    this.ensureLineNo(row, entryDialogConfig);

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

    if (!this.hasRequiredCreateFields(payload, dataSource.createFields)) {
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
    dataSource: DataSourceConfig
  ): void {
    const headerData = entryDialogConfig.headerData ?? {};
    const parentKeyField = this.toText(dataSource.parentKeyField).trim();
    if (parentKeyField.length && !this.hasMeaningfulPayloadValue(row[parentKeyField])) {
      const parentValue = this.firstPresentValue([
        headerData[parentKeyField],
        headerData['documentNo'],
        headerData['number']
      ]);
      if (parentValue !== undefined) {
        row[parentKeyField] = parentValue;
      }
    }

    const documentType = this.firstPresentValue([
      row['documentType'],
      headerData['documentType'],
      dataSource.parentFixedFields?.['documentType']
    ]);
    if (documentType !== undefined) {
      row['documentType'] = documentType;
    }
  }

  private ensureLineNo(row: Record<string, unknown>, entryDialogConfig: EntryDialogConfig): void {
    if (this.toNumber(row['lineNo']) > 0) {
      return;
    }

    row['lineNo'] = this.resolveNextLineNo(entryDialogConfig.lineRows ?? [], row);
  }

  private isBlockedLineField(field: string, dataSource: DataSourceConfig): boolean {
    return field.startsWith('__') || (dataSource.updateBlockedFields ?? []).includes(field);
  }

  private hasPersistedRecordId(row: Record<string, unknown>, dataSource: DataSourceConfig): boolean {
    const id = this.resolveRecordId(row, dataSource);
    return id !== null && id !== undefined && String(id).trim().length > 0;
  }

  private hasRequiredCreateFields(payload: Record<string, unknown>, fields?: string[]): boolean {
    if (!fields?.length) {
      return true;
    }

    return fields
      .filter((field) => field !== 'quantity')
      .every((field) => this.hasMeaningfulPayloadValue(payload[field]));
  }

  private hasMeaningfulPayloadValue(value: unknown): boolean {
    return value !== null && value !== undefined && String(value).trim().length > 0;
  }

  private resolveNextLineNo(rows: Record<string, unknown>[], targetRow: Record<string, unknown>): number {
    let maxLineNo = 0;
    for (const row of rows) {
      if (row === targetRow || !this.hasMeaningfulPayloadValue(row['systemId'] ?? row['id'])) {
        continue;
      }

      const lineNo = this.toNumber(row['lineNo']);
      if (lineNo > maxLineNo) {
        maxLineNo = lineNo;
      }
    }

    return maxLineNo > 0 ? maxLineNo + 10000 : 10000;
  }

  private validateBeforeSave(
    binding: RunModalBinding,
    args: {
      scope: 'header' | 'line';
      headerData: Record<string, unknown>;
      row?: Record<string, unknown>;
      payload: Record<string, unknown>;
      entryDialogConfig: EntryDialogConfig;
      context: RunModalContext;
    }
  ): void {
    const result = binding.module.runModalValidateBeforeSave?.(args);
    if (typeof result === 'string' && result.trim().length) {
      throw new Error(result.trim());
    }
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

  private applyHeaderChange(binding: RunModalBinding, entryDialogConfig: EntryDialogConfig, payload: unknown): void {
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

    if (fieldKey.length) {
      binding.module.runModalOnHeaderChanged?.({
        headerData: entryDialogConfig.headerData,
        fieldKey,
        payload
      });
    }
  }

  private applyLineChange(payload: unknown): void {
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
  }

  private async insertAndSaveLine(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    payload: unknown
  ): Promise<void> {
    const insertedRow = this.insertLine(entryDialogConfig, payload);
    if (!insertedRow) {
      return;
    }
  }

  private insertLine(entryDialogConfig: EntryDialogConfig, payload: unknown): Record<string, unknown> | undefined {
    const rows = entryDialogConfig.lineRows ?? [];
    const nextRow = this.buildEmptyLineRow(entryDialogConfig.lineColumns ?? [], entryDialogConfig.headerData);
    this.copyLineOptionBuckets(nextRow, rows[0]);
    const insertIndex = this.resolveInsertIndex(payload, rows.length);
    rows.splice(insertIndex, 0, nextRow);
    entryDialogConfig.lineRows = rows;
    entryDialogConfig.statusMessage = {
      tone: 'success',
      title: 'Line inserted',
      message: 'A new line is ready.'
    };

    return nextRow;
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
    headerData?: Record<string, unknown>
  ): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    for (const column of columns) {
      const field = this.toText(column.field ?? column.id).trim();
      if (!field) {
        continue;
      }

      const valueType = this.toText(column.valueType).trim().toLowerCase();
      row[field] = valueType === 'number' ? 0 : '';
    }

    if (headerData && 'sourceLineNo' in row) {
      const headerLineNo = headerData['sourceLineNo'];
      if (headerLineNo !== null && headerLineNo !== undefined && String(headerLineNo).trim().length > 0) {
        row['sourceLineNo'] = headerLineNo;
      }
    }

    return row;
  }

  private copyLineOptionBuckets(target: Record<string, unknown>, source: Record<string, unknown> | undefined): void {
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
    return typeof value === 'object' && value !== null;
  }

  private setErrorStatus(
    entryDialogConfig: EntryDialogConfig,
    title: string,
    error: unknown,
    fallbackMessage: string
  ): void {
    entryDialogConfig.statusMessage = {
      tone: 'error',
      title,
      message: this.getErrorMessage(error, fallbackMessage)
    };
  }

  private firstPresentValue(values: unknown[]): unknown {
    return values.find((value) => value !== null && value !== undefined && String(value).trim().length > 0);
  }

  private applyFixedParentFields(payload: Record<string, unknown>, fixedFields?: Record<string, unknown>): void {
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
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    const text = this.toText(value).trim();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) {
      return text;
    }

    return `'${text.replace(/'/g, "''")}'`;
  }

  private toODataFilterLiteral(value: unknown): string {
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return `'${this.toText(value).trim().replace(/'/g, "''")}'`;
  }

  private buildHeaderData(context: RunModalContext, headerSections: unknown[]): Record<string, unknown> {
    const providedHeader = this.toRecord(context['headerData']);
    const headerData: Record<string, unknown> = providedHeader ? { ...providedHeader } : {};

    if (!headerSections.length) {
      return headerData;
    }

    for (const section of headerSections) {
      const sectionRecord = this.toRecord(section);
      const fields = Array.isArray(sectionRecord?.['fields']) ? sectionRecord['fields'] : [];
      for (const field of fields) {
        const fieldRecord = this.toRecord(field);
        const key = this.toText(fieldRecord?.['key']).trim();
        if (!key || key in headerData) {
          continue;
        }

        if (fieldRecord && 'defaultValue' in fieldRecord) {
          headerData[key] = fieldRecord['defaultValue'];
          continue;
        }

        const valueType = this.toText(fieldRecord?.['valueType']).trim().toLowerCase();
        headerData[key] = valueType === 'number' ? 0 : '';
      }
    }

    return headerData;
  }

  private buildLineRows(context: RunModalContext): Record<string, unknown>[] {
    if (Array.isArray(context['lineRows'])) {
      return context['lineRows'].filter((item): item is Record<string, unknown> => this.toRecord(item) !== undefined);
    }

    const activeLine = this.toRecord(context['activeLine']);
    return activeLine ? [activeLine] : [];
  }

  private buildLineTotals(source: unknown): EntryDialogConfig['lineTotals'] {
    const totals = this.toRecord(source);
    if (totals && 'subtotal' in totals && 'sst' in totals && 'total' in totals && 'difference' in totals) {
      return {
        subtotal: this.toText(totals['subtotal']),
        sst: this.toText(totals['sst']),
        total: this.toText(totals['total']),
        difference: this.toText(totals['difference'])
      };
    }

    return {
      subtotal: '0.00',
      sst: '0.00',
      total: '0.00',
      difference: '0.00'
    };
  }

  private pickDialogTitle(module: RunModalConfigModule): string {
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

  private pickObject(module: RunModalConfigModule, suffix: string): Record<string, unknown> | undefined {
    for (const [key, value] of Object.entries(module)) {
      const record = this.toRecord(value);
      if (key.endsWith(suffix) && record) {
        return record;
      }
    }

    return undefined;
  }

  private toRecord(value: unknown): Record<string, unknown> | undefined {
    if (typeof value === 'object' && value !== null) {
      return value as Record<string, unknown>;
    }

    return undefined;
  }

  private toText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const parsed = Number(this.toText(value).replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
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
