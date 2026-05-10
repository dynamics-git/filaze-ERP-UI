import { Component, OnInit } from '@angular/core';

import { ArchivedPurchaseOrderHeader, ArchivedPurchaseOrderLine, ArchivedPurchaseOrderCalculation } from '../archived-purchase-order/archived-purchase-order.config';
import { ArchivedPurchaseQuoteHeader, ArchivedPurchaseQuoteLine, ArchivedPurchaseQuoteCalculation } from '../archived-purchase-quote/archived-purchase-quote.config';
import { PurchaseRequisitionCalculation, PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../purchase-requisition/purchase-requisition.config';
import { PrePaymentPostedPurchaseInvoiceHeader, PrePaymentPostedPurchaseInvoiceLine, PrePaymentPostedPurchaseInvoiceLineCalculation } from './pre-payment-posted-purchase-invoice.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-pre-payment-posted-purchase-invoice',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)"[MenuButtons]="MenuButtons"></app-data-table>'
})
export class PrePaymentPostedPurchaseInvoiceComponent {
  totalAmount!: number;

  constructor(
    private addItemService: AddItemService,
    private formDataService: FormDataService,
  ) {
  }

  config: DataTableConfig = {
    title: 'Posted Purchase Invoice',
    idProp: 'Id',
    headerApi: '/postedPurchInvHeaders',
    pageName: 'PRE-PAYMENT POSTED PURCHASE INVOICE',
    showCreate: false,
    headerApiOrderByField: 'No',
    filterByUserCompanyResCenter: true,
    showDelete: false,
    showEdit: false,
    filters: [
      {
        field: 'PrepaymentInvoice',
        operator: 'eq',
        value: "true"
      }
    ],
    headers: [
      {
        name: 'No',
        prop: 'No',
        isPrimaryLink: true
      },
      {
        name: 'Requisition No',
        prop: 'RequisitionNo',
        isPrimaryLink: true,
        linkItemConfigs: [
          {
            itemProp: 'Number',
            itemConfig: {
              title: 'Purchase Requisition',
              recordId: "Number",
              recordTitle: "Number",
              headerConfig: PurchaseRequisitionHeader,
              lineConfig: PurchaseRequisitionLine,
              calculationSectionConfig: PurchaseRequisitionCalculation,
              informationSectionConfig: {
                documentNoProp: 'Number',
                documentType: 'Requisition',
                documentStatusProp: 'ApprovalStatus',
                informationDetailSecctionType: InformationDetailSecctionType.PurchaseRequsition
              }
            }
          }
        ]
      },
      {
        name: 'Quote No',
        prop: 'QuoteNo',
        isPrimaryLink: true,
        linkItemConfigs: [
          {
            itemProp: 'Number',
            itemConfig: {
              title: 'Archived Purchase Quote',
              recordId: "Number",
              recordTitle: "Number",
              headerConfig: ArchivedPurchaseQuoteHeader,
              lineConfig: ArchivedPurchaseQuoteLine,
              // calculationSectionConfig: ArchivedPurchaseQuoteCalculation,
              informationSectionConfig: {
                documentNoProp: 'Number',
                documentType: 'Quote',
                documentStatusProp: 'Status',
                informationDetailSecctionType: InformationDetailSecctionType.ArchivedPurchaseQuote
              }
            }
          }
        ]
      },
      {
        name: 'Order No',
        prop: 'OrderNo',
        isPrimaryLink: true,
        linkItemConfigs: [
          {
            itemProp: 'Number',
            itemConfig: {
              title: 'Archived Purchase Order',
              recordId: "Number",
              recordTitle: "Number",
              headerConfig: ArchivedPurchaseOrderHeader,
              lineConfig: ArchivedPurchaseOrderLine,
              calculationSectionConfig: ArchivedPurchaseOrderCalculation,
              informationSectionConfig: {
                documentNoProp: 'Number',
                documentType: 'Order',
                documentStatusProp: 'Status',
                informationDetailSecctionType: InformationDetailSecctionType.PurchaseOrder
              }
            }
          }
        ]
      },
      {
        name: 'Vendor No',
        prop: 'BuyFromVendorNo'
      },
      {
        name: 'Vendor Name',
        prop: 'BuyFromVendorName'
      },
      // {
      //     name: 'Location Code',
      //     prop: 'LocationCode'
      // },
      {
        name: 'Document Date',
        prop: 'DocumentDate'
      },
      {
        name: 'Prepayment Order No',
        prop: 'PrepaymentOrderNo'
      },
      {
        name: 'Remark',
        prop: 'Remark',
      }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Posted Purchase Invoice',
      recordId: "No",
      recordTitle: "BuyFromVendorName",
      headerConfig: PrePaymentPostedPurchaseInvoiceHeader,
      lineConfig: PrePaymentPostedPurchaseInvoiceLine,
      calculationSectionConfig: PrePaymentPostedPurchaseInvoiceLineCalculation,
      informationSectionConfig: {
        documentNoProp: 'No',
        documentType: 'Invoice',
        documentStatusProp: 'Status',
        informationDetailSecctionType: InformationDetailSecctionType.PurchaseInvoice
      }
    }
  };


  MenuButtons: Menubuttons[] = [
    {
      label: 'Purchase Order Cancelled',
      name: 'Purchase Order Cancelled',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/order-cancelled',
    },
    {
      label: 'Archived Purchase Order',
      name: 'Archived Purchase Order',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/archived-order',
    },
    {
      label: 'Posted Purchase Invoice',
      name: 'Posted Purchase Invoice',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/postedinvoice'
    },
    {
      label: 'Posted Purchase Invoice',
      name: 'Posted Purchase Invoice',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/prepaymentpostedinvoice',
      isEnable: false
    },
    {
      label: 'Posted Purchase Credit Memo',
      name: 'Posted Purchase Credit Memo',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/postedpurchase-Credit-Memo'
    },
    {
      label: 'Archived Purchase Quote',
      name: 'Archived Purchase Quote',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/archived-quote'
    },
  ];
  popupLoaded(data: any) {
    this.totalAmount = 0;
    console.log(data);
    const lineData = data.line;
    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;
      });
      this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    }
    this.addItemService.enableOrDisableAllControls$.next(false);

  }

}
