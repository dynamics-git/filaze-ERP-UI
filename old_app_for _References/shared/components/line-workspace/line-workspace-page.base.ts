import { ChangeDetectorRef, Directive, NgZone, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { FormField } from '../../../core/models/shared/formField';
import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';
import { RestService } from '../../../core/services/rest.service';
import { SortDirection, SortEvent } from '../../../core/services/models/shared/sort-event.model';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { Utility } from '../../../core/services/utility.service';

@Directive()
export abstract class LineWorkspacePageBase implements OnInit {
  page: number = 0;
  pageSize: number = 50;
  lines: any[] = [];
  originalLines: any[] = [];
  lineReady: boolean = false;
  lineFormGroup!: FormGroup;
  checkLineAll: boolean = false;
  selectedLines: number[] = [];
  viewMode: boolean = false;
  saving: boolean = false;
  loading: boolean = false;
  appendLoading: boolean = false;
  showMoreButton: boolean = false;
  showSearchBox: boolean = false;
  searchText: string = '';
  dropdownControlItems: any = {};
  columnFilters: Record<string, string> = {};
  advancedFilterQuery: string | null = null;
  focusRowIndex: number = -1;
  focusRequestId: number = 0;
  sortColumn: string = '';
  sortDirection: SortDirection = '';
  rowErrors: Record<number, string> = {};

  protected abstract lineDataConfig: LineDataConfig;

  constructor(
    protected fb: FormBuilder,
    protected toastr: ToastrService,
    protected restService: RestService,
    protected utility: Utility,
    protected dialogService: UnifiedDialogService,
    protected cdr: ChangeDetectorRef,
    protected zone: NgZone,
  ) { }

  ngOnInit(): void {
    this.lineFormGroup = this.fb.group({
      items: new FormArray([])
    });

    this.getLineData();
  }

  get items(): FormArray {
    return this.lineFormGroup.get('items') as FormArray;
  }

  getLineFormGroup(row: number): FormGroup {
    return this.items.controls[row] as FormGroup;
  }

  getLineData(): void {
    if (this.loading || this.appendLoading || (!this.showMoreButton && this.page > 0)) {
      return;
    }

    const isAppend = this.page > 0;
    this.page++;

    if (isAppend) {
      // Scroll load: show tail skeleton, grid stays FULLY interactive (user can scroll freely)
      this.appendLoading = true;
    } else {
      // Initial load: show full skeleton, grid blocked until rows arrive
      this.loading = true;
    }
    this.cdr.detectChanges();

    this.restService.get(this.lineDataConfig.api + this.buildODataQuery()).subscribe({
      next: (response: any) => {
        this.showMoreButton = response.value.length >= this.pageSize;
        const newRecords: any[] = response.value;
        this.originalLines = [...this.originalLines, ...newRecords];
        this.ensureEmptySeedLines();

        if (isAppend) {
          this.appendRecordsToForm(newRecords);
        } else {
          this.refreshLocalDisplay(true);
        }
      },
      error: () => {
        this.ensureEmptySeedLines();
        if (isAppend) {
          this.appendLoading = false;
        }
        this.refreshLocalDisplay(true);
      }
    });
  }

  private buildODataQuery(): string {
    const parts: string[] = [
      '$top=' + this.pageSize,
      '$skip=' + ((this.page - 1) * this.pageSize)
    ];

    const filterClauses: string[] = [];

    for (const [controlName, value] of Object.entries(this.columnFilters)) {
      if (!value) { continue; }
      const control = this.lineDataConfig.controls?.find((c: FormField) => c.label === controlName);
      if (!control) { continue; }
      const clause = this.buildODataFilterClause(control, value);
      if (clause) { filterClauses.push(clause); }
    }

    const trimmedSearch = this.searchText.trim();
    if (trimmedSearch) {
      const searchable = (this.lineDataConfig.controls || []).filter((c: FormField) =>
        !c.hidden && c.label &&
        c.type !== FormFieldType.Checkbox &&
        c.type !== FormFieldType.Number &&
        c.type !== FormFieldType.DateTime
      );
      const orClauses = searchable.map((c: FormField) =>
        `contains(${c.label},'${this.escapeODataString(trimmedSearch)}')`
      );
      if (orClauses.length > 0) {
        filterClauses.push('(' + orClauses.join(' or ') + ')');
      }
    }

    if (filterClauses.length > 0) {
      parts.push('$filter=' + filterClauses.join(' and '));
    }

    if (this.advancedFilterQuery) {
      const existing = parts.find(p => p.startsWith('$filter='));
      if (existing) {
        const idx = parts.indexOf(existing);
        parts[idx] = existing + ' and ' + this.advancedFilterQuery;
      } else {
        parts.push('$filter=' + this.advancedFilterQuery);
      }
    }

    if (this.sortColumn && this.sortDirection) {
      parts.push('$orderby=' + this.sortColumn + ' ' + this.sortDirection);
    }

    return '?' + parts.join('&');
  }

  private buildODataFilterClause(control: FormField, value: string): string {
    if (!control.label) { return ''; }

    if (control.type === FormFieldType.Checkbox) {
      return `${control.label} eq ${value.toLowerCase() === 'yes' ? 'true' : 'false'}`;
    }

    if (control.type === FormFieldType.Number) {
      const num = Number(value);
      return isNaN(num) ? '' : `${control.label} eq ${num}`;
    }

    return `contains(${control.label},'${this.escapeODataString(value)}')`;
  }

  private escapeODataString(value: string): string {
    return value.replace(/'/g, "''");
  }

  private resetAndFetch(): void {
    this.page = 0;
    this.lines = [];
    this.originalLines = [];
    this.showMoreButton = false;
    this.appendLoading = false;
    (this.items as any).clear({ emitEvent: false });
    this.lineReady = false;
    this.getLineData();
  }

  onAdvancedFilterChange(oDataQuery: string | null): void {
    this.advancedFilterQuery = oDataQuery || null;
    this.resetAndFetch();
  }

  private appendRecordsToForm(newRecords: any[]): void {
    // appendLoading is already true (set in getLineData before the API call)
    // Remove trailing seed rows from the bottom before appending
    while (this.lines.length > 0 && this.isTrailingEntryLine(this.lines[this.lines.length - 1])) {
      this.items.removeAt(this.items.length - 1, { emitEvent: false });
      this.lines.pop();
    }

    // Build ALL new FormGroups outside zone synchronously — pure JS, no CD
    const startRow = this.lines.length;
    this.zone.runOutsideAngular(() => {
      for (let i = 0; i < newRecords.length; i++) {
        const record = newRecords[i];
        this.lines.push(record);
        this.createItemFormGroup(record);
        const rowGroup = this.items.controls[startRow + i] as FormGroup;
        this.applyRowState(rowGroup, record, startRow + i);
      }

      // Re-add trailing seeds
      const trailingSeeds = this.originalLines.filter((l: any) => this.isTrailingEntryLine(l));
      trailingSeeds.forEach((seed: any) => {
        this.lines.push(seed);
        this.createItemFormGroup(seed);
      });
    });

    this.appendLoading = false;
    this.cdr.detectChanges();
  }

  protected refreshLocalDisplay(releaseLoading: boolean = false): void {
    const populated = this.originalLines.filter((line: any) => !this.isTrailingEntryLine(line));
    const trailing = this.originalLines.filter((line: any) => this.isTrailingEntryLine(line));
    this.lines = [...populated, ...trailing];
    this.generateItemsFormArray(this.lines, releaseLoading);
  }

  protected assignLineIndexes(): void {
    this.originalLines.forEach((line: any, index: number) => {
      line.index = index;
    });
  }

  protected ensureEmptySeedLines(): void {
    const populatedLines = this.originalLines.filter((line: any) => !this.isBlankEntryLine(line));
    this.originalLines = [...populatedLines];

    for (let index = 0; index < this.getEmptySeedCount(); index++) {
      this.originalLines.push({});
    }

    this.assignLineIndexes();
  }

  protected getEmptySeedCount(): number {
    return 1;
  }

  generateItemsFormArray(data: any[], releaseLoading: boolean = false): void {
    // Create a NEW FormGroup reference each time so that the OnPush child
    // (app-line-workspace) detects the input change and re-renders.
    this.lineFormGroup = this.fb.group({ items: new FormArray([]) });

    // Build all FormGroups outside zone synchronously — pure JS, no DOM, no CD.
    // One detectChanges() at the end paints all rows in a single browser frame.
    this.zone.runOutsideAngular(() => {
      for (let i = 0; i < data.length; i++) {
        this.createItemFormGroup(data[i]);
        const rowGroup = this.items.controls[i] as FormGroup;
        this.applyRowState(rowGroup, data[i], i);
      }
    });

    this.lineReady = true;
    if (releaseLoading) {
      this.loading = false;
    }
    // Single detectChanges: skeleton gone, all rows painted in one browser frame
    this.cdr.detectChanges();
  }

  protected applyRowState(_itemGroup: FormGroup, _line: any, _index: number): void {
  }

  createItemFormGroup(item: any, first: boolean = false): void {
    if (!this.lineDataConfig.controls?.length) {
      return;
    }

    const group: Record<string, FormControl> = {};
    for (const control of this.lineDataConfig.controls) {
      const validators: any[] = [];
      if (control.required) {
        validators.push(Validators.required);
      }
      if (control.type === FormFieldType.Email) {
        validators.push(Validators.email);
      }

      const value = control.type === FormFieldType.DateTime
        ? this.utility.convertStringToDateObj(item[control.label!])
        : item[control.label!];

      group[control.label!] = new FormControl(value, validators) as FormControl;
    }

    group['index'] = new FormControl(item.index) as FormControl;

    if (first) {
      this.items.insert(0, this.fb.group(group), { emitEvent: false });
    } else {
      this.items.push(this.fb.group(group), { emitEvent: false });
    }
  }

  deleteLine(row: number): void {
    const id = this.lines[row][this.lineDataConfig.idProp!];
    this.restService.delete(this.lineDataConfig.api + '(' + id + ')').subscribe({
      next: () => {
        const lineRows = this.items.controls as FormGroup[];
        if (lineRows.length > 1) {
          lineRows.splice(row, 1);
          this.lines.splice(row, 1);
          this.items.updateValueAndValidity();
        }
      },
      error: () => {
        this.toastr.error('Failed to delete line');
      }
    });
  }

  protected addLineItemRecord(item: any, row: number, index: number): void {
    const payload = this.sanitizeLinePayload(item);
    this.saving = true;
    this.restService.post(this.lineDataConfig.api!, payload).subscribe({
      next: (response: any) => {
        this.lines[row] = response;
        this.originalLines[index] = response;
        // Clear any inline error on success
        delete this.rowErrors[index];
        this.rowErrors = { ...this.rowErrors };
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        // Show error inline on the row — do NOT remove the row, user stays and can fix it
        const raw = err?.error?.message || err?.message || 'Save failed. Please correct the value and try again.';
        const message = raw.split('CorrelationId')[0].trim();
        this.rowErrors = { ...this.rowErrors, [index]: message };
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  protected updateLineItemRecord(record: any, patchData: any, row: number, index: number): void {
    const ifMatchKey = record['@odata.etag'];
    const query = '(' + record[this.lineDataConfig.idProp!] + ')';
    const payload = this.sanitizeLinePayload(patchData);
    this.saving = true;
    this.restService.patch(this.lineDataConfig.api + query, payload, ifMatchKey).subscribe({
      next: (response: any) => {
        this.lines[row] = response;
        this.originalLines[index] = response;
        // Clear any inline error on success
        delete this.rowErrors[index];
        this.rowErrors = { ...this.rowErrors };
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        // Show error inline on the row — user stays and can fix the field
        const raw = err?.error?.message || err?.message || 'Save failed. Please correct the value and try again.';
        const message = raw.split('CorrelationId')[0].trim();
        this.rowErrors = { ...this.rowErrors, [index]: message };
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  revertLine(row: number): void {
    const fg = this.items.at(row) as FormGroup;
    const index = fg?.get('index')?.value ?? row;
    const lastGood = this.originalLines[index];

    // New row that was never saved — remove it entirely instead of clearing to blank
    if (!lastGood || (this.lineDataConfig.idProp && !lastGood[this.lineDataConfig.idProp])) {
      this.items.removeAt(row);
      this.lines.splice(row, 1);
      this.originalLines.splice(index, 1);
      delete this.rowErrors[index];
      this.rowErrors = { ...this.rowErrors };
      this.cdr.detectChanges();
      return;
    }

    // Existing row — restore last server values
    for (const control of this.lineDataConfig.controls || []) {
      const key = control.label!;
      if (fg.contains(key)) {
        const val = control.type === FormFieldType.DateTime
          ? this.utility.convertStringToDateObj(lastGood[key])
          : lastGood[key];
        fg.get(key)!.patchValue(val, { emitEvent: false });
      }
    }
    delete this.rowErrors[index];
    this.rowErrors = { ...this.rowErrors };
    this.cdr.detectChanges();
  }

  changeViewMode(): void {
    this.viewMode = !this.viewMode;
  }

  selectAll(): void {
    this.checkLineAll = !this.checkLineAll;
    this.selectedLines = [];
    if (this.checkLineAll) {
      const lastIndex = this.items.length - 1;
      this.items.value.forEach((_row: any, index: number) => {
        if (index !== lastIndex) {
          this.selectedLines.push(index);
        }
      });
    }
  }

  selectLineItem(index: number): void {
    this.selectedLines = [index];
  }

  copyLineAt(rowIndex: number): void {
    const sourceGroup = this.items.at(rowIndex) as FormGroup | undefined;
    if (!sourceGroup) return;

    const sourceIndex = sourceGroup.get('index')?.value;
    if (sourceIndex === undefined || sourceIndex === null) return;

    const sourceLine = this.originalLines[sourceIndex];
    if (!sourceLine || this.isTrailingEntryLine(sourceLine)) return;

    // Clone source line; strip server-assigned fields so the row is treated as new (POST)
    const copy: any = { ...sourceLine, __lineState: 'copied' };
    // Remove the primary key so saveLineItemRecord falls into the POST branch
    if (this.lineDataConfig.idProp) delete copy[this.lineDataConfig.idProp];
    // Remove the FK — it will be re-injected by addLineItemRecord via the header context
    if (this.lineDataConfig.lineFKProp) delete copy[this.lineDataConfig.lineFKProp];
    // Remove OData metadata fields
    delete copy['@odata.etag'];
    delete copy['SystemId'];

    // Insert the copy after the source row
    this.originalLines.splice(sourceIndex + 1, 0, copy);
    this.assignLineIndexes();
    this.viewMode = false;
    this.refreshLocalDisplay();

    // POST immediately — if it succeeds the row is saved; if it fails the inline error
    // row appears below it so the user knows exactly what to fix. Fixing the field
    // triggers changeLineControl → saveLineItemRecord → another POST (still no idProp) →
    // success clears the error automatically.
    const newLineIndex = this.originalLines.indexOf(copy);
    const newRowIndex = Math.min(rowIndex + 1, this.lines.length - 1);
    if (newLineIndex >= 0) {
      const payload = this.utility.getLineControlsData(
        this.utility.copyObj(copy),
        this.lineDataConfig.controls!
      );
      this.addLineItemRecord(payload, newRowIndex, newLineIndex);
    }

    this.focusRowIndex = newRowIndex;
    this.focusRequestId++;
    this.cdr.detectChanges();
  }

  insertLineAt(rowIndex: number): void {
    const currentGroup = this.items.at(rowIndex) as FormGroup | undefined;
    if (!currentGroup) {
      return;
    }

    const currentIndex = currentGroup.get('index')?.value;
    if (currentIndex === undefined || currentIndex === null) {
      return;
    }

    const currentLine = this.originalLines[currentIndex];
    if (this.isTrailingEntryLine(currentLine)) {
      this.viewMode = false;
      this.focusRowIndex = rowIndex;
      this.focusRequestId++;
      return;
    }

    this.originalLines.splice(currentIndex + 1, 0, { __lineState: 'inserted' });
    this.assignLineIndexes();
    this.viewMode = false;
    this.refreshLocalDisplay();
    this.focusRowIndex = Math.min(rowIndex + 1, this.lines.length - 1);
    this.focusRequestId++;
    // Must call detectChanges again: refreshLocalDisplay() calls it before
    // focusRowIndex/focusRequestId are updated, so the OnPush child never
    // sees the new focus values without this second call.
    this.cdr.detectChanges();
  }

  addLineItem(): void {
    const nextIndex = this.originalLines.length;
    const seed = { index: nextIndex };
    this.originalLines.push(seed);
    this.lines.push({ ...seed });
    this.createItemFormGroup(seed, false);
    this.focusRowIndex = this.lines.length - 1;
    this.focusRequestId++;
  }

  async deleteLines(): Promise<void> {
    if (this.selectedLines.length === 0) {
      this.toastr.warning('Select line to delete!');
      return;
    }

    const lines = this.items.controls as FormGroup[];
    const selectedIndex = this.selectedLines[0];
    const itemGroup = this.items.controls[selectedIndex] as FormGroup;
    const index = itemGroup.get('index')!.value;
    const record = this.lines[selectedIndex];

    const confirmed = await this.dialogService.confirmDelete({
      message: 'Are you sure you want to delete this line? This action cannot be undone.'
    });

    if (!confirmed) {
      return;
    }

    if (record[this.lineDataConfig.idProp!]) {
      const query = '(' + record[this.lineDataConfig.idProp!] + ')';
      this.restService.delete(this.lineDataConfig.api + query).subscribe({
        next: () => {
          if (lines.length > 1) {
            this.items.removeAt(selectedIndex, { emitEvent: false });
            this.lines.splice(selectedIndex, 1);
            this.originalLines.splice(index, 1);
            this.selectedLines = [];
            this.toastr.success('Record deleted successfully.');
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.toastr.error('Failed to delete line');
        }
      });
      return;
    }

    this.items.removeAt(selectedIndex, { emitEvent: false });
    this.lines.splice(selectedIndex, 1);
    this.originalLines.splice(index, 1);
    this.selectedLines = [];
    this.cdr.detectChanges();
  }

  showSearch(): void {
    this.showSearchBox = true;
  }

  // Triggers a server-side re-fetch with current filters/sort (also bound to (searchSubmit) in template)
  searchItem(): void {
    this.resetAndFetch();
  }

  updateSorting(sort: SortEvent): void {
    this.sortColumn = sort.column;
    this.sortDirection = sort.direction;
    this.sortLoadedLinesInUi();
  }

  private sortLoadedLinesInUi(): void {
    const trailing = this.originalLines.filter((line: any) => this.isTrailingEntryLine(line));
    const insertedBlanks = this.originalLines.filter((line: any) => this.isInsertedEntryLine(line));
    const populated = this.originalLines.filter((line: any) =>
      !this.isTrailingEntryLine(line) && !this.isInsertedEntryLine(line)
    );

    if (!this.sortColumn || !this.sortDirection) {
      this.originalLines = [...populated, ...insertedBlanks, ...trailing];
      this.assignLineIndexes();
      this.refreshLocalDisplay();
      this.restoreActiveSelectionAfterClientSort();
      return;
    }

    const direction = this.sortDirection === 'asc' ? 1 : -1;
    const control = this.lineDataConfig.controls?.find((c: FormField) => c.label === this.sortColumn);

    populated.sort((a: any, b: any) => this.compareSortValues(a, b, control, direction));

    this.originalLines = [...populated, ...insertedBlanks, ...trailing];
    this.assignLineIndexes();
    this.refreshLocalDisplay();
    this.restoreActiveSelectionAfterClientSort();
  }

  private compareSortValues(
    a: any,
    b: any,
    control: FormField | undefined,
    direction: 1 | -1
  ): number {
    const aValue = a?.[this.sortColumn];
    const bValue = b?.[this.sortColumn];

    const aEmpty = aValue === undefined || aValue === null || aValue === '';
    const bEmpty = bValue === undefined || bValue === null || bValue === '';

    if (aEmpty && bEmpty) { return 0; }
    if (aEmpty) { return 1; }
    if (bEmpty) { return -1; }

    if (control?.type === FormFieldType.Number) {
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      if (isNaN(aNum) && isNaN(bNum)) { return 0; }
      if (isNaN(aNum)) { return 1; }
      if (isNaN(bNum)) { return -1; }
      return (aNum - bNum) * direction;
    }

    if (control?.type === FormFieldType.Checkbox) {
      return ((aValue === true ? 1 : 0) - (bValue === true ? 1 : 0)) * direction;
    }

    if (control?.type === FormFieldType.DateTime) {
      const aTime = new Date(aValue).getTime();
      const bTime = new Date(bValue).getTime();
      if (isNaN(aTime) && isNaN(bTime)) { return 0; }
      if (isNaN(aTime)) { return 1; }
      if (isNaN(bTime)) { return -1; }
      return (aTime - bTime) * direction;
    }

    return String(aValue).toLowerCase().trim()
      .localeCompare(String(bValue).toLowerCase().trim(), undefined, { numeric: true, sensitivity: 'base' }) * direction;
  }

  private restoreActiveSelectionAfterClientSort(): void {
    this.selectedLines = [];
    this.checkLineAll = false;
    this.cdr.detectChanges();
  }

  private filterDebounceTimer?: ReturnType<typeof setTimeout>;

  updateColumnFilter(filter: { control: string; value: string }): void {
    const normalizedValue = (filter.value || '').trim();
    if (normalizedValue) {
      this.columnFilters[filter.control] = normalizedValue;
    } else {
      delete this.columnFilters[filter.control];
    }

    clearTimeout(this.filterDebounceTimer);
    this.filterDebounceTimer = setTimeout(() => this.resetAndFetch(), 400);
  }

  clearColumnFilters(): void {
    this.columnFilters = {};
    this.searchText = '';
    this.resetAndFetch();
  }

  get activeFilterCount(): number {
    return Object.keys(this.columnFilters).length;
  }

  protected isBlankEntryLine(line: any): boolean {
    if (!line) {
      return true;
    }

    if (this.lineDataConfig.idProp && line[this.lineDataConfig.idProp]) {
      return false;
    }

    return !(this.lineDataConfig.controls || []).some((control: FormField) => {
      const value = line[control.label!];

      if (control.type === FormFieldType.Checkbox) {
        return value === true;
      }

      return value !== undefined && value !== null && value !== '';
    });
  }

  protected isTrailingEntryLine(line: any): boolean {
    return this.isBlankEntryLine(line) && line?.__lineState !== 'inserted';
  }

  protected isInsertedEntryLine(line: any): boolean {
    return this.isBlankEntryLine(line) && line?.__lineState === 'inserted';
  }

  protected sanitizeLinePayload(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const payload = this.utility.copyObj(data);
    delete payload.index;

    Object.keys(payload).forEach((key: string) => {
      if (key.startsWith('__')) {
        delete payload[key];
      }
    });

    return payload;
  }

  dropdownItemsLoadedEvent(items: any[], control: FormField): void {
    this.dropdownControlItems[control.label!] = items;
  }

  onBlankRowDiscarded(): void {
    const blanks = this.originalLines.filter((line: any) => this.isInsertedEntryLine(line));
    if (blanks.length === 0) {
      return;
    }

    this.originalLines = this.originalLines.filter((line: any) => !this.isInsertedEntryLine(line));
    this.ensureEmptySeedLines();
    this.refreshLocalDisplay();
  }

  abstract changeLineControl(data: ControlDataModel, rowIndex: number): void;

  abstract leaveLineControl(data: ControlDataModel, row: number): void;
}