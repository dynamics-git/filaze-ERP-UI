import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { DocumentImportHeader } from './document-import.models';
import { DocumentImportService } from './document-import.service';

@Component({
  standalone: false,
  selector: 'app-smart-import-drafts-list',
  templateUrl: './smart-import-drafts-list.component.html',
  styleUrls: ['./smart-import-drafts-list.component.scss'],
})
export class SmartImportDraftsListComponent implements OnInit {
  allImports: DocumentImportHeader[] = [];
  visibleImports: DocumentImportHeader[] = [];
  loading = false;
  statusFilter = 'all';
  searchTerm = '';
  errorMessage = '';

  constructor(
    private documentImportService: DocumentImportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    void this.loadImports();
  }

  get totalCount(): number {
    return this.allImports.length;
  }

  get reviewRequiredCount(): number {
    return this.allImports.filter((item) => this.statusKey(item) === 'ReviewRequired').length;
  }

  get readyToCreateCount(): number {
    return this.allImports.filter((item) => this.statusKey(item) === 'ReadyToCreate').length;
  }

  get draftCount(): number {
    return this.allImports.filter((item) => this.statusKey(item) === 'DraftCreated').length;
  }

  get reviewCount(): number {
    return this.reviewRequiredCount + this.readyToCreateCount;
  }

  get failedCount(): number {
    return this.allImports.filter((item) => {
      const status = this.statusKey(item);
      return status === 'Failed' || status === 'Rejected';
    }).length;
  }

