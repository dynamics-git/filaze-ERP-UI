import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ErpCommandConfig } from '../models/command-config.model';

export interface ErpAction {
  actionKey: string;
  payload?: unknown;
}

export interface ErpPageContext {
  title: string;
  module: string;
  company: string;
  viewSuffix: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActionDispatcherService {
  private readonly actionSubject = new Subject<ErpAction>();
  private readonly pageCommandsSubject = new BehaviorSubject<ErpCommandConfig[]>([]);
  private readonly pageContextSubject = new BehaviorSubject<Partial<ErpPageContext> | null>(null);

  readonly action$ = this.actionSubject.asObservable();
  readonly pageCommands$ = this.pageCommandsSubject.asObservable();
  readonly pageContext$ = this.pageContextSubject.asObservable();

  dispatch(actionKey: string, payload?: unknown): void {
    this.actionSubject.next({ actionKey, payload });
  }

  setPageCommands(commands: ErpCommandConfig[]): void {
    this.pageCommandsSubject.next(commands);
  }

  clearPageCommands(): void {
    this.pageCommandsSubject.next([]);
  }

  setPageContext(context: Partial<ErpPageContext>): void {
    this.pageContextSubject.next(context);
  }

  clearPageContext(): void {
    this.pageContextSubject.next(null);
  }
}
