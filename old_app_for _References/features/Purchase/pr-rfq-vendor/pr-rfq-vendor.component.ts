import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

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
import { RFQVenderSelectionHeader, RFQVenderSelectionLine } from './pr-rfq-vendor.config';
import { PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../purchase-requisition/purchase-requisition.config';
import { PurchaseInvoiceCalculation } from '../purchase-invoice/purchase-invoice.config';

@Component({
  standalone: false,
  selector: 'app-pr-rfq-vendor',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (leaveEvent)="leaveEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>'

})
export class PrRfqVendorComponent {


  config: DataTableConfig = {
    title: 'RFQ Vendor Selection',
    idProp: 'Id',
    headerApi: '/rfqVendorSelectionHeaders',
    pageName: 'RFQ-VS',
    headerApiOrderByField: 'Number',
    filters: [
      {
        field: 'rfqNo',
        operator: 'ne',
        value: "' '"
      },
      {
        field: 'isVendorRequired',
        operator: 'eq',
        value: 'true'
      },
      {
        field: 'isVendorSelected',
        operator: 'eq',
        value: 'true'
      }
    ],
    filterByUserCompanyResCenter: true,
    showDelete: false,
    showCreate: false,
    headers: [{
      name: 'RFQ No',
      prop: 'rfqNo',
      isPrimaryLink: true
    }, {
      name: 'Requisition No',
      prop: 'Number',
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
    }, {
      name: 'Requisition Date',
      prop: 'RequisitionDate'
    }, {
      name: 'Document Type',
      prop: 'DocumentType'
    }, {
      name: 'Approval Status',
      prop: 'ApprovalStatus'
    },
    {
      name: 'Remark',
      prop: 'Remark',
    }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'RFQ Vendor Selection',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: RFQVenderSelectionHeader,
      lineConfig: RFQVenderSelectionLine,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Requisition',
        documentStatusProp: 'ApprovalStatus',
        informationDetailSecctionType: InformationDetailSecctionType.PurchaseVendorSelection
      }
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
      label: 'RFQ Vendor Selection',
      name: 'RFQ Vendor Selection',
      icon: 'bi bi-arrow-90deg-right',
      isEnable: false
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
  GLNodroparray!: any[];
  LNData!: any[];
  HDData: any;
  chartAccountData!: any[];

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private utility: Utility,
    private sessionService: SessionService,
    private emailNotifyService: EmailNotifyService,
  ) {
  }

  popupLoaded(data: any) {
    if (data.header.ApprovalStatus !== 'Approved') {
      this.addItemService.enableOrDisableAllControls$.next(false);
    }
    const lineData = data.line;
    this.LNData = data.line;
    this.HDData = data.header;

    var GLNodrop = { "code": "" };

    let url = "/prStages?$filter=PurchaseRequisitionNumber eq '" + this.HDData.Number + "'";
    this.restService.get(url).subscribe((response: any) => {
      if (response.value) {
        response.value.forEach((stageline: any, rowIndex: number) => {
          if (stageline.Number) {
            GLNodrop.code = stageline.Number;
            let a = this.GLNodroparray.filter(m => m.code === stageline.Number);
            if (a.length == 0) {
              console.log(this.GLNodroparray.filter(m => m.code === stageline.Number));
              this.GLNodroparray.push(this.utility.copyObj(GLNodrop));
            }
            else {
            }

          }
        });
        if (lineData) {
          lineData.forEach((line: any, rowIndex: number) => {
            if (this.GLNodroparray) {
              this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.GLNodroparray, displayFormat: '[code]', bindValue: 'code', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'Number', data: line.Number, rowIndex: rowIndex });
              }, 100);
            }
          });
        }
      }
    });

    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        if (line.PurchaseRequisitionType === ' ') {
          this.formDataService.disableLineControlsList$.next([
            { label: 'VendorNo', rowIndex: rowIndex, clearValue: true },
            { label: 'Number', rowIndex: rowIndex, clearValue: true },
            { label: 'UnitOfMeasure', rowIndex: rowIndex, clearValue: true },
            { label: 'LocationCode', rowIndex: rowIndex, clearValue: true },
            { label: 'Quantity', rowIndex: rowIndex, clearValue: true },
            { label: 'UnitPrice', rowIndex: rowIndex, clearValue: true },
            { label: 'Amount', rowIndex: rowIndex, clearValue: true },
            { label: 'AmountLCY', rowIndex: rowIndex, clearValue: true }
          ]);
        }
      });
    }
  }

  changeEvent(data: EventDataModel) {
    if (data.section == SectionType.Line) {
      switch (data.control) {
        case 'VendorNo':
          this.vendorSelection(data);
          break;
        case 'Number':
          this.NumberSelection(data);
          break;
        case 'Quantity':
        case 'UnitPrice':
          this.calculateAmount(data);
          break;
        case 'UnitOfMeasure':
          // this.setlineData(data);
          break;
        case 'Amount':
          // this.calculateAmountnew(data);
          break;
        case 'PurchaseRequisitionType':
          this.changePurchaseRequisitionType(data);
          break;
      }

      // if (data.activeData.CurrencyCode) {
      //   this.formDataService.updateLineControlData$.next({ control: 'CurrencyCode', data: data.activeData.CurrencyCode, rowIndex: data.rowIndex, eventEmit: true });
      // }
      // if (data.activeData.AmountLCY) {
      //   this.formDataService.updateLineControlData$.next({ control: 'AmountLCY', data: data.activeData.AmountLCY, rowIndex: data.rowIndex, eventEmit: true });
      // }
    }
  }

  changePurchaseRequisitionType(data: EventDataModel) {
    switch (data.data) {
      case 'G/L Account':
        this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.GLNodroparray, displayFormat: '[code]', bindValue: 'code', rowIndex: data.rowIndex });
        this.formDataService.enableLineControlsList$.next([
          { label: 'VendorNo', rowIndex: data.rowIndex! },
          { label: 'Number', rowIndex: data.rowIndex! },
          { label: 'UnitOfMeasure', rowIndex: data.rowIndex! },
          { label: 'LocationCode', rowIndex: data.rowIndex! },
          { label: 'Quantity', rowIndex: data.rowIndex! },
          { label: 'UnitPrice', rowIndex: data.rowIndex! },
          { label: 'Amount', rowIndex: data.rowIndex! },
          { label: 'AmountLCY', rowIndex: data.rowIndex! }
        ]);
        break;
      case ' ':
        this.formDataService.disableLineControlsList$.next([
          { label: 'VendorNo', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'Number', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'UnitOfMeasure', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'LocationCode', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'Quantity', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'UnitPrice', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'Amount', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'AmountLCY', rowIndex: data.rowIndex!, clearValue: true }
        ]);
        break;
    }
  }

  leaveEvent(data: FormDataModel) {
    console.log(data);
  }

  vendorSelection(data: EventDataModel) {
    if (this.GLNodroparray) {
      this.formFielService.updateDropdownItem$.next({ label: 'Number', items: this.GLNodroparray, displayFormat: '[code]', bindValue: 'code', rowIndex: data.rowIndex });
      setTimeout(() => {
        this.formDataService.updateLineControlData$.next({ control: 'Number', data: data.activeData.Number, rowIndex: data.rowIndex, eventEmit: true });
        this.formDataService.updateLineControlData$.next({ control: 'PurchaseRequisitionType', data: this.LNData[0].PurchaseRequisitionType, rowIndex: data.rowIndex, eventEmit: true });
      }, 100);
    }
  }

  NumberSelection(data: EventDataModel) {
    let thisLine: any;
    let sameaccCounter: number = 0;
    console.log(data);
    this.LNData.forEach((line: any, rowIndex: number) => {
      if (data.data === line.Number) {
        sameaccCounter = sameaccCounter + 1
      }
    });
    this.LNData.forEach((line: any, rowIndex: number) => {
      if (sameaccCounter > 1) {
        if (data.data === line.Number && data.activeData.LineNumber === line.LineNumber) {
          thisLine = line;
          // console.log(thisLine.Description)
          this.formDataService.updateLineControlData$.next({ control: 'Description', data: thisLine.Description, rowIndex: data.rowIndex, eventEmit: true });
        }
      }
      else {
        if (data.data === line.Number) {
          thisLine = line;
          // console.log(thisLine.Description)
          this.formDataService.updateLineControlData$.next({ control: 'Description', data: thisLine.Description, rowIndex: data.rowIndex, eventEmit: true });
        }
      }
    });
  }
  calculateAmountnew(data: EventDataModel) {
    const amount = data.control === 'Amount' ? data.activeData.AmountLCY : data.activeData.AmountLCY;

    let url = "/prStages?$filter=PurchaseRequisitionNumber eq '" + this.HDData.Number + "' and Number eq '" + data.activeData.Number + "'"
    this.restService.get(url).subscribe((response: any) => {
      if (response) {
        if (response.value[0].Amount >= amount) {
        }
        else {
          this.toastr.error("Amount can't greater than PR Approved Amount(" + response.value[0].Amount + ")");
        }
      }
    });
  }

  calculateAmount(data: EventDataModel) {
    const quantity = data.control === 'Quantity' ? data.data : data.activeData.Quantity;
    const unitPrice = data.control === 'UnitPrice' ? data.data : data.activeData.UnitPrice;
    let amount = 0;

    if (quantity && unitPrice) {
      amount = +quantity * +unitPrice;
      const query = '/purchseRequisitionLines(' + data.activeData.Id + ')';
      const ifMatchKey = "*";
      const patchData = {
        "Quantity": +quantity,
        "UnitPrice": +unitPrice
      };

      this.restService.patch(query, patchData, ifMatchKey).subscribe((responseline: any) => {
        if (responseline) {
          let LCY = responseline.AmountLCY
          let amountvalidCounter = 0;
          let url = "/prStages?$filter=PurchaseRequisitionNumber eq '" + this.HDData.Number + "' and Number eq '" + data.activeData.Number + "'"
          this.restService.get(url).subscribe((response: any) => {
            if (response) {
              response.value.forEach((res: any, rIndex: number) => {
                if (res.Amount >= LCY) {
                  amountvalidCounter = +amountvalidCounter + 1;
                }
              });
              if (amountvalidCounter > 0) {
                this.formDataService.updateLineControlData$.next({ control: 'Amount', data: amount.toFixed(2), rowIndex: data.rowIndex, eventEmit: true });
                this.addItemService.patchLineData$.next({
                  rowIndex: data.rowIndex!, data: {
                    Amount: amount.toFixed(2)
                  }, disableControls: false
                });
              } else {
                this.toastr.error("Amount can't greater than PR Approved Amount(" + response.value[0].Amount + ")");
                if (data.control === 'Quantity') {
                  this.formDataService.updateLineControlData$.next({ control: 'Quantity', data: 0, rowIndex: data.rowIndex, eventEmit: true });
                  this.formDataService.updateLineControlData$.next({ control: 'Amount', data: 0, rowIndex: data.rowIndex, eventEmit: true });
                  this.addItemService.patchLineData$.next({
                    rowIndex: data.rowIndex!, data: {
                      Amount: 0,
                      Quantity: 0
                    }, disableControls: false
                  });
                }
                if (data.control === 'UnitPrice') {
                  this.formDataService.updateLineControlData$.next({ control: 'UnitPrice', data: 0, rowIndex: data.rowIndex, eventEmit: true });
                  this.formDataService.updateLineControlData$.next({ control: 'Amount', data: 0, rowIndex: data.rowIndex, eventEmit: true });
                  this.addItemService.patchLineData$.next({
                    rowIndex: data.rowIndex!, data: {
                      Amount: 0,
                      UnitPrice: 0
                    }, disableControls: false
                  });
                }
              }
            }
          });
        };
      });


    }
  }

  setlineData(data: EventDataModel) {
    setTimeout(() => {
      this.formDataService.updateLineControlData$.next({ control: 'PurchaseRequisitionType', data: this.LNData[0].PurchaseRequisitionType, rowIndex: data.rowIndex, eventEmit: true });
      this.formDataService.updateLineControlData$.next({ control: 'Number', data: this.LNData[0].Number, rowIndex: data.rowIndex, eventEmit: true });
      this.formDataService.updateLineControlData$.next({ control: 'Description', data: this.LNData[0].Description, rowIndex: data.rowIndex, eventEmit: true });
      this.formDataService.updateLineControlData$.next({ control: 'LocationCode', data: this.LNData[0].LocationCode, rowIndex: data.rowIndex, eventEmit: true });
      this.formDataService.updateLineControlData$.next({ control: 'Quantity', data: this.LNData[0].Quantity, rowIndex: data.rowIndex, eventEmit: true });
      this.formDataService.updateLineControlData$.next({ control: 'UnitPrice', data: this.LNData[0].UnitPrice, rowIndex: data.rowIndex, eventEmit: true });
      if (data.section == SectionType.Line) {
        if (data.control == 'Amount') {
          if (data.data) {
            this.formDataService.updateLineControlData$.next({ control: 'Amount', data: this.LNData[0].Amount.toFixed(2), rowIndex: data.rowIndex, eventEmit: true });
          }
        }
      }
    }, 100);
  }

  manualPRCancel(buttonData: CustomButtonEvent) {
    if (buttonData.headerData.ManualPRCancel) {
      this.toastr.warning('This Purchase Requisition is already cancelled');
    } else {
      this.cancelPRCancel(buttonData.headerData);
    }
  }

  cancelPRCancel(headerData: any) {
    const patchData = {
      ManualPRCancel: true,
      PurReqCancelUserID: this.sessionService.UserId
    };
    const ifMatchKey = "*"; // this.headerData["@odata.etag"];
    this.addItemService.showLoader$.next(true);
    this.restService.patch(this.config.addItemConfig!.headerConfig!.api + '(' + headerData[this.config.addItemConfig!.headerConfig!.idProp!] + ')', patchData, ifMatchKey).subscribe((response: any) => {
      this.toastr.success('Purchase Requisition has cancelled');
      this.addItemService.showLoader$.next(false);
      this.addItemService.closePopup$.next(true);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label === 'ConvertQuote') {
      if (buttonData.headerData.vendorNo) {
        this.addItemService.showLoader$.next(true);
        // this.updateUserId(buttonData);
        this.ConvertQuote(buttonData);
      } else {
        this.toastr.warning('Please select vendor no.');
      }
    } else if (buttonData.button.label === 'manualPRCancel') {
      this.manualPRCancel(buttonData);
    }

    if (buttonData.button.label === 'ExportToExcel') {
      const url: string = '(' + buttonData.data[this.config.idProp!] + ')/NAV.prLinesToExcel';
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success('Excel downloaded!');
      }, error => {
        this.toastr.error('Failed to download excel!');
      });

    }
  }

  updateUserId(buttonData: CustomButtonEvent, approve?: boolean, convert?: boolean) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getUserId';
    const payload = {
      userid2: this.sessionService.UserId,
      docNo: buttonData.data.Number,
      resCentre: this.sessionService.DefaultResponsibilityCenter,
      comp: this.sessionService.CompanyName,
      compId: this.sessionService.Company,
    };
    this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
      // this.ConvertQuote(buttonData);
      this.addItemService.showLoader$.next(false);
      this.addItemService.closePopup$.next(true);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  getApproverDetails(data: any, documentAction: string) {
    const url: string = "/approvalSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Quote'";
    this.restService.get(url).subscribe((response: any) => {
      let senders: string[] = [this.sessionService.Email];
      let receivers: string[] = [this.sessionService.Email];
      response.value.forEach((record: any) => {
        if (record.EMail && record.EMail !== '') {
          receivers.push(record.EMail);
        }
      });
      this.emailNotifyService.sendNotification(senders, receivers, 'Quote', data[this.config.headerApiOrderByField!], documentAction)
    });
  }

  ConvertQuote(buttonData: CustomButtonEvent) {
    if (buttonData.data.ApprovalStatus === 'Approved') {

      //////////////31//10//2021
      this.mainconvertFN(buttonData) //added on 31/1/22

      // let trueCounter: number = 0
      // buttonData.lineData.forEach((record: any) => { //hussain ask to comment out
      //   let LCY = record.AmountLCY
      //   // let url = "/prStages?$filter=PurchaseRequisitionNumber eq '" + buttonData.headerData.Number + "' and Number eq '" + record.Number + "'"
      //   let url = "/prStages?$filter=PurchaseRequisitionNumber eq '" + buttonData.headerData.Number + "' and Number eq '" + record.Number + "' and LineNumber eq "+ record.LineNumber 
      //   this.restService.get(url).subscribe((response: any) => {
      //     if (response) {
      //       if (response.value[0].Amount >= LCY) {
      //         //  this.formDataService.updateLineControlData$.next({ control: 'Amount', data: amount.toFixed(2), rowIndex: data.rowIndex, eventEmit: true });
      //         trueCounter = trueCounter + 1;
      //         console.log(trueCounter);
      //         this.mainconvertFN(buttonData, trueCounter)
      //       }
      //       else {
      //         this.toastr.error("Amount can't greater than PR Approved Amount(" + response.value[0].Amount + ") for " + record.VendorNo);
      //       }
      //     }
      //     else{
      //       this.toastr.error("no data for" + record.VendorNo);
      //     }
      //   });
      // });
      ////////31-10-21///////////
    } else {
      this.toastr.warning('The PR should be approved before you should convert it into PQ');
      this.addItemService.showLoader$.next(false);
    }
  }
  mainconvertFN(buttonData: any) {
    // if (buttonData.lineData.length == trueCounter) {  //hussain ask to comment out
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.convertPurchaseRequisitionToQuote';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Converted to Purchase Quotation!');
      this.updateUserId(buttonData); //added 19_10_2021
    }, error => {
      this.toastr.error('Failed to convert Purchase Quotation!');
      this.addItemService.showLoader$.next(false);
    });
    // }
    // else {
    // }
  }
}
