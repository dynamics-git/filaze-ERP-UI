import { ItemConfig } from "./item.config";

export interface TableHeader {
  name: string;
  prop: string;
  isPrimaryLink?: boolean;
  isObject?: boolean;
  displayFormat?: string;
  linkItemConfigs?: LinkItemConfig[];
  urlProp?: string;
  isUserAuditField?: string;
  isBoolean?: boolean;
  isDate?: boolean;
}

export interface LinkItemConfig {
  property?: string;
  value?: string;
  itemProp?: string;
  itemConfig?: ItemConfig;
  linkItemType?: string;
}