export interface ErpDataSourceConfig {
  endpoint: string;
  keyField?: string;
  parentKeyField?: string;
  documentNoField?: string;
  defaultSort?: string;
  defaultFilter?: string;
  pageSize?: number;
  supportsCreate?: boolean;
  supportsUpdate?: boolean;
  supportsDelete?: boolean;
}
