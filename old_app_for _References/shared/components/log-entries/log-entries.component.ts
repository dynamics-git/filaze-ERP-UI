import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';

import { RestService } from '../../../core/services/rest.service';

@Component({
  standalone: false,
  selector: 'app-log-entries',
  templateUrl: './log-entries.component.html',
  styleUrls: ['./log-entries.component.scss']
})
export class LogEntriesComponent implements OnInit, OnDestroy {

  @Input() documentNo!: string;

  approvalEntries: any[] = [];
  timelineData: any[] = [];

  constructor(private restService: RestService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.getLogEntries();
  }

  ngOnDestroy(): void {
    this.cdr.detach();
  }

  getLogEntries() {
    this.restService.get("/approvalentries?$filter=DocumentNo eq '" + this.documentNo + "'&$orderby=LastDateTimeModified desc").subscribe((response: any) => {
      this.approvalEntries = response.value;
      this.updateTimelineData();
    });
  }

  updateTimelineData() {
    this.timelineData = this.approvalEntries.map((item: any) => {
      return {
        SenderID: item.SenderID,
        ApproverID: item.ApproverID,
        ModifiedDate: item.LastDateTimeModified,
        Status: item.Status,
        CreatedDate: item.systemCreatedAt,
      }
    });

    if (this.timelineData.length > 0) {
      this.timelineData.push({
        Status: 'Approval Created',
        ModifiedDate: null
      });
    } else {
      this.timelineData.push({
        Status: 'Approval Not yet Created',
        ModifiedDate: null
      });
    }

    this.cdr.detectChanges();
  }
}
