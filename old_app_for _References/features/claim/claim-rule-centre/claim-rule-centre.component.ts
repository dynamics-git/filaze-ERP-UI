import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { RestService } from '../../../core/services/rest.service';
import { SessionService } from '../../../core/services/session.service';
import { ToastrService } from 'ngx-toastr';

type DashboardTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'neutral';

interface ODataListResponse<T> {
  '@odata.context'?: string;
  value: T[];
}

interface ClaimCentreDashboardFilters {
  companyId: string;
  responsibilityCenter: string;
  startDate?: string;
  endDate?: string;
  employeeNo?: string;
  status?: string;
}

interface ClaimCentreDashboardRow {
  entryNo: number;
  companyId: string;
  responsibilityCenter: string;
  startDate: string;
  endDate: string;
  employeeNo: string;
  status: string;

  draftClaims: number;
  pendingSubmit: number;
  pendingReview: number;
  rejectedLines: number;
  approvedClaims: number;
  readyToPay: number;
  paymentInProgress: number;
  paidThisMonth: number;
  totalOpenDocuments: number;
  totalRiskCount: number;
  reviewProgress: number;
  paymentProgress: number;
  submittedClaims: number;
  returnedClaims: number;
  totalClaimAmount: number;
  rejectedClaims: number;
  reviewedThisMonth: number;
  averageReviewDays: number;
  paidAmountThisMonth: number;
  pendingPaymentAmount: number;

  employeeClaimStageCode: string;
  employeeClaimStageName: string;
  employeeClaimStageCount: number;
  employeeClaimRoute: string;
  employeeClaimIcon: string;
  employeeClaimSortOrder: number;

  claimReviewStageCode: string;
  claimReviewStageName: string;
  claimReviewStageCount: number;
  claimReviewRoute: string;
  claimReviewIcon: string;
  claimReviewSortOrder: number;

  claimPaymentStageCode: string;
  claimPaymentStageName: string;
  claimPaymentStageCount: number;
  claimPaymentRoute: string;
  claimPaymentIcon: string;
  claimPaymentSortOrder: number;

  claimSubmissionTitle: string;
  claimSubmissionValue: string;
  claimSubmissionNote: string;
  claimSubmissionRoute: string;
  claimSubmissionSortOrder: number;

  claimValidationTitle: string;
  claimValidationValue: string;
  claimValidationNote: string;
  claimValidationRoute: string;
  claimValidationSortOrder: number;

  claimSettlementTitle: string;
  claimSettlementValue: string;
  claimSettlementNote: string;
  claimSettlementRoute: string;
  claimSettlementSortOrder: number;
}

interface ClaimCentreWorkflowItem {
  stageCode: string;
  stageName: string;
  count: number;
  route: string;
  icon: string;
  sortOrder: number;
}

interface ClaimCentreInsightItem {
  title: string;
  value: string;
  note: string;
  route: string;
  sortOrder: number;
}

interface DashboardCard {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  tone: DashboardTone;
  route?: string;
}

interface WorkbenchItem {
  label: string;
  value: number | string;
  description: string;
  icon: string;
  tone: DashboardTone;
  route?: string;
}

