import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ViewChild, TemplateRef, NgModuleRef } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import { forkJoin, of, Subscription } from 'rxjs';
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
import { DocumentCommentsPopupComponent } from '../document-comments-popup/document-comments-popup.component';
import { SetupLineModalComponent } from '../setup-line-modal/setup-line-modal.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrl: './add-item.component.scss'
})
export class AddItemComponent {
  id!: string;
  lineData: any[] = [];
  lineErrors: Record<number, string> = {};
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
  get isStatusSaving(): boolean { return this.saving; }
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
  sectionStates: boolean[] = [];

  getSectionRows(section: { controls: FormField[][]; autoPack?: boolean }): FormField[][] {
    return section.controls || [];
  }

  toggleFirstSection(): void {
    this.firstSectionOpen = !this.firstSectionOpen;
  }

  toggleSection(index: number): void {
    this.sectionStates[index] = !this.sectionStates[index];
  }

  date: any = this.datepipe.transform(new Date(), 'dd/MM/yyyy');

  public informationDetailSecctionType = InformationDetailSecctionType;
  protected enableOrDisableAllControlsSubscription!: Subscription;
  protected disableAllControlsExceptSomeSubscription!: Subscription;
  protected callPatchApiSubscription!: Subscription;
  protected patchLineDataSubscription!: Subscription;
  protected showLoaderSubscription!: Subscription;
  protected updateLineControlDataSubscription!: Subscription;
  protected updateLineMultipleControlsDataSubscription!: Subscription;
  protected disableLineControlSubscription!: Subscription;

  @Input() linkMode: boolean = false;
  @Input() headerData: any;
  @Input('config') itemConfig!: ItemConfig;
  @Input() viewMode: boolean = false;
  @Input() editPermission: boolean = true;
  @Input() loading!: boolean;
  @Output() pageLoaded = new EventEmitter<any>();
  @Output() changeEvent = new EventEmitter<EventDataModel>();
  @Output() leaveEvent = new EventEmitter<FormDataModel>();
  @Output() buttonClickEvent = new EventEmitter<CustomButtonEvent>();
  @Output() addLineEvent = new EventEmitter<AddLineEvent>();

  constructor(
    private fb: FormBuilder,
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
    private router: Router,
    private activatedRoute: ActivatedRoute) {
  }

  public coloursEnabled = false;
  public loadingTemplate!: TemplateRef<any>;

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

