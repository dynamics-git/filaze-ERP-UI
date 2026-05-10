import { LineDataConfig } from './line-data.config';

export type PopupCommandGroup = 'Process' | 'Approval' | 'Review' | 'More';
export type PopupBuiltInActionKey = 'comments' | 'dimension';

export interface PopupCommandBarConfig {
  maxPrimaryActions?: number;
  maxVisibleGroups?: number;
  builtInActions?: Partial<Record<PopupBuiltInActionKey, PopupCommandGroup>>;
}

export interface CustomButton {
  label: string;
  name: string;
  icon?: string;
  fn?: string;
  url?: string;
  isEnable?: boolean;
  isVisible?: boolean;
  group?: PopupCommandGroup;
  isPrimary?: boolean;
  order?: number;
  allowMultiple?: boolean;
  /** If set, clicking this button auto-opens a SetupLineModal - no feature component code needed. */
  lineConfig?: LineDataConfig;
}

export interface CustomMenuButton {
  buttonName: String;
  icon?: string;
  items: CustomButton[]
}
