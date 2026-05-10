import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: false,
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  @Input() showAsNotification: boolean = true;
  @Input() title: string = 'Are you sure?';
  @Input() message: string = 'Are you sure you want to delete this item? This action cannot be undone.';
  @Input() yesButtonText: string = 'Yes';
  @Input() noButtonText: string = 'No';
  
  constructor(private model: NgbActiveModal) {
  }

  confirm() {
    this.model.close(true);
  }

  close() {
    this.model.close(false);
  }
}
