import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ErpLineColumnConfig } from '../../models/line-config.model';

type LineOption = { label: string; value: unknown };

@Component({
  selector: 'erp-line-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-renderer.html',
  styleUrl: './line-renderer.scss'
})
export class ErpLineRendererComponent {
  @Input() columns: ErpLineColumnConfig[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  @Output() action = new EventEmitter<{ actionKey: string; row: Record<string, unknown> }>();
  @Output() rowChanged = new EventEmitter<{
    row: Record<string, unknown>;
    column: ErpLineColumnConfig;
    value: unknown;
  }>();

  getCellValue(row: Record<string, unknown>, column: ErpLineColumnConfig): string {
    const value = row[column.field ?? column.id];
    return value === undefined || value === null ? '' : String(value);
  }

  getOptions(column: ErpLineColumnConfig, row: Record<string, unknown>): LineOption[] {
    const rowOptionsKey = `__options_${column.field ?? column.id}`;
    const rowOptions = row[rowOptionsKey];
    if (Array.isArray(rowOptions) && rowOptions.length) {
      return rowOptions
        .filter((option): option is LineOption => typeof option === 'object' && option !== null && 'label' in option && 'value' in option)
        .map((option) => ({ label: String(option.label), value: option.value }));
    }

    if (column.options?.length) {
      return column.options;
    }

    const value = this.getCellValue(row, column);
    return value ? [{ label: value, value }] : [{ label: '', value: '' }];
  }

  isOptionSelected(column: ErpLineColumnConfig, row: Record<string, unknown>, optionValue: unknown): boolean {
    return String(optionValue) === this.getCellValue(row, column);
  }

  showEmptyOption(column: ErpLineColumnConfig, row: Record<string, unknown>): boolean {
    return this.getCellValue(row, column).trim().length === 0;
  }

  runAction(column: ErpLineColumnConfig, row: Record<string, unknown>): void {
    if (!column.actionKey) {
      return;
    }

    this.action.emit({ actionKey: column.actionKey, row });
  }

  updateCellValue(column: ErpLineColumnConfig, row: Record<string, unknown>, value: string): void {
    const field = column.field ?? column.id;
    row[field] = value;
    this.rowChanged.emit({ row, column, value });
  }
}