import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: false,
  selector: 'app-license-transfer',
  templateUrl: './license-transfer.component.html',
  styleUrl: './license-transfer.component.scss'
})
export class LicenseTransferComponent {

  constructor(
    public activeModal: NgbActiveModal,
  ) { }
}
