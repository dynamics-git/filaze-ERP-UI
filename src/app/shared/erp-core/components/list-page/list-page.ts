import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

export type ErpListPageColumnConfig = {
  id: string;
  label: string;
  field?: string;
  type?: string;
  align?: 'start' | 'center' | 'end';
  isPrimary?: boolean;
  subtitleField?: string;
  width?: string;
};

export type ErpListPageConfig = {
  id?: string;
  title?: string;
  subtitle?: string;
  pageType?: string;
  module?: string;
  company?: string;
  viewSuffix?: string;
  views?: Array<{ id: string; label: string }>;
  activeViewId?: string;
  tools?: unknown;
  standardActions?: unknown;
  commands?: unknown[];
  dataSurface?: {
    idField?: string;
    columns?: ErpListPageColumnConfig[];
  };
  factbox?: {
    label?: string;
    title?: string;
    subtitle?: string;
    sections?: Array<{
      id?: string;
      title: string;
      fields?: Array<{
        id?: string;
        label: string;
        field?: string;
      }>;
    }>;
  };
} & Record<string, unknown>;

type DisplayColumn = ErpListPageColumnConfig & {
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
export class ErpListPageComponent implements AfterViewChecked {
  @ViewChild('gridScroll') private readonly gridScroll?: ElementRef<HTMLElement>;

  @Input() config?: ErpListPageConfig;
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
  private activeViewId?: string;
  private autoLoadCheckQueued = false;

  readonly defaultColumns: DisplayColumn[] = [
    { id: 'Number', label: 'No.', field: 'Number', type: 'text', primary: true, isPrimary: true },
    { id: 'Description', label: 'Description', field: 'Description', type: 'text', sortable: true },
    { id: 'Status', label: 'Status', field: 'Status', type: 'badge' },
    { id: 'AmountIncludingVAT', label: 'Amount', field: 'AmountIncludingVAT', type: 'currency', align: 'end', sortable: true }
  ];

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
    return this.config?.dataSurface?.columns?.length ? this.config.dataSurface.columns : this.defaultColumns;
  }

  get selectedRow(): unknown {
    return this.selectedRecord ?? this.rows[0];
  }

  get selectedCount(): number {
    return this.selectedNos.size;
  }

  get views(): Array<{ id: string; label: string }> {
    return this.config?.views ?? [];
  }

  isViewActive(viewId: string): boolean {
    const currentView = this.activeViewId ?? this.config?.activeViewId;
    return currentView === viewId;
  }

  setActiveView(viewId: string): void {
    this.activeViewId = viewId;
    this.command.emit({ actionKey: 'viewChanged', payload: { viewId } });
  }

  clearSelection(): void {
    this.selectedNos.clear();
  }

  getRowKey(row: unknown): string {
    const keyField = this.config?.dataSurface?.idField;

    if (keyField) {
      return String(this.read(row, keyField) ?? '');
    }

    return String(this.read(row, 'no') ?? this.read(row, 'Number') ?? this.read(row, 'No') ?? this.read(row, 'Id') ?? '');
  }

  getSelectedRowKey(): string {
    return this.getRowKey(this.selectedRow);
  }

  getRowType(row: unknown): string {
    return String(this.read(row, 'accountType') ?? this.read(row, 'Type') ?? 'Posting');
  }

  getStatus(row: unknown): string {
    return String(this.read(row, 'status') ?? this.read(row, 'Status') ?? '-');
  }

  getTone(row: unknown): string {
    return String(this.read(row, 'tone') ?? 'positive');
  }

  getRowIcon(row: unknown): string {
    return this.getRowType(row) === 'Heading' ? 'bi bi-chevron-down' : 'bi bi-chevron-right';
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
    return this.config?.factbox?.subtitle ?? this.config?.factbox?.label ?? 'Details';
  }

  getFactboxTitle(): string {
    return String(
      this.read(this.selectedRow, 'name') ??
      this.config?.factbox?.title ??
      this.read(this.selectedRow, 'BuyFromVendorName') ??
      'Details'
    );
  }

  getFactboxSubtitle(): string {
    return this.config?.factbox?.subtitle ?? '';
  }

  getFactboxSummaryValue(): string {
    return this.formatValue(
      this.read(this.selectedRow, 'balance') ?? this.read(this.selectedRow, 'AmountIncludingVAT') ?? '-',
      { id: 'summary', label: 'Summary', type: 'currency' }
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

    return '-';
  }

  private formatValue(value: unknown, column: { type?: string } & Record<string, unknown>): string {
    if (value === undefined || value === null || value === '') {
      return '-';
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
      return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR',
        currencyDisplay: 'code'
      }).format(value);
    }

    return String(value);
  }

  private read(row: unknown, field: string): unknown {
    if (!field || typeof row !== 'object' || row === null) {
      return undefined;
    }

    return (row as Record<string, unknown>)[field];
  }
}
