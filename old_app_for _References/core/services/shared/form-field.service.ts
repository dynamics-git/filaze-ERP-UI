import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

import { UpdateDropdownData } from '../../models/shared/updateDropdownData';

// @Injectable({
//   providedIn: 'root'
// })
// export class FormFieldService {

//   private _updateDropdownItems$ = new Subject<UpdateDropdownData>();
//   public get updateDropdownItem$(): Subject<UpdateDropdownData> {
//     return this._updateDropdownItems$;
//   }

//   constructor() { }
// }


@Injectable({
  providedIn: 'root'
})
export class FormFieldService {

  private dropdownState: Record<string, any[]> = {};

  private _updateDropdownItems$ = new Subject<UpdateDropdownData>();
  public get updateDropdownItem$(): Subject<UpdateDropdownData> {
    return this._updateDropdownItems$;
  }

  updateDropdownItems(data: UpdateDropdownData) {

    // store last items
    this.dropdownState[data.label] = data.items;

    // broadcast normally
    this._updateDropdownItems$.next(data);
  }

  getDropdownItems(label: string): any[] | undefined {
    return this.dropdownState[label];
  }

  constructor() { }
}
