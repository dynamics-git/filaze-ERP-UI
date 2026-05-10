import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { RestService } from '../../core/services/rest.service';
import {
  DocumentImportField,
  DocumentImportHeader,
  DocumentImportLine,
  DocumentImportLog,
  DocumentImportReviewIssue,
  FrontendOcrSubmissionPayload,
  DocumentImportUploadRequest,
  SmartImportDocumentType,
  SmartImportReviewData,
} from './document-import.models';

type DocumentImportCreateRequest = Pick<
  DocumentImportUploadRequest,
  'targetDocumentType' | 'sourceFileName' | 'sourceFileExtension' | 'sourceFileUrl' | 'requesterUserId'
>;

@Injectable({
  providedIn: 'root',
})
export class DocumentImportService {
  private readonly requestOptions = { suppressGlobalErrorDialog: true };

  constructor(private restService: RestService) { }

  uploadDocument(payload: DocumentImportCreateRequest) {
    return this.restService.post('/documentImports', payload, this.requestOptions);
  }

  async uploadDocumentWithFile(
    payload: Omit<DocumentImportCreateRequest, 'sourceFileUrl'>,
    file: File
  ): Promise<DocumentImportHeader> {
    const uploadResponse = await firstValueFrom(this.restService.fileUpload(file));
    const sourceFileUrl = this.readString(uploadResponse as Record<string, unknown>, [
      'file',
      '@odata.mediaReadLink',
      'url',
      'Url',
    ]);

    if (!sourceFileUrl) {
      throw new Error('External file upload succeeded but no sourceFileUrl was returned.');
    }

    const createdRaw = (await firstValueFrom(
      this.uploadDocument({
        ...payload,
        sourceFileUrl,
      })
    )) as DocumentImportHeader;

    const created = this.normalizeHeader(createdRaw);
    if (!created.systemId) {
      throw new Error('Upload header created but systemId is missing.');
    }

    return created;
  }

  analyzeDocument(systemId: string) {
    return this.postBoundAction(systemId, 'AnalyzeDocument');
  }

  createDocument(systemId: string) {
    return this.postBoundAction(systemId, 'CreateDocument');
  }

  listImports(targetDocumentType?: SmartImportDocumentType | string) {
    const filters: string[] = [];
    if (String(targetDocumentType || '').trim()) {
      filters.push(`targetDocumentType eq '${this.escapeODataLiteral(String(targetDocumentType || ''))}'`);
    }

    const queryParts: string[] = [];
    if (filters.length) {
      queryParts.push(`$filter=${filters.join(' and ')}`);
    }
    queryParts.push('$orderby=modifiedDateTime desc');

    return this.restService.get(`/documentImports?${queryParts.join('&')}`, this.requestOptions);
  }

  submitFrontendExtraction(systemId: string, payload: FrontendOcrSubmissionPayload) {
    const recordPath = this.getImportRecordPath(systemId);
    return this.restService.post(
      `${recordPath}/Microsoft.NAV.SaveFrontendExtraction`,
      { payload: JSON.stringify(payload) },
      this.requestOptions
    );
  }

  rejectImport(systemId: string) {
    return this.postBoundAction(systemId, 'RejectImport');
  }

  deleteImport(systemId: string) {
    const recordPath = this.getImportRecordPath(systemId);
    return this.restService.delete(recordPath, this.requestOptions);
  }

  getImportHeader(systemId: string) {
    const recordPath = this.getImportRecordPath(systemId);
    return this.restService.get(recordPath, this.requestOptions);
  }

  getImportFields(importNo: string) {
    return this.restService.get(`/documentImportFields?$filter=importNo eq '${this.escapeODataLiteral(importNo)}'`, this.requestOptions);
  }

  getImportLines(importNo: string) {
    return this.restService.get(`/documentImportLines?$filter=importNo eq '${this.escapeODataLiteral(importNo)}'`, this.requestOptions);
  }

  getImportLogs(importNo: string) {
    return this.restService.get(`/documentImportLogs?$filter=importNo eq '${this.escapeODataLiteral(importNo)}'`, this.requestOptions);
  }

  getImportReviewIssues(importNo: string) {
    return this.restService.get(`/documentImportReviewIssues?$filter=importNo eq '${this.escapeODataLiteral(importNo)}'`, this.requestOptions);
  }

  updateImportField(systemId: string, patchData: Partial<DocumentImportField>) {
    return this.restService.patch(`/documentImportFields(${systemId})`, patchData, '*', this.requestOptions);
  }

