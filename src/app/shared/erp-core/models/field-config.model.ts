export type ErpFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'currency'
  | 'select'
  | 'lookup'
  | 'textarea'
  | 'badge';

export interface ErpFieldOptionConfig {
  label: string;
  value: unknown;
}

export interface ErpFieldLookupConfig {
  endpoint: string;
  valueField: string;
  displayField: string;
  searchFields?: string[];
  allowOpenCard?: boolean;
}

export interface ErpFieldValidationConfig {
  min?: number;
  max?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
}

export interface ErpFieldConfig {
  key: string;
  label: string;
  type?: ErpFieldType;
  required?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: ErpFieldOptionConfig[];
  lookup?: ErpFieldLookupConfig;
  validation?: ErpFieldValidationConfig;
  width?: string;
  sectionId?: string;
}

export interface ErpFormSectionConfig {
  id: string;
  title?: string;
  fields: ErpFieldConfig[];
}
