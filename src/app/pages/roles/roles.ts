import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import { rolesHeaderConfig, rolesListConfig } from './roles.config';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './roles.html',
})
export class RolesPage {
  readonly pageId = 'roles';
  readonly listConfig = rolesListConfig;
  readonly headerConfig = rolesHeaderConfig;
}
