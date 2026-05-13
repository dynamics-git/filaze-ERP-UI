export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'currency'
  | 'select'
  | 'dropdown'
  | 'lookup'
  | 'textarea'
  | 'badge';

export type FieldValueType = 'text' | 'number' | 'boolean' | 'date';

export interface FieldOptionConfig {
  label: string;
  value: unknown;
}

export interface FieldLookupConfig {
  endpoint: string;
  valueField: string;
  displayField: string;
  searchFields?: string[];
  allowOpenCard?: boolean;
}

export interface FieldValidationConfig {
  min?: number;
  max?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
}

export interface FieldMessagesConfig {
  validationFailed?: string;
  saveFailed?: string;
}

export interface FieldTargetConfig {
  key: string;
  source: string;
  fallbackSources?: string[];
  clearOnEmpty?: boolean;
}

export interface FieldConfig {
  key: string;
  label: string;
  type?: FieldType;
  valueType?: FieldValueType;
  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: FieldOptionConfig[];
  optionsDataKey?: string;
  bindLabel?: string;
  bindValue?: string;
  displayFormat?: string;
  targets?: FieldTargetConfig[];
  lookup?: FieldLookupConfig;
  validation?: FieldValidationConfig;
  messages?: FieldMessagesConfig;
  width?: string;
  sectionId?: string;
}

export interface FormSectionConfig {
  id: string;
  title?: string;
  fields: FieldConfig[];
}