      this.lineFormGroup = this.fb.group({
        items: new FormArray([])
      });
    }

    if (this.itemConfig.informationSectionConfig) {
      this.showInformationButton = true;
    }

    // Initialize section collapse states (all open by default, excluding first)
    const sections = this.itemConfig.headerConfig?.sections;
    if (sections && sections.length > 1) {
      this.sectionStates = sections.slice(1).map(() => true);
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

    this.activatedRoute.params.subscribe((params: any) => {
      if (params.id) {
        this.itemConfig.headerConfig!.id = params.id;
        this.copyHeaderPKProp = '';
        if (this.itemConfig.headerConfig!.id === 'copy') {
          this.viewMode = false;
          this.update = false;
          this.copyHeaderData(this.itemConfig.headerConfig!.id);

        } else if (this.itemConfig.headerConfig!.id === 'add') {
          this.headerData = {};
          this.createFormGroup();
          if (this.showLineSection) {
            for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
              this.lineData.push(this.getLineInitialData());
            }
            this.generateItemsFormArray(this.lineData);
          }

          this.pageLoaded.emit({
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
            this.headerReady = true;
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
          this.getHeaderData(this.itemConfig.headerConfig!.id!);
          if (this.showLineSection) {
            this.id = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
            this.getLineData();
          } else {
            this.pageLoaded.emit({
              header: this.headerData,
              line: []
            });
          }
        }
      } else {
        this.router.navigate([this.itemConfig.returnUrl]);
      }
    });



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
  }

  get formControls() { return this.headerFormGroup.controls; }
  get items() { return this.lineFormGroup.get('items') as FormArray; }

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

  copyHeaderData(id: string) {
    this.restService.get(this.itemConfig.headerConfig!.api + '(' + id + ')').subscribe((response: any) => {
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
      //this.headerData.PortalResponsibilityCentre = this.sessionService.DefaultResponsibilityCenter;
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
        this.pageLoaded.emit({
          header: this.headerData,
          line: []
        });
      }
      this.cdr.detectChanges();
    }, (error) => {
      this.toastr.warning('Unable to find the item');
      this.router.navigate([this.itemConfig.returnUrl]);
    });
  }

  getHeaderData(id: string) {
    this.restService.get(this.itemConfig.headerConfig!.api + '(' + id + ')').subscribe((response: any) => {
      if (response && response.value) {
        if (response.value.length > 0) {
          this.headerData = this.removeUnicodeChars(response.value[0]);
        } else {
          this.toastr.error('Document is not found');
          this.router.navigate([this.itemConfig.returnUrl]);
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
        this.pageLoaded.emit({
          header: this.headerData,
          line: []
        });
      }
      this.cdr.detectChanges();
    }, (error) => {
      this.toastr.warning('Unable to find the item');
      this.router.navigate([this.itemConfig.returnUrl]);
    });
  }

  getLineData(lazy: boolean = false) {
    if (this.id) {
      let lines: any[] = [];
      for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
        lines.push(this.getLineInitialData());
      }

      let filter = "?$filter=" + this.itemConfig.lineConfig!.lineFKProp + " eq '" + this.id + "'";
      if (this.itemConfig.lineConfig!.filterByVersionNo) {
        filter += " and VersionNo eq " + this.headerData.VersionNo;
      }

      if (lazy) {
        this.page++;
        this.lazyloading = true;
        filter = filter + '&$top=' + this.pageSize + '&$skip=' + ((this.page - 1) * this.pageSize);
      }

      this.lazyloading = true;
      this.restService.get(this.itemConfig.lineConfig!.api + filter).subscribe((response: any) => {
        response.value.forEach((record: any) => {
          if (this.itemConfig.lineConfig!.removeUnicodeCharFields!.length > 0) {
            record = this.removeLineUnicodeChars(record);
          }
        });

        if (lazy) {
          if (response.value.length < this.pageSize) {
            this.showMoreButton = false;
          } else {
            this.showMoreButton = true;
          }
          this.lineData = [...this.lineData, ...response.value];
          if (this.lineData.length === 0) {
            if (this.lineData.length < this.itemConfig.lineConfig!.defaultLines!) {
              for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
                this.lineData.push(this.getLineInitialData());
              }
            }
          }

          if (this.lineData.length > 0) {
            this.generateItemsFormArray(this.lineData);
            this.pageLoaded.emit({
              header: this.headerData,
              line: this.lineData
            });
          } else {
            this.generateItemsFormArray(lines);
            this.pageLoaded.emit({
              header: this.headerData,
              line: []
            });
          }

          this.lazyloading = false;
        } else {
          this.lineData = response.value;
          if (!this.lineData) this.lineData = [];
          if (this.itemConfig.headerConfig!.id === 'copy') {
            this.copyLineData();
            if (this.lineData.length < this.itemConfig.lineConfig!.defaultLines!) {
              for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
                this.lineData.push(this.getLineInitialData());
              }
            }
          } else {
            if (this.lineData.length < this.itemConfig.lineConfig!.defaultLines!) {
              for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
                this.lineData.push(this.getLineInitialData());
              }
            }

            if (this.lineData.length > 0) {
              this.generateItemsFormArray(this.lineData);
              this.pageLoaded.emit({
                header: this.headerData,
                line: this.lineData
              });
            } else {
              this.generateItemsFormArray(lines);
              this.pageLoaded.emit({
                header: this.headerData,
                line: []
              });
            }
          }
        }

        this.lazyloading = false;
      }, (error) => {
        this.lazyloading = false;
        this.generateItemsFormArray(lines);
        this.pageLoaded.emit({
          header: this.headerData,
          line: []
        });
      });
    }
  }

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
        // line.PortalResponsibilityCentre = this.sessionService.DefaultResponsibilityCenter;
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
          this.pageLoaded.emit({
            header: this.headerData,
            line: this.lineData
          });
        }
      });

      this.id = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
      this.lineData = this.lineData.slice(0, this.pageSize - 1);
    } else {
      this.pageLoaded.emit({
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
          if (item[control.label!] === '0001-01-01') {
            data = null;
          } else if (item[control.label!] === '0001-01-01' && control.defaultSystemDate) {
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
      section: SectionType.Header
    });
  }

  leaveHeaderControl(data: ControlDataModel, control: FormField) {
    if (this.itemConfig.autoSave) {
      const oldValue = this.headerData[data.control];
      const newValue = data.data;
      const hasChanged = oldValue !== newValue;

      if (hasChanged) {
        if (data.readonly) {
          this.headerData[data.control] = newValue;
        } else {
          this.saveHeaderData(newValue, control);
        }
      }
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
      linesData: lineData
    });
  }

  leaveLineControl(data: ControlDataModel, control: FormField, row: number) {
    const itemGroup = this.items.controls[row] as FormGroup;
    const autoSave = control.autoSave !== false;
    if (this.itemConfig.autoSave && autoSave
      && (!this.viewMode || (this.viewMode && this.viewModeEnableControls.includes("Line_" + control.label)))) {
      if (itemGroup.valid || itemGroup.status === 'DISABLED') {
        let record = this.lineData[row];
        if (record[control.label!] !== data.data) {
          if (this.itemConfig.lineConfig!.lineFKProp && this.itemConfig.lineConfig!.headerPKProp) {
            record[this.itemConfig.lineConfig!.lineFKProp] = this.headerData[this.itemConfig.lineConfig!.headerPKProp];
          }
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
        this.utility.patchObject(this.lineData[row], this.utility.getLineControlsData(itemGroup.value, this.itemConfig.lineConfig!.controls!));
        this.lineData[row][control.label!] = data.data;
      }
    } else {
      this.utility.patchObject(this.lineData[row], this.utility.getLineControlsData(itemGroup.value, this.itemConfig.lineConfig!.controls!));
      this.lineData[row][control.label!] = data.data;
    }

    this.leaveEvent.emit({
      data: this.items.value,
      valid: this.items.valid,
      section: SectionType.Line
    });
  }

  changeLineCalculationControl(data: ControlDataModel) {
    this.changeEvent.emit({
      control: data.control,
      data: data.data,
      dropdownData: data.dropdownData,
      dropdownItems: data.dropdownItems,
      section: SectionType.Calculation
    });
  }

  leaveCalculationControl() {
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

        // Capture old value before PATCH so we can revert on error.
        const oldFieldValue = this.headerData.hasOwnProperty(control.label!)
          ? this.headerData[control.label!]
          : null;

        let patchData = {
          [control.label!]: data
        };
        patchData = this.utility.getHeaderControlsData(patchData, this.itemConfig.headerConfig!.controls!);
        const ifMatchKey = "*";
        this.restService.patch(this.itemConfig.headerConfig!.api! + '(' + this.headerData[this.itemConfig.headerConfig!.idProp!] + ')', patchData, ifMatchKey).subscribe((response: any) => {
          this.headerData = response;
          this.headerFormGroup.patchValue(
            this.utility.setHeaderControlsData({ ...response }, this.itemConfig.headerConfig!.controls!),
            { emitEvent: false }
          );
          this.saving = false;
          this.showEditButton = showEditButtonStatus;
          this.updateViewModeEnableControls();
          this.cdr.detectChanges();
        }, () => {
          // Revert field to pre-edit value on BC error.
          this.headerFormGroup.get(control.label!)?.setValue(oldFieldValue, { emitEvent: false });
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

  updateLineItemRecord(record: any, patchData: any, row: number, disableControls: boolean = true) {
    if (record[this.itemConfig.lineConfig!.idProp!] && !this.utility.compareObjects(record, patchData)) {
      const ifMatchKey = "*"; // record["@odata.etag"];
      const query = '(' + record[this.itemConfig.lineConfig!.idProp!] + ')';
      this.saving = disableControls;
      this.showEditButton = false;
      this.restService.patch(this.itemConfig.lineConfig!.api + query, patchData, ifMatchKey).subscribe((response: any) => {
        this.lineData[row] = response;
        if (this.itemConfig.lineConfig!.apiPatchProperties && this.itemConfig.lineConfig!.apiPatchProperties.length > 0) {
          let lines = this.items.controls as FormGroup[];
          this.itemConfig.lineConfig!.apiPatchProperties.forEach((prop: string) => {
            this.lineData[row][prop] = response[prop];
            lines[row].get(prop)!.patchValue(response[prop]);
          });
        }
        // Clear inline error on success
        delete this.lineErrors[row];
        this.lineErrors = { ...this.lineErrors };
        this.showEditButton = true;
        this.saving = false;
        this.pendingPatchData = null;
        this.cdr.detectChanges();
      }, (err: any) => {
        // Show inline error on the row — user stays and can fix the field
        const raw = err?.error?.message || err?.message || 'Save failed. Please correct the value and try again.';
        const message = raw.split('CorrelationId')[0].trim();
        this.lineErrors = { ...this.lineErrors, [row]: message };
        this.saving = false;
        this.showEditButton = true;
        this.cdr.detectChanges();
      });
    }
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
    // if (this.selectedLines.includes(index)) {
    //   this.selectedLines = this.selectedLines.filter(x => x !== index);
    // } else {
    //   this.selectedLines.push(index);
    // }
    // if (this.selectedLines.length === 0) {
    //   this.checkLineAll = false;
    // } else {
    //   this.checkLineAll = true;
    // }
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

  deleteLines() {
    if (this.selectedLines.length > 0) {
      const lineData = this.lineData[this.selectedLines[0]];
      if (lineData[this.itemConfig.lineConfig!.idProp!]) {
        this.restService.delete(this.itemConfig.lineConfig!.api + '(' + lineData[this.itemConfig.lineConfig!.idProp!] + ')').subscribe((res: any) => {
          this.lineData = this.lineData.filter(x => x[this.itemConfig.lineConfig!.idProp!] !== lineData[this.itemConfig.lineConfig!.idProp!]);
          let lines = this.items.controls as FormGroup[];
          lines.splice(this.selectedLines[0], 1);
          this.items.updateValueAndValidity();
          this.selectedLines = [];
          this.toastr.success('Record deleted successfully.');
          this.cdr.detectChanges();

          this.leaveEvent.emit({
            data: this.items.value,
            valid: this.items.valid,
            section: SectionType.Line
          });
        }, (error) => {
        });
      } else {
        let lines = this.items.controls as FormGroup[];
        lines.splice(this.selectedLines[0], 1);
        this.items.updateValueAndValidity();
        this.selectedLines = [];
        this.toastr.success('Record deleted successfully.');
        this.cdr.detectChanges();

        this.leaveEvent.emit({
          data: this.items.value,
          valid: this.items.valid,
          section: SectionType.Line
        });
      }
    } else {
      this.toastr.warning('Select line to delete!');
    }
  }

  customButtonClick(button: CustomButton, section: string, rowIndex: number = -1) {
    // If the button carries a lineConfig, open the setup modal automatically.
    // No code needed in the feature component whatsoever.
    if (button.lineConfig) {
      const ref = this.modal.open(SetupLineModalComponent, {
        size: 'lg',
        centered: true,
        backdrop: 'static',
      });
      ref.componentInstance.lineDataConfig = button.lineConfig;
      return;
    }
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
      this.router.navigate([this.itemConfig.returnUrl]);
    } else {
      this.router.navigate([this.itemConfig.returnUrl]);
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

  ngOnDestroy() {
    this.callPatchApiSubscription.unsubscribe();
    this.enableOrDisableAllControlsSubscription.unsubscribe();
    this.disableAllControlsExceptSomeSubscription.unsubscribe();
    this.patchLineDataSubscription.unsubscribe();
    this.showLoaderSubscription.unsubscribe();
    this.updateLineControlDataSubscription.unsubscribe();
    this.updateLineMultipleControlsDataSubscription.unsubscribe();
    this.disableLineControlSubscription.unsubscribe();
    this.cdr.detach();
  }
}
