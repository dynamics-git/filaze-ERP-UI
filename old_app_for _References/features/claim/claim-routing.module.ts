import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
import { EntitlementsComponent } from './entitlements/entitlements.component';
import { PostedEmployeeClaimComponent } from './posted-employee-claim/posted-employee-claim.component';
import { ClaimRuleCentreComponent } from './claim-rule-centre/claim-rule-centre.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'claimentries',
        pathMatch: 'full'
      },
      {
        path: 'claimpayment',
        component: ClaimPaymentsComponent
      },
      {
        path: 'employeeclaim',
        component: EmployeeClaimComponent
      },
      {
        path: 'claimtype',
        component: EmployeeClaimTypeComponent
      },
      {
        path: 'employeeclaimpost',
        component: EmployeeClaimPostingSetupComponent
      },
      {
        path: 'employeeclaimsetup',
        component: EmployeeClaimSetupComponent
      },
      {
        path: 'employeeclaimsetup/:id',
        component: EmployeeClaimSetupComponent
      },
      {
        path: 'expensetypesetup',
        component: ExpenseTypeSetupComponent
      },
      {
        path: 'ruleSetup',
        component: ClaimRuleSetupComponent
      },
      {
        path: 'staff-group',
        component: StaffGroupMasterComponent
      },
      {
        path: 'employee-role',
        component: EmployeeRoleMasterComponent
      },
      {
        path: 'department',
        component: DepartmentMasterComponent
      },
      {
        path: 'country',
        component: CountryMasterComponent
      },
      {
        path: 'employee',
        component: EmployeeMasterComponent
      },
      {
        path: 'finance-claim-review',
        component: ClaimReviewComponent
      },
      {
        path: 'entitlement',
        component: EntitlementsComponent
      },
       {
        path: 'posted-employee-claim',
        component: PostedEmployeeClaimComponent
      },
        {
        path: 'claim-rule-centre',
        component: ClaimRuleCentreComponent
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClaimRoutingModule { }
