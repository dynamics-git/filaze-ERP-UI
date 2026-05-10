import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ErpDataSurfaceColumnConfig,
  ErpDataSurfaceConfig
} from '../../models/data-surface-config.model';

@Component({
  selector: 'erp-data-surface',
  standalone: true,
  templateUrl: './data-surface.html',
  styleUrl: './data-surface.scss'
})
export class ErpDataSurfaceComponent {
  @Input() config?: ErpDataSurfaceConfig;
  @Input() data: unknown[] = [];
  @Output() rowSelected = new EventEmitter<unknown>();

  get visibleColumns(): ErpDataSurfaceColumnConfig[] {
    return this.config?.columns.filter((column) => !column.hidden) ?? [];
  }

  selectRow(row: unknown): void {
    this.rowSelected.emit(row);
  }

  selectCheckbox(row: unknown, event: Event): void {
    event.stopPropagation();
    this.rowSelected.emit(row);
  }

  getColumnValue(row: unknown, column: ErpDataSurfaceColumnConfig): unknown {
    if (!this.isRecord(row)) {
      return undefined;
    }

    const path = column.field ?? column.id;

    return path.split('.').reduce<unknown>((value, key) => {
      if (!this.isRecord(value)) {
        return undefined;
      }

      return value[key];
    }, row);
  }

  formatValue(value: unknown, column: ErpDataSurfaceColumnConfig): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (column.type) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'currency':
        return this.formatCurrency(value, column.currencyCode);
      case 'date':
        return this.formatDate(value);
      case 'number':
        return this.formatNumber(value);
      default:
        return String(value);
    }
  }

  isNumericColumn(column: ErpDataSurfaceColumnConfig): boolean {
    return column.type === 'number' || column.type === 'currency' || column.align === 'end';
  }

  isBadgeColumn(column: ErpDataSurfaceColumnConfig): boolean {
    return column.type === 'badge';
  }

  private formatCurrency(value: unknown, currencyCode = 'MYR'): string {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
      return String(value);
    }

    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  }

  private formatDate(value: unknown): string {
    const date = value instanceof Date ? value : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }).format(date);
  }

  private formatNumber(value: unknown): string {
    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return String(value);
    }

    return new Intl.NumberFormat().format(numberValue);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
