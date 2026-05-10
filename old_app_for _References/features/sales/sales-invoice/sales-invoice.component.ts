import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { SalesInvoicecalculation, SalesInvoiceLine, SalesInvoiveHeader } from './sales-invoice.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { SessionService } from '../../../core/services/session.service';
import { EmailNotifyService } from '../../../core/services/shared/email-notify.service';
import { Utility } from '../../../core/services/utility.service';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-sales-invoice',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>'

})
export class SalesInvoiceComponent {

  config: DataTableConfig = {
    title: 'Sales Invoice',
    idProp: 'Id',
    headerApi: '/salesHeaders',
    pageName: 'SI',
    headerApiOrderByField: 'Number',
    filterByUserCompanyResCenter: true,
    showDelete: true,
    showCreate: true,
    headers: [
      {
        name: 'Number',
        prop: 'Number',
        isPrimaryLink: true
      },
      {
        name: 'Remark',
        prop: 'Remark',
      },
      {
        name: 'Customer No',
        prop: 'SellToCustomerNo'
      },
      {
        name: 'Customer Name',
        prop: 'SellToCustomerName'
      },
      // {
      //     name: 'Location Code',
      //     prop: 'LocationCode'
      // },
      // {
      //     name: 'Document Date',
      //     prop: 'DocumentDate'
      // },
      {
        name: 'Status',
        prop: 'Status'
      },
      {
        name: 'Pending Approvers ID',
        prop: 'PendingApproversID',
      },
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Sales Invoice',
      recordId: "Number",
      recordTitle: "SellToCustomerName",
      headerConfig: SalesInvoiveHeader,
      lineConfig: SalesInvoiceLine,
      calculationSectionConfig: SalesInvoicecalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Sales Invoice',
        documentStatusProp: 'Status',
        informationDetailSecctionType: InformationDetailSecctionType.SalesInvoice
      }
    },
    removeUnicodeCharFields: ['Status']
  };

   MenuButtons: Menubuttons[] = [
    {
      label: 'Sales Invoice',
      name: 'Sales Invoice',
      icon: 'bi bi-arrow-90deg-right',
      route: '/sales/salesInvoice',
      isEnable: false
    },
    {
      label: 'Sales Credit Memo',
      name: 'Sales Credit Memo',
      icon: 'bi bi-arrow-90deg-right',
      route: '/sales/sales-Credit-Memo',
    },
  ];

  chartAccountData!: any[];
  itemData!: any[];
  fixedAssetData!: any[];
  HeaderData: any;
  totalAmount: number = 0;
  comments: any[] = [];
  PendingApproversID!: string;
  PendingApproversEmailId!: string;


  constructor(private restService: RestService,
    private toastr: ToastrService,
    private modal: NgbModal,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private sessionService: SessionService,
    private emailNotifyService: EmailNotifyService,
    private utility: Utility,
  ) {
  }

  popupLoaded(data: any) {
    if (data.header.Status !== 'Open') {
      this.addItemService.enableOrDisableAllControls$.next(false);
    }

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
          this.restService.patch("/salesHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
          });
        }
      });
    }
    ////////12-10-21
    this.HeaderData = data.header;
    const HeaderData = data.header;

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

    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;

        switch (line.Type) {
          case 'G/L Account':
            if (this.chartAccountData) {
              this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
              }, 100);
            } else {
              this.restService.get('/glAccountSales').subscribe((response: any) => {
                this.chartAccountData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
                }, 100);
              });
            }
            break;
          case 'Item':
            if (this.itemData) {
              this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
              }, 100);
            } else {
              this.restService.get('/Items').subscribe((response: any) => {
                this.itemData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
                }, 100);
              });
            }
            break;
          case 'Fixed Asset':
            if (this.fixedAssetData) {
              this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
              }, 100);
            } else {
              this.restService.get('/fixedAssets').subscribe((response: any) => {
                this.fixedAssetData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'No', data: line.No, rowIndex: rowIndex });
                }, 100);
              });
            }
            break;
          case ' ':
            this.formDataService.disableLineControlsList$.next([
              { label: 'No', rowIndex: rowIndex, clearValue: true },
              { label: 'UnitOfMeasure', rowIndex: rowIndex, clearValue: true },
              { label: 'LocationCode', rowIndex: rowIndex, clearValue: true },
              { label: 'Quantity', rowIndex: rowIndex, clearValue: true },
              { label: 'DirectUnitCost', rowIndex: rowIndex, clearValue: true },
              { label: 'LineAmount', rowIndex: rowIndex, clearValue: true }
            ]);
            break;
          default:
            this.formDataService.disableLineControl$.next({ label: 'No', rowIndex: rowIndex });
            break;
        }
      });
    }
    this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });

  }

  changeEvent(data: EventDataModel) {
    if (data.section == SectionType.Header) {
      switch (data.control) {
        case 'SellToCustomerNo':
          this.vendeordetails(data);
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
        case 'UnitPrice':
          this.calculateAmount(data);
          break;
        // case 'LineAmount':
        //   this.calculateAmount1(data);
        // break;  
      }
    }
  }

  vendeordetails(data: EventDataModel) {
    this.restService.get("/Customers?$filter=No eq '" + data.data + "'").subscribe((response: any) => {
      if (response) {
        this.formDataService.updateControlData$.next({ control: 'SellToCustomerName', data: response.value[0].Name });
        this.formDataService.updateControlData$.next({ control: 'SellToCountryRegionCode', data: response.value[0].Address.countryLetterCode });
        this.formDataService.updateControlData$.next({ control: 'SellToPostCode', data: response.value[0].Address.postalCode });
        this.formDataService.updateControlData$.next({ control: 'SellToCity', data: response.value[0].Address.city });
        this.formDataService.updateControlData$.next({ control: 'SellToContactNo', data: response.value[0].Contact });
        this.formDataService.updateControlData$.next({ control: 'SellToAddress', data: response.value[0].Address.street });

      }
    });
  }

  changeType(data: EventDataModel) {
    this.formDataService.updateLineControlData$.next({ control: 'No', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'Description', data: null, rowIndex: data.rowIndex });
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
          this.restService.get('/glAccountSales').subscribe((response: any) => {
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

    // if(this.HeaderData.ShortcutDimension1Code){
    //     this.formDataService.updateLineControlData$.next({control: 'ShortcutDimension1Code', data: this.HeaderData.ShortcutDimension1Code, rowIndex: data.rowIndex})
    //     }
    // if(this.HeaderData.ShortcutDimension2Code){
    //     this.formDataService.updateLineControlData$.next({control: 'ShortcutDimension2Code', data: this.HeaderData.ShortcutDimension2Code, rowIndex: data.rowIndex})
    // }
    this.formDataService.updateLineControlData$.next({ control: 'documentType', data: 'Invoice', rowIndex: data.rowIndex })

  }

  changeItemNo(data: EventDataModel) {
    const purchaseType = data.activeData.Type;
    switch (purchaseType) {
      case 'G/L Account':
        this.addItemService.updateLineMultipleControlsData$.next({
          data: {
            No: data.data,
            Description: data.dropdownData.Name,
            UnitOfMeasureCode: '',
            LocationCode: '',
            UnitPrice: 0
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
        //this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Name, rowIndex: data.rowIndex, eventEmit: true });
        break;
      case 'Item':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        break;
      case 'Fixed Asset':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        break;
      case ' ':
        this.addItemService.updateLineMultipleControlsData$.next({
          data: {
            No: data.data,
            Description: data.dropdownData.Description,
          }, rowIndex: data.rowIndex!, emitEvent: false
        });
        // this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        break;
    }
  }

  calculateAmount(data: EventDataModel) {
    // const quantity = data.control === 'Quantity' ? data.data : data.activeData.Quantity;
    // const unitPrice = data.control === 'UnitPrice' ? data.data : data.activeData.UnitPrice;
    // let amount = 0;
    // if (quantity && unitPrice) {
    //   amount = +quantity * +unitPrice;
    // }
    // setTimeout(() => {
    //     this.formDataService.updateLineControlData$.next({ control: 'LineAmount', data: amount.toFixed(2), rowIndex: data.rowIndex, eventEmit: true });
    // }, 300);

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
      let patchData = { "UnitPrice": 0 };
      patchData.UnitPrice = Number(data.data);
      this.restService.patch(this.config.addItemConfig!.lineConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
        amount = response.LineAmount;
        //   setTimeout(() => {
        //     this.formDataService.updateLineControlData$.next({ control: 'LineAmount', data: response.LineAmount, rowIndex: data.rowIndex, eventEmit: true });
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

  calculateAmount1(data: EventDataModel) {
    const quantity = data.control === 'Quantity' ? data.data : data.activeData.Quantity;
    const unitPrice = data.control === 'UnitPrice' ? data.data : data.activeData.UnitPrice;
    let amount = 0;
    if (quantity && unitPrice) {
      amount = +quantity * +unitPrice;
    }
    // if(data.activeData.LineAmount){
    if (data.activeData.LineAmount !== amount) {
      setTimeout(() => {
        this.formDataService.updateLineControlData$.next({ control: 'LineAmount', data: amount.toFixed(2), rowIndex: data.rowIndex, eventEmit: true });
      }, 100);
    }
    // }
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
        if (buttonData.headerData.Number) {
          if (buttonData.data.ExternalDocumentNo) {
            if (this.validateHeaderData(buttonData.headerData)) {
              if (buttonData.data.ShortcutDimension1Code && buttonData.data.ShortcutDimension2Code) {
                this.addItemService.showLoader$.next(true);
                this.updateUserId(buttonData, true);
              }
              else {
                this.toastr.warning('Please choose a value for Project and Department dimensions!');
              }
            }
          }
          else {
            this.toastr.warning('Please choose a value for External Document No!');
          }
        }
        else {
          this.toastr.warning('Please choose a value for Customer No!');
        }
      }
      else {
        this.toastr.error('Status must be Open!');
      }
    }
    else if (buttonData.button.label === 'CancelApprovalRequest') {
      if (buttonData.data.Status === 'Pending Approval') {
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
      else {
        this.toastr.error('Status must be Pending Approval!');
      }
    }
    else if (buttonData.button.label === 'Post') {
      if (buttonData.data.Status === 'Released') {
        this.addItemService.showLoader$.next(true);
        const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.postAsInvoice';
        this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
          this.toastr.success('Successful Sales Invoice!');
          this.addItemService.showLoader$.next(false);
        }, error => {
          this.toastr.error('Failed to Post Sales Invoice!');
          this.addItemService.showLoader$.next(false);
        });
      } else {
        this.toastr.warning('The PR should be approved before you should Post it');
      }
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
        this.sendApprovalRequest(buttonData);
      }
      else if (!approve) {
        this.cancelApprovalRequest(buttonData);
      }
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  getApproverDetails(data: any, documentAction: string) {
    const url: string = "/approvalSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Sales Invoice'";
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
      console.log(data.DocumentDate);
      if (typeof data.DocumentDate !== 'string') {
        console.log(data.DocumentDate);
        data.DocumentDate = this.utility.convertDateObjToString(data.DocumentDate, true);
      }
      this.emailNotifyService.sendNotification(senders, receivers, 'Sales Invoice', data[this.config.headerApiOrderByField!], documentAction, data.DocumentDate, '', false, false, approvalId, this.sessionService.UserId);
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  sendApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendSalesInvoiceApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Approval Request!');
      this.formDataService.updateControlData$.next({ control: 'Status', data: 'Pending Approval', eventEmit: true });
      this.addItemService.enableOrDisableAllControls$.next(false);
      this.getApproverDetails(buttonData.data, 'SendApprovalRequest');
      this.updatePendingApprovalID(buttonData.data);
    }, error => {
      this.toastr.error('Failed to send Approval Request!');
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
        this.restService.patch("/purchaseRequisitionHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
        });
      }
    });
    ////////12-10-21
  }

  cancelApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelSalesInvoiceApproval';
    this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      this.toastr.success('Sent Cancel Request!');
      this.formDataService.updateControlData$.next({ control: 'Status', data: 'Open', eventEmit: true });
      this.getApproverDetails(buttonData.data, 'CancelApprovalRequest');
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
}
