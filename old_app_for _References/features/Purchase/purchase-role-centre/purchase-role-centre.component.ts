import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { RestService } from '../../../core/services/rest.service';
import { SessionService } from '../../../core/services/session.service';

type DashboardTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'neutral';

interface PurchaseRoleCentreKpi {
  entryNo: number;
  company: string;
  portalResponsibilityCentre: string;
  userID: string;
  startDate: string;
  endDate: string;

  openPRCount: number;
  pendingPRApprovalCount: number;
  rejectedPRCount: number;
  approvedPRCount: number;
  overduePRCount: number;
  rfqRequiredCount: number;
  rfqInProgressCount: number;
  rfqQuoteReceivedCount: number;
  rfqWinnerSelectedCount: number;
  prConvertedToQuoteCount: number;
  prConvertedToOrderCount: number;

  openPOCount: number;
  pendingPOApprovalCount: number;
  releasedPOCount: number;
  pendingGRNReviewCount: number;
  pendingInvoiceReviewCount: number;
  partiallyReceivedPOCount: number;
  fullyReceivedPOCount: number;
  overduePOCount: number;
  cancelledPOCount: number;
  totalPOAmount: number;
  totalAmountToReceive: number;
  totalAmountToInvoice: number;
  totalAmountInvoiced: number;

  openInvoiceCount: number;
  pendingInvoiceApprovalCount: number;
  releasedInvoiceCount: number;
  postedInvoiceCount: number;
  invoiceWithPrepaymentCount: number;
  invoiceWithAllocationCount: number;
  totalInvoiceAmount: number;
  pendingInvoiceAmount: number;

  myPendingApprovalCount: number;
  pendingApprovalAmount: number;
  oldestPendingApprovalDate: string;
  approvalSlaBreachCount: number;

  vendorsInvitedCount: number;
  quotesReceivedCount: number;
  pendingVendorResponseCount: number;
  winnerPendingConversionCount: number;
}

interface RoleKpiCard {
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

interface FlowStage {
  title: string;
  value: number;
  icon: string;
  tone: DashboardTone;
}

interface InsightItem {
  title: string;
  value: string;
  note: string;
  tone: DashboardTone;
  icon: string;
}

const EMPTY_KPI: PurchaseRoleCentreKpi = {
  entryNo: 1,
  company: '',
  portalResponsibilityCentre: '',
  userID: '',
  startDate: '0001-01-01',
  endDate: '0001-01-01',

  openPRCount: 0,
  pendingPRApprovalCount: 0,
  rejectedPRCount: 0,
  approvedPRCount: 0,
  overduePRCount: 0,
  rfqRequiredCount: 0,
  rfqInProgressCount: 0,
  rfqQuoteReceivedCount: 0,
  rfqWinnerSelectedCount: 0,
  prConvertedToQuoteCount: 0,
  prConvertedToOrderCount: 0,

  openPOCount: 0,
  pendingPOApprovalCount: 0,
  releasedPOCount: 0,
  pendingGRNReviewCount: 0,
  pendingInvoiceReviewCount: 0,
  partiallyReceivedPOCount: 0,
  fullyReceivedPOCount: 0,
  overduePOCount: 0,
  cancelledPOCount: 0,
  totalPOAmount: 0,
  totalAmountToReceive: 0,
  totalAmountToInvoice: 0,
  totalAmountInvoiced: 0,

  openInvoiceCount: 0,
  pendingInvoiceApprovalCount: 0,
  releasedInvoiceCount: 0,
  postedInvoiceCount: 0,
  invoiceWithPrepaymentCount: 0,
  invoiceWithAllocationCount: 0,
  totalInvoiceAmount: 0,
  pendingInvoiceAmount: 0,

  myPendingApprovalCount: 0,
  pendingApprovalAmount: 0,
  oldestPendingApprovalDate: '0001-01-01',
  approvalSlaBreachCount: 0,

  vendorsInvitedCount: 0,
  quotesReceivedCount: 0,
  pendingVendorResponseCount: 0,
  winnerPendingConversionCount: 0
};

@Component({
  selector: 'app-purchase-role-centre',
  templateUrl: './purchase-role-centre.component.html',
  styleUrls: ['./purchase-role-centre.component.scss'],
  standalone: false,
})
export class PurchaseRoleCentreComponent implements OnInit {
  loading = false;
  errorMessage = '';

