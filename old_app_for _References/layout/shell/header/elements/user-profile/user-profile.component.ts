import { Component, ElementRef, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from "@angular/forms";
import { Validators } from "ngx-editor";
import { HeaderDataConfig } from "../../../../../core/models/shared/header-data.config";
import { USER_PROFILE_HEADER } from "./user-profile.config";
import { RestService } from '../../../../../core/services/rest.service';
import { Utility } from '../../../../../core/services/utility.service';
import { ChangePasswordModalComponent } from '../change-password-modal/change-password-modal.component';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SessionService } from '../../../../../core/services/session.service';
import { HttpClient } from '@angular/common/http';
import { FormDataService } from '../../../../../core/services/shared/form-data.service';
import { FormFieldService } from '../../../../../core/services/shared/form-field.service';
import { AddItemService } from '../../../../../core/services/shared/add-item.service';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ManageProfileImageComponent } from '../manage-profile-image/manage-profile-image.component';

@Component({
  standalone: false,
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],

})
export class UserProfileComponent {
  activeTab = 0;
  headerConfig: HeaderDataConfig = USER_PROFILE_HEADER;

  headerFormGroup!: FormGroup;

  changeEvent = new EventEmitter<any>();
  leaveEvent = new EventEmitter<any>();
  isProfileImageLoading = false;
  @Input() userData: any = {};
  portalUsers: any[] = [];
  approvalGroups: any[] = [];
  allResCenters!: any[];

  @ViewChild('profileImageInput') profileImageInput!: ElementRef<HTMLInputElement>;
  profileImageUrl: SafeUrl | string = '';
  allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  constructor(
    private restService: RestService,
    private utility: Utility,
    private modal: NgbModal,
    private sessionService: SessionService,
    private httpclient: HttpClient,
    public activeModal: NgbActiveModal,
    private formDataService: FormDataService,
    private formFielService: FormFieldService,
    private addItemService: AddItemService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.buildFormFromConfig();
    this.loadUserData();
  }

  private loadUserData() {

    if (!this.userData?.Id) return;

    const api = this.headerConfig.api;

    this.restService
      .get(`${api}(${this.userData.Id})`)
      .subscribe((res: any) => {

        if (!this.headerFormGroup) return;
        let formData = this.utility.copyObj(res);

        formData = this.utility.setHeaderControlsData(
          formData,
          this.headerConfig.controls!
        );
        this.headerFormGroup.patchValue(formData);
        this.headerFormGroup.markAsPristine();
        this.userData = res;
        this.loadProfileImage(this.userData);
        this.portalResCenter(this.userData);
        const delegateType = this.headerFormGroup.get('workflowDelegateType')?.value;
        if (delegateType) {
          this.SelectWorkflowDelegateType({ data: delegateType });
        }
      });
  }


  portalResCenter(data: any) {
    if (data.UserId) {
      let url = `/portalResponsibilityPermissions?$filter=UserId eq '${data.UserId}'`
      this.restService.get(url).subscribe((response: any) => {
        const result = response.value.filter((x: any) => (x.AccessAllCompany || x.CompanyId === this.sessionService.Company));
        if (result.length > 0) {
          if (result.filter((x: any) => x.AccessAllResCentre).length > 0) {
            this.getAllResCenters(data.DefaultResponsibilityCentre);
          } else {
            const items = result.map((x: any) => {
              return { id: x.PortalResponsibilityCentre, name: x.PortalResponsibilityCentre };
            });
            this.formFielService.updateDropdownItem$.next({ label: 'DefaultResponsibilityCentre', items: items, bindValue: "id", bindLabel: "name" });
            setTimeout(() => {
              this.formDataService.updateControlData$.next({ control: 'DefaultResponsibilityCentre', data: data.DefaultResponsibilityCentre });
            }, 100);
          }
        }
      });
    }
  }

  getAllResCenters(defaultResponsibilityCentre: string) {
    if (this.allResCenters) {
      const items = this.allResCenters.map((x: any) => {
        return { id: x.Code, name: x.Code };
      });
      this.formFielService.updateDropdownItem$.next({ label: 'DefaultResponsibilityCentre', items: items, bindValue: "id", bindLabel: "name" });
      setTimeout(() => {
        this.formDataService.updateControlData$.next({ control: 'DefaultResponsibilityCentre', data: defaultResponsibilityCentre });
      }, 100);
    } else {
      this.restService.get('/portalResponsibilityCentres').subscribe((response: any) => {
        this.allResCenters = response.value;
        const items = this.allResCenters.map((x: any) => {
          return { id: x.Code, name: x.Code };
        });
        this.formFielService.updateDropdownItem$.next({ label: 'DefaultResponsibilityCentre', items: items, bindValue: "id", bindLabel: "name" });
        setTimeout(() => {
          this.formDataService.updateControlData$.next({ control: 'DefaultResponsibilityCentre', data: defaultResponsibilityCentre });
        }, 100);
      });
    }
  }

