import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { SummaryFieldConfig } from '../summary/summary.config';

@Component({
  standalone: false,
  selector: 'app-factbox',
  templateUrl: './factbox.component.html',
  styleUrls: ['./factbox.component.scss']
})
export class FactboxComponent implements OnChanges {

  @Input() headerData: any;
  @Input() documentNo: string | null = null;
  @Input() documentType: string | null = null;
  @Input() summaryFields: SummaryFieldConfig[] = [];
  @Input() summaryLineFields: SummaryFieldConfig[] = [];
  @Input() readonly: boolean = false;
  @Input() itemConfig!: any;
  @Input() documentID!: any;
  @Input() selectedLineForSummary!: any;
  @Input() lineData!: any;
  @Input() lineSummaryData!: any;
  @Input() selectedRowIndex!: any;
  @Output() procurementFlowAction = new EventEmitter<string>();
  activeTab: 'details' | 'attachments' = 'details';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedRowIndex'] && this.lineData) {
      this.selectedLineForSummary = this.lineData[this.selectedRowIndex] || null;
    }
  }

  get selectedLine(): any {
    return this.lineData?.[this.selectedRowIndex] ?? null;
  }
}

