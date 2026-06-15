import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  rolePermissionSetsHeaderConfig,
  rolePermissionSetsLineConfig,
  rolePermissionSetsListConfig,
} from './role-permission-sets.config';

@Component({
  selector: 'app-role-permission-sets-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './role-permission-sets.html',
})
export class RolePermissionSetsPage {
  readonly pageId = 'role-permission-sets';
  readonly listConfig = rolePermissionSetsListConfig;
  readonly headerConfig = rolePermissionSetsHeaderConfig;
  readonly lineConfig = rolePermissionSetsLineConfig;
}
