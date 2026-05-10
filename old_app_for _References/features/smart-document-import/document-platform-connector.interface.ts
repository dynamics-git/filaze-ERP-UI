import { Observable } from 'rxjs';

export type PlatformCode = 'BC' | 'REFERENCE' | 'SAP' | 'ODOO' | 'CUSTOM';

export interface NormalizedPurchaseDraft {
  supplierNumber?: string;
  supplierName?: string;
  supplierRegistrationNo?: string;
  supplierTaxNo?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierWebsite?: string;
  supplierAddress?: string;

  documentNo?: string;
  documentDate?: string;
  requiredDate?: string;
  currencyCode?: string;
  totalAmount?: number;

  lines: NormalizedPurchaseDraftLine[];
}

export interface NormalizedPurchaseDraftLine {
  lineNo?: number;
  externalItemCode?: string;
  description: string;
  quantity?: number;
  uom?: string;
  unitPrice?: number;
  lineAmount?: number;

  mappedProductCode?: string;
  mappedProductName?: string;
  mappedExpenseCode?: string;
  mappedExpenseName?: string;
  mappingStatus?: 'Unmapped' | 'Suggested' | 'Confirmed' | 'NeedsReview';
}

export interface MappingCandidate {
  mappingType: 'Supplier' | 'Item' | 'GLAccount' | 'UOM' | 'Dimension';
  sourceValue: string;
  mappedCode: string;
  mappedDisplayName: string;
  score: number;
  matchedBy: string[];
  raw?: any;
  requiresConfirmation: boolean;
}

export interface LineMappingSuggestion {
  lineNo?: number;
  sourceDescription: string;
  sourceExternalItemCode?: string;
  itemCandidates: MappingCandidate[];
  glCandidates: MappingCandidate[];
  bestItemCandidate?: MappingCandidate;
  bestGlCandidate?: MappingCandidate;
  mappingStatus: 'Unmapped' | 'Suggested' | 'Confirmed' | 'NeedsReview';
}

export interface DocumentMappingResult {
  platformCode: PlatformCode;
  supplierCandidates: MappingCandidate[];
  bestSupplierCandidate?: MappingCandidate;
  lineSuggestions: LineMappingSuggestion[];
  overallMappingStatus: 'Unmapped' | 'Suggested' | 'Confirmed' | 'NeedsReview';
  issues: string[];
}

export interface DocumentPlatformConnector {
  readonly platformCode: PlatformCode;
  readonly platformName: string;

  suggestMappings(draft: NormalizedPurchaseDraft): Observable<DocumentMappingResult>;
}
