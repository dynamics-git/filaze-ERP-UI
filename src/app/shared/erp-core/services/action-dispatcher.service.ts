import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ErpCommandConfig } from '../models/command-config.model';

export interface ErpAction {
  actionKey: string;
  payload?: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class ActionDispatcherService {
  private readonly actionSubject = new Subject<ErpAction>();
  private readonly pageCommandsSubject = new BehaviorSubject<ErpCommandConfig[]>([]);

  readonly action$ = this.actionSubject.asObservable();
  readonly pageCommands$ = this.pageCommandsSubject.asObservable();

  dispatch(actionKey: string, payload?: unknown): void {
    this.actionSubject.next({ actionKey, payload });
  }

  setPageCommands(commands: ErpCommandConfig[]): void {
    this.pageCommandsSubject.next(commands);
  }

  clearPageCommands(): void {
    this.pageCommandsSubject.next([]);
  }
}
