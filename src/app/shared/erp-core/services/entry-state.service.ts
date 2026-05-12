import { Inject, Injectable, Optional } from '@angular/core';
import { catchError, of, take } from 'rxjs';
import { ERP_ENTRY_SAVE_PORT, ErpEntrySavePort, ErpEntrySaveResult } from './entry-save.port';
import { ErpFieldConfig, ErpFieldValueType, ErpFormSectionConfig } from '../models/field-config.model';

export interface ErpLineChangeEvent {
  row: Record<string, unknown>;
  field: string;
  value: unknown;
}

export interface ErpLineAmountFields {
  quantityField?: string;
  qtyToInvoiceField?: string;
  unitCostField?: string;
  lineAmountField?: string;
  amountToInvoiceField?: string;
}

export interface ErpAutosaveOptions {
  delay?: number;
  modifiedAtKey?: string;
  lineRows?: Record<string, unknown>[];
  meta?: Record<string, unknown>;
  onCompleted?: (result: ErpEntrySaveResult) => void;
  onFailed?: (result: ErpEntrySaveResult) => void;
}

export interface ErpPopupActionEvent {
  popupId: string;
  actionKey: string;
  payload?: unknown;
}

export interface ErpEntryPopupActionHandlers {
  lineChanged?: (payload: unknown) => void;
  lineSelectionChanged?: (payload: unknown) => void;
  headerChanged?: (payload: unknown) => void;
  headerInteracted?: (payload: unknown) => void;
  autosave?: () => void;
  commands?: ErpEntryCommandHandlers;
  command?: (actionKey: string, payload: unknown) => void;
}

export interface ErpEntryCommandHandlers {
  save?: (payload: unknown) => void;
  validate?: (payload: unknown) => void;
  release?: (payload: unknown) => void;
  apply?: (payload: unknown) => void;
  clear?: (payload: unknown) => void;
  template?: (payload: unknown) => void;
  lineNew?: (payload: unknown) => void;
  lineInsert?: (payload: unknown) => void;
  reopen?: (payload: unknown) => void;
  prepayment?: (payload: unknown) => void;
  command?: (command: string, payload: unknown) => void;
}

@Injectable({
  providedIn: 'root'
})
export class EntryStateService {
  private readonly autosaveTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(@Optional() @Inject(ERP_ENTRY_SAVE_PORT) private readonly savePort: ErpEntrySavePort | null) {}

  buildFieldValueTypeMap(sections: ErpFormSectionConfig[]): Record<string, ErpFieldValueType> {
    const map: Record<string, ErpFieldValueType> = {};

    for (const section of sections) {
      for (const field of section.fields) {
        map[field.key] = this.resolveFieldValueType(field);
      }
    }

    return map;
  }

  buildFieldConfigMap(sections: ErpFormSectionConfig[]): Record<string, ErpFieldConfig> {
    const map: Record<string, ErpFieldConfig> = {};

    for (const section of sections) {
      for (const field of section.fields) {
        map[field.key] = field;
      }
    }

    return map;
  }

  applyHeaderFieldChange(
    headerData: Record<string, unknown>,
    payload: unknown,
    valueTypeMap: Record<string, ErpFieldValueType> = {}
  ): boolean {
    if (!this.isRecord(payload)) {
      return false;
    }

    const fieldKey = this.toText(payload['fieldKey']);
    const value = this.coerceValue(payload['value'], valueTypeMap[fieldKey]);
    let changed = false;

    if (fieldKey.length > 0) {
      headerData[fieldKey] = value;
      changed = true;
    }

    const updates = payload['updates'];
    if (this.isRecord(updates)) {
      for (const [targetKey, targetValue] of Object.entries(updates)) {
        headerData[targetKey] = this.coerceValue(targetValue, valueTypeMap[targetKey]);
        changed = true;
      }
    }

    return changed;
  }

