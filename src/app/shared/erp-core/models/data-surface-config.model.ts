export type ErpDataSurfaceMode = 'table' | 'card' | 'tree' | 'worksheet' | 'documentLines';

export type ErpDataSurfaceColumnType = 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'badge';

export interface ErpDataSurfaceColumnConfig {
  id: string;
  label: string;
  field?: string;
  subtitleField?: string;
  width?: string;
  align?: 'start' | 'center' | 'end';
  type?: ErpDataSurfaceColumnType;
  isPrimary?: boolean;
  currencyCode?: string;
  hidden?: boolean;
}

export interface ErpDataSurfaceConfig {
  id: string;
  mode?: ErpDataSurfaceMode;
  idField?: string;
  columns: ErpDataSurfaceColumnConfig[];
  selectable?: boolean;
  multiSelect?: boolean;
  sortable?: boolean;
  resizable?: boolean;
  infiniteScroll?: boolean;
}
