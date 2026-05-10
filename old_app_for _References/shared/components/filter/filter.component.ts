import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { RestService } from '../../../core/services/rest.service';
import { TableField } from '../../../core/models/shared/list-table.config';



interface ActiveFilter {
  id: string;
  field: string;
  value: any;
}

interface SavedFilterBookmark {
  name: string;
  filters: { field: string; value: any }[];
  savedAt: number;
}

@Component({
  standalone: false,
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent implements OnInit {
  @Input() filterOptions: TableField[] = [];
  @Input() showCloseButton = false;
  /** Unique key for localStorage — pass e.g. the page title or config key. */
  @Input() filterStorageKey = '';

  @ViewChild('filterBody', { read: ElementRef }) private filterBodyEl?: ElementRef<HTMLDivElement>;

  @Output() filterChange = new EventEmitter<any>();
  @Output() closeFilter = new EventEmitter<void>();

  activeFilters: ActiveFilter[] = [];
  isShowClearAll = false;
  maxFilters = 20;
  private filterIdCounter = 0;

  // ── Bookmarks ───────────────────────────────────────────────────────────────
  savedBookmarks: SavedFilterBookmark[] = [];
  showSaveInput = false;
  newBookmarkName = '';
  showBookmarksSection = true;
  private get storageKey(): string {
    return `procure360_filter_${this.filterStorageKey || 'default'}`;
  }

  /** Per-filter-id dropdown items for typeahead/apiUrl fields */
  dropdownItems: Record<string, any[]> = {};
  dropdownLoading: Record<string, boolean> = {};
  private debounceTimers: Record<string, any> = {};
  private dropdownSkip: Record<string, number> = {};
  private dropdownHasMore: Record<string, boolean> = {};
  private dropdownSearchTerm: Record<string, string> = {};
  /** Field-level cache: fieldName → items (avoids re-fetching same field) */
  private fieldCache: Record<string, any[]> = {};
  private readonly PAGE_SIZE = 20;

  constructor(private restService: RestService) { }

  ngOnInit() {
    this.loadBookmarks();
    this.ensureOneEmptyRow();
    this.syncClearAllState();
  }

  get validFilterCount(): number {
    return this.activeFilters.filter(
      f => !!f.field && f.value !== '' && f.value !== null && f.value !== undefined
    ).length;
  }

  get canAddMoreFilters(): boolean {
    return this.activeFilters.length < this.maxFilters;
  }

  private getFieldConfig(fieldName: string): TableField | undefined {
    return this.filterOptions.find((o) => o.field === fieldName);
  }

  private ensureOneEmptyRow(): void {
    const hasEmptyRow = this.activeFilters.some(f => !f.field);

    if (this.activeFilters.length === 0 || (!hasEmptyRow && this.activeFilters.length < this.maxFilters)) {
      this.activeFilters.push(this.createEmptyFilter());
    }
  }

  private createEmptyFilter(): ActiveFilter {
    return {
      id: `filter-${++this.filterIdCounter}`,
      field: '',
      value: ''
    };
  }

  private syncClearAllState(): void {
    this.isShowClearAll = this.validFilterCount > 0;
  }

  /** Returns items for a given filter row's ng-select (typeahead or static). */
  getDropdownItems(filterId: string, fieldName: string): any[] {
    const config = this.getFieldConfig(fieldName);
    if (config?.apiUrl) {
      return this.dropdownItems[filterId] || [];
    }
    return config?.options || [];
  }

  /** True when a typeahead search is in flight for this filter row. */
  isDropdownLoading(filterId: string): boolean {
    return !!this.dropdownLoading[filterId];
  }

  /** Called by ng-select when the user types in a dropdown filter — resets and searches. */
  onDropdownSearch(index: number, term: string): void {
    const filter = this.activeFilters[index];
    if (!filter) return;
    const config = this.getFieldConfig(filter.field);
    if (!config?.apiUrl) return;

    const filterId = filter.id;
    clearTimeout(this.debounceTimers[filterId]);
    this.debounceTimers[filterId] = setTimeout(() => {
      // Reset pagination and fetch fresh results for the new term
      this.dropdownSkip[filterId] = 0;
      this.dropdownSearchTerm[filterId] = term ?? '';
      this.dropdownItems[filterId] = [];
      this.fetchDropdownPage(filterId, config, term ?? '', false);
    }, 300);
  }

  /** Called when ng-select scrolls to the bottom — load next page. */
  onDropdownScrollToEnd(index: number): void {
    const filter = this.activeFilters[index];
    if (!filter) return;
    if (this.dropdownLoading[filter.id]) return;
    if (this.dropdownHasMore[filter.id] === false) return;
    const config = this.getFieldConfig(filter.field);
    if (!config?.apiUrl) return;
    const term = this.dropdownSearchTerm[filter.id] ?? '';
    this.fetchDropdownPage(filter.id, config, term, true);
  }

  private fetchDropdownPage(filterId: string, config: TableField, term: string, append: boolean): void {
    const skip = this.dropdownSkip[filterId] || 0;
    this.dropdownLoading[filterId] = true;
    const labelField = config.labelField || '';
    const base = config.apiUrl!;
    const filterClause = term && labelField
      ? `?$filter=contains(${labelField},'${term.replace(/'/g, "''")}')&$top=${this.PAGE_SIZE}&$skip=${skip}`
      : `?$top=${this.PAGE_SIZE}&$skip=${skip}`;

    this.restService.get(`${base}${filterClause}`).subscribe({
      next: (data: any) => {
        const vf = config.valueField || '';
        const raw: any[] = Array.isArray(data) ? data : (data?.value || []);
        const mapped = raw.map((item: any) => ({
          value: item[vf],
          label: this.resolveLabel(item, config)
        }));
        this.dropdownItems[filterId] = append
          ? [...(this.dropdownItems[filterId] || []), ...mapped]
          : mapped;
        // Cache the full first-page result (no search term) at field level
        if (!append && !term) {
          this.fieldCache[config.field] = this.dropdownItems[filterId];
        }
        this.dropdownSkip[filterId] = skip + raw.length;
        // If fewer than PAGE_SIZE returned, no more pages
        this.dropdownHasMore[filterId] = raw.length >= this.PAGE_SIZE;
        this.dropdownLoading[filterId] = false;
      },
      error: () => { this.dropdownLoading[filterId] = false; }
    });
  }

  private resolveLabel(item: any, config: TableField): string {
    const lf = config.labelField || config.valueField || '';
    return item[lf] ?? '';
  }

  /** Called when ng-select opens — load first page if not yet loaded. */
  onDropdownOpen(index: number): void {
    const filter = this.activeFilters[index];
    if (!filter) return;
    const config = this.getFieldConfig(filter.field);
    if (!config?.apiUrl) return;

    // Serve from field cache instantly if already fetched with no search term
    if (this.fieldCache[filter.field]) {
      this.dropdownItems[filter.id] = this.fieldCache[filter.field];
      return;
    }

    if (!this.dropdownItems[filter.id]?.length) {
      this.dropdownSkip[filter.id] = 0;
      this.dropdownSearchTerm[filter.id] = '';
      this.fetchDropdownPage(filter.id, config, '', false);
    }
  }

  getAvailableFilterOptions(currentIndex: number): TableField[] {
    const selectedFields = this.activeFilters
      .filter((_, index) => index !== currentIndex && _.field)
      .map(filter => filter.field);

    return this.filterOptions.filter(option => !selectedFields.includes(option.field));
  }

  getFilterType(field: string): string {
    const option = this.getFieldConfig(field);
    return option ? option.type : 'text';
  }

  getFilterOptions(field: string): any[] {
    const option = this.getFieldConfig(field);
    return option?.options || [];
  }

  getFieldLabel(field: string): string {
    const option = this.getFieldConfig(field);
    return option ? option.label : field;
  }

  getFieldPlaceholder(field: string): string {
    const option = this.getFieldConfig(field) as any;

    if (option?.placeholder) {
      return option.placeholder;
    }

    if (this.shouldUseValueSelect(field)) {
      return 'Select value';
    }

    if (option?.type === 'number') {
      return 'Enter number';
    }

    return 'Enter value';
  }

  shouldUseValueSelect(field: string): boolean {
    const config = this.getFieldConfig(field);

    if (!config) {
      return false;
    }

    if (config.type === 'dropdown' || config.type === 'select') {
      return true;
    }

    if (Array.isArray(config.options) && config.options.length > 0) {
      return true;
    }

    return false;
  }

  trackByFilter(index: number, item: ActiveFilter): number {
    return index;
  }

  private scrollToBottom(): void {
    const el = this.filterBodyEl?.nativeElement;
    if (!el) {
      return;
    }

    el.scrollTop = el.scrollHeight;
  }

  private escapeODataString(value: string): string {
    return value.replace(/'/g, "''");
  }

  private formatODataValue(value: any, field: string): string {
    const config = this.getFieldConfig(field);
    const rawValue = value == null ? '' : String(value).trim();

    if (!rawValue) {
      return '';
    }

    if (config?.type === 'number') {
      return rawValue;
    }

    if (config?.type === 'date' || field.toLowerCase().includes('date')) {
      return rawValue;
    }

    // OData boolean literals must not be quoted
    if (rawValue === 'true' || rawValue === 'false') {
      return rawValue;
    }

    return `'${this.escapeODataString(rawValue)}'`;
  }

  // ── Bookmark methods ──────────────────────────────────────────────────────

  private loadBookmarks(): void {
    if (!this.filterStorageKey) return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      this.savedBookmarks = raw ? JSON.parse(raw) : [];
    } catch {
      this.savedBookmarks = [];
    }
  }

  private persistBookmarks(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.savedBookmarks));
    } catch { /* storage full — silently ignore */ }
  }

  openSaveInput(): void {
    this.showSaveInput = true;
    this.newBookmarkName = '';
  }

  cancelSaveInput(): void {
    this.showSaveInput = false;
    this.newBookmarkName = '';
  }

  saveBookmark(): void {
    const name = this.newBookmarkName.trim();
    if (!name) return;

    const validFilters = this.activeFilters
      .filter(f => f.field && f.value !== '' && f.value !== null && f.value !== undefined)
      .map(f => ({ field: f.field, value: f.value }));

    if (!validFilters.length) return;

    // Replace existing bookmark with same name
    this.savedBookmarks = this.savedBookmarks.filter(b => b.name !== name);
    this.savedBookmarks.unshift({ name, filters: validFilters, savedAt: Date.now() });
    this.persistBookmarks();
    this.showSaveInput = false;
    this.newBookmarkName = '';
  }

  applyBookmark(bookmark: SavedFilterBookmark): void {
    this.activeFilters = bookmark.filters.map((f, i) => ({
      id: this.activeFilters[i]?.id ?? `filter-${++this.filterIdCounter}`,
      field: f.field,
      value: f.value
    }));
    this.ensureOneEmptyRow();
    this.syncClearAllState();

    // Pre-load dropdown items for any dropdown-type filters that have a saved value
    this.activeFilters.forEach(filter => {
      if (!filter.field || !filter.value) return;
      const config = this.getFieldConfig(filter.field);
      if (!config?.apiUrl) return;
      // Use field cache if available — no API call needed
      if (this.fieldCache[filter.field]) {
        this.dropdownItems[filter.id] = this.fieldCache[filter.field];
      } else if (!this.dropdownItems[filter.id]?.length) {
        this.dropdownSkip[filter.id] = 0;
        this.dropdownSearchTerm[filter.id] = '';
        this.fetchDropdownPage(filter.id, config, '', false);
      }
    });

    this.applyFilters();
  }

  deleteBookmark(index: number): void {
    this.savedBookmarks.splice(index, 1);
    this.persistBookmarks();
  }

  get hasValidFiltersToSave(): boolean {
    return this.activeFilters.some(
      f => f.field && f.value !== '' && f.value !== null && f.value !== undefined
    );
  }

  addFilter() {
    if (!this.canAddMoreFilters) {
      return;
    }

    this.activeFilters.push(this.createEmptyFilter());
    this.syncClearAllState();

    // Keep the newest row in view when adding filters
    setTimeout(() => this.scrollToBottom(), 0);
  }

  // removeFilter(index: number) {
  //   this.activeFilters.splice(index, 1);
  //   this.ensureOneEmptyRow();
  //   this.syncClearAllState();
  //   this.applyFilters();
  // }

  removeFilter(index: number) {
    this.activeFilters.splice(index, 1);
    const hasValidFilters = this.activeFilters.some(
      f => f.field && f.value !== '' && f.value !== null && f.value !== undefined
    );

    if (!hasValidFilters) {
      this.activeFilters = [];
      this.ensureOneEmptyRow();
      this.syncClearAllState();
      this.filterChange.emit('');
      return;
    }

    this.ensureOneEmptyRow();
    this.syncClearAllState();
    this.applyFilters();
  }

  updateField(index: number) {
    const filter = this.activeFilters[index];
    const hadValue = filter.value !== '' && filter.value !== null && filter.value !== undefined;
    filter.value = '';
    // Clear any typeahead state for this filter row
    delete this.dropdownItems[filter.id];
    delete this.dropdownLoading[filter.id];
    delete this.debounceTimers[filter.id];
    delete this.dropdownSkip[filter.id];
    delete this.dropdownHasMore[filter.id];
    delete this.dropdownSearchTerm[filter.id];
    this.ensureOneEmptyRow();
    this.syncClearAllState();
    // Only re-apply if this row previously had a value — otherwise no API call yet
    if (hadValue) {
      this.applyFilters();
    }
  }

  // onValueChange(index: number, rawValue: any) {
  //   this.activeFilters[index].value = rawValue;
  //   this.syncClearAllState();
  //   this.applyFilters();
  // }

  onValueChange(index: number, rawValue: any) {
    this.activeFilters[index].value = rawValue;
    this.syncClearAllState();
  }

  onValueLeave(index: number) {
    this.syncClearAllState();
    this.applyFilters();
  }

  applyFilters() {
    const validFilters = this.activeFilters.filter(
      f => f.field && f.value !== '' && f.value !== null && f.value !== undefined
    );

    const filterConfigMap = new Map(
      this.filterOptions.map(f => [f.field, f])
    );

    const filterString = validFilters
      .map(filter => {
        const rawValue = String(filter.value ?? '').trim();
        if (!rawValue) {
          return '';
        }

        const fieldConfig = filterConfigMap.get(filter.field);

        const buildEqExpression = (value: string) =>
          `${filter.field} eq ${this.formatODataValue(value, filter.field)}`;

        // multi-value support (comma or pipe separated)
        if (!this.shouldUseValueSelect(filter.field) && /[,\|]\s*/.test(rawValue)) {
          const values = rawValue
            .split(/[,\|]\s*/)
            .map(v => v.trim())
            .filter(v => v !== '');
          if (!values.length) {
            return '';
          }

          return `(${values.map(v => buildEqExpression(v)).join(' or ')})`;
        }

        // For dropdown/select fields and status-like fields, use equality
        if (this.shouldUseValueSelect(filter.field) || filter.field.toLowerCase().includes('status')) {
          return buildEqExpression(rawValue);
        }

        // For numeric/date fields, use equality too
        if (
          fieldConfig?.type === 'number' ||
          fieldConfig?.type === 'date' ||
          filter.field.toLowerCase().includes('date')
        ) {
          return buildEqExpression(rawValue);
        }

        // Default: startswith for text fields
        return `startswith(${filter.field},${this.formatODataValue(rawValue, filter.field)})`;
      })
      .filter(Boolean)
      .join(' and ');

    this.filterChange.emit(filterString);
  }

  clearAll(): void {
    this.activeFilters = [];
    this.ensureOneEmptyRow();
    this.syncClearAllState();
    this.filterChange.emit('');
  }

  close() {
    this.closeFilter.emit();
  }

}