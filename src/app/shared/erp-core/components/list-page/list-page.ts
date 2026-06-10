import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { StandardCommandConfig } from '../../models/command-config.model';
import { ListPageColumnConfig, ListPageConfig } from '../../models/page-config.model';
import { CommandBarComponent } from '../command-bar/command-bar';
import { ListFactPanelComponent } from '../list-fact-panel/list-fact-panel';

type DisplayColumn = ListPageColumnConfig & {
  primary?: boolean;
  sortable?: boolean;
  filterable?: boolean;
};

type SortDirection = 'asc' | 'desc';

type ActiveSort = {
  field: string;
  direction: SortDirection;
};

type ActiveResize = {
  field: string;
  startX: number;
  startWidth: number;
};

type ListDensity = 'compact' | 'comfortable' | 'spacious';

@Component({
  selector: 'app-list-page',
  standalone: true,
  imports: [CommandBarComponent, ListFactPanelComponent],
  templateUrl: './list-page.html',
  styleUrl: './list-page.scss',
})
export class ListPageComponent implements AfterViewChecked, OnChanges, OnDestroy {
  @ViewChild('gridScroll') private readonly gridScroll?: ElementRef<HTMLElement>;

  @Input() config?: ListPageConfig;
  @Input() data: unknown[] = [];
  @Input() hasMore = false;
  @Input() loading = false;
  @Input() errorMessage?: string;
  @Input() selectedRecord?: unknown;
  @Input() showCommandBar = false;
  @Output() loadMore = new EventEmitter<void>();
  @Output() rowSelected = new EventEmitter<unknown>();
  @Output() primaryAction = new EventEmitter<unknown>();
  @Output() selectionChanged = new EventEmitter<unknown>();
  @Output() checkedKeysChanged = new EventEmitter<string[]>();
  @Output() errorDismissed = new EventEmitter<void>();
  @Output() command = new EventEmitter<{ actionKey: string; payload?: unknown }>();

  selectedNos = new Set<string>();
  searchText = '';
  density: ListDensity = 'compact';
  factboxOpen = true;
  private activeViewId?: string;
  private autoLoadCheckQueued = false;
  private dismissTimer?: ReturnType<typeof setTimeout>;
  private activeSort?: ActiveSort;
  private activeResize?: ActiveResize;
  private readonly resizedColumnWidths = new Map<string, number>();

  ngOnChanges(changes: SimpleChanges): void {
    if (!('errorMessage' in changes)) {
      return;
    }

    this.resetErrorDismissTimer();
  }

  ngOnDestroy(): void {
    this.clearErrorDismissTimer();
  }

  get usesConfiguredData(): boolean {
    return Boolean(this.config?.dataSurface);
  }

  get rows(): unknown[] {
    if (!this.activeSort) {
      return this.data;
    }

    const direction = this.activeSort.direction === 'asc' ? 1 : -1;
    const field = this.activeSort.field;

    return [...this.data].sort((left, right) => {
      const result = this.compareValues(this.read(left, field), this.read(right, field));
      return result * direction;
    });
  }

  get isInitialLoading(): boolean {
    return this.loading && this.rows.length === 0;
  }

  get isLoadingMore(): boolean {
    return this.loading && this.rows.length > 0;
  }

  get columns(): DisplayColumn[] {
    return (this.config?.dataSurface?.columns ?? []).filter((column) => column.hidden !== true);
  }

  get gridMinWidth(): string {
    const rowControlWidth = 68;
    const visibleColumnWidth = this.columns.reduce(
      (total, column) => total + this.parseColumnWidth(this.getColumnWidth(column)),
      0,
    );
    return `${Math.max(1180, rowControlWidth + visibleColumnWidth)}px`;
  }

  get selectedRow(): unknown {
    return this.selectedRecord ?? this.rows[0];
  }

  get selectedCount(): number {
    return this.selectedNos.size;
  }

  get selectableRows(): unknown[] {
    return this.rows.filter((row) => this.getRowKey(row).length > 0);
  }

  get isMultiSelect(): boolean {
    return this.config?.dataSurface?.multiSelect !== false;
  }

  get normalizedErrorMessage(): string {
    return (this.errorMessage ?? '').trim();
  }

  dismissError(): void {
    this.clearErrorDismissTimer();
    this.errorDismissed.emit();
  }

