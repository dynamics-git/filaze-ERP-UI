import { Injectable } from '@angular/core';

import {
  DocumentImportField,
  DocumentImportIssue,
  DocumentImportLine,
  DocumentParserStrategy,
  DocumentParseContext,
  DocumentParseResult,
  SmartImportDocumentType,
} from './document-import.models';

interface ParsedHeaderField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  required?: boolean;
}

interface ParsedLineCandidate {
  itemNo?: string;
  glAccountNo?: string;
  description: string;
  quantity?: number;
  unitOfMeasure?: string;
  unitCost?: number;
  lineAmount?: number;
  confidence: number;
  sourceText: string;
  sourcePageNo?: number;
}

@Injectable({
  providedIn: 'root',
})
export class GenericPurchaseDocumentParserService implements DocumentParserStrategy {
  readonly code = 'genericPurchaseDocument';
  readonly name = 'Generic Purchase Document Parser';

  canParse(context: DocumentParseContext): boolean {
    return this.toLines(context.rawText).length > 0;
  }

  parse(context: DocumentParseContext): DocumentParseResult {
    const lines = this.toLines(context.rawText);
    const headerFields = this.extractHeaderFields(lines, context.pages[0]?.confidence || 0.65);
    const draftFields = headerFields.map((field, index) => this.toFieldDraft(field, index));
    const draftLines = this.extractLineDrafts(lines, context.targetDocumentType);
    const issues = this.buildIssues(draftFields, draftLines);
    const confidence = this.calculateConfidence(draftFields, draftLines, issues);

    return {
      fields: draftFields,
      lines: draftLines,
      confidence,
      issues,
      parserCode: this.code,
      parserName: this.name,
    };
  }

  parseToDraftReview(
    rawText: string,
    targetDocumentType: SmartImportDocumentType | string,
    defaultConfidence: number
  ): { fields: DocumentImportField[]; lines: DocumentImportLine[] } {
    const result = this.parse({
      targetDocumentType,
      fileName: '',
      rawText,
      pages: [
        {
          pageNo: 1,
          rawText,
          confidence: defaultConfidence,
          extractionMethod: 'tesseract',
        },
      ],
    });

    return {
      fields: result.fields,
      lines: result.lines,
    };
  }

