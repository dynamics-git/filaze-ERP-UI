export type CommandSurface = 'list' | 'header' | 'line' | 'detail' | 'factPanel';
export type CommandTone = 'primary' | 'normal' | 'danger';
export type CommandSelectionMode = 'single' | 'multiple';
export type CommandRunModalTarget = 'list' | 'entry';
export type CommandPermissionAction =
  | 'view'
  | 'insert'
  | 'edit'
  | 'delete'
  | 'submit'
  | 'approve'
  | 'reject'
  | 'reopen'
  | 'cancel'
  | 'assign'
  | 'export'
  | 'print'
  | 'post'
  | 'archive';

export interface StandardCommandConfig {
  new?: boolean;
  delete?: boolean;
  refresh?: boolean;
}

export interface ErpCommandConfig {
  id?: string;
  label: string;
  actionKey: string;
  surface?: CommandSurface;
  group?: string;
  icon?: string;
  trailingIcon?: string;
  order?: number;
  isPrimary?: boolean;
  tone?: CommandTone;
  disabled?: boolean;
  hidden?: boolean;
  runModalPageId?: string;
  runModalTarget?: CommandRunModalTarget;
  runModalView?: CommandRunModalTarget;
  requireSelection?: boolean;
  selectionMode?: CommandSelectionMode;
  tooltip?: string;
  permissionAction?: CommandPermissionAction;
  permissionKey?: string;
}

export type CommandConfig = ErpCommandConfig;
