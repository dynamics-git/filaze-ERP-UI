import { CommandConfig } from './command-config.model';
import { DataSourceConfig } from './data-source-config.model';
import { DataSurfaceConfig } from './data-surface-config.model';
import { FactboxConfig } from './factbox-config.model';
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

export interface ListPageColumnConfig {
  id: string;
  label: string;
  field?: string;
  type?: string;
  align?: 'start' | 'center' | 'end';
  isPrimary?: boolean;
  subtitleField?: string;
  width?: string;
}

export interface ListPageFactboxConfig {
  label?: string;
  title?: string;
  subtitle?: string;
  sections?: Array<{
    id?: string;
    title: string;
    fields?: Array<{
      id?: string;
      label: string;
      field?: string;
    }>;
  }>;
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
  standardActions?: unknown;
  dataSurface?: {
    id?: string;
    idField?: string;
    columns?: ListPageColumnConfig[];
  };
  factbox?: ListPageFactboxConfig;
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
