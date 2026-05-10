import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';

import { ControlDataModel } from '../../models/shared/controlDataModel';
import { EventDataModel, SectionType } from '../../models/shared/eventDataModel';
import { FormField } from '../../models/shared/formField';
import { FormFieldType } from '../../models/shared/formField.enum';
import { LineDataConfig } from '../../models/shared/line-data.config';
import { Utility } from '../utility.service';
import { ExcelExportService } from './excel-export.service';

export interface SubLineSelectionState {
  selectedLines: number[];
  checkLineAll: boolean;
  selectedRowIndex?: number;
}

@Injectable({ providedIn: 'root' })
export class SubLineEngineService {
  constructor(
    private fb: FormBuilder,
    private utility: Utility,
    private excel: ExcelExportService
  ) { }

  createLineFormGroup(): FormGroup {
    return this.fb.group({
      items: new FormArray([])
    });
  }

  getItems(lineFormGroup: FormGroup): FormArray {
    return lineFormGroup.get('items') as FormArray;
  }

  getLineFormGroup(lineFormGroup: FormGroup, row: number): FormGroup {
    return this.getItems(lineFormGroup).at(row) as FormGroup;
  }

  rebuildFormArray(config: LineDataConfig, lineData: any[]): FormGroup {
    const lineFormGroup = this.createLineFormGroup();
    (lineData || []).forEach(item => this.createItemFormGroup(lineFormGroup, config, item));
    return lineFormGroup;
  }

  createItemFormGroup(lineFormGroup: FormGroup, config: LineDataConfig, item: any): FormGroup {
    const group: Record<string, FormControl> = {};

    (config?.controls || []).forEach((control: FormField) => {
      if (!control?.label) {
        return;
      }

      group[control.label] = new FormControl(
        item?.[control.label] ?? null,
        this.getValidators(control)
      );
    });

    const formGroup = this.fb.group(group);
    this.getItems(lineFormGroup).push(formGroup);
    return formGroup;
  }

  createInitialLineData(config: LineDataConfig): any {
    const line: any = {};

    (config?.controls || []).forEach((control: FormField) => {
      if (!control?.label) {
        return;
      }

      line[control.label] = control.initialValue !== undefined ? control.initialValue : null;
    });

    return line;
  }

  ensureMinimumRows(config: LineDataConfig, lineData: any[], lineFormGroup: FormGroup, minimumRows: number): void {
    while (lineData.length < minimumRows) {
      const row = this.createInitialLineData(config);
      lineData.push(row);
      this.createItemFormGroup(lineFormGroup, config, row);
    }
  }

  ensureTrailingEmptyLines(config: LineDataConfig, lineData: any[], lineFormGroup: FormGroup, minTrailing: number): void {
    let trailing = 0;

    for (let i = lineData.length - 1; i >= 0; i--) {
      if (this.isLineEmpty(lineData[i])) {
        trailing++;
      } else {
        break;
      }
    }

    const required = Math.max(0, minTrailing - trailing);

    for (let i = 0; i < required; i++) {
      const row = this.createInitialLineData(config);
      lineData.push(row);
      this.createItemFormGroup(lineFormGroup, config, row);
    }
  }

  addBlankLine(config: LineDataConfig, lineData: any[], lineFormGroup: FormGroup, minTrailing = 2): any {
    const row = this.createInitialLineData(config);
    lineData.push(row);
    this.createItemFormGroup(lineFormGroup, config, row);
    this.ensureTrailingEmptyLines(config, lineData, lineFormGroup, minTrailing);
    return row;
  }

  removeLineAt(lineFormGroup: FormGroup, lineData: any[], index: number): void {
    if (index < 0 || index >= lineData.length) {
      return;
    }

    this.getItems(lineFormGroup).removeAt(index);
    lineData.splice(index, 1);
  }

  clearSelection(selectedRowIndex = 0): SubLineSelectionState {
    return {
      selectedLines: [],
      checkLineAll: false,
      selectedRowIndex
    };
  }

  toggleLineSelection(selectedLines: number[], index: number, totalRows: number): SubLineSelectionState {
    const nextSelected = selectedLines.includes(index)
      ? selectedLines.filter(rowIndex => rowIndex !== index)
      : [...selectedLines, index];

    return {
      selectedLines: nextSelected,
      checkLineAll: nextSelected.length > 0 && nextSelected.length === totalRows
    };
  }

  toggleAllLines(checkLineAll: boolean, totalRows: number): SubLineSelectionState {
    const nextCheckAll = !checkLineAll;

    return {
      checkLineAll: nextCheckAll,
      selectedLines: nextCheckAll ? Array.from({ length: totalRows }, (_, index) => index) : []
    };
  }

  selectRow(lineData: any[], index: number): number {
    lineData.forEach((line: any) => line.__selected = false);

    if (lineData[index]) {
      lineData[index].__selected = true;
    }

    return index;
  }

  applyLineControlValue(lineData: any[], rowIndex: number, controlName: string, value: any): any[] {
    const snapshot = this.cloneLines(lineData);

    if (!snapshot[rowIndex]) {
      snapshot[rowIndex] = {};
    }

    snapshot[rowIndex][controlName] = value;

    lineData[rowIndex] = {
      ...(lineData[rowIndex] || {}),
      [controlName]: value
    };

    return snapshot;
  }

  buildLineEvent(
    data: ControlDataModel,
    linesSnapshot: any[],
    rowIndex: number,
    headerData: any = ''
  ): EventDataModel {
    return {
      control: data.control,
      data: data.data,
      dropdownData: data.dropdownData,
      dropdownItems: data.dropdownItems,
      activeData: linesSnapshot[rowIndex],
      section: SectionType.Line,
      rowIndex,
      linesData: linesSnapshot,
      headerData
    };
  }

  hasMissingMandatoryFields(
    lineFormGroup: FormGroup,
    config: LineDataConfig,
    extraMandatoryFields: string[] = []
  ): boolean {
    const fields = Array.from(new Set([
      ...extraMandatoryFields,
      ...(config?.controls || [])
        .filter((control: FormField) => control?.required)
        .map((control: FormField) => control.label!)
    ])).filter(Boolean);

    return fields.some(field => {
      const value = lineFormGroup.get(field)?.value;
      return value === null || value === '' || value === undefined;
    });
  }

  mergePendingChange(pendingChanges: Map<number, any>, rowIndex: number, controlName: string, value: any): void {
    const existing = pendingChanges.get(rowIndex) || {};
    existing[controlName] = value;
    pendingChanges.set(rowIndex, existing);
  }

  getLineControlsData(data: any, config: LineDataConfig): any {
    return this.utility.getLineControlsData(data, config.controls || []);
  }

  exportLines(lineData: any[], config: LineDataConfig, fileName: string): void {
    const exportData = this.getLineControlsData(lineData, config);
    this.excel.exportAsExcelFile(exportData, fileName);
  }

  private getValidators(control: FormField): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    if (control.required) {
      validators.push(Validators.required);
    }

    if (control.type === FormFieldType.Email) {
      validators.push(Validators.email);
    }

    return validators;
  }

  private isLineEmpty(row: any): boolean {
    if (!row) {
      return true;
    }

    return Object.keys(row)
      .filter(key => !key.startsWith('@odata') && key !== '__selected')
      .every(key => row[key] === null || row[key] === '' || row[key] === undefined);
  }

  private cloneLines(lineData: any[]): any[] {
    return JSON.parse(JSON.stringify(lineData || []));
  }
}
