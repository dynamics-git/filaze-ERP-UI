import { Component, OnInit } from '@angular/core';

import { AddVendorConfig } from './add-vendor.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { AddItemService } from '../../../core/services/shared/add-item.service';

@Component({
  standalone: false,
  selector: 'app-register-vendor',
  template: '<app-data-table [config]="config" (popupLoaded)="popupLoaded($event)"></app-data-table>'
})
export class RegisterVendorComponent {

  config: DataTableConfig = {
    title: 'Vendors',
    idProp: 'id',
    headerApi: '/vendorsAPI',
    headerApiOrderByField: 'number',
    pageName: 'REGISTER VENDOR',
    headers: [{
      name: 'Number',
      prop: 'number',
      isPrimaryLink: true
    }, {
      name: 'Name',
      prop: 'displayName'
    },
    {
      name: 'Address',
      prop: 'address',
    },
    {
      name: 'Address2',
      prop: 'address2',
    },
    {
      name: 'City',
      prop: 'city',
    },
    {
      name: 'Country',
      prop: 'countryRegionCode',
    },
    {
      name: 'Post Code',
      prop: 'postCode',
    },
    //  {
    //   name: 'Address',
    //   prop: 'address',
    //   isObject: true,
    //   displayFormat: "{{address.street}}, {{address.city}}, {{address.countryLetterCode}}"
    // }, 
    {
      name: 'Status',
      prop: 'ApprovalStatus'
    }],
    selctionType: 'single',
    // showDelete: false,
    // showCreate: true,
    // showEdit: false,
    addItemConfig: {
      title: 'Vendor',
      recordId: 'number',
      recordTitle: 'displayName',
      headerConfig: AddVendorConfig
    }
  };
  constructor(
    private addItemService: AddItemService,
  ) {
  }

  popupLoaded(data: any) {
    this.addItemService.enableOrDisableAllControls$.next(false);
  }

}
