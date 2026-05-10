import { Injectable } from '@angular/core';

import {
  DocumentImportField,
  DocumentImportIssue,
  DocumentImportLine,
  DocumentParserStrategy,
  DocumentParseContext,
  DocumentParseResult,
  ExtractedTextItem,
  ExtractedTextRow,
} from './document-import.models';

interface TecsaColumnMap {
  serial: number;
  itemCode: number;
  description: number;
  quantity: number;
  uom: number;
  unitCost: number;
  amount: number;
}

interface TecsaLineCandidate {
  itemNo: string;
  description: string;
  quantity?: number;
  unitOfMeasure: string;
  unitCost?: number;
  lineAmount?: number;
  sourceText: string;
  sourcePageNo?: number;
  anchor?: Pick<DocumentImportLine, 'sourceX' | 'sourceY' | 'sourceWidth' | 'sourceHeight'>;
}

@Injectable({
  providedIn: 'root',
})
export class TecsaPurchaseOrderParserService implements DocumentParserStrategy {
  readonly code = 'TECSA-PO-V1';
  readonly name = 'TECSA Purchase Order Layout Parser';

  canParse(context: DocumentParseContext): boolean {
    const text = this.normalizeText(context.rawText);
    return /TECSA\s+SOFTWARE\s+SERVICES\s+SDN\s+BHD/i.test(text) &&
      /\bOrder\s+Date\b/i.test(text) &&
      /\bDeliver\s+Date\b/i.test(text) &&
      /\bS\/?No\b/i.test(text) &&
      /\bITEM\s+CODE\b/i.test(text) &&
      /\bDescription\b/i.test(text) &&
      /\bQuantity\b/i.test(text) &&
      /\bUOM\b/i.test(text);
  }

  parse(context: DocumentParseContext): DocumentParseResult {
    const rows = this.getRows(context);
    const headerIndex = this.findTableHeaderIndex(rows);
    const columnMap = headerIndex >= 0 ? this.buildColumnMap(rows[headerIndex]) : this.defaultColumnMap();
    const lines = headerIndex >= 0
      ? this.extractLines(rows.slice(headerIndex + 1), columnMap, context.targetDocumentType)
      : [];
    const fields = this.extractFields(context, rows, lines);
    const issues = this.buildIssues(fields, lines, headerIndex);
    const missingRequired = fields
      .filter((field) => field.isRequired && !String(field.correctedValue || field.extractedValue || '').trim())
      .map((field) => field.fieldCode || field.fieldName || 'field');

    return {
      fields,
      lines,
      confidence: this.calculateConfidence(fields, lines, headerIndex),
      issues,
      parserCode: this.code,
      parserName: this.name,
      diagnostics: [
        `Rows detected: ${rows.length}`,
        `Table header detected: ${headerIndex >= 0 ? 'yes' : 'no'}`,
        `Lines parsed: ${lines.length}`,
        `Missing required fields: ${missingRequired.length ? missingRequired.join(', ') : 'none'}`,
      ],
    };
  }

  private extractFields(
    context: DocumentParseContext,
    rows: ExtractedTextRow[],
    lines: DocumentImportLine[]
  ): DocumentImportField[] {
    const vendorName = this.findRowText(rows, /TECSA\s+SOFTWARE\s+SERVICES\s+SDN\s+BHD/i);
    const documentNo = this.findDocumentNo(rows, context.fileName);
    const documentDate = this.findDateByLabel(rows, /Order\s+Date/i);
    const requiredDate = this.findDateByLabel(rows, /Deliver\s+Date/i);
    const currencyCode = this.hasCurrency(rows, 'RM') ? 'MYR' : '';
    const totalAmount = this.findTotalAmount(rows, lines);

    return [
      this.field('SupplierName', 'Supplier Name', vendorName, vendorName ? 0.92 : 0, false),
      this.field('DocumentNo', 'Document No', documentNo, documentNo ? 0.9 : 0, false),
      this.field('DocumentDate', 'Document Date', documentDate, documentDate ? 0.92 : 0, true),
      this.field('RequiredDate', 'Required Date', requiredDate, requiredDate ? 0.9 : 0, true),
      this.field('CurrencyCode', 'Currency', currencyCode, currencyCode ? 0.76 : 0, false),
      this.field('TotalAmount', 'Total Amount', totalAmount, totalAmount ? 0.78 : 0, false),
    ];
  }

