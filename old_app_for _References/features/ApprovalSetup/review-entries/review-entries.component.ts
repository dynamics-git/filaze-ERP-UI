import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { RejectReasonComponent } from '../modals/reject-reason/reject-reason.component';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { PurchaseOrderCalculation, PurchaseOrderHeader, PurchaseOrderLine } from '../../Purchase/purchase-order/purchase-order.config';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { VariationOrderCalculation, VariationOrderHeader, VariationOrderLine } from '../../Purchase/variation-order/variation-order.config';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { SessionService } from '../../../core/services/session.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Utility } from '../../../core/services/utility.service';
import { PurchaseOrderComponent } from '../../Purchase/purchase-order/purchase-order.component';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';

@Component({
  standalone: false,
  selector: 'app-review-entries',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>'

})
export class ReviewEntriesComponent implements OnInit {

  config: DataTableConfig = {
    title: 'Review Entries',
    idProp: 'Id',
    headerApi: '/documentReviewEntries',
    headerApiFilterField: 'ApproverID',
    pageName: 'REVIEW ENTRIES',
    filters: [
      {
        field: 'Status',
        operator: 'eq',
        value: "'Open'"
      },
    ],
    headers: [
      // {
      //   name: 'Variation Order',
      //   prop: 'VariationOrder'
      // },
      {
        name: 'Document Type',
        prop: 'DocumentType'
      }, {
        name: 'Document No',
        prop: 'DocumentNo',
        isPrimaryLink: true,
        linkItemConfigs: [
          {
            property: 'DocumentType',
            value: 'Order',
            itemProp: 'Number',
            linkItemType: 'Order',
            itemConfig: {
              title: 'Purchase Order',
              recordId: "Number",
              recordTitle: "Number",
              headerConfig: PurchaseOrderHeader,
              lineConfig: PurchaseOrderLine,
              calculationSectionConfig: PurchaseOrderCalculation,
              informationSectionConfig: {
                documentNoProp: 'Number',
                documentType: 'Order',
                documentStatusProp: 'Status',
                informationDetailSecctionType: InformationDetailSecctionType.PurchaseOrder
              }
            }
          },
          {
            property: 'VariationOrder',
            value: 'true',
            itemProp: 'Number',
            linkItemType: 'Variation Order',
            itemConfig: {
              title: 'Variation Order',
              recordId: "Number",
              recordTitle: "Number",
              headerConfig: VariationOrderHeader,
              lineConfig: VariationOrderLine,
              calculationSectionConfig: VariationOrderCalculation,
              informationSectionConfig: {
                documentNoProp: 'Number',
                documentType: 'Order',
                documentStatusProp: 'Status',
                informationDetailSecctionType: InformationDetailSecctionType.PurchaseOrder
              }
            }
          }
        ]
      }, {
        name: 'Approval Code',
        prop: 'ApprovalCode'
      },
      {
        name: 'Review Type',
        prop: 'ReviewType'
      },
      {
        name: 'Amount',
        prop: 'Amount'
      }, {
        name: 'Status',
        prop: 'Status'
      }],
    selctionType: 'single',
    buttons: [
      {
        label: 'Approve',
        name: 'Approve',
        icon: 'bi bi-check-lg'
      },
      {
        label: 'Reject',
        name: 'Reject',
        icon: 'bi bi-x-circle'
      }
    ],
    showCreate: false,
    showDelete: false
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Approval User Setup',
      name: 'Approval User Setup',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/setup',
    },
    {
      label: 'Approvers Group',
      name: 'Approvers Group',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/approversgroup',
    },
    {
      label: 'Approval Entries',
      name: 'Approval Entries',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/entry',
    },
    {
      label: 'Document Review User Setup',
      name: 'Document Review User Setup',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/review-user-setup',
    },
    {
      label: 'Review Entries',
      name: 'Review Entries',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/review-entry',
      isEnable: false
    },
    {
      label: 'Budget Request',
      name: 'Budget Request',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/budget-request',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private restService: RestService,
    private toastr: ToastrService,
    private modal: NgbModal,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private sessionService: SessionService,
    private emailNotifyService: EmailNotifyService,
    private router: Router,
    private addItemService: AddItemService,
    private utility: Utility,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private selectedItemService: SelectedItemService
  ) {
  }
  purchaseOrderObj!: PurchaseOrderComponent;

