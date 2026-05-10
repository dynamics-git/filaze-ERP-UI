import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ErpAction {
  actionKey: string;
  payload?: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class ActionDispatcherService {
  private readonly actionSubject = new Subject<ErpAction>();

  readonly action$ = this.actionSubject.asObservable();

  dispatch(actionKey: string, payload?: unknown): void {
    this.actionSubject.next({ actionKey, payload });
  }
}
