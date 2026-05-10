export type ErpCommandType = 'primary' | 'normal' | 'danger' | 'menu' | 'divider';

export type ErpCommandGroup = 'new' | 'process' | 'post' | 'report' | 'more' | 'tools';

export interface ErpStandardCommandConfig {
  new?: boolean;
  delete?: boolean;
  refresh?: boolean;
}

export interface ErpCommandConfig {
  id: string;
  label: string;
  icon?: string;
  type?: ErpCommandType;
  group?: ErpCommandGroup;
  disabled?: boolean;
  hidden?: boolean;
  children?: ErpCommandConfig[];
  actionKey?: string;
}
