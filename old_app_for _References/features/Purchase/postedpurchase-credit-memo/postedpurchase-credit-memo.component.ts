import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { PostedPurchaseCreditMemoCalculation, PostedPurchaseCreditMemoeHeader, PostedPurchaseCreditMemoLine } from './postedpurchase-credit-memo.config';
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
  selector: 'app-postedpurchase-credit-memo',
  template: `
    <app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons">
    </app-data-table>
    `
})
export class PostedpurchaseCreditMemoComponent {

  config: DataTableConfig = {
    title: 'Posted Purchase Credit Memo',
    idProp: 'Id',
    headerApi: '/postedPurchCrMemoHeaders',
    pageName: 'PPCM',
    headerApiOrderByField: 'Number',
    filterByUserCompanyResCenter: true,
    showDelete: false,
    showCreate: false,
    headers: [
      {
        name: 'Number',
        prop: 'Number',
        isPrimaryLink: true
      },
      {
        name: 'Vendor No',
        prop: 'BuyFromVendorNumber'
      },
      {
        name: 'Vendor Name',
        prop: 'BuyFromVendorName'
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
      title: 'Posted Purchase Credit Memo',
      recordId: "Number",
      recordTitle: "BuyFromVendorName",
      headerConfig: PostedPurchaseCreditMemoeHeader,
      lineConfig: PostedPurchaseCreditMemoLine,
      calculationSectionConfig: PostedPurchaseCreditMemoCalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Credit Memo',
        documentStatusProp: 'Status',
        informationDetailSecctionType: InformationDetailSecctionType.PurchaseInvoice
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
      isEnable: false
    },
    {
      label: 'Archived Purchase Quote',
      name: 'Archived Purchase Quote',
      icon: 'bi bi-arrow-90deg-right',
      route: '/purchase/archived-quote'
    },
  ];

  chartAccountData!: any[];
  itemData!: any[];
  fixedAssetData!: any[];
  HeaderData: any;
  totalAmount: number = 0;
  comments: any[] = [];
  loading!: boolean;
  PendingApproversID!: string;
  PendingApproversEmailId!: string;

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private sessionService: SessionService,
    private emailNotifyService: EmailNotifyService,
    private utility: Utility,
  ) {
  }

