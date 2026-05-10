import { Component } from '@angular/core';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import {  CountryMasterHeaderConfig } from './country-master.config';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
@Component({
  standalone: false,
  selector: 'app-country-master',
  template: '<app-data-table [config]="config" [MenuButtons]="MenuButtons"></app-data-table>',
})
export class CountryMasterComponent {

  constructor(private formDataService: FormDataService) {
  }

  config: DataTableConfig = {
    title: 'Country',
    idProp: 'Id',
    headerApi: '/countryRegionCodes',
    pageName: 'COUNTRY',
    headers: [
      { name: 'Country Code', prop: 'Code', isPrimaryLink: true },
      { name: 'Country Name', prop: 'Name' }
    ],

    showCreate: false,
    showEdit: false,
    showDelete: false,

    /** Kept for consistency, not used */
    addItemConfig: {
      title: 'Country',
      recordId: 'Code',
      recordTitle: 'Code',
      headerConfig: CountryMasterHeaderConfig
    }
  };


 MenuButtons: Menubuttons[] = [
      {
        label: 'Rule Settings',
        name: 'Rule Settings',
        icon: 'bi bi-lightbulb',
        route: '/claimSetupHome/ruleSetup',
      },
    ]
  


  // popupLoaded(data: any) {
  //   if (data.section == SectionType.Header) {
  //     switch (data.control) {
  //       case 'countryCode':
  //         this.formDataService.updateControlData$.next({ control: 'countryName', data: data.dropdownData.Name, eventEmit: true });
  //         break;
  //     }
  //   }
  // }



}

