import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { BudgetRequestHeadedr, BudgetRequestLine, } from './budget-request.config';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { Utility } from '../../../core/services/utility.service';
import { SessionService } from '../../../core/services/session.service';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-budget-request',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class BudgetRequestComponent {
  SIQData!: any[];
  SIData!: any[];
  PRData!: any[];
  PQData!: any[];
  POData!: any[];
  PIData!: any[];
  BWPRData!: any[];
  chartAccountData!: any[];
  itemData!: any[];
  fixedAssetData!: any[];
  PCData!: any[];
  PQLData: any;
  GLTypearray!: any[];
  GLNodroparray!: any[];
  BudgetDocumentType: any;
  PILData: any;
  BWLData: any;
  PCLData!: any[];
  PendingApproversID: any;
  PendingApproversEmailId: any;

  constructor(private restService: RestService,
    private toastr: ToastrService,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private emailNotifyService: EmailNotifyService,
    private utility: Utility,
    private sessionService: SessionService,
  ) {
  }

  config: DataTableConfig = {
    title: 'Budget Request',
    idProp: 'Id',
    headerApi: '/budgetRequests',
    pageName: 'BR',
    headerApiOrderByField: 'No',
    filterByUserCompanyResCenter: true,
    headers: [{
      name: 'No',
      prop: 'No',
      isPrimaryLink: true
    }, {
      name: 'Request Date',
      prop: 'RequestDate'
    }, {
      name: 'Budget Document Type',
      prop: 'BudgetDocumentType'
    },
    {
      name: 'Budget Options',
      prop: 'BudgetOptions'
    },
    {
      name: 'Status',
      prop: 'Status'
    },
    {
      name: 'Pending Approvers ID',
      prop: 'PendingApproversID',
    }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Budget Request',
      recordId: "No",
      // recordTitle: "DocumentNo",
      headerConfig: BudgetRequestHeadedr,
      lineConfig: BudgetRequestLine,
      informationSectionConfig: {
        documentNoProp: 'No',
        documentType: 'Budget',
        documentStatusProp: 'Status',
        informationDetailSecctionType: InformationDetailSecctionType.JournalClaim
      }
    }
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
    },
    {
      label: 'Budget Request',
      name: 'Budget Request',
      icon: 'bi bi-arrow-90deg-right',
      route: '/approval/budget-request',
      isEnable: false
    },
  ];


  popupLoaded(data: any) {
    ////////12-10-21
    if (data.header.Status == 'Pending Approval') {
      this.addItemService.disableLineControls$.next(true);
      let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.header.No + "'"
      this.restService.get(url).subscribe((response: any) => {
        if (response) {
          this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });

          const ifMatchKey = "*"; // record["@odata.etag"];
          const query = '(' + data.header.Id + ')';
          let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId }
          // this.restService.patch( "/budgetRequests"+ query, patchData, ifMatchKey).subscribe((response: any) => {
          // });
        }
      });
    }
    ////////12-10-21

    const lineData = data.line;
    const headerData = data.header;
    this.BudgetDocumentType = headerData.BudgetDocumentType;
    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        if (headerData.BudgetDocumentType == "Requisition") {
          //////////////
          this.formDataService.enableLineControl$.next({ label: 'DocumentNo', rowIndex: data.rowIndex });
          if (this.PRData) {
            this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PRData, displayFormat: '[Number]', bindValue: 'Number', rowIndex: data.rowIndex });
            setTimeout(() => {
              this.formDataService.updateLineControlData$.next({ control: 'DocumentNo', data: line.DocumentNo, rowIndex: rowIndex });
            }, 100);
          } else {
            this.restService.get('/purchaseRequisitionHeaders').subscribe((response: any) => {
              this.PRData = response.value;
              this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PRData, displayFormat: '[Number]', bindValue: 'Number', rowIndex: data.rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'DocumentNo', data: line.DocumentNo, rowIndex: rowIndex });
              }, 100);
            });
          }
          //////////////
          if (line.DocumentNo) {
            this.PQLData = [];
            let url = "/purchseRequisitionLines?$filter=PurchaseRequisitionNumber eq '" + line.DocumentNo + "'"
            this.restService.get(url).subscribe((response: any) => {
              this.PQLData = response.value;
              this.GLTypearray = [];
              this.GLNodroparray = [];
              var GLNodrop = {
                "No": "",
                "Name": "",
                "GLAccountName": "",
              };
              var GLType = {
                "No": "",
              };

              this.PQLData.forEach((line: any, rowIndex: number) => {
                if (line.Number) {
                  GLNodrop.No = line.Number;
                  GLNodrop.Name = line.Description;
                  GLNodrop.GLAccountName = line.GLAccountName;
                  this.GLNodroparray.push(this.utility.copyObj(GLNodrop));
                  GLType.No = line.PurchaseRequisitionType;
                  this.GLTypearray.push(this.utility.copyObj(GLType));
                }
              });
              if (this.GLNodroparray) {
                this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.GLNodroparray, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'AccountNo', data: line.AccountNo, rowIndex: rowIndex });
                }, 100);
              }
            });
          }
        } else if (headerData.BudgetDocumentType == "BW Requisition") {

          //////////////
          this.formDataService.enableLineControl$.next({ label: 'DocumentNo', rowIndex: data.rowIndex });
          if (this.PRData) {
            this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PRData, displayFormat: '[Number]', bindValue: 'Number', rowIndex: data.rowIndex });
            setTimeout(() => {
              this.formDataService.updateLineControlData$.next({ control: 'DocumentNo', data: line.DocumentNo, rowIndex: rowIndex });
            }, 100);
          } else {
            this.restService.get('/bwRequisitionHeaders').subscribe((response: any) => {
              this.PRData = response.value;
              this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PRData, displayFormat: '[Number]', bindValue: 'Number', rowIndex: data.rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'DocumentNo', data: line.DocumentNo, rowIndex: rowIndex });
              }, 100);
            });
          }
          //////////////
          if (line.DocumentNo) {
            this.BWLData = [];
            let url = "/bwRequisitionLines?$filter=PurchaseRequisitionNumber eq '" + line.DocumentNo + "'"
            this.restService.get(url).subscribe((response: any) => {
              this.BWLData = response.value;
              this.GLTypearray = [];
              this.GLNodroparray = [];
              var GLNodrop = {
                "No": "",
                "Name": "",
                "GLAccountName": "",
              };
              var GLType = {
                "No": "",
              };

              this.BWLData.forEach((line: any, rowIndex: number) => {
                if (line.Number) {
                  GLNodrop.No = line.Number;
                  GLNodrop.Name = line.Description;
                  GLNodrop.GLAccountName = line.GLAccountName;
                  this.GLNodroparray.push(this.utility.copyObj(GLNodrop));
                  GLType.No = line.PurchaseRequisitionType;
                  this.GLTypearray.push(this.utility.copyObj(GLType));
                }
              });
              if (this.GLNodroparray) {
                this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.GLNodroparray, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'AccountNo', data: line.AccountNo, rowIndex: rowIndex });
                }, 100);
              }
            });
          }
        } else if (headerData.BudgetDocumentType == "Invoice") {

          this.formDataService.enableLineControl$.next({ label: 'DocumentNo', rowIndex: rowIndex });
          if (this.PIData) {
            this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PIData, displayFormat: '[Number]', bindValue: 'Number', rowIndex: rowIndex });
            setTimeout(() => {
              this.formDataService.updateLineControlData$.next({ control: 'DocumentNo', data: line.DocumentNo, rowIndex: rowIndex });
            }, 100);
          } else {
            this.restService.get('/purchaseInvoiceHeaders').subscribe((response: any) => {
              this.PIData = response.value;
              this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PIData, displayFormat: '[Number]', bindValue: 'Number', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'DocumentNo', data: line.DocumentNo, rowIndex: rowIndex });
              }, 100);
            });
          }

          if (line.DocumentNo) {
            this.PILData = [];
            let url = "/purchaseInvoiceLines?$filter=DocumentNo eq '" + line.DocumentNo + "'"
            this.restService.get(url).subscribe((response: any) => {
              this.PILData = response.value;
              this.GLTypearray = [];
              this.GLNodroparray = [];
              var GLNodrop = {
                "No": "",
                "Name": "",
                "GLAccountName": "",
              };
              var GLType = {
                "No": "",
              };

              this.PILData.forEach((line: any, rowIndex: number) => {
                if (line.No) {
                  GLNodrop.No = line.No;
                  GLNodrop.Name = line.Description;
                  GLNodrop.GLAccountName = line.GLAccountName;
                  this.GLNodroparray.push(this.utility.copyObj(GLNodrop));
                  GLType.No = line.Type;
                  this.GLTypearray.push(this.utility.copyObj(GLType));
                }
              });

              if (this.GLNodroparray) {
                this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.GLNodroparray, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'AccountNo', data: line.AccountNo, rowIndex: rowIndex });
                }, 100);
              }
            });
          }
        } else if (headerData.BudgetDocumentType == "Petty Cash") {
          this.formDataService.enableLineControl$.next({ label: 'DocumentNo', rowIndex: rowIndex });
          if (this.PCData) {
            this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PCData, displayFormat: '[DocumentNo]', bindValue: 'DocumentNo', rowIndex: rowIndex });
            setTimeout(() => {
              this.formDataService.updateLineControlData$.next({ control: 'DocumentNo', data: line.DocumentNo, rowIndex: rowIndex });
            }, 100);
          } else {
            this.restService.get('/claimEntriesHeaders').subscribe((response: any) => {
              this.PCData = response.value;
              this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PCData, displayFormat: '[DocumentNo]', bindValue: 'DocumentNo', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'DocumentNo', data: line.DocumentNo, rowIndex: rowIndex });
              }, 100);
            });
          }

          if (line.DocumentNo) {
            this.PCLData = [];
            let url = "/claimEntries?$filter=DocumentNo eq '" + line.DocumentNo + "'"
            this.restService.get(url).subscribe((response: any) => {
              this.PCLData = response.value;
              this.GLTypearray = [];
              this.GLNodroparray = [];
              var GLNodrop = {
                "No": "",
                "Name": "",
                "GLAccountName": "",
              };
              var GLType = {
                "No": "",
              };

              this.PCLData.forEach((line: any, rowIndex: number) => {
                if (line.AccountNo) {
                  GLNodrop.No = line.AccountNo;
                  GLNodrop.Name = line.Description;
                  GLNodrop.GLAccountName = line.GLAccountName;
                  this.GLNodroparray.push(this.utility.copyObj(GLNodrop));
                  GLType.No = line.AccountType;
                  this.GLTypearray.push(this.utility.copyObj(GLType));
                }
              });

              if (this.GLNodroparray) {
                this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.GLNodroparray, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'AccountNo', data: line.AccountNo, rowIndex: rowIndex });
                }, 100);
              }
            });
          }
        }

      });
    };

    let documentNoSelected: boolean = false;
    for (let i = 0; i < lineData.length; i++) {
      if (lineData[i].DocumentNo) {
        documentNoSelected = true;
        break;
      }
    }

    if (documentNoSelected) {
      this.formDataService.disableControl$.next('BudgetDocumentType');
    } else {
      this.formDataService.enableControl$.next('BudgetDocumentType');
    }

  }

  changeEvent(data: EventDataModel) {
    if (data.section == SectionType.Header) {
      switch (data.control) {
        case 'BudgetDocumentType':
          this.changeBudgetDocumentType(data)
          this.BudgetDocumentType = data.data;
          break
      }
    } else if (data.section == SectionType.Line) {
      switch (data.control) {
        case 'DocumentNo':
          this.changeDocumentNo(data);
          this.formDataService.disableControl$.next('BudgetDocumentType');
          break;
        case 'AccountType':
          // this.changeAcType(data);
          break;
        case 'AccountNo':
          this.selectNumber(data);
          break;
      }

      let documentNoSelected: boolean = false;
      for (let i = 0; i < data.linesData!.length; i++) {
        if (data.linesData![i].DocumentNo) {
          documentNoSelected = true;
          break;
        }
      }

      if (documentNoSelected) {
        this.formDataService.disableControl$.next('BudgetDocumentType');
      } else {
        this.formDataService.enableControl$.next('BudgetDocumentType');
      }
    }
  }

  changeBudgetDocumentType(data: EventDataModel) {
    this.formDataService.updateLineControlData$.next({ control: 'DocumentNo', data: null, rowIndex: data.rowIndex, eventEmit: true });
    switch (data.data) {
      case 'Requisition':
        this.formDataService.enableLineControl$.next({ label: 'DocumentNo', rowIndex: data.rowIndex! });
        if (this.PRData) {
          this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PRData, displayFormat: '[Number]', bindValue: 'Number', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/purchaseRequisitionHeaders').subscribe((response: any) => {
            this.PRData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PRData, displayFormat: '[Number]', bindValue: 'Number', rowIndex: data.rowIndex });
          });
        }
        break;

      case 'BW Requisition':
        this.formDataService.enableLineControl$.next({ label: 'DocumentNo', rowIndex: data.rowIndex! });
        if (this.BWPRData) {
          this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.BWPRData, displayFormat: '[Number]', bindValue: 'Number', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/bwRequisitionHeaders').subscribe((response: any) => {
            this.BWPRData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.BWPRData, displayFormat: '[Number]', bindValue: 'Number', rowIndex: data.rowIndex });
          });
        }
        break;

      case 'Invoice':
        this.formDataService.enableLineControl$.next({ label: 'DocumentNo', rowIndex: data.rowIndex! });
        if (this.PIData) {
          this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PIData, displayFormat: '[Number]', bindValue: 'Number', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/purchaseInvoiceHeaders').subscribe((response: any) => {
            this.PIData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PIData, displayFormat: '[Number]', bindValue: 'Number', rowIndex: data.rowIndex });
          });
        }
        break;

      case 'Petty Cash':
        this.formDataService.enableLineControl$.next({ label: 'DocumentNo', rowIndex: data.rowIndex! });
        if (this.PCData) {
          this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PCData, displayFormat: '[DocumentNo]', bindValue: 'DocumentNo', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/claimEntriesHeaders').subscribe((response: any) => {
            this.PCData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'DocumentNo', items: this.PCData, displayFormat: '[DocumentNo]', bindValue: 'DocumentNo', rowIndex: data.rowIndex });
          });
        }
        break;

    }

  }

  changeDocumentNo(data: EventDataModel) {
    if (this.BudgetDocumentType == "Requisition") {
      this.PQLData = [];
      let url = "/purchseRequisitionLines?$filter=PurchaseRequisitionNumber eq '" + data.data + "'"
      this.restService.get(url).subscribe((response: any) => {
        // this.PQLData = response.value[0];
        // setTimeout(() => {
        //   this.formDataService.updateLineControlData$.next({ control: 'AccountType', data: this.PQLData.PurchaseRequisitionType , rowIndex: data.rowIndex });
        //   this.formDataService.updateLineControlData$.next({ control: 'AccountNo', data: this.PQLData.Number , rowIndex: data.rowIndex });
        //   this.formDataService.updateLineControlData$.next({ control: 'Description', data: this.PQLData.Description , rowIndex: data.rowIndex });
        //   }, 100);
        // this.Actype2(this.PQLData.PurchaseRequisitionType, this.PQLData.Number , data.rowIndex);

        this.PQLData = response.value;

        this.GLTypearray = [];
        this.GLNodroparray = [];
        var GLNodrop = {
          "No": "",
          "Name": "",
          "GLAccountName": "",
        };
        var GLType = {
          "No": "",
        };

        this.PQLData.forEach((line: any, rowIndex: number) => {
          if (line.Number) {
            GLNodrop.No = line.Number;
            GLNodrop.Name = line.Description;
            GLNodrop.GLAccountName = line.GLAccountName;
            this.GLNodroparray.push(this.utility.copyObj(GLNodrop));

            GLType.No = line.PurchaseRequisitionType;
            this.GLTypearray.push(this.utility.copyObj(GLType));

          }
        });


        if (this.GLNodroparray) {
          this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.GLNodroparray, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
        }
      });
    } else if (this.BudgetDocumentType == "Invoice") {
      this.PILData = [];
      let url = "/purchaseInvoiceLines?$filter=DocumentNo eq '" + data.data + "'"
      this.restService.get(url).subscribe((response: any) => {
        this.PILData = response.value;
        this.GLTypearray = [];
        this.GLNodroparray = [];
        var GLNodrop = {
          "No": "",
          "Name": "",
          "GLAccountName": "",
        };
        var GLType = {
          "No": "",
        };

        this.PILData.forEach((line: any, rowIndex: number) => {
          if (line.No) {
            GLNodrop.No = line.No;
            GLNodrop.Name = line.Description;
            GLNodrop.GLAccountName = line.GLAccountName;
            this.GLNodroparray.push(this.utility.copyObj(GLNodrop));
            GLType.No = line.Type;
            this.GLTypearray.push(this.utility.copyObj(GLType));
          }
        });

        this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.GLNodroparray, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
      });
    } else if (this.BudgetDocumentType == "BW Requisition") {
      this.BWLData = [];
      let url = "/bwRequisitionLines?$filter=PurchaseRequisitionNumber eq '" + data.data + "'"
      this.restService.get(url).subscribe((response: any) => {
        this.BWLData = response.value;
        this.GLTypearray = [];
        this.GLNodroparray = [];
        var GLNodrop = {
          "No": "",
          "Name": "",
          "GLAccountName": "",
        };
        var GLType = {
          "No": "",
        };

        this.BWLData.forEach((line: any, rowIndex: number) => {
          if (line.Number) {
            GLNodrop.No = line.Number;
            GLNodrop.Name = line.Description;
            GLNodrop.GLAccountName = line.GLAccountName;
            this.GLNodroparray.push(this.utility.copyObj(GLNodrop));
            GLType.No = line.PurchaseRequisitionType;
            this.GLTypearray.push(this.utility.copyObj(GLType));
          }
        });

        this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.GLNodroparray, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
      });
    } else if (this.BudgetDocumentType == "Petty Cash") {
      this.PCLData = [];
      let url = "/claimEntries?$filter=DocumentNo eq '" + data.data + "'"
      this.restService.get(url).subscribe((response: any) => {
        this.PCLData = response.value;
        this.GLTypearray = [];
        this.GLNodroparray = [];
        var GLNodrop = {
          "No": "",
          "Name": "",
          "GLAccountName": "",
        };
        var GLType = {
          "No": "",
        };

        this.PCLData.forEach((line: any, rowIndex: number) => {
          if (line.AccountNo) {
            GLNodrop.No = line.AccountNo;
            GLNodrop.Name = line.Description;
            GLNodrop.GLAccountName = line.GLAccountName;
            this.GLNodroparray.push(this.utility.copyObj(GLNodrop));
            GLType.No = line.AccountType;
            this.GLTypearray.push(this.utility.copyObj(GLType));
          }
        });

        this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.GLNodroparray, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
      });
    }
  }

  Actype2(data: string, no: string, rowIndex: number) {
    switch (data) {
      case 'G/L Account':
        if (this.chartAccountData) {
          this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
          // setTimeout(() => {
          //   console.log(no);
          //   this.formDataService.updateLineControlData$.next({ control: 'AccountNo', data: no, rowIndex: rowIndex });
          // }, 100);
        } else {
          this.restService.get('/glAccounts').subscribe((response: any) => {
            this.chartAccountData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
            // setTimeout(() => {
            //   this.formDataService.updateLineControlData$.next({ control: 'AccountNo', data: no , rowIndex: rowIndex });
            // }, 100);
          });
        }
        break;
      case 'Item':
        // this.formDataService.enableLineControl$.next({ label: 'AccountNo', rowIndex: data.rowIndex });
        if (this.itemData) {
          this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
          // setTimeout(() => {
          //   this.formDataService.updateLineControlData$.next({ control: 'AccountNo', data: no, rowIndex: rowIndex });
          // }, 100);
        } else {
          this.restService.get('/Items').subscribe((response: any) => {
            this.itemData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
            // setTimeout(() => {
            //   this.formDataService.updateLineControlData$.next({ control: 'AccountNo', data: no, rowIndex: rowIndex });
            // }, 100);
          });
        }
        break;
      case 'Fixed Asset':
        // this.formDataService.enableLineControl$.next({ label: 'AccountNo', rowIndex: data.rowIndex });
        if (this.fixedAssetData) {
          this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
          // setTimeout(() => {
          //   this.formDataService.updateLineControlData$.next({ control: 'AccountNo', data: no, rowIndex: rowIndex });
          // }, 100);
        } else {
          this.restService.get('/fixedAssets').subscribe((response: any) => {
            this.fixedAssetData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
            // setTimeout(() => {
            //   this.formDataService.updateLineControlData$.next({ control: 'AccountNo', data: no, rowIndex: rowIndex });
            // }, 100);
          });
        }
        break;
      // default:
      //   this.formDataService.disableLineControl$.next({ label: 'AccountNo', rowIndex: data.rowIndex });
      //   break;
    }
  }

  changeAcType(data: EventDataModel) {
    this.formDataService.updateLineControlData$.next({ control: 'AccountNo', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'Description', data: null, rowIndex: data.rowIndex });
    switch (data.data) {
      case 'G/L Account':
        this.formDataService.enableLineControl$.next({ label: 'AccountNo', rowIndex: data.rowIndex! });
        if (this.chartAccountData) {
          this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/glAccounts').subscribe((response: any) => {
            this.chartAccountData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case 'Item':
        this.formDataService.enableLineControl$.next({ label: 'AccountNo', rowIndex: data.rowIndex! });
        if (this.itemData) {
          this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/Items').subscribe((response: any) => {
            this.itemData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case 'Fixed Asset':
        this.formDataService.enableLineControl$.next({ label: 'AccountNo', rowIndex: data.rowIndex! });
        if (this.fixedAssetData) {
          this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/fixedAssets').subscribe((response: any) => {
            this.fixedAssetData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'AccountNo', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      // default:
      //   this.formDataService.disableLineControl$.next({ label: 'AccountNo', rowIndex: data.rowIndex });
      //   break;
    }
  }

  selectNumber(data: EventDataModel) {
    const AccountType = data.activeData.AccountType;
    switch (AccountType) {
      case 'G/L Account':
        // alert("hi");
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Name, rowIndex: data.rowIndex, eventEmit: true });
        this.formDataService.updateLineControlData$.next({ control: 'GLAccountName', data: data.dropdownData.GLAccountName, rowIndex: data.rowIndex, eventEmit: true });
        break;
      case 'Item':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        this.formDataService.updateLineControlData$.next({ control: 'GLAccountName', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        break;
      case 'Fixed Asset':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        this.formDataService.updateLineControlData$.next({ control: 'GLAccountName', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        break;
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
        if (buttonData.data.BudgetOptions) {
          if (this.validateHeaderData(buttonData.headerData)) {
            this.addItemService.showLoader$.next(true);
            this.updateUserId(buttonData, true);
          }
        }
        else { this.toastr.warning('BudgetOptions must have a value'); }
      }
      else {
        this.toastr.error("Document must be 'Open'");
      }
    }
    else if (buttonData.button.label === 'CancelApprovalRequest') {
      if (buttonData.data.Status === 'Pending Approval') {
        this.addItemService.showLoader$.next(true);
        // this.updateUserId(buttonData, false);
        const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getSendForApprovalID';
        let payload = {
          docNo: buttonData.data.No,
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
      else {
        this.toastr.error("Document must be 'Pending Approval'");
      }
    }
  }
  updateUserId(buttonData: CustomButtonEvent, approve: boolean) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getUserId';
    const payload = {
      userid2: this.sessionService.UserId,
      docNo: buttonData.data.No,
      resCentre: this.sessionService.DefaultResponsibilityCenter,
      comp: this.sessionService.CompanyName,
      compId: this.sessionService.Company,
    };
    this.restService.post(this.config.headerApi + url, payload).subscribe((response: any) => {
      if (approve) {
        this.sendApprovalRequest(buttonData);
      } else {
        this.cancelApprovalRequest(buttonData);
      }
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  sendApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendBudgetRequestApproval';
    console.log(url);
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

    let url = "/approvalentriesPR?$filter=Status eq 'Open' and DocumentNo eq '" + data.No + "'"
    this.restService.get(url).subscribe((response: any) => {
      if (response) {
        const ifMatchKey = "*"; // record["@odata.etag"];
        const query = '(' + data.Id + ')';
        this.formDataService.updateControlData$.next({ control: 'PendingApproversID', data: response.value[0].ApproverID, eventEmit: true });
        let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId };
        this.PendingApproversID = response.value[0].ApproverID;
        this.PendingApproversEmailId = response.value[0].ApproverEmailId;
        console.log(patchData);
        this.restService.patch("/purchaseRequisitionHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
        });
      }
    });
    ////////12-10-21
  }

  cancelApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelBudgetRequestApproval ';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Cancel Request!');
      this.formDataService.updateControlData$.next({ control: 'Status', data: 'Open', eventEmit: true });
      this.getApproverDetails(buttonData.data, 'CancelApprovalRequest');
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }

  getApproverDetails(data: any, documentAction: string) {
    const url: string = "/approvalSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Budget'";
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
      if (typeof data.DocumentDate !== 'string') {
        data.DocumentDate = this.utility.convertDateObjToString(data.DocumentDate, true);
      }
      this.emailNotifyService.sendNotification(senders, receivers, 'Budget', data[this.config.headerApiOrderByField!], documentAction, data.DocumentDate, '', false, false, approvalId, this.sessionService.UserId)
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
}