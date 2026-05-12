import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { ErpFormRendererComponent } from '../../shared/erp-core/components/form-renderer/form-renderer';
import { ErpFactPanelRendererComponent } from '../../shared/erp-core/components/fact-panel-renderer/fact-panel-renderer';
import { ErpLineRendererComponent } from '../../shared/erp-core/components/line-renderer/line-renderer';
import { ErpLineColumnConfig } from '../../shared/erp-core/models/line-config.model';
import {
  ErpEntryAttachmentsConfig,
  ErpEntryCommandButtonConfig,
  ErpEntryDialogType,
  ErpEntryHeaderSectionConfig,
  ErpEntryLineTotalsConfig,
  ErpEntryStatusMessage,
  ErpFactPanelSectionConfig
} from '../../shared/erp-core/models/entry-dialog-config.model';

export type EntryDialog = ErpEntryDialogType;
export type EntryDialogActionEvent = { actionKey: string; payload?: unknown };

@Component({
  selector: 'app-entry-dialog',
  standalone: true,
  imports: [ErpFormRendererComponent, ErpLineRendererComponent, ErpFactPanelRendererComponent],
  templateUrl: './entry-dialog.html',
  styleUrl: './entry-dialog.scss'
})
export class EntryDialogComponent implements OnChanges {
  @Input() overlayZIndex = 21;
  @Input() pageLabel = 'New';
  @Input() title = 'Account journal';
  @Input() subtitle = 'General ledger · Cronus International Ltd.';
  @Input() popupHeaderToolbarButtons?: ErpEntryCommandButtonConfig[];
  @Input() popupLineToolbarButtons?: ErpEntryCommandButtonConfig[];
  @Input() popupDetailToolbarButtons?: ErpEntryCommandButtonConfig[];
  @Input() popupHeaderSections?: ErpEntryHeaderSectionConfig[];
  @Input() popupHeaderData?: Record<string, unknown>;
  @Input() popupLineColumns?: ErpLineColumnConfig[];
  @Input() popupLineRows?: Record<string, unknown>[];
  @Input() popupLineTotals?: ErpEntryLineTotalsConfig;
  @Input() popupAttachments?: ErpEntryAttachmentsConfig;
  @Input() popupFactPanelSections?: ErpFactPanelSectionConfig[];
  @Input() popupStatusMessage?: ErpEntryStatusMessage;
  @Output() closed = new EventEmitter<void>();
  @Output() action = new EventEmitter<EntryDialogActionEvent>();

  entryMaximized = false;
  activeEntryDialog: EntryDialog | null = null;
  private transientStatusMessage?: ErpEntryStatusMessage;

  private readonly emptyAttachments: ErpEntryAttachmentsConfig = {
    headerFilesCount: 0,
    lineFilesCount: 0,
    canUpload: false,
    primaryActionLabel: '',
    primaryActionKey: ''
  };

  private readonly emptyLineTotals: ErpEntryLineTotalsConfig = {
    subtotal: '',
    sst: '',
    total: '',
    difference: ''
  };

  get resolvedHeaderSections(): ErpEntryHeaderSectionConfig[] {
    return this.popupHeaderSections ?? [];
  }

  get resolvedHeaderToolbarButtons(): ErpEntryCommandButtonConfig[] {
    return this.popupHeaderToolbarButtons ?? [];
  }

  get resolvedLineToolbarButtons(): ErpEntryCommandButtonConfig[] {
    return this.popupLineToolbarButtons ?? [];
  }

  get resolvedDetailToolbarButtons(): ErpEntryCommandButtonConfig[] {
    return this.popupDetailToolbarButtons ?? [];
  }

  get resolvedHeaderData(): Record<string, unknown> {
    return this.popupHeaderData ?? {};
  }

  get resolvedLineColumns(): ErpLineColumnConfig[] {
    return this.popupLineColumns ?? [];
  }

  get resolvedLineRows(): Record<string, unknown>[] {
    return this.popupLineRows ?? [];
  }

  get resolvedLineTotals(): ErpEntryLineTotalsConfig {
    return this.popupLineTotals ?? this.emptyLineTotals;
  }

  get resolvedAttachments(): ErpEntryAttachmentsConfig {
    return this.popupAttachments ?? this.emptyAttachments;
  }

  get resolvedFactPanelSections(): ErpFactPanelSectionConfig[] {
    return this.popupFactPanelSections ?? [];
  }

  get resolvedStatusMessage(): ErpEntryStatusMessage | undefined {
    return this.popupStatusMessage ?? this.transientStatusMessage;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('popupStatusMessage' in changes && this.popupStatusMessage) {
      this.transientStatusMessage = undefined;
    }
  }

  toggleEntrySize(): void {
    this.entryMaximized = !this.entryMaximized;
  }

