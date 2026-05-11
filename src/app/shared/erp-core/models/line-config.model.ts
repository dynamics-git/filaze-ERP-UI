import { ErpDataSurfaceColumnConfig } from './data-surface-config.model';
import { ErpFieldConfig, ErpFieldOptionConfig } from './field-config.model';

export type ErpLineType = 'item' | 'account' | 'resource' | 'text' | 'charge' | 'generic';
export type ErpLineCellType = 'text' | 'select' | 'icon';

export interface ErpLineColumnConfig extends ErpDataSurfaceColumnConfig {
  cellType?: ErpLineCellType;
  options?: ErpFieldOptionConfig[];
  buttonIcon?: string;
  buttonTitle?: string;
  actionKey?: string;
}

export interface ErpLineConfig {
  columns: ErpLineColumnConfig[];
  fields?: ErpFieldConfig[];
  lineKeyField?: string;
  parentKeyField?: string;
  selectable?: boolean;
  editable?: boolean;
  supportsSubLines?: boolean;
  lineType?: ErpLineType;
}
