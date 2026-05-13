import { FieldConfig } from './field-config.model';

export type HeaderLayout = 'singleColumn' | 'twoColumn' | 'threeColumn' | 'summary';

export interface HeaderFieldConfig extends Partial<FieldConfig> {
  id: string;
  key?: string;
  label: string;
  field?: string;
}

export interface HeaderSectionConfig {
  id: string;
  title?: string;
  fields: HeaderFieldConfig[];
  layout?: HeaderLayout;
  readonly?: boolean;
  collapsible?: boolean;
}

export interface HeaderConfig {
  sections: HeaderSectionConfig[];
  fields?: HeaderFieldConfig[];
  layout?: HeaderLayout;
  readonly?: boolean;
  collapsible?: boolean;
}
