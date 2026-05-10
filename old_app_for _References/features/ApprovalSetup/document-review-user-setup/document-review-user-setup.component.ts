import { Component, OnInit, Input, Output, OnChanges, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { DocumentReviewUserSetupLineConfig } from './document-review-user-setup.config';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';
import { RestService } from '../../../core/services/rest.service';
import { Utility } from '../../../core/services/utility.service';
import { FormField } from '../../../core/models/shared/formField';
import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { ControlDataModel } from '../../../core/models/shared/controlDataModel';

@Component({
  standalone: false,
  selector: 'app-document-review-user-setup',
  templateUrl: './document-review-user-setup.component.html',
  styleUrls: ['./document-review-user-setup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentReviewUserSetupComponent implements OnInit {

  page: number = 0;
  pageSize: number = 25;
  lines: any[] = [];
  originalLines: any[] = [];
  lineReady: boolean = false;
  lineFormGroup!: FormGroup;
  checkLineAll: boolean = false;
  selectedLines: number[] = [];
  viewMode: boolean = false;
  saving: boolean = false;
  loading: boolean = false;
  showMoreButton: boolean = false;
  showSearchBox: boolean = false;
  searchText!: string;
  dropdownControlItems: any = {};

  lineDataConfig: LineDataConfig = DocumentReviewUserSetupLineConfig;

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

    this.getLineData();
  }

  get items() { return this.lineFormGroup.get('items') as FormArray; }

  public getLineFormGroup(row: number) {
    return this.items.controls[row] as FormGroup;
  }

  getLineData() {
    this.page++;
    const filter = '?$top=' + this.pageSize + '&$skip=' + ((this.page - 1) * this.pageSize);
    this.loading = true;
    this.restService.get(this.lineDataConfig.api!).subscribe((response: any) => {
      if (response.value.length < this.pageSize) {
        this.showMoreButton = false;
      } else {
        this.showMoreButton = true;
      }

      this.originalLines = [...this.originalLines, ...response.value];
      this.originalLines.forEach((x: any, index: number) => {
        x.index = index;
      });
      if (this.originalLines.length === 0) {
        this.originalLines.push({ index: 0 });
        this.originalLines.push({ index: 1 });
        this.originalLines.push({ index: 2 });
      }
      this.searchItem();
      this.generateItemsFormArray(this.lines);
      this.loading = false;
    }, (error) => {
      if (this.originalLines.length === 0) {
        this.originalLines.push({ index: 0 });
        this.originalLines.push({ index: 1 });
        this.originalLines.push({ index: 2 });
      }
      this.lines = this.utility.copyObj(this.originalLines);
      this.generateItemsFormArray(this.lines);
      this.loading = false;
    });
  }

  generateItemsFormArray(data: any[]) {
    this.lineFormGroup.controls['items'] = new FormArray([]);
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

      group['index'] = new FormControl(item.index);
      if (first) {
        this.items.insert(0, this.fb.group(group));
      } else {
        this.items.push(this.fb.group(group));
      }
    }
  }

  deleteLine(row: number) {
    const id = this.lines[row][this.lineDataConfig.idProp!];
    this.restService.delete(this.lineDataConfig.api + '(' + id + ')').subscribe(() => {
      let lineRows = this.items.controls as FormGroup[];
      if (lineRows.length > 1) {
        const data = lineRows[row].value;
        lineRows.splice(row, 1);
        this.lines.splice(row, 1);
        this.items.updateValueAndValidity();
      }
    }, error => {
      this.toastr.error('Failed to delete line');
    });
  }

  changeLineControl(label: string, rowIndex: number) {
    const itemGroup = this.items.controls[rowIndex] as FormGroup;
  }

  leaveLineControl(data: ControlDataModel, row: number) {
    const itemGroup = this.items.controls[row] as FormGroup;
    const index = itemGroup.get('index')!.value;
    this.lines[row][data.control] = data.data;
    this.originalLines[index][data.control] = data.data;
    if (itemGroup.valid) {
      let record = this.lines[row];
      // if (record[data.control] !== data.data) {
      if (record[this.lineDataConfig.idProp!]) {
        let patchData = {
          [data.control]: data.data
        };
        patchData = this.utility.getLineControlsData(patchData, this.lineDataConfig.controls!);
        this.updateLineItemRecord(record, patchData, row, index);
      } else {
        record = this.utility.getLineControlsData(record, this.lineDataConfig.controls!);
        this.addLineItemRecord(record, row, index);
      }
      // }
    }
  }

  dropdownItemsLoadedEvent(items: any[], control: FormField) {
    this.dropdownControlItems[control.label!] = items;
  }

  addLineItemRecord(item: any, row: number, index: number) {
    this.saving = true;
    this.restService.post(this.lineDataConfig.api!, item).subscribe((response: any) => {
      this.lines[row] = response;
      this.originalLines[index] = response;
      this.saving = false;
      this.cdr.detectChanges();
    }, (error) => {
      this.toastr.error('Failed to add line item!');
      this.saving = false;
      this.cdr.detectChanges();
    });
  }

  updateLineItemRecord(record: any, patchData: any, row: number, index: number) {
    const ifMatchKey = record["@odata.etag"];
    const query = '(' + record[this.lineDataConfig.idProp!] + ')';
    this.saving = true;
    this.restService.patch(this.lineDataConfig.api + query, patchData, ifMatchKey).subscribe((response: any) => {
      this.lines[row] = response;
      this.originalLines[index] = response;
      this.saving = false;
      this.cdr.detectChanges();
    }, (error) => {
      this.toastr.error('Failed to update line item!');
      this.saving = false;
      this.cdr.detectChanges();
    });
  }

  changeViewMode() {
    this.viewMode = !this.viewMode;
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
    this.originalLines.push({ index: this.originalLines.length - 1 });
    this.lines.push({ index: this.originalLines.length - 1 });
    this.createItemFormGroup({ index: this.originalLines.length - 1 }, false);
  }

  deleteLines() {
    if (this.selectedLines.length > 0) {
      let lines = this.items.controls as FormGroup[];
      const itemGroup = this.items.controls[this.selectedLines[0]] as FormGroup;
      const index = itemGroup.get('index')!.value;
      const record = this.lines[this.selectedLines[0]];
      if (record[this.lineDataConfig.idProp!]) {
        const query = '(' + record[this.lineDataConfig.idProp!] + ')';
        this.restService.delete(this.lineDataConfig.api + query).subscribe((response: any) => {
          if (lines.length > 1) {
            lines.splice(this.selectedLines[0], 1);
            this.items.updateValueAndValidity();
            this.lines.slice(this.selectedLines[0], 1);
            this.originalLines.splice(index, 1);
            this.selectedLines = [];
            this.toastr.success('Record deleted successfully.');
            this.cdr.detectChanges();
          }
        }, error => {
          this.toastr.error('Failed to delete line');
        });
      } else {
        lines.splice(this.selectedLines[0], 1);
        this.items.updateValueAndValidity();
        this.lines.slice(this.selectedLines[0], 1);
        this.originalLines.splice(index, 1);
      }
    } else {
      this.toastr.warning('Select line to delete!');
    }
  }

  showSearch() {
    this.showSearchBox = true;
  }

  searchItem() {
    this.lines = this.utility.searchLineControlData(this.searchText, this.originalLines,
      this.lineDataConfig.controls!, this.dropdownControlItems);
    this.generateItemsFormArray(this.lines);
  }
}
