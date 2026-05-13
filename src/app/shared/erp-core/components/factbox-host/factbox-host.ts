import { Component, Input } from '@angular/core';
import {
  FactboxBadgeConfig,
  FactboxConfig,
  FactboxFieldConfig
} from '../../models/factbox-config.model';

@Component({
  selector: 'erp-factbox-host',
  standalone: true,
  templateUrl: './factbox-host.html',
  styleUrl: './factbox-host.scss'
})
export class FactboxHostComponent {
  @Input() config?: FactboxConfig;
  @Input() selectedRecord?: unknown;

  get isEnabled(): boolean {
    return this.config?.enabled !== false;
  }

  get hasSections(): boolean {
    return !!this.config?.sections.length;
  }

  getValue(field: FactboxFieldConfig | FactboxBadgeConfig): string {
    const rawValue = this.readValue(field.field ?? field.id);

    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return '-';
    }

    return String(rawValue);
  }

  getBadgeLabel(badge: FactboxBadgeConfig): string {
    return badge.label ?? this.getValue(badge);
  }

  private readValue(path: string): unknown {
    if (!this.isRecord(this.selectedRecord)) {
      return undefined;
    }

    return path.split('.').reduce<unknown>((value, key) => {
      if (!this.isRecord(value)) {
        return undefined;
      }

      return value[key];
    }, this.selectedRecord);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
