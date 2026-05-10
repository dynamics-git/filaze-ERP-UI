import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ViewChild, TemplateRef, NgModuleRef } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import { forkJoin, of, Subscription } from 'rxjs';
import { Subject, debounceTime } from 'rxjs';
import { DatePipe } from '@angular/common';
import { catchError } from 'rxjs/operators';

import { ToastrService } from 'ngx-toastr';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { ItemConfig } from '../../../core/models/shared/item.config';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { FormDataModel } from '../../../core/models/shared/formDataModel';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { AddLineEvent } from '../../../core/models/shared/add-line-event';
import { RestService } from '../../../core/services/rest.service';
import { Utility } from '../../../core/services/utility.service';
import { EncryptDecryptService } from '../../../core/services/shared/encrypt-decrypt.service';
import { SessionService } from '../../../core/services/session.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { ExcelExportService } from '../../../core/services/shared/excel-export.service';
import { FormField } from '../../../core/models/shared/formField';
import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { CustomButton } from '../../../core/models/shared/customButton';
import { DocumentCommentsPopupComponent } from '../../../shared/components/document-comments-popup/document-comments-popup.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DataTableService } from '../../../core/services/shared/data-table.service'
import { AddItemSubPopupComponent } from '../../../shared/components/add-item-sub-popup/add-item-sub-popup.component';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';

const PrimaryWhite = '#ffffff';
const SecondaryGrey = '#ccc';


