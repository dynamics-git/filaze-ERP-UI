// import { Component, OnInit, Input, EventEmitter, Output, OnDestroy, ViewEncapsulation, ChangeDetectorRef, HostBinding, Optional, Host, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, EventEmitter, Output, OnDestroy, ViewEncapsulation, ChangeDetectorRef, HostBinding, Optional, Host, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgbModal, NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';
import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { FormField } from '../../../core/models/shared/formField';
import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { RestService } from '../../../core/services/rest.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { UpdateDropdownData } from '../../../core/models/shared/updateDropdownData';
import { EventDataModel } from '../../../core/models/shared/eventDataModel';
import { TargetField } from '../../../core/models/shared/targetField';
import { FieldItemType } from '../../../core/models/shared/fieldItemType';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { AttachmentsComponent } from '../attachments/attachments.component';
import { UniversalPopupService } from '../../../core/services/shared/universal-popup.service';
import { LookupCreateRegistry } from '../../../core/models/registry/lookup-create-registry';
import { ModuleRegistry } from '../../../core/models/registry/module-registry';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { DigitOnlyDirective } from '@uiowa/digit-only';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { AutofocusDirective } from '../../directives/autofocus.directive';
import { UppercaseInputDirective } from '../../directives/uppercase.directive';

@Component({
  standalone: true,
  selector: 'form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgSelectModule,
    NgxSkeletonLoaderModule,
    DigitOnlyDirective,
    AutofocusDirective,
    UppercaseInputDirective
  ]
})
export class FormFieldComponent implements OnInit, OnDestroy {
  private _textMaxLenght: number = environment.textLimitMax
  items: any[] = [];
  ready: boolean = false;
  _rowIndex: number = -1;
  public fieldType = FormFieldType;
  renderer: any;
  el: any;
  @Input() set rowIndex(value: number) {
    this._rowIndex = value;
  }
  @Input() control!: FormField;
  @Input() formGroup!: FormGroup;
  @Input() tableView: boolean = false;
  @Input() update: boolean = false;
  @Input() subPopupRowIndex?: number;

  @Input() set saving(value: boolean) {
    this._saving = !!value;
    this.syncControlState();
  }

  private _saving: boolean = false;
  private _viewMode: boolean = false;
  @Input() set viewMode(value: boolean) {
    this._viewMode = value;
    this.syncControlState();
  }

  private _disable: boolean = false;
  @Input() set disable(value: boolean) {
    this._disable = !!value;
    this.syncControlState();
  }

  private _hidden: boolean = false;


  @HostBinding('style.display') hostDisplay = '';
  @Input() set hidden(value: boolean) {
    if (value) {
      this.addItemService.showLoader$.next(true);
      this.hostDisplay = '';
      this._hidden = true;
      this.hostDisplay = 'none';
      setTimeout(() => {
        this.addItemService.showLoader$.next(false);
      }, 500);
    } else {
      this.addItemService.showLoader$.next(true);
      this._hidden = false;
      this.hostDisplay = '';
      setTimeout(() => {
        this.addItemService.showLoader$.next(false);
      }, 500);
    }
  }

  @Output() changeEvent = new EventEmitter<ControlDataModel>();
  @Output() leaveEvent = new EventEmitter<ControlDataModel>();
  @Output() fileUploaded = new EventEmitter<ControlDataModel>();
  @Output() dropdownItemsLoaded = new EventEmitter<any[]>();
  @Output() onClear = new EventEmitter<ControlDataModel>();
  @Output() dropdownOpend = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<any>();
  @Input() documentData!: any;
  @Input() documentType!: string;
  @Input() recordLineNo!: number;
  @Input() itemConfig!: any;


  protected dropdownApiCallDoneSubscription!: Subscription;
  protected updateDropdownItemSubscription!: Subscription;
  protected updateControlDataSubscription!: Subscription;
  protected updateLineControlDataSubscription!: Subscription;
  protected updateLineControlDataForSubPopupSubscription!: Subscription;
  protected updateControlsListDataSubscription!: Subscription;
  protected updateLineControlsListDataSubscription!: Subscription;
  protected disableControlSubscription!: Subscription;
  protected disableControlsListSubscription!: Subscription;
  protected setControlValidatorsSubscription!: Subscription;
  protected setControlListValidatorsSubscription!: Subscription;
  protected disableLineControlSubscription!: Subscription;
  protected disableLineControlsListSubscription!: Subscription;
  protected hideControlsListSubscription!: Subscription;
  //  protected hideLineControlsListSubscription!: Subscription;
  protected hideControlSubscription!: Subscription;
  protected setLineControlValidatorsSubscription!: Subscription;
  protected setLineControlListValidatorsSubscription!: Subscription;
  protected readonlyControlSubscription!: Subscription;
  protected readonlyControlsListSubscription!: Subscription;
  protected readonlyLineControlSubscription!: Subscription;
  protected readonlyLineControlslistSubscription!: Subscription;
  protected enableControlSubscription!: Subscription;
  protected enableControlsListSubscription!: Subscription;
  protected enableLineControlSubscription!: Subscription;
  protected enableLineControlsListSubscription!: Subscription;
  protected drawerDisableSubscription!: Subscription;

  pictureFormat: string = 'image/x-png,image/gif,image/jpeg,image/webp,image/bmp';
  imageSource!: string;
  fileSelected: boolean = false;
  file: any;
  private dropdownOpen = false;
  private dropdownSearchTerm = '';
  lookupListSearchTerm: string = '';
  private lookupListModalRef: any;
  @ViewChild('lookupListModal', { static: false }) lookupListModal?: TemplateRef<any>;
@ViewChild('lookupSelect', { static: false }) lookupSelect?: NgSelectComponent;

private readonly onDocumentScrollCapture = (event: Event) => {
  if (!this.dropdownOpen) {
    return;
  }

  const target = event.target as HTMLElement | null;
  if (target?.closest?.('.ng-dropdown-panel')) {
    return;
  }

  this.closeActiveDropdown();
};
  
