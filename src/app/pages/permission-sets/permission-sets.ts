import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import { permissionSetsHeaderConfig, permissionSetsListConfig } from './permission-sets.config';

@Component({
  selector: 'app-permission-sets-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './permission-sets.html',
})
export class PermissionSetsPage {
  readonly pageId = 'permission-sets';
  readonly listConfig = permissionSetsListConfig;
  readonly headerConfig = permissionSetsHeaderConfig;
}
