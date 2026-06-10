import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  dummyHeaderOnlyHeaderConfig,
  dummyHeaderOnlyListConfig,
} from './dummy-header-only.config';

@Component({
  selector: 'app-dummy-header-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './dummy-header-page.html',
})
export class DummyHeaderPage {
  readonly pageId = 'dummy-header-only';
  readonly listConfig = dummyHeaderOnlyListConfig;
  readonly headerConfig = dummyHeaderOnlyHeaderConfig;
}
