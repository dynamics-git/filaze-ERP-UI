import { ErpCommandConfig } from './command-config.model';
import { ErpDataSurfaceConfig } from './data-surface-config.model';
import { ErpFactboxConfig } from './factbox-config.model';
import { ErpPopupConfig } from './popup-config.model';

export type ErpPageType = 'list' | 'card' | 'document' | 'worksheet' | 'setup';

export interface ErpPageConfig {
  id: string;
  title: string;
  subtitle?: string;
  pageType?: ErpPageType;
  commands?: ErpCommandConfig[];
  dataSurface?: ErpDataSurfaceConfig;
  factbox?: ErpFactboxConfig;
  popup?: ErpPopupConfig;
  header?: ErpDataSurfaceConfig;
  lines?: ErpDataSurfaceConfig;
}
