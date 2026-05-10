import { Component, EventEmitter, Input, Output } from '@angular/core';

import { DocumentImportLine } from '../document-import.models';

@Component({
  standalone: false,
  selector: 'app-document-import-line-review',
  templateUrl: './document-import-line-review.component.html',
  styleUrls: ['./document-import-line-review.component.scss'],
})
export class DocumentImportLineReviewComponent {
  @Input() lines: DocumentImportLine[] = [];
  @Output() linesChanged = new EventEmitter<DocumentImportLine[]>();

  addLine(): void {
    const nextLineNo = this.getNextLineNo();
    this.lines = [
      ...this.lines,
      {
        systemId: `local-manual-line-${Date.now()}`,
        importNo: '',
        lineNo: nextLineNo,
        itemNo: '',
        glAccountNo: '',
        description: '',
        quantity: undefined,
        unitOfMeasure: '',
        unitCost: undefined,
        lineAmount: undefined,
        mappingStatus: 'Manual',
        confidenceScore: 0,
      },
    ];
    this.onLineChanged();
  }

  removeLine(index: number): void {
    this.lines = this.lines.filter((_, lineIndex) => lineIndex !== index);
    this.onLineChanged();
  }

  onLineChanged(): void {
    this.linesChanged.emit(this.lines);
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

  lineRowClass(line: DocumentImportLine): string {
    if (this.lineIssueText(line)) {
      return 'line-row--danger';
    }

    if (typeof line.confidenceScore === 'number' && line.confidenceScore < 0.6) {
      return 'line-row--warning';
    }

    return '';
  }

  lineIssueText(line: DocumentImportLine): string {
    const error = this.stripMappingOnlyError(line.errorMessage);
    if (error) {
      return error;
    }

    if (!String(line.description || '').trim()) {
      return 'Description is required';
    }

    if (Number(line.quantity || 0) <= 0) {
      return 'Quantity must be greater than zero';
    }

    if (Number(line.unitCost || 0) <= 0 && Number(line.lineAmount || 0) <= 0) {
      return 'Unit cost or line amount is required';
    }

    return '';
  }

  mappingPlaceholder(line: DocumentImportLine): string {
    const hasItemOrGl = !!String(line.itemNo || '').trim() || !!String(line.glAccountNo || '').trim();
    return hasItemOrGl ? '' : 'To be mapped later';
  }

  trackByLine(index: number, line: DocumentImportLine): string {
    return line.systemId || String(line.lineNo || index);
  }

  private getNextLineNo(): number {
    const maxLineNo = this.lines.reduce((max, line) => Math.max(max, Number(line.lineNo || 0)), 0);
    return maxLineNo ? maxLineNo + 10000 : 10000;
  }

  private stripMappingOnlyError(errorMessage?: string): string {
    const error = String(errorMessage || '').trim();
    if (!error) {
      return '';
    }

    const normalized = error.toLowerCase();
    if (
      normalized.includes('vendor mapping') ||
      normalized.includes('vendorno') ||
      normalized.includes('item or g/l') ||
      normalized.includes('item or gl') ||
      normalized.includes('g/l account is required') ||
      normalized.includes('gl account is required') ||
      normalized.includes('map the vendor')
    ) {
      return '';
    }

    return error;
  }
}
