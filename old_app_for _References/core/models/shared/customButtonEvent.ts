import { CustomButton } from "./customButton";
import { SectionType } from "./eventDataModel";

export interface CustomButtonEvent {
    button: CustomButton;
    data?: any;
    section?: SectionType;
    headerData?: any;
    lineData?: any[];
    linkItemType?: string;
  }