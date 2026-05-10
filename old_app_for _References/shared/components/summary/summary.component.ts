import { Component, Input } from '@angular/core';
import { SummaryFieldConfig } from './summary.config';

@Component({
  standalone: false,
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class summaryComponent {

  @Input() headerData: any = {};

  private _lineData: any;
  @Input()
  set lineData(value: any) {
    this._lineData = value;
    this.dataSource = value || {};
  }
  get lineData() {
    return this._lineData;
  }

  @Input() summaryFields: SummaryFieldConfig[] = [];
  @Input() summaryLineFields: SummaryFieldConfig[] = [];

  dataSource: any = {};
  isLoading = false;

  trackByField(index: number, field: SummaryFieldConfig): string {
    return field?.key || `${field?.label || 'field'}-${index}`;
  }

  hasValue(field: SummaryFieldConfig): boolean {
    return this.hasRenderableValue(this.headerData?.[field.key]);
  }

  hasValueLine(field: SummaryFieldConfig): boolean {
    return this.hasRenderableValue(this.dataSource?.[field.key]);
  }

  hasAnyLineSummary(): boolean {
    return (this.summaryLineFields || []).some(field =>
      this.hasRenderableValue(this.dataSource?.[field.key])
    );
  }

  isCopyable(key: string): boolean {
    return key === 'Number' || key === 'claimNo';
  }

  hasRenderableValue(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  toDate(value: any): Date | null {
    if (!value) return null;

    if (value.year && value.month && value.day) {
      return new Date(value.year, value.month - 1, value.day);
    }

    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
      if (['false', 'no', 'n', '0', ''].includes(normalized)) return false;
    }

    return !!value;
  }

  getStatusClass(status: string): string {
    if (!status) return '';

    switch (status.toLowerCase().trim()) {
      case 'open':
        return 'open';
      case 'approved':
        return 'approved';
      case 'pending':
      case 'pending for approval':
        return 'pending';
      case 'rejected':
      case 'returned':
        return 'rejected';
      case 'paid':
        return 'paid';
      default:
        return '';
    }
  }

  copy(value: any): void {
    if (!this.hasRenderableValue(value)) return;
    navigator.clipboard.writeText(String(value));
  }
}