import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Optional, Output } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { finalize, firstValueFrom, forkJoin, Subscription } from 'rxjs';

import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { FormField } from '../../../core/models/shared/formField';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';

import { RestService } from '../../../core/services/rest.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { FormFieldService } from '../../../core/services/shared/form-field.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
import { UniversalPopupService } from '../../../core/services/shared/universal-popup.service';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';
import { SubLineEngineService } from '../../../core/services/shared/sub-line-engine.service';
import { AddDimensionsLines } from './add-dimension.config';

@Component({
  standalone: false,
  selector: 'app-add-dimension',
  template: `
    <app-sub-line-section
      [headerData]="headerData"
      [itemConfig]="itemConfig"
      [documentType]="documentType"
      [viewMode]="viewMode"
      [loading]="loading"
      [showPopupLayout]="showPopupLayout"
      [sectionConfig]="config"
      [lineData]="lineData"
      [lineFormGroup]="lineFormGroup"
      [lineReady]="lineReady"
      [saving]="saving"
      [selectedLines]="selectedLines"
      [selectedRowIndex]="selectedRowIndex"
      [checkLineAll]="checkLineAll"

      (addLine)="addLineItem()"
      (deleteLine)="deleteLines()"
      (refreshLine)="refreshLines()"
      (exportLine)="exportLines()"
      (closeLinePopup)="closePopup()"
      (toolbarButtonClick)="onToolbarButtonClick($event)"
      (selectLine)="selectLineItem($event)"
      (selectAllLines)="selectAll()"
      (selectRowEvent)="selectRow($event)"
      (lineChange)="changeLineControl($event.data, $event.rowIndex)"
      (lineLeave)="leaveLineControl($event.data, $event.control, $event.rowIndex)">
    </app-sub-line-section>
  `,
})
export class AddDimensionComponent implements OnInit, OnDestroy {
  @Input() viewMode = false;
  @Input() headerData!: any;
  @Input() itemConfig!: any;
  @Input() loading!: boolean;
  @Input() documentType!: string;
  @Input() showPopupLayout!: boolean;
  @Input() sectionConfig?: LineDataConfig;

  @Output() popupLoaded = new EventEmitter<any>();
  @Output() changeEvent = new EventEmitter<EventDataModel>();
  @Output() dropdownOpend = new EventEmitter<EventDataModel>();
  headerVal!: number;
  config: any = {};

  lineData: any[] = [];
  lineFormGroup!: FormGroup;
  selectedLines: number[] = [];
  selectedRowIndex: number = 0;
  saving = false;
  checkLineAll = false;
  lineReady = false;

  private lineSaveTimer: any;
  private linePendingChanges = new Map<number, any>();
  private justCalledPostApi = false;
  private lastDimensionSaveSignature = new Map<number, string>();
  private activeDimensionRuleDefinition: any;
  private activeDimensionRulesPopup: any;
  private subscriptions: Subscription[] = [];
  protected showLoaderSubscription?: Subscription;
  protected refreshLineDataSubscription?: Subscription;

  constructor(
    private subLineEngine: SubLineEngineService,
    private rest: RestService,
    private restService: RestService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    @Optional() public activeModal: NgbActiveModal,
    private addItemService: AddItemService,
    private formFieldService: FormFieldService,
    private dialogService: UnifiedDialogService,
    private universalPopupService: UniversalPopupService,
    private selectedItemService: SelectedItemService,
  ) { }

  get items(): FormArray { return this.subLineEngine.getItems(this.lineFormGroup); }
  getLineFormGroup(row: number): FormGroup { return this.subLineEngine.getLineFormGroup(this.lineFormGroup, row); }
  get isBusy(): boolean { return this.saving || this.loading; }
  get sectionTitle(): string { return this.config?.title || 'Lines'; }
  get visibleButtons(): any[] {
    return (this.config?.buttons || []).filter((button: any) => button?.isVisible !== false);
  }

  ngOnInit() {
    this.config = this.sectionConfig || AddDimensionsLines;
    this.lineFormGroup = this.subLineEngine.createLineFormGroup();
    if (!this.config?.controls?.length) {
      this.toastr.warning('Subline section is missing line configuration.');
      this.lineReady = true;
      return;
    }
    this.headerVal = this.headerData.dimensionSetID;
    this.getLineData(this.headerVal);
    this.showLoaderSubscription = this.addItemService.showLoader$.subscribe((data: boolean) => {
      this.loading = data;
      this.cdr.detectChanges();
    });
    this.refreshLineDataSubscription = this.addItemService.popupRefreshLineData$.subscribe(() => {
      this.refreshLines();
    });
  }



