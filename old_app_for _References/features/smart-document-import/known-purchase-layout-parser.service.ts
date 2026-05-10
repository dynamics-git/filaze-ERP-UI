import { Injectable } from '@angular/core';

import {
  DocumentImportField,
  DocumentImportIssue,
  DocumentImportLine,
  DocumentParserStrategy,
  DocumentParseContext,
  DocumentParseResult,
  ExtractedTextRow,
} from './document-import.models';
import { GenericPurchaseDocumentParserService } from './generic-purchase-document-parser.service';
import { PurchaseTableProfileParserService } from './purchase-table-profile-parser.service';

interface HeaderValue {
  value: string;
  confidence: number;
}

@Injectable({
  providedIn: 'root',
})
export class KnownPurchaseLayoutParserService implements DocumentParserStrategy {
  readonly code = 'purchaseTableProfile';
  readonly name = 'Purchase Table Profile Parser';

  constructor(
    private genericParser: GenericPurchaseDocumentParserService,
    private tableParser: PurchaseTableProfileParserService
  ) {}

  canParse(context: DocumentParseContext): boolean {
    return !!context;
  }

  parse(context: DocumentParseContext): DocumentParseResult {
    const rows = this.tableParser.getRows(context);
    const tableResult = this.tableParser.parse(context);
    const genericResult = this.genericParser.parse(context);
    const fields = this.extractHeaderFields(context, rows, genericResult.fields, tableResult.lines);
    const lines = this.tableParser.toDocumentImportLines(tableResult.lines, context.targetDocumentType);
    const issues = this.buildIssues(fields, lines, tableResult.detection);
    const confidence = this.calculateConfidence(fields, lines, issues, tableResult.detection?.score || 0);

    return {
      fields,
      lines,
      confidence,
      issues,
      parserCode: tableResult.detection?.profile.code || this.code,
      parserName: tableResult.detection?.profile.name || this.name,
      diagnostics: [
        ...tableResult.diagnostics,
        `Header fields extracted: ${fields.filter((field) => !!String(field.extractedValue || '').trim()).length}/${fields.length}`,
        `Missing extraction fields: ${fields
          .filter((field) => field.isRequired && !String(field.extractedValue || '').trim())
          .map((field) => field.fieldCode)
          .join(', ') || 'none'}`,
      ],
    };
  }

  private extractHeaderFields(
    context: DocumentParseContext,
    rows: ExtractedTextRow[],
    fallbackFields: DocumentImportField[],
    parsedLines: Array<{ lineAmount?: number }>
  ): DocumentImportField[] {
    const fallback = (fieldCode: string) =>
      String(fallbackFields.find((field) => field.fieldCode === fieldCode)?.extractedValue || '').trim();
    const supplierName = this.findSupplierName(rows) || fallback('SupplierName');
    const supplierCode = this.findValueByLabels(
      rows,
      [/pay-?to\s+vendor\s+no\.?/i, /supplier\s+code/i, /vendor\s+code/i],
      /\b([A-Z]{1,4}-[A-Z0-9]{2,}|[A-Z0-9]{3,}-[A-Z0-9]{2,}|[A-Z]{2,}\d{2,}[A-Z0-9-]*)\b/i
    ).value;
    const documentNo = this.findDocumentNo(rows, context.fileName) || fallback('DocumentNo');
    const documentDate = this.findDateByLabels(rows, [/document\s+date/i, /invoice\s+date/i, /order\s+date/i, /\bdate\b/i]).value || fallback('DocumentDate');
    const requiredDate = this.findDateByLabels(rows, [/due\s+date/i, /deliver\s+date/i, /delivery\s+date/i, /required\s+date/i, /receive\s+by/i]).value || fallback('RequiredDate');
    const currencyCode = this.findCurrencyCode(rows) || fallback('CurrencyCode');
    const totalAmount = this.findTotalAmount(rows, parsedLines) || fallback('TotalAmount');

    return [
      this.field('SupplierName', 'Supplier Name', supplierName, supplierName ? 0.76 : 0, false),
      this.field('SupplierCode', 'Supplier Code', supplierCode, supplierCode ? 0.88 : 0, false),
      this.field('DocumentNo', 'Document No', documentNo, documentNo ? 0.9 : 0, false),
      this.field('DocumentDate', 'Document Date', documentDate, documentDate ? 0.9 : 0, true),
      this.field('RequiredDate', 'Required Date', requiredDate, requiredDate ? 0.86 : 0, false),
      this.field('CurrencyCode', 'Currency', currencyCode, currencyCode ? 0.78 : 0, false),
      this.field('TotalAmount', 'Total Amount', totalAmount, totalAmount ? 0.82 : 0, false),
    ];
  }