const defaultClaimCentreDashboard = (): ClaimCentreDashboardRow => ({
  entryNo: 0,
  companyId: '',
  responsibilityCenter: '',
  startDate: '',
  endDate: '',
  employeeNo: '',
  status: '',

  draftClaims: 0,
  pendingSubmit: 0,
  pendingReview: 0,
  rejectedLines: 0,
  approvedClaims: 0,
  readyToPay: 0,
  paymentInProgress: 0,
  paidThisMonth: 0,
  totalOpenDocuments: 0,
  totalRiskCount: 0,
  reviewProgress: 0,
  paymentProgress: 0,
  submittedClaims: 0,
  returnedClaims: 0,
  totalClaimAmount: 0,
  rejectedClaims: 0,
  reviewedThisMonth: 0,
  averageReviewDays: 0,
  paidAmountThisMonth: 0,
  pendingPaymentAmount: 0,

  employeeClaimStageCode: 'EMPLOYEE_CLAIM',
  employeeClaimStageName: 'Employee Claim',
  employeeClaimStageCount: 0,
  employeeClaimRoute: '/employee-claim',
  employeeClaimIcon: 'bi-receipt-cutoff',
  employeeClaimSortOrder: 1,

  claimReviewStageCode: 'CLAIM_REVIEW',
  claimReviewStageName: 'Claim Review',
  claimReviewStageCount: 0,
  claimReviewRoute: '/claim-review',
  claimReviewIcon: 'bi-clipboard-check',
  claimReviewSortOrder: 2,

  claimPaymentStageCode: 'CLAIM_PAYMENT',
  claimPaymentStageName: 'Claim Payment',
  claimPaymentStageCount: 0,
  claimPaymentRoute: '/claim-payments',
  claimPaymentIcon: 'bi-credit-card-2-front',
  claimPaymentSortOrder: 3,

  claimSubmissionTitle: 'Claim Submission',
  claimSubmissionValue: 'Employee Claim',
  claimSubmissionNote:
    'Employees submit claims with lines, attachments, mileage and chargeable details.',
  claimSubmissionRoute: '/employee-claim',
  claimSubmissionSortOrder: 1,

  claimValidationTitle: 'Claim Validation',
  claimValidationValue: 'Claim Review',
  claimValidationNote:
    'Reviewers approve, reject or validate submitted employee claim lines.',
  claimValidationRoute: '/claim-review',
  claimValidationSortOrder: 2,

  claimSettlementTitle: 'Claim Settlement',
  claimSettlementValue: 'Claim Payment',
  claimSettlementNote:
    'Finance processes approved claims and tracks payment completion.',
  claimSettlementRoute: '/claim-payments',
  claimSettlementSortOrder: 3
});

@Component({
  selector: 'app-claim-rule-centre',
  templateUrl: './claim-rule-centre.component.html',
  styleUrls: ['./claim-rule-centre.component.scss'],
  standalone: false,
})
export class ClaimRuleCentreComponent implements OnInit, OnDestroy {
  loading = false;
  errorMessage = '';

  startDate = '';
  endDate = '';
  employeeNo = '';
  statusFilter = '';

  dashboard: ClaimCentreDashboardRow = defaultClaimCentreDashboard();

  private readonly filterChanged$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private restService: RestService,
    public sessionService: SessionService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.filterChanged$
      .pipe(debounceTime(350), takeUntil(this.destroy$))
      .subscribe(() => this.loadDashboard());

    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilterChanged(): void {
    this.filterChanged$.next();
  }

