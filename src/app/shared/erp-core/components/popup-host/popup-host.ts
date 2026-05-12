import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ErpEntryDialogConfig } from '../../models/entry-dialog-config.model';
import { ErpPopupConfig } from '../../models/popup-config.model';
import { EntryDialogActionEvent, EntryDialogComponent } from '../../../../layout/entry-dialog/entry-dialog';
import { PopupStackService } from '../../services/popup-stack.service';

type ErpPopupLayoutMode = 'header-line' | 'header-only' | 'line-only';

type ErpNestedPopupBehavior = {
  mode?: ErpPopupConfig['mode'];
  size?: ErpPopupConfig['size'];
  closeOnBackdrop?: boolean;
  allowNested?: boolean;
  layout?: ErpPopupLayoutMode;
};

type ErpPopupHostData = {
  entryDialogConfig?: ErpEntryDialogConfig;
  nestedEntryDialogConfigs?: Record<string, ErpEntryDialogConfig>;
  nestedPopupBehaviors?: Record<string, ErpNestedPopupBehavior>;
};

@Component({
  selector: 'erp-popup-host',
  standalone: true,
  imports: [AsyncPipe, EntryDialogComponent],
  templateUrl: './popup-host.html',
  styleUrl: './popup-host.scss'
})
export class ErpPopupHostComponent {
  private readonly popupStack = inject(PopupStackService);

  @Output() action = new EventEmitter<{ popupId: string; actionKey: string; payload?: unknown }>();
  @Output() closed = new EventEmitter<{ popupId: string; entryDialogConfig?: ErpEntryDialogConfig }>();

  readonly popupStack$ = this.popupStack.stack$;

  close(id?: string): void {
    this.popupStack.close(id);
  }

  getEntryDialogConfig(popup: ErpPopupConfig): ErpEntryDialogConfig | undefined {
    return this.getPopupData(popup).entryDialogConfig;
  }

  getNestedEntryDialogConfig(popup: ErpPopupConfig, action: string): ErpEntryDialogConfig | undefined {
    return this.getPopupData(popup).nestedEntryDialogConfigs?.[action];
  }

  getNestedPopupBehavior(popup: ErpPopupConfig, action: string): ErpNestedPopupBehavior | undefined {
    return this.getPopupData(popup).nestedPopupBehaviors?.[action];
  }

  isDocumentPopup(popup: ErpPopupConfig): boolean {
    return popup.mode === 'page' || popup.size === 'full';
  }

  isFullPagePopup(popup: ErpPopupConfig): boolean {
    return popup.size === 'full' || popup.mode === 'page';
  }

  canCloseOnBackdrop(popup: ErpPopupConfig): boolean {
    return popup.closeOnBackdrop !== false;
  }

  onBackdropClick(popup: ErpPopupConfig): void {
    if (this.canCloseOnBackdrop(popup)) {
      this.closePopup(popup);
    }
  }

  closePopup(popup: ErpPopupConfig): void {
    this.closed.emit({
      popupId: popup.id,
      entryDialogConfig: this.getEntryDialogConfig(popup)
    });
    this.popupStack.close(popup.id);
  }

  onEntryDialogAction(popup: ErpPopupConfig, event: EntryDialogActionEvent): void {
    const actionKey = event.actionKey;

    if (!actionKey.startsWith('popup:')) {
      this.action.emit({ popupId: popup.id, actionKey, payload: event.payload });
      return;
    }

    const action = actionKey.slice('popup:'.length);
    const entryDialogConfig = this.getEntryDialogConfig(popup);
    if (!entryDialogConfig) {
      return;
    }

    const nextLevel = this.resolveStackLevel(entryDialogConfig.title ?? popup.title ?? 'Entry') + 1;
    if (nextLevel > 8) {
      return;
    }

    const layeredTitle = this.buildLayeredTitle(entryDialogConfig.title ?? popup.title ?? 'Entry', nextLevel);

    const actionLayout: ErpPopupLayoutMode =
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

  private getPopupData(popup: ErpPopupConfig): ErpPopupHostData {
    if (!this.isRecord(popup.data)) {
      return {};
    }

    return popup.data as ErpPopupHostData;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private buildLayeredTitle(title: string, nextLevel: number): string {
    const baseTitle = title.replace(/\s*\[L\d+\]\s*$/, '').trim();
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
    source: ErpEntryDialogConfig,
    title: string,
    layout: ErpPopupLayoutMode
  ): ErpEntryDialogConfig {
    const next: ErpEntryDialogConfig = {
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
