import { Component } from '@angular/core';
import { ReportFilterField } from '../../services/report-filter.model';
import { ReportKpi } from '../../services/report-kpis.model';
import { ReportColumn } from '../../services/report-columns.model';

@Component({
  standalone: false,
  selector: 'app-expense-type-summary',
  templateUrl: './expense-type-summary.component.html',
  styleUrl: './expense-type-summary.component.scss'
})
export class ExpenseTypeSummaryComponent {

  config = {
    api: '/employeeExpenseTypeSummaries',
    title: 'Expense Type Summary Report',
    pageName: 'EXPENSE_TYPE_SUMMARY',
    pageSize: 50,
    uiOrderByField: 'receiptYear',
    uiOrderByDirection: 'desc',
    filter: [
      {
        field: 'totalAmount',
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
  ];

  columns: ReportColumn[] = [
    { prop: 'expenseType', name: 'Expense Type' },
    { prop: 'employeeNo', name: 'Employee No' },
    { prop: 'employeeName', name: 'Employee Name' },
    { prop: 'receiptMonth', name: 'Month', convertMonth: true },
    { prop: 'receiptYear', name: 'Year' },
    { prop: 'claimCount', name: 'Claim Count', align: 'right' },
    { prop: 'totalAmount', name: 'Total Amount' }
  ];

  filtersConfig: ReportFilterField[] = [
    { key: 'expenseType', label: 'Expense Type', type: 'text', apiField: 'expenseType', operator: 'eq' },
    { key: 'employeeNo', label: 'Employee No', type: 'text', apiField: 'employeeNo', operator: 'eq' },
    {
      key: 'receiptMonth',
      label: 'Receipt Month',
      type: 'select',
      apiField: 'receiptMonth',
      operator: 'eq',
      options: [
        { label: 'January', value: 1, type: 'number' },
        { label: 'February', value: 2, type: 'number' },
        { label: 'March', value: 3, type: 'number' },
        { label: 'April', value: 4, type: 'number' },
        { label: 'May', value: 5, type: 'number' },
        { label: 'June', value: 6, type: 'number' },
        { label: 'July', value: 7, type: 'number' },
        { label: 'August', value: 8, type: 'number' },
        { label: 'September', value: 9, type: 'number' },
        { label: 'October', value: 10, type: 'number' },
        { label: 'November', value: 11, type: 'number' },
        { label: 'December', value: 12, type: 'number' }
      ]
    },
    {
      key: 'receiptYear',
      label: 'Receipt Year',
      type: 'number',
      apiField: 'receiptYear',
      operator: 'eq',
      placeholder: 'Receipt Year'
    },
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
      {
        key: 'totalClaims',
        label: 'Total Claims',
        value: rows.reduce((s, r) => s + (+r.claimCount || 0), 0).toFixed(2)
      },
      {
        key: 'totalAmount',
        label: 'Total Amount',
        value: rows.reduce((s, r) => s + (+r.totalAmount || 0), 0).toFixed(2)
      }
    ];
  }
}