  async loadImports(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const response = await firstValueFrom(this.documentImportService.listImports());
      this.allImports = this.documentImportService.normalizeHeaders(response);
      this.applyFilters();
    } catch (error) {
      this.allImports = [];
      this.visibleImports = [];
      this.errorMessage = this.readError(error);
    } finally {
      this.loading = false;
    }
  }

  setStatusFilter(value: string): void {
    this.statusFilter = value;
    this.applyFilters();
  }

  resetFilters(): void {
    this.statusFilter = 'all';
    this.searchTerm = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.statusFilter !== 'all' || !!this.searchTerm.trim();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  openWorkspace(item: DocumentImportHeader): void {
    if (!item.systemId) {
      return;
    }

    void this.router.navigate(['/purchase/smart-document-import/drafts', item.systemId]);
  }

  trackByImport(_: number, item: DocumentImportHeader): string {
    return item.systemId || item.importNo || String(_);
  }

  importNoOf(item: DocumentImportHeader): string {
    return this.readString(item, ['importNo', 'ImportNo', 'No']) || '-';
  }

  sourceFileOf(item: DocumentImportHeader): string {
    return this.readString(item, ['sourceFileName', 'SourceFileName', 'uploadedFileName', 'UploadedFileName']) || '-';
  }

  sourceNameOf(item: DocumentImportHeader): string {
    return (
      this.readString(item, [
        'supplierName',
        'SupplierName',
        'vendorName',
        'VendorName',
        'sourceName',
        'SourceName',
        'vendorNo',
        'VendorNo',
        'supplierNo',
        'SupplierNo',
      ]) || '-'
    );
  }

  currencyOf(item: DocumentImportHeader): string {
    return this.readString(item, ['currencyCode', 'CurrencyCode', 'currency', 'Currency']) || '-';
  }

  documentNoOf(item: DocumentImportHeader): string {
    return (
      this.readString(item, [
        'createdDocumentNo',
        'CreatedDocumentNo',
        'sourceDocumentNo',
        'SourceDocumentNo',
        'vendorInvoiceNo',
        'VendorInvoiceNo',
        'purchaseOrderNo',
        'PurchaseOrderNo',
      ]) || '-'
    );
  }

  documentDateOf(item: DocumentImportHeader): string | undefined {
    return this.readString(item, ['documentDate', 'DocumentDate', 'invoiceDate', 'InvoiceDate', 'postingDate', 'PostingDate']);
  }

  updatedDateOf(item: DocumentImportHeader): string | undefined {
    return this.readString(item, [
      'modifiedDateTime',
      'ModifiedDateTime',
      'lastModifiedDateTime',
      'LastModifiedDateTime',
      'createdDateTime',
      'CreatedDateTime',
      'systemModifiedAt',
      'SystemModifiedAt',
      'systemCreatedAt',
      'SystemCreatedAt',
    ]);
  }

  amountOf(item: DocumentImportHeader): number | undefined {
    return this.readNumber(item, [
      'totalAmount',
      'TotalAmount',
      'amount',
      'Amount',
      'documentAmount',
      'DocumentAmount',
      'matchedAmount',
      'MatchedAmount',
    ]);
  }

  targetLabel(item: DocumentImportHeader): string {
    const value =
      this.readString(item, ['targetDocumentType', 'TargetDocumentType', 'createdDocumentType', 'CreatedDocumentType']) ||
      '-';

    return this.humanize(value);
  }

  statusOf(item: DocumentImportHeader): string {
    return this.statusKey(item);
  }

  statusLabel(item: DocumentImportHeader): string {
    return this.humanize(this.statusKey(item));
  }

  badgeClass(item: DocumentImportHeader): string {
    switch (this.statusKey(item)) {
      case 'DraftCreated':
      case 'Created':
        return 'status-chip status-chip--draft';
      case 'ReadyToCreate':
        return 'status-chip status-chip--ready';
      case 'ReviewRequired':
      case 'OCRCompleted':
      case 'Saved':
        return 'status-chip status-chip--review';
      case 'Failed':
      case 'Rejected':
        return 'status-chip status-chip--danger';
      case 'Uploaded':
      default:
        return 'status-chip status-chip--uploaded';
    }
  }

  formatDateOnly(value?: string): string {
    const date = this.parseValidDate(value);
    if (!date) {
      return '-';
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  formatDateShort(value?: string): string {
    const date = this.parseValidDate(value);
    if (!date) {
      return '-';
    }

    return date.toLocaleDateString(undefined, {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  }

  formatTimeShort(value?: string): string {
    const date = this.parseValidDate(value);
    if (!date) {
      return '';
    }

    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDate(value?: string): string {
    const date = this.parseValidDate(value);
    if (!date) {
      return '-';
    }

    return date.toLocaleString();
  }

  formatAmount(value?: number): string {
    return typeof value === 'number'
      ? value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '-';
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.visibleImports = this.allImports.filter((item) => {
      if (!this.matchesStatusFilter(item)) {
        return false;
      }

      if (!term) {
        return true;
      }

      const haystack = [
        this.importNoOf(item),
        this.sourceNameOf(item),
        this.sourceFileOf(item),
        this.documentNoOf(item),
        this.statusLabel(item),
        this.targetLabel(item),
        this.currencyOf(item),
        this.readString(item, ['parserName', 'ParserName', 'parserCode', 'ParserCode']),
        this.readString(item, ['errorMessage', 'ErrorMessage']),
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');

      return haystack.includes(term);
    });
  }

  private matchesStatusFilter(item: DocumentImportHeader): boolean {
    const status = this.statusKey(item);

    if (this.statusFilter === 'all') {
      return true;
    }

    if (this.statusFilter === 'FailedOrRejected') {
      return status === 'Failed' || status === 'Rejected';
    }

    return status === this.statusFilter;
  }

  private statusKey(item: DocumentImportHeader): string {
    const raw = this.readString(item, ['status', 'Status']) || 'Uploaded';
    const normalized = raw.replace(/\s+/g, '').replace(/_/g, '').trim();

    switch (normalized.toLowerCase()) {
      case 'reviewrequired':
      case 'review':
        return 'ReviewRequired';
      case 'readytocreate':
      case 'ready':
        return 'ReadyToCreate';
      case 'draftcreated':
      case 'created':
        return 'DraftCreated';
      case 'ocrcompleted':
        return 'OCRCompleted';
      case 'saved':
        return 'Saved';
      case 'rejected':
        return 'Rejected';
      case 'failed':
        return 'Failed';
      case 'uploaded':
      default:
        return normalized || 'Uploaded';
    }
  }

  private humanize(value: string): string {
    const text = String(value || '').trim();
    if (!text || text === '-') {
      return '-';
    }

    return text
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private parseValidDate(value?: string): Date | null {
    const text = String(value || '').trim();

    if (!text) {
      return null;
    }

    const date = new Date(text);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    // Business Central blank dates often arrive as 0001-01-01.
    if (date.getFullYear() <= 1901) {
      return null;
    }

    return date;
  }

  private readError(error: unknown): string {
    const value = error as { error?: { error?: { message?: string }; message?: string }; message?: string };
    return value?.error?.error?.message || value?.error?.message || value?.message || 'Unable to load import drafts.';
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = source[key];

      if (value === null || value === undefined) {
        continue;
      }

      const text = String(value).trim();

      if (text) {
        return text;
      }
    }

    return undefined;
  }

  private readNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
      const value = source[key];

      if (value === null || value === undefined || value === '') {
        continue;
      }

      const parsed = Number(value);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return undefined;
  }
}