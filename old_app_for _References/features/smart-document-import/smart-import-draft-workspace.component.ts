import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  DocumentImportField,
  DocumentImportHeader,
  DocumentImportIssue,
  DocumentImportLine,
  DocumentImportLog,
  DocumentImportReviewIssue,
  FrontendOcrSubmissionPayload,
} from './document-import.models';
import { DocumentImportService } from './document-import.service';
import { UnifiedDialogService } from '../../core/services/shared/unified-dialog.service';

interface ReadinessItem {
  label: string;
  ready: boolean;
}

@Component({
  standalone: false,
  selector: 'app-smart-import-draft-workspace',
  templateUrl: './smart-import-draft-workspace.component.html',
  styleUrls: ['./smart-import-draft-workspace.component.scss'],
})
export class SmartImportDraftWorkspaceComponent implements OnInit {
  header: DocumentImportHeader | null = null;
  fields: DocumentImportField[] = [];
  lines: DocumentImportLine[] = [];
  logs: DocumentImportLog[] = [];
  issues: DocumentImportReviewIssue[] = [];
  loading = false;
  saving = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentImportService: DocumentImportService,
    private dialogService: UnifiedDialogService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const systemId = String(params.get('systemId') || '').trim();
      if (!systemId) {
        this.errorMessage = 'Document import systemId is missing.';
        this.header = null;
        return;
      }