  private extractLines(
    rows: ExtractedTextRow[],
    columns: TecsaColumnMap,
    targetDocumentType: string
  ): DocumentImportLine[] {
    const candidates: TecsaLineCandidate[] = [];
    let current: TecsaLineCandidate | null = null;

    rows.forEach((row) => {
      if (this.isTableEnd(row.text)) {
        if (current) {
          candidates.push(current);
          current = null;
        }

        return;
      }

      if (this.isTableHeaderNoise(row.text)) {
        return;
      }

      const candidate = this.parseLineRow(row, columns);
      if (candidate) {
        if (current) {
          candidates.push(current);
        }

        current = candidate;
        return;
      }

      if (current && this.isContinuationRow(row, columns)) {
        const continuation = this.textBetween(row, columns.description, columns.quantity).trim() || row.text.trim();
        if (continuation) {
          current.description = `${current.description} ${continuation}`.replace(/\s+/g, ' ').trim();
          current.sourceText = `${current.sourceText} ${row.text}`.replace(/\s+/g, ' ').trim();
        }
      }
    });

    if (current) {
      candidates.push(current);
    }

    return candidates
      .filter((line) => !!line.itemNo && !!line.description && Number(line.quantity || 0) > 0)
      .map((line, index) => ({
        systemId: `local-tecsa-po-line-${index + 1}`,
        importNo: '',
        lineNo: (index + 1) * 10000,
        targetDocumentType,
        externalItemCode: line.itemNo,
        itemNo: '',
        glAccountNo: '',
        description: line.description.slice(0, 220),
        quantity: line.quantity,
        unitOfMeasure: line.unitOfMeasure,
        unitCost: line.unitCost,
        lineAmount: line.lineAmount,
        confidenceScore: this.lineConfidence(line),
        mappingStatus: 'Draft',
        sourceText: line.sourceText,
        sourcePageNo: line.sourcePageNo,
        sourceX: line.anchor?.sourceX,
        sourceY: line.anchor?.sourceY,
        sourceWidth: line.anchor?.sourceWidth,
        sourceHeight: line.anchor?.sourceHeight,
      }));
  }

  private parseLineRow(row: ExtractedTextRow, columns: TecsaColumnMap): TecsaLineCandidate | null {
    const textParsed = this.parseLineRowByText(row);
    if (textParsed) {
      return textParsed;
    }

    const serial = this.textBetween(row, 0, this.mid(columns.serial, columns.itemCode));
    const itemNo = this.textBetween(row, this.mid(columns.serial, columns.itemCode), this.mid(columns.itemCode, columns.description));
    const description = this.textBetween(row, this.mid(columns.itemCode, columns.description), this.mid(columns.description, columns.quantity));
    const quantity = this.safeNumber(this.firstNumberText(row, this.mid(columns.description, columns.quantity), this.mid(columns.quantity, columns.uom)));
    const unitOfMeasure = this.textBetween(row, this.mid(columns.quantity, columns.uom), this.mid(columns.uom, columns.unitCost));
    const unitCost = this.safeNumber(this.firstAmountText(row, this.mid(columns.uom, columns.unitCost), this.mid(columns.unitCost, columns.amount)));
    const lineAmount = this.safeNumber(this.firstAmountText(row, this.mid(columns.unitCost, columns.amount), 1));

    const normalizedItemNo = itemNo.replace(/\s+/g, '').trim();
    if (!/^\d+$/.test(serial.trim()) || !/^[A-Z0-9-]{3,}$/i.test(normalizedItemNo)) {
      return this.parseLineRowByText(row);
    }

    if (!description || quantity === undefined || !unitOfMeasure || lineAmount === undefined) {
      return this.parseLineRowByText(row);
    }

    return {
      itemNo: normalizedItemNo,
      description: description.replace(/\s+/g, ' ').trim(),
      quantity,
      unitOfMeasure: unitOfMeasure.replace(/\s+/g, ' ').trim(),
      unitCost,
      lineAmount,
      sourceText: row.text,
      sourcePageNo: row.pageNo,
      anchor: this.rowAnchor(row),
    };
  }

