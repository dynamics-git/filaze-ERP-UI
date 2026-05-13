import { Injectable } from '@angular/core';

export interface LineOption {
  label: string;
  value: unknown;
}

export interface LineMasterBucket {
  options: LineOption[];
  records: Record<string, unknown>[];
}

export interface LineMasterRegistry {
  defaultType: string;
  emptyType: string;
  byType: Record<string, LineMasterBucket>;
  aliases?: Record<string, string>;
}

export interface LineSelectionStrategy {
  descriptionField: string;
  descriptionSources: string[];
  unitOfMeasureField: string;
  unitOfMeasureSources: string[];
  unitCostField: string;
  unitCostSources: string[];
  applyUnitCostOnlyWhenPositive?: boolean;
}

export interface LineTypeChangeProfile {
  clearFields: string[];
  zeroFields: string[];
  optionFieldMap?: Record<string, LineOption[]>;
  numberOptionFieldKey?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LineMasterService {
  resolveType(rawType: unknown, registry: LineMasterRegistry): string {
    const normalized = this.toText(rawType).trim();
    if (!normalized) {
      return registry.emptyType;
    }

    return registry.aliases?.[normalized] ?? normalized;
  }

  getOptionsForType(type: string, registry: LineMasterRegistry): LineOption[] {
    if (type === registry.emptyType) {
      return [];
    }

    return registry.byType[type]?.options ?? registry.byType[registry.defaultType]?.options ?? [];
  }

  findRecordByNumber(
    type: string,
    number: unknown,
    registry: LineMasterRegistry,
    identifierFields: string[]
  ): Record<string, unknown> | undefined {
    const numberValue = this.toText(number);
    if (!numberValue) {
      return undefined;
    }

    const bucket = registry.byType[type] ?? registry.byType[registry.defaultType];
    if (!bucket) {
      return undefined;
    }

    return bucket.records.find((record) =>
      identifierFields.some((field) => this.toText(record[field]) === numberValue)
    );
  }

  applySelection(row: Record<string, unknown>, master: Record<string, unknown>, strategy: LineSelectionStrategy): number {
    const descriptionField = strategy.descriptionField;
    const descriptionSources = strategy.descriptionSources;
    const unitOfMeasureField = strategy.unitOfMeasureField;
    const unitOfMeasureSources = strategy.unitOfMeasureSources;
    const unitCostField = strategy.unitCostField;
    const unitCostSources = strategy.unitCostSources;

    row[descriptionField] = this.readFirstText(master, descriptionSources) ?? this.toText(row[descriptionField]);
    row[unitOfMeasureField] = this.readFirstText(master, unitOfMeasureSources) ?? this.toText(row[unitOfMeasureField]);

    const unitCost = this.readFirstNumber(master, unitCostSources) ?? 0;
    if (strategy.applyUnitCostOnlyWhenPositive !== false && unitCost <= 0) {
      return 0;
    }

    row[unitCostField] = unitCost;
    return unitCost;
  }

  applyTypeChange(
    row: Record<string, unknown>,
    rawType: unknown,
    registry: LineMasterRegistry,
    profile: LineTypeChangeProfile
  ): string {
    const type = this.resolveType(rawType, registry);
    const clearFields = profile.clearFields;
    const zeroFields = profile.zeroFields;

    for (const field of clearFields) {
      row[field] = '';
    }

    for (const field of zeroFields) {
      row[field] = 0;
    }

    this.assignTypeOptions(row, type, registry, profile.optionFieldMap, profile.numberOptionFieldKey);
    return type;
  }

  assignTypeOptions(
    row: Record<string, unknown>,
    type: string,
    registry: LineMasterRegistry,
    optionFieldMap?: Record<string, LineOption[]>,
    numberOptionFieldKey = '__options_Number'
  ): void {
    row[numberOptionFieldKey] = this.getOptionsForType(type, registry);

    if (!optionFieldMap) {
      return;
    }

    for (const [field, options] of Object.entries(optionFieldMap)) {
      row[field] = options;
    }
  }

  private readFirstText(source: Record<string, unknown>, fields: string[]): string | null {
    for (const field of fields) {
      const value = this.toText(source[field]);
      if (value.length > 0) {
        return value;
      }
    }

    return null;
  }

  private readFirstNumber(source: Record<string, unknown>, fields: string[]): number | null {
    for (const field of fields) {
      const value = this.toNumber(source[field]);
      if (value !== null) {
        return value;
      }
    }

    return null;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(/,/g, '').trim();
      if (!normalized) {
        return null;
      }

      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private toText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }
}