  constructor(
    private restService: RestService,
    private modal: NgbModal,
    private formFielService: FormFieldService,
    private formDataService: FormDataService,
    private datepickerConfig: NgbDatepickerConfig,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private addItemService: AddItemService,
    private universalPopupService: UniversalPopupService,
    private dialogService: UnifiedDialogService,
  ) { }

  
  private syncControlState() {
    if (!this.control?.label || !this.formGroup?.controls) {
      return;
    }

    const control = this.formGroup.controls[this.control.label] as FormControl | undefined;
    if (!control) {
      return;
    }

    if (this._disable || this._viewMode) {
      if (control.enabled) {
        control.disable({ emitEvent: false });
      }
    } else {
      if (control.disabled) {
        control.enable({ emitEvent: false });
      }
    }
  }

ngOnInit() {


    
    this._textMaxLenght = environment.textLimitMax;
    if (this.control.type == 0) {
      this.control.maxlength = this._textMaxLenght;
    }



    if (this.control.unique) {
      this.formControl.setAsyncValidators(this.isUniqueData.bind(this));
    }

    if (this.control.dataExists) {
      this.formControl.setAsyncValidators(this.isDataExists.bind(this));
    }

    if (this.control.type === FormFieldType.FileUpload) {
      if (this.control.fileAcceptFromats === undefined || this.control.fileAcceptFromats === null || this.control.fileAcceptFromats === '') {
        this.control.fileAcceptFromats = ".doc,.docx,.pdf,.xls,.xlsx,.jpeg,.png,.ppt,.pptx,.gif,.zip";
      }
    }

    this.items = this.control.items!;
    this.updateDropdownItemSubscription = this.formFielService.updateDropdownItem$.subscribe((data: UpdateDropdownData) => {
      if ((data.rowIndex !== null && data.rowIndex !== undefined && data.label === this.control.label && this._rowIndex === data.rowIndex)
        || ((data.rowIndex === null || data.rowIndex === undefined) && data.label === this.control.label)) {
        this.control.bindLabel = data.bindLabel;
        this.control.bindValue = data.bindValue;
        this.control.displayFormat = data.displayFormat;
        if (data.displayFormat) {
          // this.items = this.buildDropdownItems(data.items, this.control.displayFormat!);
          this.items = [...this.buildDropdownItems(data.items, this.control.displayFormat!)];
        } else {
          // this.items = data.items;
          this.items = [...data.items];
        }
      }
       this.control.items = this.items;
    });

    this.updateControlDataSubscription = this.formDataService.updateControlData$.subscribe((data: EventDataModel) => {
      if (data.control === this.control.label) {
        this.formControl.setValue(data.data);
        if (data.eventEmit) {
          this.changeControl();
          this.leaveControl();
        }
      }
    });

    this.updateLineControlDataSubscription = this.formDataService.updateLineControlData$.subscribe((data: EventDataModel) => {
      if (data.control === this.control.label && data.rowIndex === this._rowIndex) {
        this.formControl.setValue(data.data);
        if (data.eventEmit) {
          this.changeControl();
          this.leaveControl();
        }
      }
    });

    // this.updateLineControlDataForSubPopupSubscription = this.formDataService.updateLineControlDataForSubPopup$.subscribe((data: EventDataModel) => {
    //   if (data.control === this.control.label && data.rowIndex === this._rowIndex) {
    //     this.formControl.setValue(data.data);
    //     if (data.eventEmit) {
    //       this.changeControl();
    //       this.leaveControl();
    //     }
    //   }
    // });

    this.updateLineControlDataForSubPopupSubscription =
      this.formDataService.updateLineControlDataForSubPopup$
        .subscribe((data: EventDataModel) => {

          // determine row index context (normal or sub-popup)
          const activeRowIndex = this.subPopupRowIndex ?? this._rowIndex;

          if (data.control === this.control.label && data.rowIndex === activeRowIndex) {
            this.formControl.setValue(data.data);

            if (data.eventEmit) {
              this.changeControl();
              this.leaveControl();
            }
          }
        });




    this.updateControlsListDataSubscription = this.formDataService.updateControlsListData$.subscribe((items: EventDataModel[]) => {
      items.forEach((item: EventDataModel) => {
        if (item.control === this.control.label) {
          this.formControl.setValue(item.data);
          if (item.eventEmit) {
            this.changeControl();
            this.leaveControl();
          }
        }
      });
    });

    this.updateLineControlsListDataSubscription = this.formDataService.updateLineControlsListData$.subscribe((items: EventDataModel[]) => {
      items.forEach((item: EventDataModel) => {
        if (item.control === this.control.label && item.rowIndex === this._rowIndex) {
          this.formControl.setValue(item.data);
          if (item.eventEmit) {
            this.changeControl();
            this.leaveControl();
          }
        }
      });
    });

    this.disableControlSubscription = this.formDataService.disableControl$.subscribe((label: string) => {
      if (label === this.control.label) {
        this._disable = true;
        this.formControl.disable();
      }
    });

    this.disableControlsListSubscription = this.formDataService.disableControlsList$.subscribe((labels: string[]) => {
      labels.forEach((label: string) => {
        if (label === this.control.label) {
          this._disable = true;
          this.formControl.disable();
        }
      });
    });

    this.setControlValidatorsSubscription = this.formDataService.setControlValidators$.subscribe((data: { lablel: string, required: boolean }) => {
      if (data.lablel === this.control.label) {
        this.setControlValidators(data.required);
      }
    });

    this.setControlListValidatorsSubscription = this.formDataService.setControlListValidators$.subscribe((list: { lablel: string, required: boolean }[]) => {
      list.forEach((data: { lablel: string, required: boolean }) => {
        if (data.lablel === this.control.label) {
          this.setControlValidators(data.required);
        }
      });
    });

    this.disableLineControlSubscription = this.formDataService.disableLineControl$.subscribe((data: { label: string, rowIndex: number, clearValue?: boolean }) => {
      if (data.rowIndex === this._rowIndex && data.label === this.control.label) {
        if (data.clearValue) {
          this.formControl.setValue(null, { emitEvent: false });
        }
        this._disable = true;
        this.formControl.disable();
      }
    });

    this.disableLineControlsListSubscription = this.formDataService.disableLineControlsList$.subscribe((records: { label: string, rowIndex: number, clearValue?: boolean }[]) => {
      records.forEach((record: { label: string, rowIndex: number, clearValue?: boolean }) => {
        if (record.rowIndex === this._rowIndex && record.label === this.control.label) {
          if (record.clearValue) {
            this.formControl.setValue(null, { emitEvent: false });
          }
          this._disable = true;
          this.formControl.disable();
        }
      });
    });

    // TMY/Subhankar/12.09.25/ function for hide line control list
    // this.hideLineControlsListSubscription = this.formDataService.hideLineControlsList$.subscribe((records: { label: string, rowIndex: number }[]) => {
    //   records.forEach((record) => {
    //     if (record.rowIndex === this._rowIndex && record.label === this.control.label) {
    //       this.hidden = true;
    //       this.control.hidden = true;
    //     }
    //   });
    // });

    // TMY/Subhankar/12.09.25/ function for hide control list
    this.hideControlSubscription =
      this.formDataService.hideControl$.subscribe((label: string) => {
        if (this.control.label && this.control.label === label) {
          this.hidden = true;
          this.control.hidden = true;
        }
      });

    // TMY/Subhankar/12.09.25/ function for hide control list
    this.hideControlsListSubscription =
      this.formDataService.hideControlsList$.subscribe((labels: string[]) => {
        const label = this.control.label;
        if (label && labels.includes(label)) {
          this.hidden = true;
          this.control.hidden = true;
        }

      });


    this.setLineControlValidatorsSubscription = this.formDataService.setLineControlValidators$.subscribe((data: { label: string, rowIndex: number, required: boolean }) => {
      if (data.rowIndex === this._rowIndex && data.label === this.control.label) {
        this.setControlValidators(data.required);
      }
    });

    this.setLineControlListValidatorsSubscription = this.formDataService.setLineControlListValidators$.subscribe((records: { label: string, rowIndex: number, required: boolean }[]) => {
      records.forEach((record: { label: string, rowIndex: number, required: boolean }) => {
        if (record.rowIndex === this._rowIndex && record.label === this.control.label) {
          this.setControlValidators(record.required);
        }
      });
    });

    this.readonlyControlSubscription = this.formDataService.readonlyControl$.subscribe((label: string) => {
      if (label === this.control.label) {
        this.control.readonly = true;
      }
    });

    this.readonlyControlsListSubscription = this.formDataService.readonlyControlsList$.subscribe((labels: string[]) => {
      labels.forEach((label: string) => {
        if (label === this.control.label) {
          this.control.readonly = true;
        }
      });
    });

    this.readonlyLineControlSubscription = this.formDataService.readonlyLineControl$.subscribe((data: { label: string, rowIndex: number }) => {
      if (data.rowIndex === this._rowIndex && data.label === this.control.label) {
        this.control.readonly = true;
      }
    });

    this.readonlyLineControlslistSubscription = this.formDataService.readonlyLineControlslist$.subscribe((records: { label: string, rowIndex: number }[]) => {
      records.forEach((record: { label: string, rowIndex: number }) => {
        if (record.rowIndex === this._rowIndex && record.label === this.control.label) {
          this.control.readonly = true;
        }
      });
    });

    this.enableControlSubscription = this.formDataService.enableControl$.subscribe((label: string) => {
      if (!this._viewMode && label === this.control.label) {
        this._disable = false;
        this.formControl.enable();
      }
    });

    this.enableControlsListSubscription = this.formDataService.enableControlsList$.subscribe((labels: string[]) => {
      if (!this._viewMode) {
        labels.forEach((label: string) => {
          if (label === this.control.label) {
            this._disable = false;
            this.formControl.enable();
          }
        });
      }
    });

    this.enableLineControlSubscription = this.formDataService.enableLineControl$.subscribe((data: { label: string, rowIndex: number }) => {
      if (!this._viewMode && data.rowIndex === this._rowIndex && data.label === this.control.label) {
        this._disable = false;
        this.formControl.enable();
      }
    });

    this.enableLineControlsListSubscription = this.formDataService.enableLineControlsList$.subscribe((records: { label: string, rowIndex: number }[]) => {
      if (!this._viewMode) {
        records.forEach((record: { label: string, rowIndex: number }) => {
          if (record.rowIndex === this._rowIndex && record.label === this.control.label) {
            this._disable = false;
            this.formControl.enable();
          }
        });
      }
    });

    if (this.control && this.control.type === this.fieldType.DropDown) {

      if (this.control.apiUrl) {
        this.dropdownApiCallDoneSubscription = this.formDataService.dropdownApiCallDone$.subscribe(() => {
          const cacheData = this.formDataService.GetDropDownApiDataCache(this.control.apiUrl!);
          if (cacheData) {
            if (this.control.displayFormat) {
              this.items = this.buildDropdownItems(cacheData.data, this.control.displayFormat);
            } else {
              this.items = cacheData.data;
            }
            if (!this.update && this.control.initialValue) {
              this.formControl.setValue(this.control.initialValue);
            }
            this.dropdownItemsLoaded.emit(this.items);
            this.ready = true;
            this.cdr.detectChanges();
          }
        });
        this.getDropdownItems(this.control.initialValue);
      } else {
        if (!this.update && this.control.initialValue) {
          this.formControl.setValue(this.control.initialValue);
        }
        this.ready = true;
        this.cdr.detectChanges();
      }
    } else if (this.control.type === this.fieldType.DateTime) {
      const current = new Date();
      if (this.control.disablePastDays === true) {
        this.datepickerConfig.minDate = {
          year: current.getFullYear(),
          month: current.getMonth() + 1,
          day: current.getDate()
        };
        this.datepickerConfig.outsideDays = 'hidden';
      }

      if (this.control.disableFutureDays === true) {
        this.datepickerConfig.maxDate = {
          year: current.getFullYear(), month:
            current.getMonth() + 1, day: current.getDate()
        };
        this.datepickerConfig.outsideDays = 'hidden';
      }

      if (this.control.showDropdownPopup === false) {
      } else {
        this.control.showDropdownPopup = true;
      }
      if (this.control.defaultSystemDate === true && !this.formControl.value) {
        const current = new Date();
        this.formControl.setValue({
          year: current.getFullYear(),
          month: current.getMonth() + 1,
          day: current.getDate()
        });
      }
      this.ready = true;
      this.cdr.detectChanges();
    } else {
      if (!this.update && this.control.initialValue) {
        this.formControl.setValue(this.control.initialValue);
      }

      this.ready = true;
      this.cdr.detectChanges();
    }

    // if (this.control.type === FormFieldType.DropDown) {
    //   if (this.formControl) {
    //     this.formControl.valueChanges.subscribe(() => {
    //       if (this.control.target) {
    //         this.control.target.forEach((target: TargetField) => {
    //           this.fillDropdownItem(target);
    //         });
    //       }
    //       this.changeEvent.emit(this.control.label);
    //       this.leaveEvent.emit();
    //     });
    //   }
    // }
      document.addEventListener('scroll', this.onDocumentScrollCapture, true);
  }

 
 
