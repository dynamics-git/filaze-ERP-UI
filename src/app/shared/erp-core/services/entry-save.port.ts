import { Injectable, InjectionToken } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ErpEntrySaveRequest {
  scope: string;
  headerData: Record<string, unknown>;
  lineRows?: Record<string, unknown>[];
  meta?: Record<string, unknown>;
}

export interface ErpEntrySaveResult {
  saved: boolean;
  modifiedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface ErpEntrySavePort {
  save(request: ErpEntrySaveRequest): Observable<ErpEntrySaveResult>;
}

export const ERP_ENTRY_SAVE_PORT = new InjectionToken<ErpEntrySavePort>('ERP_ENTRY_SAVE_PORT');

@Injectable({
  providedIn: 'root'
})
export class NoopEntrySavePort implements ErpEntrySavePort {
  save(request: ErpEntrySaveRequest): Observable<ErpEntrySaveResult> {
    void request;
    return of({
      saved: true,
      modifiedAt: new Date().toISOString()
    });
  }
}
