import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PopupConfig } from '../models/popup-config.model';

@Injectable({
  providedIn: 'root'
})
export class PopupStackService {
  private readonly stackSubject = new BehaviorSubject<PopupConfig[]>([]);

  readonly stack$ = this.stackSubject.asObservable();

  open(config: PopupConfig): void {
    const currentStack = this.stackSubject.value;
    const nextStack = config.allowNested ? [...currentStack, config] : [config];

    this.stackSubject.next(nextStack);
  }

  close(id?: string): void {
    if (!id) {
      this.closeTop();
      return;
    }

    this.stackSubject.next(this.stackSubject.value.filter((popup) => popup.id !== id));
  }

  closeTop(): void {
    this.stackSubject.next(this.stackSubject.value.slice(0, -1));
  }

  closeAll(): void {
    this.stackSubject.next([]);
  }
}
