import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import { RestService } from '../../core/services/rest.service';
import {
  DocumentMappingResult,
  DocumentPlatformConnector,
  LineMappingSuggestion,
  MappingCandidate,
  NormalizedPurchaseDraft,
  NormalizedPurchaseDraftLine,
  PlatformCode,
} from './document-platform-connector.interface';

@Injectable({
  providedIn: 'root',
})
export class BusinessCentralDocumentConnectorService implements DocumentPlatformConnector {
  readonly platformCode: PlatformCode = 'BC';
  readonly platformName = 'Business Central';

  private readonly requestOptions = { suppressGlobalErrorDialog: true };

  constructor(private restService: RestService) {}

  suggestMappings(draft: NormalizedPurchaseDraft): Observable<DocumentMappingResult> {
    return forkJoin({
      vendors: this.loadCollection('/vendorsAPI'),
      items: this.loadCollection('/Items'),
      glAccounts: this.loadCollection('/glAccounts'),
    }).pipe(
      map(({ vendors, items, glAccounts }) => {
        const supplierCandidates = this.rankSupplierCandidates(draft, vendors);
        const bestSupplierCandidate = supplierCandidates[0];
        const lineSuggestions = draft.lines.map((line) =>
          this.suggestLineMapping(line, items, glAccounts, bestSupplierCandidate)
        );
        const issues = this.buildIssues(draft, supplierCandidates, lineSuggestions);

        return {
          platformCode: this.platformCode,
          supplierCandidates,
          bestSupplierCandidate,
          lineSuggestions,
          overallMappingStatus: this.getOverallStatus(supplierCandidates, lineSuggestions),
          issues,
        };
      })
    );
  }

  private loadCollection(endpoint: string): Observable<Record<string, unknown>[]> {
    return this.restService.get(endpoint, this.requestOptions).pipe(
      map((response) => this.readCollection(response)),
      catchError(() => of([]))
    );
  }

  private rankSupplierCandidates(
    draft: NormalizedPurchaseDraft,
    vendors: Record<string, unknown>[]
  ): MappingCandidate[] {
    const sourceName = draft.supplierName || '';
    const sourceTax = draft.supplierTaxNo || '';
    const sourceRegistration = draft.supplierRegistrationNo || '';
    const sourceEmail = draft.supplierEmail || '';
    const sourcePhone = draft.supplierPhone || '';
    const sourceWebsite = draft.supplierWebsite || '';
    const sourceAddress = draft.supplierAddress || '';

    return vendors
      .map((vendor): MappingCandidate | null => {
        const vendorCode = this.readString(vendor, ['number', 'Number', 'No', 'no', 'vendorNo', 'VendorNo']);
        const vendorName = this.readString(vendor, ['displayName', 'DisplayName', 'Name', 'name', 'SearchName', 'searchName']);
        const vendorSearchName = this.readString(vendor, ['SearchName', 'searchName']);
        const vendorTax = this.readString(vendor, ['taxRegistrationNumber', 'TaxRegistrationNumber', 'VATRegistrationNo']);
        const vendorRegistration = this.readString(vendor, [
          'businessRegistrationNo',
          'BusinessRegistrationNo',
          'registrationNumber',
          'RegistrationNumber',
        ]);
        const vendorEmail = this.readString(vendor, ['email', 'Email', 'emailAddress', 'EmailAddress']);
        const vendorPhone = this.readString(vendor, ['phoneNumber', 'PhoneNumber', 'phone', 'Phone']);
        const vendorWebsite = this.readString(vendor, ['website', 'Website', 'homePage', 'HomePage']);
        const vendorAddress = [
          this.readString(vendor, ['address', 'Address', 'addressLine1', 'AddressLine1']),
          this.readString(vendor, ['city', 'City']),
          this.readString(vendor, ['postCode', 'PostCode']),
          this.readString(vendor, ['countryRegionCode', 'CountryRegionCode']),
        ].filter(Boolean).join(' ');

        const scored = this.scoreSupplier({
          sourceName,
          sourceTax,
          sourceRegistration,
          sourceEmail,
          sourcePhone,
          sourceWebsite,
          sourceAddress,
          vendorName,
          vendorSearchName,
          vendorTax,
          vendorRegistration,
          vendorEmail,
          vendorPhone,
          vendorWebsite,
          vendorAddress,
        });

        if (!vendorCode || !vendorName || scored.score < 0.28) {
          return null;
        }

        return {
          mappingType: 'Supplier' as const,
          sourceValue: sourceName || sourceTax || sourceRegistration || '',
          mappedCode: vendorCode,
          mappedDisplayName: vendorName,
          score: scored.score,
          matchedBy: scored.matchedBy,
          raw: vendor,
          requiresConfirmation: scored.score < 0.92,
        };
      })
      .filter((candidate): candidate is MappingCandidate => !!candidate)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }

