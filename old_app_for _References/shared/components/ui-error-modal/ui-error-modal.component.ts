import { Component, Input } from '@angular/core';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: false,
  selector: 'app-ui-error-modal',
  templateUrl: './ui-error-modal.component.html',
  styleUrl: './ui-error-modal.component.scss'
})
export class UiErrorModalComponent {
  @Input() errorMessage: string = 'Something went wrong! Please press F5 or click retry button to reload the page.';
  @Input() retryCallback!: () => void;

  constructor(private addItemService: AddItemService, public modal: NgbActiveModal
  ) {
  }


  reload() {
    if (this.retryCallback) {
      this.retryCallback();
    } else {
      window.location.reload();
    }
    this.modal.close();
  }

  close() {
    this.modal.close();
  }

}
