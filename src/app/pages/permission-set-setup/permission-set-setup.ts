import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  permissionSetSetupHeaderConfig,
  permissionSetSetupLineConfig,
  permissionSetSetupListConfig,
} from './permission-set-setup.config';

@Component({
  selector: 'app-permission-set-setup',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './permission-set-setup.html',
})
export class PermissionSetSetupPage {
  readonly pageId = 'permission-set-setup';
  readonly listConfig = permissionSetSetupListConfig;
  readonly headerConfig = permissionSetSetupHeaderConfig;
  readonly lineConfig = permissionSetSetupLineConfig;
}
