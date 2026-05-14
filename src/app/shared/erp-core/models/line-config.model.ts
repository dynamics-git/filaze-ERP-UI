import { DataSurfaceColumnConfig } from './data-surface-config.model';
import { FieldConfig, FieldFactPanelConfig, FieldOptionConfig } from './field-config.model';

export type LineType = 'item' | 'account' | 'resource' | 'text' | 'charge' | 'generic';
export type LineCellType = 'text' | 'select' | 'dropdown' | 'icon';
export type LineValueType = 'text' | 'number' | 'boolean' | 'date';

export interface LineColumnConfig extends DataSurfaceColumnConfig {
  cellType?: LineCellType;
  valueType?: LineValueType;
  readonly?: boolean;
  options?: FieldOptionConfig[];
  optionsDataKey?: string;
  optionsEndpoints?: string[];
  buttonIcon?: string;
  buttonTitle?: string;
  actionKey?: string;
  factPanel?: boolean | FieldFactPanelConfig;
}

export interface LineConfig {
  columns: LineColumnConfig[];
  fields?: FieldConfig[];
  lineKeyField?: string;
  parentKeyField?: string;
  selectable?: boolean;
  editable?: boolean;
  supportsSubLines?: boolean;
  lineType?: LineType;
}
