import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ErpFieldConfig, ErpFormSectionConfig } from '../../models/field-config.model';

@Component({
  selector: 'erp-form-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-renderer.html',
  styleUrl: './form-renderer.scss'
})
export class ErpFormRendererComponent {
  @Input() sections: ErpFormSectionConfig[] = [];
  @Input() data: Record<string, unknown> = {};

  get visibleSections(): ErpFormSectionConfig[] {
    return this.sections.filter((section) => section.fields.some((field) => !field.hidden));
  }

  getFieldValue(field: ErpFieldConfig): string {
    const value = this.data[field.key] ?? field.defaultValue;

    if (value === undefined || value === null) {
      return '';
    }

    return String(value);
  }

  getFieldOptions(field: ErpFieldConfig): Array<{ label: string; value: unknown }> {
    if (field.options?.length) {
      return field.options;
    }

    const value = this.getFieldValue(field);
    return value ? [{ label: value, value }] : [];
  }

  isOptionSelected(field: ErpFieldConfig, optionValue: unknown): boolean {
    return String(optionValue) === this.getFieldValue(field);
  }

  isWide(field: ErpFieldConfig): boolean {
    return field.width === 'wide';
  }
}