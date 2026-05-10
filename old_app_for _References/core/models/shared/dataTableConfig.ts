import { CustomButton } from './customButton';
import { FactBoxConfig } from './fact-box.config';
import { FilterField } from './filter.model';
import { ItemConfig } from './item.config';
import { TableHeader } from './tableHeader';

export interface DataTableConfig {
  idProp?: string;
  title?: string;
  headers?: TableHeader[];
  headerApi?: string;
  headerApiFilterField?: string;
  headerApiOrderByField?: string;
  lineApi?: string;
  selctionType?: string; // 'single', 'multiple'
  pageName?: string;
  enableCache?: boolean;
  addItemConfig?: ItemConfig;
  addItemPageUrl?: string;
  buttons?: CustomButton[];
  topbuttons?: CustomButton[];
  showCreate?: boolean;
  showCopy?: boolean;
  showDelete?: boolean;
  showEdit?: boolean;
  filters?: CustomDataFilter[];
  filterByUserCompanyResCenter?: boolean;
  factBoxConfig?: FactBoxConfig;
  fileUrlProp?: string;
  fileDeleteApi?: string;
  removeUnicodeCharFields?: string[];
  showTableBackButton?:boolean;
  filterConfig?: FilterField[];
}

export interface CustomDataFilter {
  field?: string;
  operator?: string;
  value?: string;
}
