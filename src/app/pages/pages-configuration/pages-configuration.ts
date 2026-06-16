import { Component } from '@angular/core';
import { pagesConfigurationHeaderConfig, pagesConfigurationListConfig } from './pages-configuration.config';
import { DocumentRuntimeComponent } from '../../shared/erp-core/components/document-runtime/document-runtime';

@Component({
  selector: 'app-pages-configuration-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './pages-configuration.html',
})
export class PagesConfigurationPage {
  readonly pageId = 'page-configuration';
  readonly listConfig = pagesConfigurationListConfig;
  readonly headerConfig = pagesConfigurationHeaderConfig;
}