  getDims() {
    this.addItemService.showLoader$.next(true);
    const headerVal = this.headerData.dimensionSetID;
    const url: string = `${this.config.api}/Microsoft.NAV.getDims`;
    const payload = {
      dimSetId: headerVal
    }
    try {
      this.restService.post(url, payload).subscribe((response: any) => {
        this.addItemService.showLoader$.next(false);
      });
    }
    finally {
      this.addItemService.popupRefreshLineData$.next(true);

    }
  }


  refreshLines() {
    this.getLineData(this.headerVal || this.headerData?.dimensionSetID);
  }

  getLineData(headerVal: any) {
    this.loading = true;
    this.cdr.detectChanges();
    const normalizedHeaderVal = Number(headerVal);
    if (!Number.isFinite(normalizedHeaderVal) || normalizedHeaderVal <= 0) {
      this.lineData = [];
      for (let i = 0; i < 3; i++) {
        this.lineData.push(this.getLineInitialData());
      }

      this.generateItemsFormArray(this.lineData);
      this.lineReady = true;
      this.clearSelection();
      this.popupLoaded.emit({ line: this.lineData });
      this.handlePopupLoaded({ line: this.lineData });
      this.loading = false;
      setTimeout(() => this.cdr.detectChanges());
      return;
    }

    this.headerVal = normalizedHeaderVal;
    const url = `${this.config.api}?$filter=dimensionSetID eq ${this.headerVal}`;
    this.rest.get(url).subscribe({
      next: (res: any) => {
        this.lineData = res?.value || [];

        if (this.lineData.length < 3) {
          for (let i = this.lineData.length; i < 3; i++) {
            this.lineData.push(this.getLineInitialData());
          }
        }

        this.generateItemsFormArray(this.lineData);
        this.lineReady = true;
        this.clearSelection();

        this.popupLoaded.emit({ line: this.lineData });

        this.handlePopupLoaded({ line: this.lineData });

        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.toastr.error('Failed to load related lines');
        this.loading = false;
        this.lineReady = true;
        this.lineData = [];
        this.generateItemsFormArray([]);
        this.ensureTrailingEmptyLines(3);
        this.cdr.detectChanges();
      }
    });
  }

  generateItemsFormArray(data: any[]) {
    this.lineFormGroup = this.subLineEngine.rebuildFormArray(this.config, data || []);
  }


  createItemFormGroup(item: any) {
    return this.subLineEngine.createItemFormGroup(this.lineFormGroup, this.config, item);
  }


  getLineInitialData(): any {
    return this.subLineEngine.createInitialLineData(this.config);
  }


  addLineItem() {
    if (this.isBusy || this.viewMode || this.config?.showCreate === false) {
      return;
    }

    this.subLineEngine.addBlankLine(this.config, this.lineData, this.lineFormGroup, 2);
    this.cdr.detectChanges();
  }


  changeLineControl(data: ControlDataModel, rowIndex: number) {
    const clone = this.subLineEngine.applyLineControlValue(
      this.lineData,
      rowIndex,
      data.control,
      data.data
    );

    const eventData = this.subLineEngine.buildLineEvent(data, clone, rowIndex, '');

    this.changeEvent.emit(eventData);
    this.dropdownOpend.emit(eventData);

    this.ensureTrailingEmptyLines(2);
    this.onChangeEvent(eventData);

    if (data.control === 'DimensionValueCode' && data.data) {
      const control = this.config.controls.find((item: FormField) => item.label === data.control);
      if (control) {
        this.leaveLineControl(data, control, rowIndex);
      }
    }
  }


  leaveLineControl(data: ControlDataModel, control: FormField, row: number) {
    const itemGroup = this.items.at(row) as FormGroup;
    const record = this.lineData[row];

    if (!data || data.data === null || data.data === '' || data.data === undefined) return;

    if (this.subLineEngine.hasMissingMandatoryFields(itemGroup, this.config, ['DimensionCode'])) return;

    record[control.label!] = data.data;

    if (control.label === 'DimensionValueCode') {
      const signature = [
        record.DimensionCode,
        itemGroup.get('DimensionValueCode')?.value,
        record[this.config.idProp] || 'new',
        this.headerVal
      ].join('|');

      if (this.lastDimensionSaveSignature.get(row) === signature) {
        return;
      }

      this.lastDimensionSaveSignature.set(row, signature);
    }

    if (!record[this.config.idProp] && !this.justCalledPostApi) {
      this.justCalledPostApi = true;

      const final = this.subLineEngine.getLineControlsData(itemGroup.value, this.config);

      this.addLineItemRecord(final, row);
      return;
    }

    this.subLineEngine.mergePendingChange(this.linePendingChanges, row, control.label!, data.data);

    this.scheduleLineSave();
  }

