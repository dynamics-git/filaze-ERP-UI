// // import { Injectable, NgZone } from '@angular/core';
// // import { fromEvent, merge, Subscription, timer } from 'rxjs';
// // import { SessionService } from './session.service';
// // import { environment } from '../../../environments/environment.development';

// // @Injectable({ providedIn: 'root' })
// // export class IdleSessionService {
// //     private idleSub?: Subscription;
// //     private timeoutMs = environment.sessionTimeout * 60 * 1000; // dynamic

// //     constructor(
// //         private ngZone: NgZone,
// //         private sessionService: SessionService
// //     ) { }

// //     start(): void {
// //         this.stop();

// //         this.ngZone.runOutsideAngular(() => {
// //             const activity$ = merge(
// //                 fromEvent(document, 'mousemove'),
// //                 fromEvent(document, 'mousedown'),
// //                 fromEvent(document, 'keydown'),
// //                 fromEvent(document, 'scroll'),
// //                 fromEvent(window, 'focus')
// //             );

// //             this.idleSub = activity$.subscribe(() => this.resetTimer());
// //         });

// //         this.resetTimer();
// //     }

// //     stop(): void {
// //         this.idleSub?.unsubscribe();
// //         this.idleSub = undefined;
// //     }

// //     private resetTimer(): void {
// //         this.stopTimer();
// //         this.startTimer();
// //     }

// //     private timerSub?: Subscription;

// //     private startTimer(): void {
// //         this.timerSub = timer(this.timeoutMs).subscribe(() => {
// //             this.ngZone.run(() => {
// //                 this.sessionService.logoutWithIdleMessage();
// //             });
// //         });

// //     }

// //     private stopTimer(): void {
// //         this.timerSub?.unsubscribe();
// //         this.timerSub = undefined;

// //         this.stopTimer();   // ← ADD THIS LINE
// //     }
// // }



// // import { Injectable, NgZone } from '@angular/core';
// // import { fromEvent, merge, Subscription, timer } from 'rxjs';
// // import { SessionService } from './session.service';
// // import { environment } from '../../../environments/environment.development';

// // @Injectable({ providedIn: 'root' })
// // export class IdleSessionService {

// //   private activitySub?: Subscription;
// //   private timerSub?: Subscription;

// //   private readonly timeoutMs = environment.sessionTimeout * 60 * 1000;

// //   constructor(
// //     private ngZone: NgZone,
// //     private sessionService: SessionService
// //   ) {}

// //   start(): void {
// //     this.stop(); // clean start

// //     this.ngZone.runOutsideAngular(() => {
// //       const activity$ = merge(
// //         fromEvent(document, 'mousemove'),
// //         fromEvent(document, 'mousedown'),
// //         fromEvent(document, 'keydown'),
// //         fromEvent(document, 'scroll'),
// //         fromEvent(window, 'focus')
// //       );

// //       this.activitySub = activity$.subscribe(() => {
// //         this.ngZone.run(() => this.resetTimer());
// //       });
// //     });

// //     this.resetTimer();
// //   }

// //   stop(): void {
// //     this.activitySub?.unsubscribe();
// //     this.activitySub = undefined;
// //     this.stopTimer();
// //   }

// //   private resetTimer(): void {
// //     this.stopTimer();
// //     this.startTimer();
// //   }

// //   private startTimer(): void {
// //     this.timerSub = timer(this.timeoutMs).subscribe(() => {
// //       // 🔒 ONE-TIME idle logout
// //       this.stop(); // ⬅️ IMPORTANT: stop everything first

// //       this.ngZone.run(() => {
// //         this.sessionService.logoutWithIdleMessage();
// //       });
// //     });
// //   }

// //   private stopTimer(): void {
// //     this.timerSub?.unsubscribe();
// //     this.timerSub = undefined;
// //   }
// // }



// import { Injectable, NgZone } from '@angular/core';
// import { fromEvent, merge, Subscription, timer } from 'rxjs';
// import { SessionService } from './session.service';
// import { environment } from '../../../environments/environment.development';

// @Injectable({ providedIn: 'root' })
// export class IdleSessionService {

//   private activitySub?: Subscription;
//   private timerSub?: Subscription;

//   // environment.sessionTimeout is in MINUTES
//   private readonly timeoutMs = environment.sessionTimeout * 60 * 1000;

//   constructor(
//     private ngZone: NgZone,
//     private sessionService: SessionService
//   ) {}

//   start(): void {
//     this.stop(); // clean start

//     this.ngZone.runOutsideAngular(() => {
//       const activity$ = merge(
//         fromEvent(document, 'mousemove'),
//         fromEvent(document, 'mousedown'),
//         fromEvent(document, 'keydown'),
//         fromEvent(document, 'scroll'),
//         fromEvent(window, 'focus')
//       );