  private toLines(rawText: string): string[] {
    return String(rawText || '')
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => !!line);
  }

  private extractHeaderFields(lines: string[], defaultConfidence: number): ParsedHeaderField[] {
    const documentNo = this.findDocumentNo(lines);
    const documentDate = this.findDocumentDate(lines);
    const requiredDate = this.findRequiredDate(lines);
    const supplierName = this.findVendorName(lines);
    const currencyCode = this.findCurrencyCode(lines);
    const totalAmount = this.findTotalAmount(lines);
    const supplierNumber = this.findSupplierNumber(lines);

    return [
      {
        key: 'SupplierName',
        label: 'Supplier Name',
        value: supplierName,
        confidence: supplierName ? defaultConfidence : 0,
      },
      {
        key: 'SupplierNumber',
        label: 'Supplier Number',
        value: supplierNumber,
        confidence: supplierNumber ? defaultConfidence : 0,
      },
      {
        key: 'DocumentNo',
        label: 'Document No',
        value: documentNo,
        confidence: documentNo ? defaultConfidence : 0,
      },
      {
        key: 'DocumentDate',
        label: 'Document Date',
        value: documentDate,
        confidence: documentDate ? defaultConfidence : 0,
      },
      {
        key: 'RequiredDate',
        label: 'Required Date',
        value: requiredDate,
        confidence: requiredDate ? Math.max(0.6, defaultConfidence - 0.08) : 0,
      },
      {
        key: 'CurrencyCode',
        label: 'Currency',
        value: currencyCode,
        confidence: currencyCode ? Math.max(0.7, defaultConfidence - 0.05) : 0,
      },
      {
        key: 'TotalAmount',
        label: 'Total Amount',
        value: totalAmount,
        confidence: totalAmount ? defaultConfidence : 0,
      },
    ];
  }

  private extractLineDrafts(
    lines: string[],
    targetDocumentType: SmartImportDocumentType | string
  ): DocumentImportLine[] {
    const sectionLines = this.extractLineSection(lines);
    const candidateLines = sectionLines.length ? sectionLines : lines;
    const groupedRows = this.groupLineRows(candidateLines);
    const parsedRows = groupedRows
      .map((row) => this.parsePurchaseLine(row))
      .filter((line): line is ParsedLineCandidate => !!line);

    return parsedRows.map((line, index) => ({
      systemId: `local-line-${index + 1}`,
      importNo: '',
      lineNo: (index + 1) * 10000,
      targetDocumentType,
      externalItemCode: line.itemNo || '',
      itemNo: '',
      glAccountNo: line.glAccountNo || '',
      description: line.description,
      quantity: line.quantity,
      unitOfMeasure: line.unitOfMeasure,
      unitCost: line.unitCost,
      lineAmount: line.lineAmount,
      confidenceScore: line.confidence,
      mappingStatus: line.confidence >= 0.72 ? 'Draft' : 'NeedsReview',
      sourceText: line.sourceText,
      sourcePageNo: line.sourcePageNo,
      errorMessage: line.confidence < 0.55 ? 'Line extraction needs review. Please verify values manually.' : undefined,
    }));
  }

  private extractLineSection(lines: string[]): string[] {
    const startIndex = lines.findIndex((line) =>
      /(?:^|\s)(no\.?|item|description)(?:\s|$)/i.test(line) &&
      /(?:quantity|qty|unit|amount|price)/i.test(line)
    );

    if (startIndex === -1) {
      return [];
    }

    const section: string[] = [];
    for (let index = startIndex + 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (/\b(subtotal|sub\s*total|grand\s*total|total\s+(?:rm|myr|usd|sgd|eur|gbp)|bank|vat\s+registration)\b/i.test(line)) {
        break;
      }

      if (/^(?:vat\s*%|line\s+amount|unit\s+price|excl\.?\s+vat)$/i.test(line)) {
        continue;
      }

      section.push(line);
    }

    return section;
  }

  private groupLineRows(lines: string[]): string[] {
    const rows: string[] = [];
    let current = '';

    lines.forEach((line) => {
      if (this.isLineSectionBreak(line)) {
        if (current) {
          rows.push(current);
          current = '';
        }

        return;
      }

      if (this.isTableNoise(line)) {
        return;
      }

      const startsNewRow = this.startsPotentialLine(line);
      if (startsNewRow) {
        if (current) {
          rows.push(current);
        }

        current = line;
        return;
      }

      if (current && this.isDescriptionContinuation(line)) {
        current = `${current} ${line}`;
      }
    });

    if (current) {
      rows.push(current);
    }

    return rows;
  }

  private parsePurchaseLine(line: string): ParsedLineCandidate | null {
    const normalized = line.replace(/\s+/g, ' ').trim();
    if (!normalized || normalized.length < 12) {
      return null;
    }

    if (this.isTableNoise(normalized)) {
      return null;
    }

    const tokens = normalized.split(/\s+/).filter(Boolean);
    const itemNo = this.findItemNo(tokens);
    const amountTokens = this.findAmountTokens(tokens);
    const uomIndex = this.findUomIndex(tokens);

    if (uomIndex <= 0 || amountTokens.length < 1) {
      return null;
    }

    const quantity = this.safeNumber(tokens[uomIndex - 1]);
    if (quantity === undefined || quantity <= 0) {
      return null;
    }

    const unitOfMeasure = tokens[uomIndex];
    const lineAmount = amountTokens[amountTokens.length - 1]?.value;
    const unitCost = amountTokens.length > 1 ? amountTokens[amountTokens.length - 2]?.value : undefined;
    const descriptionStart = itemNo ? tokens.findIndex((token) => token === itemNo) + 1 : 0;
    const descriptionEnd = Math.max(descriptionStart, uomIndex - 1);
    const leadingDescription = tokens
      .slice(descriptionStart, descriptionEnd)
      .join(' ')
      .replace(/\b(?:plan|remark)\s*:?$/i, '')
      .trim();
    const lastAmountIndex = amountTokens[amountTokens.length - 1]?.index ?? tokens.length - 1;
    const trailingDescription = tokens
      .slice(lastAmountIndex + 1)
      .filter((token) => /[A-Za-z]/.test(token) && !/^(?:subtotal|total|vat|bank)$/i.test(token))
      .join(' ')
      .trim();
    const description = [leadingDescription, trailingDescription].filter((value) => !!value).join(' ').trim();

    if (!description || description.length < 3 || lineAmount === undefined || lineAmount <= 0) {
      return null;
    }

    return {
      itemNo,
      description: description.slice(0, 180),
      quantity,
      unitOfMeasure,
      unitCost,
      lineAmount,
      confidence: itemNo && unitCost !== undefined ? 0.78 : 0.62,
      sourceText: normalized,
    };
  }

  private startsPotentialLine(line: string): boolean {
    const normalized = line.trim();
    if (!normalized || this.isTableNoise(normalized)) {
      return false;
    }

    if (/^[A-Z0-9][A-Z0-9-]{2,}\s+.+\b\d+(?:\.\d+)?\s+[A-Za-z]{2,}\b/.test(normalized)) {
      return true;
    }

    return /\b\d+(?:\.\d+)?\s+(?:PCS|PC|EA|UNIT|UNITS|YEAR|MONTH|DAY|HOUR|KG|L|M)\b/i.test(normalized) &&
      this.findAmountTokens(normalized.split(/\s+/)).length > 0;
  }

  private isDescriptionContinuation(line: string): boolean {
    if (!line || this.isTableNoise(line)) {
      return false;
    }

    return !this.isLineSectionBreak(line);
  }

  private isLineSectionBreak(line: string): boolean {
    return /\b(subtotal|sub\s*total|grand\s*total|total\s+(?:rm|myr|usd|sgd|eur|gbp)|bank|payment\s+terms|period\s+cover|remark)\b/i.test(line);
  }

  private isTableNoise(line: string): boolean {
    return /^[-_]+$/.test(line) ||
      /^no\.?\s+description/i.test(line) ||
      /^(?:no\.?|description|quantity|unit|unit\s+price|line\s+amount|vat\s*%)$/i.test(line) ||
      /\b(payment\s+terms|document\s+date|due\s+date|period\s+cover|remark)\b/i.test(line);
  }

  private findItemNo(tokens: string[]): string | undefined {
    const token = tokens.find((item, index) => {
      if (index === 0 && /^\d{1,4}$/.test(item) && tokens[index + 1]) {
        return false;
      }

      return /^[A-Z0-9][A-Z0-9-]{2,}$/.test(item) && (/[A-Z]/i.test(item) || /^\d{4,}$/.test(item)) && /\d/.test(item);
    });
    return token;
  }

  private findUomIndex(tokens: string[]): number {
    const uomPattern = /^(PCS|PC|EA|EACH|UNIT|UNITS|YEAR|YEARS|MONTH|MONTHS|DAY|DAYS|HOUR|HOURS|KG|L|M)$/i;
    return tokens.findIndex((token, index) => index > 0 && uomPattern.test(token) && this.safeNumber(tokens[index - 1]) !== undefined);
  }

  private findAmountTokens(tokens: string[]): Array<{ index: number; value: number }> {
    const amountPattern = /^(?:RM|MYR|USD|SGD|EUR|GBP)?\s*-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?$|^-?\d+\.\d{2}$/i;

    return tokens
      .map((token, index) => ({ token, index, value: this.safeNumber(token) }))
      .filter((item): item is { token: string; index: number; value: number } =>
        item.value !== undefined && amountPattern.test(item.token) && Math.abs(item.value) > 0
      )
      .map((item) => ({ index: item.index, value: item.value }));
  }

  private toFieldDraft(field: ParsedHeaderField, index: number): DocumentImportField {
    return {
      systemId: `local-field-${index + 1}`,
      importNo: '',
      fieldCode: field.key,
      fieldName: field.key,
      sourceLabel: field.label,
      displayName: field.label,
      extractedValue: field.value,
      correctedValue: field.value,
      confidenceScore: field.confidence,
      isRequired: !!field.required,
      isConfirmed: false,
      validationStatus: field.required && !field.value ? 'Pending' : 'Pending',
      sourceText: field.value,
    };
  }

  private buildIssues(fields: DocumentImportField[], lines: DocumentImportLine[]): DocumentImportIssue[] {
    const issues: DocumentImportIssue[] = [];

    fields.forEach((field) => {
      const value = String(field.correctedValue || field.extractedValue || '').trim();
      if (field.isRequired && !value) {
        issues.push({
          scope: 'Header',
          fieldCode: field.fieldCode,
          severity: 'Error',
          message: `${field.displayName || field.fieldCode} is required.`,
          suggestedFix: 'Enter or map this value before creating the draft.',
        });
      }
    });

    if (!lines.length) {
      issues.push({
        scope: 'Line',
        severity: 'Warning',
        message: 'Line extraction needs review. Please enter or correct lines manually.',
        suggestedFix: 'Use Add line and fill the purchase line values from the PDF.',
      });
    }

    return issues;
  }

  private calculateConfidence(
    fields: DocumentImportField[],
    lines: DocumentImportLine[],
    issues: DocumentImportIssue[]
  ): number {
    const scores = [...fields, ...lines]
      .map((item) => Number(item.confidenceScore))
      .filter((score) => !Number.isNaN(score) && score > 0);

    const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0.4;
    const penalty = issues.filter((issue) => String(issue.severity).toLowerCase() === 'error').length * 0.08;
    return Math.min(Math.max(average - penalty, 0), 1);
  }

  private findByRegex(lines: string[], regex: RegExp): string {
    for (const line of lines) {
      const match = line.match(regex);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return '';
  }

  private findDocumentNo(lines: string[]): string {
    const joined = lines.join(' ');

    // Highest priority: explicit PO number after "No.:" in purchase order documents.
    const explicitPoNo = joined.match(/\bNo\.?\s*[:#-]?\s*(PO[A-Z0-9-]*\d[A-Z0-9-]*)\b/i)?.[1];
    if (explicitPoNo) {
      return explicitPoNo.toUpperCase();
    }

    const purchaseOrderNo = joined.match(/\bPurchase\s+Order\b[\s\S]{0,80}?\bNo\.?\s*[:#-]?\s*([A-Z]{1,6}[A-Z0-9-]*\d[A-Z0-9-]*)\b/i)?.[1];
    if (purchaseOrderNo) {
      return purchaseOrderNo.toUpperCase();
    }

    const labelledPo = this.findByRegex(lines, /\b(?:purchase\s+order|order)\s*(?:no\.?|number|#)?\s*[:#-]?\s*([A-Z]{1,6}[A-Z0-9-]*\d[A-Z0-9-]*)\b/i);
    if (labelledPo) {
      return labelledPo.toUpperCase();
    }

    const invoiceNo = this.findByRegex(lines, /\b(?:invoice|inv|doc(?:ument)?)\s*(?:no\.?|number|#)?\s*[:#-]?\s*([A-Z]{1,6}[A-Z0-9-]*\d[A-Z0-9-]*)\b/i);
    if (invoiceNo) {
      return invoiceNo.toUpperCase();
    }

    const fallbackNo = this.findByRegex(
      lines.filter((line) => !/\bco\.?\s*reg\b/i.test(line)),
      /\bno\.?\s*[:#-]?\s*([A-Z]{1,6}[A-Z0-9-]*\d[A-Z0-9-]{3,})\b/i
    );

    return fallbackNo ? fallbackNo.toUpperCase() : '';
  }


  private findDocumentDate(lines: string[]): string {
    return this.findDateNearLabel(lines, /document\s+date|invoice\s+date|order\s+date|date/i);
  }

  private findRequiredDate(lines: string[]): string {
    return this.findDateNearLabel(lines, /due\s+date|required\s+date|requested\s+receipt/i);
  }

  private findDateNearLabel(lines: string[], labelRegex: RegExp): string {
    const inline = this.findByRegex(
      lines,
      new RegExp(`${labelRegex.source}\\s*[:#-]?\\s*((?:\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{2,4})|(?:[A-Za-z]+\\s+\\d{1,2},\\s+\\d{4}))`, 'i')
    );

    if (inline) {
      return this.normalizeDate(inline);
    }

    const index = lines.findIndex((line) => labelRegex.test(line));
    if (index !== -1) {
      for (let offset = 1; offset <= 3; offset += 1) {
        const candidate = this.findDateToken(lines[index + offset] || '');
        if (candidate) {
          return this.normalizeDate(candidate);
        }
      }
    }

    return this.normalizeDate(this.findDateToken(lines.join(' ')));
  }

  private findDateToken(text: string): string {
    return (
      text.match(/\b\d{1,2}\.?\s+[A-Za-z]+\s+\d{4}\b/)?.[0] ||
      text.match(/\b[A-Za-z]+\s+\d{1,2},\s+\d{4}\b/)?.[0] ||
      text.match(/\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/)?.[0] ||
      ''
    );
  }

  private findCurrencyCode(lines: string[]): string {
    const text = lines.join(' ');
    if (/\b(?:RM|MYR)\b/i.test(text)) {
      return 'MYR';
    }

    const code = text.match(/\b(USD|SGD|EUR|GBP)\b/i)?.[1];
    return code ? code.toUpperCase() : '';
  }

  private findTotalAmount(lines: string[]): string {
    const priorityLines = lines.filter((line) =>
      /\b(total\s*amount|grand\s*total|amount\s*due|total\s+(?:rm|myr|usd|sgd|eur|gbp))\b/i.test(line)
    );
    const candidateFromPriority = this.pickLargestAmount(priorityLines);
    if (candidateFromPriority) {
      return candidateFromPriority;
    }

    return this.pickLargestAmount(lines.filter((line) => /\btotal\b/i.test(line) && !/\bsub\s*total\b/i.test(line)));
  }

  private findVendorName(lines: string[]): string {
    const supplierLine = lines.find((line) =>
      /\b(?:sdn\s+bhd|pte\s+ltd|limited|llc|inc\.?|corp\.?)\b/i.test(line) &&
      !this.isLikelyAddressLine(line)
    );
    if (supplierLine) {
      return supplierLine.trim();
    }

    return '';
  }

  private findSupplierNumber(lines: string[]): string {
    const labels = /\b(?:supplier\s*(?:number|no\.?|code)|vendor\s*(?:number|no\.?|code)|vendor\s*code|company\s*(?:number|no\.?))\b/i;
    const codePattern = /\b([A-Z0-9][A-Z0-9\/-]{1,})\b/i;

    for (const line of lines) {
      if (!labels.test(line)) {
        continue;
      }

      const afterLabel = line.replace(
        /^.*?\b(?:supplier\s*(?:number|no\.?|code)|vendor\s*(?:number|no\.?|code)|vendor\s*code|company\s*(?:number|no\.?))\b\s*[:#-]?\s*/i,
        ''
      );

      const match = afterLabel.match(codePattern)?.[1];

      if (match && !/^(?:no|number|code|vendor|supplier|company|to)$/i.test(match)) {
        return match.trim();
      }
    }

    return '';
  }

  private isLikelyAddressLine(text: string): boolean {
    const normalized = String(text || '').toLowerCase();
    return /\b(?:jalan|jln|street|st\.?|road|rd\.?|avenue|ave\.?|lorong|block|level|suite|floor|kuala\s+lumpur|selangor|malaysia|wp|fax|phone|commerce\s+one|menara|tower)\b/.test(normalized) ||
      /^\d+[\/\-]/.test(normalized) ||
      /\b\d{5}\b/.test(normalized);
  }

  private pickLargestAmount(lines: string[]): string {
    let max = 0;
    let picked = '';

    lines.forEach((line) => {
      const matches = line.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})\b|\b\d+\.\d{2}\b/g) || [];
      matches.forEach((token) => {
        const numeric = this.safeNumber(token) || 0;
        if (numeric > max) {
          max = numeric;
          picked = token;
        }
      });
    });

    return picked;
  }

  private normalizeDate(value: string): string {
    const text = String(value || '').trim();
    if (!text) {
      return '';
    }

    const dottedMonth = text.match(/^(\d{1,2})\.?\s+([A-Za-z]+)\s+(\d{4})$/);
    if (dottedMonth) {
      return this.normalizeDate(`${dottedMonth[2]} ${dottedMonth[1]}, ${dottedMonth[3]}`);
    }

    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) {
      return text;
    }

    const year = parsed.getFullYear();
    const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
    const day = `${parsed.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private safeNumber(value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }

    const cleaned = String(value).replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}