  get isAllRowsSelected(): boolean {
    const selectableCount = this.selectableRows.length;
    return selectableCount > 0 && this.selectedNos.size === selectableCount;
  }

  get isSelectionPartial(): boolean {
    const selectableCount = this.selectableRows.length;
    return this.selectedNos.size > 0 && this.selectedNos.size < selectableCount;
  }

  get views(): Array<{ id: string; label: string; filter?: string }> {
    return this.config?.views ?? [];
  }

  get searchPlaceholder(): string {
    return this.config?.searchPlaceholder ?? '';
  }

  get isBasicFilterEnabled(): boolean {
    return this.config?.tools?.filter !== false;
  }

  get resolvedStandardActions(): StandardCommandConfig {
    return {
      new: this.config?.standardActions?.new ?? (this.config?.dataSource?.supportsCreate !== false),
      delete: this.config?.standardActions?.delete ?? (this.config?.dataSource?.supportsDelete !== false),
      refresh: this.config?.standardActions?.refresh ?? (this.config?.tools?.refresh !== false),
    };
  }

  get densityLabel(): string {
    switch (this.density) {
      case 'compact':
        return 'Compact';
      case 'spacious':
        return 'Spacious';
      default:
        return 'Comfortable';
    }
  }

  cycleDensity(): void {
    if (this.density === 'comfortable') {
      this.density = 'compact';
      return;
    }

    if (this.density === 'compact') {
      this.density = 'spacious';
      return;
    }

    this.density = 'comfortable';
  }

  toggleFactbox(): void {
    this.factboxOpen = !this.factboxOpen;
  }

  isViewActive(viewId: string): boolean {
    const currentView = this.activeViewId ?? this.config?.activeViewId;
    return currentView === viewId;
  }

  setActiveView(viewId: string): void {
    this.activeViewId = viewId;
    const viewFilter = this.views.find((view) => view.id === viewId)?.filter;
    if (this.isBasicFilterEnabled) {
      this.command.emit({ actionKey: 'viewChanged', payload: { viewId, viewFilter } });
      this.emitFilterChanged();
    }
  }

  handleSearchInput(event: Event): void {
    if (!this.isBasicFilterEnabled) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.searchText = target.value;
    this.emitFilterChanged();
  }

  clearSelection(): void {
    this.selectedNos.clear();
    this.emitCheckedKeysChanged();
  }

  toggleAllRows(event: Event): void {
    event.stopPropagation();

    if (!this.isMultiSelect) {
      return;
    }

    if (this.isAllRowsSelected) {
      this.selectedNos.clear();
      this.emitCheckedKeysChanged();
      return;
    }

    this.selectedNos = new Set(this.selectableRows.map((row) => this.getRowKey(row)));
    this.emitCheckedKeysChanged();
  }

  getRowKey(row: unknown): string {
    const keyField = this.config?.dataSurface?.idField;

    if (keyField) {
      return String(this.read(row, keyField) ?? '');
    }

    const configuredFallback = this.config?.behavior?.keyFallbackFields ?? [];
    const fallback = configuredFallback.length
      ? configuredFallback
      : ['systemId', 'SystemId', 'id', 'Id', 'code', 'Code', 'number', 'Number', 'no', 'No'];

    return String(this.readFirst(row, fallback) ?? '');
  }

  getSelectedRowKey(): string {
    return this.getRowKey(this.selectedRow);
  }

  getRowType(row: unknown): string {
    const behavior = this.config?.behavior;

    const candidates: string[] = [];
    if (behavior?.typeField) {
      candidates.push(behavior.typeField);
    }

    if (Array.isArray(behavior?.typeFallbackFields) && behavior.typeFallbackFields.length) {
      candidates.push(...behavior.typeFallbackFields);
    }

    return String(this.readFirst(row, candidates) ?? behavior?.typeDefault ?? '');
  }

  getStatus(row: unknown): string {
    const behavior = this.config?.behavior;

    const candidates: string[] = [];
    if (behavior?.statusField) {
      candidates.push(behavior.statusField);
    }

    if (Array.isArray(behavior?.statusFallbackFields) && behavior.statusFallbackFields.length) {
      candidates.push(...behavior.statusFallbackFields);
    }

    return String(this.readFirst(row, candidates) ?? behavior?.statusDefault ?? '');
  }

