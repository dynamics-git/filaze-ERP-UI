import { Component } from '@angular/core';
import { pagesHeaderConfig, pagesListConfig } from './pages-configuration.config';
import { DocumentRuntimeComponent } from '../../shared/erp-core/components/document-runtime/document-runtime';

@Component({
  selector: 'app-pages-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './pages-configuration.html',
})
export class PagesPage {
  readonly pageId = 'pages';
  readonly listConfig = pagesListConfig;
  readonly headerConfig = pagesHeaderConfig;
}
