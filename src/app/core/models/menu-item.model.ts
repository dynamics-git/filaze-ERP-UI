export interface MenuItem {
  pageId: string;
  label: string;
  module: string;
  route?: string;
  openMode?: 'popup' | 'route';
  icon?: string;
  group?: string;
  permissionKey?: string;
  children?: MenuItem[];
}

export interface MenuSearchItem extends MenuItem {
  moduleLabel: string;
}
