import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { fromEvent, merge, Subscription, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class IdleSessionService implements OnDestroy {
  private activitySubscription?: Subscription;
  private timeoutSubscription?: Subscription;

  constructor(
    private readonly zone: NgZone,
    private readonly sessionService: SessionService
  ) {}

  start(): void {
    this.stop();

    this.zone.runOutsideAngular(() => {
      this.activitySubscription = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'click'),
        fromEvent(document, 'scroll'),
        fromEvent(document, 'touchstart')
      ).subscribe(() => this.resetTimer());
    });

    this.resetTimer();
  }

  restart(): void {
    this.start();
  }

  stop(): void {
    this.activitySubscription?.unsubscribe();
    this.timeoutSubscription?.unsubscribe();
  }

  resetTimer(): void {
    this.timeoutSubscription?.unsubscribe();

    const timeoutMinutes = environment.sessionTimeout || 30;
    this.timeoutSubscription = timer(timeoutMinutes * 60 * 1000).subscribe(() => {
      this.zone.run(() => {
        this.sessionService.prepareIdleExpiry();
        this.sessionService.logoutWithIdleMessage();
      });
    });
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
