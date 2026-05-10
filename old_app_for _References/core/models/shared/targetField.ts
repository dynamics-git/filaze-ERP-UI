import { FormFieldType } from './formField.enum';

export interface TargetField {
  label: string;
  type: FormFieldType;
  prop?: string;
}