  private parseLineRowByText(row: ExtractedTextRow): TecsaLineCandidate | null {
    const match = row.text
      .replace(/\s+/g, ' ')
      .trim()
      .match(/^(\d+)\s+([A-Z0-9-]{3,})\s+(.+?)\s+(\d+(?:\.\d+)?)\s+([A-Za-z]+)\s+([0-9,]+(?:\.\d{2})?)\s+([0-9,]+(?:\.\d{2})?)$/i);

    if (!match) {
      return null;
    }

    return {
      itemNo: match[2],
      description: match[3].trim(),
      quantity: this.safeNumber(match[4]),
      unitOfMeasure: match[5],
      unitCost: this.safeNumber(match[6]),
      lineAmount: this.safeNumber(match[7]),
      sourceText: row.text,
      sourcePageNo: row.pageNo,
      anchor: this.rowAnchor(row),
    };
  }

  private buildIssues(
    fields: DocumentImportField[],
    lines: DocumentImportLine[],
    headerIndex: number
  ): DocumentImportIssue[] {
    const issues: DocumentImportIssue[] = [];

    fields.forEach((field) => {
      const value = String(field.correctedValue || field.extractedValue || '').trim();
      if (field.isRequired && !value) {
        issues.push({
          scope: 'Header',
          fieldCode: field.fieldCode,
          severity: 'Error',
          message: `${field.displayName || field.fieldCode} is required.`,
          suggestedFix: 'Correct this value from the purchase order before creating the draft.',
        });
      }
    });

    if (headerIndex < 0) {
      issues.push({
        scope: 'Line',
        severity: 'Warning',
        message: 'Table header was not detected.',
        suggestedFix: 'Review the PDF and enter lines manually if needed.',
      });
    }

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

  private getRows(context: DocumentParseContext): ExtractedTextRow[] {
    const rows = context.pages.flatMap((page) => page.rows || []);
    if (rows.length) {
      return rows;
    }

    return context.rawText
      .replace(/\r/g, '')
      .split('\n')
      .map((text, index) => ({
        pageNo: 1,
        y: index / 1000,
        text: text.trim(),
        items: [],
      }))
      .filter((row) => !!row.text);
  }

  private findTableHeaderIndex(rows: ExtractedTextRow[]): number {
    return rows.findIndex((row) =>
      /\bS\/?No\b/i.test(row.text) &&
      /\bITEM\s+CODE\b/i.test(row.text) &&
      /\bDescription\b/i.test(row.text) &&
      /\bQuantity\b/i.test(row.text) &&
      /\bUOM\b/i.test(row.text) &&
      /\bAmount\b/i.test(row.text)
    );
  }

  private buildColumnMap(headerRow: ExtractedTextRow): TecsaColumnMap {
    return {
      serial: this.findColumnX(headerRow, [/^S\/?No$/i, /S\/?No/i], 0.09),
      itemCode: this.findColumnX(headerRow, [/ITEM\s+CODE/i, /^ITEM$/i], 0.16),
      description: this.findColumnX(headerRow, [/Description/i], 0.28),
      quantity: this.findColumnX(headerRow, [/Quantity/i], 0.63),
      uom: this.findColumnX(headerRow, [/UOM/i], 0.69),
      unitCost: this.findColumnX(headerRow, [/Unit\s+Cost/i, /^Unit$/i], 0.77),
      amount: this.findColumnX(headerRow, [/Amount/i], 0.88),
    };
  }

  private defaultColumnMap(): TecsaColumnMap {
    return {
      serial: 0.09,
      itemCode: 0.16,
      description: 0.28,
      quantity: 0.63,
      uom: 0.69,
      unitCost: 0.77,
      amount: 0.88,
    };
  }

  private findColumnX(row: ExtractedTextRow, patterns: RegExp[], fallback: number): number {
    const item = row.items.find((candidate) => patterns.some((pattern) => pattern.test(candidate.text)));
    return item?.x ?? fallback;
  }

  private textBetween(row: ExtractedTextRow, startX: number, endX: number): string {
    return row.items
      .filter((item) => item.x >= startX - 0.012 && item.x < endX - 0.004)
      .map((item) => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private firstNumberText(row: ExtractedTextRow, startX: number, endX: number): string {
    return this.textBetween(row, startX, endX).match(/\d+(?:\.\d+)?/)?.[0] || '';
  }

  private firstAmountText(row: ExtractedTextRow, startX: number, endX: number): string {
    return this.textBetween(row, startX, endX).match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+\.\d{2}/)?.[0] || '';
  }

  private isContinuationRow(row: ExtractedTextRow, columns: TecsaColumnMap): boolean {
    if (!row.text || this.isTableEnd(row.text) || this.isTableHeaderNoise(row.text)) {
      return false;
    }

    const itemNo = this.textBetween(row, this.mid(columns.serial, columns.itemCode), this.mid(columns.itemCode, columns.description));
    const quantity = this.textBetween(row, this.mid(columns.description, columns.quantity), this.mid(columns.quantity, columns.uom));
    return !/^[A-Z0-9-]{3,}$/i.test(itemNo.replace(/\s+/g, '')) && !/\d/.test(quantity);
  }

  private isTableEnd(text: string): boolean {
    return /\b(?:Total\s+Amount|Subtotal|Grand\s+Total|Prepared\s+By|Approved\s+By|Terms|Validity|Remark)\b/i.test(text);
  }

  private isTableHeaderNoise(text: string): boolean {
    return /\b(?:S\/?No|ITEM\s+CODE|Description|Quantity|UOM|Unit\s+Cost|Amount)\b/i.test(text) ||
      /^\(?RM\)?$/i.test(text.trim()) ||
      /^[-_]+$/.test(text.trim());
  }

  private rowAnchor(row: ExtractedTextRow): Pick<DocumentImportLine, 'sourceX' | 'sourceY' | 'sourceWidth' | 'sourceHeight'> | undefined {
    if (!row.items.length) {
      return undefined;
    }

    const minX = Math.min(...row.items.map((item) => item.x));
    const minY = Math.min(...row.items.map((item) => item.y));
    const maxX = Math.max(...row.items.map((item) => item.x + item.width));
    const maxY = Math.max(...row.items.map((item) => item.y + item.height));

    return {
      sourceX: minX,
      sourceY: minY,
      sourceWidth: Math.max(maxX - minX, 0.01),
      sourceHeight: Math.max(maxY - minY, 0.01),
    };
  }

  private findDocumentNo(rows: ExtractedTextRow[], fileName: string): string {
    const fromRow = this.findValueByLabel(rows, /^No$/i, /\b(PO\d{4,})\b/i) ||
      this.findValueByLabel(rows, /\bNo\b/i, /\b(PO\d{4,})\b/i);
    if (fromRow) {
      return fromRow;
    }

    return fileName.match(/\b(PO\d{4,})\b/i)?.[1] || '';
  }

  private findDateByLabel(rows: ExtractedTextRow[], label: RegExp): string {
    for (const row of rows) {
      if (!label.test(row.text)) {
        continue;
      }

      const dateText = row.text.match(/\b(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\b/)?.[1];
      if (dateText) {
        return this.normalizeDate(dateText);
      }

      const labelItem = row.items.find((item) => label.test(item.text));
      const rightText = row.items
        .filter((item) => !labelItem || item.x > labelItem.x)
        .map((item) => item.text)
        .join(' ');
      const rightDate = rightText.match(/\b(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\b/)?.[1];
      if (rightDate) {
        return this.normalizeDate(rightDate);
      }
    }

    return '';
  }

  private findValueByLabel(rows: ExtractedTextRow[], label: RegExp, valuePattern: RegExp): string {
    for (const row of rows) {
      if (!label.test(row.text)) {
        continue;
      }

      const value = row.text.match(valuePattern)?.[1];
      if (value) {
        return value.trim();
      }

      const labelItem = row.items.find((item) => label.test(item.text));
      const rightText = row.items
        .filter((item) => !labelItem || item.x > labelItem.x)
        .map((item) => item.text)
        .join(' ');
      const rightValue = rightText.match(valuePattern)?.[1];
      if (rightValue) {
        return rightValue.trim();
      }
    }

    return '';
  }

  private findRowText(rows: ExtractedTextRow[], pattern: RegExp): string {
    return rows.find((row) => pattern.test(row.text))?.text.trim() || '';
  }

  private hasCurrency(rows: ExtractedTextRow[], currencyText: string): boolean {
    return rows.some((row) => new RegExp(`\\b${currencyText}\\b`, 'i').test(row.text));
  }

  private findTotalAmount(rows: ExtractedTextRow[], lines: DocumentImportLine[]): string {
    const totalRows = rows.filter((row) => /\bTotal\s+Amount\b/i.test(row.text));
    const explicit = this.pickLargestAmount(totalRows.map((row) => row.text));
    if (explicit) {
      return explicit;
    }

    const sum = lines.reduce((total, line) => total + Number(line.lineAmount || 0), 0);
    return sum > 0 ? sum.toFixed(2) : '';
  }

  private pickLargestAmount(lines: string[]): string {
    let max = 0;
    let picked = '';

    lines.forEach((line) => {
      const matches = line.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d{2})\b|\b\d+\.\d{2}\b/g) || [];
      matches.forEach((match) => {
        const value = this.safeNumber(match) || 0;
        if (value > max) {
          max = value;
          picked = match;
        }
      });
    });

    return picked;
  }

  private field(
    fieldCode: string,
    label: string,
    value: string,
    confidenceScore: number,
    isRequired: boolean,
    errorMessage = ''
  ): DocumentImportField {
    return {
      systemId: `local-tecsa-po-field-${fieldCode}`,
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
      errorMessage,
      sourceText: value,
    };
  }

  private normalizeText(text: string): string {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  private normalizeDate(value: string): string {
    const parts = String(value || '').trim().match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (!parts) {
      return value;
    }

    const day = parts[1].padStart(2, '0');
    const month = parts[2].padStart(2, '0');
    const year = parts[3].length === 2 ? `20${parts[3]}` : parts[3];
    return `${year}-${month}-${day}`;
  }

  private lineConfidence(line: TecsaLineCandidate): number {
    if (line.itemNo && line.description && line.quantity && line.unitOfMeasure && line.unitCost !== undefined && line.lineAmount !== undefined) {
      return 0.92;
    }

    return 0.72;
  }

  private calculateConfidence(fields: DocumentImportField[], lines: DocumentImportLine[], headerIndex: number): number {
    const scores = [...fields, ...lines]
      .map((item) => Number(item.confidenceScore || 0))
      .filter((score) => score > 0);
    const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0.45;
    const tableBonus = headerIndex >= 0 && lines.length ? 0.05 : -0.12;

    return Math.min(Math.max(average + tableBonus, 0), 1);
  }

  private mid(left: number, right: number): number {
    return (left + right) / 2;
  }

  private safeNumber(value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(String(value).replace(/,/g, '').replace(/[^0-9.-]/g, ''));
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}
