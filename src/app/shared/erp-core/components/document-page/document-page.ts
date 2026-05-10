import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ErpCommandBarComponent } from '../command-bar/command-bar';
import { ErpDataSurfaceComponent } from '../data-surface/data-surface';
import { ErpFactboxHostComponent } from '../factbox-host/factbox-host';
import { ErpPopupHostComponent } from '../popup-host/popup-host';
import { ErpCommandConfig, ErpStandardCommandConfig } from '../../models/command-config.model';
import { ErpDataSurfaceConfig } from '../../models/data-surface-config.model';
import { ErpDocumentPageConfig } from '../../models/document-page-config.model';
import { ErpHeaderFieldConfig, ErpHeaderSectionConfig } from '../../models/header-config.model';

@Component({
  selector: 'erp-document-page',
  standalone: true,
  imports: [
    ErpCommandBarComponent,
    ErpDataSurfaceComponent,
    ErpFactboxHostComponent,
    ErpPopupHostComponent
  ],
  templateUrl: './document-page.html',
  styleUrl: './document-page.scss'
})
export class ErpDocumentPageComponent {
  @Input() config?: ErpDocumentPageConfig;
  @Input() headerData?: unknown;
  @Input() lineData: unknown[] = [];
  @Output() command = new EventEmitter<{ actionKey: string; payload?: unknown }>();

  selectedRecord?: unknown;

  readonly standardActions: ErpStandardCommandConfig = {
    new: true,
    delete: true,
    refresh: true
  };

  get commands(): ErpCommandConfig[] {
    return this.config?.commands ?? [];
  }

  get headerSections(): ErpHeaderSectionConfig[] {
    return this.config?.header?.sections ?? [];
  }

  get lineSurfaceConfig(): ErpDataSurfaceConfig | undefined {
    if (!this.config?.lines) {
      return undefined;
    }

    return {
      id: `${this.config.title}-lines`,
      mode: 'table',
      idField: this.config.lines.lineKeyField,
      columns: this.config.lines.columns,
      selectable: this.config.lines.selectable
    };
  }

  get factboxContext(): Record<string, unknown> {
    return {
      ...this.toRecord(this.headerData),
      ...this.toRecord(this.selectedRecord)
    };
  }

  emitCommand(event: { actionKey: string; payload?: unknown }): void {
    this.command.emit(event);
  }

  selectLine(row: unknown): void {
    this.selectedRecord = row;
  }

  getHeaderValue(field: ErpHeaderFieldConfig): string {
    const value = this.readValue(this.headerData, field.field ?? field.id);

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return String(value);
  }

  private readValue(source: unknown, path: string): unknown {
    if (!this.isRecord(source)) {
      return undefined;
    }

    return path.split('.').reduce<unknown>((value, key) => {
      if (!this.isRecord(value)) {
        return undefined;
      }

      return value[key];
    }, source);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toRecord(value: unknown): Record<string, unknown> {
    return this.isRecord(value) ? value : {};
  }
}
