import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { SessionService } from '../../core/services/session.service';
import { UnifiedDialogService } from '../../core/services/shared/unified-dialog.service';
import {
  DocumentMappingResult,
  LineMappingSuggestion,
  MappingCandidate,
  NormalizedPurchaseDraft,
} from './document-platform-connector.interface';
import {
  DocumentExtractionMethod,
  DocumentImportField,
  DocumentImportReviewIssue,
  DocumentOcrProvider,
  ExtractedDocumentPage,
  ExtractedTextRow,
  FrontendOcrSubmissionPayload,
  DocumentImportHeader,
  DocumentImportLine,
  DocumentImportLog,
  SmartImportTemplate,
  SmartImportDocumentType,
  SmartImportStatus,
} from './document-import.models';
import { DocumentOcrService } from './document-ocr.service';
import { DocumentImportService } from './document-import.service';
import { DocumentTemplateBuilderService } from './document-template-builder.service';

interface ReviewIssue {
  scope: 'Header' | 'Line';
  severity: 'danger' | 'warning' | 'info';
  title: string;
  detail: string;
  suggestedFix?: string;
}

type ReviewTab = 'header' | 'lines' | 'template' | 'advanced';

interface AssistantHeaderField {
  code: string;
  label: string;
  aliases: string[];
  inputType: 'text' | 'date' | 'number';
}

interface AssistantHeaderFieldRow {
  definition: AssistantHeaderField;
  field: DocumentImportField;
}

interface ConfirmedLineMapping {
  item?: MappingCandidate;
  gl?: MappingCandidate;
}

type MappableLineField =
  'externalItemCode'
  | 'itemNo'
  | 'glAccountNo'
  | 'description'
  | 'quantity'
  | 'unitOfMeasure'
  | 'unitCost'
  | 'lineAmount'
  | 'requiredDate'
  | 'departmentCode';

type AssistantLineType = 'Item' | 'G/L Account' | 'Service' | 'Expense' | 'Tax' | 'Discount';

interface MappingTarget {
  scope: 'header' | 'line' | 'lineRow';
  label: string;
  fieldCode?: string;
  lineIndex?: number;
  lineField?: MappableLineField;
}

interface ParsedLineDraft {
  lineType?: AssistantLineType;
  externalItemCode?: string;
  description?: string;
  quantity?: number;
  unitOfMeasure?: string;
  unitCost?: number;
  lineAmount?: number;
}

interface SourceDisplayRow {
  key: string;
  pageNo: number;
  text: string;
  tokens: string[];
  row: ExtractedTextRow;
}

interface SourceCandidate {
  key: string;
  value: string;
  context: string;
  pageNo: number;
  row: ExtractedTextRow;
  score: number;
}

@Component({
  standalone: false,
  selector: 'app-smart-document-import',
  templateUrl: './smart-document-import.component.html',
  styleUrls: ['./smart-document-import.component.scss'],
})
export class SmartDocumentImportComponent implements OnDestroy, OnInit {
  readonly assistantLineTypes: AssistantLineType[] = ['Item', 'G/L Account', 'Service', 'Expense', 'Tax', 'Discount'];
  readonly targetDocumentType: SmartImportDocumentType = 'PurchaseRequisition';
  readonly allowedStatusesForCreate: SmartImportStatus[] = ['ReadyToCreate', 'ReviewRequired'];
  readonly allowedStatusesForAnalyze: SmartImportStatus[] = ['Uploaded'];
  readonly allowedStatusesForSave: SmartImportStatus[] = ['ReviewRequired', 'ReadyToCreate'];
  readonly assistantHeaderFields: AssistantHeaderField[] = [
    { code: 'DocumentNo', label: 'Document No', aliases: ['DocumentNo', 'OrderNo', 'PONo', 'PurchaseOrderNo', 'InvoiceNo'], inputType: 'text' },
    { code: 'DocumentDate', label: 'Document Date', aliases: ['DocumentDate', 'OrderDate', 'InvoiceDate'], inputType: 'date' },
    { code: 'SupplierNumber', label: 'Supplier Number', aliases: ['SupplierNumber', 'VendorNumber', 'VendorCode', 'CompanyNumber', 'SupplierCode'], inputType: 'text' }, 
    { code: 'SupplierName', label: 'Supplier Name', aliases: ['SupplierName', 'VendorName', 'CompanyName'], inputType: 'text' },
    { code: 'RequiredDate', label: 'Required Date', aliases: ['RequiredDate', 'DeliverDate', 'DeliveryDate', 'DueDate'], inputType: 'date' },
    { code: 'CurrencyCode', label: 'Currency', aliases: ['CurrencyCode', 'Currency'], inputType: 'text' },
    { code: 'TotalAmount', label: 'Total Amount', aliases: ['TotalAmount', 'GrandTotal', 'Amount'], inputType: 'text' },
  ];

  selectedFile: File | null = null;
  selectedFileName = '';
  selectedFileMimeType = '';
  previewUrl: string | null = null;
  ocrRawText = '';
  ocrProvider: DocumentOcrProvider = 'frontend';
  ocrExtractionMethod: DocumentExtractionMethod | '' = '';
  ocrParserCode = '';
  ocrParserName = '';
  ocrAverageConfidence = 0;
  ocrPages: ExtractedDocumentPage[] = [];

  header: DocumentImportHeader | null = null;
  fields: DocumentImportField[] = [];
  lines: DocumentImportLine[] = [];
  logs: DocumentImportLog[] = [];
  backendReviewIssues: DocumentImportReviewIssue[] = [];
  frontendReviewIssues: DocumentImportReviewIssue[] = [];

  busyUpload = false;
  busyAnalyze = false;
  busySave = false;
  busyCreate = false;
  busyReject = false;
  busyMapping = false;
  busyTemplate = false;
  rightPanelWidthPercent = 42;
  isResizingHeaderPanel = false;
  activeReviewTab: ReviewTab = 'header';
  mappingResult: DocumentMappingResult | null = null;
  selectedSupplierMapping: MappingCandidate | null = null;
  selectedLineMappings: Partial<Record<number, ConfirmedLineMapping>> = {};
  lastAppliedTemplateName = '';
  activeMappingTarget: MappingTarget | null = null;
  assistantHeaderFieldRows: AssistantHeaderFieldRow[] = [];
  assistantHeaderValues: Record<string, string> = {};

  private resizeMoveListener?: (event: PointerEvent) => void;
  private resizeEndListener?: () => void;

  constructor(
    private documentImportService: DocumentImportService,
    private documentOcrService: DocumentOcrService,
    private documentTemplateBuilderService: DocumentTemplateBuilderService,
    private dialogService: UnifiedDialogService,
    private sessionService: SessionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    void this.refreshAvailableTemplates();
  }

  ngOnDestroy(): void {
    this.endPanelResize();
    this.releasePreviewUrl();
  }

  get currentStatus(): SmartImportStatus | '' {
    return (this.header?.status as SmartImportStatus) || '';
  }

  get importSystemId(): string {
    return this.header?.systemId || '';
  }

  get importNo(): string {
    return this.header?.importNo || '';
  }

  get isBusy(): boolean {
    return this.busyUpload || this.busyAnalyze || this.busySave || this.busyCreate || this.busyReject || this.busyMapping || this.busyTemplate;
  }

  get availableTemplateCount(): number {
    return this.documentTemplateBuilderService.listTemplates(this.targetDocumentType).length;
  }

  get canSaveTemplate(): boolean {
    return !!this.fields.length && !this.busyAnalyze && !this.busyTemplate && !this.busySave;
  }

  get canApplyTemplate(): boolean {
    return !!this.fields.length && this.availableTemplateCount > 0 && !this.busyAnalyze && !this.busyTemplate;
  }

  get templateServiceStatusMessage(): string {
    return this.documentTemplateBuilderService.availabilityMessage;
  }

  get sourceRows(): ExtractedTextRow[] {
    return this.ocrPages
      .flatMap((page) => page.rows || [])
      .filter((row) => !!String(row.text || '').trim())
      .slice(0, 180);
  }

  get sourceDisplayRows(): SourceDisplayRow[] {
    const rows = this.sourceRows;
    const deduped: SourceDisplayRow[] = [];
    const seen = new Set<string>();

    rows.forEach((row, index) => {
      const text = String(row.text || '').replace(/\s+/g, ' ').trim();
      if (!text || this.isNoiseRow(text)) {
        return;
      }

      const key = `${row.pageNo}-${this.normalizeRowText(text)}`;
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      deduped.push({
        key: `${key}-${index}`,
        pageNo: row.pageNo,
        text,
        tokens: this.extractDisplayTokens(row, text),
        row,
      });
    });

    return deduped;
  }

  get hasSourceRows(): boolean {
    return this.sourceDisplayRows.length > 0;
  }

  get showSourcePicker(): boolean {
    return !!this.activeMappingTarget;
  }

  get activeMappingTargetLabel(): string {
    return this.activeMappingTarget?.label || 'No target selected';
  }

  get sourceCandidateTitle(): string {
    if (this.activeMappingTarget?.scope === 'lineRow') {
      return `Suggestions for ${this.activeMappingTarget.label} Source Row`;
    }

    return `Suggestions for ${this.activeMappingTargetLabel}`;
  }

  get suggestedSourceCandidates(): SourceCandidate[] {
    return this.sourceCandidates.slice(0, 5);
  }

  get otherSourceCandidates(): SourceCandidate[] {
    return this.sourceCandidates.slice(5, 14);
  }

  get sourceCandidates(): SourceCandidate[] {
    if (!this.activeMappingTarget) {
      return [];
    }

    const candidates: SourceCandidate[] = [];
    const seen = new Set<string>();

    this.getCandidateRowsForTarget().forEach((row) => {
      this.extractCandidateValuesForTarget(row).forEach((candidate) => {
        const key = `${candidate.pageNo}-${this.normalizeRowText(candidate.value)}-${this.normalizeRowText(candidate.context)}`;
        if (seen.has(key) || this.isBrokenCandidate(candidate.value)) {
          return;
        }

        seen.add(key);
        candidates.push({ ...candidate, key });
      });
    });

    const sortedCandidates = candidates
      .sort((a, b) => b.score - a.score || a.pageNo - b.pageNo)
      .slice(0, 24);

    return sortedCandidates;
  }

  private getCandidateRowsForTarget(): ExtractedTextRow[] {
    const target = this.activeMappingTarget;
    if (!target) {
      return this.sourceRows;
    }

    if (target.scope === 'header') {
      return this.sourceRows;
    }

    if (target.scope === 'lineRow') {
      const tableBodyRows = this.extractLikelyTableBodyRows(this.sourceRows);
      return tableBodyRows.length ? tableBodyRows : [];
    }

    const line = this.lines[Number(target.lineIndex)];
    if (!line) {
      return this.sourceRows;
    }

    const preferredPageNo = Number(line.sourcePageNo);
    const preferredText = this.normalizeRowText(String(line.sourceText || ''));
    const scopedRows = this.sourceRows.filter((row) => this.isRowRelevantToLine(row, preferredPageNo, preferredText));
    const candidateRows = scopedRows.length ? scopedRows : this.sourceRows;

    return [...candidateRows].sort((left, right) => {
      const leftScore = this.lineRowPriority(left, preferredPageNo, preferredText);
      const rightScore = this.lineRowPriority(right, preferredPageNo, preferredText);
      return rightScore - leftScore || left.pageNo - right.pageNo || left.y - right.y;
    });
  }

  get canAnalyze(): boolean {
    if (!this.selectedFile || this.busyAnalyze || this.busyUpload) {
      return false;
    }

    const status = this.currentStatus;
    if (!status) {
      return true;
    }

    if (status === 'Created' || status === 'Rejected') {
      return false;
    }

    return this.allowedStatusesForAnalyze.includes(status) || status === 'ReviewRequired' || status === 'ReadyToCreate';
  }

  get canSaveCorrections(): boolean {
    if (!this.importSystemId || this.busySave || this.busyCreate || this.busyAnalyze) {
      return false;
    }

    if (!this.fields.length && !this.lines.length) {
      return false;
    }

    const status = this.currentStatus;
    return !['Created', 'Rejected'].includes(status);
  }

  get canCreateDraft(): boolean {
    const status = this.currentStatus;
    const statusAllowed = status ? this.allowedStatusesForCreate.includes(status) : false;
    return statusAllowed && this.reviewDataValid && !this.busyCreate && !this.busyAnalyze;
  }

  get canReject(): boolean {
    if (!this.importSystemId || this.busyReject) {
      return false;
    }

    return !['Created', 'Rejected'].includes(this.currentStatus);
  }

  get canOpenCreatedDocument(): boolean {
    return !!(this.header?.createdDocumentNo && this.currentStatus === 'Created');
  }

  get displayStatus(): string {
    return this.getFriendlyStatus(this.currentStatus || '');
  }

  get displayTargetDocument(): string {
    return this.getFriendlyTarget(this.header?.targetDocumentType || this.targetDocumentType);
  }

  get displayUploadedFile(): string {
    return this.selectedFileName || this.header?.sourceFileName || '-';
  }

  get overallConfidence(): string {
    const scores = [...this.fields, ...this.lines]
      .map((item) => Number(item.confidenceScore))
      .filter((value) => !Number.isNaN(value) && value >= 0);

    if (!scores.length) {
      return 'N/A';
    }

    const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    return `${Math.round(average * 100)}%`;
  }

  get currentBusyLabel(): string {
    if (this.busyUpload) {
      return 'Uploading PDF';
    }

    if (this.busyAnalyze) {
      return 'Running OCR extraction';
    }

    if (this.busyMapping) {
      return 'Suggesting mappings';
    }

    if (this.busySave) {
      return 'Saving corrections';
    }

    if (this.busyCreate) {
      return 'Creating draft';
    }

    if (this.busyReject) {
      return 'Rejecting import';
    }

    if (this.busyTemplate) {
      return 'Applying template';
    }

    return 'Working';
  }