  kpi: PurchaseRoleCentreKpi = { ...EMPTY_KPI };

  startDate = '';
  endDate = '';

  headerCards: RoleKpiCard[] = [];
  prWorkbench: WorkbenchItem[] = [];
  rfqWorkbench: WorkbenchItem[] = [];
  poWorkbench: WorkbenchItem[] = [];
  invoiceWorkbench: WorkbenchItem[] = [];
  approvalWorkbench: WorkbenchItem[] = [];
  flowStages: FlowStage[] = [];
  insights: InsightItem[] = [];

  constructor(
    private restService: RestService,
    public sessionService: SessionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRoleCentre();
  }

  async loadRoleCentre(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const url = `/purchaseRoleCentreKpis?$filter=${this.buildFilter()}`;
      const response: any = await firstValueFrom(this.restService.get(url));

      this.kpi = response?.value?.[0]
        ? { ...EMPTY_KPI, ...response.value[0] }
        : { ...EMPTY_KPI };

      this.prepareDashboard();
    } catch (error: any) {
      this.kpi = { ...EMPTY_KPI };
      this.prepareDashboard();
      this.errorMessage = 'Unable to load Purchase Role Centre KPI data. Please refresh or contact administrator.';
      console.error('Purchase Role Centre KPI error:', error);
    } finally {
      this.loading = false;
    }
  }

  private buildFilter(): string {
    const company =
      this.sessionService.CompanyName ||
      this.sessionService.Company ||
      '';

    const responsibilityCentre =
      this.sessionService.ResponsibilityCenterId ||
      this.sessionService.DefaultResponsibilityCenter ||
      '';

    const userID = this.sessionService.UserId || '';

    const parts: string[] = [
      `company eq '${this.escapeOData(company)}'`,
      `portalResponsibilityCentre eq '${this.escapeOData(responsibilityCentre)}'`,
      `userID eq '${this.escapeOData(userID)}'`
    ];

    if (this.startDate) {
      parts.push(`startDate eq ${this.startDate}`);
    }

    if (this.endDate) {
      parts.push(`endDate eq ${this.endDate}`);
    }

    return parts.join(' and ');
  }

