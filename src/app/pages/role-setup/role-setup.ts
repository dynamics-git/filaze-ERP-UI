import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  roleSetupHeaderConfig,
  roleSetupLineConfig,
  roleSetupListConfig,
} from './role-setup.config';

@Component({
  selector: 'app-role-setup',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './role-setup.html',
})
export class RoleSetupPage {
  readonly pageId = 'role-setup';
  readonly listConfig = roleSetupListConfig;
  readonly headerConfig = roleSetupHeaderConfig;
  readonly lineConfig = roleSetupLineConfig;
}
