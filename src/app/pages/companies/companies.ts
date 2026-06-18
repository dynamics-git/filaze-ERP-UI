import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  companiesHeaderConfig,
  companiesLineConfig,
  companiesListConfig,
} from './companies.config';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './companies.html',
})
export class CompaniesPage {
  readonly pageId = 'companies';
  readonly listConfig = companiesListConfig;
  readonly headerConfig = companiesHeaderConfig;
  readonly lineConfig = companiesLineConfig;
}
