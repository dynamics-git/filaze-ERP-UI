import { Component, } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { ClaimJournalHeader, ClaimJournalLine } from './journal-claim.config';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Utility } from '../../../core/services/utility.service';
import { SessionService } from '../../../core/services/session.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-journal-claim',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>'

})
export class JournalClaimComponent {
  headerData: any;
  PendingApproversEmailId!: string;
  PendingApproversID!: string;


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
  config: DataTableConfig = {
    // title: 'Claim Journal',
    title: 'Purchase Journal',
    idProp: 'Id',
    headerApi: '/claimEntriesHeaders',
    pageName: 'CLAIM JOURNAL',
    headerApiOrderByField: 'DocumentNo',
    filterByUserCompanyResCenter: true,
    filters: [
      {
        field: 'Status',
        operator: 'ne',
        value: "'Submitted'"
      },
      // {
      //   field: 'DocumentType',
      //   operator: 'eq',
      //   value: "'Requisition'"
      // }
    ],
    headers: [{
      name: 'Document No',
      prop: 'DocumentNo',
      isPrimaryLink: true
    }, {
      name: 'Document No',
      prop: 'DocumentNo'
    },
    {
      name: 'Document Type',
      prop: 'DocumentType'
    },
    {
      name: 'Posting Date',
      prop: 'PostingDate'
    },
    {
      name: 'Total Amount',
      prop: 'TotalAmount'
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
      // title: 'Claim Journal',
      title: 'Purchase Journal',
      recordId: "DocumentNo",
      recordTitle: "DocumentType",
      headerConfig: ClaimJournalHeader,
      lineConfig: ClaimJournalLine,
      informationSectionConfig: {
        documentNoProp: 'DocumentNo',
        documentType: 'Petty Cash',
        documentStatusProp: 'Status',
        informationDetailSecctionType: InformationDetailSecctionType.JournalClaim
      }
    },
    removeUnicodeCharFields: ['Status']
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Petty Claim Journal',
      name: 'Petty Claim Journal',
      icon: 'bi bi-arrow-90deg-right',
      route: '/journal/claim',
      isEnable: false
    },
    {
      label: 'Submitted Petty Claim Journal',
      name: 'Submitted Petty Claim Journal',
      icon: 'bi bi-arrow-90deg-right',
      route: '/journal/submitted-claim',
    },
  ];

  totalAmount: number = 0;

  popupLoaded(data: any) {
    this.headerData = data.header;
    if (data.header.Status !== 'Open') {
      this.addItemService.enableOrDisableAllControls$.next(false);
    }
    ////////12-10-21
    if (data.header.Status == 'Pending Approval') {
      let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.DocumentNo + "'"
      this.restService.get(url).subscribe((response: any) => {
        if (response) {
          this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
          this.PendingApproversID = response.value[0].ApproverID;
          this.PendingApproversEmailId = response.value[0].ApproverEmailId;
          const ifMatchKey = "*"; // record["@odata.etag"];
          const query = '(' + data.header.Id + ')';
          let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
          this.restService.patch("/claimEntriesHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
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
      });
    }
    this.formDataService.updateControlData$.next({ control: 'TotalAmount', data: this.totalAmount.toFixed(2) });
  }

  changeEvent(data: EventDataModel) {
    if (data.section == SectionType.Header) {
      switch (data.control) {
        case 'PostingDate':
          this.headerData.PostingDate = data.data;
          this.addItemService.updateLineControlData$.next({ control: 'PostingDate', data: data.data, update: true })
          break;
      }
    } else if (data.section == SectionType.Line) {
      switch (data.control) {
        case 'AccountNo':
          this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Name, rowIndex: data.rowIndex, eventEmit: true });
          this.addItemService.patchLineData$.next({
            rowIndex: data.rowIndex!,
            data: {
              GLAccountName: data.dropdownData.Name
            },
            disableControls: false
          });
          this.addItemService.updateLineControlData$.next({ control: 'PostingDate', data: this.headerData.PostingDate, update: true });
          break;
        case 'Amount':
          this.calculateAmount(data);
          break;
      }
    }
  }

