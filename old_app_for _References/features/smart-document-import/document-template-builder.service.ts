import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  DocumentImportField,
  DocumentImportLine,
  SmartImportDocumentType,
  SmartImportTemplate,
  SmartImportTemplateFieldRule,
  SmartImportTemplateLineRule,
  SmartImportTemplatePayload,
} from './document-import.models';
import { SmartImportTemplateApiService } from './smart-import-template-api.service';

export type { SmartImportTemplate } from './document-import.models';

export interface SaveTemplateInput {
  name: string;
  targetDocumentType: SmartImportDocumentType | string;
  parserCode?: string;
  sourceDocumentType?: string;
  rawText?: string;
  fields: DocumentImportField[];
  lines: DocumentImportLine[];
}

export interface ApplyTemplateResult {
  template?: SmartImportTemplate;
  fields: DocumentImportField[];
  lines: DocumentImportLine[];
  appliedFieldCount: number;
  appliedLineCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentTemplateBuilderService {
  private readonly storageKey = 'smart-document-import.templates.v2';
  private readonly platformCode = 'BC';

  private cachedTemplates: SmartImportTemplate[] = [];
  private templatesLoaded = false;
  private availabilityStatusMessage = '';
  private localFallbackActive = false;

  constructor(private smartImportTemplateApiService: SmartImportTemplateApiService) {}

  get availabilityMessage(): string {
    return this.availabilityStatusMessage;
  }

  get isUsingLocalFallback(): boolean {
    return this.localFallbackActive;
  }

  listTemplates(targetDocumentType?: SmartImportDocumentType | string): SmartImportTemplate[] {
    const templates = this.getCurrentTemplates().filter((item) => item.isActive !== false);
    if (!targetDocumentType) {
      return templates;
    }

    return templates.filter((item) => item.targetDocumentType === targetDocumentType);
  }

  async refreshTemplates(targetDocumentType: SmartImportDocumentType | string): Promise<SmartImportTemplate[]> {
    try {
      const templates = await firstValueFrom(
        this.smartImportTemplateApiService.getActiveTemplates(this.platformCode, String(targetDocumentType || ''))
      );

      this.cachedTemplates = templates.map((item) => this.hydrateTemplate(item));
      this.templatesLoaded = true;
      this.localFallbackActive = false;
      this.availabilityStatusMessage = '';
      this.writeTemplates(this.cachedTemplates);
      return this.listTemplates(targetDocumentType);
    } catch {
      const fallbackTemplates = this.readTemplates().filter((item) =>
        !targetDocumentType || item.targetDocumentType === targetDocumentType
      );

      this.cachedTemplates = fallbackTemplates;
      this.templatesLoaded = true;
      this.localFallbackActive = fallbackTemplates.length > 0;
      this.availabilityStatusMessage = fallbackTemplates.length > 0
        ? 'Template service unavailable. Local fallback used.'
        : 'Template service unavailable.';
      return fallbackTemplates;
    }
  }

  async saveTemplate(input: SaveTemplateInput): Promise<SmartImportTemplate> {
    const draftTemplate = this.buildTemplateRecord(input);
    const existingTemplate = this.findExistingTemplate(draftTemplate);
    const payload = this.toPayload({
      ...existingTemplate,
      ...draftTemplate,
      usageCount: existingTemplate?.usageCount || 0,
    });

    try {
      const savedTemplate = existingTemplate?.systemId
        ? await firstValueFrom(this.smartImportTemplateApiService.updateTemplate(existingTemplate.systemId, payload))
        : await firstValueFrom(this.smartImportTemplateApiService.createTemplate(payload));

      const hydratedTemplate = this.hydrateTemplate(savedTemplate);
      this.upsertCachedTemplate(hydratedTemplate);
      this.localFallbackActive = false;
      this.availabilityStatusMessage = '';
      this.writeTemplates(this.cachedTemplates);
      return hydratedTemplate;
    } catch {
      const fallbackTemplate = this.saveTemplateLocally(draftTemplate, existingTemplate);
      this.localFallbackActive = true;
      this.availabilityStatusMessage = 'Template service unavailable. Local fallback used.';
      return fallbackTemplate;
    }
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const existingTemplate = this.getCurrentTemplates().find((item) => this.sameTemplateIdentity(item, templateId));
    if (!existingTemplate) {
      return false;
    }

    if (existingTemplate.systemId) {
      try {
        await firstValueFrom(this.smartImportTemplateApiService.deactivateTemplate(existingTemplate.systemId));
        this.cachedTemplates = this.cachedTemplates.filter((item) => !this.sameTemplateIdentity(item, templateId));
        this.writeTemplates(this.cachedTemplates);
        this.localFallbackActive = false;
        this.availabilityStatusMessage = '';
        return true;
      } catch {
        this.localFallbackActive = true;
        this.availabilityStatusMessage = 'Template service unavailable. Local fallback used.';
      }
    }

    this.cachedTemplates = this.cachedTemplates.filter((item) => !this.sameTemplateIdentity(item, templateId));
    this.writeTemplates(this.cachedTemplates);
    return true;
  }

  async applyBestTemplate(
    targetDocumentType: SmartImportDocumentType | string,
    parserCode: string,
    fields: DocumentImportField[],
    lines: DocumentImportLine[],
    rawText = ''
  ): Promise<ApplyTemplateResult> {
    await this.refreshTemplates(targetDocumentType);

    const templates = this.listTemplates(targetDocumentType);
    const safeFields = Array.isArray(fields) ? fields : [];
    const safeLines = Array.isArray(lines) ? lines : [];
    const supplierSignature = this.detectSupplierSignature(safeFields);

    const best = templates
      .map((template) => ({
        template,
        score: this.templateScore(template, parserCode, supplierSignature, rawText, targetDocumentType),
      }))
      .sort((a, b) => b.score - a.score)[0];

    const threshold = Number(best?.template?.matchScoreThreshold ?? 70);
    if (!best || best.score < threshold) {
      return {
        fields: safeFields,
        lines: safeLines,
        appliedFieldCount: 0,
        appliedLineCount: 0,
      };
    }

    const applied = this.applyTemplate(best.template, safeFields, safeLines);
    void this.markTemplateUsed(best.template, best.score);
    return {
      template: best.template,
      ...applied,
    };
  }

  applyTemplate(
    template: SmartImportTemplate,
    fields: DocumentImportField[],
    lines: DocumentImportLine[]
  ): Omit<ApplyTemplateResult, 'template'> {
    let appliedFieldCount = 0;
    let appliedLineCount = 0;
    const fieldRules = Array.isArray(template?.fieldRules) ? template.fieldRules : this.parseFieldRules(template?.headerMappingJson);
    const lineRules = Array.isArray(template?.lineRules) ? template.lineRules : this.parseLineRules(template?.lineMappingJson);
    const safeFields = Array.isArray(fields) ? fields : [];
    const safeLines = Array.isArray(lines) ? lines : [];

    const updatedFields = safeFields.map((field) => {
      const rule = fieldRules.find((item) => this.ruleMatchesField(item, field));
      if (!rule) {
        return field;
      }

      const extracted = String(field.extractedValue || '').trim();
      const corrected = String(field.correctedValue || field.extractedValue || '').trim();
      const candidateValue = String(rule.preferredValue || extracted).trim();
      if (!candidateValue) {
        return field;
      }

      const confidence = Number(field.confidenceScore || 0);
      const minConfidence = Number(rule.minConfidence || 0.65);
      const shouldApply =
        (rule.applyMode === 'always') ||
        (rule.applyMode === 'ifEmpty' && !corrected) ||
        (rule.applyMode === 'ifEmptyOrLowConfidence' && (!corrected || confidence < minConfidence));

      if (!shouldApply) {
        return field;
      }

      appliedFieldCount += 1;
      return {
        ...field,
        extractedValue: extracted || candidateValue,
        correctedValue: candidateValue,
        confidenceScore: Math.max(confidence, 0.9),
        isConfirmed: true,
        validationStatus: 'Pending',
        sourceText: field.sourceText || candidateValue,
      };
    });

    const updatedLines = safeLines.map((line) => {
      const rule = lineRules.find((item) => this.ruleMatchesLine(item, line));
      if (!rule) {
        return line;
      }

      let touched = false;
      const nextLine = { ...line };

      touched = this.applyLineRuleValue(nextLine, 'itemNo', rule.itemNo) || touched;
      touched = this.applyLineRuleValue(nextLine, 'glAccountNo', rule.glAccountNo) || touched;
      touched = this.applyLineRuleValue(nextLine, 'description', rule.description) || touched;
      touched = this.applyLineRuleValue(nextLine, 'unitOfMeasure', rule.unitOfMeasure) || touched;
      touched = this.applyLineRuleValue(nextLine, 'requiredDate', rule.requiredDate) || touched;
      touched = this.applyLineRuleValue(nextLine, 'departmentCode', rule.departmentCode) || touched;
      touched = this.applyLineRuleValue(nextLine, 'projectCode', rule.projectCode) || touched;
      touched = this.applyNumericLineRuleValue(nextLine, 'quantity', rule.quantity) || touched;
      touched = this.applyNumericLineRuleValue(nextLine, 'unitCost', rule.unitCost) || touched;
      touched = this.applyNumericLineRuleValue(nextLine, 'lineAmount', rule.lineAmount) || touched;

      if (!touched) {
        return line;
      }

      appliedLineCount += 1;
      nextLine.mappingStatus = nextLine.mappingStatus || 'TemplateApplied';
      nextLine.errorMessage = '';
      nextLine.confidenceScore = Math.max(Number(nextLine.confidenceScore || 0), 0.9);
      return nextLine;
    });

    return {
      fields: updatedFields,
      lines: updatedLines,
      appliedFieldCount,
      appliedLineCount,
    };
  }

  private buildTemplateRecord(input: SaveTemplateInput): SmartImportTemplate {
    const normalizedName = String(input.name || '').trim();
    const now = new Date().toISOString();
    const fieldRules = this.buildFieldRules(input.fields);
    const lineRules = this.buildLineRules(input.lines);
    const detectionKeywords = this.buildDetectionKeywords(input.rawText || '', input.fields, input.parserCode);
    const stopPatterns = this.buildStopPatterns(input.rawText || '');
    const supplierSignature = this.detectSupplierSignature(input.fields);
    const supplierCode = this.detectSupplierCode(input.fields);

    return this.hydrateTemplate({
      templateId: this.createGuid(),
      templateCode: this.toTemplateCode(normalizedName),
      templateName: normalizedName,
      name: normalizedName,
      platformCode: this.platformCode,
      targetDocumentType: input.targetDocumentType,
      sourceDocumentType: this.toSourceDocumentType(input.sourceDocumentType || input.parserCode || ''),
      supplierNamePattern: supplierSignature || undefined,
      supplierCode: supplierCode || undefined,
      detectionKeywordsJson: JSON.stringify(detectionKeywords),
      headerMappingJson: JSON.stringify(fieldRules),
      lineMappingJson: JSON.stringify(lineRules),
      stopPatternsJson: JSON.stringify(stopPatterns),
      sampleRawTextHash: this.hashText(input.rawText || ''),
      matchScoreThreshold: 70,
      isActive: true,
      isDefault: false,
      usageCount: 0,
      createdDateTime: now,
      modifiedDateTime: now,
      parserCode: input.parserCode,
      supplierSignature,
      fieldRules,
      lineRules,
      detectionKeywords,
      stopPatterns,
    });
  }

  private findExistingTemplate(template: SmartImportTemplate): SmartImportTemplate | undefined {
    return this.getCurrentTemplates().find((item) =>
      item.platformCode === this.platformCode &&
      item.targetDocumentType === template.targetDocumentType &&
      this.normalizeIdentifier(item.templateName || item.name || '') === this.normalizeIdentifier(template.templateName || template.name || '')
    );
  }

  private toPayload(template: SmartImportTemplate): SmartImportTemplatePayload {
    const templateId = this.isGuid(template.templateId) ? template.templateId : undefined;

    return {
      templateId,
      templateCode: template.templateCode,
      templateName: template.templateName,
      platformCode: template.platformCode,
      targetDocumentType: template.targetDocumentType,
      sourceDocumentType: this.toSourceDocumentType(template.sourceDocumentType || template.parserCode || ''),
      supplierNamePattern: template.supplierNamePattern,
      supplierCode: template.supplierCode,
      detectionKeywordsJson: template.detectionKeywordsJson || JSON.stringify(template.detectionKeywords || []),
      headerMappingJson: template.headerMappingJson || JSON.stringify(template.fieldRules || []),
      lineMappingJson: template.lineMappingJson || JSON.stringify(template.lineRules || []),
      stopPatternsJson: template.stopPatternsJson || JSON.stringify(template.stopPatterns || []),
      sampleRawTextHash: template.sampleRawTextHash,
      matchScoreThreshold: template.matchScoreThreshold ?? 70,
      isActive: template.isActive ?? true,
      isDefault: template.isDefault ?? false,
    };
  }

  private hydrateTemplate(template: Partial<SmartImportTemplate>): SmartImportTemplate {
    const fieldRules = Array.isArray(template.fieldRules) && template.fieldRules.length
      ? template.fieldRules
      : this.parseFieldRules(template.headerMappingJson);
    const lineRules = Array.isArray(template.lineRules) && template.lineRules.length
      ? template.lineRules
      : this.parseLineRules(template.lineMappingJson);
    const detectionKeywords = Array.isArray(template.detectionKeywords) && template.detectionKeywords.length
      ? template.detectionKeywords
      : this.parseStringArray(template.detectionKeywordsJson);
    const stopPatterns = Array.isArray(template.stopPatterns) && template.stopPatterns.length
      ? template.stopPatterns
      : this.parseStringArray(template.stopPatternsJson);
    const templateName = String(template.templateName || template.name || 'Template').trim();
    const systemId = String(template.systemId || template.id || '').trim() || undefined;

    return {
      ...template,
      id: systemId || String(template.templateId || '').trim() || undefined,
      systemId,
      templateId: String(template.templateId || '').trim() || undefined,
      templateCode: this.toTemplateCode(String(template.templateCode || templateName).trim()) || undefined,
      templateName,
      name: templateName,
      platformCode: String(template.platformCode || this.platformCode).trim() || this.platformCode,
      targetDocumentType: String(template.targetDocumentType || '').trim(),
      sourceDocumentType: this.toSourceDocumentType(String(template.sourceDocumentType || template.parserCode || '').trim()) || undefined,
      supplierNamePattern: String(template.supplierNamePattern || '').trim() || undefined,
      supplierCode: String(template.supplierCode || '').trim() || undefined,
      detectionKeywordsJson: template.detectionKeywordsJson || JSON.stringify(detectionKeywords),
      headerMappingJson: template.headerMappingJson || JSON.stringify(fieldRules),
      lineMappingJson: template.lineMappingJson || JSON.stringify(lineRules),
      stopPatternsJson: template.stopPatternsJson || JSON.stringify(stopPatterns),
      sampleRawTextHash: String(template.sampleRawTextHash || '').trim() || undefined,
      matchScoreThreshold: Number(template.matchScoreThreshold ?? 70),
      isActive: template.isActive !== false,
      isDefault: !!template.isDefault,
      usageCount: Number(template.usageCount ?? 0),
      lastUsedDateTime: String(template.lastUsedDateTime || '').trim() || undefined,
      lastMatchedScore: this.numberOrUndefined(template.lastMatchedScore),
      companyId: String(template.companyId || '').trim() || undefined,
      company: String(template.company || '').trim() || undefined,
      createdBy: String(template.createdBy || '').trim() || undefined,
      createdDateTime: String(template.createdDateTime || '').trim() || undefined,
      modifiedBy: String(template.modifiedBy || '').trim() || undefined,
      modifiedDateTime: String(template.modifiedDateTime || '').trim() || undefined,
      parserCode: String(template.parserCode || template.sourceDocumentType || '').trim() || undefined,
      supplierSignature: String(template.supplierSignature || template.supplierNamePattern || '').trim() || undefined,
      fieldRules,
      lineRules,
      detectionKeywords,
      stopPatterns,
    };
  }

  private async markTemplateUsed(template: SmartImportTemplate, score: number): Promise<void> {
    if (!template.systemId) {
      return;
    }

    try {
      void score;
    } catch {
      // Template usage tracking should never break the review flow.
    }
  }

  private buildFieldRules(fields: DocumentImportField[]): SmartImportTemplateFieldRule[] {
    const rules: SmartImportTemplateFieldRule[] = [];

    fields.forEach((field) => {
      const fieldCode = String(field.fieldCode || field.fieldName || '').trim();
      if (!fieldCode) {
        return;
      }

      const aliases = [field.sourceLabel, field.displayName, field.fieldName, field.fieldCode]
        .filter((value): value is string => !!String(value || '').trim())
        .map((value) => this.normalizeIdentifier(value));
      const extracted = String(field.extractedValue || '').trim();
      const corrected = String(field.correctedValue || field.extractedValue || '').trim();
      const changedByUser = corrected && corrected !== extracted;
      const normalizedFieldCode = this.normalizeIdentifier(fieldCode);
      const reusableValueAllowed = !this.isVolatileFieldCode(normalizedFieldCode);
      const preferredValue = reusableValueAllowed && (changedByUser || field.isConfirmed) ? corrected : undefined;
      const status = String(field.validationStatus || '').toLowerCase();
      const manuallyMapped = status === 'mapped' || status === 'manual';
      const applyMode: SmartImportTemplateFieldRule['applyMode'] =
        (changedByUser || manuallyMapped) ? 'always' : 'ifEmptyOrLowConfidence';

      rules.push({
        fieldCode,
        aliases: [...new Set(aliases)],
        preferredValue,
        applyMode,
        minConfidence: 0.65,
      });
    });

    return rules;
  }

  private buildLineRules(lines: DocumentImportLine[]): SmartImportTemplateLineRule[] {
    const rules: SmartImportTemplateLineRule[] = [];

    lines.forEach((line) => {
      const matchText = this.normalizeIdentifier(
        String(line.externalItemCode || line.description || line.sourceText || '').trim()
      );

      if (!matchText) {
        return;
      }

      rules.push({
        matchText,
        itemNo: String(line.itemNo || '').trim() || undefined,
        glAccountNo: String(line.glAccountNo || '').trim() || undefined,
        unitOfMeasure: String(line.unitOfMeasure || '').trim() || undefined,
        departmentCode: String(line.departmentCode || '').trim() || undefined,
        projectCode: String(line.projectCode || '').trim() || undefined,
      });
    });

    return rules;
  }

  private buildDetectionKeywords(rawText: string, fields: DocumentImportField[], parserCode?: string): string[] {
    const keywords = new Set<string>();
    const supplierSignature = this.detectSupplierSignature(fields);
    if (supplierSignature) {
      keywords.add(supplierSignature);
    }

    if (parserCode) {
      keywords.add(parserCode);
    }

    String(rawText || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 4)
      .slice(0, 18)
      .forEach((line) => {
        if (!/total|subtotal|page\s+\d+/i.test(line)) {
          keywords.add(line);
        }
      });

    return Array.from(keywords).slice(0, 12);
  }

  private buildStopPatterns(rawText: string): string[] {
    const patterns = new Set<string>();

    String(rawText || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /total|subtotal|grand\s+total|net\s+total/i.test(line))
      .forEach((line) => patterns.add(line));

    if (!patterns.size) {
      patterns.add('Total');
    }

    return Array.from(patterns).slice(0, 8);
  }

  private detectSupplierSignature(fields: DocumentImportField[]): string {
    const safeFields = Array.isArray(fields) ? fields : [];
    const byCode = safeFields.find((field) => this.normalizeIdentifier(field.fieldCode || field.fieldName || '') === 'suppliercode');
    const byName = safeFields.find((field) => this.normalizeIdentifier(field.fieldCode || field.fieldName || '') === 'suppliername');
    const signature = String(byCode?.correctedValue || byCode?.extractedValue || byName?.correctedValue || byName?.extractedValue || '').trim();
    return signature;
  }

  private detectSupplierCode(fields: DocumentImportField[]): string {
    const safeFields = Array.isArray(fields) ? fields : [];
    const supplierCodeField = safeFields.find((field) => this.normalizeIdentifier(field.fieldCode || field.fieldName || '') === 'suppliercode');
    return String(supplierCodeField?.correctedValue || supplierCodeField?.extractedValue || '').trim();
  }

  private templateScore(
    template: SmartImportTemplate,
    parserCode: string,
    supplierSignature: string,
    rawText: string,
    targetDocumentType: SmartImportDocumentType | string
  ): number {
    if (template.isActive === false) {
      return 0;
    }

    if (template.targetDocumentType && template.targetDocumentType !== targetDocumentType) {
      return 0;
    }

    let score = 25;
    const normalizedRawText = this.normalizeIdentifier(rawText);
    const normalizedSupplierSignature = this.normalizeIdentifier(supplierSignature);
    const normalizedSupplierPattern = this.normalizeIdentifier(template.supplierNamePattern || '');

    if (template.sourceDocumentType && parserCode && this.toSourceDocumentType(template.sourceDocumentType) === this.toSourceDocumentType(parserCode)) {
      score += 20;
    }

    if (normalizedSupplierPattern && normalizedSupplierSignature && (
      normalizedSupplierSignature.includes(normalizedSupplierPattern) ||
      normalizedSupplierPattern.includes(normalizedSupplierSignature)
    )) {
      score += 25;
    }

    if (normalizedSupplierPattern && normalizedRawText && normalizedRawText.includes(normalizedSupplierPattern)) {
      score += 10;
    }

    const detectionKeywords = Array.isArray(template.detectionKeywords) ? template.detectionKeywords : this.parseStringArray(template.detectionKeywordsJson);
    if (detectionKeywords.length && normalizedRawText) {
      const matchedKeywordCount = detectionKeywords
        .map((keyword) => this.normalizeIdentifier(keyword))
        .filter((keyword) => !!keyword && normalizedRawText.includes(keyword))
        .length;

      score += Math.round((matchedKeywordCount / detectionKeywords.length) * 30);
    }

    if (template.sampleRawTextHash && rawText && template.sampleRawTextHash === this.hashText(rawText)) {
      score += 15;
    }

    if (template.isDefault) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  private ruleMatchesField(rule: SmartImportTemplateFieldRule, field: DocumentImportField): boolean {
    if (!rule || !field) {
      return false;
    }

    const fieldCode = this.normalizeIdentifier(field.fieldCode || field.fieldName || '');
    if (fieldCode && fieldCode === this.normalizeIdentifier(rule.fieldCode)) {
      return true;
    }

    const aliases = [field.sourceLabel, field.displayName, field.fieldName, field.fieldCode]
      .filter((value): value is string => !!String(value || '').trim())
      .map((value) => this.normalizeIdentifier(value));

    const ruleAliases = Array.isArray(rule.aliases) ? rule.aliases : [];
    return aliases.some((alias) => ruleAliases.includes(alias));
  }

  private ruleMatchesLine(rule: SmartImportTemplateLineRule, line: DocumentImportLine): boolean {
    if (!rule || !line) {
      return false;
    }

    const lineText = this.normalizeIdentifier(
      String(line.externalItemCode || line.description || line.sourceText || '').trim()
    );

    return !!lineText && (
      lineText === rule.matchText ||
      lineText.includes(rule.matchText) ||
      rule.matchText.includes(lineText)
    );
  }

  private applyLineRuleValue(line: DocumentImportLine, field: keyof DocumentImportLine, value?: string): boolean {
    if (!value) {
      return false;
    }

    const current = String(line[field] || '').trim();
    const confidence = Number(line.confidenceScore || 0);
    if (current && confidence >= 0.65) {
      return false;
    }

    line[field] = value;
    return true;
  }

  private applyNumericLineRuleValue(line: DocumentImportLine, field: keyof DocumentImportLine, value?: number): boolean {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return false;
    }

    const current = Number(line[field] || 0);
    const confidence = Number(line.confidenceScore || 0);
    if (current > 0 && confidence >= 0.65) {
      return false;
    }

    line[field] = value;
    return true;
  }

  private numberOrUndefined(value: unknown): number | undefined {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private parseFieldRules(rawValue?: string): SmartImportTemplateFieldRule[] {
    const parsed = this.parseJsonValue(rawValue);
    return Array.isArray(parsed) ? parsed as SmartImportTemplateFieldRule[] : [];
  }

  private parseLineRules(rawValue?: string): SmartImportTemplateLineRule[] {
    const parsed = this.parseJsonValue(rawValue);
    return Array.isArray(parsed) ? parsed as SmartImportTemplateLineRule[] : [];
  }

  private parseStringArray(rawValue?: string): string[] {
    const parsed = this.parseJsonValue(rawValue);
    return Array.isArray(parsed) ? parsed.map((item) => String(item || '').trim()).filter((item) => !!item) : [];
  }

  private parseJsonValue(rawValue?: string): unknown {
    if (!rawValue) {
      return [];
    }

    try {
      return JSON.parse(rawValue);
    } catch {
      return [];
    }
  }

  private sameTemplateIdentity(template: SmartImportTemplate, id: string): boolean {
    return [template.id, template.systemId, template.templateId, template.templateCode]
      .filter((value): value is string => !!String(value || '').trim())
      .some((value) => value === id);
  }

  private upsertCachedTemplate(template: SmartImportTemplate): void {
    const existingIndex = this.cachedTemplates.findIndex((item) =>
      (!!template.systemId && item.systemId === template.systemId) ||
      (!!template.templateId && item.templateId === template.templateId) ||
      this.normalizeIdentifier(item.templateName || item.name || '') === this.normalizeIdentifier(template.templateName || template.name || '')
    );

    if (existingIndex >= 0) {
      this.cachedTemplates[existingIndex] = template;
      return;
    }

    this.cachedTemplates = [...this.cachedTemplates, template];
  }

  private saveTemplateLocally(template: SmartImportTemplate, existingTemplate?: SmartImportTemplate): SmartImportTemplate {
    const localTemplate = this.hydrateTemplate({
      ...existingTemplate,
      ...template,
      id: existingTemplate?.id || template.id || this.createGuid(),
      systemId: existingTemplate?.systemId,
      templateId: existingTemplate?.templateId || template.templateId || this.createGuid(),
    });

    this.upsertCachedTemplate(localTemplate);
    this.writeTemplates(this.cachedTemplates);
    return localTemplate;
  }

  private getCurrentTemplates(): SmartImportTemplate[] {
    if (this.templatesLoaded) {
      return this.cachedTemplates;
    }

    const fallbackTemplates = this.readTemplates();
    this.cachedTemplates = fallbackTemplates;
    return this.cachedTemplates;
  }

  private readTemplates(): SmartImportTemplate[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map((item) => this.hydrateTemplate(item)) : [];
    } catch {
      return [];
    }
  }

  private writeTemplates(templates: SmartImportTemplate[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(templates));
  }

  private normalizeIdentifier(value: string): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .trim();
  }

