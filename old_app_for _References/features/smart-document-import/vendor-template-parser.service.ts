import { Injectable } from '@angular/core';

import {
  DocumentImportField,
  DocumentParserStrategy,
  DocumentParseContext,
  DocumentParseResult,
  TemplateFieldRule,
  VendorDocumentTemplate,
} from './document-import.models';
import { GenericPurchaseDocumentParserService } from './generic-purchase-document-parser.service';
import { VENDOR_DOCUMENT_TEMPLATES } from './vendor-document-templates';

@Injectable({
  providedIn: 'root',
})
export class VendorTemplateParserService implements DocumentParserStrategy {
  readonly code = 'vendorTemplate';
  readonly name = 'Vendor Template Parser';

  constructor(private genericParser: GenericPurchaseDocumentParserService) {}

  canParse(context: DocumentParseContext): boolean {
    return !!this.findTemplate(context);
  }

  parse(context: DocumentParseContext): DocumentParseResult {
    const template = this.findTemplate(context);
    const genericResult = this.genericParser.parse(context);

    if (!template) {
      return genericResult;
    }

    const templateFields = template.headerRules
      .map((rule, index) => this.parseTemplateField(rule, index, context.rawText))
      .filter((field): field is DocumentImportField => !!field);

    const mergedFields = this.mergeFields(genericResult.fields, templateFields);

    return {
      ...genericResult,
      fields: mergedFields,
      parserCode: template.templateCode,
      parserName: `${this.name}: ${template.templateCode}`,
      confidence: Math.min(genericResult.confidence + 0.08, 1),
    };
  }

  private findTemplate(context: DocumentParseContext): VendorDocumentTemplate | undefined {
    const vendorName = context.vendorName || this.detectSourceSupplierText(context);

    return VENDOR_DOCUMENT_TEMPLATES.find((template) => {
      if (template.documentType && template.documentType !== context.targetDocumentType) {
        return false;
      }

      if (template.vendorNo && context.vendorNo && template.vendorNo === context.vendorNo) {
        return true;
      }

      if (!template.vendorNamePattern) {
        return false;
      }

      return !!vendorName && new RegExp(template.vendorNamePattern, 'i').test(vendorName);
    });
  }

  private detectSourceSupplierText(context: DocumentParseContext): string {
    const rows = context.pages.flatMap((page) => page.rows || []);
    if (!rows.length) {
      return '';
    }

    const sourceRows: string[] = [];
    for (const row of rows.slice(0, 18)) {
      if (/^\s*(?:to|bill\s*to|ship\s*to|deliver\s*to)\b/i.test(row.text)) {
        break;
      }

      sourceRows.push(row.text);
    }

    return sourceRows.join(' ');
  }

  private parseTemplateField(rule: TemplateFieldRule, index: number, rawText: string): DocumentImportField | null {
    const value = this.findValue(rule, rawText);
    if (!value && !rule.required) {
      return null;
    }

    return {
      systemId: `local-template-field-${index + 1}`,
      importNo: '',
      fieldCode: rule.fieldCode,
      fieldName: rule.fieldCode,
      sourceLabel: this.toLabel(rule.fieldCode),
      displayName: this.toLabel(rule.fieldCode),
      extractedValue: this.normalizeValue(rule.fieldCode, value),
      correctedValue: this.normalizeValue(rule.fieldCode, value),
      confidenceScore: value ? 0.9 : 0,
      isRequired: !!rule.required,
      isConfirmed: false,
      validationStatus: 'Pending',
      sourceText: value,
    };
  }

  private findValue(rule: TemplateFieldRule, rawText: string): string {
    if (rule.valueRegex) {
      const regex = new RegExp(rule.valueRegex, 'i');
      const direct = rawText.match(regex)?.[1];
      if (direct) {
        return direct.trim();
      }
    }

    const lines = rawText
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !!line);

    const labelRegexes = rule.labelPatterns.map((pattern) => new RegExp(pattern, 'i'));
    const index = lines.findIndex((line) => labelRegexes.some((regex) => regex.test(line)));

    if (index === -1) {
      return '';
    }

    const sameLine = lines[index].replace(labelRegexes[0], '').replace(/^[\s:#-]+/, '').trim();
    if (sameLine && sameLine.length > 1) {
      return sameLine;
    }

    return lines[index + 1] || '';
  }

  private mergeFields(baseFields: DocumentImportField[], templateFields: DocumentImportField[]): DocumentImportField[] {
    const result = [...baseFields];

    templateFields.forEach((templateField) => {
      const index = result.findIndex((field) =>
        String(field.fieldCode || field.fieldName).toLowerCase() ===
        String(templateField.fieldCode || templateField.fieldName).toLowerCase()
      );

      if (index === -1) {
        result.push(templateField);
        return;
      }

      const existing = result[index];
      result[index] = {
        ...existing,
        ...templateField,
        systemId: existing.systemId,
        importNo: existing.importNo,
      };
    });

    return result;
  }

  private normalizeValue(fieldCode: string, value: string): string {
    const text = String(value || '').trim();
    if (!text) {
      return '';
    }

    if (fieldCode === 'CurrencyCode' && text.toUpperCase() === 'RM') {
      return 'MYR';
    }

    if (/date/i.test(fieldCode)) {
      const parsed = new Date(text);
      if (!Number.isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
        const day = `${parsed.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    return text;
  }

  private toLabel(fieldCode: string): string {
    return fieldCode
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (char) => char.toUpperCase())
      .trim();
  }
}
