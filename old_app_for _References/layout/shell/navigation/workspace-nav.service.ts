import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceNavService {
  private readonly storageKey = 'procure360-active-module';
  private readonly activeModuleKeySubject = new BehaviorSubject<string>(
    localStorage.getItem(this.storageKey) || ''
  );

  readonly activeModuleKey$ = this.activeModuleKeySubject.asObservable();

  get activeModuleKey(): string {
    return this.activeModuleKeySubject.value;
  }

  setActiveModule(key: string): void {
    this.activeModuleKeySubject.next(key);
    localStorage.setItem(this.storageKey, key);
  }

  loadSavedActiveModule(): string {
    const saved = localStorage.getItem(this.storageKey) || '';
    if (saved && saved !== this.activeModuleKeySubject.value) {
      this.activeModuleKeySubject.next(saved);
    }

    return saved;
  }
}
