import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { DocumentCommentsConfig } from './document-comments.config';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';
import { RestService } from '../../../core/services/rest.service';
import { Utility } from '../../../core/services/utility.service';
import { FormField } from '../../../core/models/shared/formField';
import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { ControlDataModel } from '../../../core/models/shared/controlDataModel';

@Component({
  standalone: false,
  selector: 'app-document-comments-popup',
  templateUrl: './document-comments-popup.component.html',
  styleUrls: ['./document-comments-popup.component.scss']
})
export class DocumentCommentsPopupComponent implements OnInit {

  ready: boolean = false;
  saving: boolean = false;
  viewMode: boolean = false;
  loading: boolean = false;
  showMoreButton: boolean = false;
  selectedLines: number[] = [];
  searchText!: string;
  dropdownControlItems: any = {};
  showSearchBox: boolean = false;

  page: number = 0;
  pageSize: number = 25;
  comments: any[] = [];
  originalComments: any[] = [];

  lineFormGroup!: FormGroup;
  lineDataConfig: LineDataConfig = DocumentCommentsConfig;

  @Input() title!: string;
  @Input() documentNo!: string;
  @Input() documentType!: string;

  constructor(public activeModal: NgbActiveModal,
    private toastr: ToastrService,
    private restService: RestService,
    private utility: Utility,
    private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.lineFormGroup = new FormGroup({
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
    const filter = "?$filter=No eq '" + this.documentNo + "'&top=" + this.pageSize + "&$skip=" + ((this.page - 1) * this.pageSize);
    this.loading = true;
    this.restService.get(this.lineDataConfig.api + filter).subscribe((response: any) => {
      if (response.value.length < this.pageSize) {
        this.showMoreButton = false;
      } else {
        this.showMoreButton = true;
      }

      this.originalComments = [...this.originalComments, ...response.value];
      this.originalComments.forEach((x: any, index: number) => {
        x.index = index;
      });

      if (this.originalComments.length === 0) {
        this.originalComments.push({ index: 0 });
        this.originalComments.push({ index: 1 });
        this.originalComments.push({ index: 2 });
      }

      this.searchItem();
      this.generateItemsFormArray(this.comments);
      this.loading = false;
    }, (error) => {
      if (this.originalComments.length === 0) {
        this.originalComments.push({ index: 0 });
        this.originalComments.push({ index: 1 });
        this.originalComments.push({ index: 2 });
      }
      this.comments = this.utility.copyObj(this.originalComments);
      this.generateItemsFormArray(this.comments);
      this.loading = false;
    });
  }

  generateItemsFormArray(data: any[]) {
    this.lineFormGroup.controls['items'] = new FormArray([]);
    data.forEach((item: any) => {
      this.createItemFormGroup(item);
    });
    this.ready = true;
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
          if (item[control.label!] && item[control.label!] !== '0001-01-01') {
            data = this.utility.convertStringToDateObj(item[control.label!]);
          }
        } else {
          data = item[control.label!];
        }
        group[control.label!] = new FormControl(data, validators);
      }

      group['index'] = new FormControl(item.index);

      if (first) {
        this.items.insert(0, new FormGroup(group));
      } else {
        this.items.push(new FormGroup(group));
      }
    }
  }

  deleteLine(row: number) {
    const id = this.comments[row][this.lineDataConfig.idProp!];
    this.restService.delete(this.lineDataConfig.api + '(' + id + ')').subscribe(() => {
      let lineRows = this.items.controls as FormGroup[];
      if (lineRows.length > 1) {
        const data = lineRows[row].value;
        lineRows.splice(row, 1);
        this.comments.splice(row, 1);
        this.items.updateValueAndValidity();
      }
    }, error => {
      this.toastr.error('Failed to delete line');
    });
  }

  leaveLineControl(data: ControlDataModel, row: number) {
    const itemGroup = this.items.controls[row] as FormGroup;
    const index = itemGroup.get('index')!.value;
    this.comments[row][data.control] = data.data;
    this.originalComments[index][data.control] = data.data;
    if (itemGroup.valid) {
      let record = this.comments[row];
      if (record[this.lineDataConfig.idProp!]) {
        let patchData = {
          [data.control]: data.data
        };
        patchData = this.utility.getLineControlsData(patchData, this.lineDataConfig.controls!);
        this.updateLineItemRecord(record, patchData, row, index);
      } else {
        record = this.utility.getLineControlsData(record, this.lineDataConfig.controls!);
        record.No = this.documentNo;
        record.DocumentType = this.documentType;
        this.addLineItemRecord(record, row, index);
      }
    }
  }

  addLineItemRecord(item: any, row: number, index: number) {
    this.saving = true;
    this.restService.post(this.lineDataConfig.api!, item).subscribe((response: any) => {
      this.comments[row] = response;
      this.originalComments[index] = response;
      this.saving = false;
      this.cdr.detectChanges();
    }, (error) => {
      this.toastr.error('Failed to add comment item!');
      this.saving = false;
      this.cdr.detectChanges();
    });
  }

  updateLineItemRecord(record: any, patchData: any, row: number, index: number) {
    const ifMatchKey = record["@odata.etag"];
    const query = '(' + record[this.lineDataConfig.idProp!] + ')';
    this.saving = true;
    this.restService.patch(this.lineDataConfig.api + query, patchData, ifMatchKey).subscribe((response: any) => {
      this.comments[row] = response;
      this.originalComments[index] = response;
      this.saving = false;
      this.cdr.detectChanges();
    }, (error) => {
      this.toastr.error('Failed to update comment item!');
      this.saving = false;
      this.cdr.detectChanges();
    });
  }

  changeViewMode() {
    this.viewMode = !this.viewMode;
  }

  reset() {
  }

  selectLineItem(index: number) {
    this.selectedLines = [index];
  }

  addLineItem() {
    this.originalComments.push({ index: this.originalComments.length - 1 });
    this.comments.push({ index: this.originalComments.length - 1 });
    this.createItemFormGroup({ index: this.originalComments.length - 1 }, false);
  }

  deleteLines() {
    if (this.selectedLines.length > 0) {
      let lines = this.items.controls as FormGroup[];
      const itemGroup = this.items.controls[this.selectedLines[0]] as FormGroup;
      const index = itemGroup.get('index')!.value;
      const record = this.comments[this.selectedLines[0]];
      if (record[this.lineDataConfig.idProp!]) {
        const query = '(' + record[this.lineDataConfig.idProp!] + ')';
        this.restService.delete(this.lineDataConfig.api + query).subscribe((response: any) => {
          if (lines.length > 1) {
            lines.splice(this.selectedLines[0], 1);
            this.items.updateValueAndValidity();
            this.comments.slice(this.selectedLines[0], 1);
            this.originalComments.splice(index, 1);
            this.selectedLines = [];
            this.toastr.success('Comment deleted successfully.');
            this.cdr.detectChanges();
          }
        }, error => {
          this.toastr.error('Failed to delete comment');
        });
      } else {
        lines.splice(this.selectedLines[0], 1);
        this.items.updateValueAndValidity();
        this.comments.slice(this.selectedLines[0], 1);
        this.originalComments.splice(index, 1);
      }
    } else {
      this.toastr.warning('Select comment to delete!');
    }
  }

  showSearch() {
    this.showSearchBox = true;
  }

  searchItem() {
    this.comments = this.utility.searchLineControlData(this.searchText, this.originalComments,
      this.lineDataConfig.controls!, this.dropdownControlItems);
    this.generateItemsFormArray(this.comments);
  }

  closePopup() {
    this.activeModal.close('close');
  }
}
