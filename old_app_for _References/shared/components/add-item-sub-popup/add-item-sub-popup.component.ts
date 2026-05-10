import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { FormField } from '../../../core/models/shared/formField';
import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';
import { RestService } from '../../../core/services/rest.service';
import { Utility } from '../../../core/services/utility.service';
//import { DocumentCommentsConfig } from '../document-comments-popup/document-comments.config';
import { AddItemSubPopupsConfig, AddItemSubPopupsConfigHeader } from './add-item-sub-popup.config';
import { ItemConfig } from '../../../core/models/shared/item.config';
import { Router } from '@angular/router';
import { FormDataModel } from '../../../core/models/shared/formDataModel';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { HeaderDataConfig } from '../../../core/models/shared/header-data.config';

@Component({
  standalone: false,
  selector: 'app-add-item-sub-popup',
  templateUrl: './add-item-sub-popup.component.html',
  styleUrl: './add-item-sub-popup.component.scss'
})
export class AddItemSubPopupComponent {
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
  showLineSection: boolean = false;
  id!: string;
  lineData: any[] = [];

  headerFormGroup!: FormGroup;

  lineFormGroup!: FormGroup;
  // lineDataConfig: LineDataConfig = DocumentCommentsConfig;
  lineDataConfig: LineDataConfig = AddItemSubPopupsConfig;
  headerDataConfig: HeaderDataConfig = AddItemSubPopupsConfigHeader;
  viewModeEnableControls: string[] = [];
  showEditButton: boolean = true;

  @Input() showCreate!: string;
  @Input() showDelete!: string;
  @Input() title!: string;
  @Input() documentNo!: string;
  @Input() documentType!: string;
  @Input() headerData!: any;
  @Output() popupLoaded = new EventEmitter<any>();
  @Input() itemConfig!: ItemConfig;
  @Output() leaveEvent = new EventEmitter<FormDataModel>();
  @Output() changeEvent = new EventEmitter<EventDataModel>();

  update: boolean = false;

  headerReady!: boolean;

  constructor(public activeModal: NgbActiveModal,
    private toastr: ToastrService,
    private restService: RestService,
    private utility: Utility,
    private cdr: ChangeDetectorRef,
    private router: Router) { }

  ngOnInit() {
    this.headerFormGroup = new FormGroup({});
    this.lineFormGroup = new FormGroup({
      items: new FormArray([])
    });
    this.getHeaderData(this.documentNo)
    // this.getLineData();
  }

  get items() { return this.lineFormGroup.get('items') as FormArray; }

  public getLineFormGroup(row: number) {
    return this.items.controls[row] as FormGroup;
  }

  getHeaderData(id: string) {
    this.restService.get(this.headerData?.headerConfig?.api + '(' + id + ')').subscribe((response: any) => {
      if (response && response.value) {
        if (response.value.length > 0) {
          this.headerData = this.removeUnicodeChars(response.value[0]);
        } else {
          this.toastr.error('Document is not found');
          this.router.navigate([this.headerData.returnUrl]);
        }
      } else {
        this.headerData = this.removeUnicodeChars(response);
      }
      console.log("header data=", this.headerData);

      
      this.headerFormGroup.patchValue(this.utility.setHeaderControlsData(this.headerData, this.headerDataConfig!.controls!));
      console.log("header data=", this.headerDataConfig!.controls!);

      this.headerDataConfig?.controls?.forEach(row => {
        row.forEach(control => {
          const controlName = control.label!;
          if (!this.headerFormGroup.contains(controlName)) {
            this.headerFormGroup.addControl(controlName, new FormControl(null)); // You can pass default value
          }
        });
      });

      this.headerReady = true;
      if (this.showLineSection) {
        this.id = this.documentNo;
        // this.getLineData();
      } else {
        this.popupLoaded.emit({
          header: this.headerData,
          line: []
        });
      }
      this.cdr.detectChanges();
    }, (error) => {
      this.toastr.warning('Unable to find the item');
      this.router.navigate([this.headerData.returnUrl]);
    });
  }




  private removeUnicodeChars(record: any) {
    this.headerData.headerConfig!.removeUnicodeCharFields!.forEach((item: string) => {
      record[item] = record[item].replace('_x0020_', ' ');
    });

    return record;
  }