  updateImportLine(systemId: string, patchData: Partial<DocumentImportLine>) {
    return this.restService.patch(`/documentImportLines(${systemId})`, patchData, '*', this.requestOptions);
  }

  async loadReviewData(systemId: string): Promise<SmartImportReviewData> {
    const headerRaw = (await firstValueFrom(this.getImportHeader(systemId))) as DocumentImportHeader;
    const header = this.normalizeHeader(headerRaw);
    const importNo = header.importNo || '';

    const [fieldsRaw, linesRaw, logsRaw, issuesRaw] = await Promise.all([
      firstValueFrom(this.getImportFields(importNo)),
      firstValueFrom(this.getImportLines(importNo)),
      firstValueFrom(this.getImportLogs(importNo)),
      firstValueFrom(this.getImportReviewIssues(importNo)).catch(() => ({ value: [] })),
    ]);

    const fields = this.readCollection<DocumentImportField>(fieldsRaw).map((item) => this.normalizeField(item));
    const lines = this.readCollection<DocumentImportLine>(linesRaw).map((item) => this.normalizeLine(item));
    const logs = this.readCollection<DocumentImportLog>(logsRaw).map((item) => this.normalizeLog(item));
    const issues = this.readCollection<DocumentImportReviewIssue>(issuesRaw).map((item) => this.normalizeReviewIssue(item));

    return {
      header,
      fields,
      lines,
      logs,
      issues,
    };
  }

  private postBoundAction(systemId: string, actionName: string) {
    const recordPath = this.getImportRecordPath(systemId);
    const primaryEndpoint = `${recordPath}/Microsoft.NAV.${actionName}`;
    const fallbackEndpoint = `${recordPath}/${actionName}`;

    return new Observable((subscriber) => {
      const primarySubscription = this.restService.post(primaryEndpoint, {}, this.requestOptions).subscribe({
        next: (value) => {
          subscriber.next(value);
          subscriber.complete();
        },
        error: (primaryError) => {
          const status = (primaryError as { status?: number })?.status;
          if (status !== 404 && status !== 405) {
            subscriber.error(primaryError);
            return;
          }

          const fallbackSubscription = this.restService.post(fallbackEndpoint, {}, this.requestOptions).subscribe({
            next: (value) => {
              subscriber.next(value);
              subscriber.complete();
            },
            error: (fallbackError) => subscriber.error(fallbackError),
          });

          return () => fallbackSubscription.unsubscribe();
        },
      });

      return () => primarySubscription.unsubscribe();
    });
  }

  normalizeHeader(header: DocumentImportHeader): DocumentImportHeader {
    const resolvedSystemId = this.readString(header, ['systemId', 'SystemId']) || '';
    const resolvedImportNo = this.readString(header, ['importNo', 'ImportNo', 'No']) || '';
    const resolvedStatus = this.readString(header, ['status', 'Status']) || 'Uploaded';

    return {
      ...header,
      systemId: resolvedSystemId,
      importNo: resolvedImportNo,
      status: resolvedStatus,
      extractionProvider: this.readString(header, ['extractionProvider', 'ExtractionProvider']) || undefined,
      extractionMethod: this.readString(header, ['extractionMethod', 'ExtractionMethod']) || undefined,
      parserCode: this.readString(header, ['parserCode', 'ParserCode']) || undefined,
      parserName: this.readString(header, ['parserName', 'ParserName']) || undefined,
      extractedAtUtc: this.readString(header, ['extractedAtUtc', 'ExtractedAtUtc']) || undefined,
      vendorNo: this.readString(header, ['vendorNo', 'VendorNo']) || undefined,
      vendorName: this.readString(header, ['vendorName', 'VendorName']) || undefined,
      currencyCode: this.readString(header, ['currencyCode', 'CurrencyCode']) || undefined,
      documentDate: this.readString(header, ['documentDate', 'DocumentDate']) || undefined,
      requiredDate: this.readString(header, ['requiredDate', 'RequiredDate']) || undefined,
      totalAmount: this.readNumber(header, ['totalAmount', 'TotalAmount']),
      confidenceScore: this.readNumber(header, ['confidenceScore', 'ConfidenceScore']),
      errorMessage: this.readString(header, ['errorMessage', 'ErrorMessage']) || undefined,
      createdBy: this.readString(header, ['createdBy', 'CreatedBy']) || undefined,
      createdDateTime: this.readString(header, ['createdDateTime', 'CreatedDateTime']) || undefined,
      modifiedBy: this.readString(header, ['modifiedBy', 'ModifiedBy']) || undefined,
      modifiedDateTime: this.readString(header, ['modifiedDateTime', 'ModifiedDateTime']) || undefined,
      sourceFileName: this.readString(header, ['sourceFileName', 'SourceFileName']) || undefined,
      sourceFileExtension: this.readString(header, ['sourceFileExtension', 'SourceFileExtension']) || undefined,
      sourceFileUrl: this.readString(header, ['sourceFileUrl', 'SourceFileUrl']) || undefined,
      sourceFileContent: this.readString(header, ['sourceFileContent', 'SourceFileContent']) || undefined,
      createdDocumentNo:
        this.readString(header, ['createdDocumentNo', 'CreatedDocumentNo', 'createdNo']) || undefined,
      createdDocumentType:
        this.readString(header, ['createdDocumentType', 'CreatedDocumentType']) || undefined,
      supplierNumber: this.readString(header, ['supplierNumber', 'SupplierNumber', 'vendorNumber', 'VendorNumber', 'vendorCode', 'VendorCode', 'companyNumber', 'CompanyNumber', 'supplierCode', 'SupplierCode',]) || undefined,
    };
  }

