import { ChangeDetectorRef, Component, OnInit, ApplicationRef, NgZone } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { BudgetRequestHeadedr, BudgetRequestLine } from '../budget-request/budget-request.config';
import { ClaimJournalHeader, ClaimJournalLine } from '../../Journal/journal-claim/journal-claim.config';
import { RejectReasonComponent } from '../modals/reject-reason/reject-reason.component';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { PurchaseRequisitionCalculation, PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../../Purchase/purchase-requisition/purchase-requisition.config';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { SalesInvoicecalculation, SalesInvoiceLine, SalesInvoiveHeader } from '../../sales/sales-invoice/sales-invoice.config';
import { PRBidWaiverCalculation, PRBidWaiverHeader, PRBidWaiverLine } from '../../Purchase/pr-bid-waiver/PR-Bid-Waiver.config';
import { PurchaseInvoiceCalculation, PurchaseInvoiceHeader, PurchaseInvoiceLine } from '../../Purchase/purchase-invoice/purchase-invoice.config';
import { PurchaseQuoteHeader, PurchaseQuoteLine } from '../../Purchase/purchase-quote/purchase-quote.config';
import { PurchaseOrderCalculation, PurchaseOrderHeader, PurchaseOrderLine } from '../../Purchase/purchase-order/purchase-order.config';
import { PurchaseRequisitionComponent } from '../../Purchase/purchase-requisition/purchase-requisition.component';
import { BudgetRequestComponent } from '../budget-request/budget-request.component';
import { SalesInvoiceComponent } from '../../sales/sales-invoice/sales-invoice.component';
import { JournalClaimComponent } from '../../Journal/journal-claim/journal-claim.component';
import { PRBidWaiverComponent } from '../../Purchase/pr-bid-waiver/pr-bid-waiver.component';
import { PurchaseInvoiceComponent } from '../../Purchase/purchase-invoice/purchase-invoice.component';
import { ChangeAllocationsComponent } from '../../Purchase/change-allocations/change-allocations.component';
import { PrepaymentComponent } from '../../Purchase/pre-payment/pre-payment.component';
import { PurchaseQuoteComponent } from '../../Purchase/purchase-quote/purchase-quote.component';
import { PurchaseOrderComponent } from '../../Purchase/purchase-order/purchase-order.component';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { SessionService } from '../../../core/services/session.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Utility } from '../../../core/services/utility.service';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { ListTableConfig } from '../../../core/models/shared/list-table.config';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';
import { firstValueFrom, take } from 'rxjs';
import { UniversalPopupService } from '../../../core/services/shared/universal-popup.service';
import { CustomSharedService } from '../../../core/services/shared/custom-shared.service';
import { FilterField } from '../../../core/models/shared/filter.model';
import { EmployeeClaimComponent } from '../../claim/employee-claim/employee-claim.component';
import { ClaimPaymentCalculation, ClaimPaymentHeader, ClaimPaymentLine } from "../../claim/claim-payments/claim-payments.config";
import { EmployeeClaimCalculation, EmployeeClaimHeader, EmployeeClaimLime } from "../../claim/employee-claim/employee-claim.config";
import { ApprovalEntryHeader } from './approval-entry.config';
import { DataTableService } from '../../../core/services/shared/data-table.service';
import { ModuleRegistry } from '../../../core/models/registry/module-registry';
import { DrawerService } from '../../../layout/shell/header/elements/drawer/drawer.service';
import { SelectedRowIndexService } from '../../../core/services/shared/selected-row-index.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';

@Component({
  standalone: false,
  selector: 'app-approval-entry',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class ApprovalEntryComponent implements OnInit {
  config: DataTableConfig = {
    title: 'Approval Entries',
    idProp: 'id',
    headerApi: '/approvalEntries',
    pageName: 'APPROVAL ENTRIES',
    showCreate: false,
    showDelete: false,
    filters: [
      {
        field: 'Status',
        operator: 'eq',
        value: "'Open'"
      },
      {
        field: 'ApproverID',
        operator: 'eq',
        value: `'${this.sessionService.UserId}'`
      }
    ],
    headers: [{ prop: 'entryNo', name: 'Entry No', },
    // { prop: 'documentNo', name: 'Document No.', isPrimaryLink: true },
    { prop: 'documentType', name: 'Document Type' },
    {
      name: 'Document No',
      prop: 'documentNo',
      isPrimaryLink: true,
    },
    { prop: 'sequenceNo', name: 'Sequence No' },
    { prop: 'senderId', name: 'Sender ID' },
    { prop: 'senderEmailId', name: 'Sender Email' },
    { prop: 'approverId', name: 'Approve ID' },
    { prop: 'approverEmailId', name: 'Approve Email' },
    { prop: 'status', name: 'Status' },
    { prop: 'dateTimeSentForApproval', name: 'Send Date', isDate: true },
    { prop: 'lastDateTimeModified', name: 'Action Date', isDate: true },
    { prop: 'amount', name: 'Amount' },
    { prop: 'limitType', name: 'Limit Type' },
    { prop: 'delegateTo', name: 'Delegate' },
    { prop: 'submissionNo', name: 'Submission No' },
    { prop: 'actionComment', name: 'Comment' },
    ],
    addItemConfig: {
      title: 'Approval Entries',
      recordId: 'entryNo',
      recordTitle: 'documentType',
      headerConfig: ApprovalEntryHeader,
    },
    selctionType: 'single',
    removeUnicodeCharFields: ['DocumentType']
  };


  filterOptions: FilterField[] = [

    {
      field: 'documentType',
      label: 'Document Type',
      type: 'dropdown',
      options: [
        {
          value: 'Requisition',
          label: 'Purchase Requisition',
        },
        {
          value: 'Quote',
          label: 'Purchase Quote'
        },
        {
          value: 'Order',
          label: 'Purchase Order',
        },
        {
          value: 'Invoice',
          label: 'Invoice'
        },
        {
          value: 'Petty Cash',
          label: 'Petty Cash',
        },
        {
          value: 'Sales Invoice',
          label: 'Sales Invoice',
        },
        {
          value: 'Budget',
          label: 'Budget Request',
        },
        {
          value: 'BW Requisition',
          label: 'BW Requisition',
        },
        {
          value: 'Employee Claim',
          label: 'Employee Claim',
        },
        {
          value: 'Finance Claim',
          label: 'Finance Claim',
        },
        {
          value: 'Claim Payment',
          label: 'Claim Payment',
        },
      ],
    },
    {
      field: 'DocumentNo',
      label: 'Document No',
      type: 'text'
    },
    {
      field: 'status',
      label: 'Status',
      type: 'dropdown',
      options: [
        { label: 'Open', value: 'Open' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' }
      ]
    },
    {
      field: 'senderId',
      label: 'Sender Id',
      type: 'text'
    },
    {
      field: 'approverId',
      label: 'Approver Id',
      type: 'text'
    },
    // {
    //   field: 'dateTimeSentForApproval',
    //   label: 'Send Date',
    //   type: 'date'
    // }
  ];


  MenuButtons: Menubuttons[] = [
    {
      label: 'Approved',
      name: 'Approved',
      icon: 'bi bi-check',
      fn: () => this.Approved(),
    },
    {
      label: 'Reject',
      name: 'Reject',
      icon: 'bi bi-x',
      fn: () => this.ApprovalReject(),
    },
  ];

  chartAccountData: any[] = [];
  itemData: any[] = [];
  fixedAssetData: any[] = [];
  purchaseRequisitionObj!: PurchaseRequisitionComponent;
  budgetRequestObj!: BudgetRequestComponent;
  salesInvoiceObj!: SalesInvoiceComponent;
  journalClaimObj!: JournalClaimComponent;
  prBidWaiverObj!: PRBidWaiverComponent;
  purchaseInvoiceObj!: PurchaseInvoiceComponent;
  purchaseQuoteObj!: PurchaseQuoteComponent;
  purchaseOrderObj!: PurchaseOrderComponent;
  empClaimObj!: EmployeeClaimComponent;

  constructor(private fb: FormBuilder,
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
    private selectedItemService: SelectedItemService,
    private dialogService: UnifiedDialogService,
    private universalPopupService: UniversalPopupService,
    private customSharedService: CustomSharedService,
    private datepipe: DatePipe,
    private modalService: NgbModal,
    private appRef: ApplicationRef,
    private ngZone: NgZone,
    private dataTableService: DataTableService,
    private drawerService: DrawerService,
    private selectedRowIndexService: SelectedRowIndexService
  ) {
  }

  ngOnInit() {
    this.purchaseRequisitionObj = new PurchaseRequisitionComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility, this.selectedItemService);
    this.budgetRequestObj = new BudgetRequestComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.emailNotifyService, this.utility, this.sessionService);
    this.salesInvoiceObj = new SalesInvoiceComponent(this.restService, this.toastr, this.modal, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility);
    this.journalClaimObj = new JournalClaimComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.utility, this.sessionService, this.emailNotifyService);
    this.prBidWaiverObj = new PRBidWaiverComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility);
    this.purchaseInvoiceObj = new PurchaseInvoiceComponent(this.restService, this.toastr, this.modal, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility, this.selectedItemService, this.universalPopupService, this.customSharedService, this.dialogService, this.selectedRowIndexService, new ChangeAllocationsComponent(this.formDataService, this.restService, this.toastr, this.dialogService, this.addItemService), new PrepaymentComponent(this.formDataService, this.restService, this.toastr, this.dialogService, this.addItemService));
    this.purchaseQuoteObj = new PurchaseQuoteComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility, this.selectedItemService);
    this.purchaseOrderObj = new PurchaseOrderComponent(this.restService, this.toastr, this.modal, this.formFielService, this.formDataService, this.addItemService, this.datePipe, this.utility, this.sessionService, this.emailNotifyService, this.selectedItemService);
    this.empClaimObj = new EmployeeClaimComponent(this.formDataService, this.addItemService, this.restService, this.toastr, this.utility, this.datepipe, this.sessionService, this.modalService, this.formFielService, this.selectedItemService, this.appRef, this.ngZone, this.universalPopupService, this.dialogService);


    if (this.config?.headers?.length) {
      const documentColumn = this.config.headers.find(
        col => col.prop === 'documentNo'
      );

      if (documentColumn) {
        documentColumn.linkItemConfigs = getLinkItemConfigs();
      }
    }

  }

  popupLoaded(data: any) {
    if (data.linkItemType === 'Requisition') {
      this.purchaseRequisitionObj.popupLoaded(data);
    } else if (data.linkItemType === 'Budget') {
      this.budgetRequestObj.popupLoaded(data);
    } else if (data.linkItemType === 'Sales Invoice') {
      this.salesInvoiceObj.popupLoaded(data);
    } else if (data.linkItemType === 'Petty Cash') {
      this.journalClaimObj.popupLoaded(data);
    } else if (data.linkItemType === 'BW Requisition') {
      this.prBidWaiverObj.popupLoaded(data);
    } else if (data.linkItemType === 'Invoice') {
      this.purchaseInvoiceObj.popupLoaded(data);
    } else if (data.linkItemType === 'Quote') {
      this.purchaseQuoteObj.popupLoaded(data);
    } else if (data.linkItemType === 'Order') {
      this.purchaseOrderObj.popupLoaded(data);
    } else if (data.linkItemType === 'Employee Claim') {
      this.empClaimObj.popupLoaded(data);
    } else {
      const lineData = data.line;
      if (lineData) {
        lineData.forEach((line: any, rowIndex: number) => {
          switch (line.PurchaseRequisitionType) {
            case 'G/L Account':
              this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: rowIndex });
              if (this.chartAccountData) {
                this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
                }, 100);
              } else {
                this.restService.get('/glAccounts').subscribe((response: any) => {
                  this.chartAccountData = response.value;
                  this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
                  setTimeout(() => {
                    this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
                  }, 100);
                });
              }
              break;
            case 'Item':
              this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: rowIndex });
              if (this.itemData) {
                this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
                }, 100);
              } else {
                this.restService.get('/Items').subscribe((response: any) => {
                  this.itemData = response.value;
                  this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
                  setTimeout(() => {
                    this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
                  }, 100);
                });
              }
              break;
            case 'Fixed Asset':
              this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: rowIndex });
              if (this.fixedAssetData) {
                this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
                }, 100);
              } else {
                this.restService.get('/fixedAssets').subscribe((response: any) => {
                  this.fixedAssetData = response.value;
                  this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
                  setTimeout(() => {
                    this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
                  }, 100);
                });
              }
              break;
            default:
              this.formDataService.disableLineControl$.next({ label: 'Number', rowIndex: rowIndex });
              break;
          }
        });
      }
    }
  }

  changeEvent(data: EventDataModel) {
    if (data.linkItemType === 'Requisition') {
      this.purchaseRequisitionObj.changeEvent(data);
    } else if (data.linkItemType === 'Budget') {
      this.budgetRequestObj.changeEvent(data);
    } else if (data.linkItemType === 'Sales Invoice') {
      this.salesInvoiceObj.changeEvent(data);
    } else if (data.linkItemType === 'Petty Cash') {
      this.journalClaimObj.changeEvent(data);
    } else if (data.linkItemType === 'BW Requisition') {
      this.prBidWaiverObj.changeEvent(data);
    } else if (data.linkItemType === 'Invoice') {
      this.purchaseInvoiceObj.changeEvent(data);
    } else if (data.linkItemType === 'Quote') {
      this.purchaseQuoteObj.changeEvent(data);
    } else if (data.linkItemType === 'Order') {
      this.purchaseOrderObj.changeEvent(data);
    } else if (data.linkItemType === 'Employee Claim') {
      this.empClaimObj.changeEvent(data);
    } else {
      if (data.section == SectionType.Line) {
        switch (data.control) {
          case 'PurchaseRequisitionType':
            this.changePurchaseRequisitionType(data);
            break;
          case 'Number':
            this.changeItemNo(data);
            break;
          case 'Quantity':
          case 'UnitPrice':
            this.calculateAmount(data);
            break;
        }
      }
    }
  }

  changePurchaseRequisitionType(data: EventDataModel) {
    this.formDataService.updateLineControlData$.next({ control: 'Number', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'Description', data: null, rowIndex: data.rowIndex });
    switch (data.data) {
      case 'G/L Account':
        this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: data.rowIndex! });
        if (this.chartAccountData) {
          this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/glAccounts').subscribe((response: any) => {
            this.chartAccountData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case 'Item':
        this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: data.rowIndex! });
        if (this.itemData) {
          this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/Items').subscribe((response: any) => {
            this.itemData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case 'Fixed Asset':
        this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: data.rowIndex! });
        if (this.fixedAssetData) {
          this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/fixedAssets').subscribe((response: any) => {
            this.fixedAssetData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      default:
        this.formDataService.disableLineControl$.next({ label: 'Number', rowIndex: data.rowIndex! });
        break;
    }
  }

  changeItemNo(data: EventDataModel) {
    const purchaseRequisitionType = data.activeData.PurchaseRequisitionType;
    switch (purchaseRequisitionType) {
      case 'G/L Account':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Name, rowIndex: data.rowIndex, eventEmit: true });
        break;
      case 'Item':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        break;
      case 'Fixed Asset':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        break;
    }
  }

  calculateAmount(data: EventDataModel) {
    const quantity = data.control === 'Quantity' ? data.data : data.activeData.Quantity;
    const unitPrice = data.control === 'UnitPrice' ? data.data : data.activeData.UnitPrice;
    let amount = 0;
    if (quantity && unitPrice) {
      amount = +quantity * +unitPrice;
    }
    this.formDataService.updateLineControlData$.next({ control: 'Amount', data: amount, rowIndex: data.rowIndex, eventEmit: true });
  }

  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.linkItemType === 'Requisition') {
      this.purchaseRequisitionObj.buttonClickEvent(buttonData);
    } else if (buttonData.linkItemType === 'Budget') {
      this.budgetRequestObj.buttonClickEvent(buttonData);
    } else if (buttonData.linkItemType === 'Sales Invoice') {
      this.salesInvoiceObj.buttonClickEvent(buttonData);
    } else if (buttonData.linkItemType === 'Petty Cash') {
      this.journalClaimObj.buttonClickEvent(buttonData);
    } else if (buttonData.linkItemType === 'BW Requisition') {
      this.prBidWaiverObj.buttonClickEvent(buttonData);
    } else if (buttonData.linkItemType === 'Invoice') {
      this.purchaseInvoiceObj.buttonClickEvent(buttonData);
    } else if (buttonData.linkItemType === 'Quote') {
      this.purchaseQuoteObj.buttonClickEvent(buttonData);
    } else if (buttonData.linkItemType === 'Order') {
      this.purchaseOrderObj.buttonClickEvent(buttonData);
    } else if (buttonData.linkItemType === 'Employee Claim') {
      this.empClaimObj.buttonClickEvent(buttonData);
    } else {
      if (buttonData.button.label === 'SendApprovalRequest') {
        const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendPurchaseRequisitionApproval';
        this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
          this.toastr.success('Sent Approval Request!');
          this.formDataService.updateControlData$.next({ control: 'ApprovalStatus', data: 'Pending' });
        }, error => {
          this.toastr.error('Failed to send Approval Request!');
        });
      } else if (buttonData.button.label === 'CancelApprovalRequest') {
        const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelPurchaseRequsitionApproval';
        this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
          this.toastr.success('Sent Cancel Request!');
        }, error => {
          this.toastr.error('Failed to send Cancel Request!');
        });
      } else if (buttonData.section === SectionType.List && buttonData.button.label === 'Approve') {
        const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.approvePurchaseRequisition';
        // this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.Approvedrejectlog(buttonData, "Approve", url);
        //    this.toastr.success('Approved!');
        // }, error => {
        //   this.toastr.error('Failed to approve!');
        // });
      } else if (buttonData.section === SectionType.List && buttonData.button.label === 'Reject') {
        const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.rejectPurchaseRequisition';
        // let updateheaderurl:string;
        // let filter:string;
        // this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.Approvedrejectlog(buttonData, "Reject", url);

        // const modalRef = this.modal.open(RejectReasonComponent);
        // modalRef.result.then((result) => {
        //   console.log(result);
        //   const ifMatchKey = "*"; // record["@odata.etag"];
        //   let patchData = { "RejectReason": result }
        //   if(buttonData.data.DocumentType == "Requisition"){
        //     updateheaderurl = "/purchaseRequisitionHeaders";
        //     filter = "?$filter=Number eq '"+buttonData.data.DocumentNo+"'"
        //   }
        //   this.restService.get(updateheaderurl+filter).subscribe((res1: any) => {
        //   if(res1.value){
        //   const query = '(' + res1.value[0][this.config.idProp] + ')';
        //   this.restService.patch(updateheaderurl + query, patchData, ifMatchKey).subscribe((response: any) => {
        //   });
        // }
        // });

        // this.toastr.success('Rejected!');
        // });
        // }, error => {
        //   this.toastr.error('Failed to reject!');
        // });
      }
    }
  }

  Approvedrejectlog(buttonData: any, bttn: string, url: string) {
    ////////11-10-21
    const modalRef = this.modal.open(RejectReasonComponent, { backdrop: 'static' });
    modalRef.result.then((result) => {
      this.addItemService.showLoader$.next(true);
      if (bttn === "Approve") {
        this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
          this.toastr.success('Approved!');
          this.logfunc(buttonData, bttn, result);
        }, error => {
          this.toastr.error('Failed to approve!');
          this.addItemService.showLoader$.next(false);
        });
      }
      else if (bttn === "Reject") {
        this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
          this.toastr.success('Rejected!');
          this.logfunc(buttonData, bttn, result);
        }, error => {
          this.toastr.error('Failed to reject!');
          this.addItemService.showLoader$.next(false);

        });
      }
    });
    /////////11-10-21
  }

  logfunc(buttonData: any, bttn: string, result: string) {
    let updateheaderurl: string;
    let filter: string;
    let updateurl = "/approversCommentLogs";
    let logBody = {
      "DocumentType": buttonData.data.DocumentType,
      "DocumentNo": buttonData.data.DocumentNo,
      "ApprovalCode": buttonData.data.ApprovalCode,
      "SenderID": buttonData.data.SenderID,
      "ApproverID": buttonData.data.ApproverID,
      "Status": buttonData.data.Status,
      "Amount": buttonData.data.Amount,
      "Comment": result,
    }
    console.log(logBody);
    this.restService.post(updateurl, logBody).subscribe((response: any) => {

    });

    ////////12-10-21
    const ifMatchKey = "*"; // record["@odata.etag"];
    let patchData = { "RejectReason": result }
    if (buttonData.data.DocumentType == "Requisition") {
      updateheaderurl = "/purchaseRequisitionHeaders";
      filter = "?$filter=Number eq '" + buttonData.data.DocumentNo + "'"
    } else if (buttonData.data.DocumentType == "BW Requisition") {
      updateheaderurl = "/bwRequisitionHeaders";
      filter = "?$filter=Number eq '" + buttonData.data.DocumentNo + "'"
    } else if (buttonData.data.DocumentType == "Quote") {
      updateheaderurl = "/purchaseQuoteHeaders";
      filter = "?$filter=Number eq '" + buttonData.data.DocumentNo + "'"
    } else if (buttonData.data.DocumentType == "Order") {
      updateheaderurl = "/purchaseOrderHeaders";
      filter = "?$filter=Number eq '" + buttonData.data.DocumentNo + "'"
    } else if (buttonData.data.DocumentType == "Variation Order") {
      updateheaderurl = "/variationOrderHeaders";
      filter = "?$filter=Number eq '" + buttonData.data.DocumentNo + "'"
    } else if (buttonData.data.DocumentType == "Invoice") {
      updateheaderurl = "/purchaseInvoiceHeaders";
      filter = "?$filter=Number eq '" + buttonData.data.DocumentNo + "'"
    } else if (buttonData.data.DocumentType == "Sales Invoice") {
      updateheaderurl = "/salesHeaders";
      filter = "?$filter=Number eq '" + buttonData.data.DocumentNo + "'"
    } else if (buttonData.data.DocumentType == "Budget") {
      updateheaderurl = "/budgetRequests";
      filter = "?$filter=No eq '" + buttonData.data.DocumentNo + "'"
    } else if (buttonData.data.DocumentType == "Petty Cash") {
      updateheaderurl = "/claimEntriesHeaders";
      filter = "?$filter=DocumentNo eq '" + buttonData.data.DocumentNo + "'"
    }

    this.restService.get(updateheaderurl! + filter!).subscribe((res1: any) => {
      if (res1.value) {
        const recordData = res1.value[0];
        const query = '(' + res1.value[0][this.config.idProp!] + ')';
        this.restService.patch(updateheaderurl + query, patchData, ifMatchKey).subscribe((response: any) => {
          if (recordData.UserId && this.sessionService.UserId !== recordData.UserId) {
            this.getRecordOwnerEmailId(buttonData, bttn, recordData.UserId);
          } else {
            this.getRecordOwnerEmailId(buttonData, bttn, '');
          }
        }, error => {
          this.addItemService.showLoader$.next(false);
        });
      }
    });
  }

  getRecordOwnerEmailId(buttonData: any, bttn: string, userId: string) {
    if (userId) {
      const url: string = "/portalUsers?$filter=UserId eq '" + userId + "'";
      this.restService.get(url).subscribe((response: any) => {
        if (response && response.value && response.value.length > 0) {
          this.sendmail(buttonData, bttn, response.value[0].Email);
        } else {
          this.sendmail(buttonData, bttn);
        }
      });
    } else {
      this.sendmail(buttonData, bttn);
    }
  }

  sendmail(buttonData: any, bttn: string, recordOwnerEmail: string = '') {
    const url: string = "/approvalentriesPR?$filter=DocumentNo eq '" + buttonData.data.DocumentNo + "' and Status eq 'Open'";
    if (bttn === "Approve") {
      this.restService.get(url).subscribe((response: any) => {
        if (response.value && response.value.length > 0) {
          let senders: string[] = [this.sessionService.Email];
          let receivers: string[] = [];//comment out 22_2_22

          let approvalId: string = response.value[0].ApproverID;
          response.value.forEach((record: any) => {
            if (record.ApproverEmailId && record.ApproverEmailId !== '') {
              receivers.push(record.ApproverEmailId);
            }
          });

          if (recordOwnerEmail && !receivers.includes(recordOwnerEmail)) {
            receivers.push(recordOwnerEmail);
          }

          this.emailNotifyService.sendNotification(senders, receivers, buttonData.data.DocumentType, buttonData.data.DocumentNo, "SendApprovalRequest", buttonData.data.DocumentDate, '', false, false, approvalId, buttonData.data.SendForApprovalId, buttonData.data.prNumber); //hossain ask to change bttn action on 22_2_22
        } else {
          let senders: string[] = [this.sessionService.Email];
          let receivers: string[] = [];
          if (buttonData.data.SendForApprovalEmailId && buttonData.data.SendForApprovalEmailId !== '') {   ////in on 21-2-22
            receivers.push(buttonData.data.SendForApprovalEmailId);
          }

          if (recordOwnerEmail && !receivers.includes(recordOwnerEmail)) {
            receivers.push(recordOwnerEmail);
          }

          this.emailNotifyService.sendNotification(senders, receivers, buttonData.data.DocumentType, buttonData.data.DocumentNo, bttn, buttonData.data.DocumentDate, '', false, true, this.sessionService.UserId, buttonData.data.SendForApprovalId, buttonData.data.prNumber);
        }
      });
    } else if (bttn === "Reject") {
      let senders: string[] = [this.sessionService.Email];
      let receivers: string[] = [];
      const url: string = "/approvalentriesPR?$filter=DocumentNo eq '" + buttonData.data.DocumentNo + "' and Status eq 'Rejected'";
      this.restService.get(url).subscribe((response: any) => {
        if (response.value && response.value.length > 0) {
          receivers.push(response.value[response.value.length - 1].SendForApprovalEmailId);
          if (recordOwnerEmail && !receivers.includes(recordOwnerEmail)) {
            receivers.push(recordOwnerEmail);
          }

          this.emailNotifyService.sendNotification(senders, receivers, buttonData.data.DocumentType, buttonData.data.DocumentNo, bttn, buttonData.data.DocumentDate, '', false, false, this.sessionService.UserId, buttonData.data.SendForApprovalId, buttonData.data.prNumber);
        }
      });
    }
  }


  // async Approved() {

  //   const selectedIndexes = await firstValueFrom(
  //     this.selectedItemService.selectedLines$.pipe(take(1))
  //   );
  //   console.log("Approved working!", selectedIndexes);
  //   const reason = await this.sweetService.showMessageBox({
  //   });

  //   selectedIndexes.forEach((item: any) => {
  //     let id = this.config.idProp!;
  //     const url: string = '(' + [item.id] + ')/Microsoft.NAV.PortalSendPRForApproval';
  //     this.restService.post(this.config.headerApi + url, { actionComment: 'reason' }).subscribe((response: any) => {
  //       this.toastr.success('Approved!');
  //     });
  //   })

  // }


  // async Approved() {
  //   const selectedItems = await firstValueFrom(
  //     this.selectedItemService.selectedLines$.pipe(take(1))
  //   );

  //   if (!selectedItems || selectedItems.length === 0) {
  //     this.toastr.warning('Please select at least one item to approve.');
  //     return;
  //   }

  //   const reasonResult = await this.sweetService.showMessageBox({
  //   });

  //   const idProp = this.config.idProp!;
  //   const baseUrl = this.config.headerApi;
  //   try {
  //     this.addItemService.showLoader$.next(true);
  //     const approvalRequests = selectedItems.map((item: any) => {
  //       const itemId = item[idProp];
  //       const url = `(${itemId})/Microsoft.NAV.portalApproveWorkflow`;

  //       return this.restService.post(`${baseUrl}${url}`,
  //         //  { actionComment: reasonResult }
  //         {}
  //       ).toPromise().catch((err) => {
  //         this.toastr.error(`Failed to approve item ${itemId}`);
  //       });
  //     });
  //     await Promise.all(approvalRequests);
  //     this.toastr.success('All selected items approved successfully!');
  //   }
  //   finally {
  //     this.addItemService.refreshData$.next(true);
  //     this.addItemService.showLoader$.next(false);
  //     this.selectedItemService.popupUncheckedLineData$.next(true);
  //   }
  // }


  async Approved() {
    const selectedItems = await firstValueFrom(
      this.dataTableService.selectedItem$.pipe(take(1))
    );

    if (!selectedItems || selectedItems.length === 0) {
      this.toastr.warning('Please select at least one item to approve.');
      return;
    }

    const reasonResult = await this.dialogService.commentBox({
    });

    console.log("response=", selectedItems);


    if (!reasonResult.isConfirmed) return;
    const comment = reasonResult.value?.trim?.() || '';
    const idProp = this.config.idProp!;
    const baseUrl = this.config.headerApi;

    try {
      this.addItemService.showLoader$.next(true);

      const approvalRequests = selectedItems.map(async (item: any) => {
        const itemId = item[idProp];
        const ifMatchKey = item["@odata.etag"];
        const patchData: any = {};

        if (comment) {
          patchData.actionComment = comment;
        }

        const payload = {
          entryNo: item.entryNo,
          approverId: item.approverId,
          actionComment: comment
        };

        try {
          await this.restService.patch(`${baseUrl}(${itemId})`, patchData, ifMatchKey).toPromise();
          const url = `(${itemId})/Microsoft.NAV.portalApproveWorkflow`;
          await this.restService.post(`${baseUrl}${url}`, payload).toPromise();
        } catch (err) {
          console.error(`Error approving item ${itemId}`, err);
          this.toastr.error(`Failed to approve item ${itemId}`);
        }
      });

      await Promise.all(approvalRequests);
    } catch (err) {
      console.error('Error in approval process', err);
      this.toastr.error('Something went wrong during approval.');
    } finally {
      this.addItemService.refreshDataDataTable$.next(true);
      this.addItemService.showLoader$.next(false);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    }
  }



  async ApprovalReject() {
    const selectedItems = await firstValueFrom(
      this.dataTableService.selectedItem$.pipe(take(1))
    );

    if (!selectedItems || selectedItems.length === 0) {
      this.toastr.warning('Please select at least one item to reject.');
      return;
    }

    const reasonResult = await this.dialogService.commentBox({
    });

    if (!reasonResult.isConfirmed) return;


    const comment = reasonResult.value?.trim?.();
    if (!comment) {
      return;
    }

    const idProp = this.config.idProp!;
    const baseUrl = this.config.headerApi;

    try {
      this.addItemService.showLoader$.next(true);

      const rejectionRequests = selectedItems.map(async (item: any) => {
        const itemId = item[idProp];
        const ifMatchKey = item["@odata.etag"];
        const patchData = { actionComment: comment };
        const payload = {
          entryNo: item.entryNo,
          approverId: item.approverId,
          actionComment: comment
        };

        try {
          await this.restService.patch(`${baseUrl}(${itemId})`, patchData, ifMatchKey).toPromise();
          // const url = `(${itemId})/Microsoft.NAV.PortalDelegateWorkflow`;
          // await this.restService.post(`${baseUrl}${url}`, {}).toPromise();

          const url = `(${itemId})/Microsoft.NAV.portalRejectWorkflow`;
          await this.restService.post(`${baseUrl}${url}`, payload).toPromise();

        } catch (err) {
          console.error(`Error rejecting item ${itemId}`, err);
          this.toastr.error(`Failed to reject item ${itemId}`);
        }
      });

      await Promise.all(rejectionRequests);
      this.toastr.success('All selected items rejected successfully!');
    } catch (err) {
      console.error('Error in rejection process', err);
      this.toastr.error('Something went wrong during rejection.');
    } finally {
      this.addItemService.refreshDataDataTable$.next(true);
      this.addItemService.showLoader$.next(false);
      this.selectedItemService.popupUncheckedLineData$.next(true);
    }
  }


}


export function getLinkItemConfigs() {
  const registry = ModuleRegistry['linkItemRegistry'];

  return Object.keys(registry).map(key => ({
    property: 'documentType',
    value: key,
    ...registry[key]
  }));
}