  private buildIssues(
    fields: DocumentImportField[],
    lines: DocumentImportLine[],
    detection: { profile: { code: string } } | undefined
  ): DocumentImportIssue[] {
    const issues: DocumentImportIssue[] = [];

    if (!detection) {
      issues.push({
        scope: 'Line',
        severity: 'Warning',
        message: 'No purchase table header was detected.',
        suggestedFix: 'Review the PDF and add or correct lines manually.',
      });
    }

    const documentDate = fields.find((field) => field.fieldCode === 'DocumentDate');
    if (!String(documentDate?.extractedValue || '').trim()) {
      issues.push({
        scope: 'Header',
        fieldCode: 'DocumentDate',
        severity: 'Warning',
        message: 'Document date was not extracted.',
        suggestedFix: 'Enter the document date from the source document if required.',
      });
    }

    if (!lines.length) {
      issues.push({
        scope: 'Line',
        severity: 'Warning',
        message: 'Line extraction needs review.',
        suggestedFix: 'Add or correct lines manually from the PDF.',
      });
    }

    lines.forEach((line) => {
      if (!String(line.description || '').trim()) {
        issues.push({
          scope: 'Line',
          lineNo: line.lineNo,
          severity: 'Warning',
          message: `Line ${line.lineNo || ''}: description was not extracted.`,
          suggestedFix: 'Enter the line description from the PDF.',
        });
      }

      if (line.quantity !== undefined && Number(line.quantity) <= 0) {
        issues.push({
          scope: 'Line',
          lineNo: line.lineNo,
          severity: 'Warning',
          message: `Line ${line.lineNo || ''}: quantity needs review.`,
          suggestedFix: 'Correct the extracted quantity.',
        });
      }

      if (!Number(line.unitCost || 0) && !Number(line.lineAmount || 0)) {
        issues.push({
          scope: 'Line',
          lineNo: line.lineNo,
          severity: 'Warning',
          message: `Line ${line.lineNo || ''}: unit cost or line amount was not extracted.`,
          suggestedFix: 'Enter the cost or amount from the PDF.',
        });
      }
    });

    return issues;
  }

  private findSupplierName(rows: ExtractedTextRow[]): string {
    const fromToSection = this.findSupplierNameFromToSection(rows);
    if (fromToSection) {
      return fromToSection;
    }

    const supplierLabelPatterns = [/supplier\s+info/i, /\bsupplier\b/i, /\bvendor\b/i, /\bpay-?to\b/i];
    const labeled = this.findValueByLabels(rows, supplierLabelPatterns, /(.+)/i);
    if (labeled.value && !/supplier\s+info/i.test(labeled.value)) {
      const cleaned = this.cleanLabelValue(labeled.value);
      if (cleaned && !this.isLikelyAddressLine(cleaned) && this.supplierCandidateScore(cleaned) >= 1) {
        return cleaned;
      }
    }

    const nearbyLabelCandidate = this.findSupplierNameNearLabel(rows, supplierLabelPatterns);
    if (nearbyLabelCandidate) {
      return nearbyLabelCandidate;
    }

    const companyRow = rows.find((row) =>
      /\b(?:sdn\s+bhd|pte\s+ltd|limited|ltd\.?|llc|inc\.?|corp\.?|corporation)\b/i.test(row.text) &&
      !/\b(?:ship-?to|bill-?to)\b/i.test(row.text)
    );

    const company = this.cleanLabelValue(companyRow?.text || '');
    return this.isLikelyAddressLine(company) ? '' : company;
  }

  private findSupplierNameNearLabel(rows: ExtractedTextRow[], labels: RegExp[]): string {
    for (let index = 0; index < rows.length; index += 1) {
      const text = String(rows[index].text || '').replace(/\s+/g, ' ').trim();
      if (!text) {
        continue;
      }

      const isLabel = labels.some((label) => label.test(text));
      if (!isLabel) {
        continue;
      }

      let bestCandidate = '';
      let bestScore = -1;
      for (let offset = 1; offset <= 6; offset += 1) {
        const candidate = String(rows[index + offset]?.text || '').replace(/\s+/g, ' ').trim();
        if (!candidate) {
          continue;
        }

        if (/order\s+date|document\s+date|deliver\s+date|delivery\s+date|quotation|ref\s*no|no\s*:?/i.test(candidate)) {
          continue;
        }

        if (this.isLikelyAddressLine(candidate) || !/[A-Za-z]/.test(candidate)) {
          continue;
        }

        const score = this.supplierCandidateScore(candidate);
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate && bestScore >= 1) {
        return this.cleanLabelValue(bestCandidate);
      }
    }

    return '';
  }

