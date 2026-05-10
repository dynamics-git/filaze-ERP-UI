import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { RestService } from '../../core/services/rest.service';
import { SmartImportTemplate, SmartImportTemplatePayload } from './document-import.models';

@Injectable({
  providedIn: 'root',
})
export class SmartImportTemplateApiService {
  private readonly requestOptions = { suppressGlobalErrorDialog: true };

  constructor(private restService: RestService) {}

  getActiveTemplates(platformCode: string, targetDocumentType: string): Observable<SmartImportTemplate[]> {
    const filters = [
      `isActive eq true`,
      `platformCode eq '${this.escapeODataLiteral(platformCode)}'`,
      `targetDocumentType eq '${this.escapeODataLiteral(targetDocumentType)}'`,
    ];

    return this.restService
      .get(`/smartImportTemplates?$filter=${filters.join(' and ')}`, this.requestOptions)
      .pipe(map((response) => this.readCollection<SmartImportTemplate>(response).map((item) => this.normalizeTemplate(item))));
  }

  createTemplate(template: SmartImportTemplatePayload): Observable<SmartImportTemplate> {
    return this.restService
      .post('/smartImportTemplates', template, this.requestOptions)
      .pipe(map((response) => this.normalizeTemplate(response as SmartImportTemplate)));
  }

  updateTemplate(systemId: string, patch: Partial<SmartImportTemplatePayload>): Observable<SmartImportTemplate> {
    return this.restService
      .patch(`/smartImportTemplates(${systemId})`, patch, '*', this.requestOptions)
      .pipe(map((response) => this.normalizeTemplate(response as SmartImportTemplate)));
  }

  deactivateTemplate(systemId: string): Observable<SmartImportTemplate> {
    return this.updateTemplate(systemId, { isActive: false });
  }

  private normalizeTemplate(template: SmartImportTemplate): SmartImportTemplate {
    const source = template as unknown as Record<string, unknown>;
    const systemId = this.readString(source, ['systemId', 'SystemId', 'id', 'Id']);
    const templateName = this.readString(source, ['templateName', 'TemplateName', 'name', 'Name']) || 'Template';
    const targetDocumentType = this.readString(source, ['targetDocumentType', 'TargetDocumentType']) || '';

    return {
      ...template,
      id: systemId || this.readString(source, ['id', 'Id']) || this.readString(source, ['templateId', 'TemplateId']) || undefined,
      systemId: systemId || undefined,
      templateId: this.readString(source, ['templateId', 'TemplateId']) || undefined,
      templateCode: this.readString(source, ['templateCode', 'TemplateCode']) || undefined,
      templateName,
      name: templateName,
      platformCode: this.readString(source, ['platformCode', 'PlatformCode']) || 'BC',
      targetDocumentType,
      sourceDocumentType: this.readString(source, ['sourceDocumentType', 'SourceDocumentType']) || undefined,
      supplierNamePattern: this.readString(source, ['supplierNamePattern', 'SupplierNamePattern']) || undefined,
      supplierCode: this.readString(source, ['supplierCode', 'SupplierCode']) || undefined,
      detectionKeywordsJson: this.readString(source, ['detectionKeywordsJson', 'DetectionKeywordsJson']) || '[]',
      headerMappingJson: this.readString(source, ['headerMappingJson', 'HeaderMappingJson']) || '[]',
      lineMappingJson: this.readString(source, ['lineMappingJson', 'LineMappingJson']) || '[]',
      stopPatternsJson: this.readString(source, ['stopPatternsJson', 'StopPatternsJson']) || '[]',
      sampleRawTextHash: this.readString(source, ['sampleRawTextHash', 'SampleRawTextHash']) || undefined,
      matchScoreThreshold: this.readNumber(source, ['matchScoreThreshold', 'MatchScoreThreshold']),
      isActive: this.readBoolean(source, ['isActive', 'IsActive']) ?? true,
      isDefault: this.readBoolean(source, ['isDefault', 'IsDefault']) ?? false,
      usageCount: this.readNumber(source, ['usageCount', 'UsageCount']) ?? 0,
      lastUsedDateTime: this.readString(source, ['lastUsedDateTime', 'LastUsedDateTime']) || undefined,
      lastMatchedScore: this.readNumber(source, ['lastMatchedScore', 'LastMatchedScore']) ?? undefined,
      companyId: this.readString(source, ['companyId', 'CompanyId']) || undefined,
      company: this.readString(source, ['company', 'Company']) || undefined,
      createdBy: this.readString(source, ['createdBy', 'CreatedBy']) || undefined,
      createdDateTime: this.readString(source, ['createdDateTime', 'CreatedDateTime']) || undefined,
      modifiedBy: this.readString(source, ['modifiedBy', 'ModifiedBy']) || undefined,
      modifiedDateTime: this.readString(source, ['modifiedDateTime', 'ModifiedDateTime']) || undefined,
    };
  }

  private readCollection<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
      return value as T[];
    }

    const maybeCollection = value as { value?: T[] } | null | undefined;
    return Array.isArray(maybeCollection?.value) ? maybeCollection.value : [];
  }

  private readString(value: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const candidate = value?.[key];
      if (candidate !== undefined && candidate !== null && `${candidate}`.trim()) {
        return String(candidate).trim();
      }
    }

    return '';
  }

  private readNumber(value: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
      const candidate = Number(value?.[key]);
      if (!Number.isNaN(candidate)) {
        return candidate;
      }
    }

    return undefined;
  }

  private readBoolean(value: Record<string, unknown>, keys: string[]): boolean | undefined {
    for (const key of keys) {
      const candidate = value?.[key];
      if (typeof candidate === 'boolean') {
        return candidate;
      }

      if (candidate === 'true') {
        return true;
      }

      if (candidate === 'false') {
        return false;
      }
    }

    return undefined;
  }

  private escapeODataLiteral(value: string): string {
    return String(value || '').replace(/'/g, "''");
  }
}