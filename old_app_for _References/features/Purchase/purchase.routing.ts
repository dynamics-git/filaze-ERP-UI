import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { PurchaseRequisitionComponent } from './purchase-requisition/purchase-requisition.component';
import { PurchaseQuoteComponent } from './purchase-quote/purchase-quote.component';
import { PurchaseOrderComponent } from './purchase-order/purchase-order.component';
import { PurchaseInvoiceComponent } from './purchase-invoice/purchase-invoice.component';
import { PostedPurchaseReceiptComponent } from './posted-purchase-receipt/posted-purchase-receipt.component';
import { PostedPurchaseInvoiceComponent } from './posted-purchase-invoice/posted-purchase-invoice.component';
import { PRVendorSelectionComponent } from './pr-vendor-selection/pr-vendor-selection.component';
import { PRBidWaiverComponent } from './pr-bid-waiver/pr-bid-waiver.component';
import { VariationOrderComponent } from './variation-order/variation-order.component';
import { ArchivedPurchaseRequisitionComponent } from './archived-purchase-requisition/archived-purchase-requisition.component';
import { ArchivedPurchaseQuoteComponent } from './archived-purchase-quote/archived-purchase-quote.component';
import { ArchivedPurchaseOrderComponent } from './archived-purchase-order/archived-purchase-order.component';
import { PoGrnPostComponent } from './po-grn-post/po-grn-post.component';
import { PoInvoicePostComponent } from './po-invoice-post/po-invoice-post.component';
import { PurchaseCreditMemoComponent } from './purchase-credit-memo/purchase-credit-memo.component';
import { PostedpurchaseCreditMemoComponent } from './postedpurchase-credit-memo/postedpurchase-credit-memo.component';
import { PurchaseOrderCancelledComponent } from './purchase-order-cancelled/purchase-order-cancelled.component';
import { ApprovedPurchaseRequisitionComponent } from './approved-purchase-requisition/approved-purchase-requisition.component';
import { PurchaseRequisitionCancelledComponent } from './purchase-requisition-cancelled/purchase-requisition-cancelled.component';
import { PrePaymentPostedPurchaseInvoiceComponent } from './pre-payment-posted-purchase-invoice/pre-payment-posted-purchase-invoice.component';
import { PrRfqVendorComponent } from './pr-rfq-vendor/pr-rfq-vendor.component';
import { CombinedRequisitionComponent } from './combined-requisition/combined-requisition.component';
import { PurchaseRoleCentreComponent } from './purchase-role-centre/purchase-role-centre.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'requisition',
        pathMatch: 'full'
      },
      {
        path: 'purchase-Role-Centre',
        component: PurchaseRoleCentreComponent
      },
      {
        path: 'requisition',
        component: PurchaseRequisitionComponent
      },
      {
        path: 'combined-requisition',
        component: CombinedRequisitionComponent
      },
      {
        path: 'approved-pr',
        component: ApprovedPurchaseRequisitionComponent
      },
      {
        path: 'archived-requisition',
        component: ArchivedPurchaseRequisitionComponent
      },
      {
        path: 'cancelled-pr',
        component: PurchaseRequisitionCancelledComponent
      },
      {
        path: 'PRBidWaiver',
        component: PRBidWaiverComponent
      },
      {
        path: 'PR-Vender-Selection',
        component: PRVendorSelectionComponent
      },
      {
        path: 'smart-document-import',
        loadChildren: () =>
          import('../smart-document-import/smart-document-import.module').then(
            (m) => m.SmartDocumentImportModule
          )
      },
      {
        path: 'quote',
        component: PurchaseQuoteComponent
      },
      {
        path: 'archived-quote',
        component: ArchivedPurchaseQuoteComponent
      },
      {
        path: 'order',
        component: PurchaseOrderComponent
      },
      {
        path: 'order-cancelled',
        component: PurchaseOrderCancelledComponent
      },
      {
        path: 'archived-order',
        component: ArchivedPurchaseOrderComponent
      },
      {
        path: 'variation-order',
        component: VariationOrderComponent
      },
      {
        path: 'invoice',
        component: PurchaseInvoiceComponent
      },
      {
        path: 'purchase-Credit-Memo',
        component: PurchaseCreditMemoComponent
      },
      {
        path: 'postedpurchase-Credit-Memo',
        component: PostedpurchaseCreditMemoComponent
      },
      {
        path: 'receipt',
        component: PostedPurchaseReceiptComponent
      },
      {
        path: 'postedinvoice',
        component: PostedPurchaseInvoiceComponent
      },
      {
        path: 'prepaymentpostedinvoice',
        component: PrePaymentPostedPurchaseInvoiceComponent
      },
      {
        path: 'poGRNPost',
        component: PoGrnPostComponent,
      },
      {
        path: 'poInvPost',
        component: PoInvoicePostComponent,
      },
      {
        path: 'RFQ-Vendor',
        component: PrRfqVendorComponent,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchaseRoutingModule { }
