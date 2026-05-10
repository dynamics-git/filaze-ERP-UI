import { ErpDataSurfaceColumnConfig } from './data-surface-config.model';
import { ErpFieldConfig } from './field-config.model';

export type ErpLineType = 'item' | 'account' | 'resource' | 'text' | 'charge' | 'generic';

export interface ErpLineConfig {
  columns: ErpDataSurfaceColumnConfig[];
  fields?: ErpFieldConfig[];
  lineKeyField?: string;
  parentKeyField?: string;
  selectable?: boolean;
  editable?: boolean;
  supportsSubLines?: boolean;
  lineType?: ErpLineType;
}
