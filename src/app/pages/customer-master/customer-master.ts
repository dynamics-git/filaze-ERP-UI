import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  customerMasterHeaderConfig,
  customerMasterListConfig,
} from './customer-master.config';

@Component({
  selector: 'app-customer-master',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './customer-master.html',
})
export class CustomerMasterPage {
  readonly pageId = 'customer-master';
  readonly listConfig = customerMasterListConfig;
  readonly headerConfig = customerMasterHeaderConfig;
}
