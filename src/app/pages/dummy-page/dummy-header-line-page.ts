import { Component } from '@angular/core';
import {
  DocumentRuntimeCommandEvent,
  DocumentRuntimeComponent,
} from '../../shared/erp-core/public-api';
import {
  dummyHeaderLineHeaderConfig,
  dummyHeaderLineLineConfigWithTotals,
  dummyHeaderLineListConfig,
} from './dummy-header-line.config';

@Component({
  selector: 'app-dummy-header-line-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './dummy-header-line-page.html',
})
export class DummyHeaderLinePage {
  readonly pageId = 'dummy-header-line';
  readonly listConfig = dummyHeaderLineListConfig;
  readonly headerConfig = dummyHeaderLineHeaderConfig;
  readonly lineConfig = dummyHeaderLineLineConfigWithTotals;

  handleBusinessCommand(event: DocumentRuntimeCommandEvent): void {
    if (event.actionKey === 'cmd:send-approval') {
      // Replace with real business API process.
    }
  }
}
