import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal';
import { ConfirmationDialogConfig } from '../../models/confirmation-dialog-config.model';
import { EntryCommandButtonConfig, EntryDialogConfig } from '../../models/entry-dialog-config.model';
import { PopupConfig } from '../../models/popup-config.model';
import { EntryDialogActionEvent, EntryDialogComponent } from '../../../../layout/entry-dialog/entry-dialog';
import { ConfirmationService } from '../../services/confirmation.service';
import { PopupStackService } from '../../services/popup-stack.service';
import { RunModalService } from '../../services/run-modal.service';

type PopupLayoutMode = 'header-line' | 'header-only' | 'line-only';

type NestedPopupBehavior = {
  mode?: PopupConfig['mode'];
  size?: PopupConfig['size'];
  closeOnBackdrop?: boolean;
  allowNested?: boolean;
  layout?: PopupLayoutMode;
};

type PopupHostData = {
  entryDialogConfig?: EntryDialogConfig;
  confirmationDialogConfig?: ConfirmationDialogConfig;
  nestedEntryDialogConfigs?: Record<string, EntryDialogConfig>;
  nestedPopupBehaviors?: Record<string, NestedPopupBehavior>;
};

@Component({
  selector: 'erp-popup-host',
  standalone: true,
  imports: [AsyncPipe, EntryDialogComponent, ConfirmationModalComponent],
  templateUrl: './popup-host.html',
  styleUrl: './popup-host.scss'
})
export class PopupHostComponent {
  private readonly confirmation = inject(ConfirmationService);
  private readonly popupStack = inject(PopupStackService);
  private readonly runModal = inject(RunModalService);
  private pendingRunModalOpens = 0;

  @Output() action = new EventEmitter<{ popupId: string; actionKey: string; payload?: unknown }>();
  @Output() closed = new EventEmitter<{ popupId: string; entryDialogConfig?: EntryDialogConfig }>();

  readonly popupStack$ = this.popupStack.stack$;

  get showRunModalLoader(): boolean {
    return this.pendingRunModalOpens > 0;
  }

  close(id?: string): void {
    this.popupStack.close(id);
  }

  getEntryDialogConfig(popup: PopupConfig): EntryDialogConfig | undefined {
    return this.getPopupData(popup).entryDialogConfig;
  }

  getConfirmationDialogConfig(popup: PopupConfig): ConfirmationDialogConfig | undefined {
    return this.getPopupData(popup).confirmationDialogConfig;
  }

  getNestedEntryDialogConfig(popup: PopupConfig, action: string): EntryDialogConfig | undefined {
    return this.getPopupData(popup).nestedEntryDialogConfigs?.[action];
  }

  getNestedPopupBehavior(popup: PopupConfig, action: string): NestedPopupBehavior | undefined {
    return this.getPopupData(popup).nestedPopupBehaviors?.[action];
  }

  isDocumentPopup(popup: PopupConfig): boolean {
    return popup.mode === 'page' || popup.size === 'full';
  }

  isConfirmationPopup(popup: PopupConfig): boolean {
    return !!this.getConfirmationDialogConfig(popup);
  }

  isFullPagePopup(popup: PopupConfig): boolean {
    return popup.size === 'full' || popup.mode === 'page';
  }

  canCloseOnBackdrop(popup: PopupConfig): boolean {
    return popup.closeOnBackdrop !== false;
  }

  onBackdropClick(popup: PopupConfig): void {
    if (this.canCloseOnBackdrop(popup)) {
      this.closePopup(popup);
    }
  }

  closePopup(popup: PopupConfig): void {
    if (this.isConfirmationPopup(popup)) {
      this.confirmation.dismissDialog(popup.id);
      return;
    }

    this.closed.emit({
      popupId: popup.id,
      entryDialogConfig: this.getEntryDialogConfig(popup)
    });
    this.runModal.releasePopup(popup.id);
    this.popupStack.close(popup.id);
  }

  onConfirmationDecision(popup: PopupConfig, value: boolean): void {
    this.confirmation.resolveDialog(popup.id, value);
  }

