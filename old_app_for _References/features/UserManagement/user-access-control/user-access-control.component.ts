import { Component } from '@angular/core';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';

@Component({
  standalone: false,
  selector: 'app-page-configuration',
  template: '<app-data-table [config]="config"></app-data-table>'
})
export class UserAccessControlComponent {

  config: DataTableConfig = {
    title: 'User Access Control',
    idProp: 'Token',
    headerApi: '/portalAccessControls',
    pageName: 'ACCESS CONTROL',
    headers: [{
      name: 'User Id',
      prop: 'LoginId'
    },
    {
      name: 'System Id',
      prop: 'systemId'
    },
    {
      name: 'Login Date',
      prop: 'loginDate'
    }
    ],
    selctionType: 'single'
  };

}
