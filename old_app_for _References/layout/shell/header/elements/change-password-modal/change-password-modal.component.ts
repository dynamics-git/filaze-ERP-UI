import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SessionService } from '../../../../../core/services/session.service';
import { EncryptDecryptService } from '../../../../../core/services/shared/encrypt-decrypt.service';
import { RestService } from '../../../../../core/services/rest.service';


@Component({
  standalone: false,
  selector: 'app-change-password-modal',
  templateUrl: './change-password-modal.component.html'
})
export class ChangePasswordModalComponent implements OnInit {

  changePasswordForm!: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    public activeModal: NgbActiveModal,
    private toastr: ToastrService,
    private sessionService: SessionService,
    private encryptService: EncryptDecryptService,
    private restService: RestService) { }

  ngOnInit() {
    this.changePasswordForm = this.fb.group({
      oldPassword: new UntypedFormControl(null, [Validators.required], [this.validatePassword.bind(this)]),
      newPassword: new UntypedFormControl(null, [Validators.required]),
      confirmNewPassword: new UntypedFormControl(null, [Validators.required], [this.validateConfirmPassword.bind(this)]),
    });
  }

  get oldPassword() { return this.changePasswordForm.get('oldPassword'); }
  get newPassword() { return this.changePasswordForm.get('newPassword'); }
  get confirmNewPassword() { return this.changePasswordForm.get('confirmNewPassword'); }

  changePassword() {
    if (this.changePasswordForm.valid) {
      const url = '/portalUsers(' + this.sessionService.User.Id + ')';
      const patchData = {
        PasswordHash: this.encryptService.encrypt(this.newPassword!.value)
      };
      this.restService.patch(url, patchData, "*").subscribe((response: any) => {
        if (response) {
          this.sessionService.User = response;
          this.toastr.success('Password chagned successfully!');
          this.activeModal.dismiss();
        } else {
          this.toastr.error('Failed to change password!');
        }
      }, (error) => {
        this.toastr.error('Failed to change password!');
      });
    }
  }

  validatePassword(control: AbstractControl): Observable<ValidationErrors | null> {
    if (control.value && control.value.length > 3) {
      const decryptedPassword = this.encryptService.decrypt(this.sessionService.User.PasswordHash);
      if (decryptedPassword === control.value) {
        return of(null);
      } else {
        return of({
          invalidpassword: true
        });
      }

    } else {
      return of({
        invalidpassword: true
      });
    }
  }

  validateConfirmPassword(control: AbstractControl): Observable<ValidationErrors | null> {
    if (control.value) {
      if (control.value !== this.newPassword!.value) {
        return of({
          notmatch: true
        });
      }
    }
    return of(null);
  }
}
