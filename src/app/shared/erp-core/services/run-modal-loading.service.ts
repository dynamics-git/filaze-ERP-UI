import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RunModalLoadingService {
  private readonly pendingCount = new BehaviorSubject<number>(0);

  begin(): void {
    this.pendingCount.next(this.pendingCount.value + 1);
  }

  end(): void {
    this.pendingCount.next(Math.max(0, this.pendingCount.value - 1));
  }

  get isLoading(): boolean {
    return this.pendingCount.value > 0;
  }
}
