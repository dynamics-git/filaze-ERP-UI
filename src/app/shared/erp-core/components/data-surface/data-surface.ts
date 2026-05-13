import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  DataSurfaceColumnConfig,
  DataSurfaceConfig
} from '../../models/data-surface-config.model';

type DataSurfaceHierarchyColumnConfig = DataSurfaceColumnConfig & {
  subtitleField?: string;
};

@Component({
  selector: 'erp-data-surface',
  standalone: true,
  templateUrl: './data-surface.html',
  styleUrl: './data-surface.scss'
})
export class DataSurfaceComponent {
  @Input() config?: DataSurfaceConfig;
  @Input() data: unknown[] = [];
  @Input() selectedRecord?: unknown;
  @Output() rowSelected = new EventEmitter<unknown>();
  @Output() primaryAction = new EventEmitter<unknown>();
  @Output() rowToggle = new EventEmitter<unknown>();

  get visibleColumns(): DataSurfaceColumnConfig[] {
    return this.config?.columns.filter((column) => !column.hidden) ?? [];
  }

  selectRow(row: unknown): void {
    this.rowSelected.emit(row);
  }

  openPrimary(row: unknown): void {
    this.primaryAction.emit(row);
  }

  toggleRow(row: unknown): void {
    this.rowToggle.emit(row);
  }

  isSelected(row: unknown): boolean {
    return row === this.selectedRecord;
  }

  getColumnValue(row: unknown, column: DataSurfaceColumnConfig): unknown {
    return this.readPath(row, column.field ?? column.id);
  }

  getColumnSubtitle(row: unknown, column: DataSurfaceColumnConfig): string {
    const subtitleField = (column as DataSurfaceHierarchyColumnConfig).subtitleField;

    if (!subtitleField) {
      return '';
    }

    const value = this.readPath(row, subtitleField);

    if (value === null || value === undefined || value === '') {
      return '';
    }

    return String(value);
  }

  hasSubtitle(row: unknown, column: DataSurfaceColumnConfig): boolean {
    return Boolean(this.getColumnSubtitle(row, column));
  }

  private readPath(row: unknown, path: string): unknown {
    if (!this.isRecord(row)) {
      return undefined;
    }

    return path.split('.').reduce<unknown>((value, key) => {
      if (!this.isRecord(value)) {
        return undefined;
      }

      return value[key];
    }, row);
  }

  formatValue(value: unknown, column: DataSurfaceColumnConfig): string {
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

  isNumericColumn(column: DataSurfaceColumnConfig): boolean {
    return column.type === 'number' || column.type === 'currency' || column.align === 'end';
  }

  isBadgeColumn(column: DataSurfaceColumnConfig): boolean {
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