  get isUploadedMode(): boolean {
    return this.currentStatus === 'Uploaded' && !this.fields.length;
  }

  get isReviewMode(): boolean {
    return ['ReviewRequired', 'ReadyToCreate', 'Created'].includes(this.currentStatus) || this.fields.length > 0;
  }

  get showAnalyzeGuidance(): boolean {
    return this.currentStatus === 'Uploaded' && !this.fields.length;
  }

  get showNoFieldsReturned(): boolean {
    return this.isReviewMode && !this.fields.length && !this.busyAnalyze;
  }

  get rightPanelWidthStyle(): string {
    return `${this.showAnalyzeGuidance ? 30 : this.rightPanelWidthPercent}%`;
  }

  get reviewIssues(): ReviewIssue[] {
    if (this.backendReviewIssues.length) {
      return this.backendReviewIssues
        .filter((issue) => !this.isMappingOnlyIssue(issue))
        .map((issue) => this.mapBackendReviewIssue(issue));
    }

    const issues: ReviewIssue[] = this.frontendReviewIssues
      .filter((issue) => !this.isMappingOnlyIssue(issue))
      .map((issue) => this.mapBackendReviewIssue(issue));

    this.fields.forEach((field) => {
      if (this.isMappingOnlyField(field)) {
        return;
      }

      const title = this.getFieldDisplayName(field);
      const value = (field.correctedValue || field.extractedValue || '').trim();
      const status = (field.validationStatus || '').toLowerCase();
      const error = (field.errorMessage || '').trim();

      if (field.isRequired && !value) {
        this.pushReviewIssue(issues, { scope: 'Header', severity: 'danger', title, detail: 'Required value is missing' });
        return;
      }

      if (status === 'invalid' || status === 'error') {
        this.pushReviewIssue(issues, { scope: 'Header', severity: 'danger', title, detail: this.getFriendlyValidationStatus(field.validationStatus) });
        return;
      }

      if (error) {
        this.pushReviewIssue(issues, { scope: 'Header', severity: 'danger', title, detail: error });
        return;
      }

      if (typeof field.confidenceScore === 'number' && field.confidenceScore < 0.6) {
        this.pushReviewIssue(issues, { scope: 'Header', severity: 'warning', title, detail: `${Math.round(field.confidenceScore * 100)}% confidence` });
      }
    });

    this.lines.forEach((line, index) => {
      const title = `Line ${line.lineNo || (index + 1) * 10000}`;
      const error = this.stripMappingOnlyError(line.errorMessage);
      const hasDescription = !!(line.description || '').trim();
      const hasQuantity = Number(line.quantity || 0) > 0;
      const hasAmountOrUnitCost = Number(line.lineAmount || 0) > 0 || Number(line.unitCost || 0) > 0;

      if (error) {
        this.pushReviewIssue(issues, { scope: 'Line', severity: 'danger', title, detail: error });
        return;
      }

      if (!hasDescription) {
        this.pushReviewIssue(issues, { scope: 'Line', severity: 'danger', title, detail: 'Description is required' });
        return;
      }

      if (!hasQuantity) {
        this.pushReviewIssue(issues, { scope: 'Line', severity: 'danger', title, detail: 'Quantity must be greater than zero' });
        return;
      }

      if (!hasAmountOrUnitCost) {
        this.pushReviewIssue(issues, { scope: 'Line', severity: 'danger', title, detail: 'Unit cost or line amount is required' });
        return;
      }

      if (typeof line.confidenceScore === 'number' && line.confidenceScore < 0.6) {
        this.pushReviewIssue(issues, { scope: 'Line', severity: 'warning', title, detail: `${Math.round(line.confidenceScore * 100)}% confidence` });
      }
    });

    return issues;
  }

  get visibleReviewIssues(): ReviewIssue[] {
    return this.reviewIssues.slice(0, 3);
  }

  get hiddenReviewIssueCount(): number {
    return Math.max(this.reviewIssues.length - this.visibleReviewIssues.length, 0);
  }

  get reviewIssueSummary(): string {
    const issues = this.reviewIssues;
    const blockingCount = issues.filter((issue) => issue.severity === 'danger').length;
    const warningCount = issues.filter((issue) => issue.severity === 'warning').length;

    if (blockingCount) {
      return `${blockingCount} blocking issue${blockingCount === 1 ? '' : 's'}`;
    }

    if (warningCount) {
      return `${warningCount} warning${warningCount === 1 ? '' : 's'}`;
    }

    return `${issues.length} info item${issues.length === 1 ? '' : 's'}`;
  }

  get primaryReviewIssueSeverity(): 'danger' | 'warning' | 'info' {
    return this.reviewIssues[0]?.severity || 'warning';
  }

  get reviewReadinessText(): string {
    if (!this.fields.length && !this.lines.length) {
      return 'Analyze the PDF to populate review data.';
    }

    if (!this.reviewIssues.length) {
      return 'Header and line data look ready for draft creation.';
    }

    return 'Resolve these before creating the draft document.';
  }

  get reviewedHeaderCount(): number {
    return this.fields.filter((field) => field.isConfirmed || (field.correctedValue || field.extractedValue || '').trim()).length;
  }

  get linesWithIssuesCount(): number {
    return this.reviewIssues.filter((issue) => issue.scope === 'Line' && issue.severity === 'danger').length;
  }

  get mappingIssues(): string[] {
    return this.mappingResult?.issues || [];
  }

  get extractedSupplierName(): string {
    return this.getFieldValue(['SupplierName', 'VendorName', 'CompanyName']);
  }

  get supplierCandidates(): MappingCandidate[] {
    return this.mappingResult?.supplierCandidates || [];
  }

  get lineMappingSuggestions(): LineMappingSuggestion[] {
    return this.mappingResult?.lineSuggestions || [];
  }

  get workflowStep(): number {
    switch (this.currentStatus) {
      case 'Uploaded':
        return 1;
      case 'OCRProcessing':
      case 'Analyzing':
        return 2;
      case 'ReviewRequired':
      case 'ReadyToCreate':
        return 3;
      case 'Created':
        return 5;
      case 'Rejected':
      case 'Failed':
      default:
        return this.importSystemId ? 2 : 1;
    }
  }

  get workflowSteps(): Array<{ label: string; index: number }> {
    return [
      { label: 'Upload', index: 1 },
      { label: 'Analyze', index: 2 },
      { label: 'Review', index: 3 },
      { label: 'Create Draft', index: 4 },
      { label: 'Open Document', index: 5 },
    ];
  }

  get reviewDataValid(): boolean {
    if (!this.fields.length || !this.lines.length) {
      return false;
    }

    if ([...this.backendReviewIssues, ...this.frontendReviewIssues]
      .filter((issue) => !this.isMappingOnlyIssue(issue))
      .some((issue) => this.mapBackendSeverity(issue.severity) === 'danger')) {
      return false;
    }

    const headerValid = this.fields.every((field) => {
      if (this.isMappingOnlyField(field)) {
        return true;
      }

      if (field.isRequired) {
        const value = (field.correctedValue || field.extractedValue || '').trim();
        if (!value) {
          return false;
        }
      }

      const status = (field.validationStatus || '').toLowerCase();
      if (status === 'invalid' || status === 'error') {
        return false;
      }

      return !(field.errorMessage || '').trim();
    });

    const lineValid = this.lines.every((line) => {
      const hasDescription = !!(line.description || '').trim();
      const hasQuantity = Number(line.quantity || 0) > 0;
      const hasAmountOrUnitCost = Number(line.lineAmount || 0) > 0 || Number(line.unitCost || 0) > 0;
      const hasNoError = !this.stripMappingOnlyError(line.errorMessage);

      return hasDescription && hasQuantity && hasAmountOrUnitCost && hasNoError;
    });

    return headerValid && lineValid;
  }

  async onFileSelected(file: File): Promise<void> {
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      await this.dialogService.showAlert('warning', {
        title: 'Invalid File',
        text: 'Only PDF and image files are supported in Phase 1.',
      });
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.selectedFileMimeType = file.type;
    this.header = null;
    this.fields = [];
    this.lines = [];
    this.logs = [];
    this.backendReviewIssues = [];
    this.frontendReviewIssues = [];
    this.resetMappingState();
    this.ocrRawText = '';
    this.ocrExtractionMethod = '';
    this.ocrParserCode = '';
    this.ocrParserName = '';
    this.ocrAverageConfidence = 0;
    this.ocrPages = [];
    this.lastAppliedTemplateName = '';
    this.rebuildAssistantHeaderRows();
    this.rebuildAssistantHeaderValues();
    this.setPreviewUrl(URL.createObjectURL(file));
  }

  async uploadDocument(): Promise<void> {
    await this.uploadDocumentInternal(true);
  }

  private async uploadDocumentInternal(showSuccessAlert: boolean): Promise<void> {
    if (!this.selectedFile) {
      await this.dialogService.showAlert('warning', {
        title: 'Missing File',
        text: 'Please select a PDF file before uploading.',
      });
      return;
    }

    this.busyUpload = true;

    try {
      const extension = this.getFileExtension(this.selectedFile.name);

      const payload = {
        targetDocumentType: this.targetDocumentType,
        sourceFileName: this.selectedFile.name,
        sourceFileExtension: extension,
        requesterUserId: this.sessionService.UserId,
      };

      const uploadedHeader = await this.documentImportService.uploadDocumentWithFile(payload, this.selectedFile);
      this.header = this.header ? { ...this.header, ...uploadedHeader } : uploadedHeader;
      this.fields = [];
      this.lines = [];
      this.logs = [];
      this.backendReviewIssues = [];
      this.frontendReviewIssues = [];
      this.resetMappingState();
      this.ocrRawText = '';
      this.ocrExtractionMethod = '';
      this.ocrParserCode = '';
      this.ocrParserName = '';
      this.ocrAverageConfidence = 0;
      this.ocrPages = [];

      if (showSuccessAlert) {
        await this.dialogService.showAlert('success', {
          title: 'Uploaded',
          text: `Document uploaded as import ${this.header.importNo || ''}.`,
        });
      }
    } catch (error) {
      await this.showBackendError(error, 'Upload Failed');
    } finally {
      this.busyUpload = false;
    }
  }

  async analyzeDocument(): Promise<void> {
    if (!this.selectedFile) {
      await this.dialogService.showAlert('warning', {
        title: 'Source File Required',
        text: 'Select the PDF/image again before running OCR analysis.',
      });
      return;
    }

    if (!this.canAnalyze) {
      await this.dialogService.showAlert('warning', {
        title: 'OCR Analyze Not Allowed',
        text: 'Current status does not allow OCR analysis. Start a new import if this record is already finalized.',
      });
      return;
    }

    this.busyAnalyze = true;

    try {
      if (!this.importSystemId) {
        const extension = this.getFileExtension(this.selectedFile.name);
        const createdRaw = await firstValueFrom(this.documentImportService.uploadDocument({
          targetDocumentType: this.targetDocumentType,
          sourceFileName: this.selectedFile.name,
          sourceFileExtension: extension,
          requesterUserId: this.sessionService.UserId,
        }));

        this.header = this.documentImportService.normalizeHeader(createdRaw as DocumentImportHeader);
      }

      if (this.header) {
        this.header.status = 'OCRProcessing';
      }

      const extraction = await this.documentOcrService.extractDocument(this.selectedFile, this.targetDocumentType);

      this.ocrProvider = extraction.provider;
      this.ocrExtractionMethod = extraction.extractionMethod;
      this.ocrParserCode = extraction.parserCode;
      this.ocrParserName = extraction.parserName || extraction.parserCode;
      this.ocrAverageConfidence = extraction.averageConfidence;
      this.ocrPages = Array.isArray(extraction.pages) ? extraction.pages : [];
      this.ocrRawText = extraction.rawText || '';
      this.fields = Array.isArray(extraction.fields) ? extraction.fields : [];
      this.lines = Array.isArray(extraction.lines) ? extraction.lines : [];
      this.rebuildAssistantHeaderValues();
      const templateApply = await this.documentTemplateBuilderService.applyBestTemplate(
        this.targetDocumentType,
        extraction.parserCode,
        this.fields,
        this.lines,
        this.ocrRawText
      );
      this.fields = templateApply.fields;
      this.lines = templateApply.lines;
      this.rebuildAssistantHeaderRows();
      this.rebuildAssistantHeaderValues();
      this.lastAppliedTemplateName = templateApply.template?.name || '';
      this.activeMappingTarget = null;
      this.backendReviewIssues = [];
      this.frontendReviewIssues = extraction.issues;
      this.logs = [
        {
          systemId: `local-log-${Date.now()}`,
          importNo: this.importNo,
          timestamp: new Date().toISOString(),
          level: 'Info',
          message: `OCR completed using ${this.ocrExtractionMethod}. Parser ${this.ocrParserCode} produced ${this.fields.length} header field(s) and ${this.lines.length} line(s).`,
        },
        ...(Array.isArray(extraction.diagnostics) ? extraction.diagnostics : []).map((message, index) => ({
          systemId: `local-log-${Date.now()}-${index}`,
          importNo: this.importNo,
          timestamp: new Date().toISOString(),
          level: 'Info',
          message,
        })),
      ];

      if (templateApply.template) {
        this.addLocalLog(`Template matched: ${templateApply.template.name || templateApply.template.templateName}`);
        if (templateApply.appliedFieldCount > 0 || templateApply.appliedLineCount > 0) {
          this.addLocalLog(
            `Template \"${templateApply.template.name}\" auto-applied ${templateApply.appliedFieldCount} header mapping(s) and ${templateApply.appliedLineCount} line mapping/value rule(s).`
          );
        } else {
          this.addLocalLog(`Template \"${templateApply.template.name}\" matched. Current extraction already satisfies mapped fields.`);
        }
      } else {
        this.addLocalLog('No saved template matched this extraction.');
      }

      if (this.header) {
        this.header.status = 'ReviewRequired';
      }

      await this.dialogService.showAlert('success', {
        title: 'OCR Complete',
        text: `Extracted ${this.fields.length} header field(s) and ${this.lines.length} line(s) with ${this.ocrParserName || this.ocrParserCode}. Review and correct before saving.`,
      });
    } catch (error) {
      if (this.header) {
        this.header.status = 'Failed';
      }

      const message = this.extractBackendErrorMessage(error);
      this.addLocalLog(`OCR analyze failed: ${message}`, 'Error');
      await this.showBackendError(error, 'OCR Analyze Failed');
    } finally {
      this.busyAnalyze = false;
    }
  }

