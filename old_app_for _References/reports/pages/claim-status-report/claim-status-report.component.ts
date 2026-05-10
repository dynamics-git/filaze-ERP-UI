import { Component } from '@angular/core';
import { ReportFilterField } from '../../services/report-filter.model';
import { ReportKpi } from '../../services/report-kpis.model';
import { ReportColumn } from '../../services/report-columns.model';

@Component({
  standalone: false,
  selector: 'app-claim-status-report',
  templateUrl: './claim-status-report.component.html',
  styleUrl: './claim-status-report.component.scss'
})
export class ClaimStatusReportComponent {

  config = {
    api: '/employeeClaimHeaders',
    title: 'Claim Status Report',
    pageName: 'CLAIM_STATUS_REPORT',
    pageSize: 50,
    uiOrderByField: 'claimDate',
    uiOrderByDirection: 'desc',
    filter: [
      {
        field: 'totalClaimAmount',
        operator: 'ne',
        value: "0"
      },
    ]
  };

  rows: any[] = [];
  loading = false;

  kpis: ReportKpi[] = [
    { key: 'totalClaims', label: 'Total Claims', value: 0 },
    { key: 'totalAmount', label: 'Total Amount', value: '0.00' },
    { key: 'approved', label: 'Approved', value: 0 },
    { key: 'pending', label: 'Pending For Approval', value: 0 }
  ];

  columns: ReportColumn[] = [
    { prop: 'claimNo', name: 'Claim No' },
    { prop: 'employeeNo', name: 'Employee No' },
    { prop: 'employeeName', name: 'Employee Name' },
    { prop: 'approvalStatus', name: 'Status' },
    // { key: 'category', label: 'Expense Type' },
    { prop: 'totalClaimAmount', name: 'Amount', align: 'right' },
    { prop: 'claimDate', name: 'Claim Date' }
  ];

  filtersConfig: ReportFilterField[] = [
    { key: 'fromDate', label: 'From Date', type: 'date', apiField: 'claimDate', operator: 'ge' },
    { key: 'toDate', label: 'To Date', type: 'date', apiField: 'claimDate', operator: 'le' },
    { key: 'claimNo', label: 'Claim No', type: 'text', apiField: 'claimNo', operator: 'eq' },
    { key: 'employeeNo', label: 'Employee No', type: 'text', apiField: 'employeeNo', operator: 'eq' },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      apiField: 'approvalStatus',
      operator: 'eq',
      options: [
        { label: 'Open', value: 'Open' },
        { label: 'Pending For Approval', value: 'Pending For Approval' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' }
      ]
    }
  ];

  /** called when table loads data */
  onDataChange(rows: any[]) {
    this.rows = rows;
    this.updateKpis(rows);
  }

  onLoadingChange(loading: boolean) {
    this.loading = loading;
  }

  private updateKpis(rows: any[]) {
    this.kpis = [
      { key: 'totalClaims', label: 'Total Claims', value: rows.length },
      {
        key: 'totalAmount',
        label: 'Total Amount',
        value: rows.reduce((s, r) => s + (+r.totalClaimAmount || 0), 0).toFixed(2)
      },
      {
        key: 'approved',
        label: 'Approved',
        value: rows.filter(r => r.approvalStatus === 'Approved').length
      },
      {
        key: 'pending',
        label: 'Pending For Approval',
        value: rows.filter(r => r.approvalStatus === 'Pending For Approval').length
      }
    ];
  }
}