//       this.activitySub = activity$.subscribe(() => {
//         this.ngZone.run(() => this.resetTimer());
//       });
//     });

//     this.resetTimer();
//   }

//   stop(): void {
//     this.activitySub?.unsubscribe();
//     this.activitySub = undefined;
//     this.stopTimer();
//   }

//   private resetTimer(): void {
//     this.stopTimer();
//     this.startTimer();
//   }

//   private startTimer(): void {
//     this.timerSub = timer(this.timeoutMs).subscribe(() => {
//       // ✅ ONE-TIME idle logout
//       this.stop(); // stop everything first

//       this.ngZone.run(() => {
//         this.sessionService.logoutWithIdleMessage();
//       });
//     });
//   }

//   private stopTimer(): void {
//     this.timerSub?.unsubscribe();
//     this.timerSub = undefined;
//   }
// }


// import { Injectable, NgZone } from '@angular/core';
// import { fromEvent, merge, Subscription, timer } from 'rxjs';
// import { SessionService } from './session.service';
// import { environment } from '../../../environments/environment';

// @Injectable({ providedIn: 'root' })
// export class IdleSessionService {
//   private activitySub?: Subscription;
//   private timerSub?: Subscription;
//   private isStarted = false;

//   // environment.sessionTimeout is in minutes
//   private readonly timeoutMs = environment.sessionTimeout * 60 * 1000;

//   constructor(
//     private ngZone: NgZone,
//     private sessionService: SessionService
//   ) {}

//   start(): void {
//     if (this.isStarted) {
//       this.stop();
//     }

//     if (!this.sessionService.isSessionValid()) {
//       return;
//     }

//     this.isStarted = true;

//     this.ngZone.runOutsideAngular(() => {
//       const activity$ = merge(
//         fromEvent(document, 'mousemove'),
//         fromEvent(document, 'mousedown'),
//         fromEvent(document, 'keydown'),
//         fromEvent(document, 'scroll'),
//         fromEvent(document, 'touchstart'),
//         fromEvent(window, 'focus')
//       );

//       this.activitySub = activity$.subscribe(() => {
//         if (!this.sessionService.isSessionValid()) {
//           return;
//         }

//         this.ngZone.run(() => this.resetTimer());
//       });
//     });

//     this.resetTimer();
//   }

//   stop(): void {
//     this.activitySub?.unsubscribe();
//     this.activitySub = undefined;

//     this.timerSub?.unsubscribe();
//     this.timerSub = undefined;

//     this.isStarted = false;
//   }

//   restart(): void {
//     this.stop();
//     this.start();
//   }

//   private resetTimer(): void {
//     if (!this.isStarted || !this.sessionService.isSessionValid()) {
//       return;
//     }

//     this.stopTimer();
//     this.startTimer();
//   }

//   private startTimer(): void {
//     this.timerSub = timer(this.timeoutMs).subscribe(() => {
//       if (!this.sessionService.isSessionValid()) {
//         this.stop();
//         return;
//       }

//       this.stop();

//       this.ngZone.run(() => {
//         this.sessionService.logoutWithIdleMessage();
//       });
//     });
//   }

//   private stopTimer(): void {
//     this.timerSub?.unsubscribe();
//     this.timerSub = undefined;
//   }
// }


//login behavier fixed 

import { Injectable, NgZone } from '@angular/core';
import { fromEvent, interval, merge, Subscription } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SessionService } from './session.service';
import { environment } from '../../../environments/environment';
import { IdleLogoutModalComponent } from '../../shared/components/idle-logout-modal/idle-logout-modal.component';

@Injectable({ providedIn: 'root' })
export class IdleSessionService {
  private activitySub?: Subscription;
  private heartbeatSub?: Subscription;
  private modalRef?: NgbModalRef;

  private isStarted = false;
  private expiredHandled = false;

  private lastActivityAt = 0;
  private expiresAt = 0;

  // private readonly timeoutMs = environment.sessionTimeout * 60 * 1000;
  // private readonly warningMs = 2 * 60 * 1000;
  private readonly timeoutMs = environment.sessionTimeout * 60 * 1000;
  private readonly warningMs = Math.min(60 * 1000, Math.max(15 * 1000, this.timeoutMs - 30 * 1000));

  constructor(
    private ngZone: NgZone,
    private sessionService: SessionService,
    private modalService: NgbModal
  ) { }

