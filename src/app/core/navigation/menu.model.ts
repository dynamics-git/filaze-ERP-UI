export type ErpMenuActionPermission = 'read' | 'insert' | 'modify' | 'post' | 'delete';

export type ErpMenuItem = {
  id: string;
  title: string;
  pageKey: string;
  route?: string;
  icon?: string;
  actionKey?: string;
  requiredPermission?: ErpMenuActionPermission;
  disabled?: boolean;
  hidden?: boolean;
};

export type ErpMenuGroup = {
  id: string;
  title: string;
  icon: string;
  children: ErpMenuItem[];
};

export type ErpMenuModule = {
  key: string;
  title: string;
  icon?: string;
  groups: ErpMenuGroup[];
};

export type ErpPermissionRecord = {
  ObjectName?: string;
  PageName?: string;
  RoleId?: string;
  ReadPermission?: boolean | string;
  InsertPermission?: boolean | string;
  ModifyPermission?: boolean | string;
  PostPermission?: boolean | string;
  DeletePermission?: boolean | string;
};