  private suggestLineMapping(
    line: NormalizedPurchaseDraftLine,
    items: Record<string, unknown>[],
    glAccounts: Record<string, unknown>[],
    supplierCandidate?: MappingCandidate
  ): LineMappingSuggestion {
    const itemCandidates = this.rankItemCandidates(line, items, supplierCandidate);
    const glCandidates = this.rankGlCandidates(line, glAccounts);
    const bestItemCandidate = itemCandidates[0];
    const bestGlCandidate = glCandidates[0];
    const bestScore = Math.max(bestItemCandidate?.score || 0, bestGlCandidate?.score || 0);

    return {
      lineNo: line.lineNo,
      sourceDescription: line.description,
      sourceExternalItemCode: line.externalItemCode,
      itemCandidates,
      glCandidates,
      bestItemCandidate,
      bestGlCandidate,
      mappingStatus: bestScore >= 0.72 ? 'Suggested' : bestScore > 0 ? 'NeedsReview' : 'Unmapped',
    };
  }

  private rankItemCandidates(
    line: NormalizedPurchaseDraftLine,
    items: Record<string, unknown>[],
    supplierCandidate?: MappingCandidate
  ): MappingCandidate[] {
    const sourceCode = line.externalItemCode || '';
    const sourceDescription = line.description || '';
    const sourceUom = line.uom || '';
    const supplierCode = supplierCandidate?.mappedCode || '';

    return items
      .map((item): MappingCandidate | null => {
        const itemCode = this.readString(item, ['No', 'no', 'number', 'Number', 'itemNo', 'ItemNo']);
        const no2 = this.readString(item, ['No2', 'no2', 'No_2']);
        const description = this.readString(item, ['Description', 'description', 'displayName', 'DisplayName']);
        const searchDescription = this.readString(item, ['SearchDescription', 'searchDescription']);
        const vendorNo = this.readString(item, ['VendorNo', 'vendorNo']);
        const vendorItemNo = this.readString(item, ['VendorItemNo', 'vendorItemNo']);
        const baseUom = this.readString(item, ['BaseUnitOfMeasure', 'baseUnitOfMeasure']);
        const purchaseUom = this.readString(item, ['PurchUnitOfMeasure', 'purchUnitOfMeasure']);

        const scored = this.scoreItem({
          sourceCode,
          sourceDescription,
          sourceUom,
          supplierCode,
          itemCode,
          no2,
          description,
          searchDescription,
          vendorNo,
          vendorItemNo,
          baseUom,
          purchaseUom,
        });

        if (!itemCode || !description || scored.score < 0.25) {
          return null;
        }

        return {
          mappingType: 'Item' as const,
          sourceValue: sourceCode || sourceDescription,
          mappedCode: itemCode,
          mappedDisplayName: description,
          score: scored.score,
          matchedBy: scored.matchedBy,
          raw: item,
          requiresConfirmation: scored.score < 0.9,
        };
      })
      .filter((candidate): candidate is MappingCandidate => !!candidate)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  private rankGlCandidates(
    line: NormalizedPurchaseDraftLine,
    accounts: Record<string, unknown>[]
  ): MappingCandidate[] {
    const description = line.description || '';

    return accounts
      .map((account): MappingCandidate | null => {
        const code = this.readString(account, ['No', 'no', 'number', 'Number']);
        const name = this.readString(account, ['Name', 'name', 'displayName', 'DisplayName']);
        const category = this.readString(account, ['AccountCategory', 'accountCategory']);
        const subcategory = this.readString(account, [
          'AccountSubcategoryDescript',
          'accountSubcategoryDescript',
          'AccountSubcategoryDescription',
          'accountSubcategoryDescription',
        ]);
        const directPosting = this.readBoolean(account, ['DirectPosting', 'directPosting']);
        const showInPortal = this.readBoolean(account, ['ShowInPortalPurchase', 'showInPortalPurchase']);
        const accountType = this.readString(account, ['AccountType', 'accountType']);

        if (directPosting === false || showInPortal === false || /^heading|total$/i.test(accountType)) {
          return null;
        }

        const scored = this.scoreGl(description, name, category, subcategory, directPosting, showInPortal);
        if (!code || !name || scored.score < 0.2) {
          return null;
        }

        return {
          mappingType: 'GLAccount' as const,
          sourceValue: description,
          mappedCode: code,
          mappedDisplayName: name,
          score: scored.score,
          matchedBy: scored.matchedBy,
          raw: account,
          requiresConfirmation: scored.score < 0.86,
        };
      })
      .filter((candidate): candidate is MappingCandidate => !!candidate)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  private scoreSupplier(values: {
    sourceName: string;
    sourceTax: string;
    sourceRegistration: string;
    sourceEmail: string;
    sourcePhone: string;
    sourceWebsite: string;
    sourceAddress: string;
    vendorName: string;
    vendorSearchName: string;
    vendorTax: string;
    vendorRegistration: string;
    vendorEmail: string;
    vendorPhone: string;
    vendorWebsite: string;
    vendorAddress: string;
  }): { score: number; matchedBy: string[] } {
    let score = 0;
    const matchedBy: string[] = [];

    if (values.sourceTax && this.sameNormalized(values.sourceTax, values.vendorTax)) {
      score += 0.96;
      matchedBy.push('tax registration');
    }

    if (values.sourceRegistration && this.sameNormalized(values.sourceRegistration, values.vendorRegistration)) {
      score += 0.94;
      matchedBy.push('business registration');
    }

    const nameScore = Math.max(
      this.textMatchScore(values.sourceName, values.vendorName),
      this.textMatchScore(values.sourceName, values.vendorSearchName)
    );
    if (nameScore >= 0.88) {
      score += 0.88;
      matchedBy.push('exact name');
    } else if (nameScore >= 0.55) {
      score += 0.58;
      matchedBy.push('partial name');
    }

    if (values.sourceEmail && this.sameNormalized(values.sourceEmail, values.vendorEmail)) {
      score += 0.78;
      matchedBy.push('email');
    }

    if (values.sourcePhone && this.sameDigits(values.sourcePhone, values.vendorPhone)) {
      score += 0.7;
      matchedBy.push('phone');
    }

    if (values.sourceWebsite && this.sameDomain(values.sourceWebsite, values.vendorWebsite)) {
      score += 0.62;
      matchedBy.push('website');
    }

    const addressScore = this.textMatchScore(values.sourceAddress, values.vendorAddress);
    if (addressScore >= 0.48) {
      score += 0.25;
      matchedBy.push('address');
    }

    return { score: Math.min(score, 1), matchedBy };
  }

  private scoreItem(values: {
    sourceCode: string;
    sourceDescription: string;
    sourceUom: string;
    supplierCode: string;
    itemCode: string;
    no2: string;
    description: string;
    searchDescription: string;
    vendorNo: string;
    vendorItemNo: string;
    baseUom: string;
    purchaseUom: string;
  }): { score: number; matchedBy: string[] } {
    let score = 0;
    const matchedBy: string[] = [];

    if (values.sourceCode) {
      if (this.sameNormalized(values.sourceCode, values.itemCode)) {
        score += 0.96;
        matchedBy.push('item no');
      } else if (this.sameNormalized(values.sourceCode, values.no2)) {
        score += 0.88;
        matchedBy.push('item no. 2');
      } else if (this.sameNormalized(values.sourceCode, values.vendorItemNo)) {
        score += 0.92;
        matchedBy.push('vendor item no');
      }
    }

    const descriptionScore = Math.max(
      this.textMatchScore(values.sourceDescription, values.description),
      this.textMatchScore(values.sourceDescription, values.searchDescription)
    );
    if (descriptionScore >= 0.72) {
      score += 0.52;
      matchedBy.push('description');
    } else if (descriptionScore >= 0.42) {
      score += 0.32;
      matchedBy.push('description keywords');
    }

    if (values.sourceUom && (
      this.sameNormalized(values.sourceUom, values.baseUom) ||
      this.sameNormalized(values.sourceUom, values.purchaseUom)
    )) {
      score += 0.08;
      matchedBy.push('uom');
    }

    if (values.supplierCode && values.vendorNo && this.sameNormalized(values.supplierCode, values.vendorNo)) {
      score += 0.08;
      matchedBy.push('vendor');
    }

    return { score: Math.min(score, 1), matchedBy };
  }

  private scoreGl(
    sourceDescription: string,
    name: string,
    category: string,
    subcategory: string,
    directPosting?: boolean,
    showInPortal?: boolean
  ): { score: number; matchedBy: string[] } {
    let score = 0;
    const matchedBy: string[] = [];
    const nameScore = this.keywordOverlapScore(sourceDescription, name);
    const categoryScore = Math.max(
      this.keywordOverlapScore(sourceDescription, category),
      this.keywordOverlapScore(sourceDescription, subcategory)
    );

    if (nameScore >= 0.5) {
      score += 0.58;
      matchedBy.push('account name');
    } else if (nameScore > 0) {
      score += Math.min(nameScore * 0.42, 0.42);
      matchedBy.push('account name keywords');
    }

    if (categoryScore >= 0.4) {
      score += 0.28;
      matchedBy.push('category');
    }

    if (directPosting === true) {
      score += 0.06;
      matchedBy.push('direct posting');
    }

    if (showInPortal === true) {
      score += 0.06;
      matchedBy.push('portal purchase');
    }

    return { score: Math.min(score, 1), matchedBy };
  }

  private buildIssues(
    draft: NormalizedPurchaseDraft,
    supplierCandidates: MappingCandidate[],
    lineSuggestions: LineMappingSuggestion[]
  ): string[] {
    const issues: string[] = [];

    if (draft.supplierName && !supplierCandidates.length) {
      issues.push('Supplier could not be matched to a Business Central vendor.');
    }

    lineSuggestions.forEach((line) => {
      if (line.mappingStatus === 'Unmapped') {
        issues.push(`Line ${line.lineNo || '-'} has no item or G/L suggestion.`);
      }
    });

    return issues;
  }

  private getOverallStatus(
    supplierCandidates: MappingCandidate[],
    lineSuggestions: LineMappingSuggestion[]
  ): 'Unmapped' | 'Suggested' | 'Confirmed' | 'NeedsReview' {
    if (!lineSuggestions.length) {
      return 'Unmapped';
    }

    if (lineSuggestions.some((line) => line.mappingStatus === 'Unmapped')) {
      return 'NeedsReview';
    }

    if (supplierCandidates[0]?.score >= 0.95 && lineSuggestions.every((line) => line.mappingStatus === 'Suggested')) {
      return 'Suggested';
    }

    return 'NeedsReview';
  }

  private readCollection(response: unknown): Record<string, unknown>[] {
    const value = (response as { value?: Record<string, unknown>[] })?.value;
    if (Array.isArray(value)) {
      return value;
    }

    return Array.isArray(response) ? response as Record<string, unknown>[] : [];
  }

  private readString(source: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = source[key];
      if (value === null || value === undefined) {
        continue;
      }

      const text = String(value).trim();
      if (text) {
        return text;
      }
    }

    return '';
  }

  private readBoolean(source: Record<string, unknown>, keys: string[]): boolean | undefined {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'boolean') {
        return value;
      }

      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === 'yes') {
          return true;
        }

