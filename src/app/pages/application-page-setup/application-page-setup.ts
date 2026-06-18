import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  appPageSetupHeaderConfig,
  appPageSetupLineConfig,
  appPageSetupListConfig,
} from './application-page-setup.config';

@Component({
  selector: 'app-application-page-setup',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './application-page-setup.html',
})
export class ApplicationPageSetupPage {
  readonly pageId = 'application-page-setup';
  readonly listConfig = appPageSetupListConfig;
  readonly headerConfig = appPageSetupHeaderConfig;
  readonly lineConfig = appPageSetupLineConfig;
}
