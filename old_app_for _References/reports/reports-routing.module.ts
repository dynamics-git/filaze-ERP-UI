import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { ClaimStatusReportComponent } from './pages/claim-status-report/claim-status-report.component';
import { ExpenseAnalysisReportComponent } from './pages/expense-analysis-report/expense-analysis-report.component';
import { ClientChargeReportComponent } from './pages/client-charge-report/client-charge-report.component';
import { MonthlyClaimSummaryComponent } from './pages/monthly-claim-summary/monthly-claim-summary.component';
import { ExpenseTypeSummaryComponent } from './pages/expense-type-summary/expense-type-summary.component';

const routes: Routes = [
  {
    path: '',
    component: ReportsComponent,
    children: [
      { path: '', redirectTo: 'claim-status', pathMatch: 'full' },
      { path: 'claim-status', component: ClaimStatusReportComponent },
      { path: 'expense-analysis', component: ExpenseAnalysisReportComponent },
      { path: 'client-charge', component: ClientChargeReportComponent },
      { path: 'monthly-claim-summary', component: MonthlyClaimSummaryComponent },
      { path: 'expense-type-summary', component: ExpenseTypeSummaryComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
