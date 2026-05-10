import { Component, Input, Optional } from '@angular/core';
import { ItemConfig } from '../../../core/models/shared/item.config';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: false,
  selector: 'app-add-item-loader',
  templateUrl: './add-item-loader.component.html',
  styleUrl: './add-item-loader.component.scss'
})
export class AddItemLoaderComponent {
  @Input() itemConfig!: ItemConfig;
  constructor(@Optional() public activeModal?: NgbActiveModal
  ) {
  }

  closePopup() {
    if (this.activeModal) {
      this.activeModal.close({
        action: 'close',
        record: null
      });
    }
  }

}
