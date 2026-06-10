import { Component } from '@angular/core';
import { ListPageComponent } from '../../shared/erp-core/public-api';
import { dummyMasterListConfig } from './dummy-master.config';

@Component({
  selector: 'app-dummy-master-page',
  standalone: true,
  imports: [ListPageComponent],
  templateUrl: './dummy-master-page.html',
})
export class DummyMasterPage {
  readonly config = dummyMasterListConfig;
}
