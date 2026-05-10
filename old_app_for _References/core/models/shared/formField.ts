import { FormFieldType } from './formField.enum';
import { EnumTextCase } from './textCase.enum';
import { TargetField } from './targetField';
import { FieldItemType } from './fieldItemType';

export interface FormField {
  name?: string;
  label?: string;
  type?: FormFieldType;
  disabled?: boolean;
  readonly?: boolean;
  readonlyHighlight?: boolean;
  items?: FieldItemType[];
  options?: any[];
  bindLabel?: string;
  bindValue?: string;
  mutiple?: boolean;
  required?: boolean;
  unique?: boolean;
  uniqueApiUrl?: string;
  dataExists?: boolean;
  dataExistsApi?: string;
  autofocus?: boolean;
  textFormat?: EnumTextCase;
  apiUrl?: string;
  maxlength?: number;
  target?: TargetField[];
  displayFormat?: string;
  showDropdownPopup?: boolean;
  lookup?: boolean;
  lookupDropdown?: boolean;
  decimal?: boolean;
  initialValue?: any;
  defaultSystemDate?: boolean;
  disablePastDays?: boolean;
  disableFutureDays?: boolean;
  dateOnly?: boolean;
  encryptPassword?: boolean;
  parentObjectName?: string;
  hidden?: boolean;
  alignRight?: boolean;
  fileAcceptFromats?: string;
  autoSave?: boolean;
  copyResetValue?: string;
  isDescription?: boolean;
  inputFromLine?: boolean;
  isNotVisiableSubPopup?: boolean;
  spacialClass?: string;
  showRequiredSymbol?: boolean;
  clearSpace?: boolean;
  systemUpdate?: boolean;
  hideInLine?: boolean,
    // 🔹 Action Field Support
  actionIcon?: string;                 // icon class (bi bi-people etc.)
  actionStyle?: 'link' | 'button' | 'icon';  // how to render
  actionClass?: string;                // optional custom CSS class
  lookupAllowCreate?: boolean;
  lookupCreateLabel?: string;
  lookupSeedField?: string;
  lookupRefreshStrategy?: 'append' | 'reload';
  lookupPopupSize?: 'sm' | 'md' | 'lg' | 'xl';
  lookupCreateConfig?: {
    title?: string;
    recordId?: string;
    recordTitle?: string;
    headerConfig: any;
  };
  section?: string;
}
