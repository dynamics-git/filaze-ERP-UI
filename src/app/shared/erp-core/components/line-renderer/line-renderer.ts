import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ErpLineColumnConfig } from '../../models/line-config.model';

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

  getCellValue(row: Record<string, unknown>, column: ErpLineColumnConfig): string {
    const value = row[column.field ?? column.id];
    return value === undefined || value === null ? '' : String(value);
  }

  getOptions(column: ErpLineColumnConfig, row: Record<string, unknown>): Array<{ label: string; value: unknown }> {
    if (column.options?.length) {
      return column.options;
    }

    const value = this.getCellValue(row, column);
    return value ? [{ label: value, value }] : [{ label: '', value: '' }];
  }

  isOptionSelected(column: ErpLineColumnConfig, row: Record<string, unknown>, optionValue: unknown): boolean {
    return String(optionValue) === this.getCellValue(row, column);
  }

  runAction(column: ErpLineColumnConfig, row: Record<string, unknown>): void {
    if (!column.actionKey) {
      return;
    }

    this.action.emit({ actionKey: column.actionKey, row });
  }
}