  private scheduleLineSave() {
    clearTimeout(this.lineSaveTimer);
    this.lineSaveTimer = setTimeout(() => this.performLineSave(), 1500);
  }

  private performLineSave() {
    this.linePendingChanges.forEach((changes, row) => {
      const record = this.lineData[row];
      const id = record[this.config.idProp];
      if (!id) return;

      const patchData = this.subLineEngine.getLineControlsData(changes, this.config);
      this.updateLineItemRecord(record, patchData, row);
    });

    this.linePendingChanges.clear();
  }


  private async buildFullRuleFilter(dimCode: string, dimValue: string): Promise<string> {
    const headerId = this.headerData[this.config.idProp];
    if (!headerId) return '';

    const headerRes: any = await firstValueFrom(
      this.rest.get(`${this.itemConfig.headerConfig.api}(${headerId})`)
    );

    const dimSetId = headerRes?.dimensionSetID;
    if (!dimSetId || dimSetId === 0) return '';


    const entriesRes: any = await firstValueFrom(
      this.rest.get(`/dimensionSetEntries?$filter=dimensionSetID eq ${dimSetId}`)
    );

    const entries = entriesRes?.value || [];
    if (!entries.length) return '';

    const rulesRes: any = await firstValueFrom(
      this.rest.get(`/dimensionRules?$filter=lineNo eq 10000`)
    );

    const defRow = rulesRes?.value?.[0];
    if (!defRow) return '';

    const ruleColumnMap = this.buildRuleColumnMap(defRow);
    const filters: string[] = [];

    entries.forEach((e: any) => {
      if (e.DimensionCode === dimCode) return;

      const col = ruleColumnMap[e.DimensionCode];
      if (col && e.DimensionValueCode) {
        filters.push(`${col} eq '${e.DimensionValueCode}'`);
      }
    });

    const payloadCol = ruleColumnMap[dimCode];
    if (!payloadCol || !dimValue) return '';

    filters.push(`${payloadCol} eq '${dimValue}'`);

    return filters.join(' and ');
  }


  async addLineItemRecord(item: any, row: number) {
    this.saving = true;

    try {
      const dimCode = item.DimensionCode;
      const dimValue = item.DimensionValueCode;

      if (this.headerVal !== 0) {

        const ruleFilter = await this.buildFullRuleFilter(dimCode, dimValue);
        if (!ruleFilter) {
          this.toastr.warning('Not match with rules');
          this.saving = false;
          this.justCalledPostApi = false;
          this.lastDimensionSaveSignature.delete(row);
          this.getLineData(this.headerVal);
          return;
        }

        const ruleRes: any = await firstValueFrom(
          this.rest.get(`/dimensionRules?$filter=${ruleFilter}`)
        );

        const matchedRules = ruleRes?.value || [];
        if (!matchedRules.length) {
          this.toastr.warning('Not match with rules');
          this.saving = false;
          this.justCalledPostApi = false;
          this.linePendingChanges.delete(row);
          this.lastDimensionSaveSignature.delete(row);
          this.getLineData(this.headerVal);
          return;
        }
      }

      const headerId = this.headerData[this.config.idProp];

      const payload = {
        dimCode,
        dimValue,
        existingDimSetID: this.headerVal
      };

      const api =
        `${this.itemConfig.headerConfig.api}(${headerId})/Microsoft.NAV.setDimMerged`;

      this.rest.post(api, payload).subscribe({
        next: (res: any) => {
          this.updateDimensionSetId(res?.value);
          this.lineData[row] = res;
          this.justCalledPostApi = false;
          this.saving = false;
          this.addItemService.refreshData$.next(true);
          this.getLineData(this.headerVal);
          setTimeout(() => this.cdr.detectChanges());
        },
        error: () => {
          this.justCalledPostApi = false;
          this.saving = false;
          this.lastDimensionSaveSignature.delete(row);
          this.toastr.error('Failed to create line');
        }
      });

    } catch (err) {
      console.error(err);
      this.justCalledPostApi = false;
      this.saving = false;
      this.lastDimensionSaveSignature.delete(row);
      this.toastr.error('Not match with rules');
      this.getLineData(this.headerVal);
    }
  }



