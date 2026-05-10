import { FormGroup } from "@angular/forms";

export interface EventDataModel {
  control: string;
  data: any;
  rowIndex?: number;
  eventEmit?: boolean;
  section?: SectionType;
  dropdownData?: any;
  dropdownItems?: any[];
  activeData?: any;
  linesData?: any[];
  linkItemType?: string;
  formGroup?: FormGroup;
  headerData?: any;
}

export enum SectionType {
  Header,
  Line,
  Calculation,
  List
}