  get formControl() { return this.formGroup.controls[this.control.label!] as FormControl; }

  setControlValidators(required: boolean) {
    if (required) {
      this.formControl.setValidators([Validators.required]);
    } else {
      if (this.control.type === FormFieldType.Email) {
        this.formControl.setValidators([Validators.email]);
      } else {
        this.formControl.setValidators([]);
      }
    }
  }

  getDropdownItems(value: string) {
    const cacheData = this.formDataService.GetDropDownApiDataCache(this.control.apiUrl!);
    if (cacheData) {
      if (this.control.displayFormat) {
        this.items = this.buildDropdownItems(cacheData.data, this.control.displayFormat);
      } else {
        this.items = cacheData.data;
      }
      if (!this.update && this.control.initialValue) {
        this.formControl.setValue(this.control.initialValue);
      }
      this.ready = true;
    } else {
      if (!this.formDataService.dropDownApisPosted.includes(this.control.apiUrl!)) {
        this.addItemService.showDropdownAPICallLoader$.next(true); // TMY/ Subhankar/11.08.25/add loader to dropdown api call start 
        this.formDataService.dropDownApisPosted.push(this.control.apiUrl!);
        this.restService.get(this.control.apiUrl!).subscribe((response: any) => {
          let apiData = [];
          if (response.value) {
            if (this.control.displayFormat) {
              this.items = this.buildDropdownItems(response.value, this.control.displayFormat);
            } else {
              this.items = response.value;
            }
            apiData = response.value;
          } else {
            apiData = [];
            this.items = [];
          }

          this.formDataService.SetDropDownApiDataCache({
            url: this.control.apiUrl,
            data: apiData
          });
          this.formDataService.dropdownApiCallDone$.next();

          if (!this.update && value) {
            this.formControl.setValue(value);
          }
          this.ready = true;
          this.addItemService.showDropdownAPICallLoader$.next(false); // TMY/ Subhankar/11.08.25/ add loader to dropdown api call stop
        }, error => {
          this.items = [];
          this.ready = true;
          this.addItemService.showDropdownAPICallLoader$.next(false); //TMY/ Subhankar/ 11.08.25/  add loader to dropdown api call stop
        });
      }
    }
  }

