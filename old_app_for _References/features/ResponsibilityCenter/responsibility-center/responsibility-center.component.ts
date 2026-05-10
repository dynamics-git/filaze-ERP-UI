import { Component, OnInit } from '@angular/core';
import { AddResponsibilityCenterConfig } from './responsibility-center.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';

@Component({
  standalone: false,
  selector: 'app-responsibility-center',
  template: '<app-data-table [config]="config" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class ResponsibilityCenterComponent {
  
  config: DataTableConfig = {
    title: 'Responsibility Center',
    idProp: 'Id',
    headerApi: '/portalResponsibilityCentres',
    pageName: 'RESPONSIBILITY CENTER',
    headers: [{
      name: 'Code',
      prop: 'Code',
      isPrimaryLink: true
    }, {
      name: 'Description',
      prop: 'Description'
    }],
    selctionType: 'single',
    addItemConfig: {
      title: 'Responsibility Center',
      recordId: 'Code',
      recordTitle: 'Code',
      headerConfig: AddResponsibilityCenterConfig
    }
  };

  MenuButtons: Menubuttons[] = [
    {
      label: 'Responsibility Center',
      name: 'Responsibility Center',
      icon: 'bi bi-arrow-90deg-right',
      route: '/responsibility/list',
      isEnable: false
    },
    {
      label: 'User Permissions',
      name: 'User Permissions',
      icon: 'bi bi-arrow-90deg-right',
      route: '/responsibility/permissions',
    },
  ];

}
