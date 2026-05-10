// import { Component } from '@angular/core';
// import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

// @Component({
//   template: `
//     <div class="modal-header">
//       <h5 class="modal-title">Session Expired</h5>
//     </div>
//     <div class="modal-body">
//       <p>Your session has expired due to inactivity.</p>
//     </div>
//     <div class="modal-footer">
//       <button class="btn btn-primary" (click)="ok()">OK</button>
//     </div>
//   `
// })
// export class IdleLogoutModalComponent {
//   constructor(public activeModal: NgbActiveModal) {}
//   ok() {
//     this.activeModal.close();
//   }
// }



import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: false,
  selector: 'app-idle-logout-modal',
  templateUrl: './idle-logout-modal.component.html',
  styleUrls: ['./idle-logout-modal.component.scss']
})
export class IdleLogoutModalComponent {
  @Input() mode: 'warning' | 'expired' = 'warning';
  @Input() remainingSeconds = 120;

  constructor(public activeModal: NgbActiveModal) {}

  continueSession(): void {
    if (this.mode !== 'warning') {
      return;
    }
    this.activeModal.close('continue');
  }

  signOutNow(): void {
    this.activeModal.close('signout');
  }

  signInAgain(): void {
    this.activeModal.close('signin');
  }

  get mm(): string {
    const mins = Math.floor(this.remainingSeconds / 60);
    return mins.toString().padStart(2, '0');
  }

  get ss(): string {
    const secs = Math.max(this.remainingSeconds % 60, 0);
    return secs.toString().padStart(2, '0');
  }
}