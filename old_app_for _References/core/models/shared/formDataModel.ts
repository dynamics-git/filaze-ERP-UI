import { SectionType } from "./eventDataModel";

// export interface FormDataModel {
//   data: any;
//   valid: boolean;
//   section: SectionType;
//   linkItemType?: string;
// }

export interface FormDataModel {
  control?: string;
  data: any;
  rowIndex?: number;
  eventEmit?: boolean;
  section?: SectionType;
  dropdownData?: any;
  dropdownItems?: any[];
  activeData?: any;
  linesData?: any[];
  linkItemType?: string;
  headerData?: any;
  valid?: boolean;
}


