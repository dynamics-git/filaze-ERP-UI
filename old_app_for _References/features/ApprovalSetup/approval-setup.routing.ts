import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ApprovalSetupComponent } from './approval-setup/approval-setup.component';
import { ApprovalEntryComponent } from './approval-entry/approval-entry.component';
import { BudgetRequestComponent } from './budget-request/budget-request.component';
import { ReviewEntriesComponent } from './review-entries/review-entries.component';
import { DocumentReviewUserSetupComponent } from './document-review-user-setup/document-review-user-setup.component';
import { ApproversGroupComponent } from './approvers-group/approvers-group.component';
import { WorkflowSetupComponent } from './workflow-setup/workflow-setup.component';
import { ApprovedEntryComponent } from './approved-entry/approved-entry.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'setup',
        pathMatch: 'full'
      },
      {
        path: 'setup',
        component: ApprovalSetupComponent
      },
      {
        path: 'entry',
        component: ApprovalEntryComponent
      },
      {
        path: 'approved-entry',
        component: ApprovedEntryComponent
      },
      {
        path: 'review-user-setup',
        component: DocumentReviewUserSetupComponent
      },
      {
        path: 'review-entry',
        component: ReviewEntriesComponent
      },
      {
        path: 'budget-request',
        component: BudgetRequestComponent
      },
      {
        path: 'approversgroup',
        component: ApproversGroupComponent
      },
      {
        path: 'workflow-setup',
        component: WorkflowSetupComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ApprovalSetupRoutingModule { }
