import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApprovalSetupComponent } from './approval-setup/approval-setup.component';
import { ApprovalSetupRoutingModule } from './approval-setup.routing';
import { ApprovalEntryComponent } from './approval-entry/approval-entry.component';
import { BudgetRequestComponent } from './budget-request/budget-request.component';
import { ReviewEntriesComponent } from './review-entries/review-entries.component';
import { DocumentReviewUserSetupComponent } from './document-review-user-setup/document-review-user-setup.component';
import { RejectReasonComponent } from './modals/reject-reason/reject-reason.component';
import { ApproversGroupComponent } from './approvers-group/approvers-group.component';
import { SharedModule } from '../../shared/shared.module';
import { WorkflowSetupComponent } from './workflow-setup/workflow-setup.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ApprovalSetupAddItemSubPopupComponent } from './shared/components/approval-setup-add-item-sub-popup/approval-setup-add-item-sub-popup.component';
import { ApprovedEntryComponent } from './approved-entry/approved-entry.component';

@NgModule({
  declarations: [
    ApprovalSetupComponent,
    ApprovalEntryComponent,
    BudgetRequestComponent,
    ReviewEntriesComponent,
    DocumentReviewUserSetupComponent,
    RejectReasonComponent,
    ApproversGroupComponent,
    WorkflowSetupComponent,
    ApprovalSetupAddItemSubPopupComponent,
    ApprovedEntryComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    ApprovalSetupRoutingModule,
    NgxSkeletonLoaderModule
  ]
})
export class ApprovalSetupModule { }