  normalizeField(field: DocumentImportField): DocumentImportField {
    return {
      ...field,
      systemId: this.readString(field, ['systemId', 'SystemId']) || '',
      importNo: this.readString(field, ['importNo', 'ImportNo']) || '',
      fieldCode: this.readString(field, ['fieldCode', 'FieldCode']) || undefined,
      fieldName: this.readString(field, ['fieldName', 'FieldName']) || undefined,
      sourceLabel: this.readString(field, ['sourceLabel', 'SourceLabel']) || undefined,
      displayName:
        this.readString(field, ['displayName', 'DisplayName', 'sourceLabel', 'SourceLabel', 'fieldName', 'FieldName']) || undefined,
      extractedValue: this.readString(field, ['extractedValue', 'ExtractedValue']) || undefined,
      correctedValue: this.readString(field, ['correctedValue', 'CorrectedValue']) || undefined,
      targetFieldName: this.readString(field, ['targetFieldName', 'TargetFieldName']) || undefined,
      confidenceScore: this.readNumber(field, ['confidenceScore', 'ConfidenceScore']),
      isRequired: this.readBoolean(field, ['isRequired', 'IsRequired', 'required', 'Required']) || false,
      isConfirmed: this.readBoolean(field, ['isConfirmed', 'IsConfirmed']) || false,
      validationStatus: this.readString(field, ['validationStatus', 'ValidationStatus']) || undefined,
      errorMessage: this.readString(field, ['errorMessage', 'ErrorMessage']) || undefined,
      sourcePageNo: this.readNumber(field, ['sourcePageNo', 'SourcePageNo']),
      sourceX: this.readNumber(field, ['sourceX', 'SourceX']),
      sourceY: this.readNumber(field, ['sourceY', 'SourceY']),
      sourceWidth: this.readNumber(field, ['sourceWidth', 'SourceWidth']),
      sourceHeight: this.readNumber(field, ['sourceHeight', 'SourceHeight']),
      sourceText: this.readString(field, ['sourceText', 'SourceText']) || undefined,
    };
  }

  normalizeLine(line: DocumentImportLine): DocumentImportLine {
    return {
      ...line,
      systemId: this.readString(line, ['systemId', 'SystemId']) || '',
      importNo: this.readString(line, ['importNo', 'ImportNo']) || '',
      lineNo: this.readNumber(line, ['lineNo', 'LineNo']),
      targetDocumentType: this.readString(line, ['targetDocumentType', 'TargetDocumentType']) || undefined,
      assistantLineType: this.readString(line, ['assistantLineType', 'AssistantLineType']) || undefined,
      externalItemCode: this.readString(line, ['externalItemCode', 'ExternalItemCode']) || undefined,
      itemNo: this.readString(line, ['itemNo', 'ItemNo']) || undefined,
      glAccountNo: this.readString(line, ['glAccountNo', 'GlAccountNo']) || undefined,
      description: this.readString(line, ['description', 'Description']) || undefined,
      quantity: this.readNumber(line, ['quantity', 'Quantity']),
      unitOfMeasure: this.readString(line, ['unitOfMeasure', 'UnitOfMeasure']) || undefined,
      unitCost: this.readNumber(line, ['unitCost', 'UnitCost']),
      lineAmount: this.readNumber(line, ['lineAmount', 'LineAmount']),
      requiredDate: this.readString(line, ['requiredDate', 'RequiredDate']) || undefined,
      departmentCode: this.readString(line, ['departmentCode', 'DepartmentCode']) || undefined,
      projectCode: this.readString(line, ['projectCode', 'ProjectCode']) || undefined,
      mappingStatus: this.readString(line, ['mappingStatus', 'MappingStatus']) || undefined,
      confidenceScore: this.readNumber(line, ['confidenceScore', 'ConfidenceScore']),
      validationStatus: this.readString(line, ['validationStatus', 'ValidationStatus']) || undefined,
      isConfirmed: this.readBoolean(line, ['isConfirmed', 'IsConfirmed']) || false,
      errorMessage: this.readString(line, ['errorMessage', 'ErrorMessage']) || undefined,
      sourcePageNo: this.readNumber(line, ['sourcePageNo', 'SourcePageNo']),
      sourceX: this.readNumber(line, ['sourceX', 'SourceX']),
      sourceY: this.readNumber(line, ['sourceY', 'SourceY']),
      sourceWidth: this.readNumber(line, ['sourceWidth', 'SourceWidth']),
      sourceHeight: this.readNumber(line, ['sourceHeight', 'SourceHeight']),
      sourceText: this.readString(line, ['sourceText', 'SourceText']) || undefined,
    };
  }

