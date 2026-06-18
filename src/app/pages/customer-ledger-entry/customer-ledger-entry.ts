import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  customerLedgerEntryHeaderConfig,
  customerLedgerEntryListConfig,
} from './customer-ledger-entry.config';

@Component({
  selector: 'app-customer-ledger-entry',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './customer-ledger-entry.html',
})
export class CustomerLedgerEntryPage {
  readonly pageId = 'customer-ledger-entry';
  readonly listConfig = customerLedgerEntryListConfig;
  readonly headerConfig = customerLedgerEntryHeaderConfig;
}
