export interface PurchaseTableProfile {
  code: string;
  name: string;
  requiredHeaderAliases: string[][];
  optionalHeaderAliases?: string[][];
  columnAliases: {
    externalItemCode?: string[];
    description: string[];
    quantity: string[];
    uom?: string[];
    unitPrice?: string[];
    lineAmount: string[];
    vatPercent?: string[];
    discountPercent?: string[];
  };
  stopPatterns: RegExp[];
  confidenceWeight?: number;
}

export interface PurchaseTableColumnRange {
  key: keyof PurchaseTableProfile['columnAliases'];
  x: number;
  endX: number;
  label: string;
}

export interface PurchaseTableDetection {
  profile: PurchaseTableProfile;
  pageNo: number;
  headerIndex: number;
  headerEndIndex: number;
  score: number;
  usesVirtualRanges: boolean;
  ranges: PurchaseTableColumnRange[];
  diagnostics: string[];
}

export interface PurchaseTableParseLine {
  externalItemCode?: string;
  description: string;
  quantity?: number;
  uom?: string;
  unitPrice?: number;
  lineAmount?: number;
  vatPercent?: number;
  discountPercent?: number;
  confidence: number;
  sourceText: string;
  sourcePageNo?: number;
  sourceX?: number;
  sourceY?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  inferredLineAmount?: boolean;
}

export interface PurchaseTableParseResult {
  detection?: PurchaseTableDetection;
  lines: PurchaseTableParseLine[];
  diagnostics: string[];
}
