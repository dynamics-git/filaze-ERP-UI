import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  permissionFieldRuleHeaderConfig,
  permissionFieldRuleLineConfig,
  permissionFieldRuleListConfig,
} from './permission-field-rule-setup.config';

@Component({
  selector: 'app-permission-field-rule-setup',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './permission-field-rule-setup.html',
})
export class PermissionFieldRuleSetupPage {
  readonly pageId = 'permission-field-rule-setup';
  readonly listConfig = permissionFieldRuleListConfig;
  readonly headerConfig = permissionFieldRuleHeaderConfig;
  readonly lineConfig = permissionFieldRuleLineConfig;
}
