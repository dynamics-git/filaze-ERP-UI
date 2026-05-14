import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { LineColumnConfig } from '../../models/line-config.model';

type LineOption = { label: string; value: unknown };

@Component({
  selector: 'erp-line-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-renderer.html',
  styleUrl: './line-renderer.scss'
})
export class LineRendererComponent {
  @Input() columns: LineColumnConfig[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  @Input() showSelection = false;
  @Input() enableColumnResize = true;
  @Input() enableBulkEditFromSelection = false;
  @Output() action = new EventEmitter<{ actionKey: string; row?: Record<string, unknown>; payload?: unknown }>();
  @Output() rowChanged = new EventEmitter<{
    row: Record<string, unknown>;
    column: LineColumnConfig;
    value: unknown;
    previousValue?: unknown;
    rowIndex?: number;
    bulkChanges?: Array<{ rowIndex: number; previousValue: unknown; value: unknown }>;
  }>();
  @Output() selectionChanged = new EventEmitter<{
    activeRow?: Record<string, unknown>;
    selectedRows: Record<string, unknown>[];
    selectedIndexes: number[];
  }>();

  activeRowIndex = -1;
  private readonly selectedRowIndexes = new Set<number>();
  private readonly columnWidths = new Map<string, number>();
  private resizing?: { columnId: string; startX: number; startWidth: number };
  private readonly minColumnWidth = 72;
  private rangeAnchorIndex = -1;

  ngOnChanges(changes: SimpleChanges): void {
    if ('columns' in changes) {
      this.loadPersistedColumnWidths();
    }

    if ('rows' in changes) {
      this.reconcileRows();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  handleDocumentMouseMove(event: MouseEvent): void {
    if (!this.resizing) {
      return;
    }

    const delta = event.clientX - this.resizing.startX;
    const nextWidth = Math.max(this.minColumnWidth, this.resizing.startWidth + delta);
    this.columnWidths.set(this.resizing.columnId, nextWidth);
  }

  @HostListener('document:mouseup')
  handleDocumentMouseUp(): void {
    if (!this.resizing) {
      return;
    }

    this.resizing = undefined;
    this.persistColumnWidths();
  }

  handleGridKeydown(event: KeyboardEvent): void {
    if (!this.rows.length || this.isInteractiveTarget(event.target)) {
      return;
    }

    if (event.ctrlKey && (event.key === 'a' || event.key === 'A')) {
      event.preventDefault();
      this.toggleAllRowsSelection(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = Math.min(this.activeRowIndex + 1, this.rows.length - 1);
      this.activateRow(nextIndex);
      if (event.shiftKey && this.showSelection) {
        this.selectRange(nextIndex);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = Math.max(this.activeRowIndex - 1, 0);
      this.activateRow(nextIndex);
      if (event.shiftKey && this.showSelection) {
        this.selectRange(nextIndex);
      }
      return;
    }

    if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      if (this.activeRowIndex >= 0) {
        this.toggleRowSelection(this.activeRowIndex, !this.isRowSelected(this.activeRowIndex));
      }
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      this.requestLineDelete();
    }
  }

  get allRowsSelected(): boolean {
    return this.rows.length > 0 && this.selectedRowIndexes.size === this.rows.length;
  }

  isRowSelected(rowIndex: number): boolean {
    return this.selectedRowIndexes.has(rowIndex);
  }

  isActiveRow(rowIndex: number): boolean {
    return this.activeRowIndex === rowIndex;
  }

  getColumnWidthStyle(column: LineColumnConfig): string | null {
    const resized = this.columnWidths.get(column.id);
    if (typeof resized === 'number') {
      return `${resized}px`;
    }

    return column.width ?? null;
  }

  activateRow(rowIndex: number): void {
    if (rowIndex < 0 || rowIndex >= this.rows.length) {
      return;
    }

    this.activeRowIndex = rowIndex;
    this.rangeAnchorIndex = rowIndex;
    this.emitSelectionChanged();
  }

  toggleRowSelection(rowIndex: number, checked: boolean): void {
    if (rowIndex < 0 || rowIndex >= this.rows.length) {
      return;
    }

    if (checked) {
      this.selectedRowIndexes.add(rowIndex);
      if (this.activeRowIndex < 0) {
        this.activeRowIndex = rowIndex;
      }
      this.rangeAnchorIndex = rowIndex;
    } else {
      this.selectedRowIndexes.delete(rowIndex);
    }

    this.emitSelectionChanged();
  }

  toggleAllRowsSelection(checked: boolean): void {
    this.selectedRowIndexes.clear();
    if (checked) {
      this.rows.forEach((_row, index) => this.selectedRowIndexes.add(index));
      if (this.activeRowIndex < 0 && this.rows.length) {
        this.activeRowIndex = 0;
      }
      this.rangeAnchorIndex = this.activeRowIndex;
    }

    this.emitSelectionChanged();
  }

  startResize(event: MouseEvent, column: LineColumnConfig, headerCell: HTMLElement): void {
    if (!this.enableColumnResize) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const currentWidth = this.columnWidths.get(column.id) ?? headerCell.getBoundingClientRect().width;
    this.resizing = {
      columnId: column.id,
      startX: event.clientX,
      startWidth: Math.max(this.minColumnWidth, currentWidth)
    };
  }

  getCellValue(row: Record<string, unknown>, column: LineColumnConfig): string {
    const value = row[column.field ?? column.id];
    return value === undefined || value === null ? '' : String(value);
  }

  getOptions(column: LineColumnConfig, row: Record<string, unknown>): LineOption[] {
    const rowOptionsKey = column.optionsDataKey ?? `__options_${column.field ?? column.id}`;
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

  isOptionSelected(column: LineColumnConfig, row: Record<string, unknown>, optionValue: unknown): boolean {
    return String(optionValue) === this.getCellValue(row, column);
  }

  showEmptyOption(column: LineColumnConfig, row: Record<string, unknown>): boolean {
    return this.getCellValue(row, column).trim().length === 0;
  }

  runAction(column: LineColumnConfig, row: Record<string, unknown>, rowIndex: number): void {
    if (!column.actionKey) {
      return;
    }

    this.action.emit({
      actionKey: column.actionKey,
      row,
      payload: {
        rowIndex
      }
    });
  }

  updateCellValue(column: LineColumnConfig, row: Record<string, unknown>, value: unknown): void {
    if (column.readonly) {
      return;
    }

    const field = column.field ?? column.id;
    const previousValue = row[field];
    const rowIndex = this.rows.indexOf(row);

    row[field] = value;

    const selectedIndexes = [...this.selectedRowIndexes].filter((index) => index >= 0 && index < this.rows.length);
    const applyBulk =
      this.enableBulkEditFromSelection
      && this.showSelection
      && selectedIndexes.length > 1
      && selectedIndexes.includes(rowIndex);

    if (applyBulk) {
      const bulkChanges: Array<{ rowIndex: number; previousValue: unknown; value: unknown }> = [];
      for (const index of selectedIndexes) {
        if (index === rowIndex) {
          continue;
        }

        const target = this.rows[index];
        if (!target) {
          continue;
        }

        bulkChanges.push({ rowIndex: index, previousValue: target[field], value });
        target[field] = value;
      }

      this.rowChanged.emit({ row, column, value, previousValue, rowIndex, bulkChanges });
      return;
    }

    this.rowChanged.emit({ row, column, value, previousValue, rowIndex });
  }

  resolveSelectValue(column: LineColumnConfig, row: Record<string, unknown>, rawValue: string): unknown {
    const options = this.getOptions(column, row);
    const matched = options.find((option) => String(option.value) === rawValue);
    if (matched) {
      return matched.value;
    }

    return this.coerceCellValue(column, rawValue);
  }

  coerceCellValue(column: LineColumnConfig, rawValue: string): unknown {
    if (column.valueType === 'number') {
      const normalized = rawValue.replace(/,/g, '').trim();
      if (!normalized.length) {
        return 0;
      }

      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : rawValue;
    }

    return rawValue;
  }

  private reconcileRows(): void {
    if (!this.rows.length) {
      this.activeRowIndex = -1;
      this.selectedRowIndexes.clear();
      this.emitSelectionChanged();
      return;
    }

    if (this.activeRowIndex < 0 || this.activeRowIndex >= this.rows.length) {
      this.activeRowIndex = 0;
    }

    const validIndexes = [...this.selectedRowIndexes].filter((index) => index >= 0 && index < this.rows.length);
    this.selectedRowIndexes.clear();
    validIndexes.forEach((index) => this.selectedRowIndexes.add(index));
    this.emitSelectionChanged();
  }

  private requestLineDelete(): void {
    if (this.activeRowIndex < 0 || !this.rows.length) {
      return;
    }

    const selectedIndexes = [...this.selectedRowIndexes].sort((a, b) => a - b);
    this.action.emit({
      actionKey: 'cmd:line-delete',
      row: this.rows[this.activeRowIndex],
      payload: {
        rowIndex: this.activeRowIndex,
        selectedIndexes
      }
    });
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return !!target.closest('input, select, textarea, button');
  }

  private getColumnSettingsStorageKey(): string {
    const path = typeof window !== 'undefined' ? window.location.pathname : 'workspace';
    const columnKey = this.columns.map((column) => column.id).join('|') || 'none';
    return `erp-line-widths:${path}:${columnKey}`;
  }

  private loadPersistedColumnWidths(): void {
    this.columnWidths.clear();
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(this.getColumnSettingsStorageKey());
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, number>;
      for (const [columnId, width] of Object.entries(parsed)) {
        if (Number.isFinite(width) && width > 0) {
          this.columnWidths.set(columnId, Math.max(this.minColumnWidth, width));
        }
      }
    } catch {
      // Ignore malformed local settings and fall back to config widths.
    }
  }

  private persistColumnWidths(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const payload: Record<string, number> = {};
      this.columnWidths.forEach((width, columnId) => {
        payload[columnId] = width;
      });
      window.localStorage.setItem(this.getColumnSettingsStorageKey(), JSON.stringify(payload));
    } catch {
      // Ignore storage errors so resizing still works in-memory.
    }
  }

  private emitSelectionChanged(): void {
    const selectedIndexes = [...this.selectedRowIndexes].sort((a, b) => a - b);
    this.selectionChanged.emit({
      activeRow: this.rows[this.activeRowIndex],
      selectedRows: selectedIndexes.map((index) => this.rows[index]).filter((row): row is Record<string, unknown> => !!row),
      selectedIndexes
    });
  }

  private selectRange(toIndex: number): void {
    if (toIndex < 0 || toIndex >= this.rows.length) {
      return;
    }

    const anchor = this.rangeAnchorIndex >= 0 ? this.rangeAnchorIndex : this.activeRowIndex;
    if (anchor < 0) {
      return;
    }

    const [start, end] = anchor <= toIndex ? [anchor, toIndex] : [toIndex, anchor];
    this.selectedRowIndexes.clear();
    for (let index = start; index <= end; index += 1) {
      this.selectedRowIndexes.add(index);
    }
    this.emitSelectionChanged();
  }
}