  normalizeLog(log: DocumentImportLog): DocumentImportLog {
    return {
      ...log,
      systemId: this.readString(log, ['systemId', 'SystemId']) || '',
      importNo: this.readString(log, ['importNo', 'ImportNo']) || '',
      timestamp: this.readString(log, ['timestamp', 'Timestamp', 'createdOn', 'CreatedOn']) || undefined,
      level: this.readString(log, ['level', 'Level']) || undefined,
      step: this.readString(log, ['step', 'Step']) || undefined,
      status: this.readString(log, ['status', 'Status']) || undefined,
      message: this.readString(log, ['message', 'Message']) || undefined,
    };
  }

  normalizeReviewIssue(issue: DocumentImportReviewIssue): DocumentImportReviewIssue {
    return {
      ...issue,
      systemId: this.readString(issue, ['systemId', 'SystemId']) || '',
      importNo: this.readString(issue, ['importNo', 'ImportNo']) || '',
      scope: this.readString(issue, ['scope', 'Scope']) || undefined,
      recordSystemId: this.readString(issue, ['recordSystemId', 'RecordSystemId']) || undefined,
      fieldCode: this.readString(issue, ['fieldCode', 'FieldCode']) || undefined,
      lineNo: this.readNumber(issue, ['lineNo', 'LineNo']),
      severity: this.readString(issue, ['severity', 'Severity']) || undefined,
      message: this.readString(issue, ['message', 'Message']) || undefined,
      suggestedFix: this.readString(issue, ['suggestedFix', 'SuggestedFix']) || undefined,
      issueCode: this.readString(issue, ['issueCode', 'IssueCode']) || undefined,
      sourcePageNo: this.readNumber(issue, ['sourcePageNo', 'SourcePageNo']),
      sourceX: this.readNumber(issue, ['sourceX', 'SourceX']),
      sourceY: this.readNumber(issue, ['sourceY', 'SourceY']),
      sourceWidth: this.readNumber(issue, ['sourceWidth', 'SourceWidth']),
      sourceHeight: this.readNumber(issue, ['sourceHeight', 'SourceHeight']),
      sourceText: this.readString(issue, ['sourceText', 'SourceText']) || undefined,
    };
  }

  private getImportRecordPath(systemId: string): string {
    if (!this.isGuid(systemId)) {
      throw new Error(`Invalid document import systemId: ${systemId}`);
    }

    return `/documentImports(${systemId})`;
  }

  private isGuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim());
  }

  private readCollection<T>(response: unknown): T[] {
    const value = (response as { value?: T[] })?.value;
    if (Array.isArray(value)) {
      return value;
    }

    if (Array.isArray(response)) {
      return response as T[];
    }

    return [];
  }

  normalizeHeaders(response: unknown): DocumentImportHeader[] {
    return this.readCollection<DocumentImportHeader>(response).map((item) => this.normalizeHeader(item));
  }

  private escapeODataLiteral(value: string): string {
    return String(value || '').replace(/'/g, "''");
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

  private readBoolean(source: Record<string, unknown>, keys: string[]): boolean | undefined {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'boolean') {
        return value;
      }

      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') {
          return true;
        }

        if (normalized === 'false') {
          return false;
        }
      }
    }

    return undefined;
  }
}
