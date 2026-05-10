import { Component, Input, OnInit } from '@angular/core';
import { RestService } from '../../../core/services/rest.service';
import { ReportFilterField } from '../../services/report-filter.model';
import { ReportKpi } from '../../services/report-kpis.model';
import { ReportColumn, ReportTableConfig } from '../../services/report-columns.model';

@Component({
  standalone: false,
  selector: 'app-monthly-claim-summary',
  templateUrl: './monthly-claim-summary.component.html',
  styleUrl: './monthly-claim-summary.component.scss'
})
export class MonthlyClaimSummaryComponent {
  config: ReportTableConfig = {
    api: '/claimSummaries',
    title: 'Monthly Claim Summary',
    pageName: 'MONTHLY_CLAIM_SUMMARY',
    pageSize: 50,
    uiOrderByField: 'receiptYear',
    filter: [
      {
        field: 'totalAmount',
        operator: 'ne',
        value: "0"
      },
      {
        field: '(batchStatus',
        operator: 'eq',
        value: "'Paid' or batchStatus eq 'Payment Initiated')"
      }
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

  private readonly monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  columns: ReportColumn[] = [
    { prop: 'claimDate', name: 'Date' },
    { prop: 'paymentBatchNo', name: 'Batch No' },
    { prop: 'employeeNo', name: 'Staff ID' },
    { prop: 'employeeName', name: 'Staff Name' },
    { prop: 'userEmail', name: 'Email', },
    { prop: 'totalAmount', name: 'Amount' },
  ];

  constructor(private rest: RestService) { }



  filtersConfig: ReportFilterField[] = [
    {
      key: 'paymentBatchNo',
      label: 'Batch No',
      type: 'text',
      apiField: 'paymentBatchNo',
      operator: 'eq',
      placeholder: 'Batch No'
    },
    {
      key: 'employeeNo',
      label: 'Staff No',
      type: 'text',
      apiField: 'employeeNo',
      operator: 'eq',
      placeholder: 'Staff No'
    },
    {
      key: 'employeeName',
      label: 'Staff Name',
      type: 'text',
      apiField: 'employeeName',
      operator: 'eq',
      placeholder: 'Staff Name'
    },
  ];


  onDataChange(rows: any[]) {
    this.rows = rows;
    this.updateKpis(rows);
  }

  onLoadingChange(loading: boolean) {
    this.loading = loading;
  }

  private updateKpis(rows: any[]) {
    console.log("row=", rows);

    this.kpis = [
      { key: 'totalClaims', label: 'Total Claims', value: rows.length },
      {
        key: 'totalAmount',
        label: 'Total Amount',
        value: rows.reduce((s, r) => s + (+r.totalAmount || 0), 0).toFixed(2)
      },
      {
        key: 'batchStatus',
        label: 'Paid',
        value: rows.filter(r => r.batchStatus === 'Paid').length
      },
      {
        key: 'batchStatus',
        label: 'Payment Initiated',
        value: rows.filter(r => r.batchStatus === 'Payment Initiated').length
      }
    ];
  }


}