  async updateLineItemRecord(record: any, patchData: any, row: number) {
    this.saving = true;

    try {
      const dimCode = record.DimensionCode;
      const dimValue = patchData.DimensionValueCode;

      const ruleFilter = await this.buildFullRuleFilter(dimCode, dimValue);

      if (!ruleFilter) {
        this.toastr.warning('Not match with rules');
        this.saving = false;
        this.justCalledPostApi = false;
        this.lastDimensionSaveSignature.delete(row);
        this.getLineData(this.headerVal);
        return;
      }

      const ruleRes: any = await firstValueFrom(
        this.rest.get(`/dimensionRules?$filter=${ruleFilter}`)
      );

      const matchedRules = ruleRes?.value || [];

      if (!matchedRules.length) {
        this.toastr.warning('Not match with rules');
        this.saving = false;
        this.justCalledPostApi = false;
        this.linePendingChanges.delete(row);
        this.lastDimensionSaveSignature.delete(row);
        this.getLineData(this.headerVal);
        return;
      }

      const headerId = this.headerData[this.config.idProp];

      const payload = {
        dimCode,
        dimValue,
        existingDimSetID: this.headerVal
      };

      const api =
        `${this.itemConfig.headerConfig.api}(${headerId})/Microsoft.NAV.setDimMerged`;

      this.rest.post(api, payload).subscribe({
        next: (res: any) => {
          this.updateDimensionSetId(res?.value);
          this.lineData[row] = res;
          this.justCalledPostApi = false;
          this.saving = false;
          this.addItemService.refreshData$.next(true);
          this.getLineData(this.headerVal);
          setTimeout(() => this.cdr.detectChanges());
        },
        error: () => {
          this.justCalledPostApi = false;
          this.saving = false;
          this.lastDimensionSaveSignature.delete(row);
          this.toastr.error('Failed to update line');
        }
      });

    } catch (err) {
      console.error(err);
      this.justCalledPostApi = false;
      this.saving = false;
      this.lastDimensionSaveSignature.delete(row);
      this.toastr.error('Not match with rules');
      this.getLineData(this.headerVal);
    }
  }



  private ensureTrailingEmptyLines(minTrailing: number) {
    this.subLineEngine.ensureTrailingEmptyLines(this.config, this.lineData, this.lineFormGroup, minTrailing);
  }


  async deleteLines() {
    if (this.isBusy || this.viewMode || this.config?.showDelete === false) {
      return;
    }

    if (!this.selectedLines.length) {
      this.toastr.warning('Select line(s) to delete!');
      return;
    }

    const confirmed = await this.dialogService.confirmDelete();
    if (!confirmed) {
      return;
    }

    const sorted = [...this.selectedLines].sort((a, b) => b - a);
    this.saving = true;
    this.addItemService.showLoader$.next(true);
    this.cdr.detectChanges();

    const deleteNext = (index: number) => {
      if (index >= sorted.length) {
        this.saving = false;
        this.addItemService.showLoader$.next(false);
        this.getLineData(this.headerVal);
        this.selectedLines = [];
        this.checkLineAll = false;
        this.addItemService.refreshData$.next(true);
        return;
      }

      const lineIndex = sorted[index];
      const rec = this.lineData[lineIndex];
      const payload = {
        dimCode: rec.DimensionCode,
        existingDimSetID: this.headerVal
      };

      const headerId = this.headerData[this.config.idProp];

      if (rec.DimensionCode) {
        let api = `${this.itemConfig.headerConfig.api}(${headerId})/Microsoft.NAV.deleteDimension`;

        this.rest.post(api, payload).subscribe({
          next: (res: any) => {
            this.subLineEngine.removeLineAt(this.lineFormGroup, this.lineData, lineIndex);

            this.updateDimensionSetId(res?.value);

            setTimeout(() => this.cdr.detectChanges());
            setTimeout(() => deleteNext(index + 1), 200);
          },
          error: () => {
            this.saving = false;
            this.addItemService.showLoader$.next(false);
            this.toastr.error('Failed to delete dimension');
            this.refreshLines();
          }
        });

      } else {
        this.subLineEngine.removeLineAt(this.lineFormGroup, this.lineData, lineIndex);

        setTimeout(() => deleteNext(index + 1), 200);
      }
    };

    deleteNext(0);
  }

