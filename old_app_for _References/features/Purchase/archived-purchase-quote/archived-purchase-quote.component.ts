import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { PurchaseRequisitionCalculation, PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../purchase-requisition/purchase-requisition.config';
import { ArchivedPurchaseQuoteHeader, ArchivedPurchaseQuoteLine, ArchivedPurchaseQuoteCalculation } from './archived-purchase-quote.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { SessionService } from '../../../core/services/session.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-purchase-quote',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class ArchivedPurchaseQuoteComponent {

  config: DataTableConfig = {
    title: 'Archived Purchase Quote',
    idProp: 'Id',
    headerApi: '/pqArchives',
    showCreate: false,
    pageName: 'ArchivedPQ',
    headerApiOrderByField: 'Number',
    filterByUserCompanyResCenter: true,
    showDelete: false,
    headers: [
      {
        name: 'No',
        prop: 'Number',
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
                documentStatusProp: 'ApprovalStatus',
                informationDetailSecctionType: InformationDetailSecctionType.PurchaseRequsition
              }
            }
          }
        ]
      },
      // {
      //     name: 'Requisition No',
      //     prop: 'RequisitionNo'
      // },
      {
        name: 'Vendor No',
        prop: 'BuyFromVendorNumber'
      },
      {
        name: 'Vendor Name',
        prop: 'BuyFromVendorName'
      },
      {
        name: 'City',
        prop: 'BuyFromCity'
      },
      {
        name: 'Country',
        prop: 'BuyFromCountry'
      },

      {
        name: 'Order Date',
        prop: 'OrderDate'
      },
      {
        name: 'Purchaser Code',
        prop: 'PurchaserCode'
      },
      {
        name: 'Status',
        prop: 'Status'
      },
      {
        name: 'Remark',
        prop: 'Remark',
      }
      // {
      //   name: 'Pending Approvers ID',
      //   prop: 'PendingApproversID',
      // }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Archived Purchase Quote',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: ArchivedPurchaseQuoteHeader,
      lineConfig: ArchivedPurchaseQuoteLine,
      calculationSectionConfig: ArchivedPurchaseQuoteCalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Quote',
        documentStatusProp: 'Status',
        informationDetailSecctionType: InformationDetailSecctionType.ArchivedPurchaseQuote
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
      route: '/purchase/prepaymentpostedinvoice'
    },
    {
      label: 'Posted Purchase Credit Memo',
      name: 'Posted Purchase Credit Memo',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/postedpurchase-Credit-Memo',
    },
    {
      label: 'Archived Purchase Quote',
      name: 'Archived Purchase Quote',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/archived-quote',
      isEnable: false
    },
  ];

  chartAccountData: any[] = [];
  itemData: any[] = [];
  fixedAssetData: any[] = [];
  dimentionarr: any[] = [];
  totalAmount: number = 0;
  comments: any[] = [];

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private sessionService: SessionService,
    private emailNotifyService: EmailNotifyService,
  ) {
  }

  popupLoaded(data: any) {
    if (data.header.Status !== 'Open') {
      this.addItemService.enableOrDisableAllControls$.next(false);
    }
    const lineData = data.line;
    console.log(lineData);

    this.totalAmount = 0;
    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;
      });
    };
    this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });

  }
}