  buildDropdownItems(data: any[], format: string): any[] {
    data.forEach((item: any) => {
      let value: string = format;
      for (let key in item) {
        if (item[key]) {
          value = value.replace('[' + key + ']', item[key]);
        } else {
          value = value.replace('[' + key + ']', '');
        }
      }

      item.displayValue = value;
    });

    this.control.bindLabel = 'displayValue';
    return data;
  }

  changeDropdown(data: any) {
    if (this.control.target) {
      this.control.target.forEach((target: TargetField) => {
        this.fillDropdownItem(target);
      });
    }
    this.changeEvent.emit({
      control: this.control.label!,
      data: data[this.control.bindValue!],
      dropdownData: data,
      dropdownItems: this.items
    });
    this.leaveEvent.emit({
      control: this.control.label!,
      data: data[this.control.bindValue!],
      dropdownData: data,
      dropdownItems: this.items,
      readonly: this.control.readonly
    });
  }

  clearDropdown() {
    this.onClear.emit({
      control: this.control.label!,
      data: null,
      dropdownData: null,
      dropdownItems: this.items
    })
  }

  canShowLookupAssistAction(): boolean {
    if (this.control.lookupDropdown === false) {
      return false;
    }

    const enabled = this.control.lookup !== false;
    return enabled
      && !!this.control.apiUrl
      && !this.control.readonly
      && !this.formControl.disabled;
  }

  canShowLookupCreateAction(): boolean {
    return !!this.getLookupCreateConfig()
      && this.control.lookupAllowCreate !== false
      && this.control.lookupDropdown !== false
      && !this.control.readonly
      && !this.formControl.disabled;
  }

  canShowLookupDetailsAction(): boolean {
    return !!this.getLookupCreateConfig()
      && !!this.control.bindValue
      && !!this.formControl.value
      && this.control.lookupDropdown !== false;
  }

  canShowLookupDropdownActions(): boolean {
    return this.canShowLookupAssistAction() || this.canShowLookupCreateAction() || this.canShowLookupDetailsAction();
  }

  getLookupCreateLabel(): string {
    const defaultLabel = 'Add New';
    const label = this.control.lookupCreateLabel || defaultLabel;
    const term = this.dropdownSearchTerm.trim();
    return term ? `${label}: ${term}` : label;
  }

  onDropdownSearch(event: { term?: string }): void {
    this.dropdownSearchTerm = (event?.term || '').trim();
  }

   openLookupListModal(): void {
    if (!this.lookupListModal || !this.canShowLookupAssistAction()) {
      return;
    }

    this.closeActiveDropdown();
    this.lookupListSearchTerm = this.dropdownSearchTerm;

    this.lookupListModalRef = this.modal.open(this.lookupListModal, {
      size: this.control.lookupPopupSize || 'xl',
      backdrop: 'static',
      windowClass: 'modal-dialog-scrollable lookup-list-modal'
    });
  }