  rollbackHeaderFieldChange(
    headerData: Record<string, unknown>,
    payload: unknown,
    valueTypeMap: Record<string, ErpFieldValueType> = {}
  ): boolean {
    if (!this.isRecord(payload)) {
      return false;
    }

    const fieldKey = this.toText(payload['fieldKey']);
    let changed = false;

    if (fieldKey.length > 0 && 'previousValue' in payload) {
      headerData[fieldKey] = this.coerceValue(payload['previousValue'], valueTypeMap[fieldKey]);
      changed = true;
    }

    const previousUpdates = payload['previousUpdates'];
    if (this.isRecord(previousUpdates)) {
      for (const [targetKey, previousValue] of Object.entries(previousUpdates)) {
        headerData[targetKey] = this.coerceValue(previousValue, valueTypeMap[targetKey]);
        changed = true;
      }
    }

    return changed;
  }

  scheduleAutosave(scope: string, callback: () => void, delay = 400): void {
    this.clearAutosave(scope);

    const timer = setTimeout(() => {
      this.autosaveTimers.delete(scope);
      callback();
    }, delay);

    this.autosaveTimers.set(scope, timer);
  }

  clearAutosave(scope: string): void {
    const timer = this.autosaveTimers.get(scope);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    this.autosaveTimers.delete(scope);
  }

  clearAllAutosaves(): void {
    for (const timer of this.autosaveTimers.values()) {
      clearTimeout(timer);
    }

    this.autosaveTimers.clear();
  }

  touchHeaderModifiedAt(headerData: Record<string, unknown>, key = 'ModifiedAt'): void {
    headerData[key] = new Date().toISOString();
  }

  scheduleHeaderAutosave(
    scope: string,
    headerData: Record<string, unknown>,
    options: ErpAutosaveOptions = {}
  ): void {
    const modifiedAtKey = options.modifiedAtKey ?? 'ModifiedAt';

    this.scheduleAutosave(scope, () => {
      const request = {
        scope,
        headerData: { ...headerData },
        lineRows: options.lineRows,
        meta: options.meta
      };

      if (!this.savePort) {
        this.touchHeaderModifiedAt(headerData, modifiedAtKey);
        options.onCompleted?.({
          saved: true,
          modifiedAt: this.toText(headerData[modifiedAtKey])
        });
        return;
      }

      this.savePort.save(request).pipe(
        take(1),
        catchError((error: unknown) => of({
          saved: false,
          errorMessage: this.resolveErrorMessage(error)
        } as ErpEntrySaveResult))
      ).subscribe((result) => {
        if (result.saved && result.modifiedAt) {
          headerData[modifiedAtKey] = result.modifiedAt;
          options.onCompleted?.(result);
        } else {
          if (options.onFailed) {
            options.onFailed(result);
          } else {
            this.touchHeaderModifiedAt(headerData, modifiedAtKey);
            options.onCompleted?.({
              saved: true,
              modifiedAt: this.toText(headerData[modifiedAtKey])
            });
          }
        }
      });
    }, options.delay);
  }

  handleEntryPopupAction(
    event: ErpPopupActionEvent,
    popupId: string,
    handlers: ErpEntryPopupActionHandlers
  ): boolean {
    if (event.popupId !== popupId) {
      return false;
    }

    if (event.actionKey === 'line:changed') {
      handlers.lineChanged?.(event.payload);
      return true;
    }

    if (event.actionKey === 'line:selection-changed') {
      handlers.lineSelectionChanged?.(event.payload);
      return true;
    }

    if (event.actionKey === 'header:changed') {
      handlers.headerChanged?.(event.payload);
      return true;
    }

    if (event.actionKey === 'header:interacted') {
      handlers.headerInteracted?.(event.payload);
      return true;
    }

    if (event.actionKey === 'cmd:autosave') {
      handlers.autosave?.();
      return true;
    }

    if (event.actionKey.startsWith('cmd:')) {
      const command = event.actionKey.slice('cmd:'.length);
      if (this.handleEntryCommand(command, event.payload, handlers.commands)) {
        return true;
      }
    }

    handlers.command?.(event.actionKey, event.payload);
    return true;
  }

