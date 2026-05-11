import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ErpListPageComponent } from '../../shared/erp-core/components/list-page/list-page';
import { ErpPopupHostComponent } from '../../shared/erp-core/components/popup-host/popup-host';
import { ActionDispatcherService } from '../../shared/erp-core/services/action-dispatcher.service';
import { DataSourceService } from '../../shared/erp-core/services/data-source.service';
import { PopupStackService } from '../../shared/erp-core/services/popup-stack.service';
import {
  purchaseOrderConfig,
  purchaseOrderHeaderConfig,
  purchaseOrderListCommandsConfig,
  purchaseOrderListPageConfig
} from './purchase-order.config';

@Component({
  selector: 'app-purchase-order',
  standalone: true,
  imports: [ErpListPageComponent, ErpPopupHostComponent],
  templateUrl: './purchase-order.html',

})
export class PurchaseOrderPage implements OnInit, OnDestroy {
  private readonly actionDispatcher = inject(ActionDispatcherService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly dataSource = inject(DataSourceService);
  private readonly popupStack = inject(PopupStackService);
  private readonly subscriptions = new Subscription();

  readonly config = purchaseOrderConfig;
  readonly listPageConfig = purchaseOrderListPageConfig;

  loading = false;
  error?: string;
  hasMore = true;
  rows: unknown[] = [];
  selectedRow?: unknown;
  private listLoadSubscription?: Subscription;

  constructor() {
    this.popupStack.closeAll();
  }

  ngOnInit(): void {
    this.actionDispatcher.setPageCommands(purchaseOrderListCommandsConfig);
    this.loadFirstPage();

    this.subscriptions.add(
      this.actionDispatcher.action$.subscribe((event) => this.handleCommand(event))
    );
  }

  ngOnDestroy(): void {
    this.actionDispatcher.clearPageCommands();
    this.listLoadSubscription?.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  handleCommand(event: { actionKey: string; payload?: unknown }): void {
    if (event.actionKey === 'refresh') {
      this.loadFirstPage();
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
        documentId: row,
        fallbackHeaderData: row,
        fallbackLineData: []
      }
    });
  }

  loadNextPage(): void {
    if (this.loading || !this.hasMore) {
      return;
    }

    this.loadPage(false);
  }

  private loadFirstPage(): void {
    this.loadPage(true);
  }

  private loadPage(reset: boolean): void {
    if (this.loading) {
      return;
    }

    if (reset) {
      this.rows = [];
      this.selectedRow = undefined;
      this.hasMore = true;
      this.listLoadSubscription?.unsubscribe();
    }

    this.loading = true;
    this.error = undefined;

    const pageSize = purchaseOrderHeaderConfig.dataSource.pageSize ?? 20;
    const skip = reset ? 0 : this.rows.length;

    this.listLoadSubscription = this.dataSource.loadList(purchaseOrderHeaderConfig.dataSource, {
      skip,
      top: pageSize
    }).subscribe({
      next: (response) => {
        const records = this.toRecords(response);
        this.rows = reset ? records : [...this.rows, ...records];
        this.hasMore = records.length === pageSize;
        this.loading = false;
        this.changeDetector.detectChanges();
      },
      error: (error: unknown) => {
        if (reset) {
          this.rows = [];
        }

        this.hasMore = false;
        this.error = this.getErrorMessage(error);
        this.loading = false;
        this.changeDetector.detectChanges();
      }
    });
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
