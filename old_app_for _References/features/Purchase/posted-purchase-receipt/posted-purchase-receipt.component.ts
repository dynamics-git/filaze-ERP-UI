import { Component, OnInit } from '@angular/core';

import { ArchivedPurchaseOrderHeader, ArchivedPurchaseOrderLine, ArchivedPurchaseOrderCalculation } from '../archived-purchase-order/archived-purchase-order.config';
import { ArchivedPurchaseQuoteHeader, ArchivedPurchaseQuoteLine } from '../archived-purchase-quote/archived-purchase-quote.config';
import { PurchaseInvoiceCalculation } from '../purchase-invoice/purchase-invoice.config';
import { PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../purchase-requisition/purchase-requisition.config';
import { PostedPurchaseReceiptHeader, PostedPurchaseReceiptLine, PurchaseReceiptCalculation } from './posted-purchase-receipt.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-posted-purchase-receipt',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class PostedPurchaseReceiptComponent {
  Quantity!: number;

  constructor(
    private addItemService: AddItemService,
    private formDataService: FormDataService,

  ) {
  }

  config: DataTableConfig = {
    title: 'Posted Purchase Receipt',
    idProp: 'Id',
    headerApi: '/postedPurchRcptHeaders',
    pageName: 'POSTED PURCHASE RECEIPT',
    showCreate: false,
    headerApiOrderByField: 'No',
    filterByUserCompanyResCenter: true,
    showDelete: false,
    showEdit: false,
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
              calculationSectionConfig: PurchaseInvoiceCalculation,
              informationSectionConfig: {
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
        name: 'Remark',
        prop: 'Remark',
      }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Posted Purchase Receipt',
      recordId: "No",
      recordTitle: "BuyFromVendorName",
      headerConfig: PostedPurchaseReceiptHeader,
      lineConfig: PostedPurchaseReceiptLine,
      calculationSectionConfig: PurchaseReceiptCalculation,

    }
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Purchase Order',
      name: 'Purchase Order',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/order',
    },
    {
      label: 'PR Bid Waiver',
      name: 'PR Bid Waiver',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/PRBidWaiver',
    },
    {
      label: 'PR Vendor Selection',
      name: 'PR Vendor Selection',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/PR-Vender-Selection'
    },
    {
      label: 'Purchase Quote',
      name: 'Purchase Quote',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/quote'
    },
    {
      label: 'Variation Order',
      name: 'Variation Order',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/variation-order'
    },
    {
      label: 'GRN',
      name: 'GRN',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/receipt',
      isEnable: false
    },
    {
      label: 'Non-PO Purchase Invoice',
      name: 'Non-PO Purchase Invoice',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/invoice'
    },
    {
      label: 'Purchase Credit Memo',
      name: 'Purchase Credit Memo',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/purchase-Credit-Memo'
    },
  ];

  popupLoaded(data: any) {
    this.addItemService.enableOrDisableAllControls$.next(false);
    const lineData = data.line;
    this.Quantity = 0;

    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.Quantity += line['Quantity'] ? +line['Quantity'] : 0;
      });
      console.log(this.Quantity);

    }
    this.formDataService.updateControlData$.next({ control: 'totalQuantity', data: this.Quantity });

  }

}
