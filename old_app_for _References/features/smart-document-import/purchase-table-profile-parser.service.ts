import { Injectable } from '@angular/core';

import {
  DocumentImportLine,
  DocumentParseContext,
  ExtractedTextItem,
  ExtractedTextRow,
  SmartImportDocumentType,
} from './document-import.models';
import {
  PurchaseTableColumnRange,
  PurchaseTableDetection,
  PurchaseTableParseLine,
  PurchaseTableParseResult,
  PurchaseTableProfile,
} from './purchase-table-profile.models';
import { PURCHASE_TABLE_PROFILES } from './purchase-table-profiles';

type ColumnKey = keyof PurchaseTableProfile['columnAliases'];

@Injectable({
  providedIn: 'root',
})
export class PurchaseTableProfileParserService {
  detect(context: DocumentParseContext): PurchaseTableDetection | undefined {
    const rows = this.getRows(context);
    const candidates: PurchaseTableDetection[] = [];

    rows.forEach((row, index) => {
      const headerRows = this.headerRows(rows, index);
      if (!headerRows.length) {
        return;
      }

      PURCHASE_TABLE_PROFILES.forEach((profile) => {
        const detection = this.scoreHeaderCandidate(profile, rows, index, headerRows);
        if (detection) {
          candidates.push(detection);
        }
      });
    });

    return candidates.sort((a, b) => b.score - a.score)[0];
  }

  parse(context: DocumentParseContext): PurchaseTableParseResult {
    const rows = this.getRows(context);
    const detection = this.detect(context);
    const diagnostics = [
      `Rows detected: ${rows.length}`,
      `Table profile selected: ${detection?.profile.code || 'none'}`,
      `Header row detected: ${detection ? `page ${detection.pageNo}, row ${detection.headerIndex}` : 'no'}`,
      `Column mode: ${detection?.usesVirtualRanges ? 'virtual (text-only)' : 'anchored (coordinate-based)'}`,
      `Column ranges detected: ${detection?.ranges.map((range) => `${range.key}:${range.x.toFixed(3)}-${range.endX.toFixed(3)}`).join(', ') || 'none'}`,
    ];

    if (!detection) {
      return {
        lines: [],
        diagnostics: [...diagnostics, 'Lines parsed: 0'],
      };
    }

    const tableRows = rows
      .map((row, index) => ({ row, index }))
      .filter((entry) =>
        entry.row.pageNo === detection.pageNo &&
        entry.index > detection.headerEndIndex
      );
    const parsedLines = this.parseRows(tableRows, detection, diagnostics);

    return {
      detection,
      lines: parsedLines,
      diagnostics: [...diagnostics, `Lines parsed: ${parsedLines.length}`],
    };
  }

  toDocumentImportLines(
    parsedLines: PurchaseTableParseLine[],
    targetDocumentType: SmartImportDocumentType | string,
    idPrefix = 'local-profile-line'
  ): DocumentImportLine[] {
    return parsedLines.map((line, index) => ({
      systemId: `${idPrefix}-${index + 1}`,
      importNo: '',
      lineNo: (index + 1) * 10000,
      targetDocumentType,
      externalItemCode: line.externalItemCode || '',
      itemNo: '',
      glAccountNo: '',
      description: line.description,
      quantity: line.quantity,
      unitOfMeasure: line.uom,
      unitCost: line.unitPrice,
      lineAmount: line.lineAmount,
      confidenceScore: line.confidence,
      mappingStatus: 'Draft',
      sourceText: line.sourceText,
      sourcePageNo: line.sourcePageNo,
      sourceX: line.sourceX,
      sourceY: line.sourceY,
      sourceWidth: line.sourceWidth,
      sourceHeight: line.sourceHeight,
      errorMessage: this.lineExtractionIssue(line),
    }));
  }

