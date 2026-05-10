import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { SalesOrderCalculation, SalesOrderHeader, SalesOrderLine } from './sales-order.config';
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
  selector: 'app-sales-order',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" (changeEvent)="changeEvent($event)" (buttonClickEvent)="buttonClickEvent($event)" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class SalesOrderComponent {

  config: DataTableConfig = {
    title: 'Sales Order',
    idProp: 'systemId',
    headerApi: '/salesOrderHeaders',
    pageName: 'SO',
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
        prop: 'remark',
      },
      {
        name: 'Customer No',
        prop: 'sellToCustomerNo'
      },
      {
        name: 'Customer Name',
        prop: 'sellToCustomerName'
      },
      {
        name: 'Order Date',
        prop: 'orderDate'
      },
      {
        name: 'Status',
        prop: 'status'
      },
      {
        name: 'Pending Approvers ID',
        prop: 'pendingApproversID',
      },
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Sales Order',
      recordId: 'Number',
      recordTitle: 'sellToCustomerName',
      headerConfig: SalesOrderHeader,
      lineConfig: SalesOrderLine,
      calculationSectionConfig: SalesOrderCalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Order',
        documentStatusProp: 'status',
        informationDetailSecctionType: InformationDetailSecctionType.SalesInvoice
      }
    },
    removeUnicodeCharFields: ['status']
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Sales Order',
      name: 'Sales Order',
      icon: 'bi bi-arrow-90deg-right',
      route: '/sales/salesOrder',
      isEnable: false
    },
    {
      label: 'Sales Invoice',
      name: 'Sales Invoice',
      icon: 'bi bi-arrow-90deg-right',
      route: '/sales/salesInvoice',
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
  headerData: any;
  totalAmount = 0;

  constructor(
    private restService: RestService,
    private toastr: ToastrService,
    private modal: NgbModal,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private addItemService: AddItemService,
    private sessionService: SessionService,
    private emailNotifyService: EmailNotifyService,
    private utility: Utility,
  ) {}

  popupLoaded(data: any) {
    if (data.header?.status !== 'Open') {
      this.addItemService.enableOrDisableAllControls$.next(false);
    }

    this.headerData = data.header;
    const header = data.header;

    const lineData = data.line;
    this.totalAmount = 0;

    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.totalAmount += line['lineAmount'] ? +line['lineAmount'] : 0;

        switch (line.type) {
          case 'G/L Account':
            if (this.chartAccountData) {
              this.formFielService.updateDropdownItem$.next({ label: 'no', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'no', data: line.no, rowIndex });
              }, 100);
            } else {
              this.restService.get('/glAccountSales').subscribe((response: any) => {
                this.chartAccountData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'no', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'no', data: line.no, rowIndex });
                }, 100);
              });
            }
            break;
          case 'Item':
            if (this.itemData) {
              this.formFielService.updateDropdownItem$.next({ label: 'no', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'no', data: line.no, rowIndex });
              }, 100);
            } else {
              this.restService.get('/Items').subscribe((response: any) => {
                this.itemData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'no', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'no', data: line.no, rowIndex });
                }, 100);
              });
            }
            break;
          case 'Fixed Asset':
            if (this.fixedAssetData) {
              this.formFielService.updateDropdownItem$.next({ label: 'no', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex });
              setTimeout(() => {
                this.formDataService.updateLineControlData$.next({ control: 'no', data: line.no, rowIndex });
              }, 100);
            } else {
              this.restService.get('/fixedAssets').subscribe((response: any) => {
                this.fixedAssetData = response.value;
                this.formFielService.updateDropdownItem$.next({ label: 'no', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex });
                setTimeout(() => {
                  this.formDataService.updateLineControlData$.next({ control: 'no', data: line.no, rowIndex });
                }, 100);
              });
            }
            break;
          case ' ':
            this.formDataService.disableLineControlsList$.next([
              { label: 'no', rowIndex, clearValue: true },
              { label: 'unitOfMeasureCode', rowIndex, clearValue: true },
              { label: 'locationCode', rowIndex, clearValue: true },
              { label: 'quantity', rowIndex, clearValue: true },
              { label: 'unitPrice', rowIndex, clearValue: true },
              { label: 'lineAmount', rowIndex, clearValue: true }
            ]);
            break;
          default:
            this.formDataService.disableLineControl$.next({ label: 'no', rowIndex });
            break;
        }
      });
    }

    this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
  }

  changeEvent(data: EventDataModel) {
    if (data.section === SectionType.Header) {
      switch (data.control) {
        case 'sellToCustomerNo':
          this.customerDetails(data);
          break;
      }
    }

    if (data.section === SectionType.Line) {
      switch (data.control) {
        case 'type':
          this.changeType(data);
          break;
        case 'no':
          this.changeItemNo(data);
          break;
        case 'quantity':
        case 'unitPrice':
          this.calculateAmount(data);
          break;
      }
    }
  }

  customerDetails(data: EventDataModel) {
    this.restService.get("/Customers?$filter=No eq '" + data.data + "'").subscribe((response: any) => {
      if (response?.value?.length) {
        const customer = response.value[0];
        this.formDataService.updateControlData$.next({ control: 'sellToCustomerName', data: customer.Name });
        this.formDataService.updateControlData$.next({ control: 'sellToCountryRegionCode', data: customer.Address.countryLetterCode });
        this.formDataService.updateControlData$.next({ control: 'sellToPostCode', data: customer.Address.postalCode });
        this.formDataService.updateControlData$.next({ control: 'sellToCity', data: customer.Address.city });
        this.formDataService.updateControlData$.next({ control: 'sellToContact', data: customer.Contact });
        this.formDataService.updateControlData$.next({ control: 'sellToAddress', data: customer.Address.street });
      }
    });
  }

  changeType(data: EventDataModel) {
    this.formDataService.updateLineControlData$.next({ control: 'no', data: null, rowIndex: data.rowIndex });
    this.formDataService.updateLineControlData$.next({ control: 'description', data: null, rowIndex: data.rowIndex });

    switch (data.data) {
      case 'G/L Account':
        this.formDataService.enableLineControlsList$.next([
          { label: 'no', rowIndex: data.rowIndex! },
          { label: 'unitOfMeasureCode', rowIndex: data.rowIndex! },
          { label: 'locationCode', rowIndex: data.rowIndex! },
          { label: 'quantity', rowIndex: data.rowIndex! },
          { label: 'unitPrice', rowIndex: data.rowIndex! },
          { label: 'lineAmount', rowIndex: data.rowIndex! }
        ]);

        if (this.chartAccountData) {
          this.formFielService.updateDropdownItem$.next({ label: 'no', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/glAccountSales').subscribe((response: any) => {
            this.chartAccountData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'no', items: this.chartAccountData, displayFormat: '[No] - [Name]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case 'Item':
        this.formDataService.enableLineControl$.next({ label: 'no', rowIndex: data.rowIndex! });
        if (this.itemData) {
          this.formFielService.updateDropdownItem$.next({ label: 'no', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/Items').subscribe((response: any) => {
            this.itemData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'no', items: this.itemData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case 'Fixed Asset':
        this.formDataService.enableLineControl$.next({ label: 'no', rowIndex: data.rowIndex! });
        if (this.fixedAssetData) {
          this.formFielService.updateDropdownItem$.next({ label: 'no', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
        } else {
          this.restService.get('/fixedAssets').subscribe((response: any) => {
            this.fixedAssetData = response.value;
            this.formFielService.updateDropdownItem$.next({ label: 'no', items: this.fixedAssetData, displayFormat: '[No] - [Description]', bindValue: 'No', rowIndex: data.rowIndex });
          });
        }
        break;
      case ' ':
        this.formDataService.disableLineControlsList$.next([
          { label: 'no', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'unitOfMeasureCode', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'locationCode', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'quantity', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'unitPrice', rowIndex: data.rowIndex!, clearValue: true },
          { label: 'lineAmount', rowIndex: data.rowIndex!, clearValue: true }
        ]);
        break;
      default:
        this.formDataService.disableLineControl$.next({ label: 'no', rowIndex: data.rowIndex! });
        break;
    }

    this.formDataService.updateLineControlData$.next({ control: 'documentType', data: 'Order', rowIndex: data.rowIndex });
  }

  changeItemNo(data: EventDataModel) {
    const salesType = data.activeData.type;
    switch (salesType) {
      case 'G/L Account':
        this.addItemService.updateLineMultipleControlsData$.next({
          data: {
            no: data.data,
            description: data.dropdownData.Name,
            unitOfMeasureCode: '',
            locationCode: '',
            unitPrice: 0
          }, rowIndex: data.rowIndex!, emitEvent: false
        });
        break;
      case 'Item':
      case 'Fixed Asset':
      case ' ':
        this.formDataService.updateLineControlData$.next({ control: 'description', data: data.dropdownData.Description, rowIndex: data.rowIndex, eventEmit: true });
        break;
    }
  }

  calculateAmount(data: EventDataModel) {
    let amount = 0;
    const ifMatchKey = '*';
    const query = '(' + data.activeData.systemId + ')';

    if (data.control === 'quantity') {
      const patchData = { quantity: Number(data.data) };
      this.restService.patch(this.config.addItemConfig!.lineConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
        amount = response.lineAmount;
        this.updateTotalAmount(data, amount);
      });
    } else {
      const patchData = { unitPrice: Number(data.data) };
      this.restService.patch(this.config.addItemConfig!.lineConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
        amount = response.lineAmount;
        this.updateTotalAmount(data, amount);
      });
    }
  }

  updateTotalAmount(data: EventDataModel, amount: number) {
    if (data.linesData && data.linesData.length > 0) {
      this.totalAmount = 0;
      data.linesData.forEach((line: any, index: number) => {
        if (index === data.rowIndex) {
          this.totalAmount += amount;
        } else {
          this.totalAmount += line['lineAmount'] ? +line['lineAmount'] : 0;
        }
      });
      this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    }
  }

  buttonClickEvent(buttonData: CustomButtonEvent) {
    void buttonData;
  }
}
