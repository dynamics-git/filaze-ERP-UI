import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { FormField } from '../../../core/models/shared/formField';
import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';
import { TableField } from '../../../core/models/shared/list-table.config';
import { SortDirection, SortEvent } from '../../../core/services/models/shared/sort-event.model';

@Component({
  standalone: false,
  selector: 'app-line-workspace',
  templateUrl: './line-workspace.component.html',
  styleUrls: ['./line-workspace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineWorkspaceComponent implements AfterViewChecked, AfterViewInit, OnChanges, OnDestroy {

  constructor(private zone: NgZone) {}
  @Input() title: string = 'Lines';
  @Input() lineDataConfig: LineDataConfig = {};
  @Input() lineFormGroup!: FormGroup;
  @Input() lineReady: boolean = false;
  @Input() selectedLines: number[] = [];
  @Input() viewMode: boolean = false;
  @Input() saving: boolean = false;
  @Input() loading: boolean = false;
  @Input() showMoreButton: boolean = false;
  @Input() showBackButton: boolean = true;
  @Input() showSearchBox: boolean = false;
  @Input() searchText: string = '';
  @Input() searchPlaceholder: string = 'Search';
  @Input() deleteDisabled: boolean = false;
  @Input() columnFilters: Record<string, string> = {};
  @Input() activeFilterCount: number = 0;
  @Input() focusRowIndex: number = -1;
  @Input() focusRequestId: number = 0;
  @Input() sortColumn: string = '';
  @Input() sortDirection: SortDirection = '';
  @Input() appendLoading: boolean = false;
  @Input() checkLineAll: boolean = false;
  @Input() rowErrors: Record<number, string> = {};

  @Output() back = new EventEmitter<void>();
  @Output() showSearchBoxChange = new EventEmitter<boolean>();
  @Output() searchTextChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<void>();
  @Output() columnFilterChange = new EventEmitter<{ control: string; value: string }>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() add = new EventEmitter<number>();
  @Output() editToggle = new EventEmitter<void>();
  @Output() deleteSelected = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();
  @Output() lineSelect = new EventEmitter<number>();
  @Output() selectAll = new EventEmitter<void>();
  @Output() copyLine = new EventEmitter<number>();
  @Output() revertLine = new EventEmitter<number>();
  @Output() lineChange = new EventEmitter<{ event: ControlDataModel; rowIndex: number }>();
  @Output() lineLeave = new EventEmitter<{ event: ControlDataModel; rowIndex: number }>();
  @Output() dropdownItemsLoaded = new EventEmitter<{ items: any[]; control: FormField }>();
  @Output() blankRowDiscarded = new EventEmitter<void>();
  @Output() advancedFilterChange = new EventEmitter<string | null>();

  @ViewChild('gridContainer') private gridContainer?: ElementRef<HTMLDivElement>;
  @ViewChildren('dataRow') private dataRows?: QueryList<ElementRef<HTMLTableRowElement>>;

  activeFocusRowIndex: number = -1;
  activeMenuRowIndex: number = -1;
  activeRowIndex: number = -1;
  showFilterPanel: boolean = false;
  activeAdvancedFilterCount: number = 0;
  isDirty: boolean = false;
  private suppressBlankDiscardOnce = false;
  menuPosition: { top: number; left: number } = { top: 0, left: 0 };
  skeletonRows: number[] = Array.from({ length: 15 }, (_value, index) => index);
  fieldType = FormFieldType;
  private handledFocusRequestId: number = 0;
  private loadRequestPending: boolean = false;
  private scrollListener?: () => void;

  get items(): FormArray {
    return (this.lineFormGroup?.get('items') as FormArray) || new FormArray([]);
  }

  get controls(): FormField[] {
    return this.lineDataConfig?.controls || [];
  }

  get visibleControlCount(): number {
    return this.controls.filter(c => !c.hidden).length;
  }

  getRowError(rowIndex: number): string | null {
    const index = this.getLineFormGroup(rowIndex)?.get('index')?.value;
    if (index === undefined || index === null) return null;
    return this.rowErrors[index] || null;
  }

  get showInitialSkeleton(): boolean {
    return this.loading && this.items.length === 0;
  }

  get showLoadingTailSkeleton(): boolean {
    return this.appendLoading;
  }

  get showEndOfResults(): boolean {
    return this.lineReady && !this.loading && !this.appendLoading && !this.showMoreButton && this.items.length > 0;
  }

  get hasActiveFilters(): boolean {
    return this.activeFilterCount > 0 || !!this.searchText.trim();
  }

  /** Active column filter pills for the pill bar */
  get columnFilterPills(): { field: string; label: string; value: string }[] {
    return Object.entries(this.columnFilters)
      .filter(([, value]) => !!value)
      .map(([field, value]) => {
        const control = this.controls.find(c => c.label === field);
        return { field, label: control?.name || field, value };
      });
  }

  /** Count of required fields that are empty across all non-blank rows */
  get requiredEmptyCount(): number {
    const requiredControls = this.controls.filter(c => c.required && !c.hidden);
    if (!requiredControls.length) return 0;
    let count = 0;
    for (let i = 0; i < this.items.length; i++) {
      if (this.isBlankRow(i)) continue; // skip empty input rows
      const row = this.getLineFormGroup(i);
      for (const control of requiredControls) {
        const val = row.get(control.label || '')?.value;
        if (val === undefined || val === null || val === '') count++;
      }
    }
    return count;
  }

  /** Derives TableField[] from lineDataConfig.controls for the app-filter panel. */
  get filterFields(): TableField[] {
    return (this.lineDataConfig?.controls || [])
      .filter((c: FormField) => !c.hidden && !!c.label)
      .map((c: FormField): TableField => {
        let type: TableField['type'] = 'text';
        if (c.type === FormFieldType.DateTime) { type = 'date'; }
        else if (c.type === FormFieldType.Number) { type = 'number'; }
        else if (c.type === FormFieldType.DropDown) { type = c.apiUrl ? 'dropdown' : 'select'; }
        else if (c.type === FormFieldType.Checkbox) { type = 'select'; }

        const field: TableField = {
          field: c.label!,
          label: c.name || c.label!,
          type,
        };

        if (c.type === FormFieldType.Checkbox) {
          field.options = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }];
        } else if (c.apiUrl) {
          field.apiUrl = c.apiUrl;
          field.valueField = c.bindValue;
          // Avoid 'displayValue' — that's a runtime mutation by form-field's buildDropdownItems().
          // Use bindLabel only if it's a real API field name (not the synthetic 'displayValue').
          const rawLabel = c.bindLabel;
          field.labelField = (rawLabel && rawLabel !== 'displayValue') ? rawLabel : c.bindValue;
        } else if (c.items?.length) {
          field.options = c.items.map((item: any) => ({ value: item.value ?? item.id, label: item.name ?? item.label }));
        }

        return field;
      });
  }

  onAdvancedFilterChange(oDataQuery: string | null): void {
    // Count active filters by counting 'and' segments + 1 (rough but reliable)
    this.activeAdvancedFilterCount = oDataQuery
      ? oDataQuery.split(' and ').filter(Boolean).length
      : 0;
    this.advancedFilterChange.emit(oDataQuery);
  }

  ngAfterViewInit(): void {
    const el = this.gridContainer?.nativeElement;
    if (!el) { return; }

    // Measure header row actual height AFTER first paint, then set CSS variable so
    // filter row sticky offset is pixel-perfect regardless of zoom / font / OS scaling.
    // Chrome does NOT support position:sticky on <thead> — must be on <th> elements.
    requestAnimationFrame(() => {
      const headerRow = el.querySelector('thead tr:first-child') as HTMLElement | null;
      if (headerRow) {
        el.style.setProperty('--lw-filter-top', headerRow.offsetHeight + 'px');
      }
    });

    // Wire scroll listener OUTSIDE Angular zone — scroll events must never trigger CD.
    this.scrollListener = () => {
      this.activeMenuRowIndex = -1;
      if (this.loading || this.appendLoading || !this.showMoreButton || this.loadRequestPending) { return; }
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (remaining > 160) { return; }
      this.loadRequestPending = true;
      this.zone.run(() => this.loadMore.emit());
    };

    this.zone.runOutsideAngular(() => {
      el.addEventListener('scroll', this.scrollListener!, { passive: true });
    });
  }

  ngOnDestroy(): void {
    const el = this.gridContainer?.nativeElement;
    if (el && this.scrollListener) {
      el.removeEventListener('scroll', this.scrollListener);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset the scroll gate whenever any loading state clears or no more pages exist
    if (changes['loading'] && !changes['loading'].currentValue) {
      this.loadRequestPending = false;
    }
    if (changes['appendLoading'] && !changes['appendLoading'].currentValue) {
      this.loadRequestPending = false;
    }
    if (changes['showMoreButton'] && !changes['showMoreButton'].currentValue) {
      this.loadRequestPending = false;
    }
  }

  @HostListener('document:click', ['$event'])
  closeRowMenu(event: MouseEvent): void {
    this.activeMenuRowIndex = -1;

    if (this.suppressBlankDiscardOnce) {
      this.suppressBlankDiscardOnce = false;
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    // Use composedPath() — captures elements before DOM removal.
    // ng-select closes its dropdown panel before document:click bubbles,
    // so target.closest() fails on already-detached elements.
    const path = event.composedPath() as Element[];
    const ignoreDiscardClick = path.some(el => {
      if (!(el instanceof Element)) { return false; }
      const c = el.classList;
      return c.contains('ng-dropdown-panel') ||
             c.contains('ng-option') ||
             c.contains('ng-option-label') ||
             c.contains('ng-select') ||
             c.contains('ng-input') ||
             c.contains('ng-value-container') ||
             c.contains('ng-clear-wrapper') ||
             c.contains('ng-arrow-wrapper') ||
             c.contains('pr-filter-panel') ||
             c.contains('lw-filter-panel');
    });
    if (ignoreDiscardClick) {
      return;
    }

    if (this.activeFocusRowIndex >= 0 && this.isBlankRow(this.activeFocusRowIndex)) {
      const rowEl = this.dataRows?.get(this.activeFocusRowIndex)?.nativeElement;
      if (rowEl && !rowEl.contains(target)) {
        this.activeFocusRowIndex = -1;
        this.blankRowDiscarded.emit();
      }
    }
  }

  onInsertClick(rowIndex: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.suppressBlankDiscardOnce = true;
    this.add.emit(rowIndex);
  }

  @HostListener('document:keydown.escape')
  closeRowMenuFromKeyboard(): void {
    this.activeMenuRowIndex = -1;
  }

  trackByIndex(index: number): number {
    return index;
  }

  getLineFormGroup(row: number): FormGroup {
    return this.items.controls[row] as FormGroup;
  }

  ngAfterViewChecked(): void {
    if (!this.lineReady || !this.focusRequestId || this.focusRequestId === this.handledFocusRequestId) {
      return;
    }

    const row = this.dataRows?.get(this.focusRowIndex)?.nativeElement;
    if (!row) {
      return;
    }

    this.handledFocusRequestId = this.focusRequestId;
    this.activeFocusRowIndex = this.focusRowIndex;
    // When a new row is inserted/focused, that row becomes the active row too
    this.activeRowIndex = this.focusRowIndex;
    this.scrollRowIntoView(row);
    this.focusFirstEditableCell(row);
  }

  setActiveRow(rowIndex: number): void {
    this.activeRowIndex = rowIndex;
  }

  onRowMouseDown(rowIndex: number, event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      this.activeRowIndex = rowIndex;
      return;
    }

    const interactive = target.closest(
      'button, input[type="checkbox"], label, a, .ng-select, .ng-dropdown-panel'
    );

    if (interactive) {
      return;
    }

    this.activeRowIndex = rowIndex;
  }

  onBackClick(): void {
    if (this.isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to go back?');
      if (!confirmed) return;
    }
    this.back.emit();
  }

  clearColumnFilter(field: string): void {
    this.columnFilterChange.emit({ control: field, value: '' });
  }

  openSearch(): void {
    this.showSearchBoxChange.emit(true);
  }

  closeSearch(): void {
    this.showSearchBoxChange.emit(false);
  }

  updateSearchText(value: string): void {
    this.searchTextChange.emit(value);
  }

  submitSearch(): void {
    this.searchSubmit.emit();
  }

  onLineChange(event: ControlDataModel, rowIndex: number): void {
    this.isDirty = true;
    this.lineChange.emit({ event, rowIndex });
  }

  onLineLeave(event: ControlDataModel, rowIndex: number): void {
    this.isDirty = false;
    this.lineLeave.emit({ event, rowIndex });
  }

  onDropdownItemsLoaded(items: any[], control: FormField): void {
    this.dropdownItemsLoaded.emit({ items, control });
  }

  getColumnFilterValue(control: FormField): string {
    return this.columnFilters[control.label || ''] || '';
  }

  updateColumnFilterValue(control: FormField, value: string): void {
    if (!control.label) {
      return;
    }

    this.columnFilterChange.emit({ control: control.label, value });
  }

  onSort(control: FormField, direction: SortDirection): void {
    if (!control.label) {
      return;
    }

    this.sortChange.emit({ column: control.label, direction });
  }

  isSorted(control: FormField, direction: SortDirection): boolean {
    return this.sortColumn === control.label && this.sortDirection === direction;
  }

  isBlankRow(rowIndex: number): boolean {
    const rowGroup = this.getLineFormGroup(rowIndex);
    return !this.controls.some((control: FormField) => {
      const value = rowGroup.get(control.label || '')?.value;

      if (control.type === FormFieldType.Checkbox) {
        return value === true;
      }

      return value !== undefined && value !== null && value !== '';
    });
  }

  toggleRowMenu(rowIndex: number, event: MouseEvent): void {
    event.stopPropagation();

    if (this.activeMenuRowIndex === rowIndex) {
      this.activeMenuRowIndex = -1;
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const estimatedMenuHeight = 96;
    const estimatedMenuWidth = 210;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Drop below the button, left-aligned to it
    let top = rect.bottom + 2;
    let left = rect.left;

    // Clamp bottom
    if (top + estimatedMenuHeight > viewportHeight - 8) {
      top = rect.top - estimatedMenuHeight - 2;
    }
    // Clamp right edge
    if (left + estimatedMenuWidth > viewportWidth - 8) {
      left = viewportWidth - estimatedMenuWidth - 8;
    }

    this.menuPosition = { top, left };
    this.activeMenuRowIndex = rowIndex;
  }

  isRowMenuOpen(rowIndex: number): boolean {
    return this.activeMenuRowIndex === rowIndex;
  }

  copyLineFromRow(rowIndex: number, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuRowIndex = -1;
    this.copyLine.emit(rowIndex);
  }

  insertLineFromRow(rowIndex: number, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuRowIndex = -1;
    this.add.emit(rowIndex);
  }

  deleteLineFromRow(rowIndex: number, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuRowIndex = -1;
    this.lineSelect.emit(rowIndex);
    this.deleteSelected.emit();
  }

  private scrollRowIntoView(row: HTMLTableRowElement): void {
    const container = this.gridContainer?.nativeElement;
    if (!container) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      return;
    }

    const targetTop = Math.max(row.offsetTop - container.clientHeight * 0.35, 0);
    container.scrollTo({ top: targetTop, behavior: 'smooth' });
  }

  private focusFirstEditableCell(row: HTMLTableRowElement): void {
    requestAnimationFrame(() => {
      const focusTarget = row.querySelector<HTMLElement>(
        'input:not([type="checkbox"]):not([readonly]):not([disabled]), textarea:not([readonly]):not([disabled]), .ng-select:not(.ng-select-disabled) input'
      );

      focusTarget?.focus();
      if (focusTarget instanceof HTMLInputElement || focusTarget instanceof HTMLTextAreaElement) {
        focusTarget.select();
      }
    });
  }
}