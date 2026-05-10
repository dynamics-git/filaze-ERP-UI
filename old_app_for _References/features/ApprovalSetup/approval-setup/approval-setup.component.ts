import { Component, OnInit, Input, Output, OnChanges, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { ApprovalSetupLineConfig } from './approval-setup.config';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';
import { RestService } from '../../../core/services/rest.service';
import { Utility } from '../../../core/services/utility.service';
import { FormField } from '../../../core/models/shared/formField';
import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { GlobalApiUiSearchService } from '../../../core/services/shared/global-api-ui-search.service';

@Component({
  standalone: false,
  selector: 'app-approval-setup',
  templateUrl: './approval-setup.component.html',
  styleUrls: ['./approval-setup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprovalSetupComponent implements OnInit {

  page: number = 0;
  pageSize: number = 25;
  setups: any[] = [];
  originalSetups: any[] = [];
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

  lineDataConfig: LineDataConfig = ApprovalSetupLineConfig;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private restService: RestService,
    private utility: Utility,
    private cdr: ChangeDetectorRef,
    private searchService: GlobalApiUiSearchService,
  ) {
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

  private removeLineUnicodeChars(record: any) {
    this.lineDataConfig.removeUnicodeCharFields!.forEach((item: string) => {
      record[item] = record[item].replace('_x002F_', '/');
      record[item] = record[item].replace('_x0020_', ' ');
    });

    return record;
  }


  scrollHandler(event: any) {
    const el = event.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10 && !this.loading && this.showMoreButton) {
      this.getLineData();
    }
  }

  getLineData() {
    this.page++;
    const filter = '?$top=' + this.pageSize + '&$skip=' + ((this.page - 1) * this.pageSize);
    this.loading = true;
    this.restService.get(this.lineDataConfig.api + filter).subscribe((response: any) => {
      response.value.forEach((record: any) => {
        record = this.removeLineUnicodeChars(record);
      });

      if (response.value.length < this.pageSize) {
        this.showMoreButton = false;
      } else {
        this.showMoreButton = true;
      }

      this.originalSetups = [...this.originalSetups, ...response.value];
      this.originalSetups.forEach((x: any, index: number) => {
        x.index = index;
      });

      if (this.originalSetups.length === 0) {
        this.originalSetups.push({ index: 0 });
        this.originalSetups.push({ index: 1 });
        this.originalSetups.push({ index: 2 });
      }

      // this.searchItem();
      this.searchText = '',
        this.setups = this.utility.searchLineControlData(this.searchText, this.originalSetups,
          this.lineDataConfig.controls!, this.dropdownControlItems);
      this.generateItemsFormArray(this.setups);
      this.loading = false;
    }, (error) => {
      if (this.originalSetups.length === 0) {
        this.originalSetups.push({ index: 0 });
        this.originalSetups.push({ index: 1 });
        this.originalSetups.push({ index: 2 });
      }
      this.setups = this.utility.copyObj(this.originalSetups);
      this.generateItemsFormArray(this.setups);
      this.loading = false;
    });
  }


  searchData() {
    let searchTerm = this.searchText;
    this.setups = [];
    if (!searchTerm || searchTerm.trim() === '') {
      this.getLineData();
    } else {
      this.search(searchTerm);
    }
  }

  search(searchTerm: string) {
    this.loading = true;
    const lineControls: any = this.lineDataConfig.controls;
    this.searchService.searchLineFromApi(this.lineDataConfig, lineControls, searchTerm).subscribe({
      next: (results: any[]) => {
        this.loading = false;
        this.setups = results;
        this.generateItemsFormArray(this.setups);

        if (results.length === 0) {
          this.toastr.warning('No result found!');
        }
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Error fetching data');
      }
    });
  }


  generateItemsFormArray(data: any[]) {
    this.lineFormGroup.controls['items'] = new FormArray([]);
    data.forEach((item: any) => {
      this.createItemFormGroup(item);
    });
    this.lineReady = true;
    this.cdr.detectChanges();

    this.setups.forEach((setup: any, index: number) => {
      const itemGroup = this.items.controls[index] as FormGroup;

      if (setup.DocumentType !== 'Order') {
        itemGroup.get('GroupID')!.disable();
      }
    });
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
    const id = this.setups[row][this.lineDataConfig.idProp!];
    this.restService.delete(this.lineDataConfig.api + '(' + id + ')').subscribe(() => {
      let lineRows = this.items.controls as FormGroup[];
      if (lineRows.length > 1) {
        const data = lineRows[row].value;
        lineRows.splice(row, 1);
        this.setups.splice(row, 1);
        this.items.updateValueAndValidity();
      }
    }, error => {
      this.toastr.error('Failed to delete line');
    });
  }

  changeLineControl(data: ControlDataModel, rowIndex: number) {
    const itemGroup = this.items.controls[rowIndex] as FormGroup;
    if (data.control === 'DocumentType') {
      if (itemGroup.get('DocumentType')!.value === 'Order') {
        itemGroup.get('GroupID')!.enable();
      } else {
        itemGroup.get('GroupID')!.disable();
      }
    }
  }

  leaveLineControl(data: ControlDataModel, row: number) {
    const itemGroup = this.items.controls[row] as FormGroup;
    const index = itemGroup.get('index')!.value;
    this.setups[row][data.control] = data.data;
    this.originalSetups[index][data.control] = data.data;
    if (itemGroup.valid) {
      let record = this.setups[row];
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
    }
  }

  dropdownItemsLoadedEvent(items: any[], control: FormField) {
    this.dropdownControlItems[control.label!] = items;
  }

  addLineItemRecord(item: any, row: number, index: number) {
    this.saving = true;
    this.restService.post(this.lineDataConfig.api!, item).subscribe((response: any) => {
      this.setups[row] = response;
      this.originalSetups[index] = response;
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
      this.setups[row] = response;
      this.originalSetups[index] = response;
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
    this.originalSetups.push({ index: this.originalSetups.length - 1 });
    this.setups.push({ index: this.originalSetups.length - 1 });
    this.createItemFormGroup({ index: this.originalSetups.length - 1 }, false);
  }

  deleteLines() {
    if (this.selectedLines.length > 0) {
      let lines = this.items.controls as FormGroup[];
      const itemGroup = this.items.controls[this.selectedLines[0]] as FormGroup;
      const index = itemGroup.get('index')!.value;
      const record = this.setups[this.selectedLines[0]];
      if (record[this.lineDataConfig.idProp!]) {
        const query = '(' + record[this.lineDataConfig.idProp!] + ')';
        this.restService.delete(this.lineDataConfig.api + query).subscribe((response: any) => {
          if (lines.length > 1) {
            lines.splice(this.selectedLines[0], 1);
            this.items.updateValueAndValidity();
            this.setups.slice(this.selectedLines[0], 1);
            this.originalSetups.splice(index, 1);
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
        this.setups.slice(this.selectedLines[0], 1);
        this.originalSetups.splice(index, 1);
      }
    } else {
      this.toastr.warning('Select line to delete!');
    }
  }

  showSearch() {
    this.showSearchBox = true;
  }

  // searchItem() {
  //   this.setups = this.utility.searchLineControlData(this.searchText, this.originalSetups,
  //     this.lineDataConfig.controls!, this.dropdownControlItems);
  //   this.generateItemsFormArray(this.setups);    
  // }


  showCheck: boolean = false;
  toggleSelectRow(i: number): void {
    this.showCheck = !this.showCheck;
    const pos = this.selectedLines.indexOf(i);
    pos === -1 ? this.selectedLines.push(i) : this.selectedLines.splice(pos, 1);
  }
  onSort(event: { column: string; direction: string }) {
    const { column, direction } = event;

    if (direction === '') {
      // Reset to unsorted
      this.setups = [...this.originalSetups];
    } else {
      this.setups = [...this.setups].sort((a, b) => {
        const res = a[column] > b[column] ? 1 : (a[column] < b[column] ? -1 : 0);
        return direction === 'asc' ? res : -res;
      });
    }

    this.generateItemsFormArray(this.setups);
  }



}