  exportLines() {
    if (this.isBusy || this.config?.showExcelExport === false) {
      return;
    }

    this.subLineEngine.exportLines(this.lineData, this.config, 'DimensionLines');
  }


  selectLineItem(i: number) {
    const state = this.subLineEngine.toggleLineSelection(this.selectedLines, i, this.lineData.length);
    this.selectedLines = state.selectedLines;
    this.checkLineAll = state.checkLineAll;
  }


  selectRow(index: number): void {
    if (this.isBusy) {
      return;
    }

    this.selectedRowIndex = this.subLineEngine.selectRow(this.lineData, index);
    this.cdr.detectChanges();
  }


  selectAll() {
    if (this.isBusy) {
      return;
    }

    const state = this.subLineEngine.toggleAllLines(this.checkLineAll, this.lineData.length);
    this.selectedLines = state.selectedLines;
    this.checkLineAll = state.checkLineAll;
  }



  handlePopupLoaded(data: any) {
    if (!data?.line) return;

    const requests: any[] = [];

    data.line.forEach((line: any, rowIndex: number) => {
      if (!line.DimensionCode) return;
      const req = this.restService
        .get(`/dimensionsValues?$filter=DimensionCode eq '${line.DimensionCode}'`);

      requests.push(
        req.pipe()
      );
    });
    if (!requests.length) return;
    this.addItemService.showLoader$.next(true);

    forkJoin(requests)
      .pipe(
        finalize(() => {
          this.addItemService.showLoader$.next(false);
        })
      )
      .subscribe({
        next: (responses: any[]) => {

          let requestIndex = 0;

          data.line.forEach((line: any, rowIndex: number) => {

            if (!line.DimensionCode) return;

            const res = responses[requestIndex++];
            const values = res?.value || [];

            this.formFieldService.updateDropdownItem$.next({
              label: 'DimensionValueCode',
              items: values,
              displayFormat: '[Code] - [Name]',
              bindValue: 'Code',
              bindLabel: 'Code',
              rowIndex
            });

          });
        },
        error: () => {
          this.toastr.error('Failed to load dimension dropdowns');
        }
      });
  }

  onChangeEvent(data: EventDataModel) {
    if (data.control === 'DimensionCode') this.handleDimensionCodeChange(data);
    if (data.control === 'DimensionValueCode') this.handleDimensionValueCodeChange(data);
  }

  async handleDimensionCodeChange1(data: EventDataModel) {

    this.formFieldService.updateDropdownItem$.next({
      label: 'DimensionValueCode',
      items: [],
      displayFormat: '[Code] - [Name]',
      bindValue: 'Code',
      bindLabel: 'Code',
      rowIndex: data.rowIndex
    });

    this.addItemService.showLoader$.next(true);

    try {

      const ruleDefRes: any = await firstValueFrom(
        this.rest.get(`/dimensionRules?$filter=lineNo eq 10000`)
      );

      const ruleDef = ruleDefRes?.value?.[0];
      if (!ruleDef) {
        this.addItemService.showLoader$.next(false);
        return;
      }

      const columnMap: Record<string, string> = {};

      Object.keys(ruleDef).forEach(key => {
        if (key.toLowerCase().startsWith('dimension') && ruleDef[key]) {
          columnMap[ruleDef[key]] = key;
        }
      });

      const currentColumn = columnMap[data.data];
      if (!currentColumn) {
        this.addItemService.showLoader$.next(false);
        return;
      }

      const filters: string[] = [];

      this.lineData.forEach((line: any, index: number) => {

        if (index === data.rowIndex) return;

        if (!line.DimensionCode || !line.DimensionValueCode) return;

        const col = columnMap[line.DimensionCode];

        if (col) {
          filters.push(`${col} eq '${line.DimensionValueCode}'`);
        }
      });

      let filterQuery = '';

      if (filters.length) {
        filterQuery = `?$filter=${filters.join(' and ')}`;
      }

      const rulesRes: any = await firstValueFrom(
        this.rest.get(`/dimensionRules${filterQuery}`)
      );

      const rules = rulesRes?.value || [];

      const uniqueValues = [
        ...new Set(
          rules
            .map((r: any) => r[currentColumn])
            .filter((v: any) => v)
        )
      ];

      const dropdownItems = uniqueValues.map(v => ({
        Code: v,
        Name: v
      }));

      this.addItemService.showLoader$.next(false);
      this.formFieldService.updateDropdownItem$.next({
        label: 'DimensionValueCode',
        items: dropdownItems,
        bindValue: 'Code',
        bindLabel: 'Code',
        rowIndex: data.rowIndex
      });

    } catch (err) {
      console.error(err);
      this.addItemService.showLoader$.next(false);
    }
  }

