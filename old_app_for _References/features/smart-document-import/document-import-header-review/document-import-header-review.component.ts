import { Component, EventEmitter, Input, Output } from '@angular/core';

import { DocumentImportField } from '../document-import.models';

@Component({
  standalone: false,
  selector: 'app-document-import-header-review',
  templateUrl: './document-import-header-review.component.html',
  styleUrls: ['./document-import-header-review.component.scss'],
})
export class DocumentImportHeaderReviewComponent {
  @Input() fields: DocumentImportField[] = [];
  @Output() fieldsChanged = new EventEmitter<DocumentImportField[]>();

  onCorrectedValueChange(field: DocumentImportField, value: string): void {
    field.correctedValue = value;
    field.isConfirmed = true;
    this.fieldsChanged.emit(this.fields);
  }

  confidenceClass(score?: number): string {
    if (score === undefined || score === null) {
      return 'confidence-na';
    }

    if (score >= 0.85) {
      return 'confidence-high';
    }

    if (score >= 0.6) {
      return 'confidence-medium';
    }

    return 'confidence-low';
  }

  toPercent(score?: number): string {
    if (score === undefined || score === null) {
      return 'N/A';
    }

    return `${Math.round(score * 100)}%`;
  }

  getDisplayName(field: DocumentImportField): string {
    return field.displayName || field.sourceLabel || field.fieldName || field.fieldCode || 'Field';
  }

  isRequired(field: DocumentImportField): boolean {
    return !!field.isRequired;
  }

  getValidationStatus(field: DocumentImportField): string {
    const status = String(field.validationStatus || '').trim();
    return status || 'Pending';
  }

  fieldCardClass(field: DocumentImportField): string {
    const status = String(field.validationStatus || '').toLowerCase();
    const value = String(field.correctedValue || field.extractedValue || '').trim();

    if ((field.isRequired && !value) || status === 'invalid' || status === 'error' || field.errorMessage) {
      return 'field-card--danger';
    }

    if (typeof field.confidenceScore === 'number' && field.confidenceScore < 0.6) {
      return 'field-card--warning';
    }

    if (field.isConfirmed) {
      return 'field-card--confirmed';
    }

    return '';
  }

  fieldIssueText(field: DocumentImportField): string {
    const status = String(field.validationStatus || '').toLowerCase();
    const value = String(field.correctedValue || field.extractedValue || '').trim();

    if (field.isRequired && !value) {
      return 'Required value missing';
    }

    if (status === 'invalid' || status === 'error') {
      return 'Validation needs attention';
    }

    if (typeof field.confidenceScore === 'number' && field.confidenceScore < 0.6) {
      return 'Low confidence extraction';
    }

    return '';
  }

  trackByField(_: number, item: DocumentImportField): string {
    return item.systemId;
  }
}
