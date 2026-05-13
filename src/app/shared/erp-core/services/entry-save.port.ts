import { Injectable, InjectionToken } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface EntrySaveRequest {
  scope: string;
  headerData: Record<string, unknown>;
  lineRows?: Record<string, unknown>[];
  meta?: Record<string, unknown>;
}

export interface EntrySaveResult {
  saved: boolean;
  modifiedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface EntrySavePort {
  save(request: EntrySaveRequest): Observable<EntrySaveResult>;
}

export const ENTRY_SAVE_PORT = new InjectionToken<EntrySavePort>('ENTRY_SAVE_PORT');

@Injectable({
  providedIn: 'root'
})
export class NoopEntrySavePort implements EntrySavePort {
  save(request: EntrySaveRequest): Observable<EntrySaveResult> {
    void request;
    return of({
      saved: true,
      modifiedAt: new Date().toISOString()
    });
  }
}