      void this.loadWorkspace(systemId);
    });
  }

  get importSystemId(): string {
    return this.header?.systemId || '';
  }

  get importNoLabel(): string {
    return String(this.header?.importNo || '-');
  }

  get hasData(): boolean {
    return !!this.header;
  }

  get displayedIssues(): DocumentImportReviewIssue[] {
    return this.issues.slice(0, 5);
  }

  get targetLabel(): string {
    return this.humanize(String(this.header?.targetDocumentType || this.header?.createdDocumentType || '-'));
  }

  get headerTotal(): number {
    return (
      this.toNumber(this.headerValue(['TotalAmount', 'GrossValue', 'Amount'])) ??
      this.toNumber(this.header?.['totalAmount']) ??
      this.toNumber(this.header?.['amount']) ??
      0
    );
  }

  get lineTotal(): number {
    return this.lines.reduce((sum, line) => sum + (this.toNumber(line.lineAmount) ?? 0), 0);
  }

  get totalDifference(): number {
    return this.headerTotal - this.lineTotal;
  }

  get hasTotalDifference(): boolean {
    return Math.abs(this.totalDifference) > 0.01;
  }

  get validLineCount(): number {
    return this.lines.filter((line) => this.isLineValid(line)).length;
  }

  get blockingIssueCount(): number {
    return this.issues.filter((issue) => String(issue.severity || '').toLowerCase() === 'error').length;
  }

  get headerComplete(): boolean {
    return (
      !!this.headerValue(['DocumentNo', 'InvoiceNumber', 'PurchaseOrderNo', 'VendorInvoiceNo']) &&
      !!this.headerValue(['DocumentDate', 'InvoiceDate']) &&
      this.headerTotal > 0
    );
  }

  get isReadyForMatching(): boolean {
    return (
      this.headerComplete &&
      this.lines.length > 0 &&
      this.validLineCount === this.lines.length &&
      !this.hasTotalDifference &&
      this.blockingIssueCount === 0
    );
  }

  get readinessLabel(): string {
    return this.isReadyForMatching ? 'Ready for Matching' : 'Needs Review';
  }

  get readinessBadgeClass(): string {
    return this.isReadyForMatching
      ? 'status-chip status-chip--ready'
      : 'status-chip status-chip--review';
  }

  get effectiveStatusLabel(): string {
    if (this.isReadyForMatching) {
      return 'Ready For Matching';
    }

    return this.statusLabel(this.header?.status);
  }

  get effectiveStatusBadgeClass(): string {
    if (this.isReadyForMatching) {
      return 'status-chip status-chip--ready';
    }

    return this.statusBadgeClass(this.header?.status);
  }

  async reload(): Promise<void> {
    if (!this.importSystemId) {
      return;
    }

    await this.loadWorkspace(this.importSystemId);
  }

  async save(): Promise<void> {
    if (!this.importSystemId || this.saving) {
      return;
    }

    this.saving = true;

    try {
      this.normalizeLinesBeforeSave();

      const payload = this.buildPayload();
      console.log('[SmartImport][DraftWorkspace Save payload]', payload);

      const response = await firstValueFrom(this.documentImportService.submitFrontendExtraction(this.importSystemId, payload));
      console.log('[SmartImport][DraftWorkspace Save response]', response);

      const updatedStatus = String((response as Record<string, unknown> | null)?.['status'] || '').trim();

      if (this.header) {
        this.header.status = updatedStatus || (this.isReadyForMatching ? 'ReadyToCreate' : 'ReviewRequired');
      }

      await this.dialogService.showAlert('success', {
        title: 'Saved',
        text: this.isReadyForMatching
          ? 'Import draft saved and ready for matching.'
          : 'Import draft saved. Review is still required.',
      });
    } catch (error) {
      console.error('[SmartImport][DraftWorkspace Save error]', error);
      await this.dialogService.showAlert('error', {
        title: 'Save Failed',
        text: this.readError(error),
      });
    } finally {
      this.saving = false;
    }
  }

  addLine(): void {
    const nextLineNo = this.nextLineNo();

    const line: DocumentImportLine = {
      systemId: `new-${Date.now()}-${nextLineNo}`,
      importNo: this.importNoLabel,
      lineNo: nextLineNo,
      targetDocumentType: this.header?.targetDocumentType || 'PurchaseRequisition',
      itemNo: '',
      glAccountNo: '',
      description: '',
      quantity: 1,
      unitOfMeasure: '',
      unitCost: 0,
      lineAmount: 0,
      mappingStatus: 'Manual',
      confidenceScore: undefined,
      errorMessage: '',
    };

    line['assistantLineType'] = 'Item';
    line['validationStatus'] = 'Pending';
    line['isConfirmed'] = false;
    line['isManual'] = true;

    this.lines = [...this.lines, line];
  }

 deleteLine(line: DocumentImportLine): void {
  const confirmed = window.confirm(
    'Delete this line? This line will be removed from the import draft when you save changes.'
  );

  if (!confirmed) {
    return;
  }

  this.lines = this.lines.filter((item) => item !== line);
}

  recalculateLine(line: DocumentImportLine): void {
    const qty = this.toNumber(line.quantity);
    const unitCost = this.toNumber(line.unitCost);

    if (qty !== undefined && unitCost !== undefined) {
      line.lineAmount = Number((qty * unitCost).toFixed(2));
    }

    line['validationStatus'] = this.isLineValid(line) ? 'Valid' : 'Pending';
    line['isConfirmed'] = this.isLineValid(line);
  }

  backToList(): void {
    void this.router.navigate(['/purchase/smart-document-import/drafts']);
  }

  trackByField(_: number, item: DocumentImportField): string {
    return item.systemId || item.fieldCode || String(_);
  }

  trackByLine(index: number, item: DocumentImportLine): string {
    return item.systemId || String(item.lineNo || index);
  }

  trackByLog(index: number, item: DocumentImportLog): string {
    return item.systemId || String(index);
  }

  headerValue(codes: string[]): string {
    const field = this.findField(codes);
    const fieldValue = String(field?.correctedValue || field?.extractedValue || '').trim();

    if (fieldValue) {
      return fieldValue;
    }

    if (!this.header) {
      return '';
    }

    for (const code of codes) {
      const camel = this.toCamel(code);
      const directValue = this.header[camel] ?? this.header[code];

      if (directValue !== null && directValue !== undefined && String(directValue).trim()) {
        return String(directValue).trim();
      }
    }

    return '';
  }

  setHeaderValue(fieldCode: string, value: unknown): void {
    const text = value === null || value === undefined ? '' : String(value);
    let field = this.findField([fieldCode]);

    if (!field) {
      field = {
        systemId: `new-${this.importNoLabel}-${fieldCode}`,
        importNo: this.importNoLabel,
        fieldCode,
        fieldName: fieldCode,
        displayName: this.humanize(fieldCode),
        sourceLabel: this.humanize(fieldCode),
        extractedValue: '',
        correctedValue: text,
        isConfirmed: true,
        validationStatus: text ? 'Valid' : 'Pending',
      };

      this.fields = [...this.fields, field];
      return;
    }

    field.correctedValue = text;
    field.isConfirmed = true;
    field.validationStatus = text ? 'Valid' : 'Pending';
  }

  dateInputValue(value: string): string {
    const date = this.parseValidDate(value);
    return date ? date.toISOString().slice(0, 10) : '';
  }

  numberInputValue(value: string): number | null {
    const number = this.toNumber(value);
    return typeof number === 'number' ? number : null;
  }

  lineTypeOf(line: DocumentImportLine): string {
    return String(line['assistantLineType'] || line['lineType'] || 'Item');
  }

  setLineType(line: DocumentImportLine, value: string): void {
    line['assistantLineType'] = value;
    line['lineType'] = value;

    const type = value.toLowerCase();
    const currentCode = this.lineCodeOf(line);

    if (type.includes('g/l') || type.includes('account') || type.includes('expense') || type.includes('tax')) {
      line.glAccountNo = currentCode;
      line.itemNo = '';
    } else if (type === 'comment') {
      line.itemNo = '';
      line.glAccountNo = '';
    } else {
      line.itemNo = currentCode;
      line.glAccountNo = '';
    }

    this.recalculateLine(line);
  }