  updateViewModeEnableControls() {
    if (this.itemConfig.headerConfig!.controls && this.itemConfig.headerConfig!.controls!.length > 0) {
      for (let i = 0; i < this.itemConfig.headerConfig!.controls!.length; i++) {
        const column: FormField[] = this.itemConfig.headerConfig!.controls![i];
        for (let j = 0; j < column.length; j++) {
          const control: FormField = column[j];
          if (this.viewModeEnableControls.includes(control.label!)) {
            this.headerFormGroup.controls[control.label!].enable();
          } else {
            this.headerFormGroup.controls[control.label!].disable();
          }
        }
      }
    }

    if (this.itemConfig.lineConfig!.controls && this.itemConfig.lineConfig!.controls.length > 0) {
      for (let i = 0; i < this.lineData.length; i++) {
        let lineFormGroup = (this.items.controls as FormGroup[])[i];
        for (let j = 0; j < this.itemConfig.lineConfig!.controls.length; j++) {
          const control: FormField = this.itemConfig.lineConfig!.controls[j];
          if (lineFormGroup.controls[control.label!]) {
            if (this.viewModeEnableControls.includes('Line_' + control.label)) {
              lineFormGroup.controls[control.label!].enable();
            } else {
              lineFormGroup.controls[control.label!].disable();
            }
          }
        }
      }
    }
  }

  onClearDropdown(data: ControlDataModel) {
    if (this.itemConfig.autoSave) {
      this.saving = true;
      const showEditButtonStatus = this.showEditButton;
      this.showEditButton = false;
      let patchData = {
        [data.control]: data.data
      };
      const ifMatchKey = "*"; // this.headerData["@odata.etag"];
      this.restService.patch(this.itemConfig.headerConfig!.api + '(' + this.headerData[this.itemConfig.headerConfig!.idProp!] + ')', patchData, ifMatchKey).subscribe((response: any) => {
        this.headerData = response;
        this.saving = false;
        this.showEditButton = showEditButtonStatus;
        this.updateViewModeEnableControls();
        this.cdr.detectChanges();
      }, (error) => {
        this.saving = false;
        this.showEditButton = showEditButtonStatus;
        this.cdr.detectChanges();
      });
    }
  }



  leaveHeaderControl(data: ControlDataModel, control: FormField) {
    if (this.itemConfig.autoSave) {
      if (data.readonly) {
        this.headerData[data.control] = data.data;
      } else {
        this.saveHeaderData(data.data, control);
      }
    }

    this.leaveEvent.emit({
      data: this.headerFormGroup.value,
      valid: this.headerFormGroup.valid,
      section: SectionType.Header
    });
  }


  saveHeaderData(data: string, control: FormField) {
    if (this.headerFormGroup.valid && (this.headerData[control.label!] !== data || (data !== '' && data !== undefined && data !== null))) {
      let record = this.headerData;
      if (record[this.itemConfig.headerConfig!.idProp!]) {
        this.saving = true;
        const showEditButtonStatus = this.showEditButton;
        this.showEditButton = false;
        let patchData = {
          [control.label!]: data
        };
        patchData = this.utility.getHeaderControlsData(patchData, this.itemConfig.headerConfig!.controls!);
        const ifMatchKey = "*"; // this.headerData["@odata.etag"];
        this.restService.patch(this.itemConfig.headerConfig!.api! + '(' + this.headerData[this.itemConfig.headerConfig!.idProp!] + ')', patchData, ifMatchKey).subscribe((response: any) => {
          this.headerData = response;
          this.saving = false;
          this.showEditButton = showEditButtonStatus;
          this.updateViewModeEnableControls();
          this.cdr.detectChanges();
        }, (error) => {
          this.saving = false;
          this.showEditButton = showEditButtonStatus;
          this.cdr.detectChanges();
        });
      } else {
        record = this.headerFormGroup.value;
        record[control.label!] = data;
        record = this.utility.getHeaderControlsData(record, this.itemConfig.headerConfig!.controls!);
        this.saving = true;
        this.showEditButton = false;
        this.cdr.detectChanges();
        this.restService.post(this.itemConfig.headerConfig!.api!, record).subscribe((response: any) => {
          this.headerData = response;
          this.saving = false;
          this.showEditButton = true;
          this.cdr.detectChanges();

        }, (error) => {
          this.saving = false;
          this.showEditButton = true;
          this.cdr.detectChanges();
        });
      }
    } else {
      if (this.headerData[this.itemConfig.headerConfig!.idProp!]) {
        this.headerData[control.label!] = data;
      } else {
        this.headerData = this.headerFormGroup.value;
        this.headerData[control.label!] = data;
      }
    }
  }


  changeHeaderControl(data: ControlDataModel) {
    this.changeEvent.emit({
      control: data.control,
      data: data.data,
      dropdownData: data.dropdownData,
      dropdownItems: data.dropdownItems,
      activeData: this.headerData,
      section: SectionType.Header
    });
  }


  // --------------------------line----------------------------------

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
