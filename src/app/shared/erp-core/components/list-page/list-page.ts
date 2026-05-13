import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ListPageColumnConfig, ListPageConfig } from '../../models/page-config.model';

type DisplayColumn = ListPageColumnConfig & {
  primary?: boolean;
  sortable?: boolean;
  filterable?: boolean;
};

@Component({
  selector: 'erp-list-page',
  standalone: true,
  imports: [],
  templateUrl: './list-page.html',
  styleUrl: './list-page.scss'
})
export class ListPageComponent implements AfterViewChecked {
  @ViewChild('gridScroll') private readonly gridScroll?: ElementRef<HTMLElement>;

  @Input() config?: ListPageConfig;
  @Input() data: unknown[] = [];
  @Input() hasMore = false;
  @Input() loading = false;
  @Input() selectedRecord?: unknown;
  @Output() loadMore = new EventEmitter<void>();
  @Output() rowSelected = new EventEmitter<unknown>();
  @Output() primaryAction = new EventEmitter<unknown>();
  @Output() selectionChanged = new EventEmitter<unknown>();
  @Output() command = new EventEmitter<{ actionKey: string; payload?: unknown }>();

  selectedNos = new Set<string>();
  searchText = '';
  private activeViewId?: string;
  private autoLoadCheckQueued = false;

  get usesConfiguredData(): boolean {
    return Boolean(this.config?.dataSurface);
  }

  get rows(): unknown[] {
    return this.data;
  }

  get isInitialLoading(): boolean {
    return this.loading && this.rows.length === 0;
  }

  get isLoadingMore(): boolean {
    return this.loading && this.rows.length > 0;
  }

  get columns(): DisplayColumn[] {
    return this.config?.dataSurface?.columns ?? [];
  }

  get selectedRow(): unknown {
    return this.selectedRecord ?? this.rows[0];
  }

  get selectedCount(): number {
    return this.selectedNos.size;
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
  }

  getRowKey(row: unknown): string {
    const keyField = this.config?.dataSurface?.idField;

    if (keyField) {
      return String(this.read(row, keyField) ?? '');
    }

    const configuredFallback = this.config?.behavior?.keyFallbackFields ?? [];
    const fallback = configuredFallback.length
      ? configuredFallback
      : ['id', 'code', 'number', 'no', 'systemId', 'Id', 'Code', 'Number', 'No', 'SystemId'];

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

    return '';
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

    if (this.selectedNos.has(key)) {
      this.selectedNos.delete(key);
    } else {
      this.selectedNos.add(key);
    }

    this.selectRow(row);
  }

  selectRow(row: unknown): void {
    this.selectedRecord = row;
    this.selectionChanged.emit(row);
    this.rowSelected.emit(row);
  }

  openPrimary(row: unknown, event: Event): void {
    event.stopPropagation();
    this.selectRow(row);
    this.primaryAction.emit(row);
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
        searchText: this.searchText
      }
    });
  }

  getCellValue(row: unknown, column: DisplayColumn): string {
    const value = this.read(row, column.field ?? column.id);

    if (this.usesConfiguredData && (value === undefined || value === null || value === '')) {
      return '';
    }

    return this.formatValue(value, column);
  }

  getSubtitle(row: unknown, column: DisplayColumn): string {
    const value = this.read(row, column.subtitleField ?? '');
    return value === undefined || value === null ? '' : String(value);
  }

  getFactboxLabel(): string {
    return this.config?.factbox?.subtitle ?? this.config?.factbox?.label ?? '';
  }

  getFactboxTitle(): string {
    const titleField = this.config?.factbox?.binding?.titleField;
    const fallbackFields = this.config?.factbox?.binding?.titleFallbackFields?.length
      ? this.config.factbox.binding.titleFallbackFields
      : [];

    return String(
      (titleField ? this.read(this.selectedRow, titleField) : undefined) ??
      this.readFirst(this.selectedRow, fallbackFields) ??
      this.config?.factbox?.title ??
      ''
    );
  }

  getFactboxSubtitle(): string {
    return this.config?.factbox?.subtitle ?? '';
  }

  getFactboxSummaryValue(): string {
    const summaryField = this.config?.factbox?.binding?.summaryField;
    const fallbackFields = this.config?.factbox?.binding?.summaryFallbackFields?.length
      ? this.config.factbox.binding.summaryFallbackFields
      : [];

    const summaryValue = (summaryField ? this.read(this.selectedRow, summaryField) : undefined)
      ?? this.readFirst(this.selectedRow, fallbackFields)
      ?? '';

    return this.formatValue(
      summaryValue,
      { id: 'summary', label: 'Summary', type: this.config?.factbox?.binding?.summaryType }
    );
  }

  getFactboxSections(): Array<{ title: string; fields: Array<{ label: string; field?: string }> }> {
    if (this.config?.factbox?.sections?.length) {
      return this.config.factbox.sections.map((section) => ({
        title: section.title,
        fields: section.fields ?? []
      }));
    }

    return [];
  }

  getFactboxFieldValue(field: { label: string; field?: string }): string {
    if (field.field) {
      return this.formatValue(this.read(this.selectedRow, field.field), { id: field.field, label: field.label });
    }

    return '';
  }

  private formatValue(value: unknown, column: { type?: string; id?: string; label?: string; currencyCode?: string }): string {
    if (value === undefined || value === null || value === '') {
      return '';
    }

    if (column.type === 'date' && typeof value === 'string') {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }).format(date);
      }
    }

    if (column.type === 'currency' && typeof value === 'number') {
      if (column.currencyCode) {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: column.currencyCode,
          currencyDisplay: 'code'
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
