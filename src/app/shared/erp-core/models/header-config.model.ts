import { ErpFieldConfig } from './field-config.model';

export type ErpHeaderLayout = 'singleColumn' | 'twoColumn' | 'threeColumn' | 'summary';

export interface ErpHeaderFieldConfig extends Partial<ErpFieldConfig> {
  id: string;
  key?: string;
  label: string;
  field?: string;
}

export interface ErpHeaderSectionConfig {
  id: string;
  title?: string;
  fields: ErpHeaderFieldConfig[];
  layout?: ErpHeaderLayout;
  readonly?: boolean;
  collapsible?: boolean;
}

export interface ErpHeaderConfig {
  sections: ErpHeaderSectionConfig[];
  fields?: ErpHeaderFieldConfig[];
  layout?: ErpHeaderLayout;
  readonly?: boolean;
  collapsible?: boolean;
}
