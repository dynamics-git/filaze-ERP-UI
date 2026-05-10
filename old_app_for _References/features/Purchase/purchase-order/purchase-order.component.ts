import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { ArchivedPurchaseQuoteHeader, ArchivedPurchaseQuoteLine } from '../archived-purchase-quote/archived-purchase-quote.config';
import { PurchaseOrderModelComponent } from '../modals/purchase-order-model/purchase-order-model.component';
import { PurchaseQuoteComponent } from '../purchase-quote/purchase-quote.component';
import { PurchaseRequisitionComponent } from '../purchase-requisition/purchase-requisition.component';
import { PurchaseRequisitionCalculation, PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../purchase-requisition/purchase-requisition.config';
import { PurchaseOrderCalculation, PurchaseOrderHeader, PurchaseOrderLine } from './purchase-order.config';
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
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { FormDataModel } from '../../../core/models/shared/formDataModel';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';

@Component({
  standalone: false,
  selector: 'app-purchase-order',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (leaveEvent)="leaveEvent($event)" (buttonClickEvent)="buttonClickEvent($event)"[MenuButtons]="MenuButtons" ></app-data-table>'
})
export class PurchaseOrderComponent implements OnInit {

  config: DataTableConfig = {
    title: 'Purchase Order',
    idProp: 'Id',
    headerApi: '/purchaseOrderHeaders',
    pageName: 'PO',
    // showCreate: false,
    headerApiOrderByField: 'Number',
    filterByUserCompanyResCenter: true,
    // showDelete: false,
    filters: [
      {
        field: 'VariationOrder',
        operator: 'ne',
        value: "true"
      },
      {
        field: 'ManualPOCancel',
        operator: 'eq',
        value: "false"
      }
      // {
      //   field: 'GRNReviewStatus',
      //   operator: 'ne',
      //   value: "'Reviewed'"
      // },
      // {
      //   field: 'InvoiceReviewStatus',
      //   operator: 'ne',
      //   value: "'Reviewed'"
      // },

    ],
    headers: [
      {
        name: 'No',
        prop: 'Number',
        isPrimaryLink: true
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
        name: 'Pending Approvers ID',
        prop: 'PendingApproversID',
      },
      {
        name: 'Remark',
        prop: 'Remark',
      },
    ],

    filterConfig: [
      {
        field: 'Status',
        label: 'Status',
        type: 'dropdown',
        options: [
          { value: 'Open', label: 'Open' },
          { value: 'Released', label: 'Released' },
          { value: 'Pending Approval', label: 'Pending Approval' }
        ]
      },
      {
        field: 'BuyFromVendorNumber',
        label: 'Vendor No',
        type: 'dropdown',
        apiUrl: '/vendorsAPI',
        valueField: 'number',
        labelField: 'displayName'
      },
      {
        field: 'PostingDate',
        label: 'Posting Date',
        type: 'date'
      },
      {
        field: 'DocumentDate',
        label: 'Document Date',
        type: 'date'
      },
      {
        field: 'amount',
        label: 'Amount',
        type: 'number'
      }
    ],

    selctionType: 'single',
    addItemConfig: {
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
    },
    removeUnicodeCharFields: ['Status']
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Purchase Order',
      name: 'Purchase Order',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/order',
      isEnable: false
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
      route: '/purchase/receipt'
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

  chartAccountData!: any[];
  itemData!: any[];
  fixedAssetData!: any[];
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
    private selectedItemService: SelectedItemService,
  ) {
  }

  ngOnInit(): void {
    this.purchaseRequisitionObj = new PurchaseRequisitionComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility, this.selectedItemService);
    this.purchaseQuoteObj = new PurchaseQuoteComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility, this.selectedItemService);
  }

  popupLoaded(data: any) {
    if (data.linkItemType === 'PR') {
      this.purchaseRequisitionObj.popupLoaded(data);
    } else if (data.linkItemType === 'PQ') {
      this.purchaseQuoteObj.popupLoaded(data);
    } else {
      this.formDataService.disableControl$.next('DueDate');
      this.formDataService.disableControl$.next('OrderDate');
      this.formDataService.disableControl$.next('PurchaserCode');
      this.formDataService.disableControl$.next('QuoteNumber');
      this.formDataService.disableControl$.next('VendorShipmentNumber');
      // this.formDataService.disableControl$.next('VendorInvoiceNumber');
      this.formDataService.disableControl$.next('VendorOrderNumber');
      ///////14/12-21
      this.restService.get("/locations").subscribe((response: any) => {
        if (response.value.length > 0) {
          let locationArray: any[] = []
          var locationObj = {
            "Code": "",
            "Name": "",
          };
          locationObj.Code = "";
          locationObj.Name = "Blank";
          locationArray.push(this.utility.copyObj(locationObj));
          response.value.forEach((location: any, locationrowIndex: number) => {
            if (location.Code) {
              locationObj.Code = location.Code;
              locationObj.Name = location.Name;
            }
            locationArray.push(this.utility.copyObj(locationObj));
          });
          if (locationArray) {
            this.formFielService.updateDropdownItem$.next({ label: 'LocationCode', items: locationArray, displayFormat: '[Code] - [Name]', bindValue: 'Code' });
            if (data.header.LocationCode) {
              setTimeout(() => {
                this.formDataService.updateControlData$.next({ control: 'LocationCode', data: data.header.LocationCode, eventEmit: true });
              }, 100);
            }

          }

        }
      });
      ///////14/12-21
      if (data.header.Status !== 'Open') {
        this.formDataService.disableControl$.next("UnitOfMeasure");
        this.formDataService.disableControl$.next('ShortcutDimension1Code');
        this.formDataService.disableControl$.next('ShortcutDimension2Code');
        this.formDataService.disableControl$.next("UnitOfMeasure");

        if (data.header.Status === 'Released') {
          this.addItemService.disableAllControlsExceptSome$.next(["VendorInvoiceNumber", "Line_Quantity", "Line_QtyToReceive", "Line_QtyToInvoice", "PostingDate"]);
        } else {
          this.formDataService.disableControl$.next("Quantity");
          if (data.header.Status === 'Pending Prepayment') {
            this.addItemService.disableAllControlsExceptSome$.next(["VendorInvoiceNumber", "Prepayment"]);
          } else {
            this.addItemService.enableOrDisableAllControls$.next(false);
          }
        }
      } else if (data.header.Status === 'Open' && data.header.reopenPO) {
        this.addItemService.disableAllControlsExceptSome$.next(["VendorInvoiceNumber", "Prepayment"]);
      }

      ////////12-10-21
      if (data.header.Status == 'Pending Approval') {
        let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.Number + "'"
        this.restService.get(url).subscribe((response: any) => {
          if (response) {
            console.log(response);
            this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
            this.formDataService.updateControlData$.next({ control: 'PendingApproversEmailId', data: response.value[0].ApproverEmailId, eventEmit: true });
            this.PendingApproversID = response.value[0].ApproverID;
            this.PendingApproversEmailId = response.value[0].ApproverEmailId;
            const ifMatchKey = "*"; // record["@odata.etag"];
            const query = '(' + data.header.Id + ')';
            let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
            console.log(patchData);
            this.restService.patch("/purchaseOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
              this.addItemService.enableOrDisableAllControls$.next(false);
            });
          }
        });
      } else if (data.header.GRNReviewStatus == 'Pending Review') {
        let url = "/documentReviewEntries?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.Number + "' and VariationOrder eq false"
        this.restService.get(url).subscribe((response: any) => {
          if (response) {
            this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
            this.formDataService.updateControlData$.next({ control: 'PendingApproversEmailId', data: response.value[0].ApproverEmailId, eventEmit: true });
            this.PendingApproversID = response.value[0].ApproverID;
            this.PendingApproversEmailId = response.value[0].ApproverEmailId;
            const ifMatchKey = "*"; // record["@odata.etag"];
            const query = '(' + data.header.Id + ')';
            let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
            this.restService.patch("/purchaseOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
              this.addItemService.enableOrDisableAllControls$.next(false);
            });
          }
        });
      } else if (data.header.InvoiceReviewStatus == 'Pending Review') {
        let url = "/documentReviewEntries?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.Number + "' and VariationOrder eq false"
        this.restService.get(url).subscribe((response: any) => {
          if (response) {
            this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
            this.formDataService.updateControlData$.next({ control: 'PendingApproversEmailId', data: response.value[0].ApproverEmailId, eventEmit: true });
            this.PendingApproversID = response.value[0].ApproverID;
            this.PendingApproversEmailId = response.value[0].ApproverEmailId;
            const ifMatchKey = "*"; // record["@odata.etag"];
            const query = '(' + data.header.Id + ')';
            let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
            this.restService.patch("/purchaseOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
              this.addItemService.enableOrDisableAllControls$.next(false);
            });
          }
        });
      }

      ////////12-10-21
      const HeaderData = data.header;
      this.headerData = data.header;

      /////ar//dimention///
      this.restService.get("/dimensionsValues").subscribe((response: any) => {
        if (response) {
          // lineData.forEach((line: any, rowIndex: number) => {

          const PRJCT = response.value.filter((m: any) => m.DimensionCode == "PROJECT");
          const PROJECT = PRJCT.filter((m: any) => m.DimensionValueType == "Standard");
          this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimension1Code', items: PROJECT, displayFormat: '[Code] - [Name]', bindValue: 'Code', });
          if (HeaderData.ShortcutDimension1Code) {
            setTimeout(() => {
              this.formDataService.updateControlData$.next({ control: 'ShortcutDimension1Code', data: HeaderData.ShortcutDimension1Code });
              this.formDataService.updateLineControlData$.next({ control: 'ShortcutDimension1Code', data: HeaderData.ShortcutDimension1Code, });
            }, 100);
          }

          const DEPART = response.value.filter((m: any) => m.DimensionCode == "DEPARTMENT/COST CNTR");
          const DEPARTMENT = DEPART.filter((m: any) => m.DimensionValueType == "Standard");
          this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimension2Code', items: DEPARTMENT, displayFormat: '[Code] - [Name]', bindValue: 'Code', });
          if (HeaderData.ShortcutDimension2Code) {
            this.formDataService.updateControlData$.next({ control: 'ShortcutDimension2Code', data: HeaderData.ShortcutDimension2Code });
            this.formDataService.updateLineControlData$.next({ control: 'ShortcutDimension2Code', data: HeaderData.ShortcutDimension2Code, })
          }

        }
      });

      const lineData = data.line;
      this.totalAmount = 0;
      this.totalAmountToInvoice = 0;
      this.totalAmountInvoiced = 0;

      if (lineData) {
        lineData.forEach((line: any, rowIndex: number) => {
          this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;
          this.totalAmountToInvoice += line['AmountToInvoice'] ? +line['AmountToInvoice'] : 0;
          this.totalAmountInvoiced += line['AmountInvoiced'] ? +line['AmountInvoiced'] : 0;
          switch (line.Type) {
            case 'G/L Account':
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
            case ' ':
              // this.formDataService.enableLineControl$.next({ label: 'Number', rowIndex: rowIndex });
              // if (this.comments) {
              //   this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.comments, displayFormat: '[Code] - [Description]', bindValue: 'Code', rowIndex: rowIndex });
              //   setTimeout(() => {
              //     this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
              //   }, 100);
              // } else {
              //   this.restService.get('/comments').subscribe((response: any) => {
              //     this.comments = response.value;
              //     this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.comments, displayFormat: '[Code] - [Description]', bindValue: 'Code', rowIndex: rowIndex });
              //     setTimeout(() => {
              //       this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
              //     }, 100);
              //   });
              // }
              this.formDataService.disableLineControlsList$.next([
                { label: 'No', rowIndex: rowIndex, clearValue: true },
                { label: 'UnitOfMeasure', rowIndex: rowIndex, clearValue: true },
                { label: 'LocationCode', rowIndex: rowIndex, clearValue: true },
                { label: 'Quantity', rowIndex: rowIndex, clearValue: true },
                { label: 'QtyToReceive', rowIndex: rowIndex, clearValue: true },
                { label: 'QtyToInvoice', rowIndex: rowIndex, clearValue: true },
                { label: 'DirectUnitCost', rowIndex: rowIndex, clearValue: true },
                { label: 'LineAmount', rowIndex: rowIndex, clearValue: true }
              ]);
              break;
            default:
              this.formDataService.disableLineControl$.next({ label: 'Number', rowIndex: rowIndex });
              ////1/9.21///
              if (data.header.Status === 'Open') {
                this.formDataService.enableLineControl$.next({ label: 'Quantity', rowIndex: rowIndex });
                this.formDataService.enableLineControl$.next({ label: 'QtyToReceive', rowIndex: rowIndex });
                this.formDataService.enableLineControl$.next({ label: 'QtyToInvoice', rowIndex: rowIndex });
              }
              if (data.header.Status === 'Released') {
                this.formDataService.enableLineControl$.next({ label: 'Quantity', rowIndex: rowIndex });
                this.formDataService.enableLineControl$.next({ label: 'QtyToReceive', rowIndex: rowIndex });
                this.formDataService.enableLineControl$.next({ label: 'QtyToInvoice', rowIndex: rowIndex });
              }
              ////1/9.21///
              //////////
              break;
          }
          this.formDataService.disableLineControl$.next({ label: 'Type', rowIndex: rowIndex });
          this.formDataService.disableLineControl$.next({ label: 'No', rowIndex: rowIndex });
          this.formDataService.disableLineControl$.next({ label: 'Description', rowIndex: rowIndex });
          this.formDataService.disableLineControl$.next({ label: 'UnitOfMeasureCode', rowIndex: rowIndex });
          this.formDataService.disableLineControl$.next({ label: 'LocationCode', rowIndex: rowIndex });
        });
      }
      this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
      this.formDataService.updateControlData$.next({ control: 'totalAmountToInvoice', data: this.totalAmountToInvoice.toFixed(2) });
      this.formDataService.updateControlData$.next({ control: 'totalAmountInvoiced', data: this.totalAmountInvoiced.toFixed(2) });

    }
  }

  changeEvent(data: EventDataModel) {
    if (data.linkItemType === 'PR') {
      this.purchaseRequisitionObj.changeEvent(data);
    } else if (data.linkItemType === 'PQ') {
      this.purchaseQuoteObj.changeEvent(data);
    } else {
      if (data.section == SectionType.Header) {
        switch (data.control) {
          case 'LocationCode':
            if (data.data == "") {
              const ifMatchKey = "*"; // record["@odata.etag"];
              let patchData = { "LocationCode": "" }
              const query = '(' + this.headerData.Id + ')';
              this.restService.patch("/purchaseOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
              }, error => {
              });
            }
            break;
          case 'GRNReviewStatus':
            this.headerData.GRNReviewStatus = data.data;
            break;
          case 'InvoiceReviewStatus':
            this.headerData.InvoiceReviewStatus = data.data;
            break;
          case 'ApproverGroup':
            if (data.data == "") {
              const ifMatchKey = "*"; // record["@odata.etag"];
              let patchData = { "ApproverGroup": "" }
              const query = '(' + this.headerData.Id + ')';
              this.restService.patch("/purchaseOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
              }, error => {
              });
            }
            break;
        }
      }
      if (data.section == SectionType.Line) {
        this.rowIndex = data.rowIndex!;
        switch (data.control) {
          case 'Quantity':
            this.calculateAmount(data);
            break;
          case 'QtyToReceive':
            if (this.headerData.InvoiceReviewStatus !== "Pending Review" || this.headerData.InvoiceReviewStatus !== "Reviewd") {  //ask by hussain

              // setTimeout(() => {
              //   this.formDataService.updateLineControlData$.next({ control: 'QtyToInvoice', data: 0, rowIndex: data.rowIndex, eventEmit: true });
              //  }, 100);
              if (this.headerData.GRNReviewStatus !== "Open") {
                if (data.data !== data.activeData.QtyToReceive) {
                  setTimeout(() => {
                    this.formDataService.updateLineControlData$.next({ control: 'QtyToReceive', data: data.activeData.QtyToReceive, rowIndex: data.rowIndex, eventEmit: true });
                    this.formDataService.updateLineControlData$.next({ control: 'QtyToInvoice', data: 0, rowIndex: data.rowIndex, eventEmit: true });
                  }, 100);
                  this.toastr.error("To modify Qty to Receive change GRN status to Open");

                }
              }
              else {
                if (data.data !== data.activeData.QtyToReceive) {
                  setTimeout(() => {
                    this.formDataService.updateLineControlData$.next({ control: 'QtyToInvoice', data: 0, rowIndex: data.rowIndex, eventEmit: true });
                  }, 100);
                }

                this.calculateAmountToInvoice(data);
              }
            }
            else {
              if (data.data !== data.activeData.QtyToReceive) {
                this.formDataService.updateLineControlData$.next({ control: 'QtyToReceive', data: data.activeData.QtyToReceive, rowIndex: data.rowIndex, eventEmit: true });
                this.toastr.error("To modify Qty to Receive change Invoice status to Open");
              }
            }
            break;
          case 'QtyToInvoice':
            if (this.headerData.GRNReviewStatus !== "Pending Review" || this.headerData.GRNReviewStatus !== "Reviewd") {  //ask by hussain

              if (this.headerData.InvoiceReviewStatus !== "Open") {
                if (data.data !== data.activeData.QtyToInvoice) {
                  setTimeout(() => {
                    this.formDataService.updateLineControlData$.next({ control: 'QtyToInvoice', data: data.activeData.QtyToInvoice, rowIndex: data.rowIndex, eventEmit: true });
                  }, 100);
                  this.toastr.error("To modify Qty to Invoice change Invoice status to Open");
                }
              }
              else {
                this.calculateAmountToInvoice(data);
              }
            }
            else {
              if (data.data !== data.activeData.QtyToInvoice) {
                this.toastr.error("To modify Qty to Invoice change GRN status to Open");
                this.formDataService.updateLineControlData$.next({ control: 'QtyToInvoice', data: data.activeData.QtyToInvoice, rowIndex: data.rowIndex, eventEmit: true });
              }
            }
            break;
          case 'LineDiscountAmount':
            this.calforLineDiscount(data);
            break;

          ///////13-12-21
          ///////13-12-21
        }
      }
    }
  }

  leaveEvent(data: FormDataModel) {
  }

  calforLineDiscount(data: EventDataModel) {
    const qtyToInvoice = data.control === 'QtyToInvoice' ? data.data : data.activeData.QtyToInvoice;
    const quantityInvoiced = data.control === 'QuantityInvoiced' ? data.data : data.activeData.QuantityInvoiced;
    const unitPrice = data.control === 'DirectUnitCost' ? data.data : data.activeData.DirectUnitCost;
    const quantity = data.control === 'Quantity' ? data.data : data.activeData.Quantity;
    const LineDiscountAmount = data.control === 'LineDiscountAmount' ? data.data : data.activeData.LineDiscountAmount;
    let amount = 0;
    let amounttoInvoice = 0;
    let AmountInvoiced = 0;
    if (quantity && unitPrice && !LineDiscountAmount) {
      if (qtyToInvoice) {
        amounttoInvoice = +qtyToInvoice * +unitPrice; //TMY//arka/11/8/22
      }
      if (quantityInvoiced) {
        AmountInvoiced = +quantityInvoiced * +unitPrice; //TMY//arka/11/8/22
      }
      amount = +quantity * +unitPrice;

    }
    else if (quantity && unitPrice && LineDiscountAmount) {
      if (qtyToInvoice) {
        amounttoInvoice = +qtyToInvoice * (+unitPrice - (LineDiscountAmount / quantity));
      }
      if (quantityInvoiced) {
        AmountInvoiced = +quantityInvoiced * (+unitPrice - (LineDiscountAmount / quantity));
      }
      amount = (+quantity * +unitPrice) - +LineDiscountAmount;

    }
    if (data.linesData && data.linesData.length > 0) {
      this.totalAmount = 0;
      this.totalAmountToInvoice = 0;
      this.totalAmountInvoiced = 0; data.linesData.forEach((line: any, index: number) => {
        if (index === data.rowIndex) {
          this.totalAmount += amount;
          this.totalAmountToInvoice += amounttoInvoice;
          this.totalAmountInvoiced += AmountInvoiced;
        } else {
          this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;
          this.totalAmountToInvoice += line['AmountToInvoice'] ? +line['AmountToInvoice'] : 0;
          this.totalAmountInvoiced += line['QuantityInvoiced'] ? +line['QuantityInvoiced'] : 0;
        }
      });
      this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
      this.formDataService.updateControlData$.next({ control: 'totalAmountToInvoice', data: this.totalAmountToInvoice.toFixed(2) });
      this.formDataService.updateControlData$.next({ control: 'totalAmountInvoiced', data: this.totalAmountInvoiced.toFixed(2) });
    }
  }
  calculateAmountToInvoice(data: EventDataModel) {
    const qtyToInvoice = data.control === 'QtyToInvoice' ? data.data : data.activeData.QtyToInvoice;
    const unitPrice = data.control === 'DirectUnitCost' ? data.data : data.activeData.DirectUnitCost;
    const Quantity = data.control === 'Quantity' ? data.data : data.activeData.Quantity;
    const LineDiscountAmount = data.control === 'LineDiscountAmount' ? data.data : data.activeData.LineDiscountAmount;
    let amounttoInvoice = 0;
    if (qtyToInvoice && unitPrice && !LineDiscountAmount) {
      amounttoInvoice = +qtyToInvoice * +unitPrice; //TMY//arka/11/8/22
    }
    else if (qtyToInvoice && unitPrice && LineDiscountAmount) {
      amounttoInvoice = +qtyToInvoice * (+unitPrice - (LineDiscountAmount / Quantity));
    }
    if (data.linesData && data.linesData.length > 0) {
      this.totalAmountToInvoice = 0;
      data.linesData.forEach((line: any, index: number) => {
        if (index === data.rowIndex) {
          this.totalAmountToInvoice += amounttoInvoice;
        } else {
          this.totalAmountToInvoice += line['AmountToInvoice'] ? +line['AmountToInvoice'] : 0;
        }
      });
      this.formDataService.updateControlData$.next({ control: 'totalAmountToInvoice', data: this.totalAmountToInvoice.toFixed(2) });
    }
  }
  calculateAmount(data: EventDataModel) {
    const quantity = data.control === 'Quantity' ? data.data : data.activeData.Quantity;
    const unitPrice = data.control === 'DirectUnitCost' ? data.data : data.activeData.DirectUnitCost;
    const LineDiscountAmount = data.control === 'LineDiscountAmount' ? data.data : data.activeData.LineDiscountAmount;
    let amount = 0;
    if (quantity && unitPrice && !LineDiscountAmount) {
      amount = +quantity * +unitPrice;
      console.log(amount);
    }
    else if (quantity && unitPrice && LineDiscountAmount) {
      amount = (+quantity * +unitPrice) - +LineDiscountAmount;
      console.log(amount);
    }
    setTimeout(() => {
      this.formDataService.updateLineControlData$.next({ control: 'LineAmount', data: amount.toFixed(2), rowIndex: data.rowIndex, eventEmit: true });
    }, 100);

    if (data.linesData && data.linesData.length > 0) {
      this.totalAmount = 0;
      data.linesData.forEach((line: any, index: number) => {
        if (index === data.rowIndex) {
          this.totalAmount += amount;
        } else {
          this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;
        }
      });
      this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    }
  }
  validateHeaderData(header: any) {
    if (header.Remark) {
      return true;
    }

    this.toastr.warning('Remark must have a value');

    return false;
  }
  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.linkItemType === 'PR') {
      this.purchaseRequisitionObj.buttonClickEvent(buttonData);
    } else if (buttonData.linkItemType === 'PQ') {
      this.purchaseQuoteObj.buttonClickEvent(buttonData);
    } else {
      if (buttonData.button.label === 'prepayment') {
        if (this.validateHeaderData(buttonData.headerData)) {
          if (buttonData.headerData.ShortcutDimension1Code && buttonData.headerData.ShortcutDimension2Code) {
            this.addItemService.showLoader$.next(true);
            this.prepayment(buttonData)
            // this.updateUserId(buttonData, true);
          }
          else {
            this.toastr.warning('Please choose a value for Project and Department dimensions!');
          }
        }
      } else if (buttonData.button.label === 'SendApprovalRequest') {
        if (buttonData.data.Status === 'Open') {
          if (this.validateHeaderData(buttonData.headerData)) {
            if (buttonData.headerData.ShortcutDimension1Code && buttonData.headerData.ShortcutDimension2Code) {
              this.addItemService.showLoader$.next(true);
              this.updateUserId(buttonData, true);
            }
            else {
              this.toastr.warning('Please choose a value for Project and Department dimensions!');
            }
          }
        }
        else {
          this.toastr.error('Status Must Be Open');
        }
      } else if (buttonData.button.label === 'CancelApprovalRequest') {
        if (buttonData.data.Status === 'Pending Approval') {
          this.addItemService.showLoader$.next(true);
          const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getSendForApprovalID';
          let payload = {
            docNo: buttonData.data.Number,
          }
          this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
            if (response.value == this.sessionService.UserId) {
              this.updateUserId(buttonData, false, "");
            }
            else {
              this.toastr.error('You do not have permission to cancel the document. Only Sender can Cancel the Document.');
              this.addItemService.showLoader$.next(false);
            }
          }, error => {
            this.addItemService.showLoader$.next(false);
          });

        }
      } else if (buttonData.button.label === 'GRNReview') {
        if (buttonData.data.Status === 'Released') {
          this.addItemService.showLoader$.next(true);
          this.updateUserId(buttonData, false, "GRNReview");

        }
        else {
          this.toastr.error('Status Must Be Released');
        }
      } else if (buttonData.button.label === 'CancelGRNReview') {
        if (buttonData.data.GRNReviewStatus === 'Pending Review') {
          this.addItemService.showLoader$.next(true);
          const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getSendForGrnReviewID';
          let payload = {
            docNo: buttonData.data.Number,
          }
          this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
            if (response.value == this.sessionService.UserId) {
              this.updateUserId(buttonData, false, "CancelGRNReview");
            }
            else {
              this.toastr.error('You do not have permission to cancel the document. Only Sender can Cancel the Document.');
              this.addItemService.showLoader$.next(false);
            }
          }, error => {
            this.addItemService.showLoader$.next(false);
          });
        }
        else {
          this.toastr.error('GRN Review Status Must Be Pending Review');
        }
      } else if (buttonData.button.label === 'InvoiceReview') {
        if (buttonData.headerData.VendorInvoiceNumber) {
          this.addItemService.showLoader$.next(true);
          this.updateUserId(buttonData, false, "InvoiceReview");
        }
        else {
          this.toastr.error('Must have Vendor Invoice Number');
        }
      } else if (buttonData.button.label === 'CancelInvoiceReview') {
        if (buttonData.data.InvoiceReviewStatus === 'Pending Review') {
          this.addItemService.showLoader$.next(true);

          const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getSendForInvReviewID';
          let payload = {
            docNo: buttonData.data.Number,
          }
          this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
            if (response.value == this.sessionService.UserId) {
              this.updateUserId(buttonData, false, "CancelInvoiceReview");
            }
            else {
              this.toastr.error('You do not have permission to cancel the document. Only Sender can Cancel the Document.');
              this.addItemService.showLoader$.next(false);
            }
          }, error => {
            this.addItemService.showLoader$.next(false);
          });
        }
        else {
          this.toastr.error('Invoice Review Status Must Be Pending Review');
        }
      } else if (buttonData.button.label === 'Post') {
        if (buttonData.data.Status === 'Released') {
          this.addItemService.showLoader$.next(true);

          if (buttonData.data.Id) {
            this.addItemService.showLoader$.next(false);
            const modalRef = this.modal.open(PurchaseOrderModelComponent, { backdrop: 'static' });
            modalRef.result.then((result) => {
              console.log(result, "hi");
              if (result) {
                switch (result) {
                  case 'rcpt':
                    if (buttonData.data.GRNReviewStatus === 'Reviewed') {
                      const urlReceive: string = '(' + buttonData.data.Id + ')/Microsoft.NAV.postAsReceive';
                      const urlGRNUserId: string = '(' + buttonData.data.Id + ')/Microsoft.NAV.getPostGrnUserId';
                      this.addItemService.showLoader$.next(true);
                      const ifMatchKey = "*"; // record["@odata.etag"];
                      const query = '(' + buttonData.data.Id + ')';
                      let patchData = { "RefNo": buttonData.data.RefNo + 1 }
                      this.restService.patch(this.config.addItemConfig!.headerConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
                        this.postApi(urlReceive, urlGRNUserId, buttonData, 'rcpt');
                      }, error => {
                        this.addItemService.showLoader$.next(false);
                      });
                    }
                    else {
                      this.addItemService.showLoader$.next(false);
                      this.toastr.error('The Document GRNReviewStatus must be "Reviewed" in order to Post');
                    }
                    break;

                  case 'invc':
                    if (buttonData.data.InvoiceReviewStatus === 'Reviewed') {
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
                    else {
                      this.addItemService.showLoader$.next(false);
                      this.toastr.error('The Document InvoiceReviewStatus must be "Reviewed" in order to Post');
                    }
                    break;

                  case 'receiptinvoice':
                    if (buttonData.data.InvoiceReviewStatus === 'Reviewed') {
                      this.Receipt_Invoice(buttonData.data.Id);
                    }
                    break;


                }
              }
              else {
                this.addItemService.showLoader$.next(false);
              }
            });
          }
          else {
            this.addItemService.showLoader$.next(false);
          }
        }
        else {
          this.toastr.error('The Document Status must be "Released" in order to Post');
        }
      } else if (buttonData.button.label === 'ConverttoVariationOrder') {
        if (buttonData.data.Status === 'Open') {
          // this.formDataService.updateControlData$.next({ control: 'DocumentType', data: 'Variation Order' });
          // if (buttonData.data.CreatedBy == this.sessionService.UserId) {
          console.log(buttonData.data.Id);
          const ifMatchKey = "*"; // record["@odata.etag"];
          const query = '(' + buttonData.data.Id + ')';
          let patchData = { "VariationOrder": true }
          this.restService.patch(this.config.addItemConfig!.headerConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
            this.toastr.success("Converted to Variation Order");
            window.location.reload();
          });
          // } else {
          //   this.toastr.error("Only created by can convert to Variation order");
          // }
        }
        else {
          this.toastr.error("Status Must Be Open");
        }

      } else if (buttonData.button.label === 'manualPOCancel') {
        this.manualPOCancel(buttonData);
      } else if (buttonData.button.label === 'release') {
        this.releaseDocument(buttonData);
      } else if (buttonData.button.label === 'reopen') {
        this.reopenDocument(buttonData);
      }
      else if (buttonData.button.label === 'SubmitWorkflow') {
      }
      else if (buttonData.button.label === 'OpenPopupPR') {
        this.OpenPr();
      }
    }
  }

  manualPOCancel(buttonData: CustomButtonEvent) {
    if (buttonData.headerData.ManualPOCancel) {
      this.toastr.warning('This Purchase Order is already cancelled');
    } else {
      if (buttonData.lineData!.length > 0) {
        let flag = false;
        for (let i = 0; i < buttonData.lineData!.length; i++) {
          if (buttonData.lineData![i]!.QuantityReceived > 0) {
            flag = true;
            break;
          }
        }

        if (flag) {
          this.toastr.warning('Purchase Order has already partially posted');
        } else {
          this.cancelPOCancel(buttonData.headerData);
        }
      }
    }
  }

  cancelPOCancel(headerData: any) {
    const patchData = {
      ManualPOCancel: true,
      POCancelUserID: this.sessionService.UserId
    };
    const ifMatchKey = "*"; // this.headerData["@odata.etag"];
    this.restService.patch(this.config.addItemConfig!.headerConfig!.api + '(' + headerData[this.config.addItemConfig!.headerConfig!.idProp!] + ')', patchData, ifMatchKey).subscribe((response: any) => {
      this.headerData = response;
      this.toastr.success('Purchase Order has cancelled');
      this.addItemService.closePopup$.next(true);
    });
  }

  releaseDocument(buttonData: CustomButtonEvent) {
    if (buttonData.headerData.Status === 'Released') {
      this.toastr.warning('Purchase Order already Released');
    } else if (!buttonData.headerData.reopenPO) {
      this.toastr.warning('Purchase can\'t be released at this time');
    } else {
      const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.releaseDocument';
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success('Purchase Order released successfully!');
        this.formDataService.updateControlData$.next({ control: 'Status', data: 'Released', eventEmit: true });
        this.addItemService.enableOrDisableAllControls$.next(false);
      }, error => {
        this.addItemService.showLoader$.next(false);
      });
    }
  }

  reopenDocument(buttonData: CustomButtonEvent) {
    if (buttonData.headerData.Status === 'Open') {
      this.toastr.warning('Purchase Order already Opened');
    } else {
      const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.reopenDocument';
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success('Purchase Order reopened successfully!');
        this.formDataService.updateControlData$.next({ control: 'Status', data: 'Open', eventEmit: true });
        this.addItemService.disableAllControlsExceptSome$.next(["VendorInvoiceNumber", "Prepayment"]);
      }, error => {
        this.addItemService.showLoader$.next(false);
      });
    }
  }

  updateUserId(buttonData: CustomButtonEvent, approve: boolean, GRVandInvoiceReview?: string) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getUserId';
    const payload = {
      userid2: this.sessionService.UserId,
      docNo: buttonData.data.Number,
      resCentre: this.sessionService.DefaultResponsibilityCenter,
      comp: this.sessionService.CompanyName,
      compId: this.sessionService.Company,
    };
    this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
      if (approve) {
        this.sendApprovalRequest(buttonData);
      }
      else if (!approve && GRVandInvoiceReview == "") {
        this.cancelApprovalRequest(buttonData);
      }
      else if (GRVandInvoiceReview == "GRNReview") {
        this.GRNReview(buttonData);
      }
      else if (GRVandInvoiceReview == "CancelGRNReview") {
        this.CancelGRNReview(buttonData);
      }
      else if (GRVandInvoiceReview == "InvoiceReview") {
        this.InvoiceReview(buttonData);
      }
      else if (GRVandInvoiceReview == "CancelInvoiceReview") {
        this.CancelInvoiceReview(buttonData);
      }
      this.addItemService.showLoader$.next(false);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  getApproverDetails(data: any, documentAction: string) {
    let approvgrp: string;
    if (this.headerData.ApproverGroup == undefined) {
      approvgrp = "";
    }
    else {
      approvgrp = this.headerData.ApproverGroup;
    }
    if (data.ApproverGroup) {
      approvgrp = data.ApproverGroup;
    }
    console.log(approvgrp);
    const url: string = "/approvalSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Order' and VariationOrder eq false and GroupID eq '" + approvgrp + "'";
    this.restService.get(url).subscribe((response: any) => {
      console.log(this.sessionService.UserId)
      let senders: string[] = [this.sessionService.Email];
      // let receivers: string[] = [this.sessionService.Email];//previous
      let receivers: string[] = [];
      if (typeof data.DocumentDate !== 'string') {
        data.DocumentDate = this.utility.convertDateObjToString(data.DocumentDate, true);
      }
      let approvalId: string = '';
      if (response.value[0]) {
        approvalId = response.value[0].ApproverID;
      }
      if (documentAction == 'CancelApprovalRequest') {////new cancel logic
        console.log(data);
        console.log(this.PendingApproversEmailId);
        if (data.PendingApproversEmailId) {
          receivers.push(data.PendingApproversEmailId);
        }
        else {
          if (this.PendingApproversEmailId) {
            receivers.push(this.PendingApproversEmailId);
          }
          else {
            receivers.push(this.PendingApproversEmailId);
          }
        }
      } else {
        response.value.forEach((record: any) => {
          if (record.EMail && record.EMail !== '') {
            receivers.push(record.EMail);
          }
        });
      }
      this.emailNotifyService.sendNotification(senders, receivers, 'Order', data[this.config.headerApiOrderByField!], documentAction, data.DocumentDate, '', false, false, approvalId, this.sessionService.UserId, data.RequisitionNo)
      this.addItemService.showLoader$.next(false);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  getReviewApproverDetails(data: any, documentAction: string) {
    let url: string;
    if (documentAction == "GRNReview") {
      url = "/documentReviewSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Order' and ReviewType eq 'GRN Review'";
    }
    else if (documentAction == "InvoiceReview") {
      url = "/documentReviewSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Order' and ReviewType eq 'Invoice Review'";
    }
    else {
      url = "/documentReviewSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Order'";
    }
    this.restService.get(url).subscribe((response: any) => {
      let senders: string[] = [this.sessionService.Email];
      // let receivers: string[] = [this.sessionService.Email];
      let receivers: string[] = [];

      if (typeof data.DocumentDate !== 'string') {
        data.DocumentDate = this.utility.convertDateObjToString(data.DocumentDate, true);
      }

      let approvalId: string = response.value[0].ApproverID;
      if (documentAction == 'CancelGRNReview' || documentAction == 'CancelInvoiceReview') {////new cancel logic

        if (data.PendingApproversEmailId) {
          receivers.push(data.PendingApproversEmailId);
        }
        else {
          if (this.PendingApproversEmailId) {
            receivers.push(this.PendingApproversEmailId);
          }
          else {
            receivers.push(this.PendingApproversEmailId);
          }
        }

      }
      else {
        console.log(response.value);
        response.value.forEach((record: any) => {
          if (record.EMail && record.EMail !== '') {
            receivers.push(record.EMail);
          }
        });
      }
      this.emailNotifyService.sendNotification(senders, receivers, 'Order', data[this.config.headerApiOrderByField!], documentAction, data.DocumentDate, '', false, false, approvalId, this.sessionService.UserId, data.RequisitionNo);
      this.addItemService.showLoader$.next(false);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  //   documentReviewEntries(data: any, documentAction: string) {
  //     const url: string = "/documentReviewEntries?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Order'";
  //     this.restService.get(url).subscribe((response: any) => {
  //       let senders: string[] = [this.sessionService.Email];
  //       let receivers: string[] = [this.sessionService.Email];
  //       response.value.forEach((record: any) => {
  //         if (record.EMail && record.EMail !== '') {
  //           receivers.push(record.EMail);
  //         }
  //       });
  //       this.emailNotifyService.sendNotification(senders, receivers, 'Order', data[this.config.headerApiOrderByField], documentAction)
  //     });
  //   }
  updatePendingApprovalID(data: any) {
    ////////12-10-21
    console.log(data);

    let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.Number + "'"
    this.restService.get(url).subscribe((response: any) => {
      if (response) {
        const ifMatchKey = "*"; // record["@odata.etag"];
        const query = '(' + data.Id + ')';
        this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
        // this.formDataService.updateControlData$.next({ control: 'PendingApproversEmailId', data: response.value[0].ApproverEmailId, eventEmit: true });
        let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId };
        this.PendingApproversID = response.value[0].ApproverID;
        this.PendingApproversEmailId = response.value[0].ApproverEmailId;
        console.log(patchData);
        this.restService.patch("/purchaseOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
        });
      }
    });
    ////////12-10-21
  }
  updatePendingApprovalIDForInvoiceReview(data: any) {
    let url = "/documentReviewEntries?$filter=Status eq 'Open' and DocumentNo eq '" + data.Number + "' and VariationOrder eq false"
    this.restService.get(url).subscribe((response: any) => {
      if (response) {
        this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
        this.formDataService.updateControlData$.next({ control: 'PendingApproversEmailId', data: response.value[0].ApproverEmailId, eventEmit: true });
        this.PendingApproversID = response.value[0].ApproverID;
        this.PendingApproversEmailId = response.value[0].ApproverEmailId;
        const ifMatchKey = "*"; // record["@odata.etag"];
        const query = '(' + data.Id + ')';
        let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
        this.restService.patch("/purchaseOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
          this.addItemService.enableOrDisableAllControls$.next(false);
        });
      }
    });
  }
  updatePendingApprovalIDForReview(data: any) {
    ////////12-10-21
    console.log(data);
    let url = "/documentReviewEntries?$filter=Status eq 'Open' and DocumentNo eq '" + data.Number + "' and VariationOrder eq false"
    this.restService.get(url).subscribe((response: any) => {
      if (response) {
        this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
        this.formDataService.updateControlData$.next({ control: 'PendingApproversEmailId', data: response.value[0].ApproverEmailId, eventEmit: true });
        this.PendingApproversID = response.value[0].ApproverID;
        this.PendingApproversEmailId = response.value[0].ApproverEmailId;
        const ifMatchKey = "*"; // record["@odata.etag"];
        const query = '(' + data.Id + ')';
        let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
        this.restService.patch("/purchaseOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
          this.addItemService.enableOrDisableAllControls$.next(false);
        });
      }
    });
  }
  prepayment(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.postPrepaymentInvoice';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Prepayment Posted');
      this.formDataService.updateControlData$.next({ control: 'Status', data: 'Pending Prepayment', eventEmit: true });
      this.addItemService.enableOrDisableAllControls$.next(false);
      this.addItemService.showLoader$.next(false);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  sendApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendPurchaseOrderApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Approval Request!');
      this.formDataService.updateControlData$.next({ control: 'Status', data: 'Pending Approval', eventEmit: true });
      this.addItemService.enableOrDisableAllControls$.next(false);
      this.getApproverDetails(buttonData.data, 'SendApprovalRequest');
      this.updatePendingApprovalID(buttonData.data);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  SubmitWorkflow(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.PortalSendPOApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Approval Request!');
      this.formDataService.updateControlData$.next({ control: 'Status', data: 'Pending Approval', eventEmit: true });
      this.addItemService.enableOrDisableAllControls$.next(false);
      this.getApproverDetails(buttonData.data, 'SendApprovalRequest');
      this.updatePendingApprovalID(buttonData.data);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }


  cancelApprovalRequest(buttonData: CustomButtonEvent) {
    if (buttonData.data.Status === 'Pending Approval') {
      const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelPurchaseOrderApproval';
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success('Sent Cancel Request!');
        this.formDataService.updateControlData$.next({ control: 'Status', data: 'Open', eventEmit: true });
        this.getApproverDetails(buttonData.data, 'CancelApprovalRequest');
      }, error => {
        this.addItemService.showLoader$.next(false);
      });
    }
  }

  isGRNQuantityNull(lines: any[]) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.Type == "G/L Account" && line.QtyToReceive == 0) {
        return false;
      }
    }

    return true;
  }

  GRNReview(buttonData: CustomButtonEvent) {
    if (buttonData.headerData.InvoiceReviewStatus == "Open") {    ////added this login on 21_01_22 

      // if (this.isGRNQuantityNull(buttonData.lineData)) {//TMY//arka//12/8/22

      this.formDataService.updateControlData$.next({ control: 'ReviewType', data: 'GRN Review', eventEmit: true });
      const ifMatchKey = "*"; // record["@odata.etag"];
      const query = '(' + buttonData.data.Id + ')';
      let patchData = { "ReviewType": "GRN Review" }
      this.restService.patch(this.config.addItemConfig!.headerConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
        const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendGrnReview';
        this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
          this.toastr.success('Sent GRN Review Request!');
          this.formDataService.updateControlData$.next({ control: 'GRNReviewStatus', data: 'Pending Review', eventEmit: true });
          this.addItemService.enableOrDisableAllControls$.next(false);
          this.getReviewApproverDetails(buttonData.data, "GRNReview");
          this.updatePendingApprovalIDForReview(buttonData.data);

        }, error => {
          this.addItemService.showLoader$.next(false);
        });
      }, (error) => {
        this.addItemService.showLoader$.next(false);
      });

      // } else {//TMY//arka//12/8/22
      //   this.addItemService.showLoader$.next(false);//TMY//arka//12/8/22
      //   this.toastr.warning("Qty. to Receive can't be '0'.");//TMY//arka//12/8/22
      // }//TMY//arka//12/8/22
    }
    else {
      this.toastr.error("Invoice Review Status must be Open");
      this.addItemService.showLoader$.next(false);
    }

  }

  CancelGRNReview(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelGrnReview';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Cancel GRN Review Request!');
      // if (buttonData.lineData) {
      //   buttonData.lineData.forEach((line: any, rowIndex: number) => {
      //     this.formDataService.enableLineControl$.next({ label: 'QtyToReceive', rowIndex: rowIndex });
      //   })
      // }
      this.formDataService.updateControlData$.next({ control: 'GRNReviewStatus', data: 'Open', eventEmit: true });
      this.getReviewApproverDetails(buttonData.data, 'CancelGRNReview');
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  // isInvoiceQuantityMatched(lines: any[]) {
  //   for (let i = 0; i < lines.length; i++) {
  //     const line = lines[i];
  //     if(line.Type == "G/L Account"){
  //     if (line.Type == "G/L Account" && line.QtyToInvoice !== 0) {
  //       // if (+line.QuantityReceived !== 0 && +line.QtyToInvoice !== 0 && +line.QuantityInvoiced !== 0) {
  //       if (+line.QtyToInvoice > +line.QuantityReceived - +line.QuantityInvoiced) {
  //         console.log(+line.QtyToInvoice);
  //         return false;
  //       }
  //     }
  //     else { return false; }
  //   }
  //   }
  //   return true;
  // }

  isInvoiceQuantityMatched(lines: any[]) {
    let ZeroCounter = 0
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.Type == "G/L Account") {
        if (line.Type == "G/L Account" && line.QtyToInvoice !== 0) {
          // if (+line.QuantityReceived !== 0 && +line.QtyToInvoice !== 0 && +line.QuantityInvoiced !== 0) {
          let a = +line.QuantityReceived - +line.QuantityInvoiced;
          let b = +a.toFixed(2);
          let QtyToInvoice = +line.QtyToInvoice.toFixed(2);

          if (QtyToInvoice > b) {
            return false;
          }
        }
        else {
          ZeroCounter = ZeroCounter + 1;
          // return false; 
        }
      }
    }
    console.log(ZeroCounter);
    if (lines.length == ZeroCounter) {
      return false;
    }
    else {
      return true;
    }
  }

  InvoiceReview(buttonData: CustomButtonEvent) {
    if (buttonData.headerData.GRNReviewStatus == "Open") {    ////added this login on 21_01_22 
      if (this.isInvoiceQuantityMatched(buttonData.lineData!)) {
        this.formDataService.updateControlData$.next({ control: 'ReviewType', data: 'Invoice Review', eventEmit: true });
        const ifMatchKey = "*"; // record["@odata.etag"];
        const query = '(' + buttonData.data.Id + ')';
        let patchData = { "ReviewType": "Invoice Review" }
        this.restService.patch(this.config.addItemConfig!.headerConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
          const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendInvoiceReview';
          this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
            this.toastr.success('Sent Invoice Review Request!');
            this.formDataService.updateControlData$.next({ control: 'InvoiceReviewStatus', data: 'Pending Review', eventEmit: true });
            this.addItemService.enableOrDisableAllControls$.next(false);
            this.getReviewApproverDetails(buttonData.data, "InvoiceReview")
            this.updatePendingApprovalIDForInvoiceReview(buttonData.data);

          }, error => {
            this.addItemService.showLoader$.next(false);
          });
        }, (error) => {
          this.addItemService.showLoader$.next(false);
        });
      } else {
        this.addItemService.showLoader$.next(false);
        //   this.toastr.warning("Qty To Invoice can't be '0' / Not able to send Invoice Review beacause Qty. Receieved and Qty. Invoiced are not equal or same.");
        this.toastr.warning("Qty To Invoice can't be '0' for all lines / Not able to send Invoice Review beacause Qty. Receieved and Qty. Invoiced are not equal or same.");
      }
    }
    else {
      this.toastr.error("GRN Review Status must be Open");
      this.addItemService.showLoader$.next(false);
    }

  }

  CancelInvoiceReview(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelInvoiceReview';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Cancel Invoice Review Request!');
      this.formDataService.updateControlData$.next({ control: 'InvoiceReviewStatus', data: 'Open', eventEmit: true });
      this.getReviewApproverDetails(buttonData.data, 'CancelInvoiceReview');
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  postApi(url: any, Userurl: any, buttonData: CustomButtonEvent, postType?: string) {
    console.log(buttonData);
    console.log(postType);
    console.log(Userurl);

    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      // if(buttonData.lineData.){
      // this.restService.get("https://api.businesscentral.dynamics.com/v2.0/cenergi-sea.com/CenergiSEA-Sandbox/api/tecsa/cenergi/v1.0/companies(bbadbc0f-7e40-ec11-a459-002248562bdc)/postedPurchInvHeaders?$FILTER= OrderNo eq '"+ buttonData.data.Number+"'").subscribe((response: any) => {
      //   console.log(response);

      // });

      // this.PendingApproversID = response.value[0].ApproverID;
      // this.PendingApproversEmailId = response.value[0].ApproverEmailId;
      // const ifMatchKey = "*"; // record["@odata.etag"];
      // const query = '(' + buttonData.data.header.Id + ')';
      // let patchData = { 
      //   "PendingApproversID": response.value[0].ApproverID,
      //   "PendingApproversEmailId": response.value[0].ApproverEmailId
      // }
      // console.log(patchData);
      // this.restService.patch("/purchaseOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
      //   this.addItemService.enableOrDisableAllControls$.next(false);
      // });
      // }
      // else{
      if (postType == 'rcpt') {
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
      }
      else {
        if (buttonData.lineData) {
          let totalAmountInvoiced = 0;

          buttonData.lineData.forEach((line: any, rowIndex: number) => {
            let NewQuantityInvoiced = 0;
            let NewAmountyInvoiced = 0;

            if (line['Quantity'] > line['QuantityInvoiced'] + line['QtyToInvoice']) {
              NewQuantityInvoiced = line['QuantityInvoiced'] + line['QtyToInvoice'];
              let a = +line['DirectUnitCost'] - (line['LineDiscountAmount'] / line['Quantity']);
              NewAmountyInvoiced = NewQuantityInvoiced * a;

              // NewAmountyInvoiced = NewQuantityInvoiced * line['DirectUnitCost'];//tmy/arka
              this.formDataService.updateControlData$.next({ control: 'InvoiceReviewStatus', data: 'Open', eventEmit: true });
              this.formDataService.updateControlData$.next({ control: 'QtyToInvoice', data: 0, eventEmit: true });
              this.formDataService.updateControlData$.next({ control: 'AmountToInvoice', data: 0, eventEmit: true });
              this.formDataService.updateLineControlData$.next({ control: 'QuantityInvoiced', data: NewQuantityInvoiced.toFixed(2), rowIndex: rowIndex, eventEmit: true });
              totalAmountInvoiced = totalAmountInvoiced + NewAmountyInvoiced;
            }
          });
          this.formDataService.updateControlData$.next({ control: 'totalAmountInvoiced', data: totalAmountInvoiced.toFixed(2) });
          this.formDataService.updateControlData$.next({ control: 'totalAmountToInvoice', data: 0 });
        }
        this.addItemService.showLoader$.next(false);
        this.toastr.success('Purchase Order Posted Successfully!');
      }
      // }
    }, error => {
      this.toastr.error('Failed to Post Purchase Order!');
      this.addItemService.showLoader$.next(false);
    });

  }
  Receipt_Invoice(Id: any) {
    const urlReceive: string = '(' + Id + ')/Microsoft.NAV.postAsReceive';
    this.restService.post(this.config.headerApi + urlReceive, {}).subscribe((response: any) => {
      const urlinvoice: string = '(' + Id + ')/Microsoft.NAV.postAsReceive';
      this.restService.post(this.config.headerApi + urlinvoice, {}).subscribe((response: any) => {
        this.toastr.success('Purchase Order Invoice Posted Successfullt!');
      }, error => {
        this.toastr.error('Failed to Post Purchase Order Invoice!');
      });
      this.toastr.success('Purchase Order Receive Posted Successfullt!');

    }, error => {
      this.toastr.error('Failed to Post Purchase Order Receive!');
    });
  }


  OpenPr() {

  }
}
