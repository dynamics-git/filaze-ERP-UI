import { Injectable } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

import { SweetService } from './sweet.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MessageModalComponent } from '../../../shared/components/message-modal/message-modal.component';
import { UiErrorModalComponent } from '../../../shared/components/ui-error-modal/ui-error-modal.component';

export type DialogAlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'custom';

export interface DialogConfirmOptions {
  title?: string;
  message?: string;
  yesButtonText?: string;
  noButtonText?: string;
  showAsNotification?: boolean;
  modalOptions?: NgbModalOptions;
}

export interface DialogMessageOptions {
  title?: string;
  message: string;
  modalOptions?: NgbModalOptions;
}

export interface DialogDeleteConfirmOptions {
  title?: string;
  message?: string;
  yesButtonText?: string;
  noButtonText?: string;
  modalOptions?: NgbModalOptions;
}

@Injectable({
  providedIn: 'root'
})
export class UnifiedDialogService {
  constructor(
    private modal: NgbModal,
    private sweetService: SweetService
  ) { }

  alert(type: DialogAlertType, options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
    return this.sweetService.showAlert(type, options);
  }

  // Compatibility alias for teams used to SweetService naming.
  showAlert(type: DialogAlertType, options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
    return this.alert(type, options);
  }

  commentBox(options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
    return this.sweetService.showMessageBox(options);
  }

  // Compatibility alias for teams used to SweetService naming.
  showMessageBox(options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
    return this.commentBox(options);
  }

  chooseClaimType(): Promise<'own' | 'representative' | null> {
    return this.sweetService.chooseClaimType();
  }

  chooseRepresentativeUser(users: any[]): Promise<any | null> {
    return this.sweetService.chooseRepresentativeUser(users);
  }

  async confirm(options: DialogConfirmOptions): Promise<boolean> {
    const ref = this.modal.open(ConfirmDialogComponent, {
      windowClass: 'modal-dialog-confirm',
      backdrop: 'static',
      centered: true,
      keyboard: false,
      ...options.modalOptions
    });

    ref.componentInstance.showAsNotification = options.showAsNotification ?? false;
    ref.componentInstance.title = options.title;
    ref.componentInstance.message = options.message ?? 'Do you want to proceed?';
    ref.componentInstance.yesButtonText = options.yesButtonText ?? 'Yes';
    ref.componentInstance.noButtonText = options.noButtonText ?? 'No';

    try {
      const result = await ref.result;
      return result === true;
    } catch {
      return false;
    }
  }

  // Portal-standard delete confirmation prompt.
  async confirmDelete(options: DialogDeleteConfirmOptions = {}): Promise<boolean> {
    return this.confirm({
      title: options.title ?? 'Confirm',
      message: options.message ?? 'Are you sure you want to delete this item? This action cannot be undone.',
      yesButtonText: options.yesButtonText ?? 'Yes, Delete',
      noButtonText: options.noButtonText ?? 'No',
      showAsNotification: false,
      modalOptions: {
        windowClass: 'modal-dialog-confirm',
        ...(options.modalOptions || {})
      }
    });
  }

  async message(options: DialogMessageOptions): Promise<boolean> {
    const ref = this.modal.open(MessageModalComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
      ...options.modalOptions
    });

    ref.componentInstance.title = options.title ?? 'Message';
    ref.componentInstance.message = options.message;

    try {
      const result = await ref.result;
      return result === 'ok';
    } catch {
      return false;
    }
  }

  openUiError(errorMessage: string, retryCallback?: () => void): void {
    const modalRef = this.modal.open(UiErrorModalComponent, {
      backdrop: 'static'
    });

    modalRef.componentInstance.errorMessage = errorMessage;
    modalRef.componentInstance.retryCallback = retryCallback;
  }
}
