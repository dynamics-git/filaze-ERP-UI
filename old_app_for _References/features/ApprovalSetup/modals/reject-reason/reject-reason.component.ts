import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: false,
  selector: 'app-reject-reason',
  templateUrl: './reject-reason.component.html',
  styleUrls: ['./reject-reason.component.sass']
})
export class RejectReasonComponent implements OnInit {
  reasonForm!: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    this.reasonForm = this.fb.group({
      reason: new FormControl()
    });
  }
  get reason() { 
    return this.reasonForm.get('reason') as FormControl; 
  }
}
