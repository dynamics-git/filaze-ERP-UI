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

export type ErpFieldValueType = 'text' | 'number' | 'boolean' | 'date';

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

export interface ErpFieldMessagesConfig {
  validationFailed?: string;
  saveFailed?: string;
}

export interface ErpFieldTargetConfig {
  key: string;
  source: string;
  fallbackSources?: string[];
  clearOnEmpty?: boolean;
}

export interface ErpFieldConfig {
  key: string;
  label: string;
  type?: ErpFieldType;
  valueType?: ErpFieldValueType;
  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: ErpFieldOptionConfig[];
  optionsDataKey?: string;
  bindLabel?: string;
  bindValue?: string;
  displayFormat?: string;
  targets?: ErpFieldTargetConfig[];
  lookup?: ErpFieldLookupConfig;
  validation?: ErpFieldValidationConfig;
  messages?: ErpFieldMessagesConfig;
  width?: string;
  sectionId?: string;
}

export interface ErpFormSectionConfig {
  id: string;
  title?: string;
  fields: ErpFieldConfig[];
}
