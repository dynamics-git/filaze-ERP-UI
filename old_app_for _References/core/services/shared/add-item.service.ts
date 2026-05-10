import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AddItemService {

    public enableOrDisableAllControls$ = new Subject<boolean>();
    public disableAllControlsExceptSome$ = new Subject<string[]>();
    public disableAllControlsExceptSomeForSubPopup$ = new Subject<string[]>();
    public callPatchApi$ = new Subject<number>();
    public patchLineData$ = new Subject<{ rowIndex: number, data: any, disableControls: boolean }>();
    public showLoader$ = new BehaviorSubject<boolean>(false);
    public updateLineControlData$ = new Subject<{ control: string, data: any, update: boolean }>();
    public updateLineMultipleControlsData$ = new Subject<{ data: any, rowIndex: number, emitEvent: boolean }>();
    public disableLineControls$ = new Subject<boolean>();
    public closePopup$ = new Subject<boolean>();
    public refreshData$ = new Subject<boolean>();
    public refreshDataById$ = new Subject<boolean>();
    public reloadHeaderById$ = new Subject<number | string>();
    public popupRefreshLineData$ = new Subject<boolean>();
    public subPopupRefreshLineData$ = new Subject<boolean>();
    public refreshDrawerSubpopupData$ = new Subject<boolean>();
    public showDropdownAPICallLoader$ = new Subject<boolean>();
    public isDisableAddButtonLine$ = new Subject<boolean>();
    public isDisableDeleteButtonLine$ = new Subject<boolean>();
    public exceededLines$ = new BehaviorSubject<(string | number)[]>([]);
    public showOnParallelButton$ = new Subject<{ show: boolean, rowIndex: number }>();
    public showOnSequentialButton$ = new Subject<{ show: boolean, rowIndex: number }>();
    public showCompareButton$ = new Subject<boolean>;
    public addHeaderButtons$ = new Subject<any>;
    public addLineButtons$ = new Subject<any>;
    public isDisableDimensionButton$ = new Subject<boolean>;
    public isDisableDimensionInPopup$ = new Subject<boolean>;
    public suspendHeaderAutoSave$ = new Subject<boolean>();
    public childModalDepth$ = new BehaviorSubject<number>(0);

    /**
     * Queues a revert for a line row. The revert fires after the current in-flight
     * PATCH for that row completes. Use this in leaveEvent after a validation alert.
     */
    public pendingRevertLine$ = new Subject<{ rowIndex: number; data: any }>();

    revertLine(rowIndex: number, originalData: any): void {
      this.pendingRevertLine$.next({ rowIndex, data: originalData });
    }

    /**
     * Immediately patches the line form + lineData back to given values (UI only, NO API call).
     * Use this right after showing a validation warning so the field snaps back immediately
     * and further blur events don't re-trigger the same dialog.
     */
    public patchLineFormOnly$ = new Subject<{ rowIndex: number; data: any }>();
    public forceLeaveHeaderControl$ = new Subject<{ control: string; value: any; }>();
    public headerSaveResponse$ = new Subject<any>();
    public customButtonResponse$ = new BehaviorSubject<boolean>(false);
    public refreshDataDataTable$ = new Subject<boolean>;
    public getLineAttachment$ = new Subject<{ documentType: String, documentNo: String, recordLineNo: String }>();

    constructor() { }
}