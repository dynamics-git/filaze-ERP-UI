import { Injectable } from '@angular/core';
import { EntryDialogConfig } from '../models/entry-dialog-config.model';
import { PopupMode, PopupSize } from '../models/popup-config.model';
import { PopupStackService } from './popup-stack.service';

type RunModalContext = Record<string, unknown>;

type RunModalPageDefinition = {
  pageId: string;
  mode?: PopupMode;
  size?: PopupSize;
  buildEntryDialogConfig: (context: RunModalContext) => EntryDialogConfig;
};

type RunModalConfigModule = {
  runModalMode?: PopupMode;
  runModalSize?: PopupSize;
  buildRunModalEntryDialogConfig?: (context: RunModalContext) => EntryDialogConfig;
  [key: string]: unknown;
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
  constructor(private readonly popupStack: PopupStackService) {}

  async open(request: RunModalRequest): Promise<boolean> {
    const definition = await this.resolvePageDefinition(request.pageId);
    if (!definition) {
      return false;
    }

    const entryDialogConfig = definition.buildEntryDialogConfig(request.context ?? {});
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

    return true;
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
      buildEntryDialogConfig
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