  ngOnInit() {
    this.purchaseOrderObj = new PurchaseOrderComponent(this.restService, this.toastr, this.modal, this.formFielService, this.formDataService, this.addItemService, this.datePipe, this.utility, this.sessionService, this.emailNotifyService, this.selectedItemService);
  }

  popupLoaded(data: any) {
    if (data.linkItemType === 'Order') {
      this.purchaseOrderObj.popupLoaded(data);
    } else { }

  }

  changeEvent(data: EventDataModel) {
    if (data.linkItemType === 'Order') {
      this.purchaseOrderObj.changeEvent(data);
    }

  }

  buttonClickEvent(buttonData: CustomButtonEvent) {
    ///////////
    if (buttonData.linkItemType === 'Order') {
      this.purchaseOrderObj.buttonClickEvent(buttonData);
    }

    //////////
    ////7_12_21
    const modalRef = this.modal.open(RejectReasonComponent, { backdrop: 'static' });
    modalRef.result.then((result) => {
      console.log(result);
      ////7_12_21
      let url: string = '';
      if (buttonData.section === SectionType.List && buttonData.button.label === 'Approve') {
        this.addItemService.showLoader$.next(true);
        if (buttonData.data.ReviewType === 'GRN Review') {
          url = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.approveGrnReview';
        } else if (buttonData.data.ReviewType === 'Invoice Review') {
          url = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.approveInvoiceReview';
        } else if (buttonData.data.ReviewType === 'Variation Order') {
          url = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.rejectVariationOrder';
        }
        this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
          this.toastr.success('Approved!');
          this.logfunc(buttonData, buttonData.button.label, result);

          // this.sendmail(buttonData, buttonData.button.label, buttonData.data.ReviewType);
        }, error => {
          this.toastr.error('Failed to approve!');
          this.addItemService.showLoader$.next(false);
        });
      } else if (buttonData.section === SectionType.List && buttonData.button.label === 'Reject') {
        this.addItemService.showLoader$.next(true);
        if (buttonData.data.ReviewType === 'GRN Review') {
          url = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.rejectGrnReview';
        } else if (buttonData.data.ReviewType === 'Invoice Review') {
          url = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.rejectInvoiceReview';
        } else if (buttonData.data.ReviewType === 'Variation Order') {
          url = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.rejectVariationOrder';
        }
        this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
          this.toastr.success('Rejected!');
          this.logfunc(buttonData, buttonData.button.label, result);
        }, error => {
          this.toastr.error('Failed to reject!');
          this.addItemService.showLoader$.next(false);
        });
      }
    });
  }

  ////////7-12-21
  logfunc(buttonData: any, bttn: string, result: string) {
    let updateheaderurl: string;
    let filter: string;
    let patchData: any;
    const ifMatchKey = "*"; // record["@odata.etag"];

    if (buttonData.data.DocumentType == "Order") {
      if (buttonData.data.VariationOrder == false) {
        updateheaderurl = "/purchaseOrderHeaders";
        filter = "?$filter=Number eq '" + buttonData.data.DocumentNo + "'";
        if (buttonData.data.ReviewType == "GRN Review") { patchData = { "GRNReviewerComment": result } }
        else { patchData = { "InvoiceReviewerComment": result } }
      }
      else {
        updateheaderurl = "/variationOrderHeaders";
        filter = "?$filter=Number eq '" + buttonData.data.DocumentNo + "'";
        if (buttonData.data.ReviewType == "GRN Review") { patchData = { "GRNReviewerComment": result } }
        else { patchData = { "InvoiceReviewerComment": result } }
      }

      this.restService.get(updateheaderurl + filter).subscribe((res1: any) => {
        if (res1.value) {
          const query = '(' + res1.value[0][this.config.idProp!] + ')';
          this.restService.patch(updateheaderurl + query, patchData, ifMatchKey).subscribe((response: any) => {
            this.sendmail(buttonData, bttn, buttonData.data.ReviewType);

          });
        }
      });
    }

  }
  ////////7-12-21

  sendmail(buttonData: any, bttn: string, reviewType: string) {
    const url: string = "/documentReviewEntries?$filter=DocumentNo eq '" + buttonData.data.DocumentNo + "' and Status eq 'Open'";
    if (bttn === "Approve") {
      this.restService.get(url).subscribe((response: any) => {
        if (response.value && response.value.length > 0) {
          let senders: string[] = [this.sessionService.Email];
          // let receivers: string[] = [this.sessionService.Email];
          let receivers: string[] = [];
          // let href = this.router.url;
          let href = window.location.href;
          let approvalId: string = response.value[0].ApproverID;

          response.value.forEach((record: any) => {
            // if (record.SenderEmailId && record.SenderEmailId !== '') { //out on 18-2-22
            //   receivers.push(record.SenderEmailId);
            // }
            if (record.ApproverEmailId && record.ApproverEmailId !== '') {
              receivers.push(record.ApproverEmailId);
            }
          });
          if (reviewType == "Invoice Review") {////hossain ask to change bttn action on 22_2_22
            bttn = "InvoiceReview";
          }
          else {
            bttn = "GRNReview";
          }
          this.emailNotifyService.sendNotification(senders, receivers, buttonData.data.DocumentType, buttonData.data.DocumentNo, bttn, buttonData.data.DocumentDate, reviewType, true, false, approvalId, buttonData.data.SendForApprovalId, buttonData.data.prNumber);
        }
        else {
          let senders: string[] = [this.sessionService.Email];
          // let receivers: string[] = [this.sessionService.Email];
          let receivers: string[] = [];
          let href = window.location.href;

          // if (buttonData.data.SenderEmailId && buttonData.data.SenderEmailId !== '') { //out on 18-2-22
          //   receivers.push(buttonData.data.SenderEmailId);
          // }
          // if (buttonData.data.ApproverEmailId && buttonData.data.ApproverEmailId !== '') {
          //   receivers.push(buttonData.data.ApproverEmailId);
          // }
          console.log(buttonData)
          if (buttonData.data.SendForReviewEmailId && buttonData.data.SendForReviewEmailId !== '') {   ////in on 21-2-22
            receivers.push(buttonData.data.SendForReviewEmailId);
          }
          this.emailNotifyService.sendNotification(senders, receivers, buttonData.data.DocumentType, buttonData.data.DocumentNo, bttn, buttonData.data.DocumentDate, reviewType, true, true, '', buttonData.data.SendForReviewId, buttonData.data.prNumber);

        }
      });
    }
    else if (bttn === "Reject") {
      let senders: string[] = [this.sessionService.Email];
      // let receivers: string[] = [this.sessionService.Email];
      let receivers: string[] = [];
      // let href = this.router.url;
      let href = window.location.href;

      // if (buttonData.data.SenderEmailId && buttonData.data.SenderEmailId !== '') {
      //   receivers.push(buttonData.data.SenderEmailId);
      // }
      // if (buttonData.data.ApproverEmailId && buttonData.data.ApproverEmailId !== '') {
      //   receivers.push(buttonData.data.ApproverEmailId);
      // }
      // this.emailNotifyService.sendNotification(senders, receivers, buttonData.data.DocumentType, buttonData.data.DocumentNo,bttn,buttonData.data.documentDate,reviewType,true,false,this.sessionService.UserId,buttonData.data.SendForApprovalId,buttonData.data.prNumber);


      const url: string = "/documentReviewEntries?$filter=DocumentNo eq '" + buttonData.data.DocumentNo + "' and Status eq 'Rejected'";
      this.restService.get(url).subscribe((response: any) => {
        if (response.value && response.value.length > 0) {
          receivers.push(response.value[response.value.length - 1].SendForReviewEmailId);
          this.emailNotifyService.sendNotification(senders, receivers, buttonData.data.DocumentType, buttonData.data.DocumentNo, bttn, buttonData.data.DocumentDate, reviewType, true, false, this.sessionService.UserId, buttonData.data.SendForReviewId, buttonData.data.prNumber);
        }
      });
    }

  }

}