  async loadReviewData(): Promise<void> {
    if (!this.importSystemId) {
      return;
    }

    try {
      const reviewData = await this.documentImportService.loadReviewData(this.importSystemId);
      this.header = this.header ? { ...this.header, ...reviewData.header } : reviewData.header;
      this.fields = reviewData.fields;
      this.lines = reviewData.lines;
      this.logs = reviewData.logs;
      this.backendReviewIssues = reviewData.issues;
      this.frontendReviewIssues = [];
      this.rebuildAssistantHeaderRows();
      this.rebuildAssistantHeaderValues();

      if (!this.selectedFileMimeType) {
        const ext = this.getFileExtension(this.header.sourceFileName || '').toLowerCase();
        if (ext === 'pdf') {
          this.selectedFileMimeType = 'application/pdf';
        } else if (ext === 'png') {
          this.selectedFileMimeType = 'image/png';
        } else if (ext === 'jpg' || ext === 'jpeg') {
          this.selectedFileMimeType = 'image/jpeg';
        } else if (ext === 'webp') {
          this.selectedFileMimeType = 'image/webp';
        }
      }

      if (this.header.sourceFileUrl && !this.previewUrl) {
        this.setPreviewUrl(this.header.sourceFileUrl);
      }
    } catch (error) {
      await this.showBackendError(error, 'Load Review Data Failed');
    }
  }

  onFieldsChanged(fields: DocumentImportField[]): void {
    this.fields = [...fields];
    this.rebuildAssistantHeaderRows();
    this.rebuildAssistantHeaderValues();
    this.cdr.markForCheck();
  }

  onLinesChanged(lines: DocumentImportLine[]): void {
    this.lines = [...lines];
    this.cdr.markForCheck();
  }

  addAssistantLine(): void {
    const maxLineNo = this.lines.reduce((max, line) => Math.max(max, Number(line.lineNo || 0)), 0);
    const newLineIndex = this.lines.length;
    const nextLines = [
      ...this.lines,
      {
        systemId: `local-assistant-line-${Date.now()}`,
        importNo: this.importNo,
        lineNo: maxLineNo ? maxLineNo + 10000 : 10000,
        targetDocumentType: this.targetDocumentType,
        externalItemCode: '',
        itemNo: '',
        glAccountNo: '',
        description: '',
        sourceText: '',
        quantity: undefined,
        unitOfMeasure: '',
        unitCost: undefined,
        lineAmount: undefined,
        mappingStatus: 'Manual',
        confidenceScore: 0,
        assistantLineType: 'Service',
        isNewManualLine: true,
        needsSourceRowSelection: true,
      },
    ];

    this.onLinesChanged(nextLines);
    this.startLineRowMapping(newLineIndex);
    this.focusGridLineField(newLineIndex, 'description');
  }

  removeAssistantLine(index: number): void {
    const nextLines = this.lines.filter((_, lineIndex) => lineIndex !== index);
    this.onLinesChanged(nextLines);

    if (this.activeMappingTarget?.scope === 'line' || this.activeMappingTarget?.scope === 'lineRow') {
      if (Number(this.activeMappingTarget.lineIndex) === index) {
        this.clearActiveMappingTarget();
      } else if (Number(this.activeMappingTarget.lineIndex) > index) {
        this.activeMappingTarget = {
          ...this.activeMappingTarget,
          lineIndex: Number(this.activeMappingTarget.lineIndex) - 1,
        };
      }
    }
  }

  private rebuildAssistantHeaderRows(): void {
    this.assistantHeaderFieldRows = this.assistantHeaderFields.map((definition) => {
      const field = this.getAssistantHeaderField(definition);
      return {
        definition,
        field,
      };
    });
  }

  private rebuildAssistantHeaderValues(): void {
    const next: Record<string, string> = {};

    for (const definition of this.assistantHeaderFields) {
      const field = this.getAssistantHeaderField(definition);
      next[definition.code] = String(field.correctedValue || field.extractedValue || '');
    }

    this.assistantHeaderValues = next;
  }

  setReviewTab(tab: ReviewTab): void {
    this.activeReviewTab = tab;
  }

  startHeaderMapping(field: DocumentImportField): void {
    this.activeReviewTab = 'header';
    this.activeMappingTarget = {
      scope: 'header',
      label: this.getFieldDisplayName(field),
      fieldCode: field.fieldCode || field.fieldName,
    };
  }

  startLineMapping(lineIndex: number, field: MappableLineField, label: string): void {
    this.activeReviewTab = 'lines';
    this.activeMappingTarget = {
      scope: 'line',
      label,
      lineIndex,
      lineField: field,
    };
  }

  startLineRowMapping(lineIndex: number): void {
    this.activeReviewTab = 'lines';
    this.activeMappingTarget = {
      scope: 'lineRow',
      label: `Line ${this.getLineDisplayNo(this.lines[lineIndex], lineIndex)}`,
      lineIndex,
    };
  }

  getLineType(line: DocumentImportLine): AssistantLineType {
    return this.resolveLineType(line, String(line['assistantLineType'] || '').trim() as AssistantLineType | '');
  }

  getLineDisplayNo(line: DocumentImportLine | undefined, index: number): number {
    return Number(line?.lineNo || ((index + 1) * 10000));
  }

  getLineCodeOrAccount(line: DocumentImportLine): string {
    return this.getLineType(line) === 'G/L Account'
      ? String(line.glAccountNo || '').trim()
      : String(line.externalItemCode || line.itemNo || '').trim();
  }

  getLineCodeAccountPlaceholder(line: DocumentImportLine): string {
    return this.getLineType(line) === 'G/L Account' ? 'G/L Account' : 'Code / Account';
  }

  focusLineField(lineIndex: number, field: MappableLineField): void {
    const line = this.lines[lineIndex];
    if (!line) {
      return;
    }

    const needsSourceRowSelection = !!line['needsSourceRowSelection'];
    const isNewManualLine = !!line['isNewManualLine'];
    const hasDescription = !!String(line.description || '').trim();
    const hasSourceText = !!String(line.sourceText || '').trim();
    const hasCode = !!String(line.externalItemCode || '').trim();

    if (field === 'description' && (
      needsSourceRowSelection ||
      (isNewManualLine && !hasDescription) ||
      (!hasSourceText && !hasDescription && !hasCode)
    )) {
      this.startLineRowMapping(lineIndex);
      return;
    }

    this.startLineMapping(lineIndex, field, this.buildLineFieldLabel(lineIndex, field));
  }

  updateLineType(lineIndex: number, value: AssistantLineType): void {
    const line = this.lines[lineIndex];
    if (!line) {
      return;
    }

    const nextLine: DocumentImportLine = {
      ...line,
      assistantLineType: value,
      itemNo: value === 'Item' ? String(line.itemNo || line.externalItemCode || '').trim() : '',
      glAccountNo: value === 'G/L Account' ? String(line.glAccountNo || '').trim() : '',
      externalItemCode: value === 'G/L Account' ? '' : String(line.externalItemCode || line.itemNo || '').trim(),
      errorMessage: this.clearMappingError(line.errorMessage),
    };

    this.replaceLine(lineIndex, nextLine);
  }

  updateLineField(lineIndex: number, field: MappableLineField, value: unknown): void {
    const line = this.lines[lineIndex];
    if (!line) {
      return;
    }

    const normalizedValue = this.normalizeGridLineFieldValue(field, value);
    const nextLine: DocumentImportLine = {
      ...line,
      [field]: normalizedValue as never,
      mappingStatus: line.mappingStatus || 'Manual',
      errorMessage: this.clearMappingError(line.errorMessage),
    };

    if (field === 'description' && String(normalizedValue || '').trim().length > 1) {
      nextLine['needsSourceRowSelection'] = false;
      nextLine['isNewManualLine'] = false;

      if (this.activeMappingTarget?.scope === 'lineRow' && Number(this.activeMappingTarget.lineIndex) === lineIndex) {
        this.activeMappingTarget = {
          scope: 'line',
          label: this.buildLineFieldLabel(lineIndex, 'description'),
          lineIndex,
          lineField: 'description',
        };
      }
    }

    if (field === 'externalItemCode') {
      nextLine.itemNo = String(normalizedValue || '').trim();
      if (String(normalizedValue || '').trim()) {
        nextLine.glAccountNo = '';
      }
    }

    this.replaceLine(lineIndex, nextLine);
  }

  updateLineCodeOrAccount(lineIndex: number, value: string): void {
    const line = this.lines[lineIndex];
    if (!line) {
      return;
    }

    const codeOrAccount = String(value || '').replace(/\s+/g, '').trim();
    const lineType = this.getLineType(line);
    const nextLine: DocumentImportLine = {
      ...line,
      assistantLineType: lineType,
      mappingStatus: line.mappingStatus || 'Manual',
      errorMessage: this.clearMappingError(line.errorMessage),
    };

    if (lineType === 'G/L Account') {
      nextLine.glAccountNo = codeOrAccount;
      nextLine.externalItemCode = '';
      nextLine.itemNo = '';
    } else {
      nextLine.externalItemCode = codeOrAccount;
      nextLine.itemNo = codeOrAccount;
      if (codeOrAccount) {
        nextLine.glAccountNo = '';
      }
    }

    this.replaceLine(lineIndex, nextLine);
  }

  private focusGridLineField(lineIndex: number, field: 'description' | 'quantity' | 'unitOfMeasure' | 'unitCost' | 'lineAmount' | 'code'): void {
    setTimeout(() => {
      document.getElementById(this.lineInputId(lineIndex, field))?.focus();
    });
  }

  private lineInputId(lineIndex: number, field: 'description' | 'quantity' | 'unitOfMeasure' | 'unitCost' | 'lineAmount' | 'code'): string {
    return `assistant-line-${lineIndex}-${field}`;
  }

  private buildLineFieldLabel(lineIndex: number, field: MappableLineField): string {
    const lineNo = this.getLineDisplayNo(this.lines[lineIndex], lineIndex);
    const friendlyField = field === 'externalItemCode' || field === 'glAccountNo'
      ? 'Code / Account'
      : this.friendlyFieldLabel(field);
    return `Line ${lineNo} ${friendlyField}`;
  }

  private isBlankAssistantLine(line: DocumentImportLine): boolean {
    return !String(line.externalItemCode || line.itemNo || line.glAccountNo || '').trim() &&
      !String(line.description || '').trim() &&
      !Number(line.quantity || 0) &&
      !String(line.unitOfMeasure || '').trim() &&
      !Number(line.unitCost || 0) &&
      !Number(line.lineAmount || 0);
  }

  private normalizeGridLineFieldValue(field: MappableLineField, value: unknown): string | number | undefined {
    if (field === 'quantity' || field === 'unitCost' || field === 'lineAmount') {
      return this.numberOrUndefined(value);
    }

    return String(value || '').trim();
  }

  private replaceLine(lineIndex: number, nextLine: DocumentImportLine): void {
    const nextLines = [...this.lines];
    nextLines[lineIndex] = nextLine;
    this.onLinesChanged(nextLines);
  }

  clearActiveMappingTarget(): void {
    this.activeMappingTarget = null;
  }

  private ensureAssistantHeaderField(definition: AssistantHeaderField): DocumentImportField {
    const existing = this.fields.find((field) =>
      definition.aliases.some((alias) => this.sameField(field, alias))
    );

    if (existing) {
      return existing;
    }

    const created: DocumentImportField = {
      systemId: `local-assistant-field-${definition.code}`,
      importNo: this.importNo,
      fieldCode: definition.code,
      fieldName: definition.code,
      sourceLabel: definition.label,
      displayName: definition.label,
      extractedValue: '',
      correctedValue: '',
      confidenceScore: 0,
      isRequired: false,
      isConfirmed: false,
      validationStatus: 'Pending',
    };

    this.fields = [...this.fields, created];
    return created;
  }

  private getAssistantHeaderField(definition: AssistantHeaderField): DocumentImportField {
    return this.ensureAssistantHeaderField(definition);
  }

  onAssistantHeaderFieldChanged(fieldOrCode: DocumentImportField | string, value: string): void {
    const code = typeof fieldOrCode === 'string'
      ? String(fieldOrCode || '').trim()
      : this.getAssistantDefinitionCodeForField(fieldOrCode);

    if (!code) {
      return;
    }

    this.assistantHeaderValues = {
      ...this.assistantHeaderValues,
      [code]: String(value || ''),
    };

    this.syncAssistantHeaderValueToField(code, value, 'Pending');
    this.debugAssistantHeader('input-changed', {
      code,
      nextValue: String(value || ''),
      assistantHeaderValue: this.assistantHeaderValues[code],
    });
    this.cdr.markForCheck();
  }