  getTone(row: unknown): string {
    const behavior = this.config?.behavior;

    const candidates: string[] = [];
    if (behavior?.toneField) {
      candidates.push(behavior.toneField);
    }

    if (Array.isArray(behavior?.toneFallbackFields) && behavior.toneFallbackFields.length) {
      candidates.push(...behavior.toneFallbackFields);
    }

    return String(this.readFirst(row, candidates) ?? behavior?.toneDefault ?? '');
  }

  getRowIcon(row: unknown): string {
    const type = this.getRowType(row);
    const configured = this.config?.behavior?.iconByType?.[type];
    if (configured) {
      return configured;
    }

    if (this.config?.behavior?.defaultIcon) {
      return this.config.behavior.defaultIcon;
    }

    return 'bi bi-chevron-right';
  }

  isRowChecked(row: unknown): boolean {
    return this.selectedNos.has(this.getRowKey(row));
  }

  toggleRow(row: unknown, event: Event): void {
    event.stopPropagation();
    const key = this.getRowKey(row);

    if (!key) {
      return;
    }

    const alreadySelected = this.selectedNos.has(key);

    if (this.isMultiSelect && alreadySelected) {
      this.selectedNos.delete(key);
    } else {
      if (!this.isMultiSelect) {
        this.selectedNos.clear();
      }

      this.selectedNos.add(key);
    }

    this.selectedRecord = row;
    this.selectionChanged.emit(row);
    this.emitCheckedKeysChanged();
  }

  private emitCheckedKeysChanged(): void {
    this.checkedKeysChanged.emit(Array.from(this.selectedNos));
  }

  private resetErrorDismissTimer(): void {
    this.clearErrorDismissTimer();
    if (!this.normalizedErrorMessage) {
      return;
    }

    this.dismissTimer = setTimeout(() => {
      this.dismissError();
    }, 8000);
  }

  private clearErrorDismissTimer(): void {
    if (!this.dismissTimer) {
      return;
    }

    clearTimeout(this.dismissTimer);
    this.dismissTimer = undefined;
  }

  selectRow(row: unknown): void {
    this.selectedRecord = row;
    this.selectionChanged.emit(row);
  }

  openRow(row: unknown, event?: Event): void {
    event?.stopPropagation();
    this.selectRow(row);
    this.rowSelected.emit(row);
  }

  openPrimary(row: unknown, event: Event): void {
    event.stopPropagation();
    this.selectRow(row);
    this.primaryAction.emit(row);
  }

  isPrimaryColumn(column: DisplayColumn): boolean {
    return Boolean(column.primary || column.isPrimary);
  }

  getColumnWidth(column: DisplayColumn): string {
    const field = this.getColumnKey(column);
    const resizedWidth = this.resizedColumnWidths.get(field);
    if (resizedWidth) {
      return `${resizedWidth}px`;
    }

    const configuredWidth = String(column.width ?? '').trim();
    if (configuredWidth.length) {
      return configuredWidth;
    }

    if (this.isPrimaryColumn(column)) {
      return '72px';
    }

    if (column.subtitleField) {
      return '220px';
    }

    if (column.type === 'date') {
      return '118px';
    }

    if (column.type === 'currency' || column.type === 'number') {
      return '126px';
    }

    if (column.type === 'boolean') {
      return '104px';
    }

    if (column.type === 'badge') {
      return '112px';
    }

    return '124px';
  }

  getColumnSortDirection(column: DisplayColumn): SortDirection | undefined {
    const field = this.getColumnKey(column);
    return this.activeSort?.field === field ? this.activeSort.direction : undefined;
  }

  toggleSort(column: DisplayColumn): void {
    const field = this.getColumnKey(column);
    if (!field.length) {
      return;
    }

    if (this.activeSort?.field !== field) {
      this.activeSort = { field, direction: 'asc' };
      return;
    }

    this.activeSort = {
      field,
      direction: this.activeSort.direction === 'asc' ? 'desc' : 'asc',
    };
  }

  startColumnResize(event: PointerEvent, column: DisplayColumn): void {
    event.preventDefault();
    event.stopPropagation();

    const field = this.getColumnKey(column);
    if (!field.length) {
      return;
    }

    this.activeResize = {
      field,
      startX: event.clientX,
      startWidth: this.parseColumnWidth(this.getColumnWidth(column)),
    };
  }

