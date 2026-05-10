import { Component, ElementRef, Input, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { RestService } from '../../../../../core/services/rest.service';
import { AddItemService } from '../../../../../core/services/shared/add-item.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: false,
  selector: 'app-manage-profile-image',
  templateUrl: './manage-profile-image.component.html',
  styleUrl: './manage-profile-image.component.scss'
})
export class ManageProfileImageComponent implements OnInit, OnDestroy {
  @Input() userData: any;
  @ViewChild('profileImageInput') profileImageInput!: ElementRef<HTMLInputElement>;

  profileImageUrl: string = '';
  previewImageUrl: string = '';
  selectedFile: File | null = null;
  allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  isProfileImageLoading = false;
  isSaving = false;
  isRemoving = false;

  constructor(
    public activeModal: NgbActiveModal,
    private restService: RestService,
    private addItemService: AddItemService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadProfileImage(this.userData);
  }

  ngOnDestroy(): void {
    this.clearPreviewObjectUrl();
    this.clearProfileImageObjectUrl();
  }

  chooseImage(): void {
    this.profileImageInput?.nativeElement.click();
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

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

    this.selectedFile = file;
    this.setPreviewImage(file);
    input.value = '';

    this.saveProfileImage();
  }

  saveProfileImage(): void {
    if (!this.userData?.Id) {
      this.toastr.error('User record not found.');
      return;
    }

    if (!this.selectedFile) {
      this.toastr.error('Please choose an image first.');
      return;
    }

    this.isSaving = true;
    this.addItemService.showLoader$.next(true);

    this.restService.patchBinary(`/portalUsers(${this.userData.Id})/ProfilePicture`, this.selectedFile).subscribe({
      next: () => {
        this.toastr.success('Profile image uploaded successfully.');
        this.isSaving = false;
        this.addItemService.showLoader$.next(false);
        //  this.activeModal.close(true);
      },
      error: () => {
        this.addItemService.showLoader$.next(false);
        this.isSaving = false;
        this.toastr.error('Failed to upload profile image.');
      }
    });
  }

  removeProfileImage(): void {
    if (!this.userData?.Id) {
      this.toastr.error('User record not found.');
      return;
    }

    this.isRemoving = true;
    this.addItemService.showLoader$.next(true);

    this.restService.deleteBinary(`/portalUsers(${this.userData.Id})/ProfilePicture`).subscribe({
      next: () => {
        this.toastr.success('Profile image removed successfully.');
        this.isRemoving = false;
        this.addItemService.showLoader$.next(false);
        this.activeModal.close(true);
      },
      error: () => {
        this.addItemService.showLoader$.next(false);
        this.isRemoving = false;
        this.toastr.error('Failed to remove profile image.');
      }
    });
  }

  cancel(): void {
    this.activeModal.close(true);
  }

  private loadProfileImage(user: any): void {
    const mediaReadLink = user?.['ProfilePicture@odata.mediaReadLink'];

    this.isProfileImageLoading = true;
    this.profileImageUrl = '';

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

  private setPreviewImage(file: File): void {
    this.clearPreviewObjectUrl();
    this.previewImageUrl = window.URL.createObjectURL(file);
  }

  private clearPreviewObjectUrl(): void {
    if (this.previewImageUrl && this.previewImageUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(this.previewImageUrl);
    }
    this.previewImageUrl = '';
  }

  private clearProfileImageObjectUrl(): void {
    if (this.profileImageUrl && this.profileImageUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(this.profileImageUrl);
    }
    this.profileImageUrl = '';
  }
}