  openEntryDialog(dialog: EntryDialog): void {
    this.activeEntryDialog = dialog;
  }

  handleLineAction(event: { actionKey: string; row: Record<string, unknown> }): void {
    this.routeAction(event.actionKey);
  }

  handleLineRowChanged(event: { row: Record<string, unknown>; column: ErpLineColumnConfig; value: unknown }): void {
    this.markSavingState();
    this.action.emit({ actionKey: 'line:changed', payload: event });
    this.recalculateLineTotals();
    this.action.emit({ actionKey: 'cmd:autosave', payload: event });
  }

  handleHeaderFieldChanged(event: { fieldKey: string; value: string; updates?: Record<string, string> }): void {
    this.markSavingState();
    this.action.emit({ actionKey: 'header:changed', payload: event });
    this.action.emit({ actionKey: 'cmd:autosave', payload: event });
  }

  handleHeaderFieldInteracted(event: { fieldKey: string }): void {
    this.action.emit({ actionKey: 'header:interacted', payload: event });
  }

  handleFactPanelAction(actionKey: string): void {
    this.routeAction(actionKey);
  }

  handleEntryCommandAction(actionKey: string): void {
    this.routeAction(actionKey);
  }

  handleLineToolbarAction(actionKey: string): void {
    this.routeAction(actionKey);
  }

  handleNestedCommandAction(actionKey: string): void {
    this.routeAction(actionKey);
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

  get detailMessage(): string {
    switch (this.activeEntryDialog) {
      case 'header':
        return 'Header detail content is owned by the page configuration.';
      case 'dimensions':
        return 'Dimension detail content is owned by the page configuration.';
      case 'attachments':
        return 'Attachment detail content is owned by the page configuration.';
      case 'line':
        return 'Line detail content is owned by the page configuration.';
      case 'posting':
        return 'Posting preview content is owned by the page configuration.';
      default:
        return 'No detail dialog selected.';
    }
  }

  private routeAction(rawActionKey: string): void {
    const actionKey = this.normalizeActionKey(rawActionKey);

    if (actionKey.startsWith('dialog:')) {
      this.handleDialogAction(actionKey.slice('dialog:'.length));
      return;
    }

    if (actionKey.startsWith('popup:')) {
      this.action.emit({ actionKey });
      return;
    }

    if (actionKey.startsWith('cmd:')) {
      this.handleCommandAction(actionKey.slice('cmd:'.length));
    }
  }

  private handleDialogAction(dialog: string): void {
    if (dialog === 'header' || dialog === 'dimensions' || dialog === 'attachments' || dialog === 'line' || dialog === 'posting') {
      this.openEntryDialog(dialog);
    }
  }

  private handleCommandAction(command: string): void {
    if (command === 'close') {
      this.closeEntryDialog();
      return;
    }

    this.action.emit({ actionKey: `cmd:${command}` });
  }

  private normalizeActionKey(actionKey: string): string {
    switch (actionKey) {
      case 'attachments':
        return 'dialog:attachments';
      case 'line':
        return 'dialog:line';
      case 'header':
        return 'dialog:header';
      case 'posting':
      case 'post':
        return 'dialog:posting';
      case 'dimensions':
        return 'dialog:dimensions';
      case 'more':
        return 'popup:clone';
      case 'close':
        return 'cmd:close';
      case 'save':
      case 'validate':
      case 'release':
      case 'apply':
      case 'clear':
      case 'template':
      case 'line-new':
      case 'line-insert':
      case 'autosave':
        return `cmd:${actionKey}`;
      default:
        return actionKey;
    }
  }

  private markSavingState(): void {
    this.transientStatusMessage = {
      tone: 'info',
      title: 'Saving',
      message: 'Saving changes...'
    };
  }

  private recalculateLineTotals(): void {
    const rows = this.popupLineRows;
    const totals = this.popupLineTotals;
    if (!rows || !totals) {
      return;
    }

    const subtotal = rows.reduce((sum, row) => sum + this.parseNumber(row['LineAmount']), 0);
    const amountToInvoice = rows.reduce((sum, row) => sum + this.parseNumber(row['AmountToInvoice']), 0);
    const amountInvoiced = rows.reduce((sum, row) => sum + this.parseNumber(row['AmountInvoiced']), 0);

    totals.subtotal = this.formatCurrency(subtotal);
    totals.total = this.formatCurrency(amountToInvoice);
    totals.difference = this.formatCurrency(amountToInvoice - amountInvoiced);
  }

  private parseNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value.replace(/,/g, '').trim());
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private formatCurrency(value: number): string {
    const currencyCode = this.toText(this.popupHeaderData?.['CurrencyCode']).trim();
    const amount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

    return currencyCode ? `${currencyCode} ${amount}` : amount;
  }

  private toText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }

  // Popup stacking is handled by popup-host; entry-dialog only emits actions.
}
