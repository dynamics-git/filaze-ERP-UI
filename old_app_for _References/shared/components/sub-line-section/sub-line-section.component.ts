import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { FormField } from '../../../core/models/shared/formField';
import { LineDataConfig } from '../../../core/models/shared/line-data.config';
import { DynamicLoaderComponent } from '../dynamic-loader/dynamic-loader.component';
import { FormFieldComponent } from '../form-field/form-field.component';
import { ResizableColumnDirective } from '../../directives/resizable-column.directive';

@Component({
  standalone: true,
  selector: 'app-sub-line-section',
  templateUrl: './sub-line-section.component.html',
  styleUrls: ['./sub-line-section.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DynamicLoaderComponent,
    FormFieldComponent,
    ResizableColumnDirective
  ]
})
export class SubLineSectionComponent {
  @Input() headerData!: any;
  @Input() itemConfig!: any;
  @Input() documentType!: string;
  @Input() viewMode = false;
  @Input() loading = false;
  @Input() showPopupLayout = false;
  @Input() sectionConfig!: LineDataConfig;
  @Input() lineData: any[] = [];
  @Input() lineFormGroup!: FormGroup;
  @Input() lineReady = true;
  @Input() saving = false;
  @Input() selectedLines: number[] = [];
  @Input() selectedRowIndex = 0;
  @Input() checkLineAll = false;

  @Output() addLine = new EventEmitter<void>();
  @Output() deleteLine = new EventEmitter<void>();
  @Output() refreshLine = new EventEmitter<void>();
  @Output() exportLine = new EventEmitter<void>();
  @Output() closeLinePopup = new EventEmitter<void>();
  @Output() toolbarButtonClick = new EventEmitter<any>();
  @Output() selectLine = new EventEmitter<number>();
  @Output() selectAllLines = new EventEmitter<void>();
  @Output() selectRowEvent = new EventEmitter<number>();
  @Output() lineChange = new EventEmitter<{ data: ControlDataModel; rowIndex: number }>();
  @Output() lineLeave = new EventEmitter<{ data: ControlDataModel; control: FormField; rowIndex: number }>();

  get config(): LineDataConfig {
    return this.sectionConfig || {};
  }

  get items(): FormArray {
    return this.lineFormGroup?.get('items') as FormArray;
  }

  get isBusy(): boolean {
    return this.saving || this.loading;
  }

  get sectionTitle(): string {
    return this.config?.title || 'Lines';
  }

  get visibleButtons(): any[] {
    return (this.config?.buttons || []).filter((button: any) => button?.isVisible !== false);
  }

  getLineFormGroup(row: number): FormGroup {
    return this.items.at(row) as FormGroup;
  }
}
