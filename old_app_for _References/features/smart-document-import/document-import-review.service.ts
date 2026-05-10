import { Injectable } from '@angular/core';

import {
  DocumentImportField,
  DocumentImportIssue,
  DocumentImportLine,
  DocumentImportReviewIssue,
  DocumentParseResult,
  DocumentTextExtractionResult,
} from './document-import.models';

export interface DocumentImportPreparedReview {
  fields: DocumentImportField[];
  lines: DocumentImportLine[];
  issues: DocumentImportReviewIssue[];
  rawText: string;
  extractionMethod: string;
  parserCode: string;
  parserName?: string;
  confidence: number;
  diagnostics: string[];
}

@Injectable({
  providedIn: 'root',
})
export class DocumentImportReviewService {
  prepareReview(
    extraction: DocumentTextExtractionResult,
    parseResult: DocumentParseResult
  ): DocumentImportPreparedReview {
    const parserIssues = (parseResult.issues || []).filter((issue) => !this.isMappingOnlyIssue(issue));
    const derivedIssues = this.deriveIssues(parseResult.fields, parseResult.lines, extraction.confidence);
    const issues = this.dedupeIssues([...parserIssues, ...derivedIssues]).map((issue, index) => this.toReviewIssue(issue, index));

    return {
      fields: parseResult.fields,
      lines: parseResult.lines,
      issues,
      rawText: extraction.rawText,
      extractionMethod: extraction.extractionMethod,
      parserCode: parseResult.parserCode,
      parserName: parseResult.parserName,
      confidence: this.calculateConfidence(extraction.confidence, parseResult.confidence, issues),
      diagnostics: parseResult.diagnostics || [],
    };
  }

  private deriveIssues(
    fields: DocumentImportField[],
    lines: DocumentImportLine[],
    extractionConfidence: number
  ): DocumentImportIssue[] {
    const issues: DocumentImportIssue[] = [];

    fields.forEach((field) => {
      if (this.isMappingOnlyField(field)) {
        return;
      }

      const value = String(field.correctedValue || field.extractedValue || '').trim();
      if (field.isRequired && !value) {
        issues.push({
          scope: 'Header',
          fieldCode: field.fieldCode,
          severity: 'Error',
          message: `${field.displayName || field.fieldCode || 'Required field'} is required.`,
          suggestedFix: 'Enter this value manually or correct the OCR result before creating the draft.',
        });
      }
    });

    if (!lines.length) {
      issues.push({
        scope: 'Line',
        severity: 'Warning',
        message: 'Line extraction needs review. Please enter or correct lines manually.',
        suggestedFix: 'Use Add line and key the line values from the PDF.',
      });
    }

    lines.forEach((line) => {
      const description = String(line.description || '').trim();
      if (!description) {
        issues.push({
          scope: 'Line',
          lineNo: line.lineNo,
          severity: 'Error',
          message: `Line ${line.lineNo || ''} description is required.`,
          suggestedFix: 'Enter a line description.',
        });
      }

      if (line.quantity !== undefined && Number(line.quantity) <= 0) {
        issues.push({
          scope: 'Line',
          lineNo: line.lineNo,
          severity: 'Error',
          message: `Line ${line.lineNo || ''} quantity must be greater than zero.`,
          suggestedFix: 'Correct the quantity from the source document.',
        });
      }

      const hasAmountOrUnitCost = Number(line.lineAmount || 0) > 0 || Number(line.unitCost || 0) > 0;
      if (!hasAmountOrUnitCost) {
        issues.push({
          scope: 'Line',
          lineNo: line.lineNo,
          severity: 'Error',
          message: `Line ${line.lineNo || ''} unit cost or line amount is required.`,
          suggestedFix: 'Correct the amount or unit cost from the source document.',
        });
      }
    });

    if (extractionConfidence > 0 && extractionConfidence < 0.55) {
      issues.push({
        scope: 'Header',
        severity: 'Warning',
        message: 'OCR confidence is low.',
        suggestedFix: 'Review all extracted values carefully before creating the draft.',
      });
    }

    return this.dedupeIssues(issues);
  }

  private toReviewIssue(issue: DocumentImportIssue, index: number): DocumentImportReviewIssue {
    return {
      systemId: `local-issue-${index + 1}`,
      importNo: '',
      scope: issue.scope,
      recordSystemId: issue.recordSystemId,
      fieldCode: issue.fieldCode,
      lineNo: issue.lineNo,
      severity: issue.severity,
      message: issue.message,
      suggestedFix: issue.suggestedFix,
      sourcePageNo: issue.sourcePageNo,
      sourceX: issue.sourceX,
      sourceY: issue.sourceY,
      sourceWidth: issue.sourceWidth,
      sourceHeight: issue.sourceHeight,
      sourceText: issue.sourceText,
    };
  }

  private isMappingOnlyField(field: DocumentImportField): boolean {
    const fieldKey = String(field.fieldCode || field.fieldName || field.sourceLabel || field.displayName || '')
      .replace(/\s+/g, '')
      .toLowerCase();

    return ['vendorno', 'vendor', 'itemno', 'glaccountno', 'g/laccountno'].includes(fieldKey);
  }

  private isMappingOnlyIssue(issue: DocumentImportIssue): boolean {
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

  private calculateConfidence(
    extractionConfidence: number,
    parserConfidence: number,
    issues: DocumentImportReviewIssue[]
  ): number {
    const errorPenalty = issues.filter((issue) => String(issue.severity).toLowerCase() === 'error').length * 0.06;
    const warningPenalty = issues.filter((issue) => String(issue.severity).toLowerCase() === 'warning').length * 0.025;
    const base = extractionConfidence && parserConfidence
      ? (extractionConfidence + parserConfidence) / 2
      : extractionConfidence || parserConfidence || 0;

    return Math.min(Math.max(base - errorPenalty - warningPenalty, 0), 1);
  }

  private dedupeIssues(issues: DocumentImportIssue[]): DocumentImportIssue[] {
    const seen = new Set<string>();

    return issues.filter((issue) => {
      const key = [
        issue.scope,
        issue.fieldCode || '',
        issue.lineNo || '',
        issue.severity,
        issue.message,
      ].join('|');

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }
}