  closeLookupListModal(): void {
    this.lookupListSearchTerm = '';
    if (this.lookupListModalRef) {
      this.lookupListModalRef.close();
      this.lookupListModalRef = null;
    }
  }

  getLookupListItems(): any[] {
    const sourceItems = this.items || [];
    const term = (this.lookupListSearchTerm || '').trim().toLowerCase();

    if (!term) {
      return sourceItems;
    }

    return sourceItems.filter((item: any) => this.getLookupDisplayText(item).toLowerCase().includes(term));
  }

  getLookupDisplayText(item: any): string {
    if (!item) {
      return '';
    }

    const labelKey = this.control.bindLabel || 'displayValue';
    return String(item?.[labelKey] ?? item?.displayValue ?? '');
  }

  selectLookupListItem(item: any): void {
    if (!item) {
      return;
    }

    const selectedValue = this.getRecordBindValue(item);
    if (selectedValue === undefined || selectedValue === null) {
      return;
    }

    this.applyLookupSelection(item, selectedValue);
    this.closeLookupListModal();
  }

  openLookupCreatePopup(): void {
    const lookupConfig = this.getLookupCreateConfig();
    if (!lookupConfig) {
      return;
    }

    this.closeActiveDropdown();

    const modalRef = this.universalPopupService.openCreateItem(lookupConfig, {
      headerData: this.getLookupSeedData(lookupConfig),
      closeAfterCreate: true,
      size: this.control.lookupPopupSize || 'xl'
    });

    if (!modalRef) {
      return;
    }

    modalRef.result.then((result: any) => {
      if (result?.action === 'Create' && result.record) {
        this.handleLookupCreateResult(result.record);
        this.closeLookupListModal();
      }
    }, () => { });
  }

   openLookupDetailsPopup(): void {
    const lookupConfig = this.getLookupCreateConfig();
    if (!lookupConfig || !this.control.bindValue || !this.formControl.value) {
      return;
    }

    this.closeActiveDropdown();

    const selectedItem = this.findLookupItemByValue(this.formControl.value);

    if (selectedItem) {
      this.universalPopupService.openItemCardByField(
        lookupConfig,
        this.control.bindValue,
        this.formControl.value,
        {
          size: this.control.lookupPopupSize || 'xl',
          headerData: selectedItem
        }
      );
    } else {
      this.universalPopupService.openItemCardByField(
        lookupConfig,
        this.control.bindValue,
        this.formControl.value,
        { size: this.control.lookupPopupSize || 'xl' }
      );
    }
  }

  private getLookupCreateConfig(): any {
    if (this.control.lookupCreateConfig) {
      return this.control.lookupCreateConfig;
    }

    const moduleConfig = this.getLookupCreateConfigFromModuleRegistry();
    if (moduleConfig) {
      return moduleConfig;
    }

    const registeredConfig = this.getLookupCreateConfigFromRegistry();
    if (registeredConfig) {
      return registeredConfig;
    }

    return this.buildAutoLookupCreateConfig();
  }

  private getLookupCreateConfigFromRegistry(): any {
    const api = this.normalizeLookupApi(this.control.apiUrl);
    if (!api) {
      return null;
    }

    const config = LookupCreateRegistry[api];
    if (!config) {
      return null;
    }

    return JSON.parse(JSON.stringify(config));
  }

  private getLookupCreateConfigFromModuleRegistry(): any {
    const api = this.normalizeLookupApi(this.control.apiUrl);
    if (!api) {
      return null;
    }

    const entries = Object.values(ModuleRegistry || {});
    for (const entry of entries) {
      if (!entry || typeof entry.getCardConfig !== 'function') {
        continue;
      }

      const cardConfig = entry.getCardConfig?.();
      const headerApi = this.normalizeLookupApi(cardConfig?.headerConfig?.api);
      if (!headerApi || headerApi !== api) {
        continue;
      }

      return JSON.parse(JSON.stringify(cardConfig));
    }

    return null;
  }

  private normalizeLookupApi(apiUrl?: string): string {
    if (!apiUrl) {
      return '';
    }

    const [pathOnly] = apiUrl.split('?');
    return (pathOnly || '').trim().replace(/\/+$/, '');
  }

  private buildAutoLookupCreateConfig(): any {
    if (!this.control.apiUrl || !this.control.bindValue) {
      return null;
    }

    const fields = this.getAutoCreateFields();
    if (!fields.length) {
      return null;
    }

    const controls = fields.map((field) => ([{
      type: FormFieldType.TextBox,
      label: field,
      name: this.toFieldCaption(field),
      required: field === this.control.bindValue,
      maxlength: field === this.control.bindValue ? 50 : 255
    }]));

    return {
      title: this.control.name || 'New Item',
      recordId: this.control.bindValue,
      recordTitle: this.control.bindLabel || this.control.bindValue,
      headerConfig: {
        id: 'add',
        idProp: this.control.bindValue,
        api: this.control.apiUrl,
        title: this.control.name || 'New Item',
        controls,
        sections: [
          {
            title: 'General Information',
            controls
          }
        ]
      }
    };
  }

  private getAutoCreateFields(): string[] {
    const firstItem = (this.items || []).find((item: any) => item && typeof item === 'object');
    if (!firstItem) {
      return [this.control.bindValue!].filter(Boolean);
    }

    const fromDisplay = this.getDisplayFormatFields(this.control.displayFormat || '');
    const preferred = [this.control.bindValue, this.control.bindLabel, ...fromDisplay].filter(Boolean) as string[];

    const primitiveKeys = Object.keys(firstItem).filter((key) => {
      if (key.startsWith('@') || key === 'displayValue') {
        return false;
      }

      const value = firstItem[key];
      return ['string', 'number', 'boolean'].includes(typeof value);
    });

    const merged = [...new Set([...preferred, ...primitiveKeys])];
    return merged.slice(0, 8);
  }

