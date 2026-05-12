import { Injectable } from '@angular/core';

export interface ErpLineOption {
  label: string;
  value: string;
}

export interface ErpLineMasterBucket {
  options: ErpLineOption[];
  records: Record<string, unknown>[];
}

export interface ErpLineMasterRegistry {
  defaultType: string;
  emptyType: string;
  byType: Record<string, ErpLineMasterBucket>;
  aliases?: Record<string, string>;
}

export interface ErpLineSelectionStrategy {
  descriptionField?: string;
  descriptionSources?: string[];
  unitOfMeasureField?: string;
  unitOfMeasureSources?: string[];
  unitCostField?: string;
  unitCostSources?: string[];
  applyUnitCostOnlyWhenPositive?: boolean;
  formatNumber?: (value: number) => string;
}

export interface ErpLineTypeChangeProfile {
  clearFields?: string[];
  zeroFields?: string[];
  optionFieldMap?: Record<string, ErpLineOption[]>;
  numberOptionFieldKey?: string;
  formatNumber?: (value: number) => string;
}

@Injectable({
  providedIn: 'root'
})
export class LineMasterService {
  resolveType(rawType: unknown, registry: ErpLineMasterRegistry): string {
    const normalized = this.toText(rawType).trim();
    if (!normalized || normalized === 'Comment') {
      return registry.emptyType;
    }

    return registry.aliases?.[normalized] ?? normalized;
  }

  getOptionsForType(type: string, registry: ErpLineMasterRegistry): ErpLineOption[] {
    if (type === registry.emptyType) {
      return [];
    }

    return registry.byType[type]?.options ?? registry.byType[registry.defaultType]?.options ?? [];
  }

  findRecordByNumber(
    type: string,
    number: unknown,
    registry: ErpLineMasterRegistry,
    identifierFields: string[] = ['No', 'Number', 'Code']
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

  applySelection(row: Record<string, unknown>, master: Record<string, unknown>, strategy: ErpLineSelectionStrategy = {}): number {
    const descriptionField = strategy.descriptionField ?? 'Description';
    const descriptionSources = strategy.descriptionSources ?? ['Description', 'Name'];
    const unitOfMeasureField = strategy.unitOfMeasureField ?? 'UnitOfMeasure';
    const unitOfMeasureSources = strategy.unitOfMeasureSources ?? ['BaseUnitOfMeasure', 'UnitOfMeasureCode'];
    const unitCostField = strategy.unitCostField ?? 'DirectUnitCost';
    const unitCostSources = strategy.unitCostSources ?? ['DirectUnitCost', 'UnitCost', 'UnitPrice'];

    row[descriptionField] = this.readFirstText(master, descriptionSources) ?? this.toText(row[descriptionField]);
    row[unitOfMeasureField] = this.readFirstText(master, unitOfMeasureSources) ?? this.toText(row[unitOfMeasureField]);

    const unitCost = this.readFirstNumber(master, unitCostSources) ?? 0;
    if (strategy.applyUnitCostOnlyWhenPositive !== false && unitCost <= 0) {
      return 0;
    }

    row[unitCostField] = strategy.formatNumber ? strategy.formatNumber(unitCost) : String(unitCost);
    return unitCost;
  }

  applyTypeChange(
    row: Record<string, unknown>,
    rawType: unknown,
    registry: ErpLineMasterRegistry,
    profile: ErpLineTypeChangeProfile = {}
  ): string {
    const type = this.resolveType(rawType, registry);
    const clearFields = profile.clearFields ?? ['Number', 'Description', 'UnitOfMeasure'];
    const zeroFields = profile.zeroFields ?? [];
    const formatNumber = profile.formatNumber ?? ((value: number) => String(value));

    for (const field of clearFields) {
      row[field] = '';
    }

    for (const field of zeroFields) {
      row[field] = formatNumber(0);
    }

    this.assignTypeOptions(row, type, registry, profile.optionFieldMap, profile.numberOptionFieldKey);
    return type;
  }

  assignTypeOptions(
    row: Record<string, unknown>,
    type: string,
    registry: ErpLineMasterRegistry,
    optionFieldMap?: Record<string, ErpLineOption[]>,
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
