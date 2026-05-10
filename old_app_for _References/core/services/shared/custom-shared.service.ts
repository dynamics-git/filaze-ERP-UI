import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CustomSharedService {
    popupCloseRequest$ = new Subject<void>();
    closeApproval$ = new Subject<boolean>();

    requestPopupClose() {
        this.popupCloseRequest$.next(); // do NOT recreate subject
    }

    sendCloseApproval(value: boolean) {
        this.closeApproval$.next(value);
    }





}