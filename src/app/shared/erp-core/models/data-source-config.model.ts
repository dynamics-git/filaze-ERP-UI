export interface DataSourceConfig {
  endpoint: string;
  contractProfileKey?: string;
  keyField?: string;
  parentKeyField?: string;
  createFields?: string[];
  updateBlockedFields?: string[];
  documentNoField?: string;
  autoGenerateNumber?: boolean;
  lazyCreateOnFirstInput?: boolean;
  defaultSort?: string;
  defaultFilter?: string;
  pageSize?: number;
  supportsCreate?: boolean;
  supportsUpdate?: boolean;
  supportsDelete?: boolean;
}