lineCodeOf(line: DocumentImportLine): string {
  return String(
    line.itemNo ||
      line.glAccountNo ||
      line['externalItemCode'] ||
      line['itemCode'] ||
      line['code'] ||
      line['Code'] ||
      line['no'] ||
      line['No'] ||
      line['accountNo'] ||
      line['AccountNo'] ||
      line['codeAccount'] ||
      line['codeOrAccount'] ||
      ''
  ).trim();
}

 setLineCode(line: DocumentImportLine, value: string): void {
  const type = this.lineTypeOf(line).toLowerCase();
  const text = String(value || '').trim();

  if (type.includes('g/l') || type.includes('account') || type.includes('expense') || type.includes('tax')) {
    line.glAccountNo = text;
    line.itemNo = '';
  } else if (type === 'comment') {
    line.itemNo = '';
    line.glAccountNo = '';
  } else {
    line.itemNo = text;
    line.glAccountNo = '';
  }

  line['externalItemCode'] = text;
  line['code'] = text;
  this.recalculateLine(line);
}

  lineHasIssue(line: DocumentImportLine): boolean {
    return !this.isLineValid(line) || !!String(line.errorMessage || '').trim();
  }

  lineStatusLabel(line: DocumentImportLine): string {
    const explicit = String(line['validationStatus'] || line.mappingStatus || '').trim();

    if (explicit && explicit !== 'Manual') {
      return this.humanize(explicit);
    }

    return this.isLineValid(line) ? 'Ready' : 'Needs Review';
  }

  lineStatusClass(line: DocumentImportLine): string {
    return this.isLineValid(line)
      ? 'status-chip status-chip--ready'
      : 'status-chip status-chip--review';
  }

  readinessItems(): ReadinessItem[] {
    const invalidCount = Math.max(this.lines.length - this.validLineCount, 0);

    return [
      {
        label: this.headerComplete ? 'Document header is complete' : 'Complete document number, date, and total amount',
        ready: this.headerComplete,
      },
      {
        label: this.lines.length
          ? `${this.lines.length} draft line${this.lines.length === 1 ? '' : 's'} available`
          : 'Add at least one draft line',
        ready: this.lines.length > 0,
      },
      {
        label: invalidCount === 0 && this.lines.length
          ? 'All draft lines are valid'
          : `${invalidCount} line${invalidCount === 1 ? '' : 's'} need review`,
        ready: invalidCount === 0 && this.lines.length > 0,
      },
      {
        label: this.hasTotalDifference ? 'Header total and line total are different' : 'Header total matches line total',
        ready: !this.hasTotalDifference,
      },
      {
        label: this.blockingIssueCount
          ? `${this.blockingIssueCount} blocking issue${this.blockingIssueCount === 1 ? '' : 's'}`
          : 'No blocking issues',
        ready: this.blockingIssueCount === 0,
      },
    ];
  }

  statusLabel(value?: unknown): string {
    return this.humanize(String(value || 'Uploaded'));
  }

  statusBadgeClass(value?: unknown): string {
    const status = String(value || '').replace(/\s+/g, '').toLowerCase();

    if (status.includes('ready')) {
      return 'status-chip status-chip--ready';
    }

    if (status.includes('created') || status.includes('matched') || status.includes('closed')) {
      return 'status-chip status-chip--success';
    }

    if (status.includes('failed') || status.includes('rejected') || status.includes('error')) {
      return 'status-chip status-chip--danger';
    }

    if (status.includes('review') || status.includes('saved')) {
      return 'status-chip status-chip--review';
    }

    return 'status-chip status-chip--neutral';
  }

  issueTitle(issue: DocumentImportReviewIssue): string {
    const scope = String(issue.scope || 'Issue');
    return issue.lineNo ? `${scope} line ${issue.lineNo}` : scope;
  }

  severityClass(issue: DocumentImportReviewIssue): string {
    switch (String(issue.severity || '').toLowerCase()) {
      case 'error':
        return 'issue-card issue-card--danger';
      case 'warning':
        return 'issue-card issue-card--warning';
      default:
        return 'issue-card';
    }
  }

  formatDate(value?: string): string {
    const date = this.parseValidDate(value);
    return date ? date.toLocaleString() : '-';
  }

  formatAmount(value?: number): string {
    return typeof value === 'number'
      ? value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '-';
  }

  private async loadWorkspace(systemId: string): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const data = await this.documentImportService.loadReviewData(systemId);
      this.header = data.header;
      this.fields = data.fields;
      this.lines = data.lines;
      this.logs = data.logs;
      this.issues = data.issues;
    } catch (error) {
      this.header = null;
      this.fields = [];
      this.lines = [];
      this.logs = [];
      this.issues = [];
      this.errorMessage = this.readError(error);
    } finally {
      this.loading = false;
    }
  }

  private buildPayload(): FrontendOcrSubmissionPayload {
    return {
      provider: String(this.header?.extractionProvider || 'frontend'),
      extractionMethod: String(this.header?.extractionMethod || 'tesseract') as 'pdfTextLayer' | 'tesseract',
      parserCode: String(this.header?.parserCode || ''),
      parserName: String(this.header?.parserName || ''),
      averageConfidence: typeof this.header?.confidenceScore === 'number' ? this.header.confidenceScore : undefined,
      extractedAtUtc: String(this.header?.extractedAtUtc || new Date().toISOString()),
      sourceFileName: this.header?.sourceFileName,
      sourceFileExtension: this.header?.sourceFileExtension,
      targetDocumentType: String(this.header?.targetDocumentType || 'PurchaseRequisition'),
      rawText: '',
      issues: this.issues.map((issue) => this.toPayloadIssue(issue)),
      logs: this.logs,
      fields: this.fields.map((field) => ({
        fieldCode: field.fieldCode,
        fieldName: field.fieldName,
        sourceLabel: field.sourceLabel,
        displayName: field.displayName,
        extractedValue: field.extractedValue,
        correctedValue: field.correctedValue,
        confidenceScore: field.confidenceScore,
        isRequired: field.isRequired,
        isConfirmed: field.isConfirmed,
        validationStatus: field.validationStatus,
        errorMessage: field.errorMessage,
        sourcePageNo: field.sourcePageNo,
        sourceText: field.sourceText,
      })),
      lines: this.lines.map((line) => ({
        lineNo: line.lineNo,
        itemNo: line.itemNo,
        glAccountNo: line.glAccountNo,
        description: line.description,
        quantity: this.toNumber(line.quantity),
        unitOfMeasure: line.unitOfMeasure,
        unitCost: this.toNumber(line.unitCost),
        lineAmount: this.toNumber(line.lineAmount),
        requiredDate: line.requiredDate,
        departmentCode: line.departmentCode,
        projectCode: line.projectCode,
        mappingStatus: String(line.mappingStatus || line['validationStatus'] || ''),
        confidenceScore: line.confidenceScore,
        errorMessage: line.errorMessage,
        sourcePageNo: line.sourcePageNo,
        sourceText: line.sourceText,
      })),
    };
  }

  private toPayloadIssue(issue: DocumentImportReviewIssue): DocumentImportIssue {
    return {
      scope: String(issue.scope || 'Header'),
      recordSystemId: issue.recordSystemId,
      fieldCode: issue.fieldCode,
      lineNo: issue.lineNo,
      severity: String(issue.severity || 'Info'),
      message: String(issue.message || ''),
      suggestedFix: issue.suggestedFix,
      sourcePageNo: issue.sourcePageNo,
      sourceText: issue.sourceText,
    };
  }

  private normalizeLinesBeforeSave(): void {
    this.lines = this.lines.map((line, index) => {
      const normalized = { ...line };
      normalized.lineNo = normalized.lineNo || (index + 1) * 10000;
      normalized.quantity = this.toNumber(normalized.quantity) ?? 0;
      normalized.unitCost = this.toNumber(normalized.unitCost) ?? 0;
      normalized.lineAmount = this.toNumber(normalized.lineAmount) ?? Number((normalized.quantity * normalized.unitCost).toFixed(2));
      normalized.mappingStatus = normalized.mappingStatus || 'Mapped';
      normalized['validationStatus'] = this.isLineValid(normalized) ? 'Valid' : 'Pending';
      normalized['isConfirmed'] = this.isLineValid(normalized);
      return normalized;
    });
  }

  private findField(codes: string[]): DocumentImportField | undefined {
    const normalizedCodes = codes.map((code) => this.normalize(code));

    return this.fields.find((field) => {
      const values = [
        field.fieldCode,
        field.fieldName,
        field.sourceLabel,
        field.displayName,
        field.targetFieldName,
      ].map((value) => this.normalize(value));

      return values.some((value) => normalizedCodes.includes(value));
    });
  }

  private isLineValid(line: DocumentImportLine): boolean {
    const description = String(line.description || '').trim();
    const quantity = this.toNumber(line.quantity);
    const amount = this.toNumber(line.lineAmount);

    return !!description && (quantity === undefined || quantity > 0) && (amount === undefined || amount >= 0);
  }

  private nextLineNo(): number {
    const maxLineNo = this.lines.reduce((max, line) => Math.max(max, this.toNumber(line.lineNo) || 0), 0);
    return maxLineNo > 0 ? maxLineNo + 10000 : 10000;
  }

  private parseValidDate(value?: unknown): Date | null {
    const text = String(value || '').trim();

    if (!text) {
      return null;
    }

    const date = new Date(text);

    if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1901) {
      return null;
    }

    return date;
  }

  private toNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const number = Number(String(value).replace(/,/g, ''));

    return Number.isNaN(number) ? undefined : number;
  }

  private normalize(value: unknown): string {
    return String(value || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  }

  private toCamel(value: string): string {
    return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
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

  private readError(error: unknown): string {
    const value = error as { error?: { error?: { message?: string }; message?: string }; message?: string };
    return value?.error?.error?.message || value?.error?.message || value?.message || 'Unable to process this import record.';
  }
}