  async handleDimensionCodeChange(data: EventDataModel) {
    if (data.rowIndex !== undefined && data.rowIndex !== null) {
      const rowGroup = this.getLineFormGroup(data.rowIndex);
      rowGroup?.patchValue({
        DimensionValueCode: null,
        DimensionValueName: null
      }, { emitEvent: false });

      this.lineData[data.rowIndex] = {
        ...(this.lineData[data.rowIndex] || {}),
        DimensionCode: data.data,
        DimensionValueCode: null,
        DimensionValueName: null
      };
    }

    this.formFieldService.updateDropdownItem$.next({
      label: 'DimensionValueCode',
      items: [],
      displayFormat: '[Code] - [Name]',
      bindValue: 'Code',
      bindLabel: 'Code',
      rowIndex: data.rowIndex
    });

    this.addItemService.showLoader$.next(true);

    try {
      const ruleDefRes: any = await firstValueFrom(
        this.rest.get(`/dimensionRules?$filter=lineNo eq 10000`)
      );

      const ruleDef = ruleDefRes?.value?.[0];
      if (!ruleDef) {
        this.addItemService.showLoader$.next(false);
        return;
      }

      const columnMap: Record<string, string> = {};

      Object.keys(ruleDef).forEach(key => {
        if (key.toLowerCase().startsWith('dimension') && ruleDef[key]) {
          columnMap[ruleDef[key]] = key;
        }
      });

      const currentColumn = columnMap[data.data];
      if (!currentColumn) {
        this.addItemService.showLoader$.next(false);
        return;
      }

      const filters: string[] = [];

      this.lineData.forEach((line: any, index: number) => {
        if (index === data.rowIndex) return;
        if (!line.DimensionCode || !line.DimensionValueCode) return;

        const col = columnMap[line.DimensionCode];
        if (col) {
          filters.push(`${col} eq '${line.DimensionValueCode}'`);
        }
      });

      let filterQuery = '';
      if (filters.length) {
        filterQuery = `?$filter=${filters.join(' and ')}`;
      }

      const rulesRes: any = await firstValueFrom(
        this.rest.get(`/dimensionRules${filterQuery}`)
      );

      const rules = rulesRes?.value || [];

      const uniqueValues = [
        ...new Set(
          rules
            .map((r: any) => r[currentColumn])
            .filter((v: any) => v)
        )
      ];

      const dimValuesRes: any = await firstValueFrom(
        this.rest.get(`/dimensionsValues?$filter=DimensionCode eq '${data.data}'`)
      );

      const allDimensionValues = dimValuesRes?.value || [];
      const allowedValueCodes = new Set(
        uniqueValues.map((value: any) => String(value).trim().toUpperCase())
      );

      const dropdownItems = allDimensionValues.filter((x: any) =>
        allowedValueCodes.has(String(x.Code).trim().toUpperCase())
      );

      this.addItemService.showLoader$.next(false);

      this.formFieldService.updateDropdownItem$.next({
        label: 'DimensionValueCode',
        items: dropdownItems,
        displayFormat: '[Code] - [Name]',
        bindValue: 'Code',
        bindLabel: 'Code',
        rowIndex: data.rowIndex
      });

    } catch (err) {
      console.error(err);
      this.addItemService.showLoader$.next(false);
    }
  }

  handleDimensionValueCodeChange(data: EventDataModel) {
    this.addItemService.showLoader$.next(true);

    const rowIndex = data.rowIndex;
    const dimensionCode = rowIndex !== undefined && rowIndex !== null
      ? this.getLineFormGroup(rowIndex).get('DimensionCode')?.value || this.lineData[rowIndex]?.DimensionCode
      : null;
    const filter = dimensionCode
      ? `DimensionCode eq '${dimensionCode}' and Code eq '${data.data}'`
      : `Code eq '${data.data}'`;

    this.restService.get(`/dimensionsValues?$filter=${filter}`)
      .subscribe((res: any) => {
        const record = res?.value?.[0];
        this.addItemService.showLoader$.next(false);

        if (record) {
          this.formFieldService.updateDropdownItem$.next({
            label: 'DimensionValueName',
            items: [{ name: record.Name }],
            bindValue: 'name',
            bindLabel: 'name',
            rowIndex: data.rowIndex
          });
        }
      });
  }