  private handleEntryCommand(
    command: string,
    payload: unknown,
    handlers?: ErpEntryCommandHandlers
  ): boolean {
    if (!handlers) {
      return false;
    }

    switch (command) {
      case 'save':
        handlers.save?.(payload);
        return true;
      case 'validate':
        handlers.validate?.(payload);
        return true;
      case 'release':
        handlers.release?.(payload);
        return true;
      case 'apply':
        handlers.apply?.(payload);
        return true;
      case 'clear':
        handlers.clear?.(payload);
        return true;
      case 'template':
        handlers.template?.(payload);
        return true;
      case 'line-new':
        handlers.lineNew?.(payload);
        return true;
      case 'line-insert':
        handlers.lineInsert?.(payload);
        return true;
      case 'reopen':
        handlers.reopen?.(payload);
        return true;
      case 'prepayment':
        handlers.prepayment?.(payload);
        return true;
      default:
        handlers.command?.(command, payload);
        return handlers.command !== undefined;
    }
  }

  resolveLineChange(payload: unknown): ErpLineChangeEvent | null {
    if (!this.isRecord(payload)) {
      return null;
    }

    const row = payload['row'];
    const column = payload['column'];
    if (!this.isRecord(row) || !this.isRecord(column)) {
      return null;
    }

    return {
      row,
      field: this.toText(column['field'] ?? column['id']),
      value: payload['value']
    };
  }

  recalculateLineAmounts(
    row: Record<string, unknown>,
    fields: ErpLineAmountFields = {}
  ): void {
    const quantityField = fields.quantityField ?? 'Quantity';
    const qtyToInvoiceField = fields.qtyToInvoiceField ?? 'QtyToInvoice';
    const unitCostField = fields.unitCostField ?? 'DirectUnitCost';
    const lineAmountField = fields.lineAmountField ?? 'LineAmount';
    const amountToInvoiceField = fields.amountToInvoiceField ?? 'AmountToInvoice';

    const quantity = this.toNumber(row[quantityField]) ?? 0;
    const qtyToInvoice = this.toNumber(row[qtyToInvoiceField]);
    const unitCost = this.toNumber(row[unitCostField]) ?? 0;
    const lineAmount = quantity * unitCost;
    const amountToInvoice = (qtyToInvoice ?? quantity) * unitCost;

    row[lineAmountField] = lineAmount;
    row[amountToInvoiceField] = amountToInvoice;
  }

  setNumericFields(
    row: Record<string, unknown>,
    fieldKeys: string[],
    value: number
  ): void {
    for (const key of fieldKeys) {
      row[key] = value;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
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

  private toText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private resolveErrorMessage(error: unknown): string {
    if (this.isRecord(error)) {
      const direct = this.toText(error['message']);
      if (direct.length) {
        return direct;
      }

      const nestedError = error['error'];
      if (this.isRecord(nestedError)) {
        const nested = this.toText(nestedError['message'] ?? nestedError['Message'] ?? nestedError['error_description']);
        if (nested.length) {
          return nested;
        }
      }
    }

    if (error instanceof Error && error.message.length) {
      return error.message;
    }

    return 'Save failed.';
  }

  private resolveFieldValueType(field: ErpFieldConfig): ErpFieldValueType {
    if (field.valueType) {
      return field.valueType;
    }

    if (field.type === 'number' || field.type === 'currency') {
      return 'number';
    }

    if (field.type === 'boolean') {
      return 'boolean';
    }

    if (field.type === 'date') {
      return 'date';
    }

    return 'text';
  }

  private coerceValue(value: unknown, valueType: ErpFieldValueType | undefined): unknown {
    switch (valueType) {
      case 'number': {
        const parsed = this.toNumber(value);
        if (parsed === null) {
          const text = this.toText(value);
          return text.length ? text : '';
        }

        return parsed;
      }
      case 'boolean': {
        if (typeof value === 'boolean') {
          return value;
        }

        const normalized = this.toText(value).trim().toLowerCase();
        if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
          return true;
        }

        if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
          return false;
        }

        return Boolean(value);
      }
      case 'date':
      case 'text':
      default:
        return this.toText(value);
    }
  }
}
