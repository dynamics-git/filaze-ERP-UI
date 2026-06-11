export interface DataSourceConfig {
  endpoint: string;
  contractProfileKey?: string;
  keyField?: string;
  parentKeyField?: string;
  parentFixedFields?: Record<string, unknown>;
  createFields?: string[];
  updateBlockedFields?: string[];
  documentNoField?: string;
  autoGenerateNumber?: boolean;
  lazyCreateOnFirstInput?: boolean;
  defaultSort?: string;
  defaultFilter?: string;
  pageSize?: number;
  queryStyle?: 'odata' | 'laravel';
  idStyle?: 'odata' | 'slash';
  scope?: 'company' | 'global';
  supportsCreate?: boolean;
  supportsUpdate?: boolean;
  supportsDelete?: boolean;
  navigation?: {
    parentEndpoint: string;
    childCollection: string;
    parentIdFields?: string[];
    top?: number;
  };
}
