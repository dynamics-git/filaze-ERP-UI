import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ReportFilterField } from '../services/report-filter.model';
import { ReportKpi } from '../services/report-kpis.model';
import { ReportTableComponent } from '../tables/report-table/report-table.component';

@Component({
  standalone: false,
  selector: 'app-report-shell',
  templateUrl: './report-shell.component.html',
  styleUrl: './report-shell.component.scss'
})
export class ReportShellComponent {

  @Input() config!: { api: string; pageSize?: number; title?: string };
  @Input() columns: any[] = [];
  @Input() filtersConfig: ReportFilterField[] = [];
  @Input() kpis: ReportKpi[] = [];

  @Output() dataChange = new EventEmitter<any[]>();
  @Output() loadingChange = new EventEmitter<boolean>();

  @ViewChild('reportTable')
  reportTable!: ReportTableComponent;


  filterQuery = '';

  onFilterApply(query: string) {
    this.filterQuery = query;
  }

  exportPdf() {
    if (!this.reportTable) return;
    this.reportTable.exportPdf();
  }


  exportExcel() {
    if (!this.reportTable) return;
    this.reportTable.Exportexcel();
  }
}
