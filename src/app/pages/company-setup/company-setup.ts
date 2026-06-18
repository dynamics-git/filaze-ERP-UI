import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  companySetupHeaderConfig,
  companySetupListConfig,
} from './company-setup.config';

@Component({
  selector: 'app-company-setup',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './company-setup.html',
})
export class CompanySetupPage {
  readonly pageId = 'company-setup';
  readonly listConfig = companySetupListConfig;
  readonly headerConfig = companySetupHeaderConfig;
}
