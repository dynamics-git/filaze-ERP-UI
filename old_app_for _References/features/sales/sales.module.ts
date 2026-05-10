import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SalesRoutingModule } from './sales-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SalesInvoiceComponent } from './sales-invoice/sales-invoice.component';
import { PostedSalesInvoiceComponent } from './posted-sales-invoice/posted-sales-invoice.component';
import { PostedsalesCreditMemoComponent } from './postedsales-credit-memo/postedsales-credit-memo.component';
import { SalesCreditMemoComponent } from './sales-credit-memo/sales-credit-memo.component';
import { SalesOrderComponent } from './sales-order/sales-order.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [SalesInvoiceComponent, PostedSalesInvoiceComponent, PostedsalesCreditMemoComponent, SalesCreditMemoComponent, SalesOrderComponent],
  imports: [
    CommonModule,
    SalesRoutingModule,
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
  ]
})
export class SalesModule { }