  onEntryDialogAction(popup: PopupConfig, event: EntryDialogActionEvent): void {
    const actionKey = event.actionKey;

    if (!actionKey.startsWith('popup:')) {
      if (this.tryRunModalAction(popup, event)) {
        return;
      }

      if (this.runModal.handlePopupAction(popup.id, this.getEntryDialogConfig(popup) ?? {}, {
        actionKey,
        payload: event.payload
      })) {
        return;
      }

      this.action.emit({ popupId: popup.id, actionKey, payload: event.payload });
      return;
    }

    const action = actionKey.slice('popup:'.length);
    const entryDialogConfig = this.getEntryDialogConfig(popup);
    if (!entryDialogConfig) {
      return;
    }

    const nextLevel = this.resolveStackLevel(entryDialogConfig.title ?? popup.title ?? '') + 1;
    const layeredTitle = this.buildLayeredTitle(entryDialogConfig.title ?? popup.title ?? '', nextLevel);

    const actionLayout: PopupLayoutMode =
      action === 'header-only' || action === 'line-only' ? action : 'header-line';
    const sourceConfig =
      this.getNestedEntryDialogConfig(popup, action) ??
      (action === 'clone' || action === 'header-only' || action === 'line-only' ? entryDialogConfig : undefined);

    if (!sourceConfig) {
      return;
    }

    const nestedBehavior = this.getNestedPopupBehavior(popup, action);
    const nextEntryConfig = this.buildLayoutConfig(
      sourceConfig,
      layeredTitle,
      nestedBehavior?.layout ?? actionLayout
    );

    this.popupStack.open({
      id: `entry-stack-${Date.now()}-${nextLevel}`,
      title: layeredTitle,
      mode: nestedBehavior?.mode ?? popup.mode ?? 'page',
      size: nestedBehavior?.size ?? popup.size ?? 'full',
      allowNested: nestedBehavior?.allowNested ?? true,
      closeOnBackdrop: nestedBehavior?.closeOnBackdrop ?? popup.closeOnBackdrop,
      data: {
        ...this.getPopupData(popup),
        entryDialogConfig: nextEntryConfig
      }
    });
  }

  private tryRunModalAction(popup: PopupConfig, event: EntryDialogActionEvent): boolean {
    if (!event.actionKey.startsWith('cmd:')) {
      return false;
    }

    const button = this.resolveCommandButton(popup, event.actionKey);
    const pageId = button?.runModalPageId?.trim();
    if (!pageId) {
      return false;
    }

    const entryDialogConfig = this.getEntryDialogConfig(popup);
    const payloadRecord = this.isRecord(event.payload) ? event.payload : undefined;
    const context: Record<string, unknown> = {
      headerData: entryDialogConfig?.headerData ?? {},
      lineRows: entryDialogConfig?.lineRows ?? [],
      payload: payloadRecord ?? {}
    };

    const activeLine = this.resolveRunModalActiveLine(entryDialogConfig, payloadRecord);
    if (activeLine) {
      context['activeLine'] = activeLine;
    }

    void this.openRunModalWithLoader({
      pageId,
      context,
      mode: button?.runModalMode,
      size: button?.runModalSize,
      allowNested: true
    });

    return true;
  }

  private async openRunModalWithLoader(request: {
    pageId: string;
    context: Record<string, unknown>;
    mode?: PopupConfig['mode'];
    size?: PopupConfig['size'];
    allowNested: boolean;
  }): Promise<void> {
    this.pendingRunModalOpens += 1;
    try {
      await this.runModal.open(request);
    } finally {
      this.pendingRunModalOpens = Math.max(0, this.pendingRunModalOpens - 1);
    }
  }

  private resolveRunModalActiveLine(
    entryDialogConfig: EntryDialogConfig | undefined,
    payload: Record<string, unknown> | undefined
  ): Record<string, unknown> | undefined {
    if (payload && this.isRecord(payload['activeRow'])) {
      return payload['activeRow'];
    }

    const lineRows = entryDialogConfig?.lineRows ?? [];
    if (payload && Array.isArray(payload['selectedIndexes']) && lineRows.length) {
      const firstIndex = payload['selectedIndexes']
        .map((value) => Number(value))
        .find((value) => Number.isInteger(value) && value >= 0 && value < lineRows.length);
      if (firstIndex !== undefined) {
        return lineRows[firstIndex];
      }
    }

    return lineRows.length ? lineRows[0] : undefined;
  }

  private resolveCommandButton(popup: PopupConfig, actionKey: string): EntryCommandButtonConfig | undefined {
    const entryDialogConfig = this.getEntryDialogConfig(popup);
    const headerButton = entryDialogConfig?.headerToolbarButtons?.find((item) => item.actionKey === actionKey);
    if (headerButton) {
      return headerButton;
    }

    return entryDialogConfig?.lineToolbarButtons?.find((item) => item.actionKey === actionKey);
  }

  private getPopupData(popup: PopupConfig): PopupHostData {
    if (!this.isRecord(popup.data)) {
      return {};
    }

    return popup.data as PopupHostData;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private buildLayeredTitle(title: string, nextLevel: number): string {
    const baseTitle = title.replace(/\s*\[L\d+\]\s*$/, '').trim();
    if (!baseTitle) {
      return '';
    }

    return `${baseTitle} [L${nextLevel}]`;
  }

  private resolveStackLevel(title: string): number {
    const matched = title.match(/\[L(\d+)\]\s*$/);
    if (!matched) {
      return 1;
    }

    const parsed = Number(matched[1]);
    return Number.isFinite(parsed) ? parsed : 1;
  }

  private buildLayoutConfig(
    source: EntryDialogConfig,
    title: string,
    layout: PopupLayoutMode
  ): EntryDialogConfig {
    const next: EntryDialogConfig = {
      ...source,
      title
    };

    if (layout === 'header-only') {
      next.lineToolbarButtons = [];
      next.lineColumns = [];
      next.lineRows = [];
    }

    if (layout === 'line-only') {
      next.headerToolbarButtons = [];
      next.headerSections = [];
    }

    return next;
  }

}
