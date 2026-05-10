import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectedItemService {
  private selectedLinesSource = new BehaviorSubject<any[]>([]);
  selectedLines$ = this.selectedLinesSource.asObservable();

  setSelectedLines(lines: any[]) {
    this.selectedLinesSource.next(lines);
  }

  clearSelectedLines() {
    this.selectedLinesSource.next([]);
  }


  private selectedLinesSourceForSubPopup = new BehaviorSubject<any[]>([]);
  selectedLinesForSubPopup$ = this.selectedLinesSourceForSubPopup.asObservable();

  setSelectedLinesForSubPopup(lines: any[]) {
    this.selectedLinesSourceForSubPopup.next(lines);
  }

  clearSelectedLinesForSubPopup() {
    this.selectedLinesSourceForSubPopup.next([]);
  }

  public popupUncheckedLineData$ = new Subject<boolean>();


  private subPopupFKProp = new BehaviorSubject<any[]>([]);
  subPopupFKPropData$ = this.subPopupFKProp.asObservable();

  setSubPopupFKPropLines(lines: any[]) {
    this.subPopupFKProp.next(lines);
  }

  clearSubPopupFKPropLines() {
    this.subPopupFKProp.next([]);
  }


  popupData:any;

}
