import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';

import { PRBidWaiverHeader, PRBidWaiverLine, PRBidWaiverCalculation } from './PR-Bid-Waiver.config';
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
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-pr-bid-waiver',
  template: '<app-data-table [config]="config" [filterDropdown]="filterDropdown" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class PRBidWaiverComponent {


  config: DataTableConfig = {
    title: 'PR Bid Waiver',
    idProp: 'Id',
    headerApi: '/bwRequisitionHeaders',
    pageName: 'PRBidWaiver',
    headerApiOrderByField: 'Number',
    filters: [
      {
        field: 'DocumentType',
        operator: 'eq',
        value: "'BW Requisition'"
      },
      {
        field: '(ApprovalStatus',
        operator: 'ne',
        value: "'Approved'"
      },
      {
        field: 'ApprovalStatus',
        operator: 'ne',
        value: "'Archived')"
      }
    ],
    filterByUserCompanyResCenter: true,
    headers: [{
      name: 'Number',
      prop: 'Number',
      isPrimaryLink: true
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
      name: 'Pending Approvers ID',
      prop: 'PendingApproversID',
    },
    {
      name: 'Remark',
      prop: 'Remark',
    }
    ],
    selctionType: 'single',
    showCreate: false,
    showDelete: false,
    addItemConfig: {
      title: 'PR Bid Waiver',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: PRBidWaiverHeader,
      lineConfig: PRBidWaiverLine,
      calculationSectionConfig: PRBidWaiverCalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'BW Requisition',
        documentStatusProp: 'ApprovalStatus',
        informationDetailSecctionType: InformationDetailSecctionType.PurchaseRequsition
      }
    },
    removeUnicodeCharFields: ['DocumentType']
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
      isEnable: false
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

    filterDropdown: any = [{
    fieldName: 'Approval Status',
    filedLabel: 'ApprovalStatus',
    fieldOptions: [
      { value: 'Open', label: 'Open' },
      { value: 'Archived', label: 'Archived' },
      { value: 'Pending Approval', label: 'Pending Approval' }
    ]
  }];

  chartAccountData!: any[];
  itemData!: any[];
  fixedAssetData!: any[];
  totalAmount: number = 0;
  comments: any[] = [];
  PendingApproversID: any;
  PendingApproversEmailId: any;

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private sessionService: SessionService,
    private emailNotifyService: EmailNotifyService,
    private utility: Utility
  ) {
  }


  popupLoaded(data: any) {
    if (data.header.ApprovalStatus !== 'Open') {
      this.addItemService.enableOrDisableAllControls$.next(false);
    }
    ////////12-10-21
    if (data.header.ApprovalStatus == 'Pending Approval') {
      let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.Number + "'"
      this.restService.get(url).subscribe((response: any) => {
        if (response) {
          const ifMatchKey = "*"; // record["@odata.etag"];
          const query = '(' + data.header.Id + ')';
          this.PendingApproversID = response.value[0].ApproverID;
          this.PendingApproversEmailId = response.value[0].ApproverEmailId;
          this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
          let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
          this.restService.patch("/bwRequisitionHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
          });
        }
      });
    }
    ////////12-10-21

    const lineData = data.line;
    this.totalAmount = 0;
    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.totalAmount += line['Amount'] ? +line['Amount'] : 0;
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
          case ' ':
            this.formDataService.disableLineControlsList$.next([
              { label: 'Number', rowIndex: rowIndex, clearValue: true },
              { label: 'UnitOfMeasure', rowIndex: rowIndex, clearValue: true },
              { label: 'LocationCode', rowIndex: rowIndex, clearValue: true },
              { label: 'Quantity', rowIndex: rowIndex, clearValue: true },
              { label: 'UnitPrice', rowIndex: rowIndex, clearValue: true },
              { label: 'Amount', rowIndex: rowIndex, clearValue: true }
            ]);
            break;
          default:
            this.formDataService.disableLineControl$.next({ label: 'Number', rowIndex: rowIndex });
            break;
        }
      });
    }

    this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
  }

  changeEvent(data: EventDataModel) {
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

  changePurchaseRequisitionType(data: EventDataModel) {
    this.formDataService.updateLineControlData$.next({ control: 'Number', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'Description', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'GLAccountName', data: null, rowIndex: data.rowIndex });
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
      case ' ':
        this.formDataService.disableLineControlsList$.next([
          { label: 'Number', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'UnitOfMeasure', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'LocationCode', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'Quantity', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'UnitPrice', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'Amount', rowIndex: data.rowIndex!, clearValue: true }
        ]);
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
        this.addItemService.patchLineData$.next({
          rowIndex: data.rowIndex!,
          data: {
            GLAccountName: data.dropdownData.Name
          },
          disableControls: false
        });

        break;
      case 'Item':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        this.addItemService.patchLineData$.next({
          rowIndex: data.rowIndex!,
          data: {
            GLAccountName: data.dropdownData.Description
          },
          disableControls: false
        });

        break;
      case 'Fixed Asset':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        this.addItemService.patchLineData$.next({
          rowIndex: data.rowIndex!,
          data: {
            GLAccountName: data.dropdownData.Description
          },
          disableControls: false
        });

        break;
      case 'Comment':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        this.addItemService.patchLineData$.next({
          rowIndex: data.rowIndex!,
          data: {
            GLAccountName: data.dropdownData.Description
          },
          disableControls: false
        });
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
    this.formDataService.updateLineControlData$.next({ control: 'Amount', data: amount.toFixed(2), rowIndex: data.rowIndex, eventEmit: true });

    if (data.linesData && data.linesData.length > 0) {
      this.totalAmount = 0;
      data.linesData.forEach((line: any, index: number) => {
        if (index === data.rowIndex) {
          this.totalAmount += amount;
        } else {
          this.totalAmount += line['Amount'] ? +line['Amount'] : 0;
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
  validateLineData(lines: any[]) {
    if (lines && lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.PurchaseRequisitionType && line.Number) {
          if (line.UnitOfMeasure && line.LocationCode) {
            continue;
          } else {
            this.toastr.warning('Unit of Measure, Location must have a value');
            return false;
          }
        }
      }
    }

    return true;
  }

  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label === 'SendApprovalRequest') {
      if (buttonData.data.ApprovalStatus === 'Open') {
        if (buttonData.data.Remark) {
          if (this.validateHeaderData(buttonData.headerData) && this.validateLineData(buttonData.lineData!)) {
            // if (buttonData.headerData.ShortcutDimension1Code && buttonData.headerData.ShortcutDimension2Code) {
            this.addItemService.showLoader$.next(true);
            this.updateUserId(buttonData, true);
            // }
            // else {
            //   this.toastr.warning('Please choose a value for Project and Department dimensions!');
            //   this.addItemService.showLoader$.next(false);
            // }
          }
        }
        else {
          this.toastr.error('Add Remark');
          this.addItemService.showLoader$.next(false);
        }
      }
      else {
        this.toastr.error('ApprovalStatus Must Be Open');
        this.addItemService.showLoader$.next(false);
      }
    } else if (buttonData.button.label === 'CancelApprovalRequest') {
      if (buttonData.data.ApprovalStatus === 'Pending Approval') {
        this.addItemService.showLoader$.next(true);
        // this.updateUserId(buttonData, false);
        const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getSendForApprovalID';
        let payload = {
          docNo: buttonData.data.Number,
        }
        this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
          if (response.value == this.sessionService.UserId) {
            this.updateUserId(buttonData, false);
          }
          else {
            this.toastr.error('You do not have permission to cancel the document. Only Sender can Cancel the Document.');
            this.addItemService.showLoader$.next(false);
          }
        }, error => {
          this.addItemService.showLoader$.next(false);
        });
      }
    } else if (buttonData.button.label === 'DownloadPdf') {
      this.downloadPdf(buttonData);
    }
    // else if (buttonData.button.label === 'BidWaiverRequired') {
    //   this.formDataService.updateControlData$.next({ control: 'DocumentType', data: 'BW Requisition' });
    //   console.log(buttonData.data.Id);
    //   const ifMatchKey = "*"; // record["@odata.etag"];
    //   const query = '(' + buttonData.data.Id + ')';
    //   let patchData = {"DocumentType":"BW Requisition"}
    //   this.restService.patch(this.config.addItemConfig.headerConfig.api + query, patchData, ifMatchKey).subscribe((response: any) => {
    //   });
    // }
    // else if (buttonData.button.label === 'ConvertQuote') {
    //   if (buttonData.data.ApprovalStatus === 'Approved') {
    //     const url: string = '(' + buttonData.data[this.config.idProp] + ')/Microsoft.NAV.convertPurchaseRequisitionToQuote';
    //     this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
    //       this.toastr.success('Converted to Purchase Quotation!');
    //     }, error => {
    //       this.toastr.error('Failed to convert Purchase Quotation!');
    //     });
    //   } else {
    //     this.toastr.warning('The PR should be approved before you should convert it into PQ');
    //   }
    // }
  }

  updateUserId(buttonData: CustomButtonEvent, approve: boolean) {
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
        this.checkGLLinesBudget(buttonData);
      } else {
        this.cancelApprovalRequest(buttonData);
      }
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  checkGLLinesBudget(buttonData: CustomButtonEvent) {
    if (buttonData.headerData && buttonData.headerData.BudgetName) {
      const gAccountsRecords = buttonData.lineData!.filter(x => x.PurchaseRequisitionType === 'G/L Account').map(x => x.Number);
      const gAccounts = [...new Set(gAccountsRecords)];
      if (gAccounts.length > 0) {
        const requisitionDate = this.utility.convertDateObjToString({
          year: buttonData.headerData.RequisitionDate.year,
          month: buttonData.headerData.RequisitionDate.month,
          day: 1
        }, true);
        const url: string = `/glbudgetentries?$filter=BudgetName eq '${buttonData.headerData.BudgetName}'`;
        this.restService.get(url).subscribe((res: any) => {
          if (res.value.length > 0) {
            const resultedGAccounts = res.value.filter((x: any) => gAccounts.includes(x.glaccno));
            const glRecords = <string[]>resultedGAccounts.map((x: any) => x.glaccno);
            const resultedGAccountNos = [...new Set(glRecords)];
            if (resultedGAccountNos.length !== gAccounts.length) {
              this.toastr.warning('Some of the GL Accounts Budget details are not found');
              this.addItemService.showLoader$.next(false);
            } else {
              let overBudgetAccounts: string[] = [];
              for (let i = 0; i < gAccounts.length; i++) {
                const currentBudgetTotal = buttonData.lineData!.filter(x => x.PurchaseRequisitionType === 'G/L Account' && x.Number === gAccounts[i]).map(x => +x.Amount).reduce((a, b) => a + b, 0);
                const gAccount = resultedGAccounts.filter((x: any) => x.glaccno === gAccounts[i])[0];
                if (gAccount) {
                  if (gAccount.ConsumedBudget + currentBudgetTotal > gAccount.TotalBudget) {
                    overBudgetAccounts.push(gAccounts[i]);
                  }
                }
              }

              if (overBudgetAccounts.length === 0) {
                this.sendApprovalRequest(buttonData);
              } else {
                this.toastr.warning(`The G/L accounts ${overBudgetAccounts.join(',')} exceeded the budgets`);
                this.addItemService.showLoader$.next(false);
              }
            }
          } else {
            this.toastr.warning('No Budget details found for the given GL Accounts / Purchase Requisition Date');
            this.addItemService.showLoader$.next(false);
          }
        });
      } else {
        this.sendApprovalRequest(buttonData);
      }
    } else {
      // this.toastr.warning('Please select the Budget Name'); //TSA arka_10_1_2023
      // this.addItemService.showLoader$.next(false);
      this.sendApprovalRequest(buttonData);//TSA arka_10_1_2023

    }
  }
  getApproverDetails(data: any, documentAction: string) {
    const url: string = "/approvalSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'BW Requisition'";
    this.restService.get(url).subscribe((response: any) => {
      let senders: string[] = [this.sessionService.Email];
      let receivers: string[] = [];
      let approvalId: string = response.value[0].ApproverID;
      if (documentAction == 'CancelApprovalRequest') {////new cancel logic
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
      const requisitionDate = this.utility.convertDateObjToString({
        year: data.RequisitionDate.year,
        month: data.RequisitionDate.month,
        day: data.RequisitionDate.day,
      }, true);
      this.emailNotifyService.sendNotification(senders, receivers, 'BW Requisition', data[this.config.headerApiOrderByField!], documentAction, requisitionDate, '', false, false, approvalId, this.sessionService.UserId, data.Number)
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
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
        this.restService.patch("/bwRequisitionHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
        });
      }
    });
    ////////12-10-21
  }

  sendApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendBwRequisitionApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Approval Request!');
      this.formDataService.updateControlData$.next({ control: 'ApprovalStatus', data: 'Pending Approval' });
      this.getPrPreparer(buttonData);
      this.addItemService.enableOrDisableAllControls$.next(false);
      this.getApproverDetails(buttonData.data, 'SendApprovalRequest');
      this.updatePendingApprovalID(buttonData.data);

    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  cancelApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelBwRequsitionApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Cancel Request!');
      this.formDataService.updateControlData$.next({ control: 'ApprovalStatus', data: 'Open' });
      this.getApproverDetails(buttonData.data, 'CancelApprovalRequest');
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  downloadPdf(buttonData: CustomButtonEvent) {
    const url: string = '/salesInvoices(71cc69fb-e506-ec11-86bc-000d3ac8b198)/pdfDocument(71cc69fb-e506-ec11-86bc-000d3ac8b198)/content';
    this.restService.downloadFile(url).subscribe((response: any) => {
      this.toastr.success('File downloaded successfully!');
    });
  }

  getPrPreparer(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getPrPreparer';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      // this.addItemService.enableOrDisableAllControls$.next(false);
    });
  }
}
