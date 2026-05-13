import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormRendererComponent } from '../../shared/erp-core/components/form-renderer/form-renderer';
import { FactPanelRendererComponent } from '../../shared/erp-core/components/fact-panel-renderer/fact-panel-renderer';
import { LineRendererComponent } from '../../shared/erp-core/components/line-renderer/line-renderer';
import { LineColumnConfig } from '../../shared/erp-core/models/line-config.model';
import {
  EntryAttachmentsConfig,
  EntryCommandBarConfig,
  EntryCommandButtonConfig,
  EntryLineCommandPolicyConfig,
  EntryLinePlacementConfig,
  EntryDialogType,
  EntryHeaderSectionConfig,
  EntryLineTotalsConfig,
  EntryStatusMessage,
  FactPanelSectionConfig
} from '../../shared/erp-core/models/entry-dialog-config.model';

export type EntryDialog = EntryDialogType;
export type EntryDialogActionEvent = { actionKey: string; payload?: unknown };
type EntryCommandGroup = { name: string; buttons: EntryCommandButtonConfig[] };

@Component({
  selector: 'app-entry-dialog',
  standalone: true,
  imports: [FormRendererComponent, LineRendererComponent, FactPanelRendererComponent, NgTemplateOutlet],
  templateUrl: './entry-dialog.html',
  styleUrl: './entry-dialog.scss'
})
export class EntryDialogComponent implements OnChanges {
  private static readonly GLOBAL_LINE_PRIMARY_COMMANDS = new Set(['cmd:line-new', 'line-new', 'cmd:line-delete', 'line-delete']);

  private readonly hostElement = inject(ElementRef<HTMLElement>);
  @Input() overlayZIndex = 21;
  @Input() pageLabel?: string;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() popupHeaderCommandBar?: EntryCommandBarConfig;
  @Input() popupLineCommandBar?: EntryCommandBarConfig;
  @Input() popupLineCommandPolicy?: EntryLineCommandPolicyConfig;
  @Input() popupLinePlacement?: EntryLinePlacementConfig;
  @Input() popupHeaderToolbarButtons?: EntryCommandButtonConfig[];
  @Input() popupLineToolbarButtons?: EntryCommandButtonConfig[];
  @Input() popupDetailToolbarButtons?: EntryCommandButtonConfig[];
  @Input() popupHeaderSections?: EntryHeaderSectionConfig[];
  @Input() popupHeaderData?: Record<string, unknown>;
  @Input() popupLineColumns?: LineColumnConfig[];
  @Input() popupLineRows?: Record<string, unknown>[];
  @Input() popupLineTotals?: EntryLineTotalsConfig;
  @Input() popupAttachments?: EntryAttachmentsConfig;
  @Input() popupFactPanelSections?: FactPanelSectionConfig[];
  @Input() popupStatusMessage?: EntryStatusMessage;
  @Output() closed = new EventEmitter<void>();
  @Output() action = new EventEmitter<EntryDialogActionEvent>();

  entryMaximized = false;
  activeEntryDialog: EntryDialog | null = null;
  private transientStatusMessage?: EntryStatusMessage;
  private selectedLineIndexes: number[] = [];

  private readonly emptyAttachments: EntryAttachmentsConfig = {
    headerFilesCount: 0,
    lineFilesCount: 0,
    canUpload: false,
    primaryActionLabel: '',
    primaryActionKey: ''
  };

  private readonly emptyLineTotals: EntryLineTotalsConfig = {
    subtotal: '',
    sst: '',
    total: '',
    difference: ''
  };

  get resolvedHeaderSections(): EntryHeaderSectionConfig[] {
    return this.popupHeaderSections ?? [];
  }

  get resolvedHeaderToolbarButtons(): EntryCommandButtonConfig[] {
    return this.popupHeaderToolbarButtons ?? [];
  }

  get resolvedPrimaryHeaderToolbarButtons(): EntryCommandButtonConfig[] {
    const sorted = this.getSortedHeaderToolbarButtons();
    const primary = sorted.filter((button) => button.isPrimary === true);
    const limit = this.resolvePrimaryActionsLimit(primary.length);
    return primary.slice(0, limit);
  }

