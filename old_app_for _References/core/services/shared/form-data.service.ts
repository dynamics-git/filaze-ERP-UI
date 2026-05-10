import { Injectable } from '@angular/core';

import { BehaviorSubject, Subject } from 'rxjs';

import { EventDataModel } from '../../models/shared/eventDataModel';

@Injectable({
  providedIn: 'root'
})
export class FormDataService {

  public dropDownApisPosted: string[] = [];
  private dropDownApiDataCache: any[] = [];

  public ResetDropDownApiDataCache() {
    this.dropDownApisPosted = [];
    this.dropDownApiDataCache = [];
  }

  public SetDropDownApiDataCache(value: any) {
    this.dropDownApiDataCache.push(value);
  }

  public GetDropDownApiDataCache(apiUrl: string): any {
    return this.dropDownApiDataCache.filter(d => d.url === apiUrl)[0];
  }

  public dropdownApiCallDone$ = new Subject<void>();

  public enableLineControls$ = new Subject<boolean>();

  public updateControlData$ = new Subject<EventDataModel>();
  public updateControlsListData$ = new Subject<EventDataModel[]>();

  public updateLineControlData$ = new Subject<EventDataModel>();
  public updateLineControlDataForSubPopup$ = new Subject<EventDataModel>();
  public updateLineControlsListData$ = new Subject<EventDataModel[]>();

  public disableControl$ = new Subject<string>();
  public disableControlsList$ = new Subject<string[]>();

  public disableLineControl$ = new Subject<{ label: string, rowIndex: number, clearValue?: boolean }>();
  public disableLineControlsList$ = new Subject<{ label: string, rowIndex: number, clearValue?: boolean }[]>();

  public readonlyControl$ = new Subject<string>();
  public readonlyControlsList$ = new Subject<string[]>();

  public readonlyLineControl$ = new Subject<{ label: string, rowIndex: number }>();
  public readonlyLineControlslist$ = new Subject<{ label: string, rowIndex: number }[]>();

  public enableControl$ = new Subject<string>();
  public enableControlsList$ = new Subject<string[]>();

  public enableLineControl$ = new Subject<{ label: string, rowIndex: number }>();
  public enableLineControlsList$ = new Subject<{ label: string, rowIndex: number }[]>();

  public showControl$ = new Subject<string>();
  public showControlsList$ = new Subject<string[]>();
  public showLineControl$ = new Subject<{ label: string, rowIndex: number }>();

  public hideControl$ = new Subject<string>();
  public hideControlsList$ = new Subject<string[]>();
  public hideLineControlsList$ = new Subject<{ label: string, rowIndex: number }[]>();


  public disableLineDelete$ = new Subject<number>();
  public disableLinesDelete$ = new Subject<number[]>();
  public disableAllLinesDelete$ = new Subject<void>();

  public setControlValidators$ = new Subject<{ lablel: string, required: boolean }>();
  public setControlListValidators$ = new Subject<{ lablel: string, required: boolean }[]>();

  public setLineControlValidators$ = new Subject<{ label: string, rowIndex: number, required: boolean }>();
  public setLineControlListValidators$ = new Subject<{ label: string, rowIndex: number, required: boolean }[]>();


  public disableDrawer$ = new BehaviorSubject<{ isDisabled: boolean; rowIndex: number } | null>(null);

  constructor() { }
}