  private getAssistantDefinitionCodeForField(field: DocumentImportField): string {
    const matched = this.assistantHeaderFields.find((definition) =>
      definition.aliases.some((alias) => this.sameField(field, alias)) ||
      this.sameField(field, definition.code)
    );

    return matched?.code || field.fieldCode || field.fieldName || '';
  }

  startAssistantHeaderPick(definition: AssistantHeaderField): void {
    this.debugAssistantHeader('start-pick', {
      code: definition.code,
      label: definition.label,
      currentValue: this.assistantHeaderValues[definition.code] || '',
    });

    this.activeReviewTab = 'header';
    this.activeMappingTarget = {
      scope: 'header',
      label: definition.label,
      fieldCode: definition.code,
    };
  }

  applySourceRowToMapping(row: ExtractedTextRow): void {
    this.applySourceTextToMapping(row.text, row);
  }

  applySourceTokenToMapping(text: string, row: ExtractedTextRow): void {
    this.applySourceTextToMapping(text, row);
  }

  applySourceCandidateToMapping(candidate: SourceCandidate): void {
    console.log('[SmartImport][CandidateClick]', candidate, this.activeMappingTarget);
    this.debugAssistantHeader('candidate-click', {
      activeMappingTarget: this.activeMappingTarget,
      candidate,
    });

    if (!candidate || !this.activeMappingTarget) {
      return;
    }

    if (this.activeMappingTarget.scope === 'header') {
      const code = String(this.activeMappingTarget.fieldCode || '').trim();
      const nextValue = String(candidate.value || '').trim();

      if (!code || !nextValue) {
        return;
      }

      this.assistantHeaderValues = {
        ...this.assistantHeaderValues,
        [code]: nextValue,
      };

      const definition = this.assistantHeaderFields.find((item) => item.code === code);
      const field = definition ? this.getAssistantHeaderField(definition) : undefined;

      if (field) {
        field.correctedValue = nextValue;
        field.extractedValue = field.extractedValue || nextValue;
        field.sourceText = candidate.value;
        field.sourcePageNo = candidate.pageNo;
        field.isConfirmed = true;
        field.errorMessage = '';
        field.validationStatus = 'Valid';
        field.confidenceScore = Math.max(Number(field.confidenceScore || 0), 0.9);
        this.updateFieldInFields(field);
        this.fields = [...this.fields];
      }

      this.debugAssistantHeader('candidate-applied', {
        code,
        nextValue,
        assistantHeaderValue: this.assistantHeaderValues[code],
        fieldValue: field ? String(field.correctedValue || field.extractedValue || '') : '',
      });

      this.addLocalLog(`Mapped candidate \"${nextValue}\" from page ${candidate.pageNo} to header field \"${this.activeMappingTarget.label}\".`);
      this.cdr.markForCheck();
      return;
    }

      this.applySourceTextToMapping(candidate.value, candidate.row, true);
  }

  isAssistantHeaderRowActive(row: AssistantHeaderFieldRow): boolean {
    return this.activeMappingTarget?.scope === 'header' &&
      this.activeMappingTarget.fieldCode === row.definition.code;
  }

  private updateFieldInFields(field: DocumentImportField): void {
    const index = this.fields.findIndex((item) =>
      (!!field.systemId && item.systemId === field.systemId) ||
      (!!field.fieldCode && this.sameField(item, field.fieldCode)) ||
      (!!field.fieldName && this.sameField(item, field.fieldName))
    );

    if (index >= 0) {
      this.fields[index] = field;
    } else {
      this.fields = [...this.fields, field];
    }
  }

  async saveTemplateFromCurrentReview(): Promise<void> {
    if (!this.canSaveTemplate) {
      return;
    }

    this.syncAssistantHeaderValuesToFields();

    const defaultName = this.buildDefaultTemplateName();
    const result = await this.dialogService.showMessageBox({
      title: 'Save Extraction Template',
      text: 'Template is saved locally and reused after OCR for similar supplier documents.',
      input: 'text',
      inputPlaceholder: 'Template name',
      inputValue: defaultName,
      showCancelButton: true,
      confirmButtonText: 'Save Template',
    });

    if (!result?.isConfirmed) {
      return;
    }

    const templateName = String(result.value || '').trim();
    if (!templateName) {
      await this.dialogService.showAlert('warning', {
        title: 'Template Name Required',
        text: 'Please enter a template name before saving.',
      });
      return;
    }

    this.busyTemplate = true;
    try {
      const template = await this.documentTemplateBuilderService.saveTemplate({
        name: templateName,
        targetDocumentType: this.targetDocumentType,
        parserCode: this.ocrParserCode || undefined,
        sourceDocumentType: this.ocrParserCode || undefined,
        rawText: this.ocrRawText,
        fields: this.fields,
        lines: this.lines,
      });

      this.lastAppliedTemplateName = template.name || template.templateName || '';
      const fieldRules = Array.isArray(template.fieldRules) ? template.fieldRules : [];
      const lineRules = Array.isArray(template.lineRules) ? template.lineRules : [];
      const reusableHeaderValueRules = fieldRules.filter((rule: { preferredValue?: string }) => !!rule.preferredValue).length;
      this.addLocalLog(
        `Template \"${template.name}\" saved with ${fieldRules.length} header mapping rule(s) (${reusableHeaderValueRules} fixed value override rule(s)) and ${lineRules.length} line rule(s).`
      );

      await this.dialogService.showAlert('success', {
        title: 'Template Saved',
        text: 'Template saved.',
      });
    } finally {
      this.busyTemplate = false;
    }
  }

  async applySavedTemplate(forceChoose = false): Promise<void> {
    if (!this.fields.length) {
      return;
    }

    this.busyTemplate = true;
    try {
      await this.refreshAvailableTemplates();
      let resultTemplate: SmartImportTemplate | undefined;
      let templateApply = await this.documentTemplateBuilderService.applyBestTemplate(
        this.targetDocumentType,
        this.ocrParserCode,
        this.fields,
        this.lines,
        this.ocrRawText
      );

      if ((!templateApply.template || forceChoose) && this.availableTemplateCount) {
        const choice = await this.askTemplateSelection();
        if (choice) {
          resultTemplate = choice;
          const applied = this.documentTemplateBuilderService.applyTemplate(choice, this.fields, this.lines);
          templateApply = {
            template: choice,
            ...applied,
          };
        }
      }

      resultTemplate = resultTemplate || templateApply.template;
      if (!resultTemplate) {
        await this.dialogService.showAlert('info', {
          title: 'No Template Matched',
          text: 'No saved template could be matched to this extraction.',
        });
        this.addLocalLog('Manual template apply requested, but no template matched.');
        return;
      }

      this.fields = templateApply.fields;
      this.lines = templateApply.lines;
      this.lastAppliedTemplateName = resultTemplate.name || resultTemplate.templateName || '';
      this.activeMappingTarget = null;
      this.rebuildAssistantHeaderRows();
      this.rebuildAssistantHeaderValues();

      this.addLocalLog(
        `Template \"${resultTemplate.name}\" applied ${templateApply.appliedFieldCount} header mapping(s) and ${templateApply.appliedLineCount} line mapping/value rule(s).`
      );

      await this.dialogService.showAlert('success', {
        title: 'Template Applied',
        text: `Applied template \"${resultTemplate.name}\" with ${templateApply.appliedFieldCount} header update${templateApply.appliedFieldCount === 1 ? '' : 's'} and ${templateApply.appliedLineCount} line update${templateApply.appliedLineCount === 1 ? '' : 's'}.`,
      });
    } finally {
      this.busyTemplate = false;
    }
  }

