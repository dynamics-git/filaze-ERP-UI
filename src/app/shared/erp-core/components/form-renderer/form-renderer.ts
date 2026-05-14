import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FieldConfig, FormSectionConfig } from '../../models/field-config.model';

type FieldChangeEvent = {
  fieldKey: string;
  value: unknown;
  previousValue: unknown;
  updates?: Record<string, unknown>;
  previousUpdates?: Record<string, unknown>;
};

type FieldInteractEvent = {
  fieldKey: string;
};

@Component({
  selector: 'erp-form-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-renderer.html',
  styleUrl: './form-renderer.scss'
})
export class FormRendererComponent {
  @Input() sections: FormSectionConfig[] = [];
  @Input() data: Record<string, unknown> = {};
  @Output() fieldChanged = new EventEmitter<FieldChangeEvent>();
  @Output() fieldInteracted = new EventEmitter<FieldInteractEvent>();

  get visibleSections(): FormSectionConfig[] {
    return this.sections.filter((section) => section.fields.some((field) => !field.hidden));
  }

  getFieldValue(field: FieldConfig): string {
    const value = this.data[field.key] ?? field.defaultValue;

    if (value === undefined || value === null) {
      return '';
    }

    return String(value);
  }

  getFieldOptions(field: FieldConfig): Array<{ label: string; value: unknown }> {
    if (field.options?.length) {
      return field.options;
    }

    const sourceKey = field.optionsDataKey;
    if (sourceKey) {
      const source = this.data[sourceKey];
      if (Array.isArray(source)) {
        return source
          .filter((item): item is Record<string, unknown> => this.isRecord(item))
          .map((item) => ({
            label: this.resolveOptionLabel(field, item),
            value: this.resolveOptionValue(field, item)
          }))
          .filter((option) => String(option.value).length > 0);
      }
    }

    const value = this.getFieldValue(field);
    return value ? [{ label: value, value }] : [];
  }

  isOptionSelected(field: FieldConfig, optionValue: unknown): boolean {
    return String(optionValue) === this.getFieldValue(field);
  }

  showEmptyOption(field: FieldConfig): boolean {
    return this.getFieldValue(field).trim().length === 0;
  }

  isWide(field: FieldConfig): boolean {
    return field.width === 'wide';
  }

  updateFieldValue(field: FieldConfig, value: unknown): void {
    const previousValue = this.data[field.key];
    this.data[field.key] = value;
    const updates = this.resolveTargetUpdates(field, value);
    const previousUpdates: Record<string, unknown> = {};

    if (updates) {
      for (const [key, updatedValue] of Object.entries(updates)) {
        previousUpdates[key] = this.data[key];
        this.data[key] = updatedValue;
      }
    }

    this.fieldChanged.emit({
      fieldKey: field.key,
      value,
      previousValue,
      updates,
      previousUpdates: Object.keys(previousUpdates).length ? previousUpdates : undefined
    });
  }

  isFieldDisabled(field: FieldConfig): boolean {
    return field.disabled === true || field.readonly === true;
  }

  notifyFieldInteracted(field: FieldConfig): void {
    if (this.isFieldDisabled(field)) {
      return;
    }

    this.fieldInteracted.emit({ fieldKey: field.key });
  }

  private resolveOptionValue(field: FieldConfig, item: Record<string, unknown>): unknown {
    const bindValue = field.bindValue;
    if (bindValue && bindValue in item) {
      return item[bindValue];
    }

    return item['value'] ?? item['id'] ?? item['code'] ?? '';
  }

  private resolveOptionLabel(field: FieldConfig, item: Record<string, unknown>): string {
    if (field.displayFormat) {
      return field.displayFormat.replace(/\[([^\]]+)\]/g, (_match, key: string) => this.toText(item[key]));
    }

    const bindLabel = field.bindLabel;
    if (bindLabel && bindLabel in item) {
      return this.toText(item[bindLabel]);
    }

    return this.toText(item['label'] ?? item['name'] ?? item['description'] ?? item['value']);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }

  resolveSelectValue(field: FieldConfig, rawValue: string): unknown {
    const options = this.getFieldOptions(field);
    const matched = options.find((option) => String(option.value) === rawValue);
    if (matched) {
      return matched.value;
    }

    return this.coerceInputValue(field, rawValue);
  }

  coerceInputValue(field: FieldConfig, rawValue: string): unknown {
    switch (field.valueType) {
      case 'number': {
        const normalized = rawValue.replace(/,/g, '').trim();
        if (!normalized.length) {
          return '';
        }

        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : rawValue;
      }
      case 'boolean': {
        const normalized = rawValue.trim().toLowerCase();
        if (!normalized.length) {
          return false;
        }

        return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
      }
      default:
        return rawValue;
    }
  }

  private resolveTargetUpdates(field: FieldConfig, value: unknown): Record<string, unknown> | undefined {
    if (!field.targets?.length) {
      return undefined;
    }

    const optionRecord = this.findOptionRecord(field, value);
    const updates: Record<string, unknown> = {};

    for (const target of field.targets) {
      if (!optionRecord) {
        if (target.clearOnEmpty) {
          updates[target.key] = '';
        }
        continue;
      }

      const sources = [target.source, ...(target.fallbackSources ?? [])];
      let resolved: unknown = '';
      for (const source of sources) {
        const candidate = optionRecord[source];
        if (candidate !== null && candidate !== undefined && String(candidate).length) {
          resolved = candidate;
          break;
        }
      }

      if ((resolved !== null && resolved !== undefined && String(resolved).length) || target.clearOnEmpty) {
        updates[target.key] = resolved;
      }
    }

    return Object.keys(updates).length ? updates : undefined;
  }

  private findOptionRecord(field: FieldConfig, value: unknown): Record<string, unknown> | undefined {
    const sourceKey = field.optionsDataKey;
    if (!sourceKey) {
      return undefined;
    }

    const source = this.data[sourceKey];
    if (!Array.isArray(source)) {
      return undefined;
    }

    return source
      .filter((item): item is Record<string, unknown> => this.isRecord(item))
      .find((item) => this.toText(this.resolveOptionValue(field, item)) === this.toText(value));
  }
}
