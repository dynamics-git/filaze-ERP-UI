import { Injectable } from '@angular/core';

import {
  DocumentTextExtractionResult,
  ExtractedDocumentPage,
  ExtractedTextItem,
  ExtractedTextRow,
  ExtractedDocumentToken,
} from './document-import.models';
import { DocumentOcrTesseractService } from './document-ocr-tesseract.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentTextExtractionService {
  private readonly maxPdfPages = 12;
  private pdfjs: any;

  constructor(private tesseractService: DocumentOcrTesseractService) {}

  async extract(file: File): Promise<DocumentTextExtractionResult> {
    let fallbackReason = '';

    if (file.type === 'application/pdf') {
      try {
        const textLayerResult = await this.extractPdfTextLayer(file);
        if (this.hasAnyUsablePdfText(textLayerResult.pages)) {
          const wordCount = this.countWords(textLayerResult.rawText);
          return {
            ...textLayerResult,
            diagnostics: [
              `PDF text layer extracted successfully.`,
              `PDF text-layer words: ${wordCount}.`,
              `PDF text-layer strength: ${this.isTextLayerStrong(textLayerResult.pages) ? 'strong' : 'weak but usable'}.`,
            ],
          };
        }

        fallbackReason = 'PDF text layer was present but had no usable text.';
      } catch {
        fallbackReason = 'PDF text-layer extraction failed.';
      }
    }

    const tesseractResult = await this.tesseractService.extractText(file);
    const pages = tesseractResult.pages.map((page) => {
      const items: ExtractedTextItem[] = (page.items || []).map((item) => ({
        text: item.text,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        sourcePageNo: page.pageNo,
        sourceX: item.x,
        sourceY: item.y,
        sourceWidth: item.width,
        sourceHeight: item.height,
        sourceText: item.text,
        confidence: item.confidence,
      }));
      const rows = items.length ? this.groupRows(page.pageNo, items) : this.rowsFromPlainText(page.pageNo, page.text);

      return {
        pageNo: page.pageNo,
        rawText: page.text,
        rows,
        confidence: page.confidence,
        extractionMethod: 'tesseract' as const,
        tokens: this.toTokens(items),
      };
    });

    const diagnostics = [
      `Fallback to tesseract OCR was used.`,
      fallbackReason || 'Text extraction fallback triggered.',
      `OCR pages: ${tesseractResult.pages.length}.`,
      `OCR word count: ${this.countWords(tesseractResult.rawText)}.`,
    ];

    return {
      rawText: tesseractResult.rawText,
      pages,
      confidence: tesseractResult.avgConfidence,
      extractionMethod: 'tesseract',
      diagnostics,
    };
  }

  private async extractPdfTextLayer(file: File): Promise<DocumentTextExtractionResult> {
    const pdfjsLib = await this.getPdfJs();
    const data = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const pageCount = Math.min(doc.numPages || 0, this.maxPdfPages);
    const pages: ExtractedDocumentPage[] = [];

    for (let pageNo = 1; pageNo <= pageCount; pageNo += 1) {
      const page = await doc.getPage(pageNo);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const items = this.toTextItems(pageNo, textContent?.items || [], viewport.width, viewport.height);
      const rows = this.groupRows(pageNo, items);
      const tokens = this.toTokens(items);
      const rawText = rows.map((row) => row.text).filter((text) => !!text).join('\n');

      pages.push({
        pageNo,
        rawText,
        rows,
        confidence: rawText ? 0.96 : 0,
        extractionMethod: 'pdfTextLayer',
        tokens,
      });
    }

    const rawText = pages
      .map((page) => page.rawText)
      .filter((text) => !!text)
      .join('\n\n');

    return {
      rawText,
      pages,
      confidence: this.averageConfidence(pages),
      extractionMethod: 'pdfTextLayer',
      diagnostics: [
        `PDF pages processed: ${pages.length}.`,
        `PDF rows detected: ${pages.reduce((sum, page) => sum + (page.rows?.length || 0), 0)}.`,
      ],
    };
  }

  private async getPdfJs(): Promise<any> {
    if (this.pdfjs) {
      return this.pdfjs;
    }

    const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    if (pdfjsLib?.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    }

    this.pdfjs = pdfjsLib;
    return this.pdfjs;
  }

  private toTextItems(pageNo: number, items: any[], pageWidth: number, pageHeight: number): ExtractedTextItem[] {
    return items
      .map((item): ExtractedTextItem | null => {
        const text = String(item?.str || '').trim();
        if (!text) {
          return null;
        }

        const transform = Array.isArray(item?.transform) ? item.transform : [];
        const x = Number(transform[4] || 0);
        const y = Number(transform[5] || 0);
        const width = Math.max(Number(item?.width || 0), 0);
        const height = Math.max(Math.abs(Number(transform[3] || 0)), Number(item?.height || 0), 1);
        const normalizedX = this.normalize(x, pageWidth);
        const normalizedY = this.normalize(pageHeight - y - height, pageHeight);
        const normalizedWidth = this.normalize(width, pageWidth);
        const normalizedHeight = this.normalize(height, pageHeight);

        return {
          text,
          x: normalizedX,
          y: normalizedY,
          width: normalizedWidth,
          height: normalizedHeight,
          sourcePageNo: pageNo,
          sourceX: normalizedX,
          sourceY: normalizedY,
          sourceWidth: normalizedWidth,
          sourceHeight: normalizedHeight,
          sourceText: text,
          confidence: 0.96,
        };
      })
      .filter((item): item is ExtractedTextItem => item !== null);
  }

  private toTokens(items: ExtractedTextItem[]): ExtractedDocumentToken[] {
    return items.map((item) => ({
      text: item.text,
      sourcePageNo: item.sourcePageNo,
      sourceX: item.sourceX,
      sourceY: item.sourceY,
      sourceWidth: item.sourceWidth,
      sourceHeight: item.sourceHeight,
      sourceText: item.text,
      confidence: item.confidence,
    }));
  }

  private groupRows(pageNo: number, items: ExtractedTextItem[]): ExtractedTextRow[] {
    if (!items.length) {
      return [];
    }

    const sorted = [...items].sort((a, b) => {
      const pageY = a.y - b.y;
      if (Math.abs(pageY) > 0.0048) {
        return pageY;
      }

      return a.x - b.x;
    });

    const grouped: ExtractedTextItem[][] = [];
    sorted.forEach((item) => {
      const lastLine = grouped[grouped.length - 1];
      const lastY = Number(lastLine?.[0]?.y || 0);

      if (!lastLine || Math.abs(item.y - lastY) > 0.0065) {
        grouped.push([item]);
        return;
      }

      lastLine.push(item);
    });

    return grouped
      .map((line) => {
        const rowItems = line.sort((a, b) => a.x - b.x);
        return {
          pageNo,
          y: rowItems[0]?.y || 0,
          text: this.formatRowText(rowItems),
          items: rowItems,
        };
      })
      .filter((row) => !!row.text);
  }

  private formatRowText(items: ExtractedTextItem[]): string {
    let text = '';
    let previousEnd = 0;

    items.forEach((item, index) => {
      const gap = index === 0 ? 0 : item.x - previousEnd;
      const spaces = index === 0 ? '' : ' '.repeat(this.columnGapToSpaces(gap));
      text = `${text}${spaces}${item.text}`;
      previousEnd = Math.max(previousEnd, item.x + item.width);
    });

    return text.replace(/[ \t]+$/g, '').trim();
  }

  private columnGapToSpaces(gap: number): number {
    if (gap <= 0.006) {
      return 1;
    }

    return Math.min(Math.max(Math.round(gap * 120), 2), 16);
  }

  private rowsFromPlainText(pageNo: number, text: string): ExtractedTextRow[] {
    return String(text || '')
      .replace(/\r/g, '')
      .split('\n')
      .map((line, index) => ({
        pageNo,
        y: index / 1000,
        text: line.trim(),
        items: [
          {
            text: line.trim(),
            x: 0,
            y: index / 1000,
            width: 1,
            height: 0,
            sourcePageNo: pageNo,
            sourceX: 0,
            sourceY: index / 1000,
            sourceWidth: 1,
            sourceHeight: 0,
            sourceText: line.trim(),
          },
        ],
      }))
      .filter((row) => !!row.text);
  }

  private isTextLayerStrong(pages: ExtractedDocumentPage[]): boolean {
    const rawText = pages.map((page) => page.rawText).join('\n');
    const wordCount = (rawText.match(/[A-Za-z0-9]{2,}/g) || []).length;
    const usefulPageCount = pages.filter((page) => page.rawText.trim().length >= 40).length;

    return rawText.trim().length >= 120 && wordCount >= 20 && usefulPageCount > 0;
  }

  private hasAnyUsablePdfText(pages: ExtractedDocumentPage[]): boolean {
    const rawText = pages.map((page) => page.rawText).join('\n').trim();
    return rawText.length > 0 && this.countWords(rawText) >= 3;
  }

  private countWords(text: string): number {
    return (String(text || '').match(/[A-Za-z0-9]{2,}/g) || []).length;
  }

  private averageConfidence(pages: ExtractedDocumentPage[]): number {
    if (!pages.length) {
      return 0;
    }

    return pages.reduce((sum, page) => sum + page.confidence, 0) / pages.length;
  }

  private normalize(value: number, size: number): number {
    if (!size) {
      return 0;
    }

    return Math.min(Math.max(value / size, 0), 1);
  }
}