        if (normalized === 'false' || normalized === 'no') {
          return false;
        }
      }
    }

    return undefined;
  }

  private textMatchScore(source: string, target: string): number {
    const normalizedSource = this.normalizeText(source);
    const normalizedTarget = this.normalizeText(target);
    if (!normalizedSource || !normalizedTarget) {
      return 0;
    }

    if (normalizedSource === normalizedTarget) {
      return 1;
    }

    if (normalizedSource.includes(normalizedTarget) || normalizedTarget.includes(normalizedSource)) {
      return 0.72;
    }

    return this.keywordOverlapScore(normalizedSource, normalizedTarget);
  }

  private keywordOverlapScore(source: string, target: string): number {
    const sourceTokens = this.keywords(source);
    const targetTokens = this.keywords(target);
    if (!sourceTokens.length || !targetTokens.length) {
      return 0;
    }

    const targetSet = new Set(targetTokens);
    const matched = sourceTokens.filter((token) => targetSet.has(token)).length;
    return matched / Math.max(sourceTokens.length, targetTokens.length);
  }

  private keywords(value: string): string[] {
    return this.normalizeText(value)
      .split(' ')
      .filter((token) => token.length >= 3 && !['the', 'and', 'for', 'with', 'sdn', 'bhd', 'ltd'].includes(token));
  }

  private sameNormalized(a: string, b: string): boolean {
    return !!a && !!b && this.normalizeCompact(a) === this.normalizeCompact(b);
  }

  private sameDigits(a: string, b: string): boolean {
    const left = a.replace(/\D/g, '');
    const right = b.replace(/\D/g, '');
    return !!left && !!right && left === right;
  }

  private sameDomain(a: string, b: string): boolean {
    return !!a && !!b && this.normalizeDomain(a) === this.normalizeDomain(b);
  }

  private normalizeText(value: string): string {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  private normalizeCompact(value: string): string {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private normalizeDomain(value: string): string {
    return String(value || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .trim();
  }
}
