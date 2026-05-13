import { Injectable } from '@angular/core';
import { EntryDialogConfig, EntryHeaderSectionConfig } from '../models/entry-dialog-config.model';
import { PopupMode, PopupSize } from '../models/popup-config.model';
import { PopupStackService } from './popup-stack.service';
import { DataSourceService } from './data-source.service';
import { DataSourceConfig } from '../models/data-source-config.model';
import { firstValueFrom } from 'rxjs';

type RunModalContext = Record<string, unknown>;

type RunModalPageDefinition = {
  pageId: string;
  mode?: PopupMode;
  size?: PopupSize;
  buildEntryDialogConfig: (context: RunModalContext) => EntryDialogConfig;
  module: RunModalConfigModule;
};

type RunModalConfigModule = {
  runModalMode?: PopupMode;
  runModalSize?: PopupSize;
  buildRunModalEntryDialogConfig?: (context: RunModalContext) => EntryDialogConfig;
  runModalRelation?: {
    parentEndpoint: string;
    childCollection: string;
    parentIdFields?: string[];
    top?: number;
  };
  runModalDataSource?: DataSourceConfig;
  [key: string]: unknown;
};

type RunModalBinding = {
  pageId: string;
  module: RunModalConfigModule;
  context: RunModalContext;
  dataSource?: DataSourceConfig;
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
    private readonly dataSource: DataSourceService
  ) {}

  async open(request: RunModalRequest): Promise<boolean> {
    const definition = await this.resolvePageDefinition(request.pageId);
    if (!definition) {
      return false;
    }

    const context = request.context ?? {};
    const entryDialogConfig = definition.buildEntryDialogConfig(context);
    const runModalDataSource = this.resolveRunModalDataSource(definition.module, context);
    await this.hydrateFromApi(definition.module, entryDialogConfig, context, runModalDataSource);
    const popupId = request.popupId ?? `run-modal-${request.pageId}-${Date.now()}`;

    this.popupStack.open({
      id: popupId,
      title: entryDialogConfig.title,
      mode: request.mode ?? definition.mode ?? 'page',
      size: request.size ?? definition.size ?? 'full',
      allowNested: request.allowNested ?? true,
      data: {
        entryDialogConfig
      }
    });

    this.bindings.set(popupId, {
      pageId: definition.pageId,
      module: definition.module,
      context,
      dataSource: runModalDataSource
    });

    return true;
  }

  handlePopupAction(popupId: string, entryDialogConfig: EntryDialogConfig, event: RunModalActionEvent): boolean {
    const binding = this.bindings.get(popupId);
    if (!binding) {
      return false;
    }

    if (event.actionKey === 'header:changed') {
      this.applyHeaderChange(entryDialogConfig, event.payload);
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

    if (event.actionKey === 'cmd:delete') {
      void this.deleteHeader(binding, entryDialogConfig);
      return true;
    }

    return false;
  }

  releasePopup(popupId: string): void {
    this.bindings.delete(popupId);
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
    try {
      const normalized = pageId.trim().toLowerCase();
      if (!normalized.length) {
        return undefined;
      }

      const module = await import(`../../../pages/${normalized}/${normalized}.config.ts`);
      return module as RunModalConfigModule;
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
    const headerSections = this.pickArray(module, 'HeaderSections');
    const lineColumns = this.pickArray(module, 'LineColumns');
    const headerToolbarButtons = this.pickArray(module, 'HeaderToolbarButtons');
    const lineToolbarButtons = this.pickArray(module, 'LineToolbarButtons');
    const headerCommandBar = this.pickObject(module, 'HeaderCommandBar');
    const lineCommandBar = this.pickObject(module, 'LineCommandBar');
    const linePlacement = this.pickObject(module, 'LinePlacement');
    const lineTotalsDefault = this.pickObject(module, 'LineTotalsDefault');

    const headerData = this.buildHeaderData(context, headerSections);
    const lineRows = this.buildLineRows(context);

    return {
      pageLabel: 'PAGE',
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
      lineTotals: this.buildLineTotals(lineTotalsDefault)
    };
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
    const baseDataSource = explicitDataSource ?? this.pickDataSource(module);
    if (!baseDataSource?.endpoint?.trim()) {
      return undefined;
    }

    const relation = module.runModalRelation;
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

    if (this.isRecord(payload['row'])) {
      await this.saveLine(binding, entryDialogConfig, payload['row']);
      return;
    }

    if (typeof payload['fieldKey'] === 'string') {
      await this.saveHeader(binding, entryDialogConfig);
    }
  }

  private async saveHeader(binding: RunModalBinding, entryDialogConfig: EntryDialogConfig): Promise<void> {
    const dataSource = binding.dataSource;
    const headerData = entryDialogConfig.headerData;
    if (!dataSource?.endpoint || !headerData) {
      return;
    }

    const payload = this.buildHeaderPayload(headerData, entryDialogConfig.headerSections ?? []);
    await this.createOrUpdateRecord(dataSource, headerData, payload);
    entryDialogConfig.statusMessage = {
      tone: 'success',
      title: 'Saved',
      message: 'Changes saved.'
    };
  }

  private async saveLine(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    row: Record<string, unknown>
  ): Promise<void> {
    const dataSource = binding.dataSource;
    if (!dataSource?.endpoint) {
      return;
    }

    const payload = this.buildLinePayload(row, entryDialogConfig);
    await this.createOrUpdateRecord(dataSource, row, payload);
    entryDialogConfig.statusMessage = {
      tone: 'success',
      title: 'Saved',
      message: 'Line saved.'
    };
  }

  private async deleteLines(
    binding: RunModalBinding,
    entryDialogConfig: EntryDialogConfig,
    payload: unknown
  ): Promise<void> {
    const dataSource = binding.dataSource;
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
  }

  private async deleteHeader(binding: RunModalBinding, entryDialogConfig: EntryDialogConfig): Promise<void> {
    const dataSource = binding.dataSource;
    const headerData = entryDialogConfig.headerData;
    if (!dataSource?.endpoint || !headerData) {
      return;
    }

    const id = this.resolveRecordId(headerData, dataSource);
    if (id === null || id === undefined || id === '') {
      return;
    }

    await firstValueFrom(this.dataSource.delete(dataSource, id));
    entryDialogConfig.statusMessage = {
      tone: 'success',
      title: 'Deleted',
      message: 'Record deleted.'
    };
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

  private buildHeaderPayload(
    headerData: Record<string, unknown>,
    sections: EntryHeaderSectionConfig[]
  ): Record<string, unknown> {
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

    return payload;
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

    return payload;
  }

  private resolveRecordId(source: Record<string, unknown>, config: DataSourceConfig): unknown {
    const keyField = config.keyField?.trim();
    if (keyField) {
      const direct = this.readFieldValue(source, keyField);
      if (direct !== null && direct !== undefined && String(direct).trim().length > 0) {
        return direct;
      }
    }

    for (const fallback of ['systemId', 'SystemId', 'id', 'Id']) {
      const value = source[fallback];
      if (value !== null && value !== undefined && String(value).trim().length > 0) {
        return value;
      }
    }

    return undefined;
  }

  private mergeRecord(target: Record<string, unknown>, response: unknown): void {
    if (!this.isRecord(response)) {
      return;
    }

    Object.assign(target, response);
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

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
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