  ngOnDestroy() {
    clearTimeout(this.lineSaveTimer);
    this.subscriptions.forEach(s => s.unsubscribe());
    this.showLoaderSubscription?.unsubscribe();
    this.refreshLineDataSubscription?.unsubscribe();
  }

  closePopup() {
    this.activeModal?.close({ action: 'close', record: null });
    this.addItemService.refreshData$.next(true);
  }


  private patchHeaderDimensionSet(newDimSetID: any) {

    const headerId = this.headerData[this.config.idProp] || this.headerData.Id;

    if (!headerId) {
      return;
    }

    const patchBody = {
      dimensionSetID: newDimSetID
    };

    this.rest.patch(`${this.itemConfig.headerConfig.api}(${headerId})`, patchBody, '*')
      .subscribe({
        next: () => {
        },
        error: err => {
        }
      });
  }


  openDimensionRules(data: any, itemConfig: any) {
    if (this.isBusy) {
      return;
    }

    this.openDimensionRulesPopup('');
  }

  onToolbarButtonClick(button: any): void {
    if (this.isBusy || button?.isEnable === false) {
      return;
    }

    switch (button?.label) {
      case 'dimensionRules':
        this.openDimensionRules(this.headerData, this.itemConfig);
        break;
      case 'selectDimensionRule':
        this.selectRule(this.headerData, this.itemConfig);
        break;
      default:
        this.changeEvent.emit({
          control: button?.label,
          data: button,
          activeData: null,
          section: SectionType.Line,
          linesData: this.lineData,
          headerData: this.headerData
        });
        break;
    }
  }

  async selectRule(headerData: any, itemConfig: any) {
    if (this.isBusy || this.viewMode) {
      return;
    }

    this.addItemService.showLoader$.next(true);

    try {
      const ruleFilter = await this.buildDimensionRuleFilter();
      this.openDimensionRulesPopup(ruleFilter);

    } finally {
      this.addItemService.showLoader$.next(false);
    }
  }

  private openDimensionRulesPopup(ruleFilter: string): void {
    const api = ruleFilter
      ? `/dimensionRules?$filter=${ruleFilter}`
      : '/dimensionRules';

    this.activeDimensionRulesPopup = this.universalPopupService.openModulePopup('dimensionRules', {
      size: 'xl',
      headerData: this.headerData,
      lineApiOverrideConfig: {
        api,
        defaultLines: 0,
        isDirectApi: true,
        showCreate: false,
        showDelete: false
      },
      onLoaded: (data: any) => this.handleDimensionRulesLoaded(data),
      onButtonClick: (data: any) => this.handleDimensionRulesButton(data)
    });
  }

  private handleDimensionRulesLoaded(data: any): void {
    const lines = data?.line || [];
    const itemConfig = data?._itemConfig;
    const instance = data?._instance;
    let definitionRow = lines.find((line: any) => line?.lineNo === 10000);

    if (!definitionRow && this.activeDimensionRuleDefinition) {
      definitionRow = this.activeDimensionRuleDefinition;
    }

    if (!definitionRow || !itemConfig?.lineConfig?.controls) {
      return;
    }

    this.activeDimensionRuleDefinition = definitionRow;
    itemConfig.lineConfig.controls.forEach((control: FormField) => {
      const value = definitionRow[control.label!];
      control.name = value || control.label;
      control.hidden = value === '' || value === null || value === undefined;
    });

    instance?.cdr?.detectChanges?.();
  }

  private async handleDimensionRulesButton(data: any): Promise<void> {
    if (data?.button?.label !== 'applyDimensionRule') {
      return;
    }

    const selectedIndexes = await firstValueFrom(this.selectedItemService.selectedLines$);

    if (!selectedIndexes?.length) {
      this.toastr.warning('No lines selected.');
      return;
    }

    if (selectedIndexes.length > 1) {
      this.toastr.warning('Please select one line only.');
      return;
    }

    const ruleRow = data?.lineData?.[selectedIndexes[0]];
    if (!ruleRow) {
      return;
    }

    const dimensionsToApply = this.getDimensionRuleMappings()
      .map(mapping => ({
        dimCode: mapping.code,
        dimValue: ruleRow[mapping.column]
      }))
      .filter(dimension => dimension.dimValue);

    if (!dimensionsToApply.length) {
      this.toastr.warning('No dimensions found in selected rule.');
      return;
    }

    await this.applyDimensionsFromRules(dimensionsToApply);
    this.activeDimensionRulesPopup?.close?.({
      action: 'applyDimensions',
      dimensions: dimensionsToApply
    });
    this.activeDimensionRulesPopup = null;
  }

