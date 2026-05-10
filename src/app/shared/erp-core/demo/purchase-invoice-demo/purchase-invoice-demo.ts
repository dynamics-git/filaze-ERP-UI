import { Component } from '@angular/core';
import { ErpDocumentPageComponent } from '../../components/document-page/document-page';
import {
  purchaseInvoiceMockHeader,
  purchaseInvoiceMockLines,
  purchaseInvoicePageConfig
} from '../../examples/purchase-invoice';

@Component({
  selector: 'erp-purchase-invoice-demo',
  standalone: true,
  imports: [ErpDocumentPageComponent],
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