  private getDisplayFormatFields(format: string): string[] {
    const matches = [...format.matchAll(/\[([^\]]+)\]/g)];
    return matches.map((match) => (match[1] || '').trim()).filter(Boolean);
  }

  private toFieldCaption(field: string): string {
    return field
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .trim();
  }

  private getLookupSeedData(lookupConfig: any): any {
    const seedField = this.control.lookupSeedField || lookupConfig?.recordTitle;
    const term = this.dropdownSearchTerm.trim();

    if (!seedField || !term) {
      return {};
    }

    return { [seedField]: term };
  }

  private handleLookupCreateResult(record: any): void {
    const selectedValue = this.getRecordBindValue(record);
    if (selectedValue === undefined || selectedValue === null || selectedValue === '') {
      console.warn('Form-field: Created record missing bindValue', this.control.bindValue, record);
      return;
    }

    // Ensure the record has complete structure for potential later detail view
    const completeRecord = { ...record, ...this.getLookupSeedData(this.getLookupCreateConfig()) };

    const refreshStrategy = this.control.lookupRefreshStrategy || 'reload';
    if (refreshStrategy === 'reload' && this.control.apiUrl) {
      this.reloadLookupItems(completeRecord, selectedValue);
      return;
    }

    this.appendLookupItem(completeRecord);
    this.applyLookupSelection(completeRecord, selectedValue);
  }

  private reloadLookupItems(record: any, selectedValue: any): void {
    if (!this.control.apiUrl) {
      this.appendLookupItem(record);
      this.applyLookupSelection(record, selectedValue);
      return;
    }

    this.addItemService.showDropdownAPICallLoader$.next(true);
    this.restService.get(this.control.apiUrl).subscribe({
      next: (response: any) => {
        const items = response?.value || response?.model || response || [];
        this.replaceDropdownItems(items);
        
        // Check if newly created item is in the refreshed list
        if (!this.findLookupItemByValue(selectedValue)) {
          // If not found, add it from the creation response to ensure it's available
          this.appendLookupItem(record);
        }
        
        this.applyLookupSelection(record, selectedValue);
        this.addItemService.showDropdownAPICallLoader$.next(false);
      },
      error: (error) => {
        console.error('Form-field: Error reloading lookup items', error);
        // On error, still try to use the created record
        this.appendLookupItem(record);
        this.applyLookupSelection(record, selectedValue);
        this.addItemService.showDropdownAPICallLoader$.next(false);
      }
    });
  }

  private appendLookupItem(record: any): void {
    const bindKey = this.control.bindValue || this.control.bindLabel;
    if (!bindKey) {
      return;
    }

    const items = [...(this.items || [])];
    const existingIndex = items.findIndex((item: any) => item?.[bindKey] === record?.[bindKey]);

    if (existingIndex >= 0) {
      items[existingIndex] = record;
    } else {
      items.push(record);
    }

    this.replaceDropdownItems(items);
  }

  private findLookupItemByValue(selectedValue: any): any {
    const bindKey = this.control.bindValue || this.control.bindLabel;
    if (!bindKey) {
      return null;
    }

    return (this.items || []).find((item: any) => item?.[bindKey] === selectedValue);
  }

  private replaceDropdownItems(items: any[]): void {
    const nextItems = this.control.displayFormat
      ? [...this.buildDropdownItems([...items], this.control.displayFormat)]
      : [...items];

    this.items = nextItems;
    this.control.items = nextItems;
    this.cdr.detectChanges();
  }

  private applyLookupSelection(record: any, selectedValue: any): void {
    this.formControl.setValue(selectedValue);
    this.changeEvent.emit({
      control: this.control.label!,
      data: selectedValue,
      dropdownData: record,
      dropdownItems: this.items
    });
    this.leaveEvent.emit({
      control: this.control.label!,
      data: selectedValue,
      dropdownData: record,
      dropdownItems: this.items,
      readonly: this.control.readonly
    });
    this.dropdownSearchTerm = '';
  }

  private getRecordBindValue(record: any): any {
    const bindKey = this.control.bindValue || this.control.bindLabel;
    return bindKey ? record?.[bindKey] : undefined;
  }

  fillDropdownItem(target: TargetField) {
    if (target.type === FormFieldType.DropDown) {
      const dropdown = this.formGroup.controls[target.label];
      if (dropdown) {
        const item: FieldItemType = this.items.filter((i: any) => i[this.control.bindLabel!] === this.formControl.value)[0];
        if (item) {
          this.restService.get(item.api!).subscribe((response: any) => {
            if (response.model) {
              this.formFielService.updateDropdownItem$.next({
                label: target.label,
                items: response.model,
                bindLabel: item.bindLabel,
                bindValue: item.bindValue!,
                rowIndex: this._rowIndex
              });
            }
          });
        }
      }
    }
  }

  onDateSelect() {
    this.changeEvent.emit({
      control: this.control.label!,
      data: this.formControl.value
    });

    this.leaveEvent.emit({
      control: this.control.label!,
      data: this.formControl.value
    });
  }


  changeControl() {
    if (this.control.type === FormFieldType.DateTime) {
      this.changeEvent.emit({
        control: this.control.label!,
        data: this.formControl.value
      });
      this.leaveControl();
    } if (this.control.type === this.fieldType.Radio) {
      this.changeEvent.emit({
        control: this.control.label!,
        data: this.formControl.value
      });
      this.leaveControl();
    }
    else {
      this.changeEvent.emit({
        control: this.control.label!,
        data: this.formControl.value
      });
    }
  }

  leaveControl() {
    this.leaveEvent.emit({
      control: this.control.label!,
      data: this.formControl.value,
      readonly: this.control.readonly
    });
  }

  selectDropdownItem() {
    this.openLookupListModal();
  }

  isDataExists(control: AbstractControl): Observable<ValidationErrors | null> {
    if (control.value) {
      return this.restService.get(this.control.dataExistsApi + '=' + control.value)
        .pipe(
          map((response: any) => {
            if (response.status && response.model) {
              return null;
            } else {
              return {
                notexists: true
              };
            }
          })
        );
    } else {
      return of(null);
    }
  }

  isUniqueData(control: AbstractControl): Observable<ValidationErrors | null> {
    if (control.value) {
      return this.restService.get(this.control.uniqueApiUrl + '=' + control.value)
        .pipe(
          map((response: any) => {
            if (response.status && response.model) {
              return {
                unique: true
              };
            } else {
              return null;
            }
          })
        );
    } else {
      return of(null);
    }
  }

  onImageSelection(event: any) {
    if (event.target.files && event.target.files[0]) {
      const image = event.target.files[0];
      const mimeType = image.type;

      if (mimeType.match(/image\/*/)) {
        const reader = new FileReader();
        reader.onload = (fileReaderEvent: any) => {
          // called once readAsDataURL is completed
          this.imageSource = fileReaderEvent.target.result;
        };

        // read file as data url
        reader.readAsDataURL(image);
        this.formControl.setValue(image);
      } else {
        this.toastr.warning('Please select the image file to upload!');
      }
    }
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const mimeType = file.type;
      const fileFormats = [
        'application/pdf',
        'application/msword',
        'application/powerpoint',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'image/x-png',
        'image/gif',
        'application/x-zip-compressed'
      ];
      if (fileFormats.includes(mimeType)) {
        this.fileSelected = true;
        this.file = file;
      } else {
        this.toastr.warning('Please select document file to upload!');
      }
    }
  }

  replaceSpecialChars(url: string) {
    return url.replace('‎', '');
  }

  openFile(url: string, value: any) {
    console.log(value);
    url = url.replace('‎', '');
    const a = document.createElement('a')
    a.href = url;
    a.download = url.split('/').pop()!;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async onFileUpload() {
    if (this.file) {
      const acknowledged = await this.dialogService.message({
        title: 'Information',
        message: 'Before upload please check your document. Once upload user will not be allow to delete document'
      });

      if (!acknowledged) {
        return;
      }

      this.restService.fileUpload(this.file).subscribe((res: any) => {
        this.formControl.setValue({
          name: this.file.name.split('.')[0],
          url: res.file,
          extension: this.file.name.split('.')[1]
        });
        this.fileUploaded.next({
          control: this.control.label!,
          data: res.file,
          file: this.file
        });
        this.fileSelected = false;
        this.toastr.success('File uploaded successfully');
      }, error => {
        this.toastr.error('Failed to upload file');
      });
    }
  }


  OpenLineAttachment() {
    const modalRef = this.modal.open(AttachmentsComponent, { size: 'lg', windowClass: 'attachment-modal', backdrop: 'static' });
    modalRef.componentInstance.documentNo = this.documentData[this.itemConfig!.informationSectionConfig!.documentNoProp!];
    modalRef.componentInstance.documentType = this.documentType;
    modalRef.componentInstance.recordLineNo = this.recordLineNo;
    modalRef.componentInstance.itemConfig = this.itemConfig;
    modalRef.componentInstance.inModal = true;
  }

  clearFile() {
    this.file = null;
    this.fileSelected = false;
  }

private closeActiveDropdown(): void {
  this.lookupSelect?.close();
  this.dropdownOpen = false;
  this.dropdownSearchTerm = '';
  this.cdr.detectChanges();
}
  onDropdownOpen() {
    this.dropdownOpen = true;
    this.dropdownSearchTerm = '';
    this.dropdownOpend.emit({
      control: this.control.label!,
      data: this.formControl.value,
      dropdownItems: this.items,
      rowIndex: this._rowIndex
    });
  }

  onDropdownClose() {
    this.dropdownOpen = false;
    this.dropdownSearchTerm = '';
  }

  onFieldKeydown(event: KeyboardEvent, kind: 'input' | 'dropdown' | 'checkbox' = 'input') {
    if (!this.tableView || this._rowIndex < 0) return;
    if (this.control.readonly || this.formControl.disabled) return;

    if (kind === 'dropdown' && this.dropdownOpen) {
      return;
    }

    const key = event.key;

    if (key === 'Enter') {
      event.preventDefault();
      this.moveHorizontal(event, 1);
      return;
    }

    if (key === 'ArrowDown') {
      event.preventDefault();
      this.moveVertical(event, 1);
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      this.moveVertical(event, -1);
      return;
    }

    if (kind === 'checkbox' || kind === 'dropdown') {
      if (key === 'ArrowLeft') {
        event.preventDefault();
        this.moveHorizontal(event, -1);
      } else if (key === 'ArrowRight') {
        event.preventDefault();
        this.moveHorizontal(event, 1);
      }
      return;
    }

    if (key === 'ArrowLeft' && this.shouldMoveLeft(event.target)) {
      event.preventDefault();
      this.moveHorizontal(event, -1);
      return;
    }

    if (key === 'ArrowRight' && this.shouldMoveRight(event.target)) {
      event.preventDefault();
      this.moveHorizontal(event, 1);
    }
  }

  private shouldMoveLeft(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return true;
    }

    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    return start === 0 && end === 0;
  }

  private shouldMoveRight(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return true;
    }

    const valueLength = target.value?.length ?? 0;
    const start = target.selectionStart ?? valueLength;
    const end = target.selectionEnd ?? valueLength;
    return start === valueLength && end === valueLength;
  }

  private moveHorizontal(event: KeyboardEvent, offset: number) {
    const current = this.getCurrentNavElement(event.target);
    if (!current) return;

    const root = this.getNavigationRoot(event.target);
    const row = current.getAttribute('data-nav-row');
    if (row === null) return;

    const targets = this.getRowTargets(root, row);
    const currentIndex = targets.findIndex(el => el === current);
    if (currentIndex === -1) return;

    const next = targets[currentIndex + offset];
    if (next) {
      this.focusNavigationTarget(next);
    }
  }

  private moveVertical(event: KeyboardEvent, offset: number) {
    const current = this.getCurrentNavElement(event.target);
    if (!current) return;

    const controlLabel = current.getAttribute('data-nav-control');
    const rowValue = current.getAttribute('data-nav-row');
    if (!controlLabel || rowValue === null) return;

    const currentRow = Number(rowValue);
    if (!Number.isFinite(currentRow)) return;

    const root = this.getNavigationRoot(event.target);
    const allTargets = Array.from(root.querySelectorAll('[data-nav-control][data-nav-row]'))
      .filter((el): el is HTMLElement => el instanceof HTMLElement)
      .filter(el => el.getAttribute('data-nav-control') === controlLabel)
      .filter(el => this.isNavigationTargetAvailable(el))
      .sort((a, b) => Number(a.getAttribute('data-nav-row')) - Number(b.getAttribute('data-nav-row')));

    const next = offset > 0
      ? allTargets.find(el => Number(el.getAttribute('data-nav-row')) > currentRow)
      : [...allTargets].reverse().find(el => Number(el.getAttribute('data-nav-row')) < currentRow);

    if (next) {
      this.focusNavigationTarget(next);
    }
  }

  private getNavigationRoot(target: EventTarget | null): ParentNode {
    const element = target instanceof HTMLElement ? target : null;
    return element?.closest('.modal-content') || document;
  }

  private getCurrentNavElement(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) return null;
    return target.closest('[data-nav-row][data-nav-control]') as HTMLElement | null;
  }

  private getRowTargets(root: ParentNode, row: string): HTMLElement[] {
    return Array.from(root.querySelectorAll(`[data-nav-row="${row}"][data-nav-control]`))
      .filter((el): el is HTMLElement => el instanceof HTMLElement)
      .filter(el => this.isNavigationTargetAvailable(el));
  }

  private isNavigationTargetAvailable(el: HTMLElement): boolean {
    const disabled = el.getAttribute('disabled') !== null || el.getAttribute('aria-disabled') === 'true';
    const hidden = el.getAttribute('aria-hidden') === 'true' || el.offsetParent === null;
    return !disabled && !hidden;
  }

  private focusNavigationTarget(el: HTMLElement) {
    const isNgSelectHost = el.tagName.toLowerCase() === 'ng-select' || el.classList.contains('ng-select');

    if (isNgSelectHost) {
      const input = el.querySelector('input') as HTMLInputElement | null;
      if (input) {
        input.focus();
        return;
      }
    }

    el.focus();

    if (el instanceof HTMLInputElement && !el.readOnly) {
      const length = el.value?.length ?? 0;
      try {
        el.setSelectionRange(length, length);
      } catch {}
    }
  }

  getValue(option: any, key?: string): any {
    if (!option || !key) return null;
    if (option.hasOwnProperty(key)) return option[key];
    // fallback if structure is inconsistent
    if (key === 'value' && 'Value' in option) return option['Value'];
    if (key === 'name' && 'Name' in option) return option['Name'];
    return null;
  }
  // onActionClick() {
  //   this.actionClick.emit({
  //     control: this.control,
  //     rowIndex: this.rowIndex
  //   });
  // }

  onActionClick() {
  this.actionClick.emit({
    control: this.control,
    rowIndex: this._rowIndex
  });
}

  ngOnDestroy() {
    this.dropdownApiCallDoneSubscription ? this.dropdownApiCallDoneSubscription.unsubscribe() : null;
    this.updateDropdownItemSubscription ? this.updateDropdownItemSubscription.unsubscribe() : null;
    this.updateControlDataSubscription ? this.updateControlDataSubscription.unsubscribe() : null;
    this.updateLineControlDataSubscription ? this.updateLineControlDataSubscription.unsubscribe() : null;
    this.updateLineControlDataForSubPopupSubscription ? this.updateLineControlDataForSubPopupSubscription.unsubscribe() : null;
    this.updateControlsListDataSubscription ? this.updateControlsListDataSubscription.unsubscribe() : null;
    this.updateLineControlsListDataSubscription ? this.updateLineControlsListDataSubscription.unsubscribe() : null;
    this.disableControlSubscription ? this.disableControlSubscription.unsubscribe() : null;
    this.disableControlsListSubscription ? this.disableControlsListSubscription.unsubscribe() : null;
    this.setControlValidatorsSubscription ? this.setControlValidatorsSubscription.unsubscribe() : null;
    this.setControlListValidatorsSubscription ? this.setControlListValidatorsSubscription.unsubscribe() : null;
    this.disableLineControlSubscription ? this.disableLineControlSubscription.unsubscribe() : null;
    this.disableLineControlsListSubscription ? this.disableLineControlsListSubscription.unsubscribe() : null;
    // this.hideLineControlsListSubscription ? this.hideLineControlsListSubscription.unsubscribe() : null;
    this.hideControlSubscription ? this.hideControlSubscription.unsubscribe() : null;
    this.hideControlsListSubscription ? this.hideControlsListSubscription.unsubscribe() : null;
    this.setLineControlValidatorsSubscription ? this.setLineControlValidatorsSubscription.unsubscribe() : null;
    this.setLineControlListValidatorsSubscription ? this.setLineControlListValidatorsSubscription.unsubscribe() : null;
    this.readonlyControlSubscription ? this.readonlyControlSubscription.unsubscribe() : null;
    this.readonlyControlsListSubscription ? this.readonlyControlsListSubscription.unsubscribe() : null;
    this.readonlyLineControlSubscription ? this.readonlyLineControlSubscription.unsubscribe() : null;
    this.readonlyLineControlslistSubscription ? this.readonlyLineControlslistSubscription.unsubscribe() : null;
    this.enableControlSubscription ? this.enableControlSubscription.unsubscribe() : null;
    this.enableControlsListSubscription ? this.enableControlsListSubscription.unsubscribe() : null;
    this.enableLineControlSubscription ? this.enableLineControlSubscription.unsubscribe() : null;
    this.enableLineControlsListSubscription ? this.enableLineControlsListSubscription.unsubscribe() : null;
    this.drawerDisableSubscription ? this.drawerDisableSubscription.unsubscribe() : null;
    document.removeEventListener('scroll', this.onDocumentScrollCapture, true);
  }
}