@Component({
  standalone: false,
  selector: 'app-template-add-item-popup',
  templateUrl: './template-add-item-popup.component.html',
  styleUrl: './template-add-item-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateAddItemPopupComponent implements OnInit, OnDestroy {

  id!: string;
  lineData: any[] = [];
  update: boolean = false;
  headerReady: boolean = false;
  showLineSection: boolean = false;
  lineReady: boolean = false;
  headerFormGroup!: FormGroup;
  lineFormGroup!: FormGroup;
  calculationFormGroup!: FormGroup;
  checkLineAll: boolean = false;
  selectedLines: number[] = [];
  saving: boolean = false;
  showEditButton: boolean = true;
  justCalledPostApi: boolean = false;
  pendingPatchData: any;
  showInformationButton: boolean = false;
  showInformationTabs: boolean = false;
  activeTab: string = 'logEntries';
  copyHeaderPKProp!: string;
  page: number = 0;
  pageSize: number = 25;
  lazyloading: boolean = false;
  showMoreButton: boolean = false;
  viewModeEnableControls: string[] = [];
  firstSectionOpen = true;

  private lastReturnedCount = 0;
  badgePulse: boolean = false;
  flashRows: Set<number> = new Set();


  documentData!: any;
  documentType!: string;
  @Input() recordLineNo!: number;


  date: any = this.datepipe.transform(new Date(), 'dd/MM/yyyy');

  public informationDetailSecctionType = InformationDetailSecctionType;
  protected enableOrDisableAllControlsSubscription!: Subscription;
  protected disableAllControlsExceptSomeSubscription!: Subscription;
  protected callPatchApiSubscription!: Subscription;
  protected patchLineDataSubscription!: Subscription;
  protected showLoaderSubscription!: Subscription;
  protected popupRefreshLineDataSubscription!: Subscription;
  protected popupUncheckLineDataSubscription!: Subscription;
  protected updateLineControlDataSubscription!: Subscription;
  protected updateLineMultipleControlsDataSubscription!: Subscription;
  protected disableLineControlSubscription!: Subscription;
  protected closePopupSubscription!: Subscription;
  protected refreshDataSubscription!: Subscription;


  @Input() linkMode: boolean = false;
  @Input() headerFilter!: string;
  @Input() headerData: any;
  @Input() itemConfig!: ItemConfig;
  @Input() viewMode: boolean = false;
  @Input() editPermission: boolean = true;
  @Input() loading!: boolean;
  @Input() fileDeleteApi!: string;
  @Input() fileUrlProp!: string;
  @Output() popupLoaded = new EventEmitter<any>();
  @Output() popupAddNewPostResponse = new EventEmitter<any>();
  @Output() changeEvent = new EventEmitter<EventDataModel>();
  @Output() leaveEvent = new EventEmitter<FormDataModel>();
  @Output() buttonClickEvent = new EventEmitter<CustomButtonEvent>();
  @Output() addLineEvent = new EventEmitter<AddLineEvent>();
  @Output() drawerStateChange = new EventEmitter<any>();
  @Output() dropdownOpend = new EventEmitter<any>();

  sectionStates: boolean[] = [];

  // === NEW AUTO-SAVE SUPPORT ===
  private headerSave$ = new Subject<{ field: string; value: any }>();
  private lineSave$ = new Subject<{ row: number; field: string; value: any }>();
  private headerPendingChanges: any = {};
  private linePendingChanges: Map<number, any> = new Map();

  // === SMOOTH SAVING INDICATOR ===
  private savingTimeout: any;
  private setSaving(value: boolean) {
    clearTimeout(this.savingTimeout);
    if (value) {
      this.saving = true;
      this.cdr.detectChanges();
    } else {
      this.savingTimeout = setTimeout(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }, 800);
    }
  }

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private toastr: ToastrService,
    private restService: RestService,
    private utility: Utility,
    private cdr: ChangeDetectorRef,
    private encryptService: EncryptDecryptService,
    private sessionService: SessionService,
    private addItemService: AddItemService,
    private excelExportService: ExcelExportService,
    private datepipe: DatePipe,
    private modal: NgbModal,
    private dataTableService: DataTableService,
    private selectedItemService: SelectedItemService
  ) {
  }

  @ViewChild('customLoadingTemplate', { static: false }) customLoadingTemplate!: TemplateRef<any>;

  public primaryColour = PrimaryWhite;
  public secondaryColour = SecondaryGrey;
  public coloursEnabled = false;
  public loadingTemplate!: TemplateRef<any>;

  public configlode: any = {
    primaryColour: this.primaryColour,
    secondaryColour: this.secondaryColour,
    tertiaryColour: this.primaryColour,
    backdropBorderRadius: '3px'
  };


  ngOnInit() {
    if (this.itemConfig.autoSave === undefined || this.itemConfig.autoSave === null) {
      this.itemConfig.autoSave = true;
    }

    if (this.itemConfig.lineConfig) {
      this.showLineSection = true;

      if (this.itemConfig.lineConfig.disableLine === undefined || this.itemConfig.lineConfig.disableLine === null) {
        this.itemConfig.lineConfig.disableLine = false;
      }

      if (this.itemConfig.lineConfig.showCreate === undefined || this.itemConfig.lineConfig.showCreate === null) {
        this.itemConfig.lineConfig.showCreate = true;
      }

      if (this.itemConfig.lineConfig.showDelete === undefined || this.itemConfig.lineConfig.showDelete === null) {
        this.itemConfig.lineConfig.showDelete = true;
      }

      if (this.itemConfig.lineConfig.defaultLines === undefined || this.itemConfig.lineConfig.defaultLines === null) {
        this.itemConfig.lineConfig.defaultLines = 3;
      }
      if (this.itemConfig.headerConfig!.patchUserId === undefined || this.itemConfig.headerConfig!.patchUserId === null) {
        this.itemConfig.headerConfig!.patchUserId = true;
      }
      this.refreshDataSubscription = this.addItemService.refreshData$.subscribe((data: boolean) => {
        this.refreshData();
      });

      this.lineFormGroup = this.fb.group({
        items: new FormArray([])
      });
    }

    if (this.itemConfig.informationSectionConfig) {
      this.showInformationButton = true;
      this.showInformationTabs = false;
    }

    if (this.itemConfig.calculationSectionConfig) {
      let group: any = {};
      for (let i = 0; i < this.itemConfig.calculationSectionConfig.controls!.length; i++) {
        const column: FormField[] = this.itemConfig.calculationSectionConfig.controls![i];
        for (let j = 0; j < column.length; j++) {
          const control: FormField = column[j];
          let validators: any[] = [];
          if (control.required) {
            validators.push(Validators.required);
          }
          if (control.type === FormFieldType.Email) {
            validators.push(Validators.email);
          }
          group[control.label!] = new FormControl(null, validators);
        }
      }
      group.items = new FormArray([]);
      this.calculationFormGroup = this.fb.group(group);
    }

    if (!this.itemConfig.headerConfig!.removeUnicodeCharFields) {
      this.itemConfig.headerConfig!.removeUnicodeCharFields = [];
    }

    if (this.itemConfig.lineConfig && !this.itemConfig.lineConfig.removeUnicodeCharFields) {
      this.itemConfig.lineConfig.removeUnicodeCharFields = [];
    }

    this.copyHeaderPKProp = '';
    if (this.itemConfig.headerConfig!.id === 'copy') {
      this.viewMode = false;
      this.update = false;
      this.copyHeaderData(this.headerFilter);

    } else if (this.itemConfig.headerConfig!.id === 'add') {
      this.headerData = {};
      this.createFormGroup();
      if (this.showLineSection) {
        for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
          this.lineData.push(this.getLineInitialData());
        }
        this.generateItemsFormArray(this.lineData);
      }

      this.popupLoaded.emit({
        header: this.headerData,
        line: []
      });

      this.update = false;
      this.viewMode = false;
      this.headerData.CreatedBy = this.sessionService.UserId;
      this.headerData.UserId = this.sessionService.UserId;
      this.headerData.Company = this.sessionService.CompanyName;
      this.headerData.CompanyId = this.sessionService.Company;
      // this.headerData.PortalResponsibilityCentre = this.sessionService.DefaultResponsibilityCenter;
      this.headerData.PortalResponsibilityCentre = this.sessionService.ResponsibilityCenter?.PortalResponsibilityCentre;
      if (this.itemConfig.headerConfig!.includeUserId) {
        this.headerData.UserId = this.sessionService.UserId;
      }

      if (this.itemConfig.headerConfig!.autoGenerateField) {
        this.addHeaderData();
      } else {
        this.headerData = {};
        this.headerReady = true;
        this.cdr.detectChanges();
      }

    } else {
      this.update = true;
      if (this.linkMode) {
        this.viewMode = true;
        this.showEditButton = false;
      } else {
        this.viewMode = false;
      }

      this.headerData = {};
      this.createFormGroup();
      this.getHeaderData(this.headerFilter);
      if (this.showLineSection) {
        this.id = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
        this.getLineData();
      } else {
        this.popupLoaded.emit({
          header: this.headerData,
          line: []
        });
      }
    }

    this.enableOrDisableAllControlsSubscription = this.addItemService.enableOrDisableAllControls$.subscribe((data: boolean) => {
      this.viewMode = !data;
      this.showEditButton = data;
      this.cdr.detectChanges();
    });

    this.disableAllControlsExceptSomeSubscription = this.addItemService.disableAllControlsExceptSome$.subscribe((data: string[]) => {
      this.viewMode = true;
      this.showEditButton = false;
      this.viewModeEnableControls = data;
      this.updateViewModeEnableControls();
      this.cdr.detectChanges();
    });

    this.callPatchApiSubscription = this.addItemService.callPatchApi$.subscribe((row: number) => {
      const record = this.lineData[row];
      this.pendingPatchData = this.utility.getLineControlsData(this.pendingPatchData, this.itemConfig.lineConfig!.controls!);
      this.updateLineItemRecord(record, this.pendingPatchData, row);
    });

    this.patchLineDataSubscription = this.addItemService.patchLineData$.subscribe((data: { rowIndex: number, data: any, disableControls: boolean }) => {
      if (this.lineData[data.rowIndex][this.itemConfig.headerConfig!.idProp!]) {
        const patchData = this.utility.getLineControlsData(data.data, this.itemConfig.lineConfig!.controls!);
        this.updateLineItemRecord(this.lineData[data.rowIndex], patchData, data.rowIndex, data.disableControls);
      } else {
        this.pendingPatchData = data.data;
      }
    });

    this.showLoaderSubscription = this.addItemService.showLoader$.subscribe((data: boolean) => {
      this.loading = data;
      this.cdr.detectChanges();
    });

    this.popupRefreshLineDataSubscription = this.addItemService.popupRefreshLineData$.subscribe((data: boolean) => {
      this.getLineData();
    });

    this.popupUncheckLineDataSubscription = this.selectedItemService.popupUncheckedLineData$.subscribe((data: boolean) => {
      this.unselectAllLineItem();
    });

    this.updateLineControlDataSubscription = this.addItemService.updateLineControlData$.subscribe((data: { control: string, data: any, update: boolean }) => {
      if (this.headerData[this.itemConfig.headerConfig!.idProp!]) {
        this.lineData.forEach((line: any, index: number) => {
          let lineFormGroup = (this.items.controls as FormGroup[])[index] as FormGroup;
          lineFormGroup.controls[data.control].setValue(data.data, { emitEvent: false });
          if (data.update) {
            line[data.control] = data.data;
            const patchData = {
              [data.control]: this.utility.convertDateObjToString(data.data, true)
            };
            this.updateLineItemRecord(line, patchData, index);
          }
        });
      }
    });


    this.updateLineMultipleControlsDataSubscription = this.addItemService.updateLineMultipleControlsData$.subscribe((data: { data: any, rowIndex: number, emitEvent: boolean }) => {
      if (this.headerData[this.itemConfig.headerConfig!.idProp!]) {
        this.lineData.forEach((line: any, index: number) => {
          if (index === data.rowIndex && data.data) {
            let lineFormGroup = (this.items.controls as FormGroup[])[index] as FormGroup;
            const keys = Object.keys(data.data);
            keys.forEach((key: string) => {
              let control = lineFormGroup.get(key);
              if (control) {
                control.setValue(data.data[key], { emitEvent: data.emitEvent });
              }
            });

            if (line[this.itemConfig.lineConfig!.idProp!]) {
              this.updateLineItemRecord(line, data.data, index);
            } else {
              if (this.itemConfig.lineConfig!.lineFKProp && this.itemConfig.lineConfig!.headerPKProp!) {
                line[this.itemConfig.lineConfig!.lineFKProp] = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
              }
              this.addLineItemRecord(Object.assign({}, line, data.data), index);
            }
          }
        });
      }
    });

    this.disableLineControlSubscription = this.addItemService.disableLineControls$.subscribe((data: boolean) => {
      this.itemConfig.lineConfig!.disableLine = data;
    });

    this.closePopupSubscription = this.addItemService.closePopup$.subscribe((data: boolean) => {
      this.activeModal.close({
        action: 'Update',
        record: data
      });
    });


    if (!this.dataTableService.popupTaggle) {
      let sec = this.itemConfig.headerConfig!.sections;
      this.dataTableService.popupTaggle = sec?.slice(1).map(section => (
        true
      ));;
      this.sectionStates = this.dataTableService.popupTaggle;
    }
    else {
      this.sectionStates = this.dataTableService.popupTaggle;
    }
    this.documentType = this.itemConfig!.title!;
    setTimeout(() => {
      if (this.headerData) {
        this.documentData = this.headerData;
      }
    }, 1000)

    this.headerSave$.pipe(debounceTime(1500)).subscribe(() => this.performHeaderSave());
    this.lineSave$.pipe(debounceTime(1500)).subscribe(() => this.performLineSave());

  }

  get formControls() { return this.headerFormGroup.controls; }
  get items() { return this.lineFormGroup.get('items') as FormArray; }


  // // === AUTO-SAVE SCHEDULERS ===
  // private scheduleHeaderSave() {
  //   // Called when header field changed — starts debounce timer
  //   this.headerSave$.next({
  //     field: '',
  //     value: ''
  //   });
  // }


  // === AUTO-SAVE SCHEDULERS (Simplified Debounce Control) ===
  private headerSaveTimer: any;
  private lineSaveTimer: any;

  private scheduleHeaderSave() {
    if (this.headerSaveTimer) clearTimeout(this.headerSaveTimer);
    this.headerSaveTimer = setTimeout(() => {
      this.performHeaderSave();
      this.headerSaveTimer = null;
    }, 1500);
  }

  private scheduleLineSave() {
    if (this.lineSaveTimer) clearTimeout(this.lineSaveTimer);
    this.lineSaveTimer = setTimeout(() => {
      this.performLineSave();
      this.lineSaveTimer = null;
    }, 1500);
  }



  // private scheduleLineSave() {
  //   // Called when line field changed — starts debounce timer
  //   this.lineSave$.next({
  //     row: -1,
  //     field: '',
  //     value: ''
  //   });
  // }


  // --- Debounced Auto-Save Handlers ---
  private isHeaderSaving = false;

  private performHeaderSave() {
    // if already saving, skip this run
    if (this.isHeaderSaving || !Object.keys(this.headerPendingChanges).length) return;

    let patchData = this.utility.getHeaderControlsData(
      this.headerPendingChanges,
      this.itemConfig.headerConfig!.controls!
    );

    if (this.itemConfig.headerConfig?.textEditor) {
      patchData = {
        ...patchData,
        ...(this.headerFormGroup.get('subjectTemplate')?.value && {
          subjectTemplate: this.headerFormGroup.get('subjectTemplate')?.value,
        }),
        ...(this.headerFormGroup.get('bodyTemplate')?.value && {
          bodyTemplate: this.headerFormGroup.get('bodyTemplate')?.value,
        }),
      };
    }

    if (!this.headerData[this.itemConfig.headerConfig!.idProp!]) return;

    this.isHeaderSaving = true;
    this.setSaving(true);

    const ifMatchKey = '*';
    this.restService
      .patch(
        `${this.itemConfig.headerConfig!.api}(${this.headerData[this.itemConfig.headerConfig!.idProp!]})`,
        patchData,
        ifMatchKey
      )
      .subscribe({
        next: (res) => {
          this.headerData = res;
          this.headerPendingChanges = {};
          this.setSaving(false);
          this.isHeaderSaving = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.setSaving(false);
          this.isHeaderSaving = false;
        }
      });
  }


  // --- Debounced Auto-Save Handlers (line version) ---
  private isLineSaving = false;

  private performLineSave() {
    // prevent overlapping line saves
    if (this.isLineSaving || this.linePendingChanges.size === 0) return;

    this.isLineSaving = true;

    this.linePendingChanges.forEach((changes, row) => {
      const record = this.lineData[row];
      if (record && record[this.itemConfig.lineConfig!.idProp!]) {
        const patchData = this.utility.getLineControlsData(
          changes,
          this.itemConfig.lineConfig!.controls!
        );
        this.updateLineItemRecord(record, patchData, row, true);
      }
    });

    this.linePendingChanges.clear();
    this.isLineSaving = false;
  }

  // --- End of Auto-Save Handlers ---

  public get isDataLoaded(): boolean {
    if (!this.showLineSection) {
      return this.headerReady;
    } else {
      return this.headerReady && this.lineReady;
    }
  }

  public getLineFormGroup(row: number) {
    return this.items.controls[row] as FormGroup;
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

  private removeUnicodeChars(record: any) {
    this.itemConfig.headerConfig!.removeUnicodeCharFields!.forEach((item: string) => {
      record[item] = record[item].replace('_x0020_', ' ');
    });

    return record;
  }

  private removeLineUnicodeChars(record: any) {
    this.itemConfig.lineConfig!.removeUnicodeCharFields!.forEach((item: string) => {
      record[item] = this.utility.removeLineUnicodeChars(record[item]);
    });

    return record;
  }

  copyHeaderData(filter: string) {
    this.restService.get(this.itemConfig.headerConfig!.api + filter).subscribe((response: any) => {
      if (response && response.value) {
        this.headerData = this.removeUnicodeChars(response.value[0]);
      } else {
        this.headerData = this.removeUnicodeChars(response);
      }
      this.copyHeaderPKProp = this.headerData[this.itemConfig.lineConfig!.headerPKProp!]
      delete this.headerData['@odata.etag'];
      delete this.headerData['@odata.context'];
      delete this.headerData['PRCancelUserID@odata.mediaEditLink'];
      delete this.headerData['PurReqCancelUserID@odata.mediaEditLink'];
      delete this.headerData['PRCancelUserID@odata.mediaReadLink'];
      delete this.headerData['PurReqCancelUserID@odata.mediaReadLink'];
      delete this.headerData['selected'];
      delete this.headerData[this.itemConfig.headerConfig!.idProp!];
      if (this.showLineSection) {
        delete this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
      }

      delete this.headerData[this.itemConfig.headerConfig!.autoGenerateField!];
      if (this.itemConfig.headerConfig!.controls && this.itemConfig.headerConfig!.controls.length > 0) {
        let group: any = {};
        for (let i = 0; i < this.itemConfig.headerConfig!.controls.length; i++) {
          const column: FormField[] = this.itemConfig.headerConfig!.controls[i];
          for (let j = 0; j < column.length; j++) {
            const control: FormField = column[j];
            if (control.type === FormFieldType.DateTime) {

            } else if (control.copyResetValue !== undefined && control.copyResetValue !== null) {
              this.headerData[control.label!] = control.copyResetValue;
            }
          }
        }
      }

      this.headerData.CreatedBy = this.sessionService.UserId;
      this.headerData.UserId = this.sessionService.UserId;
      this.headerData.Company = this.sessionService.CompanyName;
      this.headerData.CompanyId = this.sessionService.Company;
      // this.headerData.PortalResponsibilityCentre = this.sessionService.DefaultResponsibilityCenter;
      this.headerData.PortalResponsibilityCentre = this.sessionService.ResponsibilityCenter?.PortalResponsibilityCentre;
      this.createFormGroup();
      if (this.showLineSection) {
        for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
          this.lineData.push(this.getLineInitialData());
        }
        this.generateItemsFormArray(this.lineData);
      }

      this.addHeaderData();
      this.headerFormGroup.patchValue(this.utility.setHeaderControlsData(this.headerData, this.itemConfig.headerConfig!.controls!));
      if (this.showLineSection) {
        this.id = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
        this.getLineData();
      } else {
        this.popupLoaded.emit({
          header: this.headerData,
          line: []
        });
      }
      this.cdr.detectChanges();
    }, (error) => {
      this.activeModal.dismiss();
      this.toastr.warning('Unable to find the item');
    });
  }

  getHeaderData(filter: string) {
    this.restService.get(this.itemConfig.headerConfig!.api + filter).subscribe((response: any) => {
      if (response && response.value) {
        if (response.value.length > 0) {
          this.headerData = this.removeUnicodeChars(response.value[0]);
        } else {
          this.toastr.error('Document is not found');
          this.activeModal.close({
            action: 'close',
            record: null
          });
        }
      } else {
        this.headerData = this.removeUnicodeChars(response);
      }
      this.headerFormGroup.patchValue(this.utility.setHeaderControlsData(this.headerData, this.itemConfig.headerConfig!.controls!));
      this.headerReady = true;
      if (this.showLineSection) {
        this.id = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
        this.getLineData();
      } else {
        this.popupLoaded.emit({
          header: this.headerData,
          line: []
        });
      }
      this.cdr.detectChanges();
    }, (error) => {
      this.activeModal.dismiss();
      this.toastr.warning('Unable to find the item');
    });
  }

  // getLineData(lazy: boolean = false) {
  //   if (this.id) {
  //     let lines: any[] = [];
  //     for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
  //       lines.push(this.getLineInitialData());
  //     }

  //     let filter = "?$filter=" + this.itemConfig.lineConfig!.lineFKProp + " eq '" + this.id + "'";
  //     if (this.itemConfig.lineConfig!.filterByVersionNo) {
  //       filter += " and VersionNo eq " + this.headerData.VersionNo;
  //     }

  //     if (lazy) {
  //       this.page++;
  //       this.lazyloading = true;
  //       filter = filter + '&$top=' + this.pageSize + '&$skip=' + ((this.page - 1) * this.pageSize);
  //     }

  //     this.lazyloading = true;
  //     this.restService.get(this.itemConfig.lineConfig!.api + filter).subscribe((response: any) => {
  //       response.value.forEach((record: any) => {
  //         if (this.itemConfig.lineConfig!.removeUnicodeCharFields!.length > 0) {
  //           record = this.removeLineUnicodeChars(record);
  //         }
  //       });

  //       if (lazy) {
  //         if (response.value.length < this.pageSize) {
  //           this.showMoreButton = false;
  //         } else {
  //           this.showMoreButton = true;
  //         }
  //         this.lineData = [...this.lineData, ...response.value];
  //         if (this.lineData.length === 0) {
  //           if (this.lineData.length < this.itemConfig.lineConfig!.defaultLines!) {
  //             for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
  //               this.lineData.push(this.getLineInitialData());
  //             }
  //           }
  //         }

  //         if (this.lineData.length > 0) {
  //           this.generateItemsFormArray(this.lineData);
  //           this.popupLoaded.emit({
  //             header: this.headerData,
  //             line: this.lineData
  //           });
  //         } else {
  //           this.generateItemsFormArray(lines);
  //           this.popupLoaded.emit({
  //             header: this.headerData,
  //             line: []
  //           });
  //         }

  //         this.lazyloading = false;
  //       } else {
  //         this.lineData = response.value;
  //         if (!this.lineData) this.lineData = [];
  //         if (this.itemConfig.headerConfig!.id === 'copy') {
  //           this.copyLineData();
  //           if (this.lineData.length < this.itemConfig.lineConfig!.defaultLines!) {
  //             for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
  //               this.lineData.push(this.getLineInitialData());
  //             }
  //           }
  //         } else {
  //           if (this.lineData.length < this.itemConfig.lineConfig!.defaultLines!) {
  //             for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
  //               this.lineData.push(this.getLineInitialData());
  //             }
  //           }

  //           if (this.lineData.length > 0) {
  //             this.generateItemsFormArray(this.lineData);
  //             this.popupLoaded.emit({
  //               header: this.headerData,
  //               line: this.lineData
  //             });
  //           } else {
  //             this.generateItemsFormArray(lines);
  //             this.popupLoaded.emit({
  //               header: this.headerData,
  //               line: []
  //             });
  //           }
  //         }
  //       }

  //       this.lazyloading = false;
  //     }, (error) => {
  //       this.lazyloading = false;
  //       this.generateItemsFormArray(lines);
  //       this.popupLoaded.emit({
  //         header: this.headerData,
  //         line: []
  //       });
  //     });
  //   }

  // }

  // Revised getLineData to fix lazy loading issue


  //TMY-Amit 


  //tmy-Amit Start -  GetlineData

  getLineData(lazy: boolean = false) {
    const headerKey = this.itemConfig.lineConfig!.headerPKProp!;
    if (!this.headerData || !this.headerData[headerKey]) {
      this.lazyloading = false;
      this.addItemService.showLoader$.next(false);
      return;
    }

    this.id = this.headerData[headerKey];
    if (!this.id) {
      this.lazyloading = false;
      this.addItemService.showLoader$.next(false);
      return;
    }

    const lines: any[] = [];
    for (let i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
      lines.push(this.getLineInitialData());
    }

    let filter = `?$filter=${this.itemConfig.lineConfig!.lineFKProp} eq '${this.id}'`;
    if (this.itemConfig.lineConfig!.filterByVersionNo) {
      filter += ` and VersionNo eq ${this.headerData.VersionNo}`;
    }

    if (lazy) {
      this.page++;
      this.lazyloading = true;
      filter += `&$top=${this.pageSize}&$skip=${(this.page - 1) * this.pageSize}`;
    }

    // 🟢 start loader once
    this.lazyloading = true;
    this.addItemService.showLoader$.next(true);

    this.restService.get(this.itemConfig.lineConfig!.api + filter).subscribe({
      next: (response: any) => {
        const values = response?.value || [];

        // Clean Unicode if needed
        if (this.itemConfig.lineConfig!.removeUnicodeCharFields?.length) {
          values.forEach((r: any) => this.removeLineUnicodeChars(r));
        }

        // 🧩 If backend returned nothing
        if (!values.length) {
          this.lineData = [...lines];
          // stop loader BEFORE rebuild
          this.lazyloading = false;
          this.addItemService.showLoader$.next(false);
          // rebuild after small async tick (prevents spinner hang)
          setTimeout(() => {
            this.generateItemsFormArray(this.lineData);
            this.popupLoaded.emit({ header: this.headerData, line: [] });
            this.cdr.detectChanges();
          }, 0);
          return;
        }

        // merge or replace
        this.lineData = lazy ? [...this.lineData, ...values] : values;

        // ensure minimum default lines
        const missing = this.itemConfig.lineConfig!.defaultLines! - this.lineData.length;
        if (missing > 0) {
          for (let i = 0; i < missing; i++) this.lineData.push(this.getLineInitialData());
        }

        // stop loader BEFORE rebuild
        this.lazyloading = false;
        this.addItemService.showLoader$.next(false);

        // small async rebuild
        setTimeout(() => {
          this.generateItemsFormArray(this.lineData);
          this.popupLoaded.emit({ header: this.headerData, line: this.lineData });
          this.cdr.detectChanges();
        }, 0);
      },
      error: () => {
        this.lineData = [...lines];
        this.lazyloading = false;
        this.addItemService.showLoader$.next(false);
        setTimeout(() => {
          this.generateItemsFormArray(this.lineData);
          this.popupLoaded.emit({ header: this.headerData, line: [] });
          this.cdr.detectChanges();
        }, 0);
      },
      complete: () => {
        // universal final guard
        this.lazyloading = false;
        this.addItemService.showLoader$.next(false);
      }
    });
  }

  //tmy-Amit End - GetlineData




  copyLineData() {
    if (this.lineData.length > 0) {
      let api = this.itemConfig.lineConfig!.api;
      if (this.itemConfig.lineConfig!.includeHeaderId) {
        api = '/' + this.itemConfig.headerConfig!.api + '(' + this.headerData[this.itemConfig.headerConfig!.idProp!] + ')' + api;
      }
      const postObservables = this.lineData.map((line: any) => {
        delete line['@odata.etag'];
        delete line['Id'];
        line[this.itemConfig.lineConfig!.lineFKProp!] = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
        line.CreatedBy = this.sessionService.UserId;
        line.UserId = this.sessionService.UserId;
        line.Company = this.sessionService.CompanyName;
        line.CompanyId = this.sessionService.Company;
        //  line.PortalResponsibilityCentre = this.sessionService.DefaultResponsibilityCenter;
        line.PortalResponsibilityCentre = this.sessionService.ResponsibilityCenter?.PortalResponsibilityCentre;
        return this.restService.post(api!, line).pipe(catchError(error => {
          return of(null);
        }));
      });

      forkJoin(postObservables).subscribe((res: any[]) => {
        this.lineData = res;
        if (this.lineData.length < this.itemConfig.lineConfig!.defaultLines!) {
          for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
            this.lineData.push(this.getLineInitialData());
          }
        }
        if (this.lineData.length > 0) {
          this.generateItemsFormArray(this.lineData);
          this.popupLoaded.emit({
            header: this.headerData,
            line: this.lineData
          });
        }
      });

      this.id = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
      this.lineData = this.lineData.slice(0, this.pageSize - 1);
    } else {
      this.popupLoaded.emit({
        header: this.headerData,
        line: []
      });
    }
  }

  createFormGroup() {
    if (this.itemConfig.headerConfig!.controls && this.itemConfig.headerConfig!.controls.length > 0) {
      let group: any = {};
      for (let i = 0; i < this.itemConfig.headerConfig!.controls.length; i++) {
        const column: FormField[] = this.itemConfig.headerConfig!.controls[i];
        for (let j = 0; j < column.length; j++) {
          const control: FormField = column[j];
          let validators: any[] = [];
          if (control.required) {
            validators.push(Validators.required);
          }
          if (control.type === FormFieldType.Email) {
            validators.push(Validators.email);
          }
          let data: any;
          if (this.update) {
            let controlData: any;
            if (control.parentObjectName) {
              controlData = this.headerData[control.parentObjectName][control.label!];
            } else {
              controlData = this.headerData[control.label!];
            }
            if (controlData) {
              if (control.type === FormFieldType.DateTime) {
                if (controlData === '0001-01-01') {
                  data = null;
                } else if (controlData === '0001-01-01' && control.defaultSystemDate) {
                  data = this.utility.convertStringToDateObj(this.datepipe.transform(new Date(), 'yyyy-MM-dd')!);
                } else {
                  data = this.utility.convertStringToDateObj(controlData);
                }
              } else if (control.type === FormFieldType.Password) {
                data = this.encryptService.decrypt(controlData + '');
              } else {
                if (control.mutiple) {
                  data = controlData.split(',');
                } else {
                  data = controlData;
                }
              }
            }
            this.headerData[control.label!] = data;
          } else {
            if (control.type === FormFieldType.DateTime && control.defaultSystemDate) {
              this.headerData[control.label!] = this.utility.convertStringToDateObj(this.datepipe.transform(new Date(), 'yyyy-MM-dd')!);
            }
          }
          group[control.label!] = new FormControl(data, validators);
        }
      }
      this.headerFormGroup = this.fb.group(group);
      this.headerFormGroup.addControl('subjectTemplate', new FormControl(''));
      this.headerFormGroup.addControl('bodyTemplate', new FormControl(''));
      this.cdr.detectChanges();
    }
  }

  generateItemsFormArray(data: any[]) {
    this.lineFormGroup = this.fb.group({
      items: new FormArray([])
    });
    data.forEach((item: any) => {
      this.createItemFormGroup(item);
    });
    this.lineReady = true;
    this.cdr.detectChanges();
  }

  createItemFormGroup(item: any, first: boolean = false) {
    if (this.itemConfig.lineConfig!.controls && this.itemConfig.lineConfig!.controls.length > 0) {
      let group: any = {};
      for (let i = 0; i < this.itemConfig.lineConfig!.controls.length; i++) {
        const control: FormField = this.itemConfig.lineConfig!.controls[i];
        let validators: any[] = [];
        if (control.required) {
          validators.push(Validators.required);
        }
        if (control.type === FormFieldType.Email) {
          validators.push(Validators.email);
        }
        let data: any;
        if (control.type === FormFieldType.DateTime) {
          if (item[control.label!] === '0001-01-01' && control.defaultSystemDate) {
            data = this.utility.convertStringToDateObj(this.datepipe.transform(new Date(), 'yyyy-MM-dd')!);
          } else {
            data = this.utility.convertStringToDateObj(item[control.label!]);
          }
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
    const data = this.getLineInitialData();
    this.createItemFormGroup(data, false);
  }

  getLineInitialData() {
    let data: any = {};

    this.itemConfig.lineConfig!.controls!.forEach((control: FormField) => {
      if (control.initialValue) {
        data[control.label!] = control.initialValue;
      }
    });

    return data;
  }

  deleteLine(row: number) {
    const id = this.lineData[row][this.itemConfig.lineConfig!.idProp!];
    this.restService.delete(this.itemConfig.lineConfig!.api + '(' + id + ')').subscribe(() => {
      let lineRows = this.items.controls as FormGroup[];
      if (lineRows.length > 1) {
        const data = lineRows[row].value;
        lineRows.splice(row, 1);
        this.lineData.splice(row, 1);
        this.items.updateValueAndValidity();
      }
    }, error => {
      this.toastr.error('Failed to delete line');
    });
  }

  changeHeaderControl(data: ControlDataModel) {
    this.changeEvent.emit({
      control: data.control,
      data: data.data,
      dropdownData: data.dropdownData,
      dropdownItems: data.dropdownItems,
      activeData: this.headerData,
      section: SectionType.Header,
      headerData: this.headerData
    });
  }

  // // === UPDATED WITH AUTO-SAVE DEBOUNCE ===
  // leaveHeaderControl(data: ControlDataModel, control: FormField) {
  //   // Original save logic preserved
  //   if (this.itemConfig.autoSave) {
  //     if (data.readonly) {
  //       this.headerData[data.control] = data.data;
  //     } else {
  //       this.saveHeaderData(data.data, control);
  //     }

  //     // 🕓 NEW: Push changes to pending header buffer
  //     this.headerPendingChanges[data.control] = data.data;
  //     // Schedule a debounced save
  //     this.scheduleHeaderSave();
  //   }

  //   this.leaveEvent.emit({
  //     data: this.headerFormGroup.value,
  //     valid: this.headerFormGroup.valid,
  //     section: SectionType.Header
  //   });
  // }

  // === UPDATED WITH AUTO-SAVE DEBOUNCE + SAFE GUARD ===
  leaveHeaderControl(data: ControlDataModel, control: FormField) {
    // ✅ Prevent save when value hasn't truly changed
    const oldValue = this.headerData[data.control];
    const newValue = data.data;

    const hasChanged =
      newValue !== null &&
      newValue !== undefined &&
      newValue !== '' &&
      oldValue !== newValue;

    if (this.itemConfig.autoSave && hasChanged) {
      if (data.readonly) {
        this.headerData[data.control] = newValue;
      } else {
        this.saveHeaderData(newValue, control);
      }

      // 🕓 NEW: Push changes to pending header buffer
      this.headerPendingChanges[data.control] = newValue;
      // Schedule a debounced save
      this.scheduleHeaderSave();
    }

    this.leaveEvent.emit({
      data: this.headerFormGroup.value,
      valid: this.headerFormGroup.valid,
      section: SectionType.Header
    });
  }




  onClearDropdown(data: ControlDataModel) {
    if (this.itemConfig.autoSave) {
      this.saving = true;
      const showEditButtonStatus = this.showEditButton;
      this.showEditButton = false;
      let patchData = {
        [data.control]: data.data,
        UserId: this.sessionService.UserId
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

  changeLineControl(data: ControlDataModel, rowIndex: number) {
    let lineData = JSON.parse(JSON.stringify(this.lineData));
    lineData[rowIndex][data.control] = data.data;
    this.changeEvent.emit({
      control: data.control,
      data: data.data,
      dropdownData: data.dropdownData,
      dropdownItems: data.dropdownItems,
      activeData: lineData[rowIndex],
      section: SectionType.Line,
      rowIndex: rowIndex,
      linesData: lineData,
      headerData: this.headerData
    });

    this.dropdownOpend.emit({
      control: data.control,
      data: data.data,
      dropdownData: data.dropdownData,
      dropdownItems: data.dropdownItems,
      activeData: lineData[rowIndex],
      section: SectionType.Line,
      rowIndex: rowIndex,
      linesData: lineData,
      headerData: this.headerData
    });

    this.ensureTrailingEmptyLines(2);

  }

  // leaveLineControl(data: ControlDataModel, control: FormField, row: number) {
  //   const itemGroup = this.items.controls[row] as FormGroup;
  //   const autoSave = control.autoSave !== false;
  //   if (this.itemConfig.autoSave && autoSave
  //     && (!this.viewMode || (this.viewMode && this.viewModeEnableControls.includes("Line_" + control.label)))) {
  //     if (itemGroup.valid || itemGroup.status === 'DISABLED') {
  //       let record = this.lineData[row];
  //       if (record[control.label!] !== data.data) {
  //         if (this.itemConfig.lineConfig!.lineFKProp && this.itemConfig.lineConfig!.headerPKProp) {
  //           record[this.itemConfig.lineConfig!.lineFKProp] = this.headerData[this.itemConfig.lineConfig!.headerPKProp];
  //         }
  //         // 🕓 NEW: Queue pending line change
  //         const existing = this.linePendingChanges.get(row) || {};
  //         existing[control.label!] = data.data;
  //         this.linePendingChanges.set(row, existing);

  //         // Schedule a debounced line save
  //         this.scheduleLineSave();


  //         if (record[this.itemConfig.lineConfig!.idProp!]) {
  //           let patchData = {
  //             [control.label!]: data.data
  //           };
  //           patchData = this.utility.getLineControlsData(patchData, this.itemConfig.lineConfig!.controls!);
  //           this.updateLineItemRecord(record, patchData, row);
  //         }
  //         else if (!this.justCalledPostApi) {
  //           record[control.label!] = data.data;

  //           // if (data.dropdownData) {
  //           //   record[control.label!] = data.dropdownData[control.bindValue!];
  //           // }
  //           this.itemConfig.lineConfig!.controls!.forEach((control: FormField) => {
  //             if (control.initialValue) {
  //               record[control.label!] = control.initialValue;
  //             }
  //           });
  //           record = this.utility.getLineControlsData(record, this.itemConfig.lineConfig!.controls!);
  //           this.justCalledPostApi = true;
  //           this.addLineItemRecord(record, row);
  //         }
  //         else {
  //           if (this.pendingPatchData) {
  //             this.pendingPatchData[control.label!] = data.data;
  //           } else {
  //             this.pendingPatchData = {
  //               [control.label!]: data.data
  //             };
  //           }
  //         }
  //       }
  //     } else {
  //       this.utility.patchObject(this.lineData[row], this.utility.getLineControlsData(itemGroup.value, this.itemConfig.lineConfig!.controls!));
  //       this.lineData[row][control.label!] = data.data;
  //     }
  //   } else {
  //     this.utility.patchObject(this.lineData[row], this.utility.getLineControlsData(itemGroup.value, this.itemConfig.lineConfig!.controls!));
  //     this.lineData[row][control.label!] = data.data;
  //   }

  //   this.leaveEvent.emit({
  //     data: this.items.value,
  //     valid: this.items.valid,
  //     section: SectionType.Line
  //   });
  // }



  leaveLineControl(data: ControlDataModel, control: FormField, row: number) {
    const itemGroup = this.items.controls[row] as FormGroup;
    const autoSave = control.autoSave !== false;

    if (
      this.itemConfig.autoSave &&
      autoSave &&
      (!this.viewMode || (this.viewMode && this.viewModeEnableControls.includes("Line_" + control.label)))
    ) {
      if (itemGroup.valid || itemGroup.status === 'DISABLED') {
        let record = this.lineData[row];

        // ✅ FIX: prevent save if value didn't truly change
        if (
          data &&
          data.data !== null &&
          // data.data !== undefined &&
          data.data !== '' &&
          record[control.label!] !== data.data
        ) {
          if (this.itemConfig.lineConfig!.lineFKProp && this.itemConfig.lineConfig!.headerPKProp) {
            record[this.itemConfig.lineConfig!.lineFKProp] = this.headerData[this.itemConfig.lineConfig!.headerPKProp];
          }

          // 🕓 Queue pending line change
          const existing = this.linePendingChanges.get(row) || {};
          existing[control.label!] = data.data;
          this.linePendingChanges.set(row, existing);

          // 🕓 Schedule a debounced line save
          this.scheduleLineSave();

          if (record[this.itemConfig.lineConfig!.idProp!]) {
            let patchData = {
              [control.label!]: data.data
            };
            patchData = this.utility.getLineControlsData(patchData, this.itemConfig.lineConfig!.controls!);
            this.updateLineItemRecord(record, patchData, row);
          } else if (!this.justCalledPostApi) {
            record[control.label!] = data.data;

            this.itemConfig.lineConfig!.controls!.forEach((control: FormField) => {
              if (control.initialValue) {
                record[control.label!] = control.initialValue;
              }
            });
            record = this.utility.getLineControlsData(record, this.itemConfig.lineConfig!.controls!);
            this.justCalledPostApi = true;
            this.addLineItemRecord(record, row);
          } else {
            if (this.pendingPatchData) {
              this.pendingPatchData[control.label!] = data.data;
            } else {
              this.pendingPatchData = {
                [control.label!]: data.data
              };
            }
          }
        }
      } else {
        this.utility.patchObject(
          this.lineData[row],
          this.utility.getLineControlsData(itemGroup.value, this.itemConfig.lineConfig!.controls!)
        );
        this.lineData[row][control.label!] = data.data;
      }
    } else {
      this.utility.patchObject(
        this.lineData[row],
        this.utility.getLineControlsData(itemGroup.value, this.itemConfig.lineConfig!.controls!)
      );
      this.lineData[row][control.label!] = data.data;
    }

    this.leaveEvent.emit({
      data: this.items.value,
      valid: this.items.valid,
      section: SectionType.Line
    });
  }


  // changeLineCalculationControl(data: ControlDataModel) {
  //   this.changeEvent.emit({
  //     control: data.control,
  //     data: data.data,
  //     dropdownData: data.dropdownData,
  //     dropdownItems: data.dropdownItems,
  //     section: SectionType.Calculation,
  //     headerData: this.headerData
  //   });
  // }

  // leaveCalculationControl() {
  //   this.leaveEvent.emit({
  //     data: this.headerFormGroup.value,
  //     valid: this.headerFormGroup.valid,
  //     section: SectionType.Calculation
  //   });
  // }

  // === SAFE VERSION for calculation fields (Quantity, Unit Cost, Amount) ===
  changeLineCalculationControl(data: ControlDataModel) {
    // 🧠 Prevent redundant recalculations when value didn't actually change
    const oldValue = this.headerFormGroup.get(data.control)?.value;
    const newValue = data.data;

    if (
      newValue !== null &&
      newValue !== undefined &&
      newValue !== '' &&
      oldValue !== newValue
    ) {
      this.changeEvent.emit({
        control: data.control,
        data: newValue,
        dropdownData: data.dropdownData,
        dropdownItems: data.dropdownItems,
        section: SectionType.Calculation,
        headerData: this.headerData
      });
    }
  }

  leaveCalculationControl() {
    // ✅ Normal emit (no issue here)
    this.leaveEvent.emit({
      data: this.headerFormGroup.value,
      valid: this.headerFormGroup.valid,
      section: SectionType.Calculation
    });
  }


  addHeaderData() {
    this.saving = true;
    for (let i = 0; i < this.itemConfig.headerConfig!.controls!.length; i++) {
      const column: FormField[] = this.itemConfig.headerConfig!.controls![i];
      for (let j = 0; j < column.length; j++) {
        const control: FormField = column[j];
        if (control.type === FormFieldType.DateTime && control.defaultSystemDate) {
          this.headerData[control.label!] = this.utility.convertStringToDateObj(this.datepipe.transform(new Date(), 'yyyy-MM-dd')!);
        }
      }
    }
    let payload = this.utility.getHeaderControlsData(this.headerData, this.itemConfig.headerConfig!.controls!);
    this.restService.post(this.itemConfig.headerConfig!.api!, payload).subscribe((response: any) => {
      let result = this.utility.copyObj(response);
      this.popupAddNewPostResponse.emit(response);
      for (let i = 0; i < this.itemConfig.headerConfig!.controls!.length; i++) {
        const column: FormField[] = this.itemConfig.headerConfig!.controls![i];
        for (let j = 0; j < column.length; j++) {
          const control: FormField = column[j];
          if (control.type === FormFieldType.DateTime && result[control.label!]) {
            result[control.label!] = this.utility.convertStringToDateObj(result[control.label!]);
          }
        }
      }
      this.headerFormGroup.patchValue(result);
      this.headerData = result;
      this.documentData = result;
      this.headerReady = true;
      this.saving = false;
      this.cdr.detectChanges();

      if (this.itemConfig.headerConfig!.id === 'copy' && this.showLineSection) {
        this.id = this.copyHeaderPKProp;
        this.getLineData();
      }
    }, (error) => {
      this.saving = false;
      this.cdr.detectChanges();
    });
  }

  saveHeaderData(data: string, control: FormField) {
    if (this.headerFormGroup.valid && (this.headerData[control.label!] !== data || (data !== '' && data !== undefined && data !== null))) {
      let record = this.headerData;
      if (record[this.itemConfig.headerConfig!.idProp!]) {
        this.saving = true;
        const showEditButtonStatus = this.showEditButton;
        this.showEditButton = false;
        // let patchData = {
        //   [control.label!]: data,
        //   //UserId: this.sessionService.UserId
        // };
        let patchData = {
          [control.label!]: data,
          ...(this.itemConfig.headerConfig?.patchUserId && {
            UserId: this.sessionService.UserId
          })
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

  addLineItemRecord(item: any, row: number) {
    this.saving = true;
    this.showEditButton = false;
    this.cdr.detectChanges();
    let api = this.itemConfig.lineConfig!.api!;
    if (this.itemConfig.lineConfig!.includeHeaderId) {
      api = '/' + this.itemConfig.headerConfig!.api + '(' + this.headerData[this.itemConfig.headerConfig!.idProp!] + ')' + api;
    }
    item.UserId = this.sessionService.UserId;
    item.Company = this.sessionService.CompanyName;
    item.CompanyId = this.sessionService.Company;
    item.PortalResponsibilityCentre = this.sessionService.ResponsibilityCenterId;
    this.restService.post(api, item).subscribe((response: any) => {
      this.lineData[row] = response;
      this.saving = false;
      this.showEditButton = true;
      this.justCalledPostApi = false;
      if (this.pendingPatchData) {
        this.addItemService.callPatchApi$.next(row);
      }
      this.cdr.detectChanges();
    }, (error) => {
      this.saving = false;
      this.showEditButton = true;
      this.cdr.detectChanges();
    });
  }



  // REVISED addLineItemRecord to prevent endless loader
  //   addLineItemRecord(item: any, row: number) {
  //   // 🧩 Prevent endless loader when header ID is not yet created
  //   const headerKey = this.itemConfig.headerConfig!.idProp!;
  //   const headerId = this.headerData ? this.headerData[headerKey] : null;

  //   if (!headerId) {
  //     console.warn('⏳ Skipped line post — header ID not ready yet');
  //     this.saving = false;
  //     this.showEditButton = true;
  //     this.justCalledPostApi = false;
  //     this.cdr.detectChanges();
  //     return;
  //   }

  //   this.saving = true;
  //   this.showEditButton = false;
  //   this.cdr.detectChanges();

  //   let api = this.itemConfig.lineConfig!.api!;
  //   if (this.itemConfig.lineConfig!.includeHeaderId) {
  //     api = `/${this.itemConfig.headerConfig!.api}(${headerId})${api}`;
  //   }

  //   // 🧠 Add system-level info
  //   item.UserId = this.sessionService.UserId;
  //   item.Company = this.sessionService.CompanyName;
  //   item.CompanyId = this.sessionService.Company;
  //   item.PortalResponsibilityCentre = this.sessionService.ResponsibilityCenterId;

  //   // 🔄 Ensure line has FK link
  //   if (this.itemConfig.lineConfig!.lineFKProp && this.itemConfig.lineConfig!.headerPKProp) {
  //     item[this.itemConfig.lineConfig!.lineFKProp] =
  //       this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
  //   }

  //   this.restService.post(api, item).subscribe({
  //     next: (response: any) => {
  //       this.lineData[row] = response;
  //       this.saving = false;
  //       this.showEditButton = true;
  //       this.justCalledPostApi = false;

  //       // 🔁 trigger pending patch if queued
  //       if (this.pendingPatchData) {
  //         this.addItemService.callPatchApi$.next(row);
  //       }

  //       // 🧩 Ensure at least 2 blank lines remain after adding
  //       if (this.ensureTrailingEmptyLines) {
  //         this.ensureTrailingEmptyLines(2);
  //       }

  //       this.cdr.detectChanges();
  //     },
  //     error: () => {
  //       this.saving = false;
  //       this.showEditButton = true;
  //       this.justCalledPostApi = false;
  //       this.addItemService.showLoader$.next(false);
  //       this.cdr.detectChanges();
  //     },
  //     complete: () => {
  //       // ✅ Force loader cleanup
  //       this.addItemService.showLoader$.next(false);
  //       this.saving = false;
  //       this.cdr.detectChanges();
  //     }
  //   });
  // }


  updateLineItemRecord(record: any, patchData: any, row: number, disableControls: boolean = true) {
    if (record[this.itemConfig.lineConfig!.idProp!] && !this.utility.compareObjects(record, patchData)) {
      const ifMatchKey = "*"; // record["@odata.etag"];
      const query = '(' + record[this.itemConfig.lineConfig!.idProp!] + ')';
      this.saving = disableControls;
      this.showEditButton = false;
      patchData.UserId = this.sessionService.UserId;
      this.restService.patch(this.itemConfig.lineConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
        this.lineData[row] = response;
        if (this.itemConfig.lineConfig!.apiPatchProperties && this.itemConfig.lineConfig!.apiPatchProperties.length > 0) {
          let lines = this.items.controls as FormGroup[];
          this.itemConfig.lineConfig!.apiPatchProperties.forEach((prop: string) => {
            this.lineData[row][prop] = response[prop];
            lines[row].get(prop)!.patchValue(response[prop]);
          });
        }
        this.showEditButton = true;
        this.saving = false;
        this.pendingPatchData = null;
        this.cdr.detectChanges();
      }, (error) => {
        this.saving = false;
        this.showEditButton = true;
        this.cdr.detectChanges();
      });
    }
  }

  changeViewMode() {
    this.viewMode = !this.viewMode;
  }

  refreshData() {
    this.headerReady = false;
    this.lineReady = false;
    this.headerData = {};
    this.getHeaderData(this.headerFilter);
    this.getLineData();
  }

  deleteRecord() {
    const ref = this.modal.open(ConfirmDialogComponent);
    ref.componentInstance.message = 'Are you sure you want to delete the current record?';
    ref.result.then((value: boolean) => {
      if (value) {
        this.restService.delete(this.itemConfig.headerConfig!.api + '(' + this.itemConfig.headerConfig!.id! + ')').subscribe((response: any) => {
          const fileUrl = this.headerData[this.fileUrlProp!];
          if (fileUrl && this.fileDeleteApi) {
            this.restService.delete(this.fileDeleteApi + '/' + fileUrl).subscribe((res: any) => {
            });
          }

          this.activeModal.close({
            action: 'Delete',
            record: null
          });
        });
      }
    })
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
    this.selectedItemService.setSelectedLines(this.selectedLines);
  }



  //TMY/ subhankar/20.08.25/ new selection
  selectLineItem(index: number) {
    if (this.selectedLines.includes(index)) {
      this.selectedLines = this.selectedLines.filter(x => x !== index);
    } else {
      this.selectedLines.push(index);
    }
    const lineData = this.items.value;
    this.checkLineAll = this.selectedLines.length === lineData.length;
    this.selectedItemService.setSelectedLines(this.selectedLines);
  }

  unselectAllLineItem() {
    this.selectedLines = [];
    this.checkLineAll = false;
    this.selectedItemService.clearSelectedLines();
  }


  addLineItem() {
    const data = this.getLineInitialData();
    this.lineData.push(data);
    this.createItemFormGroup(data, false);
    this.addLineEvent.emit({
      data: data,
      rowIndex: this.lineData.length - 1
    });

  }

  /** Ensures there are at least `minTrailing` empty rows at the bottom. */
  private ensureTrailingEmptyLines(minTrailing: number): void {
    if (!this.items || !this.items.length) return;

    let trailingEmpty = 0;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const row = this.items.at(i).value || {};
      const isEmpty = Object.values(row).every(v => v === null || v === '' || v === undefined);
      if (isEmpty) trailingEmpty++;
      else break;
    }

    const need = Math.max(0, minTrailing - trailingEmpty);
    for (let j = 0; j < need; j++) {
      this.addLineItem();
    }
  }



  //TMY/Subhankar/21.08.25/ multiple delete 
  //  deleteLines() {
  //   if (this.selectedLines.length === 0) {
  //     this.toastr.warning('Select line(s) to delete!');
  //     return;
  //   }

  //   this.addItemService.showLoader$.next(true);
  //   const sortedIndexes = [...this.selectedLines].sort((a, b) => b - a);
  //   let deleteCount = 0;
  //   let processed = 0;

  //   const stopLoaderAndReset = () => {
  //     // ✅ stop all loading flags safely
  //     this.addItemService.showLoader$.next(false);
  //     this.saving = false;
  //     this.lazyloading = false;

  //     // ✅ ensure at least one empty buffer line exists
  //     if (!this.lineData || this.lineData.length === 0) {
  //       this.lineData = [];
  //       this.ensureTrailingEmptyLines(1);
  //     }

  //     this.cdr.detectChanges();
  //     this.unselectAllLineItem();

  //     if (deleteCount > 0) {
  //       this.toastr.success(`Record(s) deleted successfully.`);
  //     }

  //     // ✅ emit update so parent listens even if empty
  //     this.leaveEvent.emit({
  //       data: this.items.value,
  //       valid: this.items.valid,
  //       section: SectionType.Line
  //     });
  //   };

  //   sortedIndexes.forEach((index) => {
  //     const lineData = this.lineData[index];
  //     const idProp = this.itemConfig.lineConfig!.idProp!;
  //     const recordId = lineData[idProp];

  //     if (recordId) {
  //       this.restService.delete(`${this.itemConfig.lineConfig!.api}(${recordId})`).subscribe({
  //         next: () => {
  //           this.lineData = this.lineData.filter(x => x[idProp] !== recordId);
  //           (this.items.controls as FormGroup[]).splice(index, 1);
  //           this.items.updateValueAndValidity();
  //           this.cdr.detectChanges();
  //           deleteCount++;
  //         },
  //         error: () => {
  //           this.toastr.error(`Failed to delete record ${recordId}.`);
  //         },
  //         complete: () => {
  //           processed++;
  //           if (processed === sortedIndexes.length) {
  //             stopLoaderAndReset(); // ✅ always stop spinner
  //           }
  //         }
  //       });
  //     } else {
  //       // unsaved line deletion
  //       (this.items.controls as FormGroup[]).splice(index, 1);
  //       this.lineData.splice(index, 1);
  //       this.items.updateValueAndValidity();
  //       this.cdr.detectChanges();
  //       deleteCount++;
  //       processed++;

  //       if (processed === sortedIndexes.length) {
  //         stopLoaderAndReset();
  //       }
  //     }
  //   });
  // }

  //tmy/amit/23.06.2023/multiple delete

  deleteLines() {
    if (this.selectedLines.length === 0) {
      this.toastr.warning('Select line(s) to delete!');
      return;
    }

    this.addItemService.showLoader$.next(true);
    const sortedIndexes = [...this.selectedLines].sort((a, b) => b - a);
    let deleteCount = 0;
    let processed = 0;

    sortedIndexes.forEach((index) => {
      const lineData = this.lineData[index];
      const idProp = this.itemConfig.lineConfig!.idProp!;
      const recordId = lineData[idProp];

      const finishCheck = () => {
        processed++;
        if (processed === sortedIndexes.length) {
          // ✅ stop loader FIRST
          this.addItemService.showLoader$.next(false);
          this.lazyloading = false;

          if (deleteCount > 0) {
            this.toastr.success('Record(s) deleted successfully.');
          }

          this.unselectAllLineItem();

          // 🧠 wait for DOM to settle before reloading
          setTimeout(() => {
            this.getLineData(); // safe refresh
          }, 150);
        }
      };

      if (recordId) {
        this.restService.delete(`${this.itemConfig.lineConfig!.api}(${recordId})`).subscribe({
          next: () => {
            this.lineData = this.lineData.filter(x => x[idProp] !== recordId);
            (this.items.controls as FormGroup[]).splice(index, 1);
            this.items.updateValueAndValidity();
            this.cdr.detectChanges();
            deleteCount++;
          },
          error: () => {
            this.toastr.error(`Failed to delete record ${recordId}.`);
          },
          complete: finishCheck
        });
      } else {
        (this.items.controls as FormGroup[]).splice(index, 1);
        this.lineData.splice(index, 1);
        this.items.updateValueAndValidity();
        this.cdr.detectChanges();
        deleteCount++;
        finishCheck();
      }
    });
  }

  //tmy/amit/23.06.2023/multiple delete end

  customButtonClick(button: CustomButton, section: string, rowIndex: number = -1) {
    this.buttonClickEvent.emit({
      button: button,
      data: section === 'header' ? this.headerData : this.lineData[rowIndex],
      section: section === 'header' ? SectionType.Header : SectionType.Line,
      headerData: this.headerData,
      lineData: this.lineData
    });
  }

  closePopup() {
    if (this.headerData[this.itemConfig.headerConfig!.idProp!]) {
      let headerData = this.utility.getHeaderControlsData(this.headerData, this.itemConfig.headerConfig!.controls!);
      headerData = this.removeUnicodeChars(headerData);
      this.activeModal.close({
        action: 'Update',
        record: headerData
      });
    } else {
      this.activeModal.close({
        action: 'close',
        record: null
      });
    }
  }

  exportLines() {
    const lineControlsData = this.utility.getLineControlsData(this.lineData, this.itemConfig.lineConfig!.controls!);
    let lineData: any[] = [];
    lineControlsData.forEach((data: any) => {
      let line: any = {};
      this.itemConfig.lineConfig!.controls!.forEach((control: FormField) => {
        line[control.label!] = data[control.label!];
      });
      lineData.push(line);
    });
    this.excelExportService.exportAsExcelFile(lineData, this.headerData[this.itemConfig.recordId!] + '_Lines');
  }

  openComments() {
    const modalRef = this.modal.open(DocumentCommentsPopupComponent, { size: 'md', windowClass: 'modal-dialog-scrollable', backdrop: 'static' });
    modalRef.componentInstance.title = this.itemConfig.title;
    modalRef.componentInstance.documentNo = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
    modalRef.componentInstance.documentType = this.itemConfig.headerConfig!.commentDocumentType;
  }
  openSubPopup() {
    const modalRef = this.modal.open(AddItemSubPopupComponent, { size: 'md', windowClass: 'modal-dialog-scrollable', backdrop: 'static' });
    modalRef.componentInstance.showCreate = false;
    modalRef.componentInstance.showDelete = false;
    modalRef.componentInstance.title = this.itemConfig.title;
    modalRef.componentInstance.documentNo = this.headerData[this.itemConfig.headerConfig?.idProp!];
    // modalRef.componentInstance.documentNo = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
    modalRef.componentInstance.documentType = this.itemConfig.headerConfig!.commentDocumentType;
    modalRef.componentInstance.headerData = this.itemConfig;
  }

  ngOnDestroy() {
    this.callPatchApiSubscription.unsubscribe();
    this.enableOrDisableAllControlsSubscription.unsubscribe();
    this.disableAllControlsExceptSomeSubscription.unsubscribe();
    this.patchLineDataSubscription.unsubscribe();
    this.showLoaderSubscription.unsubscribe();
    this.popupRefreshLineDataSubscription.unsubscribe();
    this.popupUncheckLineDataSubscription.unsubscribe();
    this.updateLineControlDataSubscription.unsubscribe();
    this.updateLineMultipleControlsDataSubscription.unsubscribe();
    this.disableLineControlSubscription.unsubscribe();
    this.closePopupSubscription.unsubscribe();
    this.refreshDataSubscription.unsubscribe();
    this.cdr.detach();
  }

  toggleFirstSection() {
    this.firstSectionOpen = !this.firstSectionOpen;
  }


  // toggleSection(index: number): void {
  //   this.sectionStates[index] = !this.sectionStates[index];
  // }
  // toggleSection(index: number): void {
  //   this.sectionStates[index] = !this.sectionStates[index];
  //   this.dataTableService.popupTaggle = this.sectionStates[index];
  // }



  // toggleSection(index: number): void {
  //   this.sectionStates[index] = !this.sectionStates[index];
  //   const current = this.sectionStates[index];
  //   this.dataTableService.popupTaggle(index, current);
  // }

  toggleSection(index: number): void {
    this.sectionStates[index] = !this.sectionStates[index];
    if (this.dataTableService.popupTaggle[index]) {
      this.dataTableService.popupTaggle[index].open = this.sectionStates[index];
    }
  }

  showReturnedOnly: boolean = false;
  toggleReturnedOnly() {
    this.showReturnedOnly = !this.showReturnedOnly;
  }



  get returnedCount(): number {
    const statusField = this.itemConfig?.lineConfig?.statusField;
    if (!this.lineData || !statusField) {
      return 0;
    }
    const count = this.lineData.filter(x => !!x[statusField]).length;
    if (count > this.lastReturnedCount) {
      this.triggerBadgePulse();
    }
    this.lastReturnedCount = count;
    return count;
  }


  private triggerBadgePulse() {
    this.badgePulse = true;
    setTimeout(() => this.badgePulse = false, 1200); // must reset
  }




  ngAfterViewChecked() {
    const statusField = this.itemConfig?.lineConfig?.statusField;
    if (statusField && this.lineData) {
      this.lineData.forEach((line, index) => {
        const flagged = !!line[statusField];
        if (flagged && !this.flashRows.has(index)) {
          this.flashRows.add(index);
          this.triggerRowFlash(index);
        }
      });
    }
  }


  private triggerRowFlash(index: number) {
    const row = document.querySelectorAll('table.excel-table tbody tr')[index] as HTMLElement;
    if (row) {
      row.classList.add('flash');
      setTimeout(() => row.classList.remove('flash'), 1200);
    }
  }

  selectedIndex: number | null = null;
  isDrawerOpen: boolean = false;

  openDrawer(i: number, lineValues: any) {
    this.getLineData();
    this.isDrawerOpen = !this.isDrawerOpen;
    this.selectedIndex = i;
    this.drawerStateChange.emit({
      isOpen: this.isDrawerOpen,
      index: i,
      fromValue: lineValues
    });
  }

  closeDrawer() {
    this.selectedIndex = null;
    this.isDrawerOpen = false;
    this.drawerStateChange.emit({ isOpen: false, index: null, fromValue: '' });
    this.itemConfig?.lineConfig?.controls?.forEach(control => {
      control.hidden = false;
    });

  }


  onEditorChange(controlName: string, value: string) {
    const control = this.headerFormGroup.get(controlName);
    if (!control) return;
    control.setValue(value);
    if (!this.headerData || !this.headerData[this.itemConfig.headerConfig!.idProp!]) {
      return;
    }
    this.headerPendingChanges[controlName] = value;
    this.scheduleHeaderSave();
  }


}