  private getDimensionRuleMappings(): { code: string; column: string }[] {
    if (!this.activeDimensionRuleDefinition) {
      return [];
    }

    return Object.keys(this.activeDimensionRuleDefinition)
      .filter(key => key.startsWith('dimension') && this.activeDimensionRuleDefinition[key])
      .map(key => ({
        code: this.activeDimensionRuleDefinition[key],
        column: key
      }));
  }




  async applyDimensionsFromRules(dimensions: any[]) {
    this.addItemService.showLoader$.next(true);
    if (!dimensions?.length) {
      this.addItemService.showLoader$.next(false);
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();

    try {
      for (let i = 0; i < dimensions.length; i++) {
        await this.applySingleDimension(dimensions[i], i + 1, dimensions.length);
      }

      this.toastr.success("Dimensions applied successfully");
      this.getLineData(this.headerVal);

    } catch (err) {
      this.toastr.error("Failed to apply one or more dimensions");
    } finally {
      this.saving = false;
      this.addItemService.showLoader$.next(false);
      this.cdr.detectChanges();
    }
  }



  applySingleDimension(
    dim: { dimCode: string; dimValue: string },
    current: number,
    total: number
  ) {
    return new Promise<void>((resolve, reject) => {

      const payload = {
        dimCode: dim.dimCode,
        dimValue: dim.dimValue,
        existingDimSetID: this.headerVal
      };

      const headerId = this.headerData[this.config.idProp];
      const api = `${this.itemConfig.headerConfig.api}(${headerId})/Microsoft.NAV.setDimMerged`;

      this.rest.post(api, payload).subscribe({
        next: (res: any) => {
          this.updateDimensionSetId(res?.value);
          this.addItemService.refreshData$.next(true);
          resolve();
        },
        error: err => {
          this.toastr.error(`Failed: ${dim.dimCode}`);
          reject(err);
        }
      });
    });
  }


  private async buildDimensionRuleFilter(): Promise<string> {  //for setRule 
    const idProp = this.itemConfig.headerConfig.idProp;
    const headerId = this.headerData[idProp];

    if (!headerId) return '';
    const headerRes: any = await firstValueFrom(
      this.restService.get(`${this.itemConfig.headerConfig.api}(${headerId})`)
    );

    const dimSetId = headerRes?.dimensionSetID;
    if (!dimSetId) return '';
    const entriesRes: any = await firstValueFrom(
      this.rest.get(`/dimensionSetEntries?$filter=dimensionSetID eq ${dimSetId}`)
    );

    const entries = entriesRes?.value || [];
    if (!entries.length) return '';

    const rulesRes: any = await firstValueFrom(
      this.rest.get(`/dimensionRules`)
    );

    const allRules = rulesRes?.value || [];
    const firstRow = allRules.find((x: any) => x.lineNo === 10000);
    if (!firstRow) return '';
    this.activeDimensionRuleDefinition = firstRow;

    const ruleColumnMap = this.buildRuleColumnMap(firstRow);

    const filters: string[] = [];

    entries.forEach((e: any) => {
      const column = ruleColumnMap[e.DimensionCode];
      if (column && e.DimensionValueCode) {
        filters.push(`${column} eq '${e.DimensionValueCode}'`);
      }
    });

    return filters.join(' and ');
  }


  private buildRuleColumnMap(firstRow: any): Record<string, string> {
    const map: Record<string, string> = {};

    Object.keys(firstRow).forEach(key => {
      if (key.startsWith('dimension') && firstRow[key]) {
        map[firstRow[key]] = key;
      }
    });

    return map;
  }

  private updateDimensionSetId(nextDimensionSetId: any): void {
    if (nextDimensionSetId === undefined || nextDimensionSetId === null) {
      return;
    }

    this.headerVal = Number(nextDimensionSetId);
    if (this.headerData) {
      this.headerData.dimensionSetID = this.headerVal;
    }
  }

  private clearSelection(): void {
    const state = this.subLineEngine.clearSelection(this.selectedRowIndex);
    this.selectedLines = state.selectedLines;
    this.checkLineAll = state.checkLineAll;
  }








}
