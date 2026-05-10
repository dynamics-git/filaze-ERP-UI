import { Component, Input } from '@angular/core';
import { ReportKpi } from '../../services/report-kpis.model';

@Component({
  standalone: false,
  selector: 'app-report-kpi-strip',
  templateUrl: './report-kpi-strip.component.html',
  styleUrl: './report-kpi-strip.component.scss'
})
export class ReportKpiStripComponent {
  @Input() kpis: ReportKpi[] = [];
}
