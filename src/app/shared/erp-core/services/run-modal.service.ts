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
import { MasterDataService } from './master-data.service';
import { EntryRecordService } from './entry-record.service';
import { LineMasterService, LineSelectionStrategy } from './line-master.service';
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
    private readonly masterData: MasterDataService,
    private readonly entryRecord: EntryRecordService,
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
    await this.hydrateConfiguredOptions(definition.module, entryDialogConfig);
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
      const change = this.applyLineChange(event.payload);
      if (change.field === 'Type') {
        void this.hydrateLineOptions(binding.module, entryDialogConfig);
      } else if (change.row && this.isLineNumberField(change.field)) {
        this.applyLineMasterSelection(binding.module, entryDialogConfig, change.row, change.field);
      }
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
    if (!lineDataSource?.endpoint?.trim()) {
      return [];
    }

    const parentKeyField = this.toText(lineDataSource.parentKeyField).trim();
    if (!parentKeyField) {
      return [];
    }

    const documentNo = this.resolveDocumentNo(module, headerData);
    if (!documentNo.length) {
      return [];
    }

    const effectiveDataSource: DataSourceConfig = {
      ...lineDataSource,
      defaultFilter: `${parentKeyField} eq '${documentNo.replace(/'/g, "''")}'`
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
    const candidates = [
      configuredField,
      'Number',
      'No',
      'DocumentNo',
      'documentNo',
      'OrderNumber'
    ].filter((field) => field.length > 0);

    for (const field of candidates) {
      const value = headerData[field];
      if (value !== null && value !== undefined && String(value).trim().length > 0) {
        return String(value).trim();
      }
    }

    return '';
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

  private async hydrateConfiguredOptions(
    module: RunModalConfigModule,
    entryDialogConfig: EntryDialogConfig
  ): Promise<void> {
    await Promise.all([
      this.hydrateHeaderOptions(entryDialogConfig),
      this.hydrateLineOptions(module, entryDialogConfig)
    ]);
  }

  private async hydrateHeaderOptions(entryDialogConfig: EntryDialogConfig): Promise<void> {
    const headerData = entryDialogConfig.headerData ?? {};
    const loads: Array<Promise<void>> = [];

    for (const section of entryDialogConfig.headerSections ?? []) {
      for (const field of section.fields) {
        const optionsKey = this.toText(field.optionsDataKey).trim();
        const endpoints = (field.optionsEndpoints ?? [])
          .map((endpoint) => endpoint.trim())
          .filter((endpoint) => endpoint.length > 0);
        if (!optionsKey || !endpoints.length || Array.isArray(headerData[optionsKey])) {
          continue;
        }

        loads.push(
          firstValueFrom(this.masterData.loadFirstAvailableList(endpoints))
            .then((records) => {
              headerData[optionsKey] = records;
            })
            .catch(() => {
              headerData[optionsKey] = [];
            })
        );
      }
    }

    await Promise.all(loads);
    entryDialogConfig.headerData = headerData;
  }

  private async hydrateLineOptions(
    module: RunModalConfigModule,
    entryDialogConfig: EntryDialogConfig
  ): Promise<void> {
    const lineRows = entryDialogConfig.lineRows ?? [];
    if (!lineRows.length) {
      return;
    }

    const loads: Array<Promise<void>> = [];
    for (const column of entryDialogConfig.lineColumns ?? []) {
      const optionsKey = this.toText(column.optionsDataKey).trim();
      if (!optionsKey) {
        continue;
      }

      const endpoints = (column.optionsEndpoints ?? [])
        .map((endpoint) => endpoint.trim())
        .filter((endpoint) => endpoint.length > 0);
      if (endpoints.length) {
        loads.push(
          firstValueFrom(this.masterData.loadFirstAvailableList(endpoints))
            .then((records) => {
              const options = this.toLineOptions(records);
              for (const row of lineRows) {
                row[optionsKey] = options;
              }
            })
            .catch(() => {
              for (const row of lineRows) {
                row[optionsKey] = [];
              }
            })
        );
        continue;
      }

      if ((column.field ?? column.id) === 'Number' || (column.field ?? column.id) === 'No') {
        loads.push(this.hydrateTypeDrivenLineNumberOptions(module, lineRows, optionsKey));
      }
    }

    await Promise.all(loads);
    entryDialogConfig.lineRows = lineRows;
  }

  private async hydrateTypeDrivenLineNumberOptions(
    module: RunModalConfigModule,
    lineRows: Record<string, unknown>[],
    optionsKey: string
  ): Promise<void> {
    const groups = new Map<string, Record<string, unknown>[]>();
    for (const row of lineRows) {
      const type = this.toText(row['Type']).trim();
      if (!type.length) {
        continue;
      }

      const normalized = this.toLineMasterKey(type);
      if (!normalized.length) {
        continue;
      }

      if (!groups.has(normalized)) {
        groups.set(normalized, []);
      }

      groups.get(normalized)?.push(row);
    }

    await Promise.all([...groups.entries()].map(async ([masterKey, rows]) => {
      const endpoints = this.resolveLineMasterEndpoints(module, masterKey);
      if (!endpoints.length) {
        rows.forEach((row) => {
          row[optionsKey] = [];
        });
        return;
      }

      try {
        const records = await firstValueFrom(this.masterData.loadFirstAvailableList(endpoints));
        const optionFields = this.resolveLineMasterOptionFields(module, masterKey);
        const options = this.masterData.toSelectOptions(records, optionFields.valueFields, optionFields.labelFields);
        rows.forEach((row) => {
          row[optionsKey] = options;
          row[this.toLineMasterRecordsKey(optionsKey)] = records;
        });
      } catch {
        rows.forEach((row) => {
          row[optionsKey] = [];
          row[this.toLineMasterRecordsKey(optionsKey)] = [];
        });
      }
    }));
  }

  private toLineMasterRecordsKey(optionsKey: string): string {
    return `__records_${optionsKey}`;
  }

  private toLineMasterKey(type: string): string {
    const normalized = type.trim().toLowerCase().replace(/[\s_/-]+/g, '');
    if (!normalized.length || normalized === 'comment') {
      return '';
    }

    if (normalized === 'glaccount' || normalized.includes('account')) {
      return 'glAccounts';
    }

    if (normalized === 'item' || normalized.includes('item')) {
      return 'items';
    }

    if (normalized === 'fixedasset' || normalized.includes('fixedasset')) {
      return 'fixedAssets';
    }

    return '';
  }

  private resolveLineMasterEndpoints(module: RunModalConfigModule, masterKey: string): string[] {
    const config = this.pickObject(module, 'LineMasterEndpoints');
    const endpoints = config?.[masterKey];
    if (!Array.isArray(endpoints)) {
      return [];
    }

    return endpoints
      .map((endpoint) => this.toText(endpoint).trim())
      .filter((endpoint) => endpoint.length > 0);
  }

  private resolveLineMasterOptionFields(
    module: RunModalConfigModule,
    masterKey: string
  ): { valueFields: string[]; labelFields: string[] } {
    const config = this.pickObject(module, 'LineMasterOptionFields');
    const masterConfig = this.toRecord(config?.[masterKey]);
    const valueFields = this.toTextArray(masterConfig?.['valueFields']);
    const labelFields = this.toTextArray(masterConfig?.['labelFields']);

    return {
      valueFields: valueFields.length ? valueFields : ['No', 'Number', 'Code'],
      labelFields: labelFields.length ? labelFields : ['Description', 'Name', 'DisplayName']
    };
  }

  private toLineOptions(records: Record<string, unknown>[]): Array<{ label: string; value: string }> {
    return records
      .map((record) => {
        const value = this.readFirstText(record, ['Code', 'No', 'Number', 'code', 'no', 'number', 'Id', 'id']);
        const labelText = this.readFirstText(record, ['Description', 'Name', 'DisplayName', 'description', 'name', 'displayName']);
        return {
          label: labelText ? `${value} - ${labelText}` : value,
          value
        };
      })
      .filter((option) => option.value.length > 0);
  }

  private readFirstText(record: Record<string, unknown>, fields: string[]): string {
    for (const field of fields) {
      const value = record[field];
      if (value !== null && value !== undefined && String(value).trim().length > 0) {
        return String(value).trim();
      }
    }

    return '';
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
        if (!this.resolveLineSaveDataSource(binding)?.endpoint?.trim()) {
          this.setReadyStatus(entryDialogConfig);
          return;
        }

        await this.saveLine(binding, entryDialogConfig, payload['row']);
        return;
      }

      if (typeof payload['fieldKey'] === 'string') {
        if (!this.resolveHeaderSaveDataSource(binding)?.endpoint?.trim()) {
          this.setReadyStatus(entryDialogConfig);
          return;
        }

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
    row: Record<string, unknown>
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
      const payload = this.buildLinePayload(row, entryDialogConfig);
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

  private buildLinePayload(row: Record<string, unknown>, entryDialogConfig: EntryDialogConfig): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    for (const column of entryDialogConfig.lineColumns ?? []) {
      const field = this.toText(column.field ?? column.id).trim();
      if (!field || !(field in row)) {
        continue;
      }

      payload[field] = row[field];
    }

    const headerData = entryDialogConfig.headerData ?? {};
    const documentNo = this.toText(headerData['Number'] ?? headerData['No'] ?? headerData['DocumentNo']).trim();
    const existingDocumentNo = this.toText(payload['DocumentNo'] ?? row['DocumentNo']).trim();
    if (documentNo && !existingDocumentNo.length) {
      payload['DocumentNo'] = documentNo;
    }

    return payload;
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

  private applyLineChange(payload: unknown): { field: string; row?: Record<string, unknown> } {
    if (!this.isRecord(payload)) {
      return { field: '' };
    }

    const row = this.toRecord(payload['row']);
    const column = this.toRecord(payload['column']);
    if (!row || !column) {
      return { field: '' };
    }

    const field = this.toText(column['field'] ?? column['id']).trim();
    if (!field) {
      return { field: '' };
    }

    row[field] = payload['value'];
    return { field, row };
  }

  private isLineNumberField(field: string): boolean {
    const normalized = field.trim().toLowerCase();
    return normalized === 'number' || normalized === 'no';
  }

  private applyLineMasterSelection(
    module: RunModalConfigModule,
    entryDialogConfig: EntryDialogConfig,
    row: Record<string, unknown>,
    numberField: string
  ): void {
    const strategy = this.pickObject(module, 'LineSelectionStrategy') as unknown as LineSelectionStrategy | undefined;
    if (!strategy?.descriptionField || !strategy.unitOfMeasureField || !strategy.unitCostField) {
      return;
    }

    const numberColumn = (entryDialogConfig.lineColumns ?? [])
      .find((column) => this.toText(column.field ?? column.id).trim() === numberField);
    const optionsKey = this.toText(numberColumn?.optionsDataKey).trim() || `__options_${numberField}`;
    const records = row[this.toLineMasterRecordsKey(optionsKey)];
    if (!Array.isArray(records)) {
      return;
    }

    const identifierFields = this.pickArray(module, 'LineIdentifierFields')
      .map((field) => this.toText(field).trim())
      .filter((field) => field.length > 0);
    const fields = identifierFields.length ? identifierFields : ['No', 'Number', 'Code'];
    const type = this.toLineMasterDisplayType(row['Type']);
    const registry = {
      defaultType: type,
      emptyType: '',
      byType: {
        [type]: {
          options: [],
          records: records.filter((record): record is Record<string, unknown> => this.isRecord(record))
        }
      }
    };
    const master = this.lineMasters.findRecordByNumber(type, row[numberField], registry, fields);
    if (!master) {
      return;
    }

    this.lineMasters.applySelection(row, master, strategy);
  }

  private toLineMasterDisplayType(value: unknown): string {
    const text = this.toText(value).trim();
    return text.length ? text : 'default';
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

    if (!this.resolveLineSaveDataSource(binding)?.endpoint?.trim()) {
      return;
    }

    await this.saveLine(binding, entryDialogConfig, insertedRow);
  }

  private insertLine(entryDialogConfig: EntryDialogConfig, payload: unknown): Record<string, unknown> | undefined {
    const rows = entryDialogConfig.lineRows ?? [];
    const nextRow = this.buildEmptyLineRow(entryDialogConfig.lineColumns ?? [], entryDialogConfig.headerData);
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

  private setReadyStatus(entryDialogConfig: EntryDialogConfig): void {
    entryDialogConfig.statusMessage = {
      tone: 'success',
      title: 'Ready',
      message: ''
    };
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

  private toTextArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => this.toText(item).trim())
      .filter((item) => item.length > 0);
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