  getRows(context: DocumentParseContext): ExtractedTextRow[] {
    const rows = context.pages.flatMap((page) => page.rows || []);
    if (rows.length) {
      return rows;
    }

    return String(context.rawText || '')
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

  private scoreHeaderCandidate(
    profile: PurchaseTableProfile,
    rows: ExtractedTextRow[],
    headerIndex: number,
    headerRows: ExtractedTextRow[]
  ): PurchaseTableDetection | undefined {
    const combinedText = this.normalizeAlias(headerRows.map((row) => row.text).join(' '));
    const requiredMatches = profile.requiredHeaderAliases.filter((aliases) => this.hasAlias(combinedText, aliases));
    const optionalMatches = (profile.optionalHeaderAliases || []).filter((aliases) => this.hasAlias(combinedText, aliases));

    if (requiredMatches.length < profile.requiredHeaderAliases.length) {
      return undefined;
    }

    let usesVirtualRanges = this.isTextOnlyRows(headerRows);
    let ranges = this.buildColumnRanges(profile, headerRows);
    const requiredColumnKeys = ['description', 'quantity', 'lineAmount'] as ColumnKey[];
    let requiredColumnsFound = requiredColumnKeys.filter((key) => ranges.some((range) => range.key === key)).length;

    // Some PDFs have good text/coords but headers are split in ways that miss anchored aliases.
    // Fall back to virtual ranges if the header text still looks tabular.
    if (requiredColumnsFound < requiredColumnKeys.length && this.looksLikeTabularHeader(combinedText)) {
      usesVirtualRanges = true;
      ranges = this.virtualColumnRanges(Object.keys(profile.columnAliases) as ColumnKey[]);
      requiredColumnsFound = requiredColumnKeys.filter((key) => ranges.some((range) => range.key === key)).length;
    }

    if (requiredColumnsFound < requiredColumnKeys.length) {
      return undefined;
    }

    const rawScore = (
      requiredMatches.length / Math.max(profile.requiredHeaderAliases.length, 1) * 0.72 +
      optionalMatches.length / Math.max((profile.optionalHeaderAliases || []).length, 1) * 0.12 +
      requiredColumnsFound / requiredColumnKeys.length * 0.16
    ) * (profile.confidenceWeight || 1);
    const score = Math.min(rawScore * (usesVirtualRanges ? 0.84 : 1), 1);

    return {
      profile,
      pageNo: rows[headerIndex].pageNo,
      headerIndex,
      headerEndIndex: headerIndex + headerRows.length - 1,
      score,
      usesVirtualRanges,
      ranges,
      diagnostics: [
        `Profile score ${profile.code}: ${score.toFixed(2)}`,
        `Matched required aliases: ${requiredMatches.length}/${profile.requiredHeaderAliases.length}`,
        `Column mode: ${usesVirtualRanges ? 'virtual' : 'anchored'}`,
      ],
    };
  }

  private buildColumnRanges(profile: PurchaseTableProfile, headerRows: ExtractedTextRow[]): PurchaseTableColumnRange[] {
    const columnKeys = Object.keys(profile.columnAliases) as ColumnKey[];
    if (this.isTextOnlyRows(headerRows)) {
      return this.virtualColumnRanges(columnKeys);
    }

    const starts = columnKeys
      .map((key) => {
        const aliases = profile.columnAliases[key] || [];
        const match = this.findAliasPosition(headerRows, aliases);
        return match ? { key, x: match.x, label: match.label } : undefined;
      })
      .filter((range): range is { key: ColumnKey; x: number; label: string } => !!range)
      .sort((a, b) => a.x - b.x);

    const merged = starts.filter((range, index, list) => {
      const previous = list[index - 1];
      return !previous || previous.key === range.key || Math.abs(previous.x - range.x) > 0.018;
    });

    return merged.map((range, index) => {
      const next = merged[index + 1];
      const previous = merged[index - 1];
      const startFloor = previous ? this.mid(previous.x, range.x) : Math.max(range.x - 0.035, 0);
      const endX = next ? this.mid(range.x, next.x) : 1;

      return {
        ...range,
        x: startFloor,
        endX,
      };
    });
  }

  private isTextOnlyRows(rows: ExtractedTextRow[]): boolean {
    const items = rows.flatMap((row) => row.items || []);
    return !items.length || items.every((item) => item.x === 0 && item.width >= 0.95);
  }

  private virtualColumnRanges(columnKeys: ColumnKey[]): PurchaseTableColumnRange[] {
    const preferredOrder: ColumnKey[] = [
      'externalItemCode',
      'description',
      'quantity',
      'uom',
      'unitPrice',
      'vatPercent',
      'discountPercent',
      'lineAmount',
    ];
    const orderedKeys = preferredOrder.filter((key) => columnKeys.includes(key));
    const width = 1 / Math.max(orderedKeys.length, 1);

    return orderedKeys.map((key, index) => ({
      key,
      x: index * width,
      endX: index === orderedKeys.length - 1 ? 1 : (index + 1) * width,
      label: key,
    }));
  }

  private parseRows(
    rows: Array<{ row: ExtractedTextRow; index: number }>,
    detection: PurchaseTableDetection,
    diagnostics: string[]
  ): PurchaseTableParseLine[] {
    const lines: PurchaseTableParseLine[] = [];
    const useTextOnlyParsing = detection.usesVirtualRanges;
    let current: PurchaseTableParseLine | undefined;
    let stopped = false;

    for (const { row, index } of rows) {
      if (stopped) {
        break;
      }

      if (this.isStopRow(row.text, detection.profile)) {
        diagnostics.push(`Stop row detected at ${index}: ${row.text}`);
        stopped = true;
        continue;
      }

      if (this.isHeaderNoise(row.text)) {
        diagnostics.push(`Skipped repeated header/noise row ${index}: ${row.text}`);
        continue;
      }

      const cells = useTextOnlyParsing ? {} : this.cellsByRanges(row, detection.ranges);
      const parsed = useTextOnlyParsing
        ? this.parseLineByText(row, detection)
        : this.parseLineFromCells(row, cells, detection);
      if (parsed) {
        if (current) {
          lines.push(current);
        }

        current = parsed;
        continue;
      }

      if (current && this.looksLikeContinuation(row, cells, detection)) {
        const continuation = this.cleanCell(cells.description || row.text);
        if (continuation) {
          current.description = `${current.description} ${continuation}`.replace(/\s+/g, ' ').trim();
          current.sourceText = `${current.sourceText} ${row.text}`.replace(/\s+/g, ' ').trim();
          current.confidence = Math.min(current.confidence + 0.02, 0.94);
        }
        continue;
      }

      diagnostics.push(`Skipped non-line row ${index}: ${row.text}`);
    }

    if (current) {
      lines.push(current);
    }

    return lines.filter((line) => this.isUsableLine(line));
  }

  private parseLineFromCells(
    row: ExtractedTextRow,
    cells: Partial<Record<ColumnKey, string>>,
    detection: PurchaseTableDetection
  ): PurchaseTableParseLine | undefined {
    const textParsed = this.parseLineByText(row, detection);
    if (textParsed && (!row.items.length || Object.keys(cells).length < 3)) {
      return textParsed;
    }

    const description = this.cleanDescription(cells.description || '');
    const externalItemCode = this.cleanItemCode(cells.externalItemCode || '');
    const quantity = this.parseNumber(cells.quantity);
    const unitPrice = this.parseNumber(cells.unitPrice);
    let lineAmount = this.parseNumber(cells.lineAmount);
    const vatPercent = this.parsePercent(cells.vatPercent);
    const discountPercent = this.parsePercent(cells.discountPercent);
    const uom = this.cleanCell(cells.uom || '');
    const enoughText = description.length >= 3 || !!externalItemCode;
    const hasUsefulNumber = Number(quantity || 0) > 0 || Number(unitPrice || 0) > 0 || Number(lineAmount || 0) > 0;

    if (!enoughText || !hasUsefulNumber) {
      return textParsed;
    }

    let inferredLineAmount = false;
    if ((lineAmount === undefined || lineAmount <= 0) && Number(quantity || 0) > 0 && Number(unitPrice || 0) > 0) {
      lineAmount = Number((Number(quantity) * Number(unitPrice)).toFixed(2));
      inferredLineAmount = true;
    }

    if (lineAmount !== undefined && quantity === undefined) {
      return {
        ...this.anchor(row),
        externalItemCode,
        description: description || externalItemCode,
        quantity,
        uom,
        unitPrice,
        lineAmount,
        vatPercent,
        discountPercent,
        confidence: 0.58,
        sourceText: row.text,
        sourcePageNo: row.pageNo,
      };
    }

    return {
      ...this.anchor(row),
      externalItemCode,
      description: description || externalItemCode,
      quantity,
      uom,
      unitPrice,
      lineAmount,
      vatPercent,
      discountPercent,
      confidence: this.lineConfidence({ description, quantity, unitPrice, lineAmount, inferredLineAmount }),
      sourceText: row.text,
      sourcePageNo: row.pageNo,
      inferredLineAmount,
    };
  }

  private parseLineByText(row: ExtractedTextRow, detection: PurchaseTableDetection): PurchaseTableParseLine | undefined {
    const text = row.text.replace(/\s+/g, ' ').trim();

    if (!text || this.isAdjustmentNote(text)) {
      return undefined;
    }

    const tokens = text.split(/\s+/).filter(Boolean);

    const moneyTokens = tokens
      .map((token, index) => ({ token, index, value: this.parseMoney(token) }))
      .filter((item): item is { token: string; index: number; value: number } => item.value !== undefined);

    if (!moneyTokens.length) {
      return undefined;
    }

    const lineAmount = moneyTokens[moneyTokens.length - 1]?.value;
    const unitPrice = moneyTokens.length > 1 ? moneyTokens[moneyTokens.length - 2]?.value : undefined;
    const firstMoneyIndex = moneyTokens[0].index;
    const beforeMoney = tokens.slice(0, firstMoneyIndex);
    const quantityIndex = this.findQuantityIndex(beforeMoney);

    if (quantityIndex < 0) {
      return undefined;
    }

    const quantity = this.parseNumber(beforeMoney[quantityIndex]);

    if (quantity === undefined || quantity <= 0 || lineAmount === undefined || lineAmount <= 0) {
      return undefined;
    }

    const possibleUom = beforeMoney[quantityIndex + 1] || '';
    const uom = /^[A-Za-z]{1,16}$/.test(possibleUom) ? possibleUom : '';

    const serialOffset = /^\d+$/.test(beforeMoney[0] || '') ? 1 : 0;

    const externalItemCode = this.cleanItemCode(
      beforeMoney.find((token, index) =>
        index >= serialOffset &&
        index < quantityIndex &&
        !this.isDateToken(token) &&
        !/^\d+$/.test(token) &&
        /^[A-Z0-9][A-Z0-9-]{2,}$/i.test(token) &&
        /[A-Z]/i.test(token) &&
        /\d/.test(token)
      ) || ''
    );

    const itemIndex = externalItemCode
      ? beforeMoney.findIndex((token) => this.cleanItemCode(token).toUpperCase() === externalItemCode.toUpperCase())
      : -1;

    const descriptionStart = itemIndex >= 0 ? itemIndex + 1 : serialOffset;

    const descriptionTokens = beforeMoney
      .slice(descriptionStart, quantityIndex)
      .filter((token) => !this.isDateToken(token))
      .filter((token) => !/^\d+$/.test(token));

    const description = this.cleanDescription(descriptionTokens.join(' '));

    if (!description || description.length < 2) {
      return undefined;
    }

    return {
      ...this.anchor(row),
      externalItemCode,
      description,
      quantity,
      uom,
      unitPrice,
      lineAmount,
      confidence: Math.max(0.64, (detection.score || 0.7) - 0.1),
      sourceText: row.text,
      sourcePageNo: row.pageNo,
    };
  }

  private cellsByRanges(row: ExtractedTextRow, ranges: PurchaseTableColumnRange[]): Partial<Record<ColumnKey, string>> {
    const cells: Partial<Record<ColumnKey, string>> = {};

    ranges.forEach((range) => {
      const text = row.items
        .filter((item) => item.x >= range.x - 0.004 && item.x < range.endX - 0.002)
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(' ')
        .trim();
      if (text) {
        cells[range.key] = text;
      }
    });

    if (!Object.keys(cells).length && row.text) {
      return {};
    }

    return cells;
  }

  private findAliasPosition(headerRows: ExtractedTextRow[], aliases: string[]): { x: number; label: string } | undefined {
    const items = headerRows
      .flatMap((row) => row.items)
      .filter((item) => !!item.text)
      .sort((a, b) => a.y - b.y || a.x - b.x);

    for (const alias of aliases) {
      const aliasText = this.normalizeAlias(alias);
      const aliasTokenCount = aliasText.split(' ').length;

      for (let index = 0; index < items.length; index += 1) {
        const windowItems = items.slice(index, index + Math.max(aliasTokenCount + 2, 2));
        const sameBandItems = windowItems.filter((candidate) =>
          Math.abs(candidate.y - items[index].y) <= 0.018 ||
          Math.abs(candidate.x - items[index].x) <= 0.035
        );
        const windowText = this.normalizeAlias(sameBandItems.map((item) => item.text).join(' '));
        if (this.aliasMatches(windowText, aliasText)) {
          return {
            x: items[index].x,
            label: alias,
          };
        }
      }
    }

    return undefined;
  }

  private headerRows(rows: ExtractedTextRow[], index: number): ExtractedTextRow[] {
    const first = rows[index];
    if (!first?.text) {
      return [];
    }

    const samePage = rows.slice(index, index + 5).filter((row) => row.pageNo === first.pageNo);
    const combined = this.normalizeAlias(samePage.map((row) => row.text).join(' '));
    if (
      !/(description|details|particulars)/i.test(combined) ||
      !/(quantity|qty)/i.test(combined) ||
      !/(amount|price|cost|unit)/i.test(combined)
    ) {
      return [];
    }

    return samePage;
  }

  private looksLikeTabularHeader(combinedHeaderText: string): boolean {
    return /(s\/?no|no\.?|item\s+code|item\s+no)/i.test(combinedHeaderText) &&
      /(description|details|particulars)/i.test(combinedHeaderText) &&
      /(quantity|qty)/i.test(combinedHeaderText) &&
      /(amount|line\s+amount|unit\s+cost|unit\s+price|cost)/i.test(combinedHeaderText);
  }

  private findQuantityIndex(tokens: string[]): number {
    for (let index = tokens.length - 1; index >= 0; index -= 1) {
      const token = tokens[index];
      const next = tokens[index + 1] || '';
      if (this.isDateToken(token)) {
        continue;
      }

      if (/^\d+(?:\.\d+)?$/.test(token) && (!next || /^[A-Za-z]{1,16}$/.test(next))) {
        return index;
      }
    }

    return -1;
  }

  private isStopRow(text: string, profile: PurchaseTableProfile): boolean {
    const normalized = text.trim();
    return profile.stopPatterns.some((pattern) => pattern.test(normalized));
  }

  private isHeaderNoise(text: string): boolean {
    return /\b(?:description|quantity|qty|unit\s+cost|unit\s+price|line\s+amount|amount|vat\s*%|item\s+code)\b/i.test(text) ||
      /^[-_\s|]+$/.test(text.trim()) ||
      /^\(?(?:rm|myr|usd|gbp)\)?$/i.test(text.trim());
  }

  private looksLikeContinuation(
    row: ExtractedTextRow,
    cells: Partial<Record<ColumnKey, string>>,
    detection: PurchaseTableDetection
  ): boolean {
    const text = String(row.text || '').trim();

    if (!text || this.isStopRow(text, detection.profile) || this.isHeaderNoise(text) || this.isAdjustmentNote(text)) {
      return false;
    }

    // Do not append a new numbered table row to the previous line.
    if (/^\d+\s+.+\s+\d+(?:\.\d+)?\s*(?:[A-Za-z]{0,16})?\s+-?\d{1,3}(?:,\d{3})*(?:\.\d{2})\s+-?\d{1,3}(?:,\d{3})*(?:\.\d{2})/.test(text)) {
      return false;
    }

    const hasAmount = this.parseNumber(cells.lineAmount) !== undefined || this.parseNumber(cells.unitPrice) !== undefined;
    const hasQuantity = this.parseNumber(cells.quantity) !== undefined;
    const description = this.cleanCell(cells.description || text);

    return !!description && !hasAmount && !hasQuantity;
  }

  private isUsableLine(line: PurchaseTableParseLine): boolean {
    if (!line.description || line.description.length < 2) {
      return false;
    }

    if (line.quantity !== undefined && line.quantity <= 0) {
      return false;
    }

    return Number(line.quantity || 0) > 0 || Number(line.lineAmount || 0) > 0 || Number(line.unitPrice || 0) > 0;
  }

  private lineExtractionIssue(line: PurchaseTableParseLine): string | undefined {
    if (!line.description) {
      return 'Line description needs review.';
    }

    if (line.quantity !== undefined && line.quantity <= 0) {
      return 'Line quantity needs review.';
    }

    if (line.quantity === undefined || (!line.unitPrice && !line.lineAmount)) {
      return 'Line extraction needs review. Please verify quantity and amount manually.';
    }

    return undefined;
  }

  private cleanDescription(value: string): string {
    return this.cleanCell(value)
      .replace(/^(?:\d+\s+)?(?:-|:)+\s*/, '')
      .replace(/\b(?:subtotal|total)\b.*$/i, '')
      .trim()
      .slice(0, 260);
  }

  private cleanItemCode(value: string): string {
    const text = this.cleanCell(value);
    const match = text.match(/\b[A-Z0-9][A-Z0-9-]{2,}\b/i)?.[0] || '';
    return match.replace(/[.,:;]+$/g, '').toUpperCase();
  }

  private cleanCell(value: string): string {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:])/g, '$1')
      .trim();
  }

  private parseNumber(value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }

    const match = String(value).match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/);
    if (!match) {
      return undefined;
    }

    const parsed = Number(match[0].replace(/,/g, ''));
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private parseMoney(value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }

    const cleaned = String(value).replace(/[^\d,.-]/g, '');
    if (!/^-?(?:\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d{2})$/.test(cleaned)) {
      return undefined;
    }

    const parsed = Number(cleaned.replace(/,/g, ''));
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private isDateToken(value: string): boolean {
    return /^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}$/.test(String(value || ''));
  }

  private parsePercent(value: string | undefined): number | undefined {
    const parsed = this.parseNumber(value);
    return parsed === undefined ? undefined : parsed;
  }

  private lineConfidence(input: {
    description: string;
    quantity?: number;
    unitPrice?: number;
    lineAmount?: number;
    inferredLineAmount?: boolean;
  }): number {
    let score = 0.52;
    if (input.description) {
      score += 0.16;
    }
    if (Number(input.quantity || 0) > 0) {
      score += 0.1;
    }
    if (Number(input.unitPrice || 0) > 0) {
      score += 0.08;
    }
    if (Number(input.lineAmount || 0) > 0) {
      score += 0.1;
    }
    if (input.inferredLineAmount) {
      score -= 0.08;
    }

    return Math.min(Math.max(score, 0.45), 0.94);
  }

  private anchor(row: ExtractedTextRow): Pick<PurchaseTableParseLine, 'sourceX' | 'sourceY' | 'sourceWidth' | 'sourceHeight'> {
    const items = row.items.length ? row.items : this.textToSingleItem(row);
    const minX = Math.min(...items.map((item) => item.x));
    const minY = Math.min(...items.map((item) => item.y));
    const maxX = Math.max(...items.map((item) => item.x + item.width));
    const maxY = Math.max(...items.map((item) => item.y + item.height));

    return {
      sourceX: minX,
      sourceY: minY,
      sourceWidth: Math.max(maxX - minX, 0.01),
      sourceHeight: Math.max(maxY - minY, 0.01),
    };
  }

  private textToSingleItem(row: ExtractedTextRow): ExtractedTextItem[] {
    return [{
      text: row.text,
      x: 0,
      y: row.y,
      width: 1,
      height: 0.01,
    }];
  }

  private hasAlias(text: string, aliases: string[]): boolean {
    return aliases.some((alias) => this.aliasMatches(text, this.normalizeAlias(alias)));
  }

  private aliasMatches(text: string, alias: string): boolean {
    if (!alias) {
      return false;
    }

    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    return new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`, 'i').test(text);
  }

  private normalizeAlias(value: string): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[%]/g, ' % ')
      .replace(/[()]/g, ' ')
      .replace(/[.:#|]/g, ' ')
      .replace(/[\/_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private mid(left: number, right: number): number {
    return (left + right) / 2;
  }

  private isAdjustmentNote(text: string): boolean {
    const normalized = String(text || '').trim();

    return /^\(?\s*(special\s+)?discount\b/i.test(normalized) ||
      /^\(?\s*rebate\b/i.test(normalized) ||
      /^\(?\s*less\b/i.test(normalized) ||
      /^\(?\s*adjustment\b/i.test(normalized);
  }
  private startsWithNumberedLine(text: string): boolean {
    return /^\d+\s+/.test(String(text || '').trim());
  }
}
