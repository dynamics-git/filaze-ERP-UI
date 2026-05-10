import { Component } from '@angular/core';
import { ErpDocumentContainerComponent } from '../../components/document-container/document-container';
import {
  purchaseInvoiceMockHeader,
  purchaseInvoiceMockLines,
  purchaseInvoicePageConfig
} from '../../examples/purchase-invoice';

@Component({
  selector: 'erp-purchase-invoice-demo',
  standalone: true,
  imports: [ErpDocumentContainerComponent],
  templateUrl: './purchase-invoice-demo.html',
  styleUrl: './purchase-invoice-demo.scss'
})
export class ErpPurchaseInvoiceDemoComponent {
  readonly pageConfig = purchaseInvoicePageConfig;
  readonly header = purchaseInvoiceMockHeader;
  readonly lines = purchaseInvoiceMockLines;

  logCommand(event: { actionKey: string; payload?: unknown }): void {
    console.log(event.actionKey);
  }
}
