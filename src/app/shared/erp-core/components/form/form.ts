import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ErpFieldConfig } from '../../models/field-config.model';

@Component({
  selector: 'erp-form',
  standalone: true,
  templateUrl: './form.html',
  styleUrl: './form.scss'
})
export class ErpFormComponent {
  @Input() fields: ErpFieldConfig[] = [];
  @Input() value?: Record<string, unknown>;
  @Input() readonly = false;
  @Output() valueChange = new EventEmitter<Record<string, unknown>>();
  @Output() fieldChange = new EventEmitter<{ key: string; value: unknown }>();

  get visibleFields(): ErpFieldConfig[] {
    return this.fields.filter((field) => !field.hidden);
  }

  getFieldValue(field: ErpFieldConfig): unknown {
    return this.value?.[field.key] ?? field.defaultValue ?? '';
  }

  isReadonly(field: ErpFieldConfig): boolean {
    return this.readonly || field.readonly === true;
  }

  updateField(field: ErpFieldConfig, value: unknown): void {
    if (this.isReadonly(field)) {
      return;
    }

    const nextValue = {
      ...(this.value ?? {}),
      [field.key]: value
    };

    this.fieldChange.emit({ key: field.key, value });
    this.valueChange.emit(nextValue);
  }

  updateFromEvent(field: ErpFieldConfig, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;

    if (!target) {
      return;
    }

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      this.updateField(field, target.checked);
      return;
    }

    this.updateField(field, target.value);
  }
}