  loadDashboard(): void {
    const filters = this.buildFilters();

    if (!filters.companyId || !filters.responsibilityCenter) {
      this.errorMessage =
        'Company and Responsibility Centre are required to load Claim Centre Dashboard.';
      this.toastr.error(this.errorMessage);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.restService.get(this.buildDashboardUrl(filters)).subscribe({
      next: (response: any) => {
        this.dashboard = this.normalizeDashboardRow(
          response as ODataListResponse<ClaimCentreDashboardRow>
        );
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = 'Unable to load Claim Centre Dashboard.';
        console.error('Claim Centre Dashboard load failed', error);
        this.toastr.error(this.errorMessage);
      }
    });
  }

  applyDateFilter(): void {
    this.loadDashboard();
  }

  clearDateFilter(): void {
    this.startDate = '';
    this.endDate = '';
    this.employeeNo = '';
    this.statusFilter = '';
    this.loadDashboard();
  }

  refreshDashboard(): void {
    this.loadDashboard();
  }

  get claimCentreHealthLabel(): string {
    if (this.dashboard.totalRiskCount > 5) {
      return 'Attention Required';
    }

    if (this.dashboard.pendingReview > 10) {
      return 'Review Pending';
    }

    return 'Healthy';
  }

  get claimCentreHealthTone(): DashboardTone {
    if (this.claimCentreHealthLabel === 'Attention Required') {
      return 'danger';
    }

    if (this.claimCentreHealthLabel === 'Review Pending') {
      return 'warning';
    }

    return 'success';
  }

  get reviewProgress(): number {
    return this.clampPercent(this.dashboard.reviewProgress);
  }

  get paymentProgress(): number {
    return this.clampPercent(this.dashboard.paymentProgress);
  }

  get headerCards(): DashboardCard[] {
    return [
      {
        title: 'Draft Claims',
        value: this.dashboard.draftClaims,
        subtitle: 'Created but not submitted',
        icon: 'bi-file-earmark-text',
        tone: 'primary',
        route: '/employee-claim'
      },
      {
        title: 'Pending Review',
        value: this.dashboard.pendingReview,
        subtitle: 'Waiting for reviewer action',
        icon: 'bi-hourglass-split',
        tone: 'warning',
        route: '/claim-review'
      },
      {
        title: 'Rejected Lines',
        value: this.dashboard.rejectedLines,
        subtitle: 'Need employee correction',
        icon: 'bi-x-circle',
        tone: 'danger',
        route: '/claim-review'
      },
      {
        title: 'Ready To Pay',
        value: this.dashboard.readyToPay,
        subtitle: 'Approved claims for payment',
        icon: 'bi-credit-card-2-front',
        tone: 'success',
        route: '/claim-payments'
      },
      {
        title: 'Paid This Month',
        value: this.dashboard.paidThisMonth,
        subtitle: 'Completed claim payments',
        icon: 'bi-check2-circle',
        tone: 'info',
        route: '/claim-payments'
      }
    ];
  }

  get workflow(): ClaimCentreWorkflowItem[] {
    return [
      {
        stageCode: this.dashboard.employeeClaimStageCode,
        stageName: this.dashboard.employeeClaimStageName,
        count: this.dashboard.employeeClaimStageCount,
        route: this.dashboard.employeeClaimRoute,
        icon: this.dashboard.employeeClaimIcon,
        sortOrder: this.dashboard.employeeClaimSortOrder
      },
      {
        stageCode: this.dashboard.claimReviewStageCode,
        stageName: this.dashboard.claimReviewStageName,
        count: this.dashboard.claimReviewStageCount,
        route: this.dashboard.claimReviewRoute,
        icon: this.dashboard.claimReviewIcon,
        sortOrder: this.dashboard.claimReviewSortOrder
      },
      {
        stageCode: this.dashboard.claimPaymentStageCode,
        stageName: this.dashboard.claimPaymentStageName,
        count: this.dashboard.claimPaymentStageCount,
        route: this.dashboard.claimPaymentRoute,
        icon: this.dashboard.claimPaymentIcon,
        sortOrder: this.dashboard.claimPaymentSortOrder
      }
    ].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  get insights(): ClaimCentreInsightItem[] {
    return [
      {
        title: this.dashboard.claimSubmissionTitle,
        value: this.dashboard.claimSubmissionValue,
        note: this.dashboard.claimSubmissionNote,
        route: this.dashboard.claimSubmissionRoute,
        sortOrder: this.dashboard.claimSubmissionSortOrder
      },
      {
        title: this.dashboard.claimValidationTitle,
        value: this.dashboard.claimValidationValue,
        note: this.dashboard.claimValidationNote,
        route: this.dashboard.claimValidationRoute,
        sortOrder: this.dashboard.claimValidationSortOrder
      },
      {
        title: this.dashboard.claimSettlementTitle,
        value: this.dashboard.claimSettlementValue,
        note: this.dashboard.claimSettlementNote,
        route: this.dashboard.claimSettlementRoute,
        sortOrder: this.dashboard.claimSettlementSortOrder
      }
    ].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  get employeeClaimWorkbench(): WorkbenchItem[] {
    return [
      {
        label: 'Create New Claim',
        value: 'New',
        description: 'Open Employee Claim page to create claim header and claim lines.',
        icon: 'bi-plus-circle',
        tone: 'primary',
        route: '/employee-claim'
      },
      {
        label: 'Draft Claims',
        value: this.dashboard.draftClaims,
        description: 'Claims prepared by employee but not submitted.',
        icon: 'bi-file-earmark-text',
        tone: 'neutral',
        route: '/employee-claim'
      },
      {
        label: 'Pending Submit',
        value: this.dashboard.pendingSubmit,
        description: 'Claims waiting for employee submission.',
        icon: 'bi-send',
        tone: 'info',
        route: '/employee-claim'
      },
      {
        label: 'Returned Claims',
        value: this.dashboard.returnedClaims,
        description: 'Claims returned to employee for correction.',
        icon: 'bi-arrow-return-left',
        tone: 'danger',
        route: '/employee-claim'
      }
    ];
  }

  get reviewWorkbench(): WorkbenchItem[] {
    return [
      {
        label: 'Pending Review',
        value: this.dashboard.pendingReview,
        description: 'Submitted claims waiting for reviewer validation.',
        icon: 'bi-hourglass-split',
        tone: 'warning',
        route: '/claim-review'
      },
      {
        label: 'Approved Claims',
        value: this.dashboard.approvedClaims,
        description: 'Claims approved and ready for payment processing.',
        icon: 'bi-check-circle',
        tone: 'success',
        route: '/claim-review'
      },
      {
        label: 'Rejected Claims',
        value: this.dashboard.rejectedClaims,
        description: 'Rejected claim documents.',
        icon: 'bi-x-circle',
        tone: 'danger',
        route: '/claim-review'
      },
      {
        label: 'Average Review Days',
        value: this.dashboard.averageReviewDays,
        description: 'Average time taken for review completion.',
        icon: 'bi-clock-history',
        tone: 'info',
        route: '/claim-review'
      }
    ];
  }

  get paymentWorkbench(): WorkbenchItem[] {
    return [
      {
        label: 'Ready To Pay',
        value: this.dashboard.readyToPay,
        description: 'Approved claim documents waiting for payment.',
        icon: 'bi-credit-card',
        tone: 'success',
        route: '/claim-payments'
      },
      {
        label: 'Payment In Progress',
        value: this.dashboard.paymentInProgress,
        description: 'Claims currently being processed by finance.',
        icon: 'bi-arrow-repeat',
        tone: 'info',
        route: '/claim-payments'
      },
      {
        label: 'Paid This Month',
        value: this.dashboard.paidThisMonth,
        description: 'Claim payments completed in the selected period.',
        icon: 'bi-check2-circle',
        tone: 'primary',
        route: '/claim-payments'
      },
      {
        label: 'Pending Payment Amount',
        value: this.formatAmount(this.dashboard.pendingPaymentAmount),
        description: 'Approved amount waiting for payment.',
        icon: 'bi-cash-stack',
        tone: 'warning',
        route: '/claim-payments'
      }
    ];
  }

  openRoute(route?: string): void {
    if (!route) {
      return;
    }

    this.router.navigateByUrl(route);
  }

  createClaim(): void {
    this.openRoute('/employee-claim');
  }

  openClaimReview(): void {
    this.openRoute('/claim-review');
  }

  openClaimPayment(): void {
    this.openRoute('/claim-payments');
  }

  formatNumber(value: number | string): string {
    if (typeof value === 'string') {
      return value;
    }

    return new Intl.NumberFormat().format(value || 0);
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  private buildFilters(): ClaimCentreDashboardFilters {
    const companyId = this.sessionService.Company || '';
    const responsibilityCenter =
      this.sessionService.ResponsibilityCenterId ||
      this.sessionService.DefaultResponsibilityCenter ||
      '';

    return {
      companyId,
      responsibilityCenter,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      employeeNo: this.employeeNo?.trim() || undefined,
      status: this.statusFilter || undefined
    };
  }

  private buildDashboardUrl(filters: ClaimCentreDashboardFilters): string {
    const filter = this.buildDashboardFilter(filters);
    return `/claimCentreDashboard?$filter=${encodeURIComponent(filter)}`;
  }

  private buildDashboardFilter(filters: ClaimCentreDashboardFilters): string {
    const parts = [
      `companyId eq ${filters.companyId}`,
      `responsibilityCenter eq '${this.escapeODataString(filters.responsibilityCenter)}'`
    ];

    if (filters.startDate) {
      parts.push(`startDate eq ${filters.startDate}`);
    }

    if (filters.endDate) {
      parts.push(`endDate eq ${filters.endDate}`);
    }

    if (filters.employeeNo) {
      parts.push(`employeeNo eq '${this.escapeODataString(filters.employeeNo)}'`);
    }

    if (filters.status) {
      parts.push(`status eq '${this.escapeODataString(filters.status)}'`);
    }

    return parts.join(' and ');
  }

  private normalizeDashboardRow(
    response: ODataListResponse<ClaimCentreDashboardRow>
  ): ClaimCentreDashboardRow {
    const row = response?.value?.[0];

    if (!row) {
      return defaultClaimCentreDashboard();
    }

    return {
      ...defaultClaimCentreDashboard(),
      ...row,

      entryNo: Number(row.entryNo ?? 0),
      draftClaims: Number(row.draftClaims ?? 0),
      pendingSubmit: Number(row.pendingSubmit ?? 0),
      pendingReview: Number(row.pendingReview ?? 0),
      rejectedLines: Number(row.rejectedLines ?? 0),
      approvedClaims: Number(row.approvedClaims ?? 0),
      readyToPay: Number(row.readyToPay ?? 0),
      paymentInProgress: Number(row.paymentInProgress ?? 0),
      paidThisMonth: Number(row.paidThisMonth ?? 0),
      totalOpenDocuments: Number(row.totalOpenDocuments ?? 0),
      totalRiskCount: Number(row.totalRiskCount ?? 0),
      reviewProgress: Number(row.reviewProgress ?? 0),
      paymentProgress: Number(row.paymentProgress ?? 0),
      submittedClaims: Number(row.submittedClaims ?? 0),
      returnedClaims: Number(row.returnedClaims ?? 0),
      totalClaimAmount: Number(row.totalClaimAmount ?? 0),
      rejectedClaims: Number(row.rejectedClaims ?? 0),
      reviewedThisMonth: Number(row.reviewedThisMonth ?? 0),
      averageReviewDays: Number(row.averageReviewDays ?? 0),
      paidAmountThisMonth: Number(row.paidAmountThisMonth ?? 0),
      pendingPaymentAmount: Number(row.pendingPaymentAmount ?? 0),

      employeeClaimStageCount: Number(row.employeeClaimStageCount ?? 0),
      employeeClaimSortOrder: Number(row.employeeClaimSortOrder ?? 1),
      claimReviewStageCount: Number(row.claimReviewStageCount ?? 0),
      claimReviewSortOrder: Number(row.claimReviewSortOrder ?? 2),
      claimPaymentStageCount: Number(row.claimPaymentStageCount ?? 0),
      claimPaymentSortOrder: Number(row.claimPaymentSortOrder ?? 3),

      claimSubmissionSortOrder: Number(row.claimSubmissionSortOrder ?? 1),
      claimValidationSortOrder: Number(row.claimValidationSortOrder ?? 2),
      claimSettlementSortOrder: Number(row.claimSettlementSortOrder ?? 3)
    };
  }

  private escapeODataString(value: string): string {
    return String(value || '').replace(/'/g, "''");
  }

  private clampPercent(value: number): number {
    if (!value || value < 0) {
      return 0;
    }

    if (value > 100) {
      return 100;
    }

    return Math.round(value);
  }
}