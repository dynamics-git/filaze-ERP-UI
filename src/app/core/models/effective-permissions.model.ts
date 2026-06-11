export type PermissionAction =
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

export type PermissionFlag =
  | 'can_view'
  | 'can_insert'
  | 'can_edit'
  | 'can_delete'
  | 'can_submit'
  | 'can_approve'
  | 'can_reject'
  | 'can_reopen'
  | 'can_cancel'
  | 'can_assign'
  | 'can_export'
  | 'can_print'
  | 'can_post'
  | 'can_archive';

export interface EffectivePermissionRole {
  id?: number | string;
  code: string;
  name: string;
}

export interface EffectivePagePermission {
  page: string;
  can_view?: boolean;
  can_insert?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_submit?: boolean;
  can_approve?: boolean;
  can_reject?: boolean;
  can_reopen?: boolean;
  can_cancel?: boolean;
  can_assign?: boolean;
  can_export?: boolean;
  can_print?: boolean;
  can_post?: boolean;
  can_archive?: boolean;
}

export interface EffectiveFieldPermission {
  page: string;
  field: string;
  visible?: boolean;
  editable?: boolean;
  disabled?: boolean;
  required?: boolean;
  masked?: boolean;
}

export interface EffectiveDataAccessRule {
  module?: string;
  page?: string;
  rule_key: string;
  operator: string;
  rule_value: unknown;
  effect: string;
  priority?: number;
}

export interface EffectivePermissionsResponse {
  application: string;
  roles: EffectivePermissionRole[];
  pages: EffectivePagePermission[];
  fields: EffectiveFieldPermission[];
  data_access_rules: EffectiveDataAccessRule[];
}