  private findSupplierNameFromToSection(rows: ExtractedTextRow[]): string {
    for (let index = 0; index < rows.length; index += 1) {
      const rowText = String(rows[index].text || '').replace(/\s+/g, ' ').trim();
      if (!/^t[o0]\b/i.test(rowText)) {
        continue;
      }

      const inline = rowText.replace(/^t[o0]\b\s*[:\-]?\s*/i, '').trim();
      if (
        inline &&
        /[A-Za-z]/.test(inline) &&
        !/vendor\s+code|document\s+date/i.test(inline) &&
        !this.isLikelyAddressLine(inline) &&
        this.supplierCandidateScore(inline) >= 1
      ) {
        return this.cleanLabelValue(inline);
      }

      let bestCandidate = '';
      let bestScore = -1;

      for (let offset = 1; offset <= 4; offset += 1) {
        const candidate = String(rows[index + offset]?.text || '').replace(/\s+/g, ' ').trim();
        if (!candidate) {
          continue;
        }

        if (/vendor\s+code|document\s+date|payment\s+terms|shipment\s+method/i.test(candidate)) {
          break;
        }

        if (!/[A-Za-z]/.test(candidate) || /^\d+[\/,-]?\s*$/.test(candidate) || this.isLikelyAddressLine(candidate)) {
          continue;
        }

        const score = this.supplierCandidateScore(candidate);
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate) {
        return this.cleanLabelValue(bestCandidate);
      }
    }

    return '';
  }

  private supplierCandidateScore(text: string): number {
    const normalized = String(text || '').toLowerCase();
    let score = 0;

    if (/\b(?:sdn\s+bhd|pte\s+ltd|limited|ltd\.?|llc|inc\.?|corp\.?|corporation|services|trading|marketing|enterprise|solution|technology|software)\b/.test(normalized)) {
      score += 3;
    }

    if (/\b(?:jalan|jln|street|st\.?|road|rd\.?|avenue|ave\.?|lorong|block|level|suite|floor|kuala\s+lumpur|selangor|malaysia|wp|postcode|fax|phone|commerce\s+one|menara|tower)\b/.test(normalized)) {
      score -= 2;
    }

    if (/\d{2,}/.test(normalized)) {
      score -= 1;
    }

    if (/^[a-z]/i.test(text.trim())) {
      score += 0.5;
    }

    return score;
  }

  private isLikelyAddressLine(text: string): boolean {
    const normalized = String(text || '').toLowerCase();
    return /\b(?:jalan|jln|street|st\.?|road|rd\.?|avenue|ave\.?|lorong|block|level|suite|floor|kuala\s+lumpur|selangor|malaysia|wp|fax|phone|commerce\s+one|menara|tower)\b/.test(normalized) ||
      /^\d+[\/\-]/.test(normalized) ||
      /\b\d{5}\b/.test(normalized);
  }

  private findDocumentNo(rows: ExtractedTextRow[], fileName: string): string {
    return this.findValueByLabels(
      rows,
      [/vendor\s+invoice\s+no\.?/i, /invoice\s+no\.?/i, /po\s+no\.?/i, /purchase\s+order\s+no\.?/i, /order\s+no\.?/i, /(?:^|\s)no\.?\s*:?/i],
      /([A-Z]{0,5}\d[A-Z0-9-]{3,})/i
    ).value || fileName.match(/\b([A-Z]{0,5}\d[A-Z0-9-]{3,})\b/i)?.[1] || '';
  }

