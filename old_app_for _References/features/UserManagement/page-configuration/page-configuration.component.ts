import { Component } from '@angular/core';
import { AddPageConfigurationConfig } from './page-configuration.config';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { Menubuttons } from '../../../core/models/shared/menu-button.config';
import { MenuItems } from '../../../layout/shell/navigation/menu-items';
import { RestService } from '../../../core/services/rest.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';

@Component({
  standalone: false,
  selector: 'app-page-configuration',
  template: '<app-data-table [config]="config" [MenuButtons]="MenuButtons"></app-data-table>'
})
export class PageConfigurationComponent {

  config: DataTableConfig = {
    title: 'Page Configuration',
    idProp: 'Id',
    headerApi: '/pageConfigurations',
    pageName: 'PAGE CONFIGURATION',
    headers: [ {
      name: 'Page',
      prop: 'Page',
      isPrimaryLink: true
    }, {
      name: 'Title',
      prop: 'title',
    },
    {
      name: 'Page URL',
      prop: 'PageUrl'
    }],
    selctionType: 'single',
    addItemConfig: {
      title: 'Page Configuration',
      recordId: 'Page',
      recordTitle: 'Page',
      headerConfig: AddPageConfigurationConfig
    }
  };

  constructor(private restService: RestService, private addItemService: AddItemService) { }

  MenuButtons: Menubuttons[] = [
    {
      label: 'Page Configuration',
      name: 'Page Configuration',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/pages',
      isEnable: false
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
    },
    {
      label: 'Active User',
      name: 'Active User',
      icon: 'bi bi-arrow-90deg-right',
      route: '/users/activeUser',
    },
    {
      label: 'Auto Page Config',
      name: 'Auto Page Config',
      icon: 'bi bi-arrow-90deg-right',
      fn: () => this.AutoPageConfig(),
    },
  ];



  AutoPageConfig() {
    this.addItemService.showLoader$.next(true);

    const pages = [
      ...MenuItems,
      // ...MenuItems2,
      // ...MenuItems3
    ]
      .flatMap(group => group.children || [])
      .filter(item => item.page && item.link);

    const addNext = (index: number) => {
      if (index >= pages.length) {
        this.addItemService.showLoader$.next(false);
        this.addItemService.refreshDataDataTable$.next(true);
        return;
      }

      const item = pages[index];
      this.restService
        .get(`/pageConfigurations?$filter=Page eq '${item.page}'`)
        .subscribe({
          next: (res: any) => {
            if (res?.value?.length > 0) {
              addNext(index + 1);
              return;
            }

            const payload = {
              title: item.title,
              Page: item.page,
              PageUrl: item.link
            };

            this.restService.post('/pageConfigurations', payload).subscribe({
              next: () => {
                addNext(index + 1);
              },
              error: () => addNext(index + 1)
            });
          },
          error: () => addNext(index + 1)
        });
    };

    addNext(0);
  }



}
