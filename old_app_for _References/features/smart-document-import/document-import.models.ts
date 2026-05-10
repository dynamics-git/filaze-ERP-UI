export type SmartImportStatus =
  | 'Uploaded'
  | 'Analyzing'
  | 'OCRProcessing'
  | 'ReviewRequired'
  | 'ReadyToCreate'
  | 'DraftCreated'
  | 'Created'
  | 'Rejected'
  | 'Failed';

export type DocumentExtractionMethod = 'pdfTextLayer' | 'tesseract';

export type DocumentOcrProvider = DocumentExtractionMethod | 'azure' | string;

export type SmartImportDocumentType = 'PurchaseInvoice' | 'PurchaseRequisition';

export interface DocumentImportSourceAnchor {
  sourcePageNo?: number;
  sourceX?: number;
  sourceY?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  sourceText?: string;
}

export interface DocumentImportHeader {
  systemId: string;
  importNo: string;
  targetDocumentType: SmartImportDocumentType | string;
  status: SmartImportStatus | string;
  extractionProvider?: string;
  extractionMethod?: string;
  parserCode?: string;
  parserName?: string;
  extractedAtUtc?: string;
  vendorNo?: string;
  vendorName?: string;
  supplierNumber?: string;
  currencyCode?: string;
  documentDate?: string;
  requiredDate?: string;
  totalAmount?: number;
  confidenceScore?: number;
  errorMessage?: string;
  createdBy?: string;
  createdDateTime?: string;
  modifiedBy?: string;
  modifiedDateTime?: string;
  sourceFileName?: string;
  sourceFileExtension?: string;
  sourceFileUrl?: string;
  sourceFileContent?: string;
  createdDocumentNo?: string;
  createdDocumentType?: string;
  requesterUserId?: string;
  [key: string]: unknown;
}

