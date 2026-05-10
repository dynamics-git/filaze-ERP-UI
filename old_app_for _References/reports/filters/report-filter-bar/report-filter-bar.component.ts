import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { ReportFilterField } from '../../services/report-filter.model';

interface InternalFilterField {
  key: string;
  field: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select';
  operator: 'eq' | 'ge' | 'le' | 'contains';
  options?: { label: string; value: any, type?: 'number' | 'string' }[];
}

@Component({
  standalone: false,
  selector: 'app-report-filter-bar',
  templateUrl: './report-filter-bar.component.html',
  styleUrl: './report-filter-bar.component.scss'
})
export class ReportFilterBarComponent implements OnInit {

  @Input() filtersConfig: ReportFilterField[] = [];

  @Input() columns: any[] = [];

  @Output() apply = new EventEmitter<string>();

  tableFields: InternalFilterField[] = [];

  activeFilters: { field: string; value: any }[] = [];

  ngOnInit(): void {
    if (this.filtersConfig && this.filtersConfig.length > 0) {
      this.mapFiltersConfig();
    } else if (this.columns && this.columns.length > 0) {
      this.mapColumnsToFilters();
    }

    this.addFilter();
  }

  private mapFiltersConfig(): void {
    this.tableFields = this.filtersConfig.map(f => ({
      key: f.key,
      field: f.apiField,
      label: f.label ?? f.key,
      type: f.type,
      operator: f.operator || 'eq',
      options: f.options ?? []
    }));
  }

  private mapColumnsToFilters(): void {
    this.tableFields = this.columns.map(col => ({
      key: col.key,
      field: col.key,
      label: col.label || col.key,
      type: 'text',
      operator: 'contains'
    }));
  }

  addFilter(): void {
    this.activeFilters.push({ field: '', value: '' });
  }

  // removeFilter(index: number): void {
  //   this.activeFilters.splice(index, 1);
  //   if (this.activeFilters.length === 0) {
  //     this.addFilter();
  //   }
  // }


  removeFilter(index: number): void {
  this.activeFilters.splice(index, 1);

  if (this.activeFilters.length === 0) {
    this.addFilter();
  }

  // 🔥 RE-APPLY FILTERS AFTER REMOVE
  this.onApply();
}


  updateField(index: number): void {
    this.activeFilters[index].value = '';
    if (index === this.activeFilters.length - 1) {
      this.addFilter();
    }
  }

  getAvailableFilterOptions(index: number): InternalFilterField[] {
    const usedKeys = this.activeFilters
      .filter((_, i) => i !== index)
      .map(f => f.field);

    return this.tableFields.filter(f => !usedKeys.includes(f.key));
  }

  getField(key: string): InternalFilterField | undefined {
    return this.tableFields.find(f => f.key === key);
  }

  onApply(): void {
    const parts: string[] = [];

    this.activeFilters.forEach(f => {
      if (!f.field || f.value === '' || f.value === null) return;

      const field = this.getField(f.field);
      if (!field) return;

      const operator = field.operator || 'eq';

      if (field.type === 'date') {
        parts.push(`${field.field} ${operator} ${f.value}`);
      }
      else if (field.type === 'number') {
        parts.push(`${field.field} ${operator} ${f.value}`);
      }
      else if (field.type === 'select') {
        const selectedOption = field.options?.find(
          opt => String(opt.value) === String(f.value)
        );
        if (selectedOption?.type === 'number') {
          parts.push(`${field.field} ${operator} ${Number(f.value)}`);
        } else {
          parts.push(`${field.field} ${operator} '${f.value}'`);
        }
      }
      else if (operator === 'contains') {
        parts.push(`contains(${field.field},'${f.value}')`);
      }
      else {
        parts.push(`${field.field} ${operator} '${f.value}'`);
      }
    });

    const query =
      parts.length > 0
        ? `?$filter=${encodeURIComponent(parts.join(' and '))}`
        : '';

    this.apply.emit(query);
  }

}

