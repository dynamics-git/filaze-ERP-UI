import { Component, inject } from '@angular/core';
import { ErpListPageComponent } from '../../shared/erp-core/components/list-page/list-page';
import { ErpPopupHostComponent } from '../../shared/erp-core/components/popup-host/popup-host';
import { DataSourceService } from '../../shared/erp-core/services/data-source.service';
import { PopupStackService } from '../../shared/erp-core/services/popup-stack.service';
import {
  purchaseOrderConfig,
  purchaseOrderHeaderConfig,
  purchaseOrderListPageConfig
} from './purchase-order.config';

@Component({
  selector: 'app-purchase-order',
  standalone: true,
  imports: [ErpListPageComponent, ErpPopupHostComponent],
  templateUrl: './purchase-order.html',

})
export class PurchaseOrderPage {
  private readonly dataSource = inject(DataSourceService);
  private readonly popupStack = inject(PopupStackService);

  readonly config = purchaseOrderConfig;
  readonly listPageConfig = purchaseOrderListPageConfig;

  loading = false;
  error?: string;
  rows: unknown[] = [];
  selectedRow?: unknown;

  constructor() {
    this.popupStack.closeAll();
    this.loadList();
  }

  handleCommand(event: { actionKey: string; payload?: unknown }): void {
    if (event.actionKey === 'refresh') {
      this.loadList();
      return;
    }

    if (event.actionKey === 'new') {
      console.log('Purchase Order command', event.actionKey);
      return;
    }

    console.log('Purchase Order command', event.actionKey);
  }

  openPurchaseOrder(row: unknown): void {
    this.popupStack.open({
      id: 'purchase-order-entry',
      title: this.getDocumentTitle(row),
      mode: 'page',
      size: 'full',
      allowNested: false,
      data: {
        documentConfig: this.config,
        documentId: this.getDocumentId(row),
        fallbackHeaderData: row,
        fallbackLineData: []
      }
    });
  }

  private loadList(): void {
    this.rows = [];
    this.loading = true;
    this.error = undefined;

    this.dataSource.loadList(purchaseOrderHeaderConfig.dataSource).subscribe({
      next: (response) => {
        const records = this.toRecords(response);
        this.rows = records;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.rows = [];
        this.error = this.getErrorMessage(error);
        this.loading = false;
      }
    });
  }

  private getDocumentId(row: unknown): unknown {
    if (!this.isRecord(row)) {
      return undefined;
    }

    return row['Id'];
  }

  private getDocumentTitle(row: unknown): string {
    if (!this.isRecord(row)) {
      return 'Purchase Order';
    }

    return `Purchase Order ${row['Number'] ?? ''}`.trim();
  }

  private toRecords(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (this.isRecord(response) && Array.isArray(response['value'])) {
      return response['value'];
    }

    return [];
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unable to load Purchase Order rows from the API.';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
