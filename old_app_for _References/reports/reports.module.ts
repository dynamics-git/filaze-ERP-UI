import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './reports.component';
import { ReportShellComponent } from './report-shell/report-shell.component';
import { ReportFilterBarComponent } from './filters/report-filter-bar/report-filter-bar.component';
import { ReportTableComponent } from './tables/report-table/report-table.component';
import { ReportKpiStripComponent } from './kpi/report-kpi-strip/report-kpi-strip.component';
import { ClaimStatusReportComponent } from './pages/claim-status-report/claim-status-report.component';
import { ExpenseAnalysisReportComponent } from './pages/expense-analysis-report/expense-analysis-report.component';
import { ClientChargeReportComponent } from './pages/client-charge-report/client-charge-report.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UnicodeCleanPipe } from './pipes/unicode-clean.pipe';
import { MonthlyClaimSummaryComponent } from './pages/monthly-claim-summary/monthly-claim-summary.component';
import { SharedModule } from '../shared/shared.module';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ExpenseTypeSummaryComponent } from './pages/expense-type-summary/expense-type-summary.component';


@NgModule({
  declarations: [
    ReportsComponent,
    ReportShellComponent,
    ReportFilterBarComponent,
    ReportTableComponent,
    ReportKpiStripComponent,
    ClaimStatusReportComponent,
    ExpenseAnalysisReportComponent,
    ClientChargeReportComponent,
    UnicodeCleanPipe,
    MonthlyClaimSummaryComponent,
    ExpenseTypeSummaryComponent
  ],
  providers: [
    UnicodeCleanPipe
  ],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    FormsModule,
    SharedModule,
    NgxSkeletonLoaderModule,
    ReactiveFormsModule,
    NgbModule,
  ]
})
export class ReportsModule { }
