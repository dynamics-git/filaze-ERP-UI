export interface MenuItem {
  id: string;
  label: string;
  module: string;
  route?: string;
  icon?: string;
  group?: string;
  permissionKey?: string;
  children?: MenuItem[];
}
