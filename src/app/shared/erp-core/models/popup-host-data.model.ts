import type { ConfirmationDialogConfig } from './confirmation-dialog-config.model';
import type { EntryDialogConfig } from './entry-dialog-config.model';
import type { ListPageConfig } from './page-config.model';
import type { PopupConfig } from './popup-config.model';

export type PopupLayoutMode = 'header-line' | 'header-only' | 'line-only';

export interface NestedPopupBehavior {
  mode?: PopupConfig['mode'];
  size?: PopupConfig['size'];
  closeOnBackdrop?: boolean;
  allowNested?: boolean;
  layout?: PopupLayoutMode;
}

export interface RunModalListPopupState {
  pageId: string;
  config: ListPageConfig;
  rows: unknown[];
  loading: boolean;
  errorMessage?: string;
}

export interface PopupHostData {
  entryDialogConfig?: EntryDialogConfig;
  runModalList?: RunModalListPopupState;
  confirmationDialogConfig?: ConfirmationDialogConfig;
  nestedEntryDialogConfigs?: Record<string, EntryDialogConfig>;
  nestedPopupBehaviors?: Record<string, NestedPopupBehavior>;
}
