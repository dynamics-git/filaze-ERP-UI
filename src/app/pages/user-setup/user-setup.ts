import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  userSetupHeaderConfig,
  userSetupLineConfig,
  userSetupListConfig,
} from './user-setup.config';

@Component({
  selector: 'app-user-setup',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './user-setup.html',
})
export class UserSetupPage {
  readonly pageId = 'user-setup';
  readonly listConfig = userSetupListConfig;
  readonly headerConfig = userSetupHeaderConfig;
  readonly lineConfig = userSetupLineConfig;
}