  @HostListener('window:pointermove', ['$event'])
  handleColumnResizeMove(event: PointerEvent): void {
    if (!this.activeResize) {
      return;
    }

    const nextWidth = Math.max(72, this.activeResize.startWidth + event.clientX - this.activeResize.startX);
    this.resizedColumnWidths.set(this.activeResize.field, Math.round(nextWidth));
  }

  @HostListener('window:pointerup')
  stopColumnResize(): void {
    this.activeResize = undefined;
  }

  private parseColumnWidth(width: string): number {
    const numeric = Number.parseFloat(width);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 124;
  }

  private getColumnKey(column: DisplayColumn): string {
    return String(column.field ?? column.id ?? column.label ?? '').trim();
  }

  private compareValues(left: unknown, right: unknown): number {
    const leftEmpty = left === undefined || left === null || left === '';
    const rightEmpty = right === undefined || right === null || right === '';

    if (leftEmpty && rightEmpty) {
      return 0;
    }

    if (leftEmpty) {
      return 1;
    }

    if (rightEmpty) {
      return -1;
    }

    const leftNumber = typeof left === 'number' ? left : Number(String(left).replace(/,/g, ''));
    const rightNumber = typeof right === 'number' ? right : Number(String(right).replace(/,/g, ''));
    if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
      return leftNumber - rightNumber;
    }

    const leftDate = typeof left === 'string' ? Date.parse(left) : Number.NaN;
    const rightDate = typeof right === 'string' ? Date.parse(right) : Number.NaN;
    if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
      return leftDate - rightDate;
    }

    return String(left).localeCompare(String(right), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  ngAfterViewChecked(): void {
    if (!this.usesConfiguredData || this.loading || !this.hasMore || this.autoLoadCheckQueued) {
      return;
    }

    this.autoLoadCheckQueued = true;
    queueMicrotask(() => {
      this.autoLoadCheckQueued = false;
      this.requestMoreIfGridNeedsRows();
    });
  }

  onGridScroll(event: Event): void {
    if (!this.usesConfiguredData || this.loading || !this.hasMore) {
      return;
    }

    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (distanceFromBottom <= 160) {
      this.loadMore.emit();
    }
  }

  private requestMoreIfGridNeedsRows(): void {
    if (!this.usesConfiguredData || this.loading || !this.hasMore) {
      return;
    }

    const element = this.gridScroll?.nativeElement;

    if (!element) {
      return;
    }

    if (element.scrollHeight <= element.clientHeight + 80) {
      this.loadMore.emit();
    }
  }

  private emitFilterChanged(): void {
    if (!this.isBasicFilterEnabled) {
      return;
    }

    const viewId = this.activeViewId ?? this.config?.activeViewId ?? '';
    const viewFilter = this.views.find((view) => view.id === viewId)?.filter;
    this.command.emit({
      actionKey: 'filterChanged',
      payload: {
        viewId,
        viewFilter,
        searchText: this.searchText,
      },
    });
  }

  getCellValue(row: unknown, column: DisplayColumn): string {
    const value = this.read(row, column.field ?? column.id ?? '');

    if (this.usesConfiguredData && (value === undefined || value === null || value === '')) {
      return '';
    }

    return this.formatValue(value, column);
  }

  getSubtitle(row: unknown, column: DisplayColumn): string {
    const value = this.read(row, column.subtitleField ?? '');
    return value === undefined || value === null ? '' : String(value);
  }

  private formatValue(
    value: unknown,
    column: { type?: string; id?: string; label?: string; currencyCode?: string },
  ): string {
    if (value === undefined || value === null || value === '') {
      return '';
    }

    if (column.type === 'date' && typeof value === 'string') {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }).format(date);
      }
    }

    if (column.type === 'currency' && typeof value === 'number') {
      if (column.currencyCode) {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: column.currencyCode,
          currencyDisplay: 'code',
        }).format(value);
      }

      return new Intl.NumberFormat(undefined).format(value);
    }

    return String(value);
  }

  private read(row: unknown, field: string): unknown {
    if (!field || typeof row !== 'object' || row === null) {
      return undefined;
    }

    return (row as Record<string, unknown>)[field];
  }

  private readFirst(row: unknown, fields: string[]): unknown {
    for (const field of fields) {
      const value = this.read(row, field);
      if (value !== undefined && value !== null && String(value).length > 0) {
        return value;
      }
    }

    return undefined;
  }
}