  get resolvedGroupedHeaderToolbarButtons(): EntryCommandGroup[] {
    const sorted = this.getSortedHeaderToolbarButtons();
    const primaryKeys = new Set(this.resolvedPrimaryHeaderToolbarButtons.map((button) => this.toButtonKey(button)));
    const menuButtons = sorted.filter((button) => !primaryKeys.has(this.toButtonKey(button)));
    if (!menuButtons.length) {
      return [];
    }

    const grouped = new Map<string, EntryCommandButtonConfig[]>();
    const order: string[] = [];

    for (const button of menuButtons) {
      const groupName = this.toText(button.group).trim() || 'General';
      if (!grouped.has(groupName)) {
        grouped.set(groupName, []);
        order.push(groupName);
      }

      grouped.get(groupName)?.push(button);
    }

    const visibleGroups = this.resolveVisibleGroupLimit(order.length);
    const visibleNames = order.slice(0, visibleGroups);
    const hiddenNames = order.slice(visibleGroups);
    const result: EntryCommandGroup[] = visibleNames.map((name) => ({
      name,
      buttons: grouped.get(name) ?? []
    }));

    if (hiddenNames.length) {
      const hiddenButtons = hiddenNames.flatMap((name) => grouped.get(name) ?? []);
      const existingMoreIndex = result.findIndex((group) => group.name.toLowerCase() === 'more');
      if (existingMoreIndex >= 0) {
        result[existingMoreIndex] = {
          ...result[existingMoreIndex],
          buttons: [...result[existingMoreIndex].buttons, ...hiddenButtons]
        };
      } else {
        result.push({ name: 'More', buttons: hiddenButtons });
      }
    }

    return result;
  }

  get resolvedLineToolbarButtons(): EntryCommandButtonConfig[] {
    const configured = [...(this.popupLineToolbarButtons ?? [])];
    const injectLineNew = this.popupLineCommandPolicy?.injectDefaultLineNew === true;
    const injectLineDelete = this.popupLineCommandPolicy?.injectDefaultLineDelete === true;

    if (injectLineNew && !configured.some((button) => this.isLineNewCommand(button.actionKey))) {
      configured.unshift({
        label: 'Line',
        actionKey: 'cmd:line-new',
        group: 'Process',
        isPrimary: true,
        order: 10,
        icon: 'bi bi-plus-lg'
      });
    }

    if (injectLineDelete && !configured.some((button) => this.isLineDeleteCommand(button.actionKey))) {
      configured.push({
        label: 'Delete',
        actionKey: 'cmd:line-delete',
        group: 'Process',
        isPrimary: true,
        order: 15,
        icon: 'bi bi-trash'
      });
    }

    return configured;
  }

  get resolvedPrimaryLineToolbarButtons(): EntryCommandButtonConfig[] {
    const sorted = this.getSortedLineToolbarButtons();
    const primary = sorted.filter((button) => button.isPrimary === true || this.isGlobalLinePrimaryCommand(button.actionKey));
    const globalPrimaryCount = primary.filter((button) => this.isGlobalLinePrimaryCommand(button.actionKey)).length;
    const limit = Math.max(this.resolveLinePrimaryActionsLimit(primary.length), globalPrimaryCount);
    return primary.slice(0, limit);
  }

  get resolvedGroupedLineToolbarButtons(): EntryCommandGroup[] {
    const sorted = this.getSortedLineToolbarButtons();
    const primaryKeys = new Set(this.resolvedPrimaryLineToolbarButtons.map((button) => this.toButtonKey(button)));
    const menuButtons = sorted.filter((button) => !primaryKeys.has(this.toButtonKey(button)));
    if (!menuButtons.length) {
      return [];
    }

    const grouped = new Map<string, EntryCommandButtonConfig[]>();
    const order: string[] = [];

    for (const button of menuButtons) {
      const groupName = this.toText(button.group).trim() || 'General';
      if (!grouped.has(groupName)) {
        grouped.set(groupName, []);
        order.push(groupName);
      }

      grouped.get(groupName)?.push(button);
    }

    const visibleGroups = this.resolveLineVisibleGroupLimit(order.length);
    const visibleNames = order.slice(0, visibleGroups);
    const hiddenNames = order.slice(visibleGroups);
    const result: EntryCommandGroup[] = visibleNames.map((name) => ({ name, buttons: grouped.get(name) ?? [] }));

    if (hiddenNames.length) {
      const hiddenButtons = hiddenNames.flatMap((name) => grouped.get(name) ?? []);
      const existingMoreIndex = result.findIndex((group) => group.name.toLowerCase() === 'more');
      if (existingMoreIndex >= 0) {
        result[existingMoreIndex] = {
          ...result[existingMoreIndex],
          buttons: [...result[existingMoreIndex].buttons, ...hiddenButtons]
        };
      } else {
        result.push({ name: 'More', buttons: hiddenButtons });
      }
    }

    return result;
  }

  get resolvedDetailToolbarButtons(): EntryCommandButtonConfig[] {
    return this.popupDetailToolbarButtons ?? [];
  }

  get resolvedHeaderData(): Record<string, unknown> {
    return this.popupHeaderData ?? {};
  }

  get resolvedLineColumns(): LineColumnConfig[] {
    return this.popupLineColumns ?? [];
  }

