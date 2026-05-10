import { Component, OnInit } from '@angular/core';
import { RestService } from '../../../core/services/rest.service';
import { SessionService } from '../../../core/services/session.service';

@Component({
  standalone: false,
  selector: 'app-claim-dashboard',
  templateUrl: './claim-dashboard.component.html',
  styleUrl: './claim-dashboard.component.scss'
})
export class ClaimDashboardComponent implements OnInit {

  // =======================
  // AMOUNT KPIs
  // =======================
  totalSpend = 0;
  paidAmount = 0;
  spendUtilization = 0;

  // =======================
  // COUNT KPIs
  // =======================
  totalClaimCount = 0;
  financeReview = 0;
  paidClaimCount = 0;
  approvedCount = 0;

  isAdmin = false;

  constructor(
    private restService: RestService,
    private sessionService: SessionService
  ) { }

  ngOnInit(): void {
    this.isAdmin = this.sessionService.SuperAdmin;

    this.loadClaimHeaders();
    this.loadPaymentAmount();
  }

  // =======================
  // FILTER BUILDER
  // =======================
  private buildFilter(filters: any[]): string {
    return filters
      .filter(Boolean)
      .map(f => `${f.field} ${f.operator} ${f.value}`)
      .join(' and ');
  }

  // =======================
  // CLAIM HEADERS (COUNTS + TOTAL)
  // =======================
  private loadClaimHeaders(): void {

    const filters: any[] = [
      { field: 'totalClaimAmount', operator: 'ne', value: 0 }
    ];

    // 🔐 User filter only for non-admin
    if (!this.isAdmin) {
      filters.push({
        field: 'UserId',
        operator: 'eq',
        value: `'${this.sessionService.UserId}'`
      });
    }

    const filterQuery = this.buildFilter(filters);

    this.restService
      .get(`/employeeClaimHeaders?$filter=${encodeURIComponent(filterQuery)}`)
      .subscribe((res: any) => {

        const data = res?.value || [];


        // ===== COUNTS =====
        this.totalClaimCount = data.length;

        this.financeReview = data.filter(
          (x: any) =>
            x.batchStatus === 'Finance_x0020_Review'
        ).length;

        this.paidClaimCount = data.filter(
          (x: any) =>
            x.batchStatus === 'Paid'
        ).length;


        this.approvedCount = data.filter(
          (x: any) => x.batchStatus === 'Approved'
        ).length;

        // ===== TOTAL AMOUNT =====
        this.totalSpend = data.reduce(
          (sum: number, x: any) => sum + (x.totalClaimAmount || 0),
          0
        );
        this.calculateUtilization();
      });
  }

  // =======================
  // PAID / INITIATED AMOUNT
  // =======================
  private loadPaymentAmount(): void {

    const filters: any[] = [
      { field: 'totalAmount', operator: 'ne', value: 0 },
      {
        field: '(batchStatus',
        operator: 'eq',
        value: `'Paid' or batchStatus eq 'Payment Initiated')`
      }
    ];

    if (!this.isAdmin) {
      filters.push({
        field: 'userId',
        operator: 'eq',
        value: `'${this.sessionService.UserId}'`
      });
    }

    const filterQuery = this.buildFilter(filters);

    this.restService
      .get(`/claimSummaries?$filter=${encodeURIComponent(filterQuery)}`)
      .subscribe((res: any) => {

        const data = res?.value || [];

        this.paidAmount = data.reduce(
          (sum: number, x: any) => sum + (x.totalAmount || 0),
          0
        );

        this.calculateUtilization();
      });
  }

  // =======================
  // UTILIZATION
  // =======================
  private calculateUtilization(): void {
    this.spendUtilization =
      this.totalSpend > 0
        ? Math.round((this.paidAmount / this.totalSpend) * 100)
        : 0;
  }
}
