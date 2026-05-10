import { Component, OnInit } from '@angular/core';
import { PortalReason } from './portal-reason-page.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-portal-reason-page',
  template: `<app-data-table [config]="config" [MenuButtons]="MenuButtons"></app-data-table>`,
  styles: []
})
export class PortalReasonPageComponent implements OnInit {

  config: DataTableConfig = {
    title: 'Portal Reason',
    idProp: 'Id',
    headerApi: '/portalReasons',
    pageName: 'PORTAL REASON',
    headerApiOrderByField: 'Code',
    filterByUserCompanyResCenter: true,
    showDelete: true,
    showCreate: true,
    showEdit: true,
    headers: [
      {
        name: 'Code',
        prop: 'Code',
        isPrimaryLink: true
      },
      {
        name: 'Description',
        prop: 'Description',
      },
    ],
    addItemConfig: {
      title: 'Portal Reason',
      recordId: "Code",
      recordTitle: "Description",
      headerConfig: PortalReason,
    }

  }

  MenuButtons: Menubuttons[] = [
    {
      label: 'Page Configuration',
      name: 'Page Configuration',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/pages',
    },
    {
      label: 'Users',
      name: 'Users',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/users',
    },
    {
      label: 'User Roles',
      name: 'User Roles',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/roles',
    },
    {
      label: 'Company Permissions',
      name: 'Company Permissions',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/company-permissions',
    },
    {
      label: 'Portal Reason',
      name: 'Portal Reason',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/portal-reasons',
      isEnable: false
    },
    {
      label: 'Active User',
      name: 'Active User',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/activeUser',
    },
  ];
  constructor() { }

  ngOnInit() {
  }

}