  private findDateByLabels(rows: ExtractedTextRow[], labels: RegExp[]): HeaderValue {
    for (const label of labels) {
      const found = this.findValueByLabels(rows, [label], /(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
      const dottedMonth = this.findValueByLabels(rows, [label], /(\d{1,2}\.?\s+[A-Za-z]+\s+\d{4})/i);
      if (found.value) {
        return {
          value: this.normalizeDate(found.value),
          confidence: found.confidence,
        };
      }
      if (dottedMonth.value) {
        return {
          value: this.normalizeDate(dottedMonth.value),
          confidence: dottedMonth.confidence,
        };
      }
    }

    return { value: '', confidence: 0 };
  }

  private findValueByLabels(rows: ExtractedTextRow[], labels: RegExp[], valuePattern: RegExp): HeaderValue {
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const matchingLabel = labels.find((label) => label.test(row.text) || row.items.some((item) => label.test(item.text)));
      if (!matchingLabel) {
        continue;
      }

      const inline = row.text.match(valuePattern)?.[1];
      if (inline && !matchingLabel.test(inline)) {
        return { value: inline.trim(), confidence: 0.84 };
      }

      const labelItem = row.items.find((item) => matchingLabel.test(item.text));
      const rightText = row.items
        .filter((item) => !labelItem || item.x > labelItem.x + Math.max(labelItem.width || 0, 0.01))
        .map((item) => item.text)
        .join(' ');
      const rightValue = rightText.match(valuePattern)?.[1];
      if (rightValue && !matchingLabel.test(rightValue)) {
        return { value: rightValue.trim(), confidence: 0.9 };
      }

      for (let offset = 1; offset <= 2; offset += 1) {
        const nextRow = rows[index + offset];
        if (!nextRow || nextRow.pageNo !== row.pageNo) {
          continue;
        }
        const nextValue = nextRow.text.match(valuePattern)?.[1];
        if (nextValue && !labels.some((label) => label.test(nextValue))) {
          return { value: nextValue.trim(), confidence: 0.72 };
        }
      }
    }

    return { value: '', confidence: 0 };
  }

  private findCurrencyCode(rows: ExtractedTextRow[]): string {
    const text = rows.map((row) => row.text).join(' ');
    if (/\b(?:RM|MYR)\b/i.test(text)) {
      return 'MYR';
    }

    const code = text.match(/\b(USD|SGD|EUR|GBP|AUD|CAD)\b/i)?.[1];
    return code ? code.toUpperCase() : '';
  }

  private findTotalAmount(rows: ExtractedTextRow[], parsedLines: Array<{ lineAmount?: number }>): string {
    const totalRows = rows
      .map((row) => row.text)
      .filter((text) =>
        /\b(total\s+amount|total\s+(?:rm|myr|usd|gbp|incl\.?\s*vat)|amount\s+due|grand\s+total)\b/i.test(text) &&
        !/\bsub\s*total\b/i.test(text)
      );
    const explicit = this.pickRightmostAmount(totalRows);
    if (explicit) {
      return explicit;
    }

    const sum = parsedLines.reduce((total, line) => total + Number(line.lineAmount || 0), 0);
    return sum > 0 ? this.formatAmount(sum) : '';
  }

  private pickRightmostAmount(lines: string[]): string {
    for (const line of [...lines].reverse()) {
      const matches = line.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/g) || [];
      const meaningful = matches
        .map((match) => ({ match, value: this.safeNumber(match) || 0 }))
        .filter((item) => Math.abs(item.value) > 0);
      const picked = meaningful[meaningful.length - 1];
      if (picked) {
        return this.formatAmount(picked.value);
      }
    }

    return '';
  }

  private field(
    fieldCode: string,
    label: string,
    value: string,
    confidenceScore: number,
    isRequired: boolean
  ): DocumentImportField {
    return {
      systemId: `local-profile-field-${fieldCode}`,
      importNo: '',
      fieldCode,
      fieldName: fieldCode,
      sourceLabel: label,
      displayName: label,
      extractedValue: value,
      correctedValue: value,
      confidenceScore,
      isRequired,
      isConfirmed: false,
      validationStatus: 'Pending',
      sourceText: value,
    };
  }

  private cleanLabelValue(value: string): string {
    return String(value || '')
      .replace(/\b(?:supplier\s+info|supplier|vendor|pay-?to)\b\s*:?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeDate(value: string): string {
    const text = String(value || '').trim();
    const dottedMonth = text.match(/^(\d{1,2})\.?\s+([A-Za-z]+)\s+(\d{4})$/);
    if (dottedMonth) {
      return this.normalizeDate(`${dottedMonth[2]} ${dottedMonth[1]}, ${dottedMonth[3]}`);
    }

    const numeric = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (numeric) {
      const day = numeric[1].padStart(2, '0');
      const month = numeric[2].padStart(2, '0');
      const year = numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3];
      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) {
      return text;
    }

    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  }

  private calculateConfidence(
    fields: DocumentImportField[],
    lines: DocumentImportLine[],
    issues: DocumentImportIssue[],
    profileScore: number
  ): number {
    const scores = [...fields, ...lines]
      .map((item) => Number(item.confidenceScore || 0))
      .filter((score) => score > 0);
    const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0.45;
    const warningPenalty = issues.length * 0.025;
    return Math.min(Math.max((average * 0.72) + (profileScore * 0.28) - warningPenalty, 0), 1);
  }

  private safeNumber(value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(String(value).replace(/,/g, '').replace(/[^0-9.-]/g, ''));
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private formatAmount(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
}