  private buildFormFromConfig(): void {

    const group: any = {};

    (this.headerConfig.controls ?? []).forEach((row: any[]) => {

      row.forEach(control => {

        group[control.label] = new FormControl({
          value: this.userData?.[control.label] ?? control.initialValue ?? '',
          disabled: control.readonly
        });

      });

    });

    if (this.userData?.Id) {
      group['Id'] = new FormControl(this.userData.Id);
    }

    this.headerFormGroup = new FormGroup(group);
  }



  onSave() {
    if (!this.headerFormGroup) return null;
    const payload: any = {};
    Object.keys(this.headerFormGroup.controls).forEach(key => {
      const control = this.headerFormGroup.get(key);

      if (control?.dirty && control.value !== this.userData?.[key]) {
        payload[key] = control.value;
      }
    });
    return payload;
  }


  onChange(event: any) {
    if (event.control === 'workflowDelegateType') {
      this.SelectWorkflowDelegateType(event);
    }

    this.changeEvent.emit(event);
  }

  onLeave(event: any) {
    this.leaveEvent.emit(event);
  }

  changePassword() {
    const modalRef = this.modal.open(ChangePasswordModalComponent, { size: 'md' });
    this.closeDrawer();
  }

  logOut() {
    this.LogoutUser();
    localStorage.removeItem('app-user-details');
    localStorage.removeItem('app-comapny');
    localStorage.removeItem('app-comapny-name');
    localStorage.removeItem('app-responsibility-center');
    localStorage.removeItem('app-responsibility-centers');
    localStorage.removeItem('app-super-admin');
    localStorage.removeItem('app-show-res-center-selection');
    localStorage.removeItem('app-show-all-res-centers');
    localStorage.removeItem('app-default-responsibility-center');
    localStorage.removeItem('app-licensePermission');
    localStorage.removeItem('app-user-ip');
    localStorage.removeItem('app-Lisence-details');
    window.location.href = window.location.origin + '/#/auth/login';
    this.closeDrawer();
  }
  LogoutUser() {
    let payload = this.sessionService.UserLiseceLoginIfo;

    this.httpclient.post(environment.lisenceApiCore + 'Logout', payload, this.restService.httpOptions).subscribe((response: any) => {
      if (response) {
      }
    }, error => {
    });
  }


  get userInitials(): string {
    const first = (this.userData?.FirstName || '').trim();
    const last = (this.userData?.LastName || '').trim();
    return (`${first.charAt(0)}${last.charAt(0)}`.toUpperCase()) || 'PU';
  }

  uploadImage(): void {
    this.profileImageInput?.nativeElement.click();
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !this.allowedImageExtensions.includes(ext)) {
      this.toastr.error('Only JPG, JPEG, PNG and WEBP images are allowed.');
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.toastr.error('Image size must be less than 2 MB.');
      input.value = '';
      return;
    }