  popupLoaded(data: any) {
    this.totalAmount = 0;
    const lineData = data.line;
    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;
      });
      this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    }
    this.addItemService.enableOrDisableAllControls$.next(false);

  }

  changeEvent(data: EventDataModel) {
    if (data.section == SectionType.Header) {
      switch (data.control) {
        case 'BuyFromVendorNumber':
          this.vendeordetails(data);
          this.formDataService.updateLineControlData$.next({ control: 'documentType', data: 'Credit Memo', rowIndex: data.rowIndex })

          break;
        case 'ShortcutDimension1Code':
          setTimeout(() => {
            this.formDataService.updateLineControlsListData$.next([{ control: 'ShortcutDimension1Code', data: data.data, }])
          }, 100);

          break;
        case 'ShortcutDimension2Code':
          setTimeout(() => {
            this.formDataService.updateLineControlData$.next({ control: 'ShortcutDimension2Code', data: data.data, })
          }, 100);
          break;
      }
    }

    if (data.section == SectionType.Line) {
      switch (data.control) {
        case 'Type':
          this.changeType(data);
          break;
        case 'No':
          this.changeItemNo(data);
          break;
        case 'Quantity':
        case 'DirectUnitCost':
          this.calculateAmount(data);
          break;
      }
    }
  }
  vendeordetails(data: EventDataModel) {
    this.restService.get("/vendorsAPI?$filter=number eq '" + data.data + "'").subscribe((response: any) => {
      if (response) {
        this.formDataService.updateControlData$.next({ control: 'BuyFromVendorName', data: response.value[0].displayName });
        this.formDataService.updateControlData$.next({ control: 'BuyFromCounty', data: response.value[0].address.countryLetterCode });
        this.formDataService.updateControlData$.next({ control: 'BuyFromPostCode', data: response.value[0].address.postalCode });
        this.formDataService.updateControlData$.next({ control: 'BuyFromCity', data: response.value[0].address.city });
        this.formDataService.updateControlData$.next({ control: 'BuyFromContactNumber', data: response.value[0].Contact });
        this.formDataService.updateControlData$.next({ control: 'BuyFromAddress', data: response.value[0].address.street });

      }
    });
  }

  changeType(data: EventDataModel) {
    this.formDataService.updateLineControlData$.next({ control: 'No', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'Description', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'GLAccountName', data: null, rowIndex: data.rowIndex });
    switch (data.data) {
      case 'G/L Account':
        this.formDataService.enableLineControlsList$.next([
          { label: 'No', rowIndex: data.rowIndex! },
          { label: 'UnitOfMeasure', rowIndex: data.rowIndex! },
          { label: 'LocationCode', rowIndex: data.rowIndex! },
          { label: 'Quantity', rowIndex: data.rowIndex! },
          { label: 'DirectUnitCost', rowIndex: data.rowIndex! },
          { label: 'LineAmount', rowIndex: data.rowIndex! }
        ]);
        if (this.chartAccountData) {
          this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/glAccounts').subscribe((response: any) => {
            this.chartAccountData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
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
          { label: 'DirectUnitCost', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'LineAmount', rowIndex: data.rowIndex!, clearValue: true }
        ]);
        break;
      default:
        this.formDataService.disableLineControl$.next({ label: 'No', rowIndex: data.rowIndex! });
        break;
    }

    if (this.HeaderData.ShortcutDimension1Code) {
      this.formDataService.updateLineControlData$.next({ control: 'ShortcutDimension1Code', data: this.HeaderData.ShortcutDimension1Code, rowIndex: data.rowIndex })
    }
    if (this.HeaderData.ShortcutDimension2Code) {
      this.formDataService.updateLineControlData$.next({ control: 'ShortcutDimension2Code', data: this.HeaderData.ShortcutDimension2Code, rowIndex: data.rowIndex })
    }
    this.formDataService.updateLineControlData$.next({ control: 'documentType', data: 'Credit Memo', rowIndex: data.rowIndex })

  }

  changeItemNo(data: EventDataModel) {
    const purchaseType = data.activeData.Type;
    switch (purchaseType) {
      case 'G/L Account':
        this.addItemService.updateLineMultipleControlsData$.next({
          data: {
            No: data.data,
            Description: data.dropdownData.Name,
            GLAccountName: data.dropdownData.Name,
            UnitOfMeasure: '',
            LocationCode: '',
            DirectUnitCost: 0
          }, rowIndex: data.rowIndex!, emitEvent: false
        });
        if (data.linesData && data.linesData.length > 0) {
          this.totalAmount = 0;
          data.linesData.forEach((line: any, index: number) => {
            if (index === data.rowIndex) {
              // this.totalAmount += amount;
            } else {
              this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;
            }
          });
          this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
        }

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
        this.addItemService.updateLineMultipleControlsData$.next({
          data: {
            No: data.data,
            Description: data.dropdownData.Description,
            GLAccountName: data.dropdownData.Description
          }, rowIndex: data.rowIndex!, emitEvent: false
        });
        break;
    }
  }

  calculateAmount(data: EventDataModel) {
    // const quantity = data.control === 'Quantity' ? data.data : data.activeData.Quantity;
    // const unitPrice = data.control === 'DirectUnitCost' ? data.data : data.activeData.DirectUnitCost;
    // let amount = 0;
    // if (quantity && unitPrice) {
    //   amount = +quantity * +unitPrice;
    // }
    // setTimeout(() => {
    //     this.formDataService.updateLineControlData$.next({ control: 'LineAmount', data: amount, rowIndex: data.rowIndex, eventEmit: true });
    // }, 100);

    // if (data.linesData && data.linesData.length > 0) {
    //   this.totalAmount = 0;
    //   data.linesData.forEach((line: any, index: number) => {
    //     if (index === data.rowIndex) {
    //       this.totalAmount += amount;
    //     } else {
    //       this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;
    //     }
    //   });
    //   this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    // }
    let amount = 0;
    const ifMatchKey = "*"; // record["@odata.etag"];
    const query = '(' + data.activeData.Id + ')';
    if (data.control == "Quantity") {
      let patchData = { "Quantity": 0 };
      patchData.Quantity = Number(data.data);
      this.restService.patch(this.config.addItemConfig!.lineConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
        amount = response.LineAmount;
        // setTimeout(() => {
        //     this.formDataService.updateLineControlData$.next({ control: 'LineAmount', data: response.LineAmount, rowIndex: data.rowIndex, eventEmit: true });
        //     this.formDataService.updateLineControlData$.next({ control: 'AmountLCY', data: response.AmountLCY, rowIndex: data.rowIndex, eventEmit: true });
        // this.formDataService.updateLineControlData$.next({ control: 'CurrencyFactor', data: response.CurrencyFactor, rowIndex: data.rowIndex, eventEmit: true });

        // }, 100);
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
      });
    }
    else {
      let patchData = { "DirectUnitCost": 0 };
      patchData.DirectUnitCost = Number(data.data);
      this.restService.patch(this.config.addItemConfig!.lineConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
        amount = response.LineAmount;
        //   setTimeout(() => {
        //     this.formDataService.updateLineControlData$.next({ control: 'LineAmount', data: response.LineAmount, rowIndex: data.rowIndex, eventEmit: true });
        //     this.formDataService.updateLineControlData$.next({ control: 'AmountLCY', data: response.AmountLCY, rowIndex: data.rowIndex, eventEmit: true });
        //     this.formDataService.updateLineControlData$.next({ control: 'CurrencyFactor', data: response.CurrencyFactor, rowIndex: data.rowIndex, eventEmit: true });
        // }, 100);
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
      });
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
    if (buttonData.button.label === 'SendApprovalRequest') {
      if (buttonData.data.Status === 'Open') {
        if (buttonData.headerData.VendorInvoiceNumber) {
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
          this.toastr.warning('Must have Vendor Invoice Number');
        }
      }
      else {
        this.toastr.warning('The PR Status should be Open');
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
    }
    else if (buttonData.button.label === 'Post') {
      if (buttonData.data.Status === 'Released') {
        this.addItemService.showLoader$.next(true);
        ///
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
            const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.postAsInvoice';
            this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
              this.addItemService.showLoader$.next(false);
              this.toastr.success('Successfull Purchase Invoice!');
            }, error => {
              this.addItemService.showLoader$.next(false);
              this.toastr.error('Failed to Post Purchase Invoice!');
            });
          }, error => {
            this.toastr.error('Failed to Post Purchase Order!');
            this.addItemService.showLoader$.next(false);
          });

        }, error => {
          this.addItemService.showLoader$.next(false);
        });


        ///
      } else {
        this.toastr.warning('The PR should be approved before you should Post it');
      }
    }

    if (buttonData.button.label === 'PostAsCM') {

    }
  }

  updateUserId(buttonData: CustomButtonEvent, approve: boolean,) {
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
        // this.sendApprovalRequest(buttonData);
        this.checkGLLinesBudget(buttonData);
      }
      else if (!approve) {
        this.cancelApprovalRequest(buttonData);
      }
      else {
        this.addItemService.showLoader$.next(false);
      }
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  getApproverDetails(data: any, documentAction: string) {
    const url: string = "/approvalSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Credit Memo'";
    this.restService.get(url).subscribe((response: any) => {
      let senders: string[] = [this.sessionService.Email];
      let receivers: string[] = [];
      if (typeof data.DocumentDate !== 'string') {
        data.DocumentDate = this.utility.convertDateObjToString(data.DocumentDate, true);
      }

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
      this.emailNotifyService.sendNotification(senders, receivers, 'Invoice', data[this.config.headerApiOrderByField!], documentAction, data.DocumentDate, '', false, false, approvalId, this.sessionService.UserId);
      this.addItemService.showLoader$.next(false);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  checkGLLinesBudget(buttonData: CustomButtonEvent) {
    if (buttonData.headerData && buttonData.headerData.BudgetName) {
      const gAccountsRecords = buttonData.lineData!.filter(x => x.Type === 'G/L Account').map(x => x.No);
      const gAccounts = [...new Set(gAccountsRecords)];
      if (gAccounts.length > 0) {
        // const requisitionDate = this.utility.convertDateObjToString({
        //   year: buttonData.headerData.RequisitionDate.year,
        //   month: buttonData.headerData.RequisitionDate.month,
        //   day: 1
        // }, true);
        const url: string = `/glbudgetentries?$filter=BudgetName eq '${buttonData.headerData.BudgetName}'`;
        this.restService.get(url).subscribe((res: any) => {
          if (res.value.length > 0) {
            const resultedGAccounts = res.value.filter((x: any) => gAccounts.includes(x.glaccno));
            const glRecords = <string[]>resultedGAccounts.map((x: any) => x.glaccno);
            const resultedGAccountNos = [...new Set(glRecords)];
            if (resultedGAccountNos.length !== gAccounts.length) {
              this.addItemService.showLoader$.next(false);
              this.toastr.warning('Some of the GL Accounts Budget details are not found');
            } else {
              let overBudgetAccounts: string[] = [];
              for (let i = 0; i < gAccounts.length; i++) {
                const currentBudgetTotal = buttonData.lineData!.filter(x => x.Type === 'G/L Account' && x.No === gAccounts[i]).map(x => +x.LineAmount).reduce((a, b) => a + b, 0);
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
                this.addItemService.showLoader$.next(false);
                this.toastr.warning(`The G/L accounts ${overBudgetAccounts.join(',')} exceeded the budgets`);
              }
            }
          } else {
            this.addItemService.showLoader$.next(false);
            this.toastr.warning('No Budget details found for the given GL Accounts / Purchase Requisition Date');
          }
        }, error => {
          this.addItemService.showLoader$.next(false);
        });
      } else {
        this.sendApprovalRequest(buttonData);
      }
    } else {
      this.addItemService.showLoader$.next(false);
      this.toastr.warning('Please select the Budget Name');
    }
  }
  sendApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendPurchaseInvoiceApproval';
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
  updatePendingApprovalID(data: any) {
    ////////12-10-21
    console.log(data);

    let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.Number + "'"
    this.restService.get(url).subscribe((response: any) => {
      if (response) {
        const ifMatchKey = "*"; // record["@odata.etag"];
        const query = '(' + data.Id + ')';
        this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
        let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId };
        this.PendingApproversID = response.value[0].ApproverID;
        this.PendingApproversEmailId = response.value[0].ApproverEmailId;
        console.log(patchData);
        this.restService.patch("/purchaseInvoiceHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
        });
      }
    });
    ////////12-10-21
  }

  cancelApprovalRequest(buttonData: CustomButtonEvent) {
    if (buttonData.data.Status === 'Pending Approval') {
      const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelPurchaseInvoiceApproval';
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success('Sent Cancel Request!');
        this.formDataService.updateControlData$.next({ control: 'Status', data: 'Open', eventEmit: true });
        this.getApproverDetails(buttonData.data, 'CancelApprovalRequest');
      }, error => {
        this.addItemService.showLoader$.next(false);
      });
    }
  }
}