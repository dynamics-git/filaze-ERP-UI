import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map } from 'rxjs';
import { ErpDocumentPageConfig } from '../../models/document-page-config.model';
import { ErpPopupConfig } from '../../models/popup-config.model';
import { EntryDialogComponent } from '../../../../layout/entry-dialog/entry-dialog';
import { PopupStackService } from '../../services/popup-stack.service';

type ErpPopupHostData = {
  body?: string;
  documentConfig?: ErpDocumentPageConfig;
  documentId?: unknown;
  fallbackHeaderData?: unknown;
  fallbackLineData?: unknown[];
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

  readonly activePopup$ = this.popupStack.stack$.pipe(
    map((stack) => (stack.length ? stack[stack.length - 1] : null))
  );

  close(id?: string): void {
    this.popupStack.close(id);
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
    return popup.mode === 'page' || popup.size === 'full' || Boolean(this.getDocumentConfig(popup));
  }

  isFullPagePopup(popup: ErpPopupConfig): boolean {
    return popup.size === 'full' || popup.mode === 'page';
  }

  canCloseOnBackdrop(popup: ErpPopupConfig): boolean {
    return popup.closeOnBackdrop !== false;
  }

  onBackdropClick(popup: ErpPopupConfig): void {
    if (this.canCloseOnBackdrop(popup)) {
      this.close(popup.id);
    }
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
