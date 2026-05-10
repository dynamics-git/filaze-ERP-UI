import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: false,
  selector: 'app-purchase-order-model',
  templateUrl: './purchase-order-model.component.html',
  styleUrls: ['./purchase-order-model.component.sass']
})
export class PurchaseOrderModelComponent implements OnInit {
  optionsForm!: FormGroup;
  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
  ) { }

  ngOnInit() {
    this.optionsForm = this.fb.group({
      option: new FormControl('purchase-ord')
    });
  }

  get option() {
    return this.optionsForm.get('option');
  }

}
