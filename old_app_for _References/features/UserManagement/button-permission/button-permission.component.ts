import { Component } from '@angular/core';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { ButtonPermissionLine } from './button-permission.config';

@Component({
  standalone: false,
  selector: 'app-button-permission',
  template: '<app-data-table [config]="config"></app-data-table>'
})
export class ButtonPermissionComponent {
  config: DataTableConfig = {

    addItemConfig: {
      title: 'Button Permission',
      hasNoHeaderApi: true,
      isDirectApi: true,
      lineConfig: ButtonPermissionLine,
    },
    removeUnicodeCharFields: ['Status']
  };



}
