import { Injectable } from '@angular/core';

import {
  DocumentParserStrategy,
  DocumentParseContext,
  DocumentParseResult,
} from './document-import.models';
import { KnownPurchaseLayoutParserService } from './known-purchase-layout-parser.service';
import { ManualFallbackParserService } from './manual-fallback-parser.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentParserEngineService {
  constructor(
    private knownLayoutParser: KnownPurchaseLayoutParserService,
    private manualFallbackParser: ManualFallbackParserService
  ) {}

  parse(context: DocumentParseContext): DocumentParseResult {
    const strategies: DocumentParserStrategy[] = [
      this.knownLayoutParser,
      this.manualFallbackParser,
    ];

    for (const strategy of strategies) {
      if (!strategy.canParse(context)) {
        continue;
      }

      const result = strategy.parse(context);
      if (strategy.code === this.manualFallbackParser.code || this.isUsable(result)) {
        return result;
      }
    }

    return this.manualFallbackParser.parse(context);
  }

  private isUsable(result: DocumentParseResult): boolean {
    const hasUsefulField = result.fields.some((field) =>
      !!String(field.correctedValue || field.extractedValue || '').trim()
    );
    const hasLine = result.lines.length > 0;

    return hasUsefulField || hasLine;
  }
}
