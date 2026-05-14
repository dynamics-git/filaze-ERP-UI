import { CommandConfig, StandardCommandConfig } from './command-config.model';
import { DataSourceConfig } from './data-source-config.model';
import { DataSurfaceColumnConfig, DataSurfaceConfig } from './data-surface-config.model';
import { FactboxConfig } from './factbox-config.model';
import { ListFactPanelConfig } from './list-page-factbox-config.model';
import { ListFilterConfig } from './list-filter-config.model';
import { PopupConfig } from './popup-config.model';
import type { EntryDialogConfig } from './entry-dialog-config.model';

export type PageType = 'list' | 'card' | 'document' | 'worksheet' | 'setup';

export interface PageViewConfig {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface PageToolsConfig {
  filter?: boolean;
  advancedFilter?: boolean;
  export?: boolean;
  columns?: boolean;
}

export type ListPageColumnConfig = DataSurfaceColumnConfig;

export interface ListPageBehaviorConfig {
  strictFieldMapping?: boolean;
  keyFallbackFields?: string[];
  typeField?: string;
  typeFallbackFields?: string[];
  typeDefault?: string;
  statusField?: string;
  statusFallbackFields?: string[];
  statusDefault?: string;
  toneField?: string;
  toneFallbackFields?: string[];
  toneDefault?: string;
  iconByType?: Record<string, string>;
  defaultIcon?: string;
}

export interface BasePageConfig extends Record<string, unknown> {
  id?: string;
  title?: string;
  subtitle?: string;
  module?: string;
  company?: string;
  viewSuffix?: string;
  tools?: PageToolsConfig;
  filterConfig?: ListFilterConfig;
  commands?: CommandConfig[];
  popup?: PopupConfig;
  dataSource?: DataSourceConfig;
}

export interface ListPageConfig extends BasePageConfig {
  views?: Array<{ id: string; label: string; filter?: string }>;
  activeViewId?: string;
  searchFields?: string[];
  searchPlaceholder?: string;
  standardActions?: StandardCommandConfig;
  dataSurface?: DataSurfaceConfig;
  behavior?: ListPageBehaviorConfig;
  factPanel?: ListFactPanelConfig;
  factbox?: ListFactPanelConfig;
}

export interface EntryPageConfig extends BasePageConfig {
  entryDialog?: EntryDialogConfig;
}

export interface PageConfig extends BasePageConfig {
  id: string;
  title: string;
  pageType?: PageType;
  views?: PageViewConfig[];
  activeViewId?: string;
  dataSurface?: DataSurfaceConfig;
  factbox?: FactboxConfig;
  header?: DataSurfaceConfig;
  lines?: DataSurfaceConfig;
}
