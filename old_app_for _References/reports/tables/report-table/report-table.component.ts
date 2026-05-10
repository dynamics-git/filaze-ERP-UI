import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef
} from '@angular/core';
import { RestService } from '../../../core/services/rest.service';
import { UnicodeCleanPipe } from '../../pipes/unicode-clean.pipe';
import { ExportPdfService } from '../../../core/services/shared/export-pdf.service';
import * as xlsx from 'xlsx';

@Component({
  standalone: false,
  selector: 'app-report-table',
  templateUrl: './report-table.component.html',
  styleUrl: './report-table.component.scss'
})
export class ReportTableComponent implements OnChanges {

  @Input() config!: any;
  @Input() columns: any[] = [];
  @Input() filterQuery = '';

  @Output() dataChange = new EventEmitter<any[]>();
  @Output() loadingChange = new EventEmitter<boolean>();
  @ViewChild('reportTable') reportTable!: ReportTableComponent;
  @ViewChild('epltable', { static: false }) epltable!: ElementRef;

  rows: any[] = [];
  loading = false;

  private page = 0;
  private currentFilter = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private rest: RestService,
    private unicodeClean: UnicodeCleanPipe,
    private exportPdfService: ExportPdfService
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterQuery']) {
      this.load(true);
    }
  }
  onSort(col: any) {
    if (!col?.key || !this.rows.length) return;

    if (this.sortColumn === col.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col.key;
      this.sortDirection = 'asc';
    }

    this.rows.sort((a, b) => {
      const valA = a[col.key];
      const valB = b[col.key];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc'
          ? valA - valB
          : valB - valA;
      }

      return this.sortDirection === 'asc'
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });

    this.dataChange.emit(this.rows);
  }

  load(reset = false) {
    if (this.loading || !this.config?.api) return;

    if (reset || this.currentFilter !== this.filterQuery) {
      this.page = 0;
      this.rows = [];
      this.currentFilter = this.filterQuery;
    }

    this.loading = true;
    this.loadingChange.emit(true);

    const pageSize = this.config.pageSize || 50;
    const skip = this.page * pageSize;

    let query = '';

    /* ---------------- CONFIG FILTER ---------------- */
    const configFilter = this.config.filter?.length
      ? this.config.filter
        .map((f: any) => `${f.field} ${f.operator} ${f.value}`)
        .join(' and ')
      : '';

    /* ---------------- MERGE FILTERS ---------------- */
    if (this.filterQuery && configFilter) {
      const baseFilter = this.filterQuery.replace('?$filter=', '');
      query = `?$filter=${baseFilter} and ${configFilter}`;
    } else if (this.filterQuery) {
      query = this.filterQuery;
    } else if (configFilter) {
      query = `?$filter=${configFilter}`;
    }

    /* ---------------- API ORDER BY ---------------- */
    if (this.config.apiOrderByField) {
      query += (this.config.api.includes('?') || query.includes('?'))
        ? '&'
        : '?';
      query += `$orderby=${this.config.apiOrderByField} desc`;
    }

    /* ---------------- API CALL ---------------- */
    this.rest.get(`${this.config.api}${query}`).subscribe({
      next: (res: any) => {
        let data = (res?.value || []).map((row: any) =>
          this.cleanRow(row)
        );

        /* ---------------- UI SORT ---------------- */
        if (this.config.uiOrderByField) {
          const field = this.config.uiOrderByField;
          const dir = this.config.uiOrderByDirection === 'asc' ? 1 : -1;

          data.sort((a: any, b: any) => {
            const av = a[field];
            const bv = b[field];

            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;

            if (typeof av === 'number' && typeof bv === 'number') {
              return (av - bv) * dir;
            }

            return av.toString().localeCompare(bv.toString()) * dir;
          });
        }

        this.rows = [...this.rows, ...data];
        this.page++;
        this.dataChange.emit(this.rows);
        this.loading = false;
        this.loadingChange.emit(false);
      },
      error: () => {
        this.loading = false;
        this.loadingChange.emit(false);
      }
    });
  }


  onScroll(event: Event) {
    // const el = event.target as HTMLElement;
    // if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
    //   this.load();
    // }
  }


  private cleanRow(row: any): any {
    const cleaned: any = { ...row };

    this.columns.forEach(col => {
      const field = col.prop ?? col.key; // SAFETY
      const value = cleaned[field];

      if (value == null) return;

      // Month conversion
      if (col.convertMonth && typeof value === 'number') {
        cleaned[field] = this.monthNames[value - 1] ?? value;
        return;
      }

      // 🔥 CLEAN UNICODE AT GET TIME
      if (typeof value === 'string') {
        cleaned[field] = this.unicodeClean.transform(value);
      }
    });

    return cleaned;
  }



  private readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];


  exportPdf() {
    this.exportPdfService.exportTableToPdf(
      this.columns,
      this.rows,
      this.config.title
    );
  }


  Exportexcel() {
    if (!this.rows.length || !this.columns.length) return;

    const headerRow = this.columns.map(col => col.name);

    const dataRows = this.rows.map(row =>
      this.columns.map(col => {
        const value = row[col.prop];
        return value == null ? '' : value;
      })
    );

    const worksheetData = [headerRow, ...dataRows];

    const ws: xlsx.WorkSheet = xlsx.utils.aoa_to_sheet(worksheetData);
    const wb: xlsx.WorkBook = xlsx.utils.book_new();

    xlsx.utils.book_append_sheet(wb, ws, 'Report');
    xlsx.writeFile(wb, `${this.config.title}.xlsx`);
  }

}