  get resolvedLineRows(): Record<string, unknown>[] {
    return this.popupLineRows ?? [];
  }

  get resolvedLineTotals(): EntryLineTotalsConfig {
    return this.popupLineTotals ?? this.emptyLineTotals;
  }

  get resolvedAttachments(): EntryAttachmentsConfig {
    return this.popupAttachments ?? this.emptyAttachments;
  }

  get resolvedFactPanelSections(): FactPanelSectionConfig[] {
    return this.popupFactPanelSections ?? [];
  }

  get resolvedStatusMessage(): EntryStatusMessage | undefined {
    return this.popupStatusMessage ?? this.transientStatusMessage;
  }

  shouldRenderLinesAfter(section: EntryHeaderSectionConfig): boolean {
    if (!this.resolvedLineColumns.length) {
      return false;
    }

    const placement = this.resolvedLinePlacement;
    if (placement.mode !== 'after-section') {
      return false;
    }

    const sectionId = this.toText(section.id).trim().toLowerCase();
    const targetSectionId = this.toText(placement.afterSectionId).trim().toLowerCase();
    return !!targetSectionId && sectionId === targetSectionId;
  }

  get shouldRenderLinesAtEnd(): boolean {
    if (!this.resolvedLineColumns.length) {
      return false;
    }

    const placement = this.resolvedLinePlacement;
    if (placement.mode === 'end') {
      return true;
    }

    const targetSectionId = this.toText(placement.afterSectionId).trim().toLowerCase();
    if (!targetSectionId.length) {
      return true;
    }

    return !this.resolvedHeaderSections.some((section) => this.toText(section.id).trim().toLowerCase() === targetSectionId);
  }

