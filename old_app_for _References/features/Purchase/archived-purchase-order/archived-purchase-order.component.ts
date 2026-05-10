import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { ArchivedPurchaseQuoteHeader, ArchivedPurchaseQuoteLine } from '../archived-purchase-quote/archived-purchase-quote.config';
import { PurchaseRequisitionCalculation, PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../purchase-requisition/purchase-requisition.config';
import { ArchivedPurchaseOrderHeader, ArchivedPurchaseOrderLine, ArchivedPurchaseOrderCalculation } from './archived-purchase-order.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Utility } from '../../../core/services/utility.service';
import { SessionService } from '../../../core/services/session.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-purchase-order',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class ArchivedPurchaseOrderComponent {

  config: DataTableConfig = {
    title: 'Archived Purchase Order',
    idProp: 'Id',
    headerApi: '/poArchives',
    pageName: 'ArchivedPO',
    showCreate: false,
    headerApiOrderByField: 'Number',
    filterByUserCompanyResCenter: true,
    showDelete: false,
    filters: [
      // {
      //   field: 'VariationOrder',
      //   operator: 'ne',
      //   value: "true"
      // },
    ],
    headers: [
      {
        name: 'No',
        prop: 'Number',
        isPrimaryLink: true
      },
      {
        name: 'Variation Order No',
        prop: 'VariationOrderNo',
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
        prop: 'QuoteNumber',
        isPrimaryLink: true,
        linkItemConfigs: [
          {
            itemProp: 'Number',
            itemConfig: {
              title: 'Purchase Quote',
              recordId: "Number",
              recordTitle: "Number",
              headerConfig: ArchivedPurchaseQuoteHeader,
              lineConfig: ArchivedPurchaseQuoteLine,
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
      // {
      //     name: 'Quote No',
      //     prop: 'QuoteNumber'
      // },
      {
        name: 'Buy-from Vendor No',
        prop: 'BuyFromVendorNumber'
      },
      {
        name: 'Buy-from Vendor Name',
        prop: 'BuyFromVendorName'
      },
      {
        name: 'Assigned UserID',
        prop: 'AssignedUserID'
      },
      {
        name: 'Document Date',
        prop: 'DocumentDate'
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
      isEnable: false
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
      route: '/purchase/postedpurchase-Credit-Memo'
    },
    {
      label: 'Archived Purchase Quote',
      name: 'Archived Purchase Quote',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/archived-quote'
    },
  ];

  chartAccountData: any[] = [];
  itemData: any[] = [];
  fixedAssetData: any[] = [];
  totalAmount: number = 0;
  comments: any;
  rowIndex: number = 0;

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private modal: NgbModal,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    public datepipe: DatePipe,
    private utility: Utility,
    private sessionService: SessionService,
    private emailNotifyService: EmailNotifyService,
  ) {
  }


  popupLoaded(data: any) {
    if (data.header.Status !== 'Open') {
      this.addItemService.enableOrDisableAllControls$.next(false);
      const lineData = data.line;
      this.totalAmount = 0;

      if (lineData) {
        lineData.forEach((line: any) => {
          this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;
        });
      }
      console.log(this.totalAmount);

      this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });

    }
  }
}  