  async deleteSavedTemplate(): Promise<void> {
    await this.refreshAvailableTemplates();
    const template = await this.askTemplateSelection('Delete Template', 'Delete');
    if (!template) {
      return;
    }

    const confirmed = await this.dialogService.confirm({
      title: 'Delete Template',
      message: `Deactivate template \"${template.name}\"?`,
      yesButtonText: 'Delete',
      noButtonText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    const deleted = await this.documentTemplateBuilderService.deleteTemplate(String(template.id || template.systemId || ''));
    if (!deleted) {
      await this.dialogService.showAlert('warning', {
        title: 'Template Not Found',
        text: 'Selected template could not be deleted.',
      });
      return;
    }

    if (this.lastAppliedTemplateName === template.name) {
      this.lastAppliedTemplateName = '';
    }

    this.addLocalLog(`Template \"${template.name}\" deactivated.`);
    await this.dialogService.showAlert('success', {
      title: 'Template Deleted',
      text: `Template \"${template.name}\" was deactivated.`,
    });
  }

  async refreshMappingSuggestions(): Promise<void> {
    this.logs = [
      ...this.logs,
      {
        systemId: `local-mapping-disabled-${Date.now()}`,
        importNo: this.importNo,
        timestamp: new Date().toISOString(),
        level: 'Info',
        message: 'Mapping connector is disabled during extraction review. No Business Central master-data APIs were called.',
      },
    ];
  }

  confirmSupplierMapping(candidate: MappingCandidate): void {
    this.selectedSupplierMapping = candidate;
    this.upsertFieldValue('VendorNo', 'Vendor', candidate.mappedCode, candidate.score, true);

    const vendorName = this.fields.find((field) => this.sameField(field, 'VendorName'));
    if (vendorName && !String(vendorName.correctedValue || vendorName.extractedValue || '').trim()) {
      vendorName.correctedValue = candidate.mappedDisplayName;
      vendorName.extractedValue = candidate.mappedDisplayName;
      vendorName.confidenceScore = candidate.score;
      vendorName.isConfirmed = true;
    }
  }

  selectSupplierMapping(candidateCode: string): void {
    const candidate = this.supplierCandidates.find((item) => item.mappedCode === candidateCode);
    if (candidate) {
      this.confirmSupplierMapping(candidate);
    }
  }

  confirmLineItemMapping(suggestion: LineMappingSuggestion, candidate: MappingCandidate): void {
    const line = this.findLineForSuggestion(suggestion);
    if (!line) {
      return;
    }

    this.selectedLineMappings[this.lineMappingKey(suggestion)] = { item: candidate };
    line.itemNo = candidate.mappedCode;
    line.glAccountNo = '';
    line.mappingStatus = 'Confirmed';
    line['mappedProductCode'] = candidate.mappedCode;
    line['mappedProductName'] = candidate.mappedDisplayName;
    line.errorMessage = this.clearMappingError(line.errorMessage);
  }

  selectLineItemMapping(suggestion: LineMappingSuggestion, candidateCode: string): void {
    const candidate = suggestion.itemCandidates.find((item) => item.mappedCode === candidateCode);
    if (candidate) {
      this.confirmLineItemMapping(suggestion, candidate);
    }
  }

  confirmLineGlMapping(suggestion: LineMappingSuggestion, candidate: MappingCandidate): void {
    const line = this.findLineForSuggestion(suggestion);
    if (!line) {
      return;
    }

    this.selectedLineMappings[this.lineMappingKey(suggestion)] = { gl: candidate };
    line.glAccountNo = candidate.mappedCode;
    line.itemNo = '';
    line.mappingStatus = 'Confirmed';
    line['mappedExpenseCode'] = candidate.mappedCode;
    line['mappedExpenseName'] = candidate.mappedDisplayName;
    line.errorMessage = this.clearMappingError(line.errorMessage);
  }

  selectLineGlMapping(suggestion: LineMappingSuggestion, candidateCode: string): void {
    const candidate = suggestion.glCandidates.find((item) => item.mappedCode === candidateCode);
    if (candidate) {
      this.confirmLineGlMapping(suggestion, candidate);
    }
  }

  candidateScore(candidate?: MappingCandidate): string {
    if (!candidate) {
      return '-';
    }

    return `${Math.round(candidate.score * 100)}%`;
  }

  trackBySuggestion(index: number, suggestion: LineMappingSuggestion): string {
    return String(suggestion.lineNo || index);
  }

  startPanelResize(event: PointerEvent): void {
    if (this.showAnalyzeGuidance) {
      return;
    }

    event.preventDefault();
    const workspace = (event.currentTarget as HTMLElement).parentElement;
    if (!workspace) {
      return;
    }

    this.endPanelResize();
    this.isResizingHeaderPanel = true;

    this.resizeMoveListener = (moveEvent: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) {
        return;
      }

      const nextPercent = ((rect.right - moveEvent.clientX) / rect.width) * 100;
      this.rightPanelWidthPercent = this.clamp(nextPercent, 30, 52);
    };

    this.resizeEndListener = () => this.endPanelResize();
    document.addEventListener('pointermove', this.resizeMoveListener);
    document.addEventListener('pointerup', this.resizeEndListener, { once: true });
    document.addEventListener('pointercancel', this.resizeEndListener, { once: true });
  }

  onResizeHandleKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.nudgeRightPanel(2);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nudgeRightPanel(-2);
    }
  }

  private nudgeRightPanel(delta: number): void {
    this.rightPanelWidthPercent = this.clamp(this.rightPanelWidthPercent + delta, 30, 52);
  }

  private endPanelResize(): void {
    if (this.resizeMoveListener) {
      document.removeEventListener('pointermove', this.resizeMoveListener);
      this.resizeMoveListener = undefined;
    }

    if (this.resizeEndListener) {
      document.removeEventListener('pointerup', this.resizeEndListener);
      document.removeEventListener('pointercancel', this.resizeEndListener);
      this.resizeEndListener = undefined;
    }

    this.isResizingHeaderPanel = false;
  }

  async saveCorrections(showSuccess = true): Promise<boolean> {
    if (!this.importSystemId) {
      await this.dialogService.showAlert('warning', {
        title: 'Save Not Available',
        text: 'No document import exists for this review yet.',
      });
      return false;
    }

    if (!this.fields.length && !this.lines.length) {
      await this.dialogService.showAlert('warning', {
        title: 'Nothing To Save',
        text: 'No extracted or reviewed data is available to save.',
      });
      return false;
    }

    this.busySave = true;

    try {
      this.syncAssistantHeaderValuesToFields();
      const payload = this.buildFrontendSubmissionPayload();
      console.log('[SmartImport][SaveFrontendExtraction payload]', payload);
      const response = await firstValueFrom(this.documentImportService.submitFrontendExtraction(this.importSystemId, payload));
      console.log('[SmartImport][SaveFrontendExtraction response]', response);

      const responseRecord = response as Record<string, unknown> | null;
      const returnedStatus = String(responseRecord?.['status'] || responseRecord?.['Status'] || '').trim();
      const returnedImportNo = String(responseRecord?.['importNo'] || responseRecord?.['ImportNo'] || '').trim();
      const returnedSystemId = String(responseRecord?.['systemId'] || responseRecord?.['SystemId'] || '').trim();

      if (this.header) {
        if (returnedStatus) {
          this.header.status = returnedStatus;
        }

        if (returnedImportNo) {
          this.header.importNo = returnedImportNo;
        }

        if (returnedSystemId) {
          this.header.systemId = returnedSystemId;
        }
      }

      this.addLocalLog('Extraction saved.');

      if (showSuccess) {
        await this.dialogService.showAlert('success', {
          title: 'Saved',
          text: 'Extraction saved.',
        });
      }

      return true;
    } catch (error) {
      console.error('[SmartImport][SaveFrontendExtraction error]', error);
      await this.showBackendError(error, 'Save Corrections Failed');
      return false;
    } finally {
      this.busySave = false;
    }
  }

  async createDraft(): Promise<void> {
    if (!this.canCreateDraft || !this.importSystemId) {
      await this.dialogService.showAlert('warning', {
        title: 'Validation Required',
        text: 'Fix required fields and line validations before creating draft.',
      });
      return;
    }

    this.busyCreate = true;

    try {
      const saved = await this.saveCorrections(false);
      if (!saved) {
        return;
      }

      await firstValueFrom(this.documentImportService.createDocument(this.importSystemId));
      await this.loadReviewData();

      await this.dialogService.showAlert('success', {
        title: 'Draft Created',
        text: `Draft Purchase Requisition ${this.header?.createdDocumentNo || ''} created successfully.`,
      });
    } catch (error) {
      await this.showBackendError(error, 'Create Draft Failed');
    } finally {
      this.busyCreate = false;
    }
  }

  async rejectImport(): Promise<void> {
    if (!this.importSystemId) {
      return;
    }

    const confirmed = await this.dialogService.confirm({
      title: 'Reject Import',
      message: 'Are you sure you want to reject this import?',
      yesButtonText: 'Reject',
      noButtonText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    this.busyReject = true;

    try {
      await firstValueFrom(this.documentImportService.rejectImport(this.importSystemId));
      await this.loadReviewData();

      await this.dialogService.showAlert('success', {
        title: 'Rejected',
        text: 'Import has been rejected.',
      });
    } catch (error) {
      await this.showBackendError(error, 'Reject Import Failed');
    } finally {
      this.busyReject = false;
    }
  }

  async createNewImport(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Create New Import',
      message: 'Clear the current smart import workspace and start again with a fresh import?',
      yesButtonText: 'Start Fresh',
      noButtonText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    const hadSelectedFile = !!this.selectedFile;

    this.header = null;
    this.fields = [];
    this.lines = [];
    this.logs = [];
    this.backendReviewIssues = [];
    this.frontendReviewIssues = [];
    this.resetMappingState();
    this.selectedFile = null;
    this.selectedFileName = '';
    this.selectedFileMimeType = '';
    this.ocrRawText = '';
    this.ocrProvider = this.documentOcrService.activeProvider;
    this.ocrExtractionMethod = '';
    this.ocrParserCode = '';
    this.ocrParserName = '';
    this.ocrAverageConfidence = 0;
    this.ocrPages = [];
    this.lastAppliedTemplateName = '';
    this.rebuildAssistantHeaderRows();
    this.rebuildAssistantHeaderValues();
    this.setPreviewUrl(null);

    await this.dialogService.showAlert('success', {
      title: 'Workspace Reset',
      text: hadSelectedFile
        ? 'Current import cleared. Click Upload Source PDF or choose the same PDF again to create a fresh import.'
        : 'Current import cleared. Choose a PDF to create a fresh import.',
    });
  }

  isWorkflowStepActive(index: number): boolean {
    return index === this.workflowStep;
  }

  isWorkflowStepCompleted(index: number): boolean {
    return index < this.workflowStep;
  }

  getFriendlyStatus(status: string): string {
    const normalized = String(status || '').trim();

    switch (normalized) {
      case 'OCRProcessing':
        return 'OCR processing';
      case 'ReviewRequired':
        return 'Review required';
      case 'ReadyToCreate':
        return 'Ready to create';
      default:
        return normalized || '-';
    }
  }

  getFriendlyTarget(target: string): string {
    const normalized = String(target || '').trim();

    switch (normalized) {
      case 'PurchaseRequisition':
        return 'Purchase Requisition';
      default:
        return normalized || '-';
    }
  }

  openCreatedDocument(): void {
    if (!this.canOpenCreatedDocument) {
      return;
    }

    void this.router.navigate(['/purchase/requisition'], {
      queryParams: {
        fromImport: this.importNo,
        documentNo: this.header?.createdDocumentNo,
      },
    });
  }

  trackByField(_: number, item: DocumentImportField): string {
    return item.systemId;
  }

  trackByLine(index: number, item: DocumentImportLine): string {
    return item.systemId || String(item.lineNo || index);
  }

  trackByLog(_: number, item: DocumentImportLog): string {
    return item.systemId;
  }

  private getFileExtension(fileName: string): string {
    const split = fileName.split('.');
    return split.length > 1 ? split[split.length - 1].toLowerCase() : 'pdf';
  }

  private getFieldDisplayName(field: DocumentImportField): string {
    return field.displayName || field.sourceLabel || field.fieldName || field.fieldCode || 'Header field';
  }

  private mapBackendReviewIssue(issue: DocumentImportReviewIssue): ReviewIssue {
    const scope = String(issue.scope || '').toLowerCase() === 'line' ? 'Line' : 'Header';
    return {
      scope,
      severity: this.mapBackendSeverity(issue.severity),
      title: this.getBackendIssueTitle(issue, scope),
      detail: issue.message || issue.suggestedFix || 'Review required',
      suggestedFix: issue.suggestedFix,
    };
  }

  private getBackendIssueTitle(issue: DocumentImportReviewIssue, scope: 'Header' | 'Line'): string {
    if (scope === 'Line') {
      return issue.lineNo ? `Line ${issue.lineNo}` : 'Line';
    }

    return issue.fieldCode || 'Header field';
  }

  private mapBackendSeverity(severity?: string): 'danger' | 'warning' | 'info' {
    const normalized = String(severity || '').toLowerCase();
    if (normalized === 'error') {
      return 'danger';
    }

    if (normalized === 'warning') {
      return 'warning';
    }

    return 'info';
  }

  private getFriendlyValidationStatus(status?: string): string {
    const normalized = String(status || '').trim();
    return normalized || 'Validation failed';
  }

  private isMappingOnlyField(field: DocumentImportField): boolean {
    const fieldKey = String(field.fieldCode || field.fieldName || field.sourceLabel || field.displayName || '')
      .replace(/\s+/g, '')
      .toLowerCase();

    return ['vendorno', 'vendor', 'itemno', 'glaccountno', 'g/laccountno'].includes(fieldKey);
  }

  private isMappingOnlyIssue(issue: DocumentImportReviewIssue): boolean {
    const fieldCode = String(issue.fieldCode || '').replace(/\s+/g, '').toLowerCase();
    const message = `${issue.message || ''} ${issue.suggestedFix || ''}`.toLowerCase();

    return fieldCode === 'vendorno' ||
      fieldCode === 'itemno' ||
      fieldCode === 'glaccountno' ||
      message.includes('vendor mapping') ||
      message.includes('vendorno') ||
      message.includes('item or g/l') ||
      message.includes('item or gl') ||
      message.includes('g/l account is required') ||
      message.includes('gl account is required') ||
      message.includes('map the vendor');
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

  private pushReviewIssue(issues: ReviewIssue[], issue: ReviewIssue): void {
    const exists = issues.some((item) =>
      item.scope === issue.scope &&
      item.severity === issue.severity &&
      item.title === issue.title &&
      item.detail === issue.detail
    );

    if (!exists) {
      issues.push(issue);
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private async suggestMappingsFromCurrentData(showSuccess = false): Promise<void> {
    this.mappingResult = null;
    this.selectedSupplierMapping = null;
    this.selectedLineMappings = {};

    if (showSuccess) {
      await this.dialogService.showAlert('info', {
        title: 'Mapping Disabled',
        text: 'Business Central mapping is disabled during extraction review.',
      });
    }
  }

  private buildNormalizedPurchaseDraft(): NormalizedPurchaseDraft {
    return {
      supplierName: this.getFieldValue(['SupplierName', 'VendorName', 'CompanyName']),
      supplierNumber: this.getFieldValue(['SupplierNumber', 'VendorNumber', 'VendorCode', 'CompanyNumber', 'SupplierCode']),
      supplierRegistrationNo: this.getFieldValue(['SupplierRegistrationNo', 'BusinessRegistrationNo', 'RegistrationNo']),
      supplierTaxNo: this.getFieldValue(['SupplierTaxNo', 'TaxRegistrationNo', 'VatRegistrationNo', 'VATRegistrationNo']),
      supplierPhone: this.getFieldValue(['SupplierPhone', 'VendorPhone', 'Phone']),
      supplierEmail: this.getFieldValue(['SupplierEmail', 'VendorEmail', 'Email']),
      supplierWebsite: this.getFieldValue(['SupplierWebsite', 'VendorWebsite', 'Website']),
      supplierAddress: this.getFieldValue(['SupplierAddress', 'VendorAddress', 'Address']),
      documentNo: this.getFieldValue(['DocumentNo', 'OrderNo', 'PONo', 'PurchaseOrderNo']),
      documentDate: this.getFieldValue(['DocumentDate', 'OrderDate']),
      requiredDate: this.getFieldValue(['RequiredDate', 'DeliverDate', 'DeliveryDate']),
      currencyCode: this.getFieldValue(['CurrencyCode', 'Currency']),
      totalAmount: this.parseAmount(this.getFieldValue(['TotalAmount', 'GrandTotal', 'Amount'])),
      lines: this.lines
        .filter((line) => !!String(line.description || '').trim())
        .map((line) => ({
          lineNo: line.lineNo,
          externalItemCode: String(line.externalItemCode || line['sourceExternalItemCode'] || '').trim(),
          description: String(line.description || '').trim(),
          quantity: Number(line.quantity || 0) || undefined,
          uom: String(line.unitOfMeasure || '').trim(),
          unitPrice: Number(line.unitCost || 0) || undefined,
          lineAmount: Number(line.lineAmount || 0) || undefined,
          mappedProductCode: String(line.itemNo || '').trim() || undefined,
          mappedProductName: String(line['mappedProductName'] || '').trim() || undefined,
          mappedExpenseCode: String(line.glAccountNo || '').trim() || undefined,
          mappedExpenseName: String(line['mappedExpenseName'] || '').trim() || undefined,
          mappingStatus: this.toMappingStatus(line.mappingStatus),
        })),
    };
  }

  private toMappingStatus(status?: string): 'Unmapped' | 'Suggested' | 'Confirmed' | 'NeedsReview' {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'confirmed') {
      return 'Confirmed';
    }

    if (normalized === 'suggested' || normalized === 'draft') {
      return 'Suggested';
    }

    if (normalized === 'needsreview') {
      return 'NeedsReview';
    }

    return 'Unmapped';
  }

  private getFieldValue(fieldCodes: string[]): string {
    for (const fieldCode of fieldCodes) {
      const field = this.fields.find((item) => this.sameField(item, fieldCode));
      const value = String(field?.correctedValue || field?.extractedValue || '').trim();
      if (value) {
        return value;
      }
    }

    return '';
  }

  private upsertFieldValue(
    fieldCode: string,
    label: string,
    value: string,
    confidenceScore: number,
    isConfirmed: boolean
  ): void {
    const existing = this.fields.find((field) => this.sameField(field, fieldCode));
    if (existing) {
      existing.correctedValue = value;
      existing.extractedValue = existing.extractedValue || value;
      existing.confidenceScore = Math.max(Number(existing.confidenceScore || 0), confidenceScore);
      existing.isConfirmed = isConfirmed;
      existing.errorMessage = '';
      return;
    }

    this.fields = [
      ...this.fields,
      {
        systemId: `local-mapping-field-${fieldCode}`,
        importNo: this.importNo,
        fieldCode,
        fieldName: fieldCode,
        sourceLabel: label,
        displayName: label,
        extractedValue: value,
        correctedValue: value,
        confidenceScore,
        isRequired: false,
        isConfirmed,
        validationStatus: 'Pending',
      },
    ];
  }

  private sameField(field: DocumentImportField, fieldCode: string): boolean {
    const normalized = fieldCode.toLowerCase();
    return [field.fieldCode, field.fieldName, field.sourceLabel, field.displayName]
      .filter(Boolean)
      .some((value) => String(value).replace(/\s+/g, '').toLowerCase() === normalized);
  }

  private findLineForSuggestion(suggestion: LineMappingSuggestion): DocumentImportLine | undefined {
    return this.lines.find((line) => line.lineNo === suggestion.lineNo) ||
      this.lines.find((line) =>
        String(line.description || '').trim() === String(suggestion.sourceDescription || '').trim()
      );
  }

  lineMappingKey(suggestion: LineMappingSuggestion): number {
    return Number(suggestion.lineNo || 0);
  }

  private clearMappingError(errorMessage?: string): string {
    const error = String(errorMessage || '').trim();
    if (!error || /item or g\/l account|required|mapping/i.test(error)) {
      return '';
    }

    return error;
  }

  private resetMappingState(): void {
    this.mappingResult = null;
    this.selectedSupplierMapping = null;
    this.selectedLineMappings = {};
    this.activeMappingTarget = null;
    this.activeReviewTab = 'header';
  }

  private buildDefaultTemplateName(): string {
    const supplier = this.extractedSupplierName || 'supplier';
    const parser = this.ocrParserCode || 'manual';
    return `${supplier}-${parser}`.replace(/\s+/g, ' ').trim();
  }

  private async askTemplateSelection(title = 'Choose Template', confirmButtonText = 'Apply'): Promise<SmartImportTemplate | undefined> {
    await this.refreshAvailableTemplates();
    const templates = this.documentTemplateBuilderService
      .listTemplates(this.targetDocumentType)
      .slice(0, 12);

    if (!templates.length) {
      return undefined;
    }

    const htmlOptions = templates
      .map((template: SmartImportTemplate) => `<option value=\"${template.id}\">${template.name}</option>`)
      .join('');

    const result = await this.dialogService.showMessageBox({
      title,
      html: `<select id=\"template-select\" class=\"swal2-select\" style=\"display:block;width:100%;\">${htmlOptions}</select>`,
      showCancelButton: true,
      confirmButtonText,
      preConfirm: () => {
        const select = document.getElementById('template-select') as HTMLSelectElement | null;
        return select?.value || '';
      },
    });

    if (!result?.isConfirmed) {
      return undefined;
    }

    const id = String(result.value || '').trim();
    return templates.find((item: SmartImportTemplate) => item.id === id);
  }

  private addLocalLog(message: string, level = 'Info'): void {
    this.logs = [
      ...this.logs,
      {
        systemId: `local-log-${Date.now()}-${this.logs.length + 1}`,
        importNo: this.importNo,
        timestamp: new Date().toISOString(),
        level,
        message,
      },
    ];
  }

  private async refreshAvailableTemplates(): Promise<void> {
    await this.documentTemplateBuilderService.refreshTemplates(this.targetDocumentType);
    this.cdr.markForCheck();
  }

  applySourceTextToMapping(text: string, row: ExtractedTextRow, preserveExactText = false): void {
    if (!this.activeMappingTarget) {
      return;
    }

    if (this.activeMappingTarget.scope === 'lineRow') {
      const lineIndex = Number(this.activeMappingTarget.lineIndex);
      this.applySourceRowToLine(lineIndex, row);
      this.clearActiveMappingTarget();
      this.cdr.markForCheck();
      return;
    }

    const mappedValue = this.normalizeMappedValue(this.activeMappingTarget, text, row, preserveExactText);
    if (mappedValue === undefined || mappedValue === null || mappedValue === '') {
      return;
    }

    if (this.activeMappingTarget.scope === 'header') {
      const fieldCode = String(this.activeMappingTarget.fieldCode || '').trim();
      if (!fieldCode) {
        return;
      }

      const nextValue = String(mappedValue).trim();
      this.assistantHeaderValues = {
        ...this.assistantHeaderValues,
        [fieldCode]: nextValue,
      };
      this.syncAssistantHeaderValueToField(fieldCode, nextValue, 'Mapped', {
        sourceText: text,
        sourcePageNo: row.pageNo,
        confidenceScore: 0.9,
      });
      this.addLocalLog(`Mapped source text from page ${row.pageNo} to header field "${this.activeMappingTarget.label}".`);
      return;
    }

    const lineIndex = Number(this.activeMappingTarget.lineIndex);
    const lineField = this.activeMappingTarget.lineField;
    if (!lineField) {
      return;
    }

    const currentLine = this.lines[lineIndex];
    if (!currentLine) {
      return;
    }

    const nextLine: DocumentImportLine = {
      ...currentLine,
      sourceText: row.text,
      sourcePageNo: row.pageNo,
      mappingStatus: currentLine.mappingStatus || 'Mapped',
      errorMessage: this.clearMappingError(currentLine.errorMessage),
      confidenceScore: Math.max(Number(currentLine.confidenceScore || 0), 0.9),
    };

    if (lineField === 'glAccountNo') {
      nextLine.glAccountNo = String(mappedValue || '').replace(/\s+/g, '').trim();
      nextLine.itemNo = '';
      nextLine.externalItemCode = '';
      nextLine['assistantLineType'] = 'G/L Account';
    } else if (lineField === 'externalItemCode') {
      const code = String(mappedValue || '').replace(/\s+/g, '').trim();
      nextLine.externalItemCode = code;
      nextLine.itemNo = code;
      if (code) {
        nextLine.glAccountNo = '';
        nextLine['assistantLineType'] = 'Item';
      }
    } else {
      nextLine[lineField] = mappedValue as never;
    }

    this.replaceLine(lineIndex, nextLine);

    console.log('[SmartImport][LineCandidateApplied]', {
      lineIndex,
      lineNo: this.lines[lineIndex]?.lineNo,
      lineField,
      mappedValue,
      pageNo: row.pageNo,
    });
    this.addLocalLog(`Mapped source text from page ${row.pageNo} to line ${this.lines[lineIndex]?.lineNo || lineIndex + 1} field "${this.activeMappingTarget.label}".`);
  }

  private normalizeMappedValue(
    target: MappingTarget,
    text: string,
    row: ExtractedTextRow,
    preserveExactText = false
  ): string | number | undefined {
    const cleanedText = String(text || '').trim();
    if (!cleanedText) {
      return undefined;
    }

    const fieldName = String(target.fieldCode || target.lineField || '').toLowerCase();
    if (fieldName.includes('date')) {
      return this.normalizeDateText(cleanedText) || cleanedText;
    }

    if (target.scope === 'header' && (fieldName.includes('cost') || fieldName.includes('amount'))) {
      return cleanedText;
    }

    if (fieldName === 'quantity' || fieldName.includes('cost') || fieldName.includes('amount')) {
      const parsed = this.parseAmount(cleanedText);
      if (parsed !== undefined) {
        return parsed;
      }
    }

    if (fieldName === 'externalitemcode' || fieldName === 'itemno' || fieldName === 'glaccountno' || fieldName === 'g/laccountno') {
      return cleanedText.replace(/\s+/g, '').trim();
    }

    if (!preserveExactText && fieldName === 'description' && row.text && cleanedText.length < row.text.trim().length) {
      return row.text.trim();
    }

    if (fieldName === 'suppliername') {
      return cleanedText;
    }

    return cleanedText;
  }

  private syncAssistantHeaderValuesToFields(): void {
    this.assistantHeaderFields.forEach((definition) => {
      const value = String(this.assistantHeaderValues[definition.code] || '').trim();
      this.syncAssistantHeaderValueToField(definition.code, value, 'Pending');
    });
  }

  private syncAssistantHeaderValueToField(
    fieldCode: string,
    value: string,
    validationStatus: string,
    metadata?: Partial<Pick<DocumentImportField, 'sourceText' | 'sourcePageNo' | 'confidenceScore'>>
  ): void {
    const definition = this.assistantHeaderFields.find((item) => item.code === fieldCode);
    const field = definition
      ? this.getAssistantHeaderField(definition)
      : this.fields.find((item) => this.sameField(item, fieldCode));

    if (!field) {
      return;
    }

    const trimmedValue = String(value || '').trim();
    field.correctedValue = trimmedValue;
    field.extractedValue = field.extractedValue || trimmedValue;
    field.isConfirmed = !!trimmedValue;
    field.validationStatus = validationStatus;
    field.errorMessage = '';

    if (metadata?.sourceText !== undefined) {
      field.sourceText = metadata.sourceText;
    }

    if (metadata?.sourcePageNo !== undefined) {
      field.sourcePageNo = metadata.sourcePageNo;
    }

    if (metadata?.confidenceScore !== undefined) {
      field.confidenceScore = Math.max(Number(field.confidenceScore || 0), Number(metadata.confidenceScore || 0));
    }

    this.updateFieldInFields(field);
    this.fields = [...this.fields];
    this.debugAssistantHeader('sync-to-field', {
      fieldCode,
      value: trimmedValue,
      validationStatus,
      fieldSnapshot: {
        correctedValue: field.correctedValue,
        extractedValue: field.extractedValue,
        sourceText: field.sourceText,
        sourcePageNo: field.sourcePageNo,
      },
    });
  }

  private debugAssistantHeader(event: string, payload: unknown): void {
    console.log('[SmartImport][AssistantHeader]', event, payload);
  }

  private extractCandidateValuesForTarget(row: ExtractedTextRow): SourceCandidate[] {
    const target = this.activeMappingTarget;
    if (!target) {
      return [];
    }

    const rowText = String(row.text || '').replace(/\s+/g, ' ').trim();
    if (!rowText || this.isNoiseRow(rowText)) {
      return [];
    }

    const fieldName = String(target.fieldCode || target.lineField || '').toLowerCase();
    const label = this.activeMappingTargetLabel;

    if (target.scope === 'line') {
      const structuredCandidates = this.lineFieldCandidates(row, rowText, fieldName, label);
      if (structuredCandidates.length) {
        return structuredCandidates;
      }
    }

    if (target.scope === 'lineRow') {
      return this.lineRowCandidates(row, rowText);
    }

    if (fieldName.includes('date')) {
      return this.dateCandidates(row, rowText, label);
    }

    if (fieldName.includes('currency')) {
      return this.currencyCandidates(row, rowText);
    }

    if (fieldName.includes('amount') || fieldName.includes('cost') || fieldName === 'quantity') {
      return this.numericCandidates(row, rowText, label);
    }

    if (fieldName.includes('document') || fieldName.includes('invoice') || fieldName.includes('order') || fieldName.includes('pono')) {
      return this.documentNoCandidates(row, rowText);
    }

    if (fieldName.includes('supplier') || fieldName.includes('vendor') || fieldName.includes('company')) {
      return this.supplierCandidatesFromRow(row, rowText);
    }

    if (fieldName === 'externalitemcode' || fieldName === 'itemno' || fieldName === 'glaccountno' || fieldName === 'g/laccountno' || fieldName === 'code') {
      return this.codeCandidates(row, rowText);
    }

    if (fieldName === 'description') {
      return this.descriptionCandidates(row, rowText);
    }

    if (fieldName === 'unitofmeasure') {
      return this.uomCandidates(row, rowText);
    }

    return this.genericTextCandidates(row, rowText, label);
  }

  private documentNoCandidates(row: ExtractedTextRow, rowText: string): SourceCandidate[] {
    const patterns = [
      { regex: /\b(?:document|invoice|order|po|pr)?\s*no\.?\s*[:.]?\s*([A-Z]{0,8}\d[A-Z0-9-]{3,})\b/gi, context: 'Found near Document No', score: 96 },
      { regex: /\b(?:pr\s*number|pr\s*no\.?)\s*[:.]?\s*([A-Z0-9-]*\d[A-Z0-9-]*)\b/gi, context: 'Found near PR Number', score: 94 },
      { regex: /\b([A-Z]{1,8}\d{4,}[A-Z0-9-]*)\b/g, context: 'Possible document number', score: 70 },
    ];

    return patterns
      .flatMap((pattern) => this.matchCandidates(row, rowText, pattern.regex, pattern.context, pattern.score))
      .filter((candidate) => !this.isMoneyLike(candidate.value));
  }

  private dateCandidates(row: ExtractedTextRow, rowText: string, label: string): SourceCandidate[] {
    const context = this.contextFromRow(rowText, label);
    const regex = /\b(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{1,2}\.?\s+[A-Za-z]+\s+\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})\b/g;
    return this.matchCandidates(row, rowText, regex, context, this.labelScore(rowText, label, 92, 72))
      .filter((candidate) => this.isDateLike(candidate.value));
  }

  private currencyCandidates(row: ExtractedTextRow, rowText: string): SourceCandidate[] {
    const candidates = this.matchCandidates(row, rowText, /\b(MYR|RM|USD|GBP|EUR|SGD|AUD|CAD)\b/gi, this.contextFromRow(rowText, 'Currency'), 86);
    return candidates.map((candidate) => ({
      ...candidate,
      value: candidate.value.toUpperCase() === 'RM' ? 'MYR' : candidate.value.toUpperCase(),
    }));
  }

  private numericCandidates(row: ExtractedTextRow, rowText: string, label: string): SourceCandidate[] {
    if (this.isAmountTarget(label)) {
      return this.amountCandidates(row, rowText, label);
    }

    const score = this.labelScore(rowText, label, 92, 66);
    return this.matchCandidates(
      row,
      rowText,
      /\b(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d{2}|\d+(?:\.\d+)?)\b/g,
      this.contextFromRow(rowText, label),
      score
    ).filter((candidate) => !/^\d{1,2}$/.test(candidate.value) || label.toLowerCase().includes('quantity'));
  }

  private amountCandidates(row: ExtractedTextRow, rowText: string, label: string): SourceCandidate[] {
    const nearAmountLabel = this.isNearAmountLabel(rowText);
    const score = nearAmountLabel ? 96 : 62;
    return this.matchCandidates(
      row,
      rowText,
      /\b(\d{1,3}(?:,\d{3})+(?:\.\d{2})|\d+\.\d{2}|\d{1,6})\b/g,
      this.contextFromRow(rowText, label),
      score
    ).filter((candidate) => this.isValidAmountCandidate(candidate.value, rowText));
  }

  private supplierCandidatesFromRow(row: ExtractedTextRow, rowText: string): SourceCandidate[] {
    if (!/\b(?:sdn\s+bhd|pte\s+ltd|limited|ltd\.?|inc\.?|corp\.?|corporation|marketing|services)\b/i.test(rowText)) {
      return [];
    }

    const cleaned = rowText
      .replace(/\b(?:purchase\s+order|invoice|quotation|page\s+\d+|no\.?\s*[:.]?\s*[A-Z0-9-]+)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned || /\b(?:purchase\s+order|invoice)\b/i.test(cleaned)) {
      return [];
    }

    return [{
      key: '',
      value: cleaned.replace(/^(?:to|supplier|vendor)\s*:?\s*/i, '').trim(),
      context: this.contextFromRow(rowText, 'Supplier Name'),
      pageNo: row.pageNo,
      row,
      score: /\b(?:supplier|vendor)\b/i.test(rowText) ? 90 : 78,
    }];
  }

  private descriptionCandidates(row: ExtractedTextRow, rowText: string): SourceCandidate[] {
    if (rowText.length < 8 || /^(?:total|subtotal|page|no\.?|description|quantity|amount)\b/i.test(rowText)) {
      return [];
    }

    return [{
      key: '',
      value: rowText,
      context: 'Possible line description',
      pageNo: row.pageNo,
      row,
      score: /[A-Za-z]{4,}/.test(rowText) ? 76 : 48,
    }];
  }

  private codeCandidates(row: ExtractedTextRow, rowText: string): SourceCandidate[] {
    const structured = this.lineFieldCandidates(row, rowText, 'externalitemcode', 'Code');
    if (structured.length) {
      return structured;
    }

    return this.matchCandidates(
      row,
      rowText,
      /\b([A-Z0-9]+(?:-[A-Z0-9]+)*)\b/g,
      'Possible item/code value',
      90
    ).filter((candidate) => /\d/.test(candidate.value) && candidate.value.length >= 3 && !this.isDateLike(candidate.value));
  }

  private uomCandidates(row: ExtractedTextRow, rowText: string): SourceCandidate[] {
    return this.matchCandidates(row, rowText, /\b(PCS|PC|EA|EACH|UNIT|UNITS|DAY|DAYS|MONTH|MONTHS|YEAR|YEARS|HOUR|HOURS|KG|L|M)\b/gi, 'Possible unit of measure', 82);
  }

  private genericTextCandidates(row: ExtractedTextRow, rowText: string, label: string): SourceCandidate[] {
    if (this.activeMappingTarget?.scope === 'line') {
      return [];
    }

    if (rowText.length < 3) {
      return [];
    }

    return [{
      key: '',
      value: rowText,
      context: this.contextFromRow(rowText, label),
      pageNo: row.pageNo,
      row,
      score: this.labelScore(rowText, label, 76, 52),
    }];
  }

  private matchCandidates(row: ExtractedTextRow, rowText: string, regex: RegExp, context: string, score: number): SourceCandidate[] {
    const matches = [...rowText.matchAll(regex)];
    return matches
      .map((match) => String(match[1] || match[0] || '').trim())
      .filter((value) => !!value)
      .map((value) => ({
        key: '',
        value,
        context,
        pageNo: row.pageNo,
        row,
        score,
      }));
  }

  private lineFieldCandidates(row: ExtractedTextRow, rowText: string, fieldName: string, label: string): SourceCandidate[] {
    const parsed = this.parseStructuredLineCandidate(rowText);
    if (!parsed) {
      return [];
    }

    const byField: Partial<Record<MappableLineField, string>> = {
      externalItemCode: parsed.itemNo,
      itemNo: parsed.itemNo,
      glAccountNo: parsed.itemNo,
      description: parsed.description,
      quantity: parsed.quantity,
      unitOfMeasure: parsed.unitOfMeasure,
      unitCost: parsed.unitCost,
      lineAmount: parsed.lineAmount,
      requiredDate: parsed.requiredDate,
    };

    const candidateValue = byField[fieldName as MappableLineField];
    if (!candidateValue) {
      return [];
    }

    return [{
      key: '',
      value: candidateValue,
      context: `Parsed from selected line row for ${this.friendlyFieldLabel(label)}`,
      pageNo: row.pageNo,
      row,
      score: 98,
    }];
  }

  private lineRowCandidates(row: ExtractedTextRow, rowText: string): SourceCandidate[] {
    if (this.isStandaloneLineNoteRow(rowText)) {
      return [{
        key: '',
        value: rowText,
        context: `Possible note for ${this.activeMappingTarget?.label || 'line'}`,
        pageNo: row.pageNo,
        row,
        score: 72,
      }];
    }

    const parsed = this.parseLineDraftFromRow(rowText);
    const hasMeaningfulValues = !!String(parsed.description || '').trim() && (
      Number(parsed.quantity || 0) > 0 ||
      Number(parsed.unitCost || 0) > 0 ||
      Number(parsed.lineAmount || 0) > 0 ||
      !!String(parsed.externalItemCode || '').trim()
    );

    if (!hasMeaningfulValues || !this.isLikelyLineSourceRow(rowText)) {
      return [];
    }

    const leadingNote = this.findLeadingLineNote(row);
    const contextSuffix = leadingNote ? ` Note: ${leadingNote}` : '';

    return [{
      key: '',
      value: rowText,
      context: `Possible source row for ${this.activeMappingTarget?.label || 'line'}${contextSuffix}`,
      pageNo: row.pageNo,
      row,
      score: 96,
    }];
  }

  private parseStructuredLineCandidate(rowText: string): {
    itemNo?: string;
    description?: string;
    requiredDate?: string;
    quantity?: string;
    unitOfMeasure?: string;
    unitCost?: string;
    lineAmount?: string;
  } | null {
    const normalized = String(rowText || '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return null;
    }

    const match = normalized.match(/^(?:\d+\s+)?([A-Z0-9-]{3,})\s+(.+?)(?:\s+(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}))?\s+(\d+(?:\.\d+)?)\s+([A-Za-z]{1,16})\s+([0-9,]+(?:\.\d{2})?)\s+([0-9,]+(?:\.\d{2})?)$/i);
    if (!match) {
      return null;
    }

    return {
      itemNo: match[1].trim(),
      description: match[2].trim(),
      requiredDate: match[3]?.trim() || undefined,
      quantity: match[4].trim(),
      unitOfMeasure: match[5].trim(),
      unitCost: match[6].trim(),
      lineAmount: match[7].trim(),
    };
  }

  private applySourceRowToLine(lineIndex: number, row: ExtractedTextRow): void {
    const currentLine = this.lines[lineIndex];
    if (!currentLine) {
      return;
    }

    const parsed = this.parseLineDraftFromRow(row.text);
    const explicitType = String(currentLine['assistantLineType'] || '').trim() as AssistantLineType | '';
    const preserveExplicitType = !!explicitType &&
      this.assistantLineTypes.includes(explicitType) &&
      !currentLine['needsSourceRowSelection'] &&
      !currentLine['isNewManualLine'];
    const nextType = preserveExplicitType
      ? explicitType
      : (parsed.lineType || this.resolveLineType(currentLine, explicitType));
    const nextLine: DocumentImportLine = {
      ...currentLine,
      assistantLineType: nextType,
      externalItemCode: nextType === 'Item' ? String(parsed.externalItemCode || '').trim() : '',
      itemNo: nextType === 'Item' ? String(parsed.externalItemCode || '').trim() : '',
      glAccountNo: nextType === 'G/L Account' ? String(parsed.externalItemCode || '').trim() : '',
      description: parsed.description ?? currentLine.description,
      quantity: parsed.quantity ?? currentLine.quantity,
      unitOfMeasure: parsed.unitOfMeasure ?? currentLine.unitOfMeasure,
      unitCost: parsed.unitCost ?? currentLine.unitCost,
      lineAmount: parsed.lineAmount ?? currentLine.lineAmount,
      sourceText: row.text,
      sourcePageNo: row.pageNo,
      mappingStatus: currentLine.mappingStatus || 'Mapped',
      errorMessage: this.clearMappingError(currentLine.errorMessage),
      confidenceScore: Math.max(Number(currentLine.confidenceScore || 0), 0.9),
      isNewManualLine: false,
      needsSourceRowSelection: false,
    };

    this.replaceLine(lineIndex, nextLine);
  }

  private parseLineDraftFromRow(rowText: string): ParsedLineDraft {
    const normalized = String(rowText || '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return {};
    }

    const structured = this.parseStructuredLineCandidate(normalized);
    if (structured) {
      const lineType = this.inferLineType(structured.description || '', structured.itemNo || '');
      return {
        lineType,
        externalItemCode: lineType === 'Item' ? (structured.itemNo || '') : '',
        description: structured.description,
        quantity: this.parseAmount(structured.quantity || ''),
        unitOfMeasure: structured.unitOfMeasure || '',
        unitCost: this.parseAmount(structured.unitCost || ''),
        lineAmount: this.parseAmount(structured.lineAmount || ''),
      };
    }

    const tokens = normalized.split(/\s+/).filter(Boolean);
    const workingTokens = [...tokens];
    if (/^\d+$/.test(workingTokens[0] || '')) {
      workingTokens.shift();
    }

    const moneyTokens = workingTokens
      .map((token, index) => ({ token, index, value: this.isMoneyLike(token) ? this.parseAmount(token) : undefined }))
      .filter((item): item is { token: string; index: number; value: number } => item.value !== undefined);
    const firstMoneyIndex = moneyTokens[0]?.index ?? workingTokens.length;
    const beforeMoney = workingTokens.slice(0, firstMoneyIndex);
    const quantityIndex = this.findLineDraftQuantityIndex(beforeMoney);
    const quantity = quantityIndex >= 0 ? this.parseAmount(beforeMoney[quantityIndex] || '') : undefined;
    const nextToken = quantityIndex >= 0 ? (beforeMoney[quantityIndex + 1] || '') : '';
    const unitOfMeasure = this.isLikelyUomValue(nextToken) ? nextToken : '';
    const codeIndex = this.findLineDraftCodeIndex(beforeMoney, quantityIndex);
    const externalItemCode = codeIndex >= 0 ? beforeMoney[codeIndex] : '';
    const description = beforeMoney
      .filter((token, index) => {
        if (index === codeIndex || index === quantityIndex) {
          return false;
        }

        if (unitOfMeasure && index === quantityIndex + 1) {
          return false;
        }

        return !this.isDateLike(token);
      })
      .join(' ')
      .trim();

    const lineType = this.inferLineType(description, externalItemCode);
    return {
      lineType,
      externalItemCode: lineType === 'Item' ? externalItemCode : '',
      description,
      quantity,
      unitOfMeasure,
      unitCost: moneyTokens.length > 1 ? moneyTokens[moneyTokens.length - 2].value : moneyTokens[0]?.value,
      lineAmount: moneyTokens[moneyTokens.length - 1]?.value,
    };
  }

  private findLineDraftQuantityIndex(tokens: string[]): number {
    for (let index = tokens.length - 1; index >= 0; index -= 1) {
      const token = tokens[index];
      if (this.isDateLike(token)) {
        continue;
      }

      if (/^\d+(?:\.\d+)?$/.test(token)) {
        return index;
      }
    }

    return -1;
  }

  private findLineDraftCodeIndex(tokens: string[], quantityIndex: number): number {
    const end = quantityIndex >= 0 ? quantityIndex : tokens.length;
    for (let index = 0; index < end; index += 1) {
      if (this.isLikelyCodeValue(tokens[index])) {
        return index;
      }
    }

    return -1;
  }

  private isLikelyCodeValue(value: string): boolean {
    const token = String(value || '').trim();
    if (!token || this.isDateLike(token) || this.isMoneyLike(token)) {
      return false;
    }

    return /\d/.test(token) && /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/i.test(token);
  }

  private isLikelyUomValue(value: string): boolean {
    return /^(day|days|year|years|month|months|piece|pieces|pcs|pc|each|ea|unit|units|hour|hours|kg|l|m)$/i.test(String(value || '').trim());
  }

  private inferLineType(description: string, code: string): AssistantLineType {
    const normalizedDescription = String(description || '').toLowerCase();
    if (this.isLikelyCodeValue(code)) {
      return 'Item';
    }

    if (/\b(sst|vat|tax|service tax)\b/i.test(normalizedDescription)) {
      return 'Tax';
    }

    if (/\bdiscount\b/i.test(normalizedDescription)) {
      return 'Discount';
    }

    return /\b(expense|charges?|fee|fees)\b/i.test(normalizedDescription) ? 'Expense' : 'Service';
  }

  private resolveLineType(line: DocumentImportLine, explicitType?: AssistantLineType | ''): AssistantLineType {
    if (explicitType && this.assistantLineTypes.includes(explicitType)) {
      return explicitType;
    }

    if (String(line.glAccountNo || '').trim()) {
      return 'G/L Account';
    }

    return this.inferLineType(String(line.description || ''), String(line.externalItemCode || ''));
  }

  private isLikelyLineSourceRow(rowText: string): boolean {
    const text = String(rowText || '').replace(/\s+/g, ' ').trim();
    if (!text || this.isNoiseRow(text)) {
      return false;
    }

    if (this.isLikelyNonLineRow(text) || this.isStandaloneLineNoteRow(text)) {
      return false;
    }

    return /[A-Za-z]/.test(text) && (/\d+\.\d{2}|\d{1,3}(?:,\d{3})+/.test(text) || /\b\d+(?:\.\d+)?\b/.test(text));
  }

  private extractLikelyTableBodyRows(rows: ExtractedTextRow[]): ExtractedTextRow[] {
    const orderedRows = [...rows].sort((left, right) => left.pageNo - right.pageNo || left.y - right.y);
    const bodyRows: ExtractedTextRow[] = [];
    let activePageNo = -1;
    let headerSeen = false;

    for (const row of orderedRows) {
      const text = String(row.text || '').replace(/\s+/g, ' ').trim();
      if (!text) {
        continue;
      }

      if (row.pageNo !== activePageNo) {
        activePageNo = row.pageNo;
        headerSeen = false;
      }

      if (!headerSeen) {
        headerSeen = this.isLikelyTableHeaderRow(text);
        continue;
      }

      if (this.isLikelyTableStopRow(text)) {
        headerSeen = false;
        continue;
      }

      if (this.isLikelyNonLineRow(text)) {
        continue;
      }

      bodyRows.push(row);
    }

    return bodyRows;
  }

  private isLikelyTableHeaderRow(text: string): boolean {
    const normalized = String(text || '').toLowerCase();
    const headerMatches = [
      /\bno\b/,
      /\bitem\s*no\b/,
      /\bdescription\b/,
      /\bquantity\b|\bqty\b/,
      /\buom\b|\bunit\b/,
      /\bunit\s*price\b|\bprice\b/,
      /\bamount\b/,
    ].filter((pattern) => pattern.test(normalized)).length;

    return headerMatches >= 3;
  }

  private isLikelyTableStopRow(text: string): boolean {
    return /\b(total|subtotal|total\s+myr|vat\s+summary|sst\s+summary|bank|signature|remarks|footer)\b/i.test(String(text || '').trim());
  }

  private isLikelyNonLineRow(text: string): boolean {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return true;
    }

    if (/\b(total|subtotal|bank|account no|authorized signature|remarks|footer|branch|ship to|bill to)\b/i.test(normalized)) {
      return true;
    }

    return /\b(co\.?\s*reg\.?\s*no|company\s+address|phone|fax|website|vendor\s+code|document\s+date|payment\s+terms|shipment\s+method|page\b|jalan|level\s+\d+|envictus)\b/i.test(normalized);
  }

  private isStandaloneLineNoteRow(text: string): boolean {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    return /^\([^)]*(discount|rebate|note|special)[^)]*\)$/i.test(normalized);
  }

  private findLeadingLineNote(row: ExtractedTextRow): string {
    const orderedRows = this.extractLikelyTableBodyRows(this.sourceRows);
    const currentIndex = orderedRows.findIndex((item) => item.pageNo === row.pageNo && item.y === row.y && item.text === row.text);
    if (currentIndex <= 0) {
      return '';
    }

    const previousRow = orderedRows[currentIndex - 1];
    const previousText = String(previousRow.text || '').replace(/\s+/g, ' ').trim();
    if (!this.isStandaloneLineNoteRow(previousText)) {
      return '';
    }

    return previousText;
  }

  private numberOrUndefined(value: unknown): number | undefined {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private lineRowPriority(row: ExtractedTextRow, preferredPageNo: number, preferredText: string): number {
    let score = 0;
    const normalizedText = this.normalizeRowText(String(row.text || ''));

    if (preferredText && normalizedText === preferredText) {
      score += 100;
    }

    if (preferredPageNo > 0 && row.pageNo === preferredPageNo) {
      score += 20;
    }

    return score;
  }

  private isRowRelevantToLine(row: ExtractedTextRow, preferredPageNo: number, preferredText: string): boolean {
    if (preferredPageNo > 0 && row.pageNo !== preferredPageNo) {
      return false;
    }

    if (!preferredText) {
      return preferredPageNo > 0 ? row.pageNo === preferredPageNo : true;
    }

    const normalizedRowText = this.normalizeRowText(String(row.text || ''));
    if (!normalizedRowText) {
      return false;
    }

    return preferredText.includes(normalizedRowText) || normalizedRowText.includes(preferredText);
  }

  private contextFromRow(rowText: string, label: string): string {
    const labelText = this.friendlyFieldLabel(label);
    const knownLabels = [
      'PR Number',
      'Document No',
      'Document Date',
      'Invoice Date',
      'Order Date',
      'Delivery Date',
      'Due Date',
      'Currency',
      'Total Amount',
      'TOTAL AMOUNT',
      'Supplier',
      'Vendor',
    ];
    const matched = knownLabels.find((candidate) => new RegExp(candidate.replace(/\s+/g, '\\s+'), 'i').test(rowText));
    return matched ? `Found near ${matched}` : `Found near ${labelText}`;
  }

  private labelScore(rowText: string, label: string, nearScore: number, fallbackScore: number): number {
    const labelWords = this.friendlyFieldLabel(label).split(/\s+/).filter((word) => word.length > 2);
    const near = labelWords.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(rowText));
    return near ? nearScore : fallbackScore;
  }

  private friendlyFieldLabel(value: string): string {
    return String(value || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isBrokenCandidate(value: string): boolean {
    const text = String(value || '').trim();
    if (text.length < 2) {
      return true;
    }

    if (/^[A-Za-z]{1,4}$/.test(text) && !/^(RM|MYR|USD|GBP|EUR|SGD|PCS|UOM)$/i.test(text)) {
      return true;
    }

    return /^0\.?$/.test(text);
  }

  private isAmountTarget(label: string): boolean {
    const normalized = String(label || '').toLowerCase();
    return normalized.includes('amount') ||
      normalized.includes('total') ||
      normalized.includes('cost') ||
      normalized.includes('price') ||
      normalized.includes('rate');
  }

  private isNearAmountLabel(rowText: string): boolean {
    return /\b(?:total|total\s+amount|total\s+(?:myr|rm|usd|gbp)|gross\s+value|net\s+value|amount|line\s+amount)\b/i.test(rowText);
  }

  private isValidAmountCandidate(value: string, rowText: string): boolean {
    const text = String(value || '').trim();
    if (!text || /[A-Za-z]/.test(text)) {
      return false;
    }

    if (this.isDateLike(text) || this.isPhoneLike(text)) {
      return false;
    }

    const nearAmountLabel = this.isNearAmountLabel(rowText);
    const hasDecimal = /\.\d{2}$/.test(text);
    const hasThousands = /^\d{1,3}(?:,\d{3})+(?:\.\d{2})?$/.test(text);
    const digitCount = text.replace(/\D/g, '').length;

    if (hasDecimal || hasThousands) {
      return digitCount <= 12;
    }

    if (digitCount > 6) {
      return false;
    }

    return nearAmountLabel && digitCount >= 2;
  }

  private isMoneyLike(value: string): boolean {
    return /^-?\d{1,3}(?:,\d{3})*(?:\.\d{2})$|^-?\d+\.\d{2}$/.test(String(value || '').trim());
  }

  private isDateLike(value: string): boolean {
    const text = String(value || '').trim();
    if (!text) {
      return false;
    }

    if (/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}$/.test(text)) {
      return true;
    }

    return /^(\d{1,2}\.?\s+[A-Za-z]+\s+\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})$/.test(text);
  }

  private isPhoneLike(value: string): boolean {
    const text = String(value || '').trim();
    const digits = text.replace(/\D/g, '');
    return /(?:\+?\d{1,3}[-\s]?)?\d{2,4}[-\s]\d{3,4}[-\s]?\d{0,4}/.test(text) || digits.length >= 8 && /[-\s]/.test(text);
  }

  private normalizeDateText(value: string): string {
    const text = String(value || '').trim();
    const namedMonth = text.match(/(\d{1,2}\.?(?:\s+)?[A-Za-z]+\s+\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
    if (namedMonth?.[1]) {
      const parsed = new Date(namedMonth[1].replace(/(\d{1,2})\.\s+/, '$1 '));
      if (!Number.isNaN(parsed.getTime())) {
        return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
      }
    }

    const numeric = text.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
    if (!numeric) {
      return '';
    }

    const day = numeric[1].padStart(2, '0');
    const month = numeric[2].padStart(2, '0');
    const year = numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3];
    return `${year}-${month}-${day}`;
  }

  private parseAmount(value: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(String(value).replace(/,/g, '').replace(/[^0-9.-]/g, ''));
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private extractDisplayTokens(row: ExtractedTextRow, rowText: string): string[] {
    const rowNormalized = this.normalizeRowText(rowText);
    const fromItems = (row.items || [])
      .map((item) => String(item.text || '').replace(/\s+/g, ' ').trim())
      .filter((token) => !!token && !this.isNoiseToken(token) && this.normalizeRowText(token) !== rowNormalized);

    const rawTokens = fromItems.length
      ? fromItems
      : this.splitTextToTokens(rowText);

    const uniqueTokens: string[] = [];
    const seen = new Set<string>();
    rawTokens.forEach((token) => {
      const normalized = this.normalizeRowText(token);
      if (!normalized || seen.has(normalized) || normalized === rowNormalized) {
        return;
      }

      seen.add(normalized);
      uniqueTokens.push(token);
    });

    return uniqueTokens.slice(0, 12);
  }

  private splitTextToTokens(text: string): string[] {
    const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) {
      return [];
    }

    const splitByDelimiters = cleaned
      .split(/\s{2,}|\s\|\s|\t+|,(?=\s*[A-Za-z]{2,}\b)/g)
      .map((part) => part.trim())
      .filter((part) => !!part);

    if (splitByDelimiters.length > 1) {
      return splitByDelimiters;
    }

    return cleaned
      .split(/\s+/g)
      .map((part) => part.trim())
      .filter((part) => !!part && !this.isNoiseToken(part));
  }

  private normalizeRowText(text: string): string {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .trim();
  }

  private isNoiseRow(text: string): boolean {
    const normalized = this.normalizeRowText(text);
    if (!normalized) {
      return true;
    }

    if (/^p\d+$/.test(normalized)) {
      return true;
    }

    return normalized.length < 2;
  }

  private isNoiseToken(token: string): boolean {
    const normalized = this.normalizeRowText(token);
    return !normalized || /^p\d+$/.test(normalized);
  }

  private buildFrontendSubmissionPayload(): FrontendOcrSubmissionPayload {
    const fields = this.fields.map((field) => ({
      fieldCode: field.fieldCode,
      fieldName: field.fieldName,
      sourceLabel: field.sourceLabel,
      extractedValue: (field.extractedValue || '').trim(),
      correctedValue: (field.correctedValue || field.extractedValue || '').trim(),
      confidenceScore: field.confidenceScore,
      isConfirmed: field.isConfirmed ?? !!String(field.correctedValue || field.extractedValue || '').trim(),
      validationStatus: field.validationStatus || 'Pending',
      errorMessage: field.errorMessage,
      sourcePageNo: field.sourcePageNo,
      sourceText: field.sourceText,
    }));

    const lines = this.lines.map((line) => ({
      lineNo: line.lineNo,
      assistantLineType: String(line['assistantLineType'] || '').trim() || undefined,
      externalItemCode: (line.externalItemCode || '').trim(),
      itemNo: (line.itemNo || '').trim(),
      glAccountNo: (line.glAccountNo || '').trim(),
      description: (line.description || '').trim(),
      quantity: line.quantity,
      unitOfMeasure: (line.unitOfMeasure || '').trim(),
      unitCost: line.unitCost,
      lineAmount: line.lineAmount,
      requiredDate: line.requiredDate,
      departmentCode: (line.departmentCode || '').trim(),
      confidenceScore: line.confidenceScore,
      validationStatus: String(line['validationStatus'] || line.mappingStatus || 'Pending').trim(),
      isConfirmed: Boolean(line['isConfirmed'] ?? ((line.description || '').trim() || line.quantity || line.lineAmount || line.unitCost)),
      errorMessage: line.errorMessage,
      sourcePageNo: line.sourcePageNo,
      sourceText: line.sourceText,
    }));

    return {
      provider: this.ocrProvider,
      targetDocumentType: this.targetDocumentType,
      sourceFileName: this.selectedFileName || this.header?.sourceFileName,
      sourceFileExtension: this.getFileExtension(this.selectedFileName || this.header?.sourceFileName || ''),
      rawText: this.ocrRawText,
      parserCode: this.ocrParserCode,
      parserName: this.ocrParserName,
      extractionMethod: this.ocrExtractionMethod || undefined,
      averageConfidence: this.ocrAverageConfidence,
      extractedAtUtc: new Date().toISOString(),
      pages: this.ocrPages.map((page) => ({
        pageNo: page.pageNo,
        rawText: page.rawText,
        confidence: page.confidence,
        extractionMethod: page.extractionMethod,
      })),
      logs: this.logs.map((log) => ({
        systemId: log.systemId,
        importNo: log.importNo,
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
      })),
      issues: this.frontendReviewIssues.map((issue) => ({
        scope: issue.scope || 'Header',
        recordSystemId: issue.recordSystemId,
        fieldCode: issue.fieldCode,
        lineNo: issue.lineNo,
        severity: issue.severity || 'Info',
        message: issue.message || 'Review required',
        suggestedFix: issue.suggestedFix,
        sourcePageNo: issue.sourcePageNo,
        sourceText: issue.sourceText,
      })),
      fields,
      lines,
    };
  }

  private setPreviewUrl(url: string | null): void {
    if (url === this.previewUrl) {
      return;
    }

    this.releasePreviewUrl();
    this.previewUrl = url;
  }

  private releasePreviewUrl(): void {
    if (this.previewUrl && this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  private async showBackendError(error: unknown, title: string): Promise<void> {
    const message = this.extractBackendErrorMessage(error);
    await this.dialogService.showAlert('error', {
      title,
      text: message,
    });
  }

  private extractBackendErrorMessage(error: unknown): string {
    const e = error as {
      error?: {
        error?: {
          message?: string;
        };
        message?: string;
      };
      message?: string;
      statusText?: string;
    };

    return (
      e?.error?.error?.message ||
      e?.error?.message ||
      e?.statusText ||
      e?.message ||
      'An unexpected error occurred. Please review backend logs and try again.'
    );
  }
}
