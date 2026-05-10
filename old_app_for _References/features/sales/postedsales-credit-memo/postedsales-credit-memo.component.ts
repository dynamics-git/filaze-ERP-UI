
import { Component, OnInit } from '@angular/core';

import { PostedSalesCreditMemoHeader, PostedSalesCreditMemoLine, PostedSalesCreditMemocalculation } from './postedsales-credit-memo.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-postedsales-credit-memo',
  template: `<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)" [MenuButtons]="MenuButtons"></app-data-table>`,
  styles: []
})
export class PostedsalesCreditMemoComponent {

  config: DataTableConfig = {
    title: 'Posted Sales Credit Memo',
    idProp: 'Id',
    headerApi: '/postedSalesCeMemoHeaders',
    pageName: 'POSTED SI',
    headerApiOrderByField: 'Number',
    filterByUserCompanyResCenter: true,
    showDelete: false,
    showCreate: false,
    showEdit: false,
    headers: [
      {
        name: 'Number',
        prop: 'Number',
        isPrimaryLink: true
      },
      {
        name: 'Customer No',
        prop: 'SellToCustomerNo'
      },
      {
        name: 'Customer Name',
        prop: 'SellToCustomerName'
      },
      {
        name: 'Pre-Assigned No',
        prop: 'PreAssignedNo'
      },
      {
        name: 'Posting Date',
        prop: 'PostingDate'
      },
      {
        name: 'shipment date',
        prop: 'ShipmentDate'
      },
      {
        name: 'PROJECT',
        prop: 'ShortcutDimension1Code'
      },
      {
        name: 'DEPARTMENT/COST CNTR',
        prop: 'ShortcutDimension2Code'
      },
      {
        name: 'Remark',
        prop: 'Remark',
      }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Posted Sales Credit Memo',
      recordId: "Number",
      recordTitle: "SellToCustomerName",
      headerConfig: PostedSalesCreditMemoHeader,
      lineConfig: PostedSalesCreditMemoLine,
      calculationSectionConfig: PostedSalesCreditMemocalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Credit Memo',
        documentStatusProp: 'Status',
        informationDetailSecctionType: InformationDetailSecctionType.SalesInvoice
      }
    }
  };
  MenuButtons: Menubuttons[] = [
    {
      label: 'Posted Sales Invoice',
      name: 'Posted Sales Invoice',
      icon: 'bi bi-arrow-90deg-right',
      route: '/sales/postedsalesInvoice',
    },
    {
      label: 'Posted Sales Credit Memo',
      name: 'Posted Sales Credit Memo',
      icon: 'bi bi-arrow-90deg-right',
      route: '/sales/postedsales-Credit-Memo',
      isEnable: false
    },
  ];

  totalAmount!: number;

  constructor(
    private formDataService: FormDataService,
    private addItemService: AddItemService,

  ) {
  }

  popupLoaded(data: any) {
    this.totalAmount = 0;
    console.log(data);
    const lineData = data.line;
    if (lineData) {
      lineData.forEach((line: any, rowIndex: number) => {
        this.totalAmount += line['LineAmount'] ? +line['LineAmount'] : 0;
      });
      this.formDataService.updateControlData$.next({ control: 'totalAmount', data: this.totalAmount.toFixed(2) });
    }
    this.addItemService.enableOrDisableAllControls$.next(false);

  }
}
