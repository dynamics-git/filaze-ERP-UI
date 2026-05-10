import { EventEmitter } from "@angular/core";
import { HeaderDataConfig } from "../../../../../core/models/shared/header-data.config";

// export interface DrawerChild {
//   headerConfig?: HeaderDataConfig;
//   onSave?(): any;
//   onLoad?(): any;
// }


export interface DrawerChild {
  headerConfig?: any;
  onSave?(): any;

  changeEvent?: EventEmitter<any>;
  leaveEvent?: EventEmitter<any>;
}
