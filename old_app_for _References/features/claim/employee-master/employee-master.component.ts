import { Component } from '@angular/core';
import {  EmployeeMasterHeaderConfig } from './employee-master.config'
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';

@Component({
  standalone: false,
  selector: 'app-employee-master',
  template: '<app-data-table [config]="config" [MenuButtons]="MenuButtons"></app-data-table>',
})
export class EmployeeMasterComponent {
  config: DataTableConfig = {
    title: 'Employee',
    idProp: 'systemId',
    headerApi: '/employees',
    pageName: 'EMP',
    headers: [
      { name: 'Employee ID', prop: 'no', isPrimaryLink: true },
      { name: 'First Name', prop: 'firstName' },
      { name: 'Last Name', prop: 'lastName' },
      { name: 'Staff Group ID', prop: 'staffGroupId' },
      { name: 'Role ID', prop: 'roleId' },
      { name: 'Department ID', prop: 'departmentId' },
      { name: 'Country Code', prop: 'countryRegionCode' }
    ],
    selctionType: 'single',
    addItemConfig: {
      title: 'Employee',
      recordId: 'no',
      recordTitle: 'no',
      headerConfig: EmployeeMasterHeaderConfig
    }
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Rule Settings',
      name: 'Rule Settings',
      icon: 'bi bi-lightbulb',
      route: '/claim/ruleSetup',
    },
  ]

}

