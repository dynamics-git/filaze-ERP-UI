import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ErpFormRendererComponent } from '../../shared/erp-core/components/form-renderer/form-renderer';
import { ErpLineRendererComponent } from '../../shared/erp-core/components/line-renderer/line-renderer';
import { ErpLineColumnConfig } from '../../shared/erp-core/models/line-config.model';
import {
  ErpEntryDialogType,
  ErpEntryHeaderSectionConfig,
  ErpEntryLineTotalsConfig
} from '../../shared/erp-core/models/entry-dialog-config.model';
import {
  DEFAULT_ENTRY_HEADER_DATA,
  DEFAULT_ENTRY_HEADER_SECTIONS,
  DEFAULT_ENTRY_LINE_COLUMNS,
  DEFAULT_ENTRY_LINE_ROWS,
  DEFAULT_ENTRY_LINE_TOTALS
} from './entry-dialog.defaults';

export type EntryDialog = ErpEntryDialogType;

@Component({
  selector: 'app-entry-dialog',
  standalone: true,
  imports: [ErpFormRendererComponent, ErpLineRendererComponent],
  templateUrl: './entry-dialog.html',
  styleUrl: './entry-dialog.scss'
})
export class EntryDialogComponent {
  @Input() pageLabel = 'New';
  @Input() title = 'Account journal';
  @Input() subtitle = 'General ledger · Cronus International Ltd.';
  @Input() popupHeaderSections?: ErpEntryHeaderSectionConfig[];
  @Input() popupHeaderData?: Record<string, unknown>;
  @Input() popupLineColumns?: ErpLineColumnConfig[];
  @Input() popupLineRows?: Record<string, unknown>[];
  @Input() popupLineTotals?: ErpEntryLineTotalsConfig;
  @Output() closed = new EventEmitter<void>();

  entryMaximized = false;
  activeEntryDialog: EntryDialog | null = null;

  get resolvedHeaderSections(): ErpEntryHeaderSectionConfig[] {
    return this.popupHeaderSections?.length ? this.popupHeaderSections : DEFAULT_ENTRY_HEADER_SECTIONS;
  }

  get resolvedHeaderData(): Record<string, unknown> {
    return this.popupHeaderData ?? DEFAULT_ENTRY_HEADER_DATA;
  }

  get resolvedLineColumns(): ErpLineColumnConfig[] {
    return this.popupLineColumns?.length ? this.popupLineColumns : DEFAULT_ENTRY_LINE_COLUMNS;
  }

  get resolvedLineRows(): Record<string, unknown>[] {
    return this.popupLineRows?.length ? this.popupLineRows : DEFAULT_ENTRY_LINE_ROWS;
  }

  get resolvedLineTotals(): ErpEntryLineTotalsConfig {
    return this.popupLineTotals ?? DEFAULT_ENTRY_LINE_TOTALS;
  }

  toggleEntrySize(): void {
    this.entryMaximized = !this.entryMaximized;
  }

  openEntryDialog(dialog: EntryDialog): void {
    this.activeEntryDialog = dialog;
  }

  handleLineAction(event: { actionKey: string; row: Record<string, unknown> }): void {
    if (event.actionKey === 'attachments') {
      this.openEntryDialog('attachments');
    }
  }

  closeEntryDialog(): void {
    this.activeEntryDialog = null;
  }

  get detailTitle(): string {
    switch (this.activeEntryDialog) {
      case 'header':
        return 'Header details';
      case 'dimensions':
        return 'Line dimensions';
      case 'attachments':
        return 'Attachments';
      case 'line':
        return 'Line details';
      case 'posting':
        return 'Posting preview';
      default:
        return '';
    }
  }
}