  private prepareDashboard(): void {
    this.headerCards = [
      {
        title: 'Open PR',
        value: this.kpi.openPRCount,
        subtitle: 'Requester draft / open requisitions',
        icon: 'bi-file-earmark-text',
        tone: 'primary',
        route: '/purchase-requisition'
      },
      {
        title: 'Pending Approval',
        value: this.kpi.myPendingApprovalCount,
        subtitle: 'Documents waiting for your action',
        icon: 'bi-person-check',
        tone: this.kpi.myPendingApprovalCount > 0 ? 'warning' : 'success'
      },
      {
        title: 'Open PO',
        value: this.kpi.openPOCount,
        subtitle: 'Purchase orders still open',
        icon: 'bi-bag',
        tone: 'info',
        route: '/purchase-order'
      },
      {
        title: 'Invoice Pending',
        value: this.kpi.pendingInvoiceApprovalCount,
        subtitle: 'Invoices waiting for approval',
        icon: 'bi-receipt',
        tone: this.kpi.pendingInvoiceApprovalCount > 0 ? 'warning' : 'neutral',
        route: '/purchase-invoice'
      },
      {
        title: 'Overdue',
        value: this.kpi.overduePRCount + this.kpi.overduePOCount,
        subtitle: 'PR / PO delivery risk',
        icon: 'bi-exclamation-triangle',
        tone: this.kpi.overduePRCount + this.kpi.overduePOCount > 0 ? 'danger' : 'success'
      },
      {
        title: 'RFQ Active',
        value: this.kpi.rfqInProgressCount,
        subtitle: 'Sourcing in progress',
        icon: 'bi-diagram-3',
        tone: 'purple'
      }
    ];

    this.prWorkbench = [
      {
        label: 'Open Requisitions',
        value: this.kpi.openPRCount,
        description: 'Still editable or not submitted',
        icon: 'bi-folder2-open',
        tone: 'primary'
      },
      {
        label: 'Pending PR Approval',
        value: this.kpi.pendingPRApprovalCount,
        description: 'Waiting for approval workflow',
        icon: 'bi-hourglass-split',
        tone: 'warning'
      },
      {
        label: 'Approved PR',
        value: this.kpi.approvedPRCount,
        description: 'Ready for sourcing / PO action',
        icon: 'bi-check2-circle',
        tone: 'success'
      },
      {
        label: 'Rejected PR',
        value: this.kpi.rejectedPRCount,
        description: 'Needs correction or resubmission',
        icon: 'bi-arrow-counterclockwise',
        tone: 'danger'
      },
      {
        label: 'Overdue PR',
        value: this.kpi.overduePRCount,
        description: 'Delivery date passed, not converted',
        icon: 'bi-calendar-x',
        tone: 'danger'
      }
    ];

    this.rfqWorkbench = [
      {
        label: 'RFQ Required',
        value: this.kpi.rfqRequiredCount,
        description: 'Sourcing required before PO',
        icon: 'bi-signpost-split',
        tone: 'purple'
      },
      {
        label: 'RFQ In Progress',
        value: this.kpi.rfqInProgressCount,
        description: 'Vendor invitation / quote stage',
        icon: 'bi-envelope-paper',
        tone: 'info'
      },
      {
        label: 'Vendors Invited',
        value: this.kpi.vendorsInvitedCount,
        description: 'RFQ invitations sent',
        icon: 'bi-send',
        tone: 'primary'
      },
      {
        label: 'Quotes Received',
        value: this.kpi.quotesReceivedCount,
        description: 'Vendor quotation submitted',
        icon: 'bi-cash-coin',
        tone: 'success'
      },
      {
        label: 'Pending Vendor Response',
        value: this.kpi.pendingVendorResponseCount,
        description: 'Invited but not quoted',
        icon: 'bi-clock-history',
        tone: 'warning'
      },
      {
        label: 'Winner Pending Conversion',
        value: this.kpi.winnerPendingConversionCount,
        description: 'Winner selected, quote / PO not done',
        icon: 'bi-award',
        tone: 'danger'
      }
    ];

    this.poWorkbench = [
      {
        label: 'Open PO',
        value: this.kpi.openPOCount,
        description: 'Open purchase orders',
        icon: 'bi-bag',
        tone: 'primary'
      },
      {
        label: 'PO Pending Approval',
        value: this.kpi.pendingPOApprovalCount,
        description: 'PO approval still pending',
        icon: 'bi-shield-check',
        tone: 'warning'
      },
      {
        label: 'Released PO',
        value: this.kpi.releasedPOCount,
        description: 'Released to procurement flow',
        icon: 'bi-unlock',
        tone: 'success'
      },
      {
        label: 'Pending GRN Review',
        value: this.kpi.pendingGRNReviewCount,
        description: 'Goods receipt needs review',
        icon: 'bi-box-seam',
        tone: 'info'
      },
      {
        label: 'Pending Invoice Review',
        value: this.kpi.pendingInvoiceReviewCount,
        description: 'Invoice matching / review pending',
        icon: 'bi-journal-check',
        tone: 'warning'
      },
      {
        label: 'Overdue PO',
        value: this.kpi.overduePOCount,
        description: 'Delivery date passed',
        icon: 'bi-truck',
        tone: 'danger'
      }
    ];

    this.invoiceWorkbench = [
      {
        label: 'Open Invoice',
        value: this.kpi.openInvoiceCount,
        description: 'Unposted purchase invoices',
        icon: 'bi-receipt',
        tone: 'primary'
      },
      {
        label: 'Pending Invoice Approval',
        value: this.kpi.pendingInvoiceApprovalCount,
        description: 'Invoice approval workflow pending',
        icon: 'bi-hourglass-bottom',
        tone: 'warning'
      },
      {
        label: 'Released Invoice',
        value: this.kpi.releasedInvoiceCount,
        description: 'Ready for posting / next action',
        icon: 'bi-check-circle',
        tone: 'success'
      },
      {
        label: 'Posted Invoice',
        value: this.kpi.postedInvoiceCount,
        description: 'Completed purchase invoices',
        icon: 'bi-journal-check',
        tone: 'success'
      },
      {
        label: 'Prepayment Invoice',
        value: this.kpi.invoiceWithPrepaymentCount,
        description: 'Invoices with prepayment amount',
        icon: 'bi-credit-card',
        tone: 'purple'
      },
      {
        label: 'Allocation Invoice',
        value: this.kpi.invoiceWithAllocationCount,
        description: 'Invoices with allocation lines',
        icon: 'bi-pie-chart',
        tone: 'info'
      }
    ];

    this.approvalWorkbench = [
      {
        label: 'My Pending Approval',
        value: this.kpi.myPendingApprovalCount,
        description: 'Assigned approval / review tasks',
        icon: 'bi-person-check',
        tone: this.kpi.myPendingApprovalCount > 0 ? 'warning' : 'success'
      },
      {
        label: 'Pending Amount',
        value: this.formatCurrency(this.kpi.pendingApprovalAmount),
        description: 'Total amount waiting for approval',
        icon: 'bi-currency-exchange',
        tone: 'primary'
      },
      {
        label: 'Oldest Pending',
        value: this.formatDate(this.kpi.oldestPendingApprovalDate) || '-',
        description: 'Oldest approval waiting date',
        icon: 'bi-calendar-week',
        tone: this.kpi.oldestPendingApprovalDate !== '0001-01-01' ? 'warning' : 'neutral'
      },
      {
        label: 'SLA Breach',
        value: this.kpi.approvalSlaBreachCount,
        description: 'Approvals past due date',
        icon: 'bi-exclamation-octagon',
        tone: this.kpi.approvalSlaBreachCount > 0 ? 'danger' : 'success'
      }
    ];

    this.flowStages = [
      {
        title: 'PR Created',
        value: this.kpi.openPRCount + this.kpi.pendingPRApprovalCount + this.kpi.approvedPRCount,
        icon: 'bi-file-earmark-plus',
        tone: 'primary'
      },
      {
        title: 'RFQ / Sourcing',
        value: this.kpi.rfqRequiredCount + this.kpi.rfqInProgressCount,
        icon: 'bi-diagram-3',
        tone: 'purple'
      },
      {
        title: 'Quote / Winner',
        value: this.kpi.rfqQuoteReceivedCount + this.kpi.rfqWinnerSelectedCount,
        icon: 'bi-award',
        tone: 'info'
      },
      {
        title: 'PO Created',
        value: this.kpi.prConvertedToOrderCount + this.kpi.openPOCount + this.kpi.releasedPOCount,
        icon: 'bi-bag-check',
        tone: 'success'
      },
      {
        title: 'Receipt / Invoice',
        value: this.kpi.pendingGRNReviewCount + this.kpi.pendingInvoiceReviewCount + this.kpi.openInvoiceCount,
        icon: 'bi-receipt-cutoff',
        tone: 'warning'
      }
    ];

    this.insights = [
      {
        title: 'PO Exposure',
        value: this.formatCurrency(this.kpi.totalPOAmount),
        note: 'Total purchase order amount',
        tone: 'primary',
        icon: 'bi-graph-up-arrow'
      },
      {
        title: 'To Receive',
        value: this.formatCurrency(this.kpi.totalAmountToReceive),
        note: 'Outstanding receiving value',
        tone: 'info',
        icon: 'bi-box-arrow-in-down'
      },
      {
        title: 'To Invoice',
        value: this.formatCurrency(this.kpi.totalAmountToInvoice),
        note: 'Outstanding invoice value',
        tone: 'warning',
        icon: 'bi-journal-arrow-up'
      },
      {
        title: 'Invoiced',
        value: this.formatCurrency(this.kpi.totalAmountInvoiced),
        note: 'Amount already invoiced',
        tone: 'success',
        icon: 'bi-check2-square'
      },
      {
        title: 'Invoice Pipeline',
        value: this.formatCurrency(this.kpi.totalInvoiceAmount),
        note: 'Open + posted invoice amount',
        tone: 'purple',
        icon: 'bi-receipt'
      },
      {
        title: 'Pending Invoice Value',
        value: this.formatCurrency(this.kpi.pendingInvoiceAmount),
        note: 'Invoice amount pending approval',
        tone: 'danger',
        icon: 'bi-hourglass'
      }
    ];
  }

