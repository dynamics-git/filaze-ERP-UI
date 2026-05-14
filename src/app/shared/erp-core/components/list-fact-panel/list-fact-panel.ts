import { Component, Input } from '@angular/core';
import { ListPageColumnConfig, ListPageConfig } from '../../models/page-config.model';

type DisplayColumn = ListPageColumnConfig & {
  primary?: boolean;
  sortable?: boolean;
  filterable?: boolean;
};

@Component({
  selector: 'erp-list-fact-panel',
  standalone: true,
  imports: [],
  templateUrl: './list-fact-panel.html',
  styleUrl: './list-fact-panel.scss'
})
export class ListFactPanelComponent {
  @Input() config?: ListPageConfig;
  @Input() selectedRow?: unknown;

  collapsed = false;

  get label(): string {
    const factPanel = this.config?.factPanel ?? this.config?.factbox;
    const configured = this.toText(factPanel?.label).trim();
    if (configured.length && !this.isGenericLabel(configured)) {
      return configured;
    }

    const labelField = factPanel?.binding?.labelField;
    const labelFallbackFields = factPanel?.binding?.labelFallbackFields ?? [];

    const rowLabel = this.toText(
      (labelField ? this.read(this.selectedRow, labelField) : undefined)
      ?? this.readFirst(this.selectedRow, labelFallbackFields)
    ).trim();
    if (rowLabel.length) {
      return rowLabel;
    }

    return 'Record';
  }

  get title(): string {
    const factPanel = this.config?.factPanel ?? this.config?.factbox;
    const titleField = factPanel?.binding?.titleField;
    const fallbackFields = factPanel?.binding?.titleFallbackFields?.length
      ? factPanel.binding.titleFallbackFields
      : [];

    return String(
      (titleField ? this.read(this.selectedRow, titleField) : undefined) ??
      this.readFirst(this.selectedRow, fallbackFields) ??
      factPanel?.title ??
      this.config?.title ??
      ''
    );
  }

  get subtitle(): string {
    const factPanel = this.config?.factPanel ?? this.config?.factbox;
    const configured = this.toText(factPanel?.subtitle).trim();
    if (configured.length && !this.isGenericSubtitle(configured)) {
      return configured;
    }

    const subtitleField = factPanel?.binding?.subtitleField;
    const subtitleFallbackFields = factPanel?.binding?.subtitleFallbackFields ?? [];

    const rowSubtitle = this.toText(
      (subtitleField ? this.read(this.selectedRow, subtitleField) : undefined)
      ?? this.readFirst(this.selectedRow, subtitleFallbackFields)
    ).trim();
    if (rowSubtitle.length) {
      return rowSubtitle;
    }

    const module = this.toText(this.config?.module).trim();
    if (module.length) {
      return module;
    }

    return configured;
  }

  get summaryValue(): string {
    const factPanel = this.config?.factPanel ?? this.config?.factbox;
    const summaryField = factPanel?.binding?.summaryField;
    const fallbackFields = factPanel?.binding?.summaryFallbackFields?.length
      ? factPanel.binding.summaryFallbackFields
      : [];

    const summaryValue = (summaryField ? this.read(this.selectedRow, summaryField) : undefined)
      ?? this.readFirst(this.selectedRow, fallbackFields)
      ?? '';

    return this.formatValue(
      summaryValue,
      { id: 'summary', label: 'Summary', type: factPanel?.binding?.summaryType }
    );
  }

  get sections(): Array<{ title: string; fields: Array<{ label: string; field?: string }> }> {
    const factPanel = this.config?.factPanel ?? this.config?.factbox;
    if (factPanel?.sections?.length) {
      return factPanel.sections.map((section) => ({
        title: section.title,
        fields: section.fields ?? []
      }));
    }

    return [];
  }

  get status(): string {
    const behavior = this.config?.behavior;

    const candidates: string[] = [];
    if (behavior?.statusField) {
      candidates.push(behavior.statusField);
    }

    if (Array.isArray(behavior?.statusFallbackFields) && behavior.statusFallbackFields.length) {
      candidates.push(...behavior.statusFallbackFields);
    }

    return String(this.readFirst(this.selectedRow, candidates) ?? behavior?.statusDefault ?? '');
  }

  get tone(): string {
    const behavior = this.config?.behavior;

    const candidates: string[] = [];
    if (behavior?.toneField) {
      candidates.push(behavior.toneField);
    }

    if (Array.isArray(behavior?.toneFallbackFields) && behavior.toneFallbackFields.length) {
      candidates.push(...behavior.toneFallbackFields);
    }

    return String(this.readFirst(this.selectedRow, candidates) ?? behavior?.toneDefault ?? '');
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }

  getFieldValue(field: { label: string; field?: string }): string {
    if (field.field) {
      return this.formatValue(this.read(this.selectedRow, field.field), { id: field.field, label: field.label });
    }

    return '';
  }

  private read(target: unknown, path: string): unknown {
    if (!target || !path) {
      return undefined;
    }

    const source = this.toRecord(target);
    if (!source) {
      return undefined;
    }

    if (path in source) {
      return source[path];
    }

    const lowerPath = path.toLowerCase();
    const directMatch = Object.keys(source).find((key) => key.toLowerCase() === lowerPath);
    if (directMatch) {
      return source[directMatch];
    }

    if (!path.includes('.')) {
      return undefined;
    }

    return path.split('.').reduce<unknown>((value, key) => {
      const next = this.toRecord(value);
      if (!next) {
        return undefined;
      }

      if (key in next) {
        return next[key];
      }

      const lowerKey = key.toLowerCase();
      const nestedMatch = Object.keys(next).find((candidate) => candidate.toLowerCase() === lowerKey);
      return nestedMatch ? next[nestedMatch] : undefined;
    }, source);
  }

  private readFirst(target: unknown, paths: string[]): unknown {
    for (const path of paths) {
      const value = this.read(target, path);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }

    return undefined;
  }

  private formatValue(value: unknown, column: { type?: string; id?: string; label?: string; currencyCode?: string }): string {
    if (value === undefined || value === null || value === '') {
      return '';
    }

    if (column.type === 'date' && typeof value === 'string') {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }).format(date);
      }
    }

    if ((column.type === 'number' || column.type === 'currency') && (typeof value === 'number' || typeof value === 'string')) {
      const numeric = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
      if (!Number.isNaN(numeric)) {
        const formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(numeric);

        if (column.type === 'currency') {
          const code = this.toText(column.currencyCode).trim();
          return code ? `${code} ${formatted}` : formatted;
        }

        return formatted;
      }
    }

    return String(value);
  }

  private isGenericSubtitle(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized === 'document factbox'
      || normalized === 'factbox'
      || normalized === 'list fact panel';
  }

  private isGenericLabel(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized === 'list fact panel'
      || normalized === 'fact panel'
      || normalized === 'factbox';
  }

  private toRecord(value: unknown): Record<string, unknown> | undefined {
    if (typeof value === 'object' && value !== null) {
      return value as Record<string, unknown>;
    }

    return undefined;
  }

  private toText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }
}