export interface DocumentImportField extends DocumentImportSourceAnchor {
  systemId: string;
  importNo: string;
  fieldCode?: string;
  fieldName?: string;
  sourceLabel?: string;
  displayName?: string;
  extractedValue?: string;
  correctedValue?: string;
  targetFieldName?: string;
  confidenceScore?: number;
  isRequired?: boolean;
  isConfirmed?: boolean;
  validationStatus?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

export interface DocumentImportLine extends DocumentImportSourceAnchor {
  systemId: string;
  importNo: string;
  lineNo?: number;
  targetDocumentType?: SmartImportDocumentType | string;
  assistantLineType?: string;
  externalItemCode?: string;
  itemNo?: string;
  glAccountNo?: string;
  description?: string;
  quantity?: number;
  unitOfMeasure?: string;
  unitCost?: number;
  lineAmount?: number;
  requiredDate?: string;
  departmentCode?: string;
  projectCode?: string;
  mappingStatus?: string;
  confidenceScore?: number;
  validationStatus?: string;
  isConfirmed?: boolean;
  errorMessage?: string;
  [key: string]: unknown;
}

export interface DocumentImportLog {
  systemId: string;
  importNo: string;
  timestamp?: string;
  level?: string;
  step?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export interface DocumentImportReviewIssue extends DocumentImportSourceAnchor {
  systemId: string;
  importNo: string;
  scope?: 'Header' | 'Line' | string;
  recordSystemId?: string;
  fieldCode?: string;
  lineNo?: number;
  severity?: 'Error' | 'Warning' | 'Info' | string;
  issueCode?: string;
  message?: string;
  suggestedFix?: string;
  [key: string]: unknown;
}

export interface ExtractedDocumentToken extends DocumentImportSourceAnchor {
  text: string;
  confidence?: number;
}

export interface ExtractedTextItem extends DocumentImportSourceAnchor {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

export interface ExtractedTextRow {
  pageNo: number;
  y: number;
  text: string;
  items: ExtractedTextItem[];
}

export interface ExtractedDocumentPage {
  pageNo: number;
  rawText: string;
  rows?: ExtractedTextRow[];
  confidence: number;
  extractionMethod: DocumentExtractionMethod;
  tokens?: ExtractedDocumentToken[];
  blocks?: ExtractedDocumentToken[];
}

export interface DocumentTextExtractionResult {
  rawText: string;
  pages: ExtractedDocumentPage[];
  confidence: number;
  extractionMethod: DocumentExtractionMethod;
  diagnostics?: string[];
}

export interface DocumentImportIssue extends DocumentImportSourceAnchor {
  scope: 'Header' | 'Line' | string;
  recordSystemId?: string;
  fieldCode?: string;
  lineNo?: number;
  severity: 'Error' | 'Warning' | 'Info' | string;
  message: string;
  suggestedFix?: string;
}

export interface DocumentParseContext {
  targetDocumentType: SmartImportDocumentType | string;
  fileName: string;
  pages: ExtractedDocumentPage[];
  rawText: string;
  vendorNo?: string;
  vendorName?: string;
}

export interface DocumentParseResult {
  fields: DocumentImportField[];
  lines: DocumentImportLine[];
  confidence: number;
  issues: DocumentImportIssue[];
  parserCode: string;
  parserName?: string;
  diagnostics?: string[];
}

export interface DocumentParserStrategy {
  readonly code: string;
  readonly name: string;
  canParse(context: DocumentParseContext): boolean;
  parse(context: DocumentParseContext): DocumentParseResult;
}

export interface VendorDocumentTemplate {
  templateCode: string;
  vendorNo?: string;
  vendorNamePattern?: string;
  documentType: string;
  headerRules: TemplateFieldRule[];
  lineTableRules: TemplateLineRule;
}

export interface TemplateFieldRule {
  fieldCode: string;
  labelPatterns: string[];
  valueRegex?: string;
  required?: boolean;
}

export interface TemplateLineRule {
  startPatterns: string[];
  endPatterns: string[];
  columnHints: {
    itemNo?: string[];
    description?: string[];
    quantity?: string[];
    uom?: string[];
    unitCost?: string[];
    lineAmount?: string[];
  };
}

export interface DocumentImportUploadRequest {
  targetDocumentType: SmartImportDocumentType;
  sourceFileName: string;
  sourceFileExtension: string;
  sourceFileContent?: string;
  sourceFileUrl?: string;
  requesterUserId?: string;
}

export interface SmartImportReviewData {
  header: DocumentImportHeader;
  fields: DocumentImportField[];
  lines: DocumentImportLine[];
  logs: DocumentImportLog[];
  issues: DocumentImportReviewIssue[];
}

export interface FrontendExtractedFieldPayload {
  fieldCode?: string;
  fieldName?: string;
  sourceLabel?: string;
  displayName?: string;
  extractedValue?: string;
  correctedValue?: string;
  confidenceScore?: number;
  isRequired?: boolean;
  isConfirmed?: boolean;
  validationStatus?: string;
  errorMessage?: string;
  sourcePageNo?: number;
  sourceX?: number;
  sourceY?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  sourceText?: string;
}

export interface FrontendExtractedLinePayload {
  lineNo?: number;
  assistantLineType?: string;
  externalItemCode?: string;
  itemNo?: string;
  glAccountNo?: string;
  description?: string;
  quantity?: number;
  unitOfMeasure?: string;
  unitCost?: number;
  lineAmount?: number;
  requiredDate?: string;
  departmentCode?: string;
  projectCode?: string;
  mappingStatus?: string;
  confidenceScore?: number;
  validationStatus?: string;
  isConfirmed?: boolean;
  errorMessage?: string;
  sourcePageNo?: number;
  sourceX?: number;
  sourceY?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  sourceText?: string;
}

export interface FrontendOcrSubmissionPayload {
  provider: DocumentOcrProvider;
  targetDocumentType: SmartImportDocumentType | string;
  sourceFileName?: string;
  sourceFileExtension?: string;
  rawText: string;
  parserCode?: string;
  parserName?: string;
  extractionMethod?: DocumentExtractionMethod;
  averageConfidence?: number;
  extractedAtUtc: string;
  pages?: Array<{
    pageNo: number;
    rawText: string;
    confidence: number;
    extractionMethod: DocumentExtractionMethod;
  }>;
  issues?: DocumentImportIssue[];
  logs?: DocumentImportLog[];
  fields: FrontendExtractedFieldPayload[];
  lines: FrontendExtractedLinePayload[];
}

export interface SmartImportTemplateFieldRule {
  fieldCode: string;
  aliases: string[];
  preferredValue?: string;
  applyMode: 'always' | 'ifEmpty' | 'ifEmptyOrLowConfidence';
  minConfidence?: number;
}

export interface SmartImportTemplateLineRule {
  matchText: string;
  itemNo?: string;
  glAccountNo?: string;
  description?: string;
  quantity?: number;
  unitOfMeasure?: string;
  unitCost?: number;
  lineAmount?: number;
  requiredDate?: string;
  departmentCode?: string;
  projectCode?: string;
}

export interface SmartImportTemplate {
  id?: string;
  systemId?: string;
  templateId?: string;
  templateCode?: string;
  templateName: string;
  name?: string;
  platformCode: string;
  targetDocumentType: SmartImportDocumentType | string;
  sourceDocumentType?: string;
  supplierNamePattern?: string;
  supplierCode?: string;
  detectionKeywordsJson?: string;
  headerMappingJson?: string;
  lineMappingJson?: string;
  stopPatternsJson?: string;
  sampleRawTextHash?: string;
  matchScoreThreshold?: number;
  isActive?: boolean;
  isDefault?: boolean;
  usageCount?: number;
  lastUsedDateTime?: string;
  lastMatchedScore?: number;
  companyId?: string;
  company?: string;
  createdBy?: string;
  createdDateTime?: string;
  modifiedBy?: string;
  modifiedDateTime?: string;
  parserCode?: string;
  supplierSignature?: string;
  fieldRules?: SmartImportTemplateFieldRule[];
  lineRules?: SmartImportTemplateLineRule[];
  detectionKeywords?: string[];
  stopPatterns?: string[];
}

export interface SmartImportTemplatePayload {
  templateId?: string;
  templateCode?: string;
  templateName?: string;
  platformCode?: string;
  targetDocumentType?: SmartImportDocumentType | string;
  sourceDocumentType?: string;
  supplierNamePattern?: string;
  supplierCode?: string;
  detectionKeywordsJson?: string;
  headerMappingJson?: string;
  lineMappingJson?: string;
  stopPatternsJson?: string;
  sampleRawTextHash?: string;
  matchScoreThreshold?: number;
  isActive?: boolean;
  isDefault?: boolean;
}