  start(): void {
    this.stopAll(true);

    if (!this.sessionService.isSessionValid()) {
      return;
    }

    this.isStarted = true;
    this.expiredHandled = false;
    this.markActivity();

    this.ngZone.runOutsideAngular(() => {
      const activity$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'mousedown'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'scroll'),
        fromEvent(document, 'touchstart'),
        fromEvent(window, 'focus'),
        fromEvent(document, 'visibilitychange')
      );

      this.activitySub = activity$.subscribe(() => {
        this.ngZone.run(() => this.handleActivityEvent());
      });

      this.heartbeatSub = interval(1000).subscribe(() => {
        this.ngZone.run(() => this.evaluateState());
      });
    });

    this.evaluateState();
  }

  stop(): void {
    this.stopAll(true);
  }

  restart(): void {
    this.stopAll(true);
    this.start();
  }

  private handleActivityEvent(): void {
    if (!this.isStarted) {
      return;
    }

    const now = Date.now();

    if (now >= this.expiresAt) {
      this.handleExpiry();
      return;
    }

    if (document.visibilityState === 'hidden') {
      return;
    }

    if (this.expiredHandled) {
      return;
    }

    if (!this.sessionService.isSessionValid()) {
      this.stopAll(true);
      return;
    }

    // While warning is open, ignore passive movement.
    // Only modal buttons should decide continue/sign out.
    if (this.modalRef && this.modalRef.componentInstance?.mode === 'warning') {
      return;
    }

    this.markActivity();
  }

  private markActivity(): void {
    const now = Date.now();
    this.lastActivityAt = now;
    this.expiresAt = now + this.timeoutMs;
  }

  private evaluateState(): void {
    if (!this.isStarted) {
      return;
    }

    const now = Date.now();

    if (now >= this.expiresAt) {
      this.handleExpiry();
      return;
    }

    // If session is invalid before expiry for some other reason, stop everything.
    // But after idle expiry has already been handled, keep the expired modal alive.
    if (!this.sessionService.isSessionValid()) {
      if (!this.expiredHandled) {
        this.stopAll(true);
      }
      return;
    }

    const remainingMs = this.expiresAt - now;

    if (remainingMs <= this.warningMs) {
      this.openOrUpdateWarning(Math.ceil(remainingMs / 1000));
    } else {
      this.closeModalSilently();
    }
  }

  private openOrUpdateWarning(remainingSeconds: number): void {
    if (this.expiredHandled) {
      return;
    }

    if (!this.modalRef) {
      this.modalRef = this.modalService.open(IdleLogoutModalComponent, {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        windowClass: 'session-warning-modal'
      });

      this.modalRef.componentInstance.mode = 'warning';
      this.modalRef.componentInstance.remainingSeconds = remainingSeconds;

      this.modalRef.result.then(
        (result) => {
          this.modalRef = undefined;

          if (result === 'continue') {
            if (Date.now() >= this.expiresAt || this.expiredHandled) {
              this.handleExpiry();
              return;
            }

            if (!this.sessionService.isSessionValid()) {
              return;
            }

            this.markActivity();
            return;
          }

          if (result === 'signout') {
            this.stopAll(true);
            this.sessionService.logout('manual');
            return;
          }

          if (result === 'signin') {
            this.stopAll(false);
            this.sessionService.finishIdleExpiryRedirect();
          }
        },
        () => {
          this.modalRef = undefined;
        }
      );
    } else {
      this.modalRef.componentInstance.mode = 'warning';
      this.modalRef.componentInstance.remainingSeconds = remainingSeconds;
    }
  }

  private handleExpiry(): void {
    if (this.expiredHandled) {
      return;
    }

    this.expiredHandled = true;

    // Kill session immediately.
    this.sessionService.prepareIdleExpiry();

    // Stop watchers, but DO NOT close the modal.
    this.unsubscribeWatchers();
    this.isStarted = false;

    if (!this.modalRef) {
      this.modalRef = this.modalService.open(IdleLogoutModalComponent, {
        backdrop: 'static',
        keyboard: false,
        centered: true,
        windowClass: 'session-warning-modal'
      });

      this.modalRef.result.then(
        (result) => {
          this.modalRef = undefined;

          if (result === 'signin') {
            this.stopAll(false);
            this.sessionService.finishIdleExpiryRedirect();
          }
        },
        () => {
          this.modalRef = undefined;
        }
      );
    }

    this.modalRef.componentInstance.mode = 'expired';
    this.modalRef.componentInstance.remainingSeconds = 0;
  }

  private unsubscribeWatchers(): void {
    this.activitySub?.unsubscribe();
    this.activitySub = undefined;

    this.heartbeatSub?.unsubscribe();
    this.heartbeatSub = undefined;
  }

  private stopAll(closeModal: boolean): void {
    this.unsubscribeWatchers();

    if (closeModal) {
      this.closeModalSilently();
    }

    this.isStarted = false;
    this.expiredHandled = false;
    this.lastActivityAt = 0;
    this.expiresAt = 0;
  }

  private closeModalSilently(): void {
    if (!this.modalRef) {
      return;
    }

    const currentRef = this.modalRef;
    this.modalRef = undefined;

    try {
      currentRef.dismiss('reset');
    } catch { }
  }
}