import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PostedSalesInvoiceComponent } from './posted-sales-invoice/posted-sales-invoice.component';
import { PostedsalesCreditMemoComponent } from './postedsales-credit-memo/postedsales-credit-memo.component';
import { SalesCreditMemoComponent } from './sales-credit-memo/sales-credit-memo.component';
import { SalesInvoiceComponent } from './sales-invoice/sales-invoice.component';
import { SalesOrderComponent } from './sales-order/sales-order.component';


const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'salesInvoice',
        pathMatch: 'full'
      },
      {
        path: 'salesOrder',
        component: SalesOrderComponent
      },
      {
        path: 'salesInvoice',
        component: SalesInvoiceComponent 
      },
      {
        path: 'postedsalesInvoice',
        component: PostedSalesInvoiceComponent 
      },
      {
        path: 'sales-Credit-Memo',
        component: SalesCreditMemoComponent
      },
      {
        path: 'postedsales-Credit-Memo',
        component: PostedsalesCreditMemoComponent
      },
    ],
  }  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalesRoutingModule { }
