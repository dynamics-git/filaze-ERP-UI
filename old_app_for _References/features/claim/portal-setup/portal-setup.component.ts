import { Component } from '@angular/core';
import { ItemConfig } from '../../../core/models/shared/item.config';
import { PortalSetupConfig } from './portal-setup.config';

@Component({
  standalone: false,
  selector: 'app-portal-setup',
  template: '<app-add-item [config]="config"></app-add-item>'
})
export class PortalSetupComponent {
  constructor() { }

  public config: ItemConfig = {
    title: 'Portal Setup',
    recordId: '',
    recordTitle: '',
    headerConfig: PortalSetupConfig,
    returnUrl: '/users/pages',
  }

}
