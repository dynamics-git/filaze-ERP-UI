import { Injectable } from '@angular/core';
import { EntryLineTotalsConfig } from '../models/entry-dialog-config.model';
import { LineColumnConfig } from '../models/line-config.model';

export type LineTotalKey = keyof EntryLineTotalsConfig;

export type LineTotalExpressionConfig =
  | { kind: 'sum'; field: string }
  | { kind: 'difference'; left: LineTotalExpressionConfig; right: LineTotalExpressionConfig }
  | { kind: 'value'; value: number }
  | { kind: 'default' };

export interface LineTotalsCalculationConfig {
  defaults: EntryLineTotalsConfig;
  totals: Partial<Record<LineTotalKey, LineTotalExpressionConfig>>;
  format?: {
    type?: 'number' | 'currency';
    currencyCodeHeaderField?: string;
    currencyCodeFallback?: string;
  };
}

export type LineRowValueExpressionConfig =
  | { kind: 'field'; field: string; fallbackFields?: string[]; defaultValue?: number }
  | { kind: 'value'; value: number }
  | { kind: 'multiply'; values: LineRowValueExpressionConfig[] }
  | { kind: 'add'; values: LineRowValueExpressionConfig[] }
  | { kind: 'subtract'; left: LineRowValueExpressionConfig; right: LineRowValueExpressionConfig };

export interface LineRowCalculationRuleConfig {
  target: string;
  formula: LineRowValueExpressionConfig;
  precision?: number;
}

export interface LineRowCalculationConfig {
  rules: LineRowCalculationRuleConfig[];
}

@Injectable({
  providedIn: 'root'
})
export class LineCalculationService {
  private static readonly QUANTITY_FIELDS = ['quantity', 'qty', 'qtyToInvoice', 'qtyToReceive'];
  private static readonly UNIT_AMOUNT_FIELDS = ['directUnitCost', 'unitCost', 'unitPrice', 'originalCost'];
  private static readonly AMOUNT_FIELDS = ['lineAmount', 'amount', 'poAmount'];

  applyDefaultRowCalculations(
    row: Record<string, unknown>,
    columns: LineColumnConfig[]
  ): string[] {
    const fields = this.resolveColumnFields(columns);
    const quantityField = this.findFirstField(fields, LineCalculationService.QUANTITY_FIELDS);
    const unitAmountField = this.findFirstField(fields, LineCalculationService.UNIT_AMOUNT_FIELDS);
    const amountField = this.findFirstField(fields, LineCalculationService.AMOUNT_FIELDS);

    if (!quantityField || !unitAmountField || !amountField) {
      return [];
    }

    const quantity = this.toNumber(row[quantityField]) ?? 0;
    const unitAmount = this.toNumber(row[unitAmountField]) ?? 0;
    const amount = this.round(quantity * unitAmount);
    const changedFields: string[] = [];

    this.assignIfChanged(row, amountField, amount, changedFields);

    if (fields.has('amountToInvoice')) {
      this.assignIfChanged(row, 'amountToInvoice', amount, changedFields);
    }

    if (fields.has('amountIncludingVat')) {
      const vat = this.toNumber(row['vat']) ?? this.toNumber(row['tax']) ?? 0;
      this.assignIfChanged(row, 'amountIncludingVat', this.round(amount + vat), changedFields);
    }

    return changedFields;
  }

  applyRowCalculations(
    row: Record<string, unknown>,
    config: LineRowCalculationConfig
  ): string[] {
    const changedFields: string[] = [];

    for (const rule of config.rules) {
      const target = this.toText(rule.target).trim();
      if (!target) {
        continue;
      }

      const nextValue = this.round(this.evaluateRow(row, rule.formula), rule.precision);
      if (this.toNumber(row[target]) === nextValue) {
        continue;
      }

      row[target] = nextValue;
      changedFields.push(target);
    }

    return changedFields;
  }

  calculateLineTotals(
    rows: Record<string, unknown>[],
    config: LineTotalsCalculationConfig,
    headerData?: Record<string, unknown>
  ): EntryLineTotalsConfig {
    const defaults = config.defaults;
    const result: EntryLineTotalsConfig = { ...defaults };

    for (const key of Object.keys(config.totals) as LineTotalKey[]) {
      const expression = config.totals[key];
      if (!expression) {
        continue;
      }

      result[key] = expression.kind === 'default'
        ? defaults[key]
        : this.format(this.evaluate(rows, expression), config, headerData);
    }

    return result;
  }

  private resolveColumnFields(columns: LineColumnConfig[]): Set<string> {
    return new Set(
      columns
        .map((column) => this.toText(column.field ?? column.id).trim())
        .filter((field) => field.length > 0)
    );
  }

  private findFirstField(fields: Set<string>, candidates: string[]): string {
    return candidates.find((candidate) => fields.has(candidate)) ?? '';
  }

  private assignIfChanged(
    row: Record<string, unknown>,
    field: string,
    value: number,
    changedFields: string[]
  ): void {
    if (this.toNumber(row[field]) === value) {
      return;
    }

    row[field] = value;
    changedFields.push(field);
  }

  private evaluate(rows: Record<string, unknown>[], expression: LineTotalExpressionConfig): number {
    switch (expression.kind) {
      case 'sum':
        return rows.reduce((sum, row) => sum + (this.toNumber(row[expression.field]) ?? 0), 0);
      case 'difference':
        return this.evaluate(rows, expression.left) - this.evaluate(rows, expression.right);
      case 'value':
        return expression.value;
      case 'default':
        return 0;
    }
  }

  private evaluateRow(row: Record<string, unknown>, expression: LineRowValueExpressionConfig): number {
    switch (expression.kind) {
      case 'field':
        return this.resolveRowNumber(row, expression);
      case 'value':
        return expression.value;
      case 'multiply':
        return expression.values.reduce((total, item) => total * this.evaluateRow(row, item), 1);
      case 'add':
        return expression.values.reduce((total, item) => total + this.evaluateRow(row, item), 0);
      case 'subtract':
        return this.evaluateRow(row, expression.left) - this.evaluateRow(row, expression.right);
    }
  }

  private resolveRowNumber(row: Record<string, unknown>, expression: Extract<LineRowValueExpressionConfig, { kind: 'field' }>): number {
    const fields = [expression.field, ...(expression.fallbackFields ?? [])];
    for (const field of fields) {
      const value = this.toNumber(row[field]);
      if (value !== null) {
        return value;
      }
    }

    return expression.defaultValue ?? 0;
  }

  private round(value: number, precision = 2): number {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
  }

  private format(
    value: number,
    config: LineTotalsCalculationConfig,
    headerData?: Record<string, unknown>
  ): string {
    const formatted = this.formatNumber(value);
    if (config.format?.type !== 'currency') {
      return formatted;
    }

    const currencyCode = this.toText(
      config.format.currencyCodeHeaderField
        ? headerData?.[config.format.currencyCodeHeaderField]
        : undefined
    ).trim() || this.toText(config.format.currencyCodeFallback).trim();

    return currencyCode ? `${currencyCode} ${formatted}` : formatted;
  }

  private formatNumber(value: number): string {
    return Number.isFinite(value) ? value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) : '0.00';
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
}
