import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { ArchivedPurchaseQuoteHeader, ArchivedPurchaseQuoteLine } from '../archived-purchase-quote/archived-purchase-quote.config';
import { PurchaseQuoteComponent } from '../purchase-quote/purchase-quote.component';
import { PurchaseRequisitionComponent } from '../purchase-requisition/purchase-requisition.component';
import { PurchaseRequisitionCalculation, PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../purchase-requisition/purchase-requisition.config';
import { PurchaseOrderCancelledCalculation, PurchaseOrderCancelledHeader, PurchaseOrderCancelledLine } from './purchase-order-cancelled.config';
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
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';

@Component({
  standalone: false,
  selector: 'app-purchase-order-cancelled',
  template: '<app-data-table [config]="config" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class PurchaseOrderCancelledComponent implements OnInit {

  config: DataTableConfig = {
    title: 'Purchase Order Cancelled',
    idProp: 'Id',
    headerApi: '/purchaseOrderHeaders',
    pageName: 'POC',
    showCreate: false,
    headerApiOrderByField: 'Number',
    filterByUserCompanyResCenter: true,
    showDelete: false,
    filters: [
      {
        field: 'VariationOrder',
        operator: 'ne',
        value: "true"
      },
      {
        field: 'ManualPOCancel',
        operator: 'eq',
        value: "true"
      }
    ],
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
            linkItemType: 'PR',
            itemConfig: {
              title: 'Archived Purchase Requisition',
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
            linkItemType: 'PQ',
            itemConfig: {
              title: 'Archived Purchase Quote',
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
        name: 'Pending Approvers ID',
        prop: 'PendingApproversID',
      },
      {
        name: 'PO Cancel User Id',
        prop: 'POCancelUserID',
      },
      {
        name: 'Remark',
        prop: 'Remark',
      },
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Purchase Order',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: PurchaseOrderCancelledHeader,
      lineConfig: PurchaseOrderCancelledLine,
      calculationSectionConfig: PurchaseOrderCancelledCalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Order',
        documentStatusProp: 'Status',
        informationDetailSecctionType: InformationDetailSecctionType.PurchaseOrderCancelled
      }
    }
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Purchase Order Cancelled',
      name: 'Purchase Order Cancelled',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/order-cancelled',
      isEnable: false
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
  totalAmountToInvoice: number = 0;
  totalAmountInvoiced: number = 0;
  comments: any;
  purchaseRequisitionObj!: PurchaseRequisitionComponent;
  purchaseQuoteObj!: PurchaseQuoteComponent;
  headerData: any;
  rowIndex!: number;
  QtyToReceive!: boolean;
  changeQtyToInvoice!: boolean;
  PendingApproversID: any;
  PendingApproversEmailId: any;

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
    private selectedItemService: SelectedItemService
  ) {
  }

  ngOnInit(): void {
    this.purchaseRequisitionObj = new PurchaseRequisitionComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility, this.selectedItemService);
    this.purchaseQuoteObj = new PurchaseQuoteComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility, this.selectedItemService);
  }

}
