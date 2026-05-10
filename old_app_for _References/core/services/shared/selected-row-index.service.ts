import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectedRowIndexService {
  private selectedRowIndexSource = new BehaviorSubject<number>(0);
  selectedRowIndex$ = this.selectedRowIndexSource.asObservable();

  setSelectedRowIndex(index: number) {
    this.selectedRowIndexSource.next(index);
  }

  clearSelectedRowIndex() {
    this.selectedRowIndexSource.next(0);
  }

  getSelectedRowIndex(): number {
    return this.selectedRowIndexSource.value;
  }
}