import { Component, OnInit, Input, Output, OnChanges, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { ClaimJournalLineConfig } from './claim-journal.config';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';
import { RestService } from '../../../core/services/rest.service';
import { Utility } from '../../../core/services/utility.service';
import { FormField } from '../../../core/models/shared/formField';
import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { ControlDataModel } from '../../../core/models/shared/controlDataModel';

@Component({
  standalone: false,
  selector: 'app-claim-journal',
  templateUrl: './claim-journal.component.html',
  styleUrls: ['./claim-journal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimJournalComponent implements OnInit {

  lineReady: boolean = false;
  lineFormGroup!: FormGroup;
  checkLineAll: boolean = false;
  selectedLines: number[] = [];
  saving: boolean = false;

  lineDataConfig: LineDataConfig = ClaimJournalLineConfig;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private restService: RestService,
    private utility: Utility,
    private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.lineFormGroup = this.fb.group({
      items: new FormArray([])
    });

    this.generateItemsFormArray([{}]);
  }

  get items() { return this.lineFormGroup.get('items') as FormArray; }

  public getLineFormGroup(row: number) {
    return this.items.controls[row] as FormGroup;
  }

  generateItemsFormArray(data: any[]) {
    data.forEach((item: any) => {
      this.createItemFormGroup(item);
    });
    this.lineReady = true;
    this.cdr.detectChanges();
  }

  createItemFormGroup(item: any, first: boolean = false) {
    if (this.lineDataConfig.controls && this.lineDataConfig.controls.length > 0) {
      let group: any = {};
      for (let i = 0; i < this.lineDataConfig.controls.length; i++) {
        const control: FormField = this.lineDataConfig.controls[i];
        let validators: any[] = [];
        if (control.required) {
          validators.push(Validators.required);
        }
        if (control.type === FormFieldType.Email) {
          validators.push(Validators.email);
        }
        let data: any;
        if (control.type === FormFieldType.DateTime) {
          data = this.utility.convertStringToDateObj(item[control.label!]);
        } else {
          data = item[control.label!];
        }
        group[control.label!] = new FormControl(data, validators);
      }

      if (first) {
        this.items.insert(0, this.fb.group(group));
      } else {
        this.items.push(this.fb.group(group));
      }
    }
  }

  addLine() {
    this.createItemFormGroup({}, false);
  }

  saveLines() {
    let lineRows = this.items.controls as FormGroup[];
    lineRows.forEach((line: FormGroup, index: number) => {
      if (line.valid) {
        const record = this.utility.getLineControlsData(line.value, this.lineDataConfig.controls!);
        this.addLineItemRecord(record, index);
      }
    });
  }

  changeLineControl(rowIndex: number) {
    const itemGroup = this.items.controls[rowIndex] as FormGroup;
  }

  leaveLineControl(data: ControlDataModel, row: number) {
    const itemGroup = this.items.controls[row] as FormGroup;
  }

  addLineItemRecord(item: any, row: number) {
    this.saving = true;
    this.restService.post(this.lineDataConfig.api!, item).subscribe((response: any) => {
      this.saving = false;
      const itemGroup = this.items.controls[row] as FormGroup;
      itemGroup.get('Status')!.setValue('Submitted');
      itemGroup.disable();
      this.cdr.detectChanges();
    }, (error) => {
      this.toastr.error('Failed to add line item!');
      this.saving = false;
      this.cdr.detectChanges();
    });
  }

  reset() {
  }

  selectAll() {
    this.checkLineAll = !this.checkLineAll;
    this.selectedLines = [];
    if (this.checkLineAll) {
      const lineData = this.items.value;
      lineData.forEach((ele: any, index: number) => {
        this.selectedLines.push(index);
      });
    }
  }

  selectLineItem(index: number) {
    this.selectedLines = [index];
  }

  addLineItem() {
    this.createItemFormGroup({}, false);
  }

  deleteLines() {
    if (this.selectedLines.length > 0) {
      let lineRows = this.items.controls as FormGroup[];
      lineRows.splice(this.selectedLines[0], 1);
      this.items.updateValueAndValidity();
      this.selectedLines = [];
    } else {
      this.toastr.warning('Select line to delete!');
    }
  }

}
