import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../shared/erp-core/public-api';
import {
  dummyLineOnlyHeaderConfig,
  dummyLineOnlyLineConfig,
  dummyLineOnlyListConfig,
} from './dummy-line-only.config';

@Component({
  selector: 'app-dummy-line-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './dummy-line-page.html',
})
export class DummyLinePage {
  readonly pageId = 'dummy-line-only';
  readonly listConfig = dummyLineOnlyListConfig;
  readonly headerConfig = dummyLineOnlyHeaderConfig;
  readonly lineConfig = dummyLineOnlyLineConfig;
}
