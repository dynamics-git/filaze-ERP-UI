import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  pageFieldSetupHeaderConfig,
  pageFieldSetupLineConfig,
  pageFieldSetupListConfig,
} from './page-field-setup.config';

@Component({
  selector: 'app-page-field-setup',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './page-field-setup.html',
})
export class PageFieldSetupPage {
  readonly pageId = 'page-field-setup';
  readonly listConfig = pageFieldSetupListConfig;
  readonly headerConfig = pageFieldSetupHeaderConfig;
  readonly lineConfig = pageFieldSetupLineConfig;
}