    this.saveProfileImage(file, input);
  }
  private saveProfileImage(file: File, input: HTMLInputElement): void {
    if (!this.userData?.Id) {
      this.toastr.error('User record not found.');
      input.value = '';
      return;
    }

    this.addItemService.showLoader$.next(true);

    const endpoint = `/portalUsers(${this.userData.Id})/ProfilePicture`;

    this.restService.patchBinary(endpoint, file).subscribe({
      next: () => {
        this.toastr.success('Profile image uploaded successfully.');
        input.value = '';
        this.refreshUserProfile();
      },
      error: () => {
        this.addItemService.showLoader$.next(false);
        input.value = '';
        this.toastr.error('Failed to upload profile image.');
      }
    });
  }

  removeProfileImage(): void {
    if (!this.userData?.Id) {
      this.toastr.error('User record not found.');
      return;
    }

    this.addItemService.showLoader$.next(true);

    this.restService.deleteBinary(`/portalUsers(${this.userData.Id})/ProfilePicture`).subscribe({
      next: () => {
        this.toastr.success('Profile image removed successfully.');
        this.clearProfileImage();
        this.refreshUserProfile();
      },
      error: () => {
        this.addItemService.showLoader$.next(false);
        this.toastr.error('Failed to remove profile image.');
      }
    });
  }

  private loadProfileImage(user: any): void {
    const mediaReadLink = user?.['ProfilePicture@odata.mediaReadLink'];

    this.clearProfileImage();
    this.isProfileImageLoading = true;

    if (!mediaReadLink) {
      this.isProfileImageLoading = false;
      return;
    }

    this.restService.getBinary(mediaReadLink).subscribe({
      next: (fileBlob: Blob) => {
        if (!fileBlob || fileBlob.size === 0) {
          this.profileImageUrl = '';
          this.isProfileImageLoading = false;
          return;
        }

        const imageBlob = fileBlob.type
          ? fileBlob
          : new Blob([fileBlob], { type: 'image/*' });

        this.profileImageUrl = window.URL.createObjectURL(imageBlob);
        this.isProfileImageLoading = false;
      },
      error: () => {
        this.profileImageUrl = '';
        this.isProfileImageLoading = false;
      }
    });
  }

  private loadProfileImageOld(user: any): void {
    const mediaReadLink = user?.['ProfilePicture@odata.mediaReadLink'];

    if (!mediaReadLink) {
      this.profileImageUrl = '';
      return;
    }

    this.clearProfileImage();

    this.restService.getBinary(mediaReadLink).subscribe({
      next: (fileBlob: Blob) => {
        if (!fileBlob || fileBlob.size === 0) {
          this.profileImageUrl = '';
          return;
        }

        const imageBlob = fileBlob.type
          ? fileBlob
          : new Blob([fileBlob], { type: 'image/*' });

        this.profileImageUrl = window.URL.createObjectURL(imageBlob);
      },
      error: () => {
        this.profileImageUrl = '';
        this.toastr.error('Profile image preview is not available.');
      }
    });
  }


  private clearProfileImage(): void {
    if (this.profileImageUrl && typeof this.profileImageUrl === 'string' && this.profileImageUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(this.profileImageUrl);
    }
    this.profileImageUrl = '';
  }

  closeDrawer() {
    this.activeModal.dismiss();
  }

  SelectWorkflowDelegateType(data: any) {
    switch (data.data) {
      case 'User':
        this.formDataService.updateControlData$.next({ control: 'workflowDelegateID', data: '' });
        this.addItemService.showLoader$.next(true);
        this.restService.get('/portalUsers')
          .pipe(finalize(() => this.addItemService.showLoader$.next(false)))
          .subscribe({
            next: (response: any) => {
              this.portalUsers = response.value;
              this.formFielService.updateDropdownItem$.next({ label: 'workflowDelegateID', items: this.portalUsers, displayFormat: '[UserId]', bindValue: 'UserId' });
            },
            error: () => {
              this.toastr.error('Unable to load users for workflow delegate.');
            }
          });
        break;

      case 'Group':
        this.formDataService.updateControlData$.next({ control: 'workflowDelegateID', data: '' });
        this.addItemService.showLoader$.next(true);
        this.restService.get('/approvalGroups')
          .pipe(finalize(() => this.addItemService.showLoader$.next(false)))
          .subscribe({
            next: (response: any) => {
              this.approvalGroups = response.value;
              this.formFielService.updateDropdownItem$.next({ label: 'workflowDelegateID', items: this.approvalGroups, displayFormat: '[Code]', bindValue: 'Code' });
            },
            error: () => {
              this.toastr.error('Unable to load approval groups for workflow delegate.');
            }
          });
        break;
    }
  }



  refreshUserProfile() {
    if (!this.userData?.Id) return;

    this.addItemService.showLoader$.next(true);

    const api = this.headerConfig.api;

    this.restService.get(`${api}(${this.userData.Id})`).subscribe({
      next: (res: any) => {
        let formData = this.utility.copyObj(res);

        formData = this.utility.setHeaderControlsData(
          formData,
          this.headerConfig.controls!
        );

        this.headerFormGroup.patchValue(formData);
        this.headerFormGroup.markAsPristine();

        this.userData = res;
        this.loadProfileImage(this.userData);
        this.syncSessionUserImage();
        this.addItemService.showLoader$.next(false);
      },
      error: () => {
        this.addItemService.showLoader$.next(false);
        this.toastr.error('Failed to refresh profile.');
      }
    });
  }

  ngOnDestroy(): void {
    this.clearProfileImage();
  }


  manageProfileImage(): void {
    const modalRef = this.modal.open(ManageProfileImageComponent, {
      size: 'sm',
      backdrop: 'static'
    });

    modalRef.componentInstance.userData = this.userData;

    modalRef.closed.subscribe((updated: boolean) => {
      if (updated) {
        this.refreshUserProfile();
      }
    });
  }

  private syncSessionUserImage(): void {
    const updatedUser = {
      ...(this.sessionService.User || {}),
      ...this.userData
    };

    this.sessionService.User = updatedUser;
    this.sessionService.notifyUserProfileChanged();
  }
}
