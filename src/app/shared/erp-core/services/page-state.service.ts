import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ErpPageConfig } from '../models/page-config.model';

@Injectable({
  providedIn: 'root'
})
export class PageStateService {
  private readonly pageConfigSubject = new BehaviorSubject<ErpPageConfig | null>(null);
  private readonly selectedRecordSubject = new BehaviorSubject<unknown | null>(null);

  readonly pageConfig$ = this.pageConfigSubject.asObservable();
  readonly selectedRecord$ = this.selectedRecordSubject.asObservable();

  setPageConfig(config: ErpPageConfig): void {
    this.pageConfigSubject.next(config);
  }

  clearPageConfig(): void {
    this.pageConfigSubject.next(null);
  }

  setSelectedRecord(record: unknown): void {
    this.selectedRecordSubject.next(record);
  }

  clearSelectedRecord(): void {
    this.selectedRecordSubject.next(null);
  }
}
