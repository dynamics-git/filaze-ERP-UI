import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseRequisitionComponent } from './purchase-requisition/purchase-requisition.component';
import { PurchaseRoutingModule } from './purchase.routing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PurchaseQuoteComponent } from './purchase-quote/purchase-quote.component';
import { PurchaseOrderComponent } from './purchase-order/purchase-order.component';
import { PurchaseInvoiceComponent } from './purchase-invoice/purchase-invoice.component';
import { PostedPurchaseReceiptComponent } from './posted-purchase-receipt/posted-purchase-receipt.component';
import { PostedPurchaseInvoiceComponent } from './posted-purchase-invoice/posted-purchase-invoice.component';
import { PurchaseOrderModelComponent } from './modals/purchase-order-model/purchase-order-model.component';
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
import { SharedModule } from '../../shared/shared.module';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { PrRfqVendorComponent } from './pr-rfq-vendor/pr-rfq-vendor.component';
import { ChangeAllocationsComponent } from './change-allocations/change-allocations.component';
import { PrepaymentComponent } from './pre-payment/pre-payment.component';
import { CombinedRequisitionComponent } from './combined-requisition/combined-requisition.component';
import { PurchaseRoleCentreComponent } from './purchase-role-centre/purchase-role-centre.component';

@NgModule({
  declarations: [
    PurchaseRequisitionComponent,
    PurchaseQuoteComponent,
    PurchaseOrderComponent,
    PurchaseInvoiceComponent,
    PostedPurchaseReceiptComponent,
    PostedPurchaseInvoiceComponent,
    PrePaymentPostedPurchaseInvoiceComponent,
    PurchaseOrderModelComponent,
    PRVendorSelectionComponent,
    PRBidWaiverComponent,
    VariationOrderComponent,
    ArchivedPurchaseRequisitionComponent,
    ArchivedPurchaseQuoteComponent,
    ArchivedPurchaseOrderComponent,
    PoGrnPostComponent,
    PoInvoicePostComponent,
    PurchaseCreditMemoComponent,
    PostedpurchaseCreditMemoComponent,
    PurchaseOrderCancelledComponent,
    ApprovedPurchaseRequisitionComponent,
    PurchaseRequisitionCancelledComponent,
    PrRfqVendorComponent,
    ChangeAllocationsComponent,
    PrepaymentComponent,
    CombinedRequisitionComponent,
    PurchaseRoleCentreComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSkeletonLoaderModule,
    PurchaseRoutingModule,
    SharedModule],
  exports: [
    PurchaseOrderModelComponent,
  ],
  providers: [
    ChangeAllocationsComponent,
    PrepaymentComponent
  ],
})
export class PurchaseModule { }
