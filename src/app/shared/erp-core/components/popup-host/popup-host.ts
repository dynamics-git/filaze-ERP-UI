import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { EntryDialogConfig } from '../../models/entry-dialog-config.model';
import { PopupConfig } from '../../models/popup-config.model';
import { EntryDialogActionEvent, EntryDialogComponent } from '../../../../layout/entry-dialog/entry-dialog';
import { PopupStackService } from '../../services/popup-stack.service';

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
  nestedEntryDialogConfigs?: Record<string, EntryDialogConfig>;
  nestedPopupBehaviors?: Record<string, NestedPopupBehavior>;
};

@Component({
  selector: 'erp-popup-host',
  standalone: true,
  imports: [AsyncPipe, EntryDialogComponent],
  templateUrl: './popup-host.html',
  styleUrl: './popup-host.scss'
})
export class PopupHostComponent {
  private readonly popupStack = inject(PopupStackService);

  @Output() action = new EventEmitter<{ popupId: string; actionKey: string; payload?: unknown }>();
  @Output() closed = new EventEmitter<{ popupId: string; entryDialogConfig?: EntryDialogConfig }>();

  readonly popupStack$ = this.popupStack.stack$;

  close(id?: string): void {
    this.popupStack.close(id);
  }

  getEntryDialogConfig(popup: PopupConfig): EntryDialogConfig | undefined {
    return this.getPopupData(popup).entryDialogConfig;
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
    this.closed.emit({
      popupId: popup.id,
      entryDialogConfig: this.getEntryDialogConfig(popup)
    });
    this.popupStack.close(popup.id);
  }

  onEntryDialogAction(popup: PopupConfig, event: EntryDialogActionEvent): void {
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

    const nextLevel = this.resolveStackLevel(entryDialogConfig.title ?? popup.title ?? '') + 1;
    if (nextLevel > 8) {
      return;
    }

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
