import { Component } from '@angular/core';

import { PostedSalesInvoiveHeader, PostedSalesInvoiceLine, PostedSalesInvoicecalculation } from './posted-sales-invoice.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-posted-sales-invoice',
  template: `<app-data-table [config]="config" [MenuButtons]="MenuButtons"></app-data-table>`,
  styles: []
})
export class PostedSalesInvoiceComponent {

  config: DataTableConfig = {
    title: 'Posted Sales Invoice',
    idProp: 'Id',
    headerApi: '/postedSalesInvoiceHeaders',
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
      title: 'Posted Sales Invoice',
      recordId: "Number",
      recordTitle: "SellToCustomerName",
      headerConfig: PostedSalesInvoiveHeader,
      lineConfig: PostedSalesInvoiceLine,
      calculationSectionConfig: PostedSalesInvoicecalculation,
      informationSectionConfig: {
        documentNoProp: 'Number',
        documentType: 'Sales Invoice',
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
      isEnable: false
    },
    {
      label: 'Posted Sales Credit Memo',
      name: 'Posted Sales Credit Memo',
      icon: 'bi bi-arrow-90deg-right',
      route: '/sales/postedsales-Credit-Memo',
    },
  ];
  
}