  applyDateFilter(): void {
    this.loadRoleCentre();
  }

  clearDateFilter(): void {
    this.startDate = '';
    this.endDate = '';
    this.loadRoleCentre();
  }

  openRoute(route?: string): void {
    if (!route) {
      return;
    }

    this.router.navigate([route]);
  }

  createPR(): void {
    this.router.navigate(['/purchase-requisition'], {
      queryParams: { action: 'new' }
    });
  }

  openPR(): void {
    this.router.navigate(['/purchase-requisition']);
  }

  openPO(): void {
    this.router.navigate(['/purchase-order']);
  }

  openInvoice(): void {
    this.router.navigate(['/purchase-invoice']);
  }

  get totalOpenDocuments(): number {
    return (
      this.kpi.openPRCount +
      this.kpi.openPOCount +
      this.kpi.openInvoiceCount
    );
  }

  get totalRiskCount(): number {
    return (
      this.kpi.overduePRCount +
      this.kpi.overduePOCount +
      this.kpi.rejectedPRCount +
      this.kpi.approvalSlaBreachCount +
      this.kpi.winnerPendingConversionCount
    );
  }

  get rfqResponseRate(): number {
    if (!this.kpi.vendorsInvitedCount) {
      return 0;
    }

    return Math.round((this.kpi.quotesReceivedCount / this.kpi.vendorsInvitedCount) * 100);
  }

  get poInvoiceProgress(): number {
    if (!this.kpi.totalPOAmount) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((this.kpi.totalAmountInvoiced / this.kpi.totalPOAmount) * 100)
    );
  }

  get roleCentreHealthLabel(): string {
    if (this.totalRiskCount > 0) {
      return 'Attention required';
    }

    if (this.kpi.myPendingApprovalCount > 0) {
      return 'Approval pending';
    }

    return 'Healthy';
  }

  get roleCentreHealthTone(): DashboardTone {
    if (this.totalRiskCount > 0) {
      return 'danger';
    }

    if (this.kpi.myPendingApprovalCount > 0) {
      return 'warning';
    }

    return 'success';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  formatNumber(value: number | string): string {
    if (typeof value === 'string') {
      return value;
    }

    return new Intl.NumberFormat('en-MY').format(Number(value || 0));
  }

  formatDate(value: string): string {
    if (!value || value === '0001-01-01') {
      return '';
    }

    return new Intl.DateTimeFormat('en-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value));
  }

  private escapeOData(value: string): string {
    return (value || '').replace(/'/g, "''");
  }
}