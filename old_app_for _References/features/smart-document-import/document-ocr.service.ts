import { Injectable } from '@angular/core';

import {
  DocumentExtractionMethod,
  DocumentImportField,
  DocumentImportLine,
  DocumentImportReviewIssue,
  DocumentOcrProvider,
  ExtractedDocumentPage,
  SmartImportDocumentType,
} from './document-import.models';
import { DocumentImportReviewService } from './document-import-review.service';
import { DocumentParserEngineService } from './document-parser-engine.service';
import { DocumentTextExtractionService } from './document-text-extraction.service';

export interface DocumentOcrExtractionResult {
  provider: DocumentOcrProvider;
  extractionMethod: DocumentExtractionMethod;
  parserCode: string;
  parserName?: string;
  rawText: string;
  pages: ExtractedDocumentPage[];
  fields: DocumentImportField[];
  lines: DocumentImportLine[];
  issues: DocumentImportReviewIssue[];
  averageConfidence: number;
  diagnostics: string[];
}

@Injectable({
  providedIn: 'root',
})
export class DocumentOcrService {
  private provider: DocumentOcrProvider = 'frontend';

  constructor(
    private textExtractionService: DocumentTextExtractionService,
    private parserEngine: DocumentParserEngineService,
    private reviewService: DocumentImportReviewService
  ) {}

  get activeProvider(): DocumentOcrProvider {
    return this.provider;
  }

  setProvider(provider: DocumentOcrProvider): void {
    this.provider = provider;
  }

  async extractRawText(file: File) {
    return this.textExtractionService.extract(file);
  }

  async extractDocument(
    file: File,
    targetDocumentType: SmartImportDocumentType | string
  ): Promise<DocumentOcrExtractionResult> {
    const textExtraction = await this.textExtractionService.extract(file);
    const parsed = this.parserEngine.parse({
      targetDocumentType,
      fileName: file.name,
      pages: textExtraction.pages,
      rawText: textExtraction.rawText,
    });
    const review = this.reviewService.prepareReview(textExtraction, parsed);

    return {
      provider: textExtraction.extractionMethod,
      extractionMethod: textExtraction.extractionMethod,
      parserCode: review.parserCode,
      parserName: review.parserName,
      rawText: review.rawText,
      pages: textExtraction.pages,
      fields: review.fields,
      lines: review.lines,
      issues: review.issues,
      averageConfidence: review.confidence,
      diagnostics: [
        `Extraction method: ${textExtraction.extractionMethod}`,
        `Pages: ${textExtraction.pages.length}`,
        `Rows detected: ${textExtraction.pages.reduce((sum, page) => sum + (page.rows?.length || 0), 0)}`,
        ...(textExtraction.diagnostics || []),
        `Parser selected: ${review.parserCode}`,
        ...review.diagnostics,
      ],
    };
  }
}
