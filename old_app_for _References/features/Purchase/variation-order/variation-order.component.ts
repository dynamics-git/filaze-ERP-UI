import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { ArchivedPurchaseQuoteHeader, ArchivedPurchaseQuoteLine } from '../archived-purchase-quote/archived-purchase-quote.config';
import { PurchaseOrderModelComponent } from '../modals/purchase-order-model/purchase-order-model.component';
import { PurchaseQuoteHeader, PurchaseQuoteLine } from '../purchase-quote/purchase-quote.config';
import { PurchaseRequisitionCalculation, PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../purchase-requisition/purchase-requisition.config';
import { VariationOrderCalculation, VariationOrderHeader, VariationOrderLine } from './variation-order.config';
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

@Component({
  standalone: false,
  selector: 'app-variation-order',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (leaveEvent)="leaveEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"p-data-table>'

})
export class VariationOrderComponent {

  config: DataTableConfig = {
    title: 'Variation Order',
    idProp: 'Id',
    headerApi: '/variationOrderHeaders',
    pageName: 'VO',
    showCreate: false,
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
        name: 'Variation Order No',
        prop: 'variationOrderNo',
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
            linkItemType: 'PQ',
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
        name: 'Pending Approvers ID',
        prop: 'PendingApproversID',
      },
      {
        name: 'Remark',
        prop: 'Remark',
      }
    ],
    selctionType: 'single',
    addItemConfig: {
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
    },
    removeUnicodeCharFields: ['Status']
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
      route: '/purchase/variation-order',
      isEnable: false
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
  comments: any;
  headerData: any;
  totalAmountToInvoice: number = 0;
  totalAmountInvoiced: number = 0;
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
  ) {
  }


  popupLoaded(data: any) {
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
      this.formDataService.disableControl$.next('ShortcutDimension1Code');
      this.formDataService.disableControl$.next('ShortcutDimension2Code');
      if (data.header.Status === 'Released') {
        this.addItemService.disableAllControlsExceptSome$.next(["VendorInvoiceNumber", "Line_Quantity", "Line_QtyToReceive", "Line_QtyToInvoice", "PostingDate"]);
      } else {
        this.addItemService.enableOrDisableAllControls$.next(false);
      }
    }
    // /////ValidityDate
    //    let ValidityDate = this.utility.convertDateObjToString(data.header.ValidityDate, true);

    //     if(ValidityDate == '0001-01-01'){
    //         let date=new Date();
    //         let latest_date =this.utility.convertStringToDateObj(this.datepipe.transform(date, 'yyyy-MM-dd'));
    //         this.formDataService.updateControlData$.next({ control: 'ValidityDate', data: latest_date});
    //     } else if(ValidityDate == '1-01-01'){
    //         let date=new Date();
    //         let latest_date =this.utility.convertStringToDateObj(this.datepipe.transform(date, 'yyyy-MM-dd'));
    //         this.formDataService.updateControlData$.next({ control: 'ValidityDate', data: latest_date});
    //     }
    // /////ValidityDate

    // /////DeliveryDate
    // let DeliveryDate = this.utility.convertDateObjToString(data.header.DeliveryDate, true);

    // if(DeliveryDate == '0001-01-01'){
    //     let date=new Date();
    //     let latest_date =this.utility.convertStringToDateObj(this.datepipe.transform(date, 'yyyy-MM-dd'));
    //     this.formDataService.updateControlData$.next({ control: 'DeliveryDate', data: latest_date});
    // } else if(DeliveryDate == '1-01-01'){
    //     let date=new Date();
    //     let latest_date =this.utility.convertStringToDateObj(this.datepipe.transform(date, 'yyyy-MM-dd'));
    //     this.formDataService.updateControlData$.next({ control: 'DeliveryDate', data: latest_date});
    // }
    /////DeliveryDate


    ////////12-10-21
    if (data.header.Status == 'Pending Approval') {
      let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.Number + "'"
      this.restService.get(url).subscribe((response: any) => {
        if (response) {
          this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
          this.PendingApproversID = response.value[0].ApproverID;
          this.PendingApproversEmailId = response.value[0].ApproverEmailId;
          const ifMatchKey = "*"; // record["@odata.etag"];
          const query = '(' + data.header.Id + ')';
          let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
          this.restService.patch("/variationOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
          });
        }
      });
    }
    else if (data.header.GRNReviewStatus == 'Pending Review') {
      let url = "/documentReviewEntries?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.Number + "' and VariationOrder eq true"
      this.restService.get(url).subscribe((response: any) => {
        if (response) {
          this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
          this.PendingApproversID = response.value[0].ApproverID;
          this.PendingApproversEmailId = response.value[0].ApproverEmailId;
          const ifMatchKey = "*"; // record["@odata.etag"];
          const query = '(' + data.header.Id + ')';
          let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
          this.restService.patch("/variationOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
            this.addItemService.enableOrDisableAllControls$.next(false);
          });
        }
      });
    }
    else if (data.header.InvoiceReviewStatus == 'Pending Review') {
      let url = "/documentReviewEntries?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.Number + "' and VariationOrder eq true"
      this.restService.get(url).subscribe((response: any) => {
        if (response) {
          this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
          this.PendingApproversID = response.value[0].ApproverID;
          this.PendingApproversEmailId = response.value[0].ApproverEmailId;
          const ifMatchKey = "*"; // record["@odata.etag"];
          const query = '(' + data.header.Id + ')';
          let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
          this.restService.patch("/variationOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
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
        // const SUBGROUP = response.value.filter(m => m.DimensionCode == "SUBGROUP");
        // this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimCode3', items: SUBGROUP, displayFormat: '[Code] - [Name]', bindValue: 'Code', rowIndex: rowIndex });

        // const SUBSUBGROUP = response.value.filter(m => m.DimensionCode == "SUB-SUBGROUP");
        // this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimCode4', items: SUBSUBGROUP, displayFormat: '[Code] - [Name]', bindValue: 'Code', rowIndex: rowIndex });

        // const ENTITY = response.value.filter(m => m.DimensionCode == "ENTITY");
        // this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimCode5', items: ENTITY, displayFormat: '[Code] - [Name]', bindValue: 'Code', rowIndex: rowIndex });

        // const GROUP = response.value.filter(m => m.DimensionCode == "GROUP");
        // this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimCode6', items: GROUP, displayFormat: '[Code] - [Name]', bindValue: 'Code', rowIndex: rowIndex });

        // const SEGMENT = response.value.filter(m => m.DimensionCode == "SEGMENT");
        // this.formFielService.updateDropdownItem$.next({ label: 'ShortcutDimCode7', items: GROUP, displayFormat: '[Code] - [Name]', bindValue: 'Code', rowIndex: rowIndex });
        // });

      }
    });
    /////ar//dimention///
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
            this.updateGLAccounts(data.rowIndex);
            break;
          case ' ':
            this.formDataService.disableLineControlsList$.next([
              { label: 'No', rowIndex: data.rowIndex, clearValue: true },
              { label: 'UnitOfMeasure', rowIndex: data.rowIndex, clearValue: true },
              { label: 'LocationCode', rowIndex: data.rowIndex, clearValue: true },
              { label: 'Quantity', rowIndex: data.rowIndex, clearValue: true },
              { label: 'OriginalCost', rowIndex: data.rowIndex, clearValue: true },
              { label: 'Tax', rowIndex: data.rowIndex, clearValue: true },
              { label: 'DirectUnitCost', rowIndex: data.rowIndex, clearValue: true },
              { label: 'LineDiscountAmount', rowIndex: data.rowIndex, clearValue: true },
              { label: 'QtyToReceive', rowIndex: data.rowIndex, clearValue: true },
              { label: 'QuantityReceived', rowIndex: data.rowIndex, clearValue: true },
              { label: 'QtyToInvoice', rowIndex: data.rowIndex, clearValue: true },
              { label: 'QuantityInvoiced', rowIndex: data.rowIndex, clearValue: true },
              { label: 'LineAmount', rowIndex: data.rowIndex, clearValue: true },
              { label: 'AmountToInvoice', rowIndex: data.rowIndex, clearValue: true },
              { label: 'AmountInvoiced', rowIndex: data.rowIndex, clearValue: true }
            ]);
            break;
          default:
            this.formDataService.disableLineControl$.next({ label: 'No', rowIndex: rowIndex });
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
            break;
        }
        this.formDataService.disableLineControl$.next({ label: 'documentType', rowIndex: rowIndex });
        this.formDataService.disableLineControl$.next({ label: 'Type', rowIndex: rowIndex });
        this.formDataService.disableLineControl$.next({ label: 'No', rowIndex: rowIndex });
        this.formDataService.disableLineControl$.next({ label: 'Description', rowIndex: rowIndex });
        this.formDataService.disableLineControl$.next({ label: 'UnitOfMeasure', rowIndex: rowIndex });
        this.formDataService.disableLineControl$.next({ label: 'LocationCode', rowIndex: rowIndex });
      });
    }
    this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    this.formDataService.updateControlData$.next({ control: 'totalAmountToInvoice', data: this.totalAmountToInvoice.toFixed(2) });
    this.formDataService.updateControlData$.next({ control: 'totalAmountInvoiced', data: this.totalAmountInvoiced.toFixed(2) });
  }

  changeEvent(data: EventDataModel) {
    if (data.section == SectionType.Header) {
      switch (data.control) {
        case 'LocationCode':
          if (data.data == "") {
            const ifMatchKey = "*"; // record["@odata.etag"];
            let patchData = { "LocationCode": "" }
            const query = '(' + this.headerData.Id + ')';
            this.restService.patch("/variationOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
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
            this.restService.patch("/variationOrderHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
            }, error => {
            });
          }
          break;
      }
    } else if (data.section == SectionType.Line) {
      switch (data.control) {
        case 'Type':
          this.changePurchaseRequisitionType(data);
          break;
        case 'No':
          this.changeItemNo(data);
          break;
        case 'Quantity':
        case 'OriginalCost':
        case 'DirectUnitCost':
          this.calculateAmount(data);
          break;
        case 'QtyToReceive':
          if (data.data !== data.activeData.QtyToReceive) {
            setTimeout(() => {
              this.formDataService.updateLineControlData$.next({ control: 'QtyToInvoice', data: 0, rowIndex: data.rowIndex, eventEmit: true });
            }, 100);
          }

          this.calculateAmountToInvoice(data);
          break;
        case 'QtyToInvoice':
          if (this.headerData.InvoiceReviewStatus !== "Open") {
            setTimeout(() => {
              this.formDataService.updateLineControlData$.next({ control: 'QtyToInvoice', data: data.activeData.QtyToInvoice, rowIndex: data.rowIndex, eventEmit: true });
            }, 100);
          } else {
            this.calculateAmountToInvoice(data);
          }
          break;
        case 'LineDiscountAmount':
          this.calforLineDiscount(data);
          break;
      }
    }

  }
  leaveEvent(data: FormDataModel) {
    // console.log(data);

    //   if (data.section == SectionType.Line) {
    //     const lineData = data.data;
    //     this.totalAmount = 0;
    //     this.totalAmountToInvoice = 0;
    //     this.totalAmountInvoiced = 0;

    //     if (lineData) {
    //       lineData.forEach((line: any, rowIndex: number) => {

    //         let lineAmnt = (line['Quantity'] * line['DirectUnitCost']) - +line['LineDiscountAmount'];
    //         let lineAmnttoInv = line['QtyToInvoice'] *(line['DirectUnitCost'] - (line['LineDiscountAmount'] / line['Quantity']));
    //         let lineInvoicedAmnt = line['QuantityInvoiced'] * (line['DirectUnitCost'] - (line['LineDiscountAmount'] / line['Quantity']));
    //         // console.log(lineAmnttoInv);
    //         // console.log(lineInvoicedAmnt);
    //         this.totalAmount += lineAmnt ? +lineAmnt : 0;
    //         this.totalAmountToInvoice += lineAmnttoInv ? +lineAmnttoInv : 0;
    //         this.totalAmountInvoiced += lineInvoicedAmnt ? +lineInvoicedAmnt : 0;

    //       });
    //       // console.log(this.totalAmount);
    //       this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    //       this.formDataService.updateControlData$.next({ control: 'totalAmountToInvoice', data: this.totalAmountToInvoice.toFixed(2) });
    //       this.formDataService.updateControlData$.next({ control: 'totalAmountInvoiced', data: this.totalAmountInvoiced.toFixed(2) });
    //     }

    // }

  }

  changePurchaseRequisitionType(data: EventDataModel) {
    this.formDataService.updateLineControlData$.next({ control: 'No', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'Description', data: null, rowIndex: data.rowIndex });
    switch (data.data) {
      case 'G/L Account':
        this.formDataService.enableLineControlsList$.next([
          { label: 'No', rowIndex: data.rowIndex! },
          { label: 'UnitOfMeasure', rowIndex: data.rowIndex! },
          { label: 'LocationCode', rowIndex: data.rowIndex! },
          { label: 'Quantity', rowIndex: data.rowIndex! },
          { label: 'OriginalCost', rowIndex: data.rowIndex! },
          { label: 'Tax', rowIndex: data.rowIndex! },
          { label: 'DirectUnitCost', rowIndex: data.rowIndex! },
          { label: 'LineDiscountAmount', rowIndex: data.rowIndex! },
          { label: 'QtyToReceive', rowIndex: data.rowIndex! },
          { label: 'QuantityReceived', rowIndex: data.rowIndex! },
          { label: 'QtyToInvoice', rowIndex: data.rowIndex! },
          { label: 'QuantityInvoiced', rowIndex: data.rowIndex! },
          { label: 'LineAmount', rowIndex: data.rowIndex! },
          { label: 'AmountToInvoice', rowIndex: data.rowIndex! },
          { label: 'AmountInvoiced', rowIndex: data.rowIndex! }
        ]);

        this.updateGLAccounts(data.rowIndex!);
        break;
      case 'Item':
        this.formDataService.enableLineControl$.next({ label: 'No', rowIndex: data.rowIndex! });
        if (this.itemData) {
          this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/Items').subscribe((response: any) => {
            this.itemData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case 'Fixed Asset':
        this.formDataService.enableLineControl$.next({ label: 'No', rowIndex: data.rowIndex! });
        if (this.fixedAssetData) {
          this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/fixedAssets').subscribe((response: any) => {
            this.fixedAssetData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case ' ':
        this.formDataService.disableLineControlsList$.next([
          { label: 'No', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'UnitOfMeasure', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'LocationCode', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'Quantity', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'OriginalCost', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'Tax', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'DirectUnitCost', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'LineDiscountAmount', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'QtyToReceive', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'QuantityReceived', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'QtyToInvoice', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'QuantityInvoiced', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'LineAmount', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'AmountToInvoice', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'AmountInvoiced', rowIndex: data.rowIndex!, clearValue: true }
        ]);
        break;
      default:
        this.formDataService.disableLineControl$.next({ label: 'No', rowIndex: data.rowIndex! });
        break;
    }
  }

  private updateGLAccounts(rowIndex: number) {
    if (this.chartAccountData) {
      this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
    } else {
      this.restService.get('/glAccounts').subscribe((response: any) => {
        this.chartAccountData = response.value;
        this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
      });
    }
  }

  changeItemNo(data: EventDataModel) {
    const type = this.utility.removeLineUnicodeChars(data.activeData.Type);
    switch (type) {
      case 'G/L Account':
        this.addItemService.updateLineMultipleControlsData$.next({
          data: {
            No: data.data,
            Description: data.dropdownData.Name
          }, rowIndex: data.rowIndex!, emitEvent: false
        });
        break;
      case 'Item':
      case 'Fixed Asset':
      case ' ':
        this.addItemService.updateLineMultipleControlsData$.next({
          data: {
            Description: data.dropdownData.Name
          }, rowIndex: data.rowIndex!, emitEvent: false
        });
        break;
    }
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
    const unitPrice = data.control === 'DirectUnitCost' || data.control === 'OriginalCost' ? data.data : data.activeData.DirectUnitCost;
    const LineDiscountAmount = data.control === 'LineDiscountAmount' ? data.data : data.activeData.LineDiscountAmount;

    let amount = 0;
    if (quantity && unitPrice && !LineDiscountAmount) {
      amount = +quantity * +unitPrice;
    } else if (quantity && unitPrice && LineDiscountAmount) {
      amount = (+quantity * +unitPrice) - +LineDiscountAmount;
    }

    if (data.control === 'OriginalCost' && data.data) {
      this.addItemService.updateLineMultipleControlsData$.next({
        data: {
          [data.control]: +data.data,
          LineAmount: +((amount).toFixed(2))
        }, rowIndex: data.rowIndex!, emitEvent: false
      });
    }

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
    // if (buttonData.button.label === 'SendApprovalRequest') {
    //     const url: string = '(' + buttonData.data[this.config.idProp] + ')/Microsoft.NAV.sendPurchaseOrderApproval';
    //     this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
    //         this.toastr.success('Sent Approval Request!');
    //         this.formDataService.updateControlData$.next({ control: 'Status', data: 'Pending Approval' });
    //         this.addItemService.enableOrDisableAllControls$.next(false);
    //     }, error => {
    //         this.toastr.error('Failed to send Approval Request!');
    //     });
    // } 
    // else if (buttonData.button.label === 'CancelApprovalRequest') {
    //     if (buttonData.data.ApprovalStatus === 'Pending') {
    //         const url: string = '(' + buttonData.data[this.config.idProp] + ')/Microsoft.NAV.cancelPurchaseOrderApproval';
    //         this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
    //             this.toastr.success('Sent Cancel Request!');
    //             this.formDataService.updateControlData$.next({ control: 'Status', data: 'Open' });
    //         }, error => {
    //             this.toastr.error('Failed to send Cancel Request!');
    //         });
    //     }
    // } 
    if (buttonData.button.label === 'prepayment') {
      if (buttonData.data.Status === 'Open') {
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
      }
      else {
        this.toastr.error('Status Must Be Open');
      }
    }
    else if (buttonData.button.label === 'SendApprovalRequest') {
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
        this.addItemService.showLoader$.next(false);
      }
    }
    else if (buttonData.button.label === 'CancelApprovalRequest') {
      if (buttonData.data.Status === 'Pending Approval') {
        this.addItemService.showLoader$.next(true);
        // this.updateUserId(buttonData,false, "");
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
    }
    else if (buttonData.button.label === 'GRNReview') {
      if (buttonData.data.Status === 'Released') {

        this.addItemService.showLoader$.next(true);
        this.updateUserId(buttonData, false, "GRNReview");

      }
      else {
        this.toastr.error('Status Must Be Released');
      }
    }
    else if (buttonData.button.label === 'CancelGRNReview') {
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
    }
    else if (buttonData.button.label === 'InvoiceReview') {
      if (buttonData.headerData.VendorInvoiceNumber) {
        this.addItemService.showLoader$.next(true);
        this.updateUserId(buttonData, false, "InvoiceReview");
      }
      else {
        this.toastr.error('Must have Vendor Invoice Number');
      }
    }
    else if (buttonData.button.label === 'CancelInvoiceReview') {
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
    }
    else if (buttonData.button.label === 'Post') {
      // if (buttonData.data.ApprovalStatus === 'Released') {
      //     const url: string = '(' + buttonData.data[this.config.idProp] + ')/Microsoft.NAV.convertPurchaseQuoteToOrder';
      //     this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      //         this.toastr.success('Converted to Purchase Order!');
      //     }, error => {
      //         this.toastr.error('Failed to convert Purchase Order!');
      //     });
      // } else {
      //     this.toastr.warning('The PQ should be approved before you should convert it into PO');
      // }
      if (buttonData.data.Status === 'Released') {
        this.addItemService.showLoader$.next(true);

        if (buttonData.data.Id) {
          this.addItemService.showLoader$.next(false);
          const modalRef = this.modal.open(PurchaseOrderModelComponent);
          modalRef.result.then((result) => {
            console.log(result);
            if (result) {
              switch (result) {
                case 'rcpt':
                  if (buttonData.data.GRNReviewStatus === 'Reviewed') {
                    const urlReceive: string = '(' + buttonData.data.Id + ')/Microsoft.NAV.postAsReceive';
                    this.addItemService.showLoader$.next(true);
                    // this.postApi(urlReceive, buttonData,);
                    //TMY/arka/post new logic-22-6-22
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
                    //
                  }
                  else {
                    this.addItemService.showLoader$.next(false);
                    this.toastr.error('The Document GRNReviewStatus must be "Reviewed" in order to Post');
                  }
                  break;

                case 'invc':
                  if (buttonData.data.InvoiceReviewStatus === 'Reviewed') {
                    const urlinvoice: string = '(' + buttonData.data.Id + ')/Microsoft.NAV.postAsInvoice';
                    this.addItemService.showLoader$.next(true);
                    // this.postApi(urlinvoice, buttonData.data.Id);
                    //
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
                    //
                  }
                  else {
                    this.addItemService.showLoader$.next(false);
                    this.toastr.error('The Document InvoiceReviewStatus must be "Reviewed" in order to Post');
                  }
                  break;

                case 'receiptinvoice':
                  this.Receipt_Invoice(buttonData.data.Id);
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
        this.toastr.success('The Document Status must be "Released" in order to Post');
      }
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
      else if (!approve && !GRVandInvoiceReview) {
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
      else if (GRVandInvoiceReview == "VendorAcceptance") {
        this.venderacceptFn(buttonData);
      }

    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  venderacceptFn(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.vendorAcceptance';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      // this.toastr.success('Sent Approval Request!');
      this.formDataService.updateControlData$.next({ control: 'VendorStatus', data: 'Accepted by Vendor' });
      buttonData.data.VendorStatus = "Vendor Accepted";
      console.log(buttonData.data.Id);
      // const ifMatchKey = "*"; // record["@odata.etag"];
      // const query = '(' + buttonData.data.Id + ')';
      // let patchData = { "VendorStatus": "Vendor Accepted" }
      // this.restService.patch(this.config.addItemConfig.headerConfig.api + query, patchData, ifMatchKey).subscribe((response: any) => {
      this.toastr.success('Vendor Status Updated to "Vendor Accepted');
      this.addItemService.enableOrDisableAllControls$.next(false);
      this.addItemService.showLoader$.next(false);
      // }, (error) => {
      //   this.addItemService.showLoader$.next(false);
      // });

    }, (error) => {
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
    const url: string = "/approvalSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Order' and VariationOrder eq true and GroupID eq '" + approvgrp + "'";
    this.restService.get(url).subscribe((response: any) => {
      let senders: string[] = [this.sessionService.Email];
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
        receivers.push(data.PendingApproversEmailId);
      }
      else {
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

  getReviewApproverDetails(data: any, documentAction: string) {
    //const url: string = "/documentReviewSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Order'";
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
      let receivers: string[] = [];
      if (typeof data.DocumentDate !== 'string') {
        data.DocumentDate = this.utility.convertDateObjToString(data.DocumentDate, true);
      }
      let approvalId: string = '';
      if (response.value[0]) {
        approvalId = response.value[0].ApproverID;
      }
      if (documentAction == 'CancelGRNReview' || documentAction == 'CancelInvoiceReview') {////new cancel logic
        approvalId = this.PendingApproversID;
        receivers.push(this.PendingApproversEmailId);
      }
      else {
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
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendVariationOrderApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Approval Request!');
      this.formDataService.updateControlData$.next({ control: 'Status', data: 'Pending Approval' });
      this.addItemService.enableOrDisableAllControls$.next(false);
      this.getApproverDetails(buttonData.data, 'SentApprovalRequest');
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  cancelApprovalRequest(buttonData: CustomButtonEvent) {
    if (buttonData.data.Status === 'Pending Approval') {
      const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelVariationOrderApproval';
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success('Sent Cancel Request!');
        this.formDataService.updateControlData$.next({ control: 'Status', data: 'Open' });
        this.getApproverDetails(buttonData.data, 'CancelApprovalRequest');
      }, error => {
        this.addItemService.showLoader$.next(false);
      });
    }
  }

  GRNReview(buttonData: CustomButtonEvent) {
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
        this.getReviewApproverDetails(buttonData.data, 'GRNReview');
      }, error => {
        this.addItemService.showLoader$.next(false);

      });
    }, (error) => {
      this.addItemService.showLoader$.next(false);
    });
  }

  CancelGRNReview(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelGrnReview';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Cancel GRN Review Request!');
      this.formDataService.updateControlData$.next({ control: 'GRNReviewStatus', data: 'Open', eventEmit: true });
      this.getReviewApproverDetails(buttonData.data, 'CancelGRNReview');
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  isInvoiceQuantityMatched(lines: any[]) {
    let ZeroCounter = 0
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // if (+line.QuantityReceived !== 0 && +line.QtyToInvoice !== 0 && +line.QuantityInvoiced !== 0) {
      //   if (+line.QtyToInvoice > +line.QuantityReceived - +line.QuantityInvoiced) {
      //     return false;
      //   }
      // }
      if (line.Type == "G/L Account") {
        if (line.Type == "G/L Account" && line.QtyToInvoice !== 0) {
          // if (+line.QuantityReceived !== 0 && +line.QtyToInvoice !== 0 && +line.QuantityInvoiced !== 0) {
          if (+line.QtyToInvoice > +line.QuantityReceived - +line.QuantityInvoiced) {
            console.log(+line.QtyToInvoice);
            return false;
          }
        }
        else {
          // return false; 
          ZeroCounter = ZeroCounter + 1;

        }
      }

    }
    if (lines.length == ZeroCounter) {
      return false;
    }
    else {
      return true;
    }
    // return true;
  }
  InvoiceReview(buttonData: CustomButtonEvent) {
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
          this.getReviewApproverDetails(buttonData.data, 'InvoiceReview');
        }, error => {
          this.addItemService.showLoader$.next(false);
        });
      }, (error) => {
        this.addItemService.showLoader$.next(false);
      });
    } else {
      this.addItemService.showLoader$.next(false);
      // this.toastr.warning("Not able to send Invoice Review beacause Qty. Receieved and Qty. Invoiced are not equal or same.");
      this.toastr.warning("Qty To Invoice can't be '0' for all lines / Not able to send Invoice Review beacause Qty. Receieved and Qty. Invoiced are not equal or same.");

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
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      // this.toastr.success('Purchase Order Posted Successfully!');
      // this.addItemService.showLoader$.next(false);
      //TMY/arka/post new logic-22-6-22
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
              // NewAmountyInvoiced = NewQuantityInvoiced * line['DirectUnitCost'];//tmy//arka
              console.log(NewAmountyInvoiced);

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
      //TMY/arka/post new logic-22-6-22//end
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
}
