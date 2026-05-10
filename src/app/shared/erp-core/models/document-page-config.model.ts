import { ErpCommandConfig } from './command-config.model';
import { ErpDataSourceConfig } from './data-source-config.model';
import { ErpFactboxConfig } from './factbox-config.model';
import { ErpHeaderConfig } from './header-config.model';
import { ErpLineConfig } from './line-config.model';
import { ErpPopupConfig } from './popup-config.model';

export interface ErpDocumentPageConfig {
  pageType: 'document';
  title: string;
  subtitle?: string;
  commands?: ErpCommandConfig[];
  header?: ErpHeaderConfig;
  lines?: ErpLineConfig;
  factbox?: ErpFactboxConfig;
  popup?: ErpPopupConfig;
  dataSource?: ErpDataSourceConfig;
}
