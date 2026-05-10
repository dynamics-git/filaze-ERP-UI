import { ChangeDetectorRef, Component, Input, SimpleChanges } from '@angular/core';
import { RestService } from '../../../core/services/rest.service';
import { firstValueFrom } from 'rxjs';

interface ActivityLog {
  entryNo: number;
  dateAndTime: string;
  fieldCaption?: string;
  oldValue?: string;
  newValue?: string;
  typeOfChange?: string;
  recordID?: string;
  portalUserId?: string;
  userID?: string;
  primaryKeyField1Caption?: string;
  primaryKeyField1No?: number;
  primaryKeyField1Value?: string;
  primaryKeyField2Caption?: string;
  primaryKeyField2No?: number;
  primaryKeyField2Value?: string;
  primaryKeyField3Caption?: string;
  primaryKeyField3No?: number;
  primaryKeyField3Value?: string;
}
interface ODataResponse<T> {
  value: T[];
  ['@odata.nextLink']?: string;
}

@Component({
  standalone: false,
  selector: 'app-users-activity-logs',
  templateUrl: './users-activity-logs.component.html',
  styleUrls: ['./users-activity-logs.component.scss']
})
export class UsersActivityLogsComponent {
  loadingActivity: boolean = false;
  @Input() headerData!: any;
  @Input() lineData!: any;
  @Input() documentNo!: any;

  _pageSize: number = 20;
  headerPage: number = 1;
  linePage: number = 1;
  activeTab: 'header' | 'line' = 'header';
  searchTerm: string = '';

  activityLogHeaders: any[] = [];
  activityLogLines: any[] = [];
  headerActivityData: any[] = [];
  lineActivityData: any[] = [];
  hasMoreHeader: boolean = true;
  hasMoreLine: boolean = true;

  constructor(private restService: RestService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.loadInitialTab();
  }

