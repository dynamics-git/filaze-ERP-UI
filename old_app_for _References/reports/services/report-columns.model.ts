export interface ReportColumn {
  prop: string;
  name: string;
  convertMonth?: boolean;
  align?: 'left' | 'right' | 'center';
}


export interface ReportTableConfig {
  api: string,
  title: string,
  pageName: string,
  pageSize?: number,
  apiOrderByField?: string,
  uiOrderByField?: string,
  uiOrderByDirection?: 'asc' | 'desc',
  filter?: CustomDataFilter[];
}

export interface CustomDataFilter {
  field?: string;
  operator?: string;
  value?: string;
}
