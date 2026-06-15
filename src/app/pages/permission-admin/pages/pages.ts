import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../../shared/erp-core/public-api';
import { pagesHeaderConfig, pagesListConfig } from './pages.config';

@Component({
  selector: 'app-pages-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './pages.html',
})
export class PagesPage {
  readonly pageId = 'pages';
  readonly listConfig = pagesListConfig;
  readonly headerConfig = pagesHeaderConfig;
}