  private toTemplateCode(value: string): string {
    return this.normalizeIdentifier(value).slice(0, 50);
  }

  private toSourceDocumentType(value: string): string {
    return String(value || '').trim().slice(0, 30);
  }

  private isGuid(value: string | undefined): value is string {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
  }

  private createGuid(): string {
    const cryptoApi = globalThis.crypto;
    if (cryptoApi?.randomUUID) {
      return cryptoApi.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
      const randomValue = Math.floor(Math.random() * 16);
      const nextValue = token === 'x' ? randomValue : ((randomValue & 0x3) | 0x8);
      return nextValue.toString(16);
    });
  }

  private hashText(value: string): string {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    let hash = 0;

    for (let index = 0; index < normalized.length; index += 1) {
      hash = ((hash << 5) - hash) + normalized.charCodeAt(index);
      hash |= 0;
    }

    return Math.abs(hash).toString(16);
  }

  private isVolatileFieldCode(normalizedFieldCode: string): boolean {
    if (!normalizedFieldCode) {
      return false;
    }

    return [
      'documentno',
      'invoiceno',
      'orderno',
      'pono',
      'purchaseorderno',
      'yourreference',
      'documentdate',
      'invoicedate',
      'requireddate',
      'duedate',
      'deliverydate',
      'taxdate',
      'totalamount',
      'subtotal',
      'taxamount',
      'vatvalue',
      'vatrate',
      'netvalue',
      'discountamount',
      'grossamount',
      'lineamount',
      'quantity',
      'qty',
    ].includes(normalizedFieldCode);
  }
}