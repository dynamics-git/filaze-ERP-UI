import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { PurchaseRequisitionComponent } from '../purchase-requisition/purchase-requisition.component';
import { PurchaseRequisitionCalculation, PurchaseRequisitionHeader, PurchaseRequisitionLine } from '../purchase-requisition/purchase-requisition.config';
import { PurchaseQuoteCalculation, PurchaseQuoteHeader, PurchaseQuoteLine } from './purchase-quote.config';
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
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';

@Component({
  standalone: false,
  selector: 'app-purchase-quote',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class PurchaseQuoteComponent implements OnInit {

  config: DataTableConfig = {
    title: 'Purchase Quote',
    idProp: 'Id',
    headerApi: '/purchaseQuoteHeaders',
    showCreate: false,
    pageName: 'PQ',
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
      // {
      //     name: 'Requisition No',
      //     prop: 'RequisitionNo'
      // },
      {
        name: 'Vendor No',
        prop: 'BuyFromVendorNumber'
      },
      {
        name: 'Vendor Name',
        prop: 'BuyFromVendorName'
      },
      {
        name: 'City',
        prop: 'BuyFromCity'
      },
      {
        name: 'Country',
        prop: 'BuyFromCountry'
      },

      {
        name: 'Order Date',
        prop: 'OrderDate'
      },
      {
        name: 'Due Date',
        prop: 'DueDate'
      },
      {
        name: 'Quote No',
        prop: 'QuoteNumber'
      },
      {
        name: 'Purchaser Code',
        prop: 'PurchaserCode'
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
      title: 'Purchase Quote',
      recordId: "Number",
      recordTitle: "Number",
      headerConfig: PurchaseQuoteHeader,
      lineConfig: PurchaseQuoteLine,
      calculationSectionConfig: PurchaseQuoteCalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Quote',
        documentStatusProp: 'Status',
        informationDetailSecctionType: InformationDetailSecctionType.PurchaseQuote
      },
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
      route: '/purchase/quote',
      isEnable: false
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
  dimentionarr!: any[];
  totalAmount: number = 0;
  comments: any[] = [];
  purchaseRequisitionObj!: PurchaseRequisitionComponent;
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
    private selectedItemService: SelectedItemService
  ) {
  }

  ngOnInit() {
    this.purchaseRequisitionObj = new PurchaseRequisitionComponent(this.restService, this.toastr, this.formFielService, this.formDataService, this.addItemService, this.sessionService, this.emailNotifyService, this.utility,this.selectedItemService);
  }

  popupLoaded(data: any) {
    if (data.linkItemType === 'PR') {
      this.purchaseRequisitionObj.popupLoaded(data);
    } else {
      if (data.header.Status !== 'Open') {
        this.addItemService.enableOrDisableAllControls$.next(false);
      }
      if (data.header.Status == 'Released') {
        this.formDataService.disableControl$.next("Type");
        this.formDataService.disableControl$.next("No");
        this.formDataService.disableControl$.next("UnitOfMeasure");
        this.formDataService.disableControl$.next("Description");
        this.formDataService.disableControl$.next("LocationCode");
        this.formDataService.disableControl$.next("Quantity");
        this.formDataService.disableControl$.next("DirectUnitCost");
        this.formDataService.disableControl$.next("LineAmount");
        this.formDataService.disableControl$.next("AmountLCY");
        this.formDataService.disableControl$.next("CurrencyCode");
        this.formDataService.disableControl$.next("totalAmount");
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
            this.restService.patch("/purchaseQuoteHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
            });
          }
        });
      }
      ////////12-10-21
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
                this.restService.get('/glAccounts').subscribe((response: any) => {
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
              break;
            default:
              this.formDataService.disableLineControl$.next({ label: 'No', rowIndex: rowIndex });
              break;
          }

          if (line.Type) {
            this.formDataService.updateLineControlData$.next({ control: 'ShortcutDimension1Code', data: HeaderData.ShortcutDimension1Code, rowIndex: rowIndex })
            this.formDataService.updateLineControlData$.next({ control: 'ShortcutDimension2Code', data: HeaderData.ShortcutDimension2Code, rowIndex: rowIndex })
          }

        });
      }
      this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    }
    if (data.header.Status == 'Open') {
      if (!data.header.PurchaserCode) {
        this.formDataService.disableControl$.next("ShortcutDimension1Code");
        this.formDataService.disableControl$.next("ShortcutDimension2Code");
      }
    }

  }

  changeEvent(data: EventDataModel) {
    if (data.linkItemType === 'PR') {
      this.purchaseRequisitionObj.changeEvent(data);
    } else {
      if (data.section == SectionType.Header) {
        switch (data.control) {
          case 'PurchaserCode':
            this.formDataService.enableControl$.next("ShortcutDimension1Code");
            this.formDataService.enableControl$.next("ShortcutDimension2Code");
            this.formDataService.updateControlData$.next({ control: 'ShortcutDimension1Code', data: '' });
            this.formDataService.updateControlData$.next({ control: 'ShortcutDimension2Code', data: '' });

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
  }

  changeType(data: EventDataModel) {
    this.formDataService.updateLineControlData$.next({ control: 'No', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'Description', data: null, rowIndex: data.rowIndex });
    switch (data.data) {
      case 'G/L Account':
        this.formDataService.enableLineControl$.next({ label: 'No', rowIndex: data.rowIndex! });
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
        // this.formDataService.enableLineControl$.next({ label: 'No', rowIndex: data.rowIndex });
        // if (this.comments) {
        //   this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.comments, displayFormat: '[Code] - [Description]', bindValue: 'Code', rowIndex: data.rowIndex });
        // } else {
        //   this.restService.get('/comments').subscribe((response: any) => {
        //     this.comments = response.value;
        //     this.formFielService.updateDropdownItem$.next({ label: 'No', items: this.comments, displayFormat: '[Code] - [Description]', bindValue: 'Code', rowIndex: data.rowIndex });
        //   });
        // }
        break;
      default:
        this.formDataService.disableLineControl$.next({ label: 'No', rowIndex: data.rowIndex! });
        break;
    }

  }

  changeItemNo(data: EventDataModel) {
    const purchaseType = data.activeData.Type;
    switch (purchaseType) {
      case 'G/L Account':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Name, rowIndex: data.rowIndex, eventEmit: true });
        break;
      case 'Item':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        break;
      case 'Fixed Asset':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        break;
      case ' ':
        this.formDataService.updateLineControlData$.next({ control: 'Description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
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
    if (buttonData.linkItemType === 'PR') {
      this.purchaseRequisitionObj.buttonClickEvent(buttonData);
    } else {
      if (buttonData.button.label === 'SendApprovalRequest') {
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
          this.toastr.error('Status must be Open');
        }
      }
      else if (buttonData.button.label === 'CancelApprovalRequest') {
        if (buttonData.data.Status === 'Pending Approval') {
          this.addItemService.showLoader$.next(true);
          // this.updateUserId(buttonData, false, false);
          const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.getSendForApprovalID';
          let payload = {
            docNo: buttonData.data.Number,
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
        }
      }
      else if (buttonData.button.label === 'ConvertOrder') {
        this.addItemService.showLoader$.next(true);
        this.updateUserId(buttonData, false, true);
      }
      // if (buttonData.button.label === 'SendApprovalRequest') {
      //     const url: string = '(' + buttonData.data[this.config.idProp] + ')/Microsoft.NAV.sendPurchaseQuoteApproval';
      //     this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      //         this.toastr.success('Sent Approval Request!');
      //         this.formDataService.updateControlData$.next({ control: 'Status', data: 'Pending Approval' });
      //         this.addItemService.enableOrDisableAllControls$.next(false);
      //     }, error => {
      //         this.toastr.error('Failed to send Approval Request!');
      //     });
      // } 
      // else if (buttonData.button.label === 'CancelApprovalRequest') {
      //     if (buttonData.data.Status === 'Pending Approval') {
      //         const url: string = '(' + buttonData.data[this.config.idProp] + ')/Microsoft.NAV.cancelPurchaseQuoteApproval';
      //         this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
      //             this.toastr.success('Sent Cancel Request!');
      //             this.formDataService.updateControlData$.next({ control: 'Status', data: 'Open' });
      //         }, error => {
      //             this.toastr.error('Failed to send Cancel Request!');
      //         });
      //     }
      // } 
      else if (buttonData.button.label === 'ConvertOrder') {
        // if (buttonData.data.Status === 'Released') {
        // const url: string = '(' + buttonData.data[this.config.idProp] + ')/Microsoft.NAV.convertPurchaseQuoteToOrder';
        // this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        //     this.toastr.success('Converted to Purchase Order!');
        // }, error => {
        //     this.toastr.error('Failed to convert Purchase Order!');
        // });
        // } else {
        //     this.toastr.warning('The PQ should be released before you should convert it into PO');
        // }
      }
      else if (buttonData.button.label === 'DownloadPDF') {
        // if (buttonData.data.Status === 'Released') {
        const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.downloadReport';
        this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
          this.toastr.success('Converted to Purchase Order!');
        }, error => {
          this.toastr.error('Failed to convert Purchase Order!');
        });
        // } else {
        // this.toastr.warning('The PQ should be released before you should convert it into PO');
        // }
      }
    }
  }
  updateUserId(buttonData: CustomButtonEvent, approve: boolean, convert?: boolean) {
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
      else if (!approve && !convert) {
        this.cancelApprovalRequest(buttonData);
      }
      if (convert) {
        this.ConvertOrder(buttonData);
      }
    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  getApproverDetails(data: any, documentAction: string) {
    const url: string = "/approvalSetups?$filter=UserID eq '" + this.sessionService.UserId + "' and DocumentType eq 'Quote'";
    this.restService.get(url).subscribe((response: any) => {
      let senders: string[] = [this.sessionService.Email];
      let receivers: string[] = [];
      let approvalId: string = response.value[0].ApproverID;
      if (typeof data.DocumentDate !== 'string') {
        data.DocumentDate = this.utility.convertDateObjToString(data.DocumentDate, true);
      }
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
      // this.emailNotifyService.sendNotification(senders, receivers, 'Quote', data[this.config.headerApiOrderByField], documentAction,'','',false,false,approvalId);
      this.emailNotifyService.sendNotification(senders, receivers, 'Quote', data[this.config.headerApiOrderByField!], documentAction, data.DocumentDate, '', false, false, approvalId, this.sessionService.UserId, data.RequisitionNo);

    }, error => {
      this.addItemService.showLoader$.next(false);
    });
  }
  sendApprovalRequest(buttonData: CustomButtonEvent) {
    const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.sendPurchaseQuoteApproval';
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
        // this.formDataService.updateControlData$.next({ control: 'PendingApproversEmailId', data: response.value[0].ApproverEmailId, eventEmit: true });
        let patchData = { "PendingApproversID": response.value[0].ApproverID, "PendingApproversEmailId": response.value[0].ApproverEmailId };
        this.PendingApproversID = response.value[0].ApproverID;
        this.PendingApproversEmailId = response.value[0].ApproverEmailId;
        console.log(patchData);
        this.restService.patch("/purchaseQuoteHeaders" + query, patchData, ifMatchKey).subscribe((response: any) => {
        });
      }
    });
    ////////12-10-21
  }

  cancelApprovalRequest(buttonData: CustomButtonEvent) {
    if (buttonData.data.Status === 'Pending Approval') {
      const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.cancelPurchaseQuoteApproval';
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success('Sent Cancel Request!');
        this.formDataService.updateControlData$.next({ control: 'Status', data: 'Open', eventEmit: true });
        this.getApproverDetails(buttonData.data, 'CancelApprovalRequest');
      }, error => {
        this.addItemService.showLoader$.next(false);
      });
    }
  }

  ConvertOrder(buttonData: CustomButtonEvent) {
    if (buttonData.data.Status === 'Released') {
      const url: string = '(' + buttonData.data[this.config.idProp!] + ')/Microsoft.NAV.convertPurchaseQuoteToOrder';
      this.restService.post(this.config.headerApi + url, {}).subscribe((response: any) => {
        this.toastr.success('Converted to Purchase Order!');
        this.addItemService.showLoader$.next(false);
      }, error => {
        this.toastr.error('Failed to convert Purchase Order!');
        this.addItemService.showLoader$.next(false);
      });
    } else {
      this.toastr.warning('The PQ should be released before you should convert it into PO');
      this.addItemService.showLoader$.next(false);
    }
  }
}