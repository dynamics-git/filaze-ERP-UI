import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  pagePermissionsHeaderConfig,
  pagePermissionsLineConfig,
  pagePermissionsListConfig,
} from './page-permissions.config';

@Component({
  selector: 'app-page-permissions-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './page-permissions.html',
})
export class PagePermissionsPage {
  readonly pageId = 'page-permissions';
  readonly listConfig = pagePermissionsListConfig;
  readonly headerConfig = pagePermissionsHeaderConfig;
  readonly lineConfig = pagePermissionsLineConfig;
}
