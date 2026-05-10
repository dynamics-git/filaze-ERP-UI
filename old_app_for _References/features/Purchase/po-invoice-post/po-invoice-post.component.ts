import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { ArchivedPurchaseQuoteHeader, ArchivedPurchaseQuoteLine } from '../archived-purchase-quote/archived-purchase-quote.config';
import { PurchaseQuoteComponent } from '../purchase-quote/purchase-quote.component';
import { PurchaseRequisitionComponent } from '../purchase-requisition/purchase-requisition.component';
import { PurchaseRequisitionCalculation, PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../purchase-requisition/purchase-requisition.config';
import { ReadytoInvCalculation, ReadytoInvHeader, ReadytoInvLine } from './po-invoice-post.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Utility } from '../../../core/services/utility.service';
import { SessionService } from '../../../core/services/session.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';

@Component({
  standalone: false,
  selector: 'app-po-invoice-post',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (buttonClickEvent)="buttonClickEvent($event)"></app-data-table>'

})
export class PoInvoicePostComponent implements OnInit {

  purchaseRequisitionObj!: PurchaseRequisitionComponent;
  purchaseQuoteObj!: PurchaseQuoteComponent;
  totalAmount!: number;

  constructor(
    private restService: RestService,
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

  config: DataTableConfig = {
    title: 'Ready to Invoice',
    idProp: 'Id',
    headerApi: '/purchaseOrderHeaders',
    pageName: 'INVPOST',
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
        field: 'InvoiceReviewStatus',
        operator: 'eq',
        value: "'Reviewed'"
      },
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
        name: 'Remark',
        prop: 'Remark',
      },
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Purchase Order',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: ReadytoInvHeader,
      lineConfig: ReadytoInvLine,
      calculationSectionConfig: ReadytoInvCalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Order',
        documentStatusProp: 'Status',
        informationDetailSecctionType: InformationDetailSecctionType.PurchaseOrder
      }
    }
  };
  ngOnInit(): void {
    this.purchaseRequisitionObj = new PurchaseRequisitionComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility,this.selectedItemService);
    this.purchaseQuoteObj = new PurchaseQuoteComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility,this.selectedItemService);
  }

  popupLoaded(data: any) {
    if (data.linkItemType === 'PR') {
      this.purchaseRequisitionObj.popupLoaded(data);
    } else if (data.linkItemType === 'PQ') {
      this.purchaseQuoteObj.popupLoaded(data);
    } else {

      // this.addItemService.enableOrDisableAllControls$.next(false);
      this.addItemService.disableAllControlsExceptSome$.next(["VendorInvoiceNumber"]);
    }
    const lineData = data.line;
    this.totalAmount = 0;
    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.totalAmount += line['Amount'] ? +line['Amount'] : 0;
      });
    };
    this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });

  }


  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.linkItemType === 'PR') {
      this.purchaseRequisitionObj.buttonClickEvent(buttonData);
    } else if (buttonData.linkItemType === 'PQ') {
      this.purchaseQuoteObj.buttonClickEvent(buttonData);
    }
    else if (buttonData.button.label === 'Post') {
      const urlinvoice: string = '(' + buttonData.data.Id + ')/Microsoft.NAV.postAsInvoice';
      const urlInvUserId: string = '(' + buttonData.data.Id + ')/Microsoft.NAV.getPostInvUserId';
      this.addItemService.showLoader$.next(true);
      const ifMatchKey = "*"; // record["@odata.etag"];
      const query = '(' + buttonData.data.Id + ')';
      let patchData = { "RefNo": buttonData.data.RefNo + 1 }
      this.restService.patch(this.config.addItemConfig!.headerConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
        const payload = {
          userid2: this.sessionService.UserId,
          docNo: buttonData.data.Number,
          resCentre: this.sessionService.DefaultResponsibilityCenter,
          comp: this.sessionService.CompanyName,
          compId: this.sessionService.Company,
        };
        this.restService.post(this.config.headerApi + urlInvUserId, payload).subscribe((response: any) => {
          this.postApi(urlinvoice, urlInvUserId, buttonData);
        }, error => {
          this.toastr.error('Failed to Post Purchase Order!');
          this.addItemService.showLoader$.next(false);
        });

      }, error => {
        this.addItemService.showLoader$.next(false);
      });
    }

  }


  postApi(url: any, Userurl: any, buttonData: CustomButtonEvent, postType?: string) {
    console.log(buttonData);
    console.log(postType);
    console.log(Userurl);

    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {

      const payload = {
        userid2: this.sessionService.UserId,
        docNo: buttonData.data.Number,
        resCentre: this.sessionService.DefaultResponsibilityCenter,
        comp: this.sessionService.CompanyName,
        compId: this.sessionService.Company,
        refNo: buttonData.data.RefNo + 1
      };
      this.restService.post(this.config.headerApi + Userurl, payload).subscribe((response: any) => {
        this.toastr.success('Purchase Order Posted Successfully!');
        this.formDataService.updateControlData$.next({ control: 'GRNReviewStatus', data: 'Open', eventEmit: true });
        let NewQuantityReceived = 0
        this.formDataService.updateControlData$.next({ control: 'QtyToReceive', data: 0, eventEmit: true });
        if (buttonData.lineData) {
          buttonData.lineData.forEach((line: any, rowIndex: number) => {
            NewQuantityReceived = line['QuantityReceived'] + line['QtyToReceive'];
            console.log(NewQuantityReceived);
            this.formDataService.updateLineControlData$.next({ control: 'QuantityReceived', data: NewQuantityReceived.toFixed(2), rowIndex: rowIndex, eventEmit: true });
          });
        }
        this.addItemService.showLoader$.next(false);
      }, error => {
        this.toastr.error('Failed to Post Purchase Order!');
        this.addItemService.showLoader$.next(false);
      });

    }, error => {
      this.toastr.error('Failed to Post Purchase Order!');
      this.addItemService.showLoader$.next(false);
    });

  }
}