  private get resolvedLinePlacement(): EntryLinePlacementConfig {
    return this.popupLinePlacement ?? { mode: 'end' };
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

  handleLineAction(event: { actionKey: string; row?: Record<string, unknown>; payload?: unknown }): void {
    const payload = this.mergeLineActionPayload(event.row, event.payload);
    this.routeAction(event.actionKey, payload);
  }

  handleLineSelectionChanged(event: {
    activeRow?: Record<string, unknown>;
    selectedRows: Record<string, unknown>[];
    selectedIndexes: number[];
  }): void {
    this.selectedLineIndexes = [...event.selectedIndexes];
    this.action.emit({ actionKey: 'line:selection-changed', payload: event });
  }

  handleLineRowChanged(event: { row: Record<string, unknown>; column: LineColumnConfig; value: unknown }): void {
    this.markSavingState();
    this.action.emit({ actionKey: 'line:changed', payload: event });
    this.recalculateLineTotals();
    this.action.emit({ actionKey: 'cmd:autosave', payload: event });
  }

  handleHeaderFieldChanged(event: { fieldKey: string; value: unknown; updates?: Record<string, unknown> }): void {
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
    this.routeAction(actionKey, this.buildLineCommandPayload(actionKey));
  }

  handleNestedCommandAction(actionKey: string): void {
    this.routeAction(actionKey);
  }

  handleGroupedHeaderCommandAction(actionKey: string, event: Event): void {
    this.routeAction(actionKey);
    const target = event.currentTarget as HTMLElement | null;
    const menu = target?.closest('details') as HTMLDetailsElement | null;
    if (menu) {
      menu.open = false;
    }
  }

  handleGroupedLineCommandAction(actionKey: string, event: Event): void {
    this.routeAction(actionKey, this.buildLineCommandPayload(actionKey));
    const target = event.currentTarget as HTMLElement | null;
    const menu = target?.closest('details') as HTMLDetailsElement | null;
    if (menu) {
      menu.open = false;
    }
  }

  handleGroupMenuToggle(event: Event): void {
    const menu = event.target as HTMLDetailsElement;
    if (!menu?.open) {
      return;
    }

    const host = this.hostElement.nativeElement as HTMLElement;
    const openMenus = Array.from(host.querySelectorAll('details.group-menu[open]')) as HTMLDetailsElement[];
    openMenus.forEach((candidate: HTMLDetailsElement) => {
      if (candidate !== menu) {
        candidate.open = false;
      }
    });
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    const inGroupMenu = (target as HTMLElement).closest?.('details.group-menu');
    if (!inGroupMenu) {
      this.closeAllGroupMenus();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.closeAllGroupMenus();
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

  private routeAction(rawActionKey: string, payload?: unknown): void {
    const actionKey = this.normalizeActionKey(rawActionKey);

    if (actionKey.startsWith('dialog:')) {
      this.handleDialogAction(actionKey.slice('dialog:'.length));
      return;
    }

    if (actionKey.startsWith('popup:')) {
      this.action.emit({ actionKey, payload });
      return;
    }

    if (actionKey.startsWith('cmd:')) {
      this.handleCommandAction(actionKey.slice('cmd:'.length), payload);
    }
  }

  private handleDialogAction(dialog: string): void {
    if (dialog === 'header' || dialog === 'dimensions' || dialog === 'attachments' || dialog === 'line' || dialog === 'posting') {
      this.openEntryDialog(dialog);
    }
  }

  private handleCommandAction(command: string, payload?: unknown): void {
    if (command === 'close') {
      this.closeEntryDialog();
      return;
    }

    this.action.emit({ actionKey: `cmd:${command}`, payload });
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
        return 'cmd:more';
      case 'close':
        return 'cmd:close';
      case 'save':
      case 'validate':
      case 'release':
      case 'apply':
      case 'clear':
      case 'template':
      case 'line-new':
      case 'line-delete':
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

  private getSortedHeaderToolbarButtons(): EntryCommandButtonConfig[] {
    return [...this.resolvedHeaderToolbarButtons]
      .map((button, index) => ({ button, index }))
      .sort((a, b) => {
        const orderA = typeof a.button.order === 'number' ? a.button.order : Number.MAX_SAFE_INTEGER;
        const orderB = typeof b.button.order === 'number' ? b.button.order : Number.MAX_SAFE_INTEGER;
        if (orderA === orderB) {
          return a.index - b.index;
        }

        return orderA - orderB;
      })
      .map((entry) => entry.button);
  }

  private getSortedLineToolbarButtons(): EntryCommandButtonConfig[] {
    return [...this.resolvedLineToolbarButtons]
      .map((button, index) => ({ button, index }))
      .sort((a, b) => {
        const orderA = typeof a.button.order === 'number' ? a.button.order : Number.MAX_SAFE_INTEGER;
        const orderB = typeof b.button.order === 'number' ? b.button.order : Number.MAX_SAFE_INTEGER;
        if (orderA === orderB) {
          return a.index - b.index;
        }

        return orderA - orderB;
      })
      .map((entry) => entry.button);
  }

  private resolvePrimaryActionsLimit(fallback: number): number {
    const configured = this.popupHeaderCommandBar?.maxPrimaryActions;
    if (typeof configured !== 'number' || configured <= 0) {
      return fallback;
    }

    return configured;
  }

  private resolveVisibleGroupLimit(fallback: number): number {
    const configured = this.popupHeaderCommandBar?.maxVisibleGroups;
    if (typeof configured !== 'number' || configured <= 0) {
      return fallback;
    }

    return configured;
  }

  private resolveLinePrimaryActionsLimit(fallback: number): number {
    const configured = this.popupLineCommandBar?.maxPrimaryActions;
    if (typeof configured !== 'number' || configured <= 0) {
      return fallback;
    }

    return configured;
  }

  private resolveLineVisibleGroupLimit(fallback: number): number {
    const configured = this.popupLineCommandBar?.maxVisibleGroups;
    if (typeof configured !== 'number' || configured <= 0) {
      return fallback;
    }

    return configured;
  }

  private toButtonKey(button: EntryCommandButtonConfig): string {
    return `${button.actionKey}::${button.label}`;
  }

  private isGlobalLinePrimaryCommand(actionKey: string): boolean {
    const normalized = this.toText(actionKey).trim().toLowerCase();
    return EntryDialogComponent.GLOBAL_LINE_PRIMARY_COMMANDS.has(normalized);
  }

  private isLineNewCommand(actionKey: string): boolean {
    const normalized = this.toText(actionKey).trim().toLowerCase();
    return normalized === 'cmd:line-new' || normalized === 'line-new';
  }

  private isLineDeleteCommand(actionKey: string): boolean {
    const normalized = this.toText(actionKey).trim().toLowerCase();
    return normalized === 'cmd:line-delete' || normalized === 'line-delete';
  }

  private buildLineCommandPayload(actionKey: string): unknown {
    if (!this.isLineDeleteCommand(actionKey) || !this.selectedLineIndexes.length) {
      return undefined;
    }

    return {
      selectedIndexes: [...this.selectedLineIndexes]
    };
  }

  private mergeLineActionPayload(row: Record<string, unknown> | undefined, payload: unknown): unknown {
    if (!row && payload === undefined) {
      return undefined;
    }

    if (!this.isRecord(payload)) {
      return row ? { row } : payload;
    }

    return row ? { ...payload, row } : payload;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private closeAllGroupMenus(): void {
    const host = this.hostElement.nativeElement as HTMLElement;
    const openMenus = Array.from(host.querySelectorAll('details.group-menu[open]')) as HTMLDetailsElement[];
    openMenus.forEach((menu: HTMLDetailsElement) => {
      menu.open = false;
    });
  }

  // Popup stacking is handled by popup-host; entry-dialog only emits actions.
}
