import { AsyncPipe, NgStyle } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ErpDocumentPageConfig } from '../../models/document-page-config.model';
import { ErpPopupConfig } from '../../models/popup-config.model';
import { SessionService } from '../../../../core/services/session.service';
import { PopupStackService } from '../../services/popup-stack.service';
import { ErpDocumentContainerComponent } from '../document-container/document-container';

type ErpPopupHostAction = {
  label: string;
  actionKey: string;
};

type ErpPopupHostData = {
  body?: string;
  actions?: ErpPopupHostAction[];
  kicker?: string;
  meta?: string;
  documentConfig?: ErpDocumentPageConfig;
  documentId?: unknown;
  fallbackHeaderData?: unknown;
  fallbackLineData?: unknown[];
};

@Component({
  selector: 'erp-popup-host',
  standalone: true,
  imports: [AsyncPipe, NgStyle, ErpDocumentContainerComponent],
  templateUrl: './popup-host.html',
  styleUrl: './popup-host.scss'
})
export class ErpPopupHostComponent {
  private readonly popupStack = inject(PopupStackService);
  private readonly session = inject(SessionService);

  @Output() popupAction = new EventEmitter<{ actionKey: string; popup: ErpPopupConfig }>();

  readonly stack$ = this.popupStack.stack$;

  close(id?: string): void {
    this.popupStack.close(id);
  }

  closeTop(): void {
    this.popupStack.closeTop();
  }

  closeAll(): void {
    this.popupStack.closeAll();
  }

  getPopupBody(popup: ErpPopupConfig): string {
    return this.getPopupData(popup).body ?? '';
  }

  getPopupActions(popup: ErpPopupConfig): ErpPopupHostAction[] {
    return this.getPopupData(popup).actions ?? [];
  }

  getPopupKicker(popup: ErpPopupConfig): string {
    return this.getPopupData(popup).kicker ?? popup.mode ?? 'modal';
  }

  getPopupMeta(popup: ErpPopupConfig): string {
    const data = this.getPopupData(popup);

    if (data.meta) {
      return data.meta;
    }

    const documentConfig = data.documentConfig;
    const companyName = this.session.CompanyName;

    return [
      documentConfig?.subtitle,
      companyName
    ].filter(Boolean).join(' · ');
  }

  getDocumentConfig(popup: ErpPopupConfig): ErpDocumentPageConfig | undefined {
    return this.getPopupData(popup).documentConfig;
  }

  getDocumentId(popup: ErpPopupConfig): unknown {
    return this.getPopupData(popup).documentId;
  }

  getFallbackHeaderData(popup: ErpPopupConfig): unknown {
    return this.getPopupData(popup).fallbackHeaderData;
  }

  getFallbackLineData(popup: ErpPopupConfig): unknown[] {
    return this.getPopupData(popup).fallbackLineData ?? [];
  }

  isDocumentPopup(popup: ErpPopupConfig): boolean {
    return Boolean(this.getDocumentConfig(popup));
  }

  getPopupStyle(index: number): Record<string, string | number> {
    return {
      'z-index': 1000 + index * 10,
      translate: `${index * 18}px ${index * 14}px`
    };
  }

  emitPopupAction(actionKey: string, popup: ErpPopupConfig): void {
    this.popupAction.emit({ actionKey, popup });
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
}