  ngOnDestroy(): void {
    this.cdr.detach();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['documentNo'] && !changes['documentNo'].firstChange) {
      this.resetState();
      this.loadInitialTab();
    }
  }

  private resetState(): void {
    this.searchTerm = '';
    this.headerPage = 1;
    this.linePage = 1;
    this.activeTab = 'header';
    this.activityLogHeaders = [];
    this.activityLogLines = [];
    this.headerActivityData = [];
    this.lineActivityData = [];
    this.hasMoreHeader = true;
    this.hasMoreLine = true;
    this.loadingActivity = false;
  }

  private loadInitialTab(): void {
    if (this.activeTab === 'header') {
      this.getLogEntriesHeaders();
      return;
    }

    this.getLogEntriesLines();
  }


  async getLogEntriesHeaders() {
    if (this.loadingActivity || !this.hasMoreHeader) {
      return;
    }

    if (!this.headerData || !this.documentNo) {
      this.loadingActivity = false;
      return;
    }

    this.loadingActivity = true;
    const base = "/usersActivityLogs";
    const order = encodeURIComponent("dateAndTime desc");
    const safeHeader = this.headerData.replace(/'/g, "''");
    const safeDoc = this.documentNo.toString().replace(/'/g, "''");

    const buildUrl = (field: string): string => {
      const filter = `tableCaption eq '${safeHeader}' and ${field} eq '${safeDoc}'`;
      const skip = (this.headerPage - 1) * this._pageSize;
      return `${base}?$filter=${encodeURIComponent(filter)}&$top=${this._pageSize}&$skip=${skip}&$orderby=${order}`;
    };

    const fetchLogs = async (url: string): Promise<ActivityLog[]> => {
      try {
        const res = await firstValueFrom(this.restService.get(url)) as ODataResponse<ActivityLog>;
        return res?.value ?? [];
      } catch {
        return [];
      }
    };

    try {
      const results = await Promise.all([
        fetchLogs(buildUrl("primaryKeyField1Value")),
        fetchLogs(buildUrl("primaryKeyField2Value")),
        fetchLogs(buildUrl("primaryKeyField3Value"))
      ]);

      const combined: ActivityLog[] = [...results[0], ...results[1], ...results[2]];
      const seen = new Set<number>(this.activityLogHeaders.map((x: ActivityLog) => x.entryNo));
      const deduped: ActivityLog[] = [];

      for (const item of combined) {
        if (item?.entryNo !== undefined && !seen.has(item.entryNo)) {
          seen.add(item.entryNo);
          deduped.push(item);
        }
      }

      deduped.sort((a, b) =>
        new Date(b.dateAndTime).getTime() - new Date(a.dateAndTime).getTime()
      );

      this.hasMoreHeader = combined.length >= this._pageSize;
      this.activityLogHeaders = [...this.activityLogHeaders, ...deduped];
      this.updateheaderActivityData(this.activityLogHeaders);
      this.headerPage++;
    } finally {
      this.loadingActivity = false;
    }
  }

  async getLogEntriesLines() {
    if (this.loadingActivity || !this.hasMoreLine) {
      return;
    }

    if (!this.lineData || !this.documentNo) {
      this.loadingActivity = false;
      return;
    }

    this.loadingActivity = true;
    const base = "/usersActivityLogs";
    const order = encodeURIComponent("dateAndTime desc");
    const safeLine = this.lineData.replace(/'/g, "''");
    const safeDoc = this.documentNo.toString().replace(/'/g, "''");

    const buildUrl = (field: string): string => {
      const filter = `tableCaption eq '${safeLine}' and ${field} eq '${safeDoc}'`;
      const skip = (this.linePage - 1) * this._pageSize;
      return `${base}?$filter=${encodeURIComponent(filter)}&$top=${this._pageSize}&$skip=${skip}&$orderby=${order}`;
    };

    const fetchLogs = async (url: string): Promise<ActivityLog[]> => {
      try {
        const res = await firstValueFrom(this.restService.get(url)) as ODataResponse<ActivityLog>;
        return res?.value ?? [];
      } catch {
        return [];
      }
    };

    try {
      const results = await Promise.all([
        fetchLogs(buildUrl("primaryKeyField1Value")),
        fetchLogs(buildUrl("primaryKeyField2Value")),
        fetchLogs(buildUrl("primaryKeyField3Value"))
      ]);

      const combined: ActivityLog[] = [...results[0], ...results[1], ...results[2]];
      const seen = new Set<number>(this.activityLogLines.map((x: ActivityLog) => x.entryNo));
      const deduped: ActivityLog[] = [];

      for (const item of combined) {
        if (item?.entryNo !== undefined && !seen.has(item.entryNo)) {
          seen.add(item.entryNo);
          deduped.push(item);
        }
      }

      deduped.sort((a, b) =>
        new Date(b.dateAndTime).getTime() - new Date(a.dateAndTime).getTime()
      );

      this.hasMoreLine = combined.length >= this._pageSize;
      this.activityLogLines = [...this.activityLogLines, ...deduped];
      this.updatelineActivityData(this.activityLogLines);
      this.linePage++;
    } finally {
      this.loadingActivity = false;
    }
  }

  updateheaderActivityData(entries: any[]) {
    this.headerActivityData = entries.map((item: any) => {
      let statusText = item.Status || item.fieldCaption || item.typeOfChange;

      if (item.fieldCaption) {
        if (item.oldValue !== item.newValue) {
          if (item.oldValue && item.newValue) {
            statusText += ` changed from "${item.oldValue}" to "${item.newValue}"`;
          } else if (!item.oldValue && item.newValue) {
            statusText += ` set to "${item.newValue}"`;
          } else if (item.oldValue && !item.newValue) {
            statusText += ` cleared (was "${item.oldValue}")`;
          }
        }
      }

      return {
        Status: statusText,
        SenderID: item.portalUserId || item.userID || '-',
        ApproverID: item.ApproverID || '',
        ModifiedDate: item.LastDateTimeModified || item.systemModifiedAt || item.dateAndTime,
        CreatedDate: item.systemCreatedAt,
        icon: this.getLogIcon(item)
      };
    });

    if (this.headerActivityData.length === 0) {
      this.headerActivityData.push({
        Status: 'No activity logs found',
        ModifiedDate: null,
        icon: 'bi-info-circle'
      });
    }

    this.cdr.detectChanges();
  }

  updatelineActivityData(entries: any[]) {
    this.lineActivityData = entries.map((item: any) => {
      let statusText = item.Status || item.fieldCaption || item.typeOfChange;

      if (item.fieldCaption) {
        if (item.oldValue !== item.newValue) {
          if (item.oldValue && item.newValue) {
            statusText += ` changed from "${item.oldValue}" to "${item.newValue}" on Line No. ${item.primaryKeyField2Value}`;
          } else if (!item.oldValue && item.newValue) {
            statusText += ` set to "${item.newValue}" on Line No. ${item.primaryKeyField2Value}`;
          } else if (item.oldValue && !item.newValue) {
            statusText += ` cleared (was "${item.oldValue}" on Line No. ${item.primaryKeyField2Value})`;
          }
        }
      }

      return {
        Status: statusText,
        SenderID: item.portalUserId || item.userID || '-',
        ApproverID: item.ApproverID || '',
        ModifiedDate: item.LastDateTimeModified || item.systemModifiedAt || item.dateAndTime,
        CreatedDate: item.systemCreatedAt,
        icon: this.getLogIcon(item)
      };
    });

    if (this.lineActivityData.length === 0) {
      this.lineActivityData.push({
        Status: 'No activity logs found',
        ModifiedDate: null,
        icon: 'bi-info-circle'
      });
    }

    this.cdr.detectChanges();
  }

  getLogIcon(item: any): string {
    if (item.icon) return item.icon;

    switch (item.typeOfChange) {
      case 'Insertion': return 'bi-plus-circle text-success';
      case 'Modification': return 'bi-pencil-square text-primary';
      case 'Deletion': return 'bi-x-circle text-danger';
      default: return 'bi-info-circle text-secondary';
    }
  }

  reloadLogs() {
    if (this.activeTab === 'header') {
      this.headerPage = 1;
      this.hasMoreHeader = true;
      this.activityLogHeaders = [];
      this.getLogEntriesHeaders();
    } else {
      this.linePage = 1;
      this.hasMoreLine = true;
      this.activityLogLines = [];
      this.getLogEntriesLines();
    }
  }


  switchTab(tab: 'header' | 'line') {
    this.searchTerm = '';
    this.activeTab = tab;

    if (tab === 'header' && this.activityLogHeaders.length === 0) {
      this.getLogEntriesHeaders();
    }

    if (tab === 'line' && this.activityLogLines.length === 0) {
      this.getLogEntriesLines();
    }
  }

  onShowMore(): void {
    if (this.loadingActivity) {
      return;
    }

    if (this.activeTab === 'header') {
      this.getLogEntriesHeaders();
      return;
    }

    this.getLogEntriesLines();
  }

  get canShowMore(): boolean {
    return this.activeTab === 'header' ? this.hasMoreHeader : this.hasMoreLine;
  }

  get activeLogs(): any[] {
    const source = this.activeTab === 'header' ? this.headerActivityData : this.lineActivityData;
    const term = this.searchTerm?.trim().toLowerCase();

    if (!term) {
      return source;
    }

    return source.filter((item) => {
      const text = `${item?.Status || ''} ${item?.SenderID || ''} ${item?.ApproverID || ''}`.toLowerCase();
      return text.includes(term);
    });
  }

  get totalVisibleLogs(): number {
    return this.activeLogs.filter((x) => (x?.Status || '').toLowerCase() !== 'no activity logs found').length;
  }

  get totalActors(): number {
    const actors = this.activeLogs
      .map((x) => (x?.SenderID || '').trim())
      .filter((x) => !!x && x !== '-');

    return new Set(actors).size;
  }

  get latestLogTime(): string {
    const times = this.activeLogs
      .map((x) => x?.ModifiedDate || x?.CreatedDate)
      .filter((x) => !!x)
      .map((x) => new Date(x).getTime())
      .filter((x) => !Number.isNaN(x));

    if (times.length === 0) {
      return 'No recent activity';
    }

    const latest = Math.max(...times);
    return this.timeAgo(latest);
  }

  private timeAgo(dateMs: number): string {
    const seconds = Math.max(0, Math.floor((Date.now() - dateMs) / 1000));
    if (seconds < 60) {
      return 'Updated just now';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `Updated ${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `Updated ${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    return `Updated ${days}d ago`;
  }

}