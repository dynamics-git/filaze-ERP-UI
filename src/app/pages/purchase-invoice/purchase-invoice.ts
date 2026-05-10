import { Component } from '@angular/core';
import { ErpDocumentContainerComponent } from '../../shared/erp-core/components/document-container/document-container';
import { purchaseInvoiceConfig } from './purchase-invoice.config';

@Component({
  selector: 'app-purchase-invoice',
  standalone: true,
  imports: [ErpDocumentContainerComponent],
  templateUrl: './purchase-invoice.html',
  styleUrl: './purchase-invoice.scss'
})
export class PurchaseInvoicePage {
  readonly config = purchaseInvoiceConfig;
  documentId?: unknown;

  onCommand(event: { actionKey: string; payload?: unknown }): void {
    console.log('Purchase Invoice command', event.actionKey);
  }
}
