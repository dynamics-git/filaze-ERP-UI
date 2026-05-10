import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';
import { DigitOnlyDirective } from '@uiowa/digit-only';

import { SelectCompanyModalComponent } from './components/select-company-modal/select-company-modal.component';
import { SelectResCenterModalComponent } from './components/select-res-center-modal/select-res-center-modal.component';
import { CssLoaderComponent } from './components/css-loader/css-loader.component';
import { FormFieldComponent } from './components/form-field/form-field.component';
import { MessageModalComponent } from './components/message-modal/message-modal.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { SortableHeaderDirective } from './directives/sortable-header.directive';
import { UppercaseInputDirective } from './directives/uppercase.directive';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ControlLoaderComponent } from './components/control-loader/control-loader.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { ActionsComponent } from './components/actions/actions.component';
import { AddItemPopupComponent } from './components/add-item-popup/add-item-popup.component';
import { DocumentCommentsPopupComponent } from './components/document-comments-popup/document-comments-popup.component';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { LogEntriesComponent } from './components/log-entries/log-entries.component';
import { AttachmentsComponent } from './components/attachments/attachments.component';
import { ApiErrorModalComponent } from './components/api-error-modal/api-error-modal.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AddItemLoaderComponent } from './components/add-item-loader/add-item-loader.component';
import { ResizableColumnDirective } from './directives/resizable-column.directive';
import { AddItemComponent } from './components/add-item/add-item.component';
import { FilterComponent } from './components/filter/filter.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { summaryComponent } from './components/summary/summary.component';
import { AddItemSubPopupComponent } from './components/add-item-sub-popup/add-item-sub-popup.component';
import { DynamicLoaderComponent } from './components/dynamic-loader/dynamic-loader.component';
import { UsersActivityLogsComponent } from './components/users-activity-logs/users-activity-logs.component';
import { ApprovalLogEntriesComponent } from './components/approval-log-entries/approval-log-entries.component';
import { UiErrorModalComponent } from './components/ui-error-modal/ui-error-modal.component';
import { TextEditorComponent } from './components/text-editor/text-editor.component';
import { NgxEditorModule } from 'ngx-editor';
import { FactboxComponent } from './components/factbox/factbox.component';
import { IdleLogoutModalComponent } from './components/idle-logout-modal/idle-logout-modal.component';
import { SystemActivityModalComponent } from './components/system-activity-modal/system-activity-modal.component';
import { LineWorkspaceComponent } from './components/line-workspace/line-workspace.component';
import { SetupLineModalComponent } from './components/setup-line-modal/setup-line-modal.component';
import { ProcurementFlowPanelComponent } from './components/procurement-flow-panel/procurement-flow-panel.component';
import { RfqWorkflowFactboxComponent } from './components/rfq-workflow-factbox/rfq-workflow-factbox.component';
import { SubLineSectionComponent } from './components/sub-line-section/sub-line-section.component';
import { AddDimensionComponent } from './components/add-dimension/add-dimension.component';

@NgModule({
  declarations: [
    AddItemPopupComponent,
    ActionsComponent,
    ApiErrorModalComponent,
    AttachmentsComponent,
    ControlLoaderComponent,
    CssLoaderComponent,
    DataTableComponent,
    DocumentCommentsPopupComponent,
    LogEntriesComponent,
    MessageModalComponent,
    SelectCompanyModalComponent,
    SelectResCenterModalComponent,
    SortableHeaderDirective,
    AddItemLoaderComponent,

    AddItemComponent,
    FilterComponent,
    ConfirmDialogComponent,
    summaryComponent,
    AddItemSubPopupComponent,
    UsersActivityLogsComponent,
    ApprovalLogEntriesComponent,
    UiErrorModalComponent,
    TextEditorComponent,
    AddDimensionComponent,
    FactboxComponent,
    IdleLogoutModalComponent,
    SystemActivityModalComponent,
    LineWorkspaceComponent,
    SetupLineModalComponent,
    ProcurementFlowPanelComponent,
    RfqWorkflowFactboxComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AutofocusDirective,
    NgSelectModule,
    NgbModule,
    DigitOnlyDirective,
    DynamicLoaderComponent,
    FormFieldComponent,
    ResizableColumnDirective,
    SubLineSectionComponent,
    SelectDropDownModule,
    NgMultiSelectDropDownModule,
    NgxSkeletonLoaderModule,
    NgxEditorModule,
    UppercaseInputDirective
  ],
  exports: [
    AddItemComponent,
    AddItemPopupComponent,
    ActionsComponent,
    ApiErrorModalComponent,
    AttachmentsComponent,
    ControlLoaderComponent,
    CssLoaderComponent,
    DataTableComponent,
    FormFieldComponent,
    LogEntriesComponent,
    MessageModalComponent,
    SelectCompanyModalComponent,
    SelectResCenterModalComponent,
    ConfirmDialogComponent,
    FilterComponent,
    UsersActivityLogsComponent,
    summaryComponent,
    ApprovalLogEntriesComponent,
    DynamicLoaderComponent,
    AddItemLoaderComponent,
    SubLineSectionComponent,
    FactboxComponent,
    LineWorkspaceComponent,
    TextEditorComponent,
    AddDimensionComponent,
    IdleLogoutModalComponent,
    SystemActivityModalComponent,
    AutofocusDirective,
    SortableHeaderDirective,
    UppercaseInputDirective,
    SetupLineModalComponent
  ]
})
export class SharedModule { }
