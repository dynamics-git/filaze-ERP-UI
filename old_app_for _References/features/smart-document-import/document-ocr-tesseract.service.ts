import { Injectable } from '@angular/core';
import { createWorker } from 'tesseract.js';

export interface OcrWordItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface OcrPageResult {
  pageNo: number;
  text: string;
  confidence: number;
  items: OcrWordItem[];
}

export interface OcrEngineResult {
  provider: 'tesseract';
  rawText: string;
  pages: OcrPageResult[];
  avgConfidence: number;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentOcrTesseractService {
  private readonly maxPdfPages = 8;

  async extractText(file: File): Promise<OcrEngineResult> {
    const worker = await createWorker('eng');

    try {
      const pages = file.type === 'application/pdf' ? await this.readPdfPages(file) : [{ pageNo: 1, blob: file }];
      const pageResults: OcrPageResult[] = [];

      for (const page of pages) {
        const result = await worker.recognize(page.blob);
        const text = String(result.data?.text || '').trim();
        const confidence = this.toConfidence(result.data?.confidence);
        const items = this.extractWordItems(result, page.pageNo);

        pageResults.push({
          pageNo: page.pageNo,
          text,
          confidence,
          items,
        });
      }

      const rawText = pageResults
        .map((page) => page.text)
        .filter((text) => !!text)
        .join('\n\n');

      const avgConfidence = pageResults.length
        ? pageResults.reduce((sum, page) => sum + page.confidence, 0) / pageResults.length
        : 0;

      return {
        provider: 'tesseract',
        rawText,
        pages: pageResults,
        avgConfidence,
      };
    } finally {
      await worker.terminate();
    }
  }

  private async readPdfPages(file: File): Promise<Array<{ pageNo: number; blob: Blob }>> {
    const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');

    if (pdfjsLib?.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    }

    const data = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const pageCount = Math.min(doc.numPages || 0, this.maxPdfPages);

    const pageBlobs: Array<{ pageNo: number; blob: Blob }> = [];

    for (let pageNo = 1; pageNo <= pageCount; pageNo += 1) {
      const page = await doc.getPage(pageNo);
      const viewport = page.getViewport({ scale: 1.8 });

      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      const context = canvas.getContext('2d');
      if (!context) {
        continue;
      }

      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await this.canvasToBlob(canvas);

      if (blob) {
        pageBlobs.push({ pageNo, blob });
      }
    }

    return pageBlobs;
  }

  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  }

  private extractWordItems(result: any, pageNo: number): OcrWordItem[] {
    const words = Array.isArray(result?.data?.words) ? result.data.words : [];
    const lines = Array.isArray(result?.data?.lines) ? result.data.lines : [];
    const ocrUnits = words.length ? words : lines;
    const imageWidth = Number(result?.data?.imageSize?.width || 0);
    const imageHeight = Number(result?.data?.imageSize?.height || 0);

    if (!ocrUnits.length || !imageWidth || !imageHeight) {
      return [];
    }

    return ocrUnits
      .map((word: any): OcrWordItem | null => {
        const text = String(word?.text || '').trim();
        const bbox = word?.bbox || {};
        const x0 = Number(bbox.x0 || 0);
        const y0 = Number(bbox.y0 || 0);
        const x1 = Number(bbox.x1 || 0);
        const y1 = Number(bbox.y1 || 0);
        const width = Math.max(x1 - x0, 1);
        const height = Math.max(y1 - y0, 1);

        if (!text) {
          return null;
        }

        return {
          text,
          x: this.normalizeBySize(x0, imageWidth),
          y: this.normalizeBySize(y0, imageHeight),
          width: this.normalizeBySize(width, imageWidth),
          height: this.normalizeBySize(height, imageHeight),
          confidence: this.toConfidence(word?.confidence),
        };
      })
        .filter((item: OcrWordItem | null): item is OcrWordItem => !!item)
        .sort((a: OcrWordItem, b: OcrWordItem) => a.y - b.y || a.x - b.x);
  }

  private normalizeBySize(value: number, size: number): number {
    if (!size) {
      return 0;
    }

    return Math.min(Math.max(value / size, 0), 1);
  }

  private toConfidence(value: unknown): number {
    const asNumber = Number(value);
    if (Number.isNaN(asNumber)) {
      return 0;
    }

    const normalized = asNumber > 1 ? asNumber / 100 : asNumber;
    return Math.min(Math.max(normalized, 0), 1);
  }
}
