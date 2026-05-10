import { Injectable } from '@angular/core';

import {
  DocumentImportField,
  DocumentParserStrategy,
  DocumentParseContext,
  DocumentParseResult,
} from './document-import.models';

@Injectable({
  providedIn: 'root',
})
export class ManualFallbackParserService implements DocumentParserStrategy {
  readonly code = 'manualFallback';
  readonly name = 'Manual Fallback Parser';

  canParse(): boolean {
    return true;
  }

  parse(context: DocumentParseContext): DocumentParseResult {
    const fields: DocumentImportField[] = [
      this.buildField('DocumentDate', 'Document Date', '', false, 0),
      this.buildField('CurrencyCode', 'Currency', '', false, 0),
    ];

    const summary = context.rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !!line)
      .slice(0, 4)
      .join(' | ');

    if (summary) {
      fields.push(this.buildField('DocumentSummary', 'Document Summary', summary.slice(0, 220), false, 0.35));
    }

    return {
      fields,
      lines: [],
      confidence: 0.25,
      issues: [
        {
          scope: 'Header',
          severity: 'Warning',
          message: 'OCR text was extracted, but no parser matched confidently.',
          suggestedFix: 'Review the PDF and enter required header values manually.',
        },
        {
          scope: 'Line',
          severity: 'Warning',
          message: 'Line extraction needs review. Please enter or correct lines manually.',
          suggestedFix: 'Use Add line and fill the purchase line values from the PDF.',
        },
      ],
      parserCode: this.code,
      parserName: this.name,
    };
  }

  private buildField(
    fieldCode: string,
    label: string,
    value: string,
    required: boolean,
    confidence: number
  ): DocumentImportField {
    return {
      systemId: `local-fallback-${fieldCode}`,
      importNo: '',
      fieldCode,
      fieldName: fieldCode,
      sourceLabel: label,
      displayName: label,
      extractedValue: value,
      correctedValue: value,
      confidenceScore: confidence,
      isRequired: required,
      isConfirmed: false,
      validationStatus: 'Pending',
      sourceText: value,
    };
  }
}