  calculateAmount(data: EventDataModel) {
    if (data.linesData && data.linesData.length > 0) {
      this.totalAmount = 0;
      data.linesData.forEach((line: any, index: number) => {
        if (line) {
          if (index === data.rowIndex) {
            this.totalAmount = this.totalAmount + Number(data.data);
          } else {
            if (line.Amount) {
              this.totalAmount = this.totalAmount + Number(line.Amount);
            }
          }
        }
      });
      this.formDataService.updateControlData$.next({ control: 'TotalAmount', data: this.totalAmount });
    }
  }

  changeItemNo(data: EventDataModel) {

  }

  validateHeaderData(header: any) {
    if (header.Remark) {
      return true;
    }

    this.toastr.warning('Remark must have a value');
    return false;
  }

  validateLines(lines: any[]) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.ShortcutDimension1Code) {
      } else {
        this.toastr.warning(`Line ${i + 1}, is missing PROJECT value`);
        return false;
      }

      if (line.ShortcutDimension2Code) {
      } else {
        this.toastr.warning(`Line ${i + 1}, is missing DEPARTMENT/COST CNTR value`);
        return false;
      }

      if (line.RefNo) {
      } else {
        this.toastr.warning(`Line ${i + 1}, is missing Ref No value`);
        return false;
      }
    }

    return true;
  }

  buttonClickEvent(buttonData: CustomButtonEvent) {
    if (buttonData.button.label === 'SendApprovalRequest') {
      if (buttonData.data.Status === 'Open') {
        if (this.validateHeaderData(buttonData.headerData) && this.validateLines(buttonData.lineData!)) {
          this.addItemService.showLoader$.next(true);
          this.updateUserId(buttonData, true);
        }
      } else {
        this.toastr.error('Status Must Be Open');
      }
    } else if (buttonData.button.label === 'CancelApprovalRequest') {
      if (buttonData.data.Status === 'Pending Approval') {
        this.addItemService.showLoader$.next(true);
        // this.updateUserId(buttonData, false, false);
        const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getSendForApprovalID';
        let payload = {
          docNo: buttonData.data.DocumentNo,
        }
        this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
          if (response.value == this.sessionService.UserId) {
            this.updateUserId(buttonData, false, false);
          }
          else {
            this.toastr.error('You do not have permission to cancel the document. Only Sender can Cancel the Document.');
            this.addItemService.showLoader$.next(false);
          }
        }, error => {
          this.addItemService.showLoader$.next(false);
        });
      } else {
        this.toastr.error("Status Must Be Pending Approval");
      }
    } else if (buttonData.button.label === 'submit') {
      if (buttonData.data.Status === 'Released') {
        this.addItemService.showLoader$.next(true);
        this.updateUserId(buttonData, false, true);
      }
    }
  }

  updateUserId(buttonData: CustomButtonEvent, approve: boolean, submit?: boolean) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getUserId';
    const payload = {
      userid2: this.sessionService.UserId,
      docNo: buttonData.data.DocumentNo,
      resCentre: this.sessionService.DefaultResponsibilityCenter,
      comp: this.sessionService.CompanyName,
      compId: this.sessionService.Company,
    };
    this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
      if (approve) {
        // this.sendApprovalRequest(buttonData);
        this.checkGLLinesBudget(buttonData);

      } else if (!approve && !submit) {
        this.cancelApprovalRequest(buttonData);
      }
      else if (submit) {
        this.submit(buttonData);
      }
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  checkGLLinesBudget(buttonData: CustomButtonEvent) {
    if (buttonData.headerData && buttonData.headerData.BudgetName) {
      const gAccountsRecords = buttonData.lineData!.filter(x => x.AccountType === 'G/L Account').map(x => x.AccountNo);
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
              this.toastr.warning('Some of the GL Accounts Budget details are not found');
              this.addItemService.showLoader$.next(false);
            } else {
              let overBudgetAccounts: string[] = [];
              for (let i = 0; i < gAccounts.length; i++) {
                const currentBudgetTotal = buttonData.lineData!.filter(x => x.AccountType === 'G/L Account' && x.AccountNo === gAccounts[i]).map(x => +x.Amount).reduce((a, b) => a + b, 0);
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
      // this.toastr.warning('Please select the Budget Name');
      // this.addItemService.showLoader$.next(false);
      this.sendApprovalRequest(buttonData); //TSA arka_10_1_2023

    }
  }
  sendApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendClaimEntryApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Approval Request!');
      this.formDataService.updateControlData$.next({ control: 'Status', data: 'Pending Approval', eventEmit: true });
      this.addItemService.enableOrDisableAllControls$.next(false);
      if (this.headerData.UserId && this.sessionService.UserId !== this.headerData.UserId) {
        this.getRecordOwnerEmailId(buttonData.data, 'SendApprovalRequest', this.headerData.UserId);
      } else {
        this.getApproverDetails(buttonData.data, 'SendApprovalRequest');
      }
      this.updatePendingApprovalID(buttonData.data);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  updatePendingApprovalID(data: any) {
    ////////12-10-21
    console.log(data);

    let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.DocumentNo + "'"
    this.restService.get(url).subscribe((response: any) => {
      if (response) {
        const ifMatchKey = "*"; // record["@odata.etag"];
        const query = '(' + data.Id + ')';
        this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
        let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId };
        this.PendingApproversID = response.value[0].ApproverID;
        this.PendingApproversEmailId = response.value[0].ApproverEmailId;
        console.log(patchData);
        this.restService.patch("/claimEntriesHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
        });
      }
    });
    ////////12-10-21
  }

  cancelApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelClaimEntryApproval ';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Cancel Request!');
      this.formDataService.updateControlData$.next({ control: 'Status', data: 'Open', eventEmit: true });
      this.addItemService.enableOrDisableAllControls$.next(true);
      if (this.headerData.UserId && this.sessionService.UserId !== this.headerData.UserId) {
        this.getRecordOwnerEmailId(buttonData.data, 'CancelApprovalRequest', this.headerData.UserId);
      } else {
        this.getApproverDetails(buttonData.data, 'CancelApprovalRequest');
      }
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  submit(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.submit';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      const ifMatchKey = "*"; // record["@odata.etag"];
      const query = '(' + buttonData.data.Id + ')';
      let patchData = { "Status": "Submitted" }
      this.restService.patch(this.config.addItemConfig!.headerConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
        if (response) {
          this.toastr.success('Successfully Submit!');
          this.addItemService.showLoader$.next(false);
          this.formDataService.updateControlData$.next({ control: 'Status', data: 'Submitted', eventEmit: true });
          this.addItemService.enableOrDisableAllControls$.next(false);
        }
      }, error => {
        this.addItemService.showLoader$.next(false);
      });
    }, (error) => {
      this.addItemService.showLoader$.next(false);
    });

  }

  getRecordOwnerEmailId(data: any, documentAction: string, userId: string) {
    const url: string = "/portalUsers?$filter=UserId eq '" + userId + "'";
    this.restService.get(url).subscribe((response: any) => {
      if (response && response.value && response.value.length > 0) {
        this.getApproverDetails(data, documentAction, response.value[0].Email);
      } else {
        this.getApproverDetails(data, documentAction);
      }
    });
  }

  getApproverDetails(data: any, documentAction: string, recordOwnerEmail: string = '') {
    const url: string = "/approvalSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Petty Cash'";
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
        if (recordOwnerEmail) {
          receivers.push(recordOwnerEmail);
        }
      }

      if (typeof data.DocumentDate !== 'string') {
        data.DocumentDate = this.utility.convertDateObjToString(data.DocumentDate, true);
      }
      this.emailNotifyService.sendNotification(senders, receivers, 'Petty Cash', data[this.config.headerApiOrderByField!], documentAction, data.DocumentDate, '', false, false, approvalId, this.sessionService.UserId)
    });
  }

}
