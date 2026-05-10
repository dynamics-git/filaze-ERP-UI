import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

import { ClaimRoutingModule } from './claim-routing.module';
import { ClaimPaymentsComponent } from './claim-payments/claim-payments.component';
import { EmployeeClaimComponent } from './employee-claim/employee-claim.component';
import { EmployeeClaimTypeComponent } from './employee-claim-type/employee-claim-type.component';
import { EmployeeClaimPostingSetupComponent } from './employee-claim-posting-setup/employee-claim-posting-setup.component';
import { EmployeeClaimSetupComponent } from './employee-claim-setup/employee-claim-setup.component';
import { ExpenseTypeSetupComponent } from './expense-type-setup/expense-type-setup.component';
import { ClaimRuleSetupComponent } from './claim-rule-setup/claim-rule-setup.component';
import { StaffGroupMasterComponent } from './staff-group-master/staff-group-master.component';
import { EmployeeRoleMasterComponent } from './employee-role-master/employee-role-master.component';
import { DepartmentMasterComponent } from './department-master/department-master.component';
import { CountryMasterComponent } from './country-master/country-master.component';
import { EmployeeMasterComponent } from './employee-master/employee-master.component';
import { ClaimReviewComponent } from './claim-review/claim-review.component';
import { PortalSetupComponent } from './portal-setup/portal-setup.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { EntitlementsComponent } from './entitlements/entitlements.component';
import { PostedEmployeeClaimComponent } from './posted-employee-claim/posted-employee-claim.component';
import { ManagePaxComponent } from './manage-pax/manage-pax.component';
import { ClaimRuleCentreComponent } from './claim-rule-centre/claim-rule-centre.component';



@NgModule({
  declarations: [
    ClaimPaymentsComponent,
    EmployeeClaimComponent,
    EmployeeClaimTypeComponent,
    EmployeeClaimPostingSetupComponent,
    EmployeeClaimSetupComponent,
    ExpenseTypeSetupComponent,
    ClaimRuleSetupComponent,
    StaffGroupMasterComponent,
    EmployeeRoleMasterComponent,
    DepartmentMasterComponent,
    CountryMasterComponent,
    EmployeeMasterComponent,
    ClaimReviewComponent,
    PortalSetupComponent,
    EntitlementsComponent,
    PostedEmployeeClaimComponent,
    ManagePaxComponent,
    ClaimRuleCentreComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    ClaimRoutingModule,
    NgxSkeletonLoaderModule
  ]
})
export class ClaimModule { }
