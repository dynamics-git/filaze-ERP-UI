import { ChildMenuItem } from './menuItem';

export interface MenuGroup {
  title: string;
  icon: string;
  children: ChildMenuItem[];
}
