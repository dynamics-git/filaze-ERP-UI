import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../../shared/erp-core/public-api';
import {
  fieldPermissionsHeaderConfig,
  fieldPermissionsListConfig,
} from './field-permissions.config';

@Component({
  selector: 'app-field-permissions-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './field-permissions.html',
})
export class FieldPermissionsPage {
  readonly pageId = 'field-permissions';
  readonly listConfig = fieldPermissionsListConfig;
  readonly headerConfig = fieldPermissionsHeaderConfig;
}
