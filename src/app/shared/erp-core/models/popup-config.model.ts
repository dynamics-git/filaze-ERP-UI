export type ErpPopupSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type ErpPopupMode = 'modal' | 'drawer' | 'page';

export interface ErpPopupConfig {
  id: string;
  title?: string;
  size?: ErpPopupSize;
  mode?: ErpPopupMode;
  allowNested?: boolean;
  closeOnBackdrop?: boolean;
  data?: unknown;
}
