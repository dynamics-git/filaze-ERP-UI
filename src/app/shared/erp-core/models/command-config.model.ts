export type CommandType = 'primary' | 'normal' | 'danger' | 'menu' | 'divider';

export type CommandGroup = 'new' | 'process' | 'post' | 'report' | 'more' | 'tools';

export interface StandardCommandConfig {
  new?: boolean;
  delete?: boolean;
  refresh?: boolean;
}

export interface CommandConfig {
  id: string;
  label: string;
  icon?: string;
  type?: CommandType;
  group?: CommandGroup;
  disabled?: boolean;
  hidden?: boolean;
  children?: CommandConfig[];
  actionKey?: string;
}
