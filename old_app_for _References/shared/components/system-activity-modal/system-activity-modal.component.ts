import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';

import { RestService } from '../../../core/services/rest.service';
import { SessionService } from '../../../core/services/session.service';

interface ActivityLogRecord {
  entryNo: number;
  dateAndTime?: string;
  fieldCaption?: string;
  oldValue?: string;
  newValue?: string;
  typeOfChange?: string;
  portalUserId?: string;
  userID?: string;
  tableCaption?: string;
}

interface ODataResponse<T> {
  value: T[];
}

interface NotificationGroup {
  label: string;
  items: ActivityLogRecord[];
}

@Component({
  standalone: false,
  selector: 'app-system-activity-modal',
  templateUrl: './system-activity-modal.component.html',
  styleUrls: ['./system-activity-modal.component.scss']
})
export class SystemActivityModalComponent implements OnInit {
  logs: ActivityLogRecord[] = [];
  loading = false;
  hasMore = true;
  pageSize = 25;
  skip = 0;
  searchTerm = '';
  mode: 'all' | 'mine' = 'all';
  selectedModule: string = 'all';
  readEntryNos = new Set<number>();
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private restService: RestService,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.loadReadState();
    this.loadLogs(true);
    this.refreshTimerId = setInterval(() => {
      this.loadLogs(true);
    }, 120000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }

  async loadLogs(reset: boolean): Promise<void> {
    if (this.loading) {
      return;
    }

    if (reset) {
      this.logs = [];
      this.skip = 0;
      this.hasMore = true;
    }

    if (!this.hasMore) {
      return;
    }

    this.loading = true;

    const orderBy = '$orderby=dateAndTime desc';
    const paging = `$top=${this.pageSize}&$skip=${this.skip}`;
    const filter = this.buildFilter();
    const url = `/usersActivityLogs?${paging}${filter ? `&$filter=${encodeURIComponent(filter)}` : ''}&${orderBy}`;

    try {
      const response = await firstValueFrom(this.restService.get(url)) as ODataResponse<any>;
      const value = (response?.value || []).map((raw: any) => this.normalizeLog(raw));

      this.logs = [...this.logs, ...value];
      this.skip += value.length;
      this.hasMore = value.length === this.pageSize;
    } finally {
      this.loading = false;
    }
  }

  switchMode(mode: 'all' | 'mine'): void {
    if (this.mode === mode) {
      return;
    }

    this.mode = mode;
    this.loadLogs(true);
  }

  get filteredLogs(): ActivityLogRecord[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.logs.filter((item) => {
      const tableCaption = (item.tableCaption || '').trim();
      if (this.selectedModule !== 'all' && tableCaption !== this.selectedModule) {
        return false;
      }

      if (!term) {
        return true;
      }

      const actor = this.getActor(item).toLowerCase();
      const table = (item.tableCaption || '').toLowerCase();
      const message = this.getMessage(item).toLowerCase();
      return `${actor} ${table} ${message}`.includes(term);
    });
  }

  get notificationCount(): number {
    return this.filteredLogs.length;
  }

  get unreadCount(): number {
    return this.filteredLogs.filter((item) => this.isUnread(item)).length;
  }

  get moduleOptions(): string[] {
    const modules = Array.from(new Set(this.logs.map((x) => (x.tableCaption || '').trim()).filter((x) => !!x)));
    modules.sort((a, b) => a.localeCompare(b));
    return modules;
  }

  get groupedLogs(): NotificationGroup[] {
    const buckets: Record<'today' | 'yesterday' | 'earlier', ActivityLogRecord[]> = {
      today: [],
      yesterday: [],
      earlier: []
    };

    for (const item of this.filteredLogs) {
      const key = this.getDateBucket(item);
      buckets[key].push(item);
    }

    const groups: NotificationGroup[] = [];
    if (buckets.today.length > 0) {
      groups.push({ label: 'Today', items: buckets.today });
    }

    if (buckets.yesterday.length > 0) {
      groups.push({ label: 'Yesterday', items: buckets.yesterday });
    }

    if (buckets.earlier.length > 0) {
      groups.push({ label: 'Earlier', items: buckets.earlier });
    }

    return groups;
  }

  isUnread(item: ActivityLogRecord): boolean {
    const entryNo = this.getEntryNo(item);
    return entryNo !== null && !this.readEntryNos.has(entryNo);
  }

  toggleRead(item: ActivityLogRecord): void {
    const entryNo = this.getEntryNo(item);
    if (entryNo === null) {
      return;
    }

    if (this.readEntryNos.has(entryNo)) {
      this.readEntryNos.delete(entryNo);
    } else {
      this.readEntryNos.add(entryNo);
    }

    this.persistReadState();
  }

  markAllVisibleAsRead(): void {
    for (const item of this.filteredLogs) {
      const entryNo = this.getEntryNo(item);
      if (entryNo !== null) {
        this.readEntryNos.add(entryNo);
      }
    }

    this.persistReadState();
  }

  markAllVisibleAsUnread(): void {
    for (const item of this.filteredLogs) {
      const entryNo = this.getEntryNo(item);
      if (entryNo !== null) {
        this.readEntryNos.delete(entryNo);
      }
    }

    this.persistReadState();
  }

  get criticalCount(): number {
    return this.filteredLogs.filter((item) => this.isCritical(item)).length;
  }

  get recentCount(): number {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    return this.filteredLogs.filter((item) => {
      if (!item.dateAndTime) {
        return false;
      }

      const t = new Date(item.dateAndTime).getTime();
      return !isNaN(t) && now - t <= oneDayMs;
    }).length;
  }

  getActor(item: ActivityLogRecord): string {
    return item.portalUserId || item.userID || 'System';
  }

  getMessage(item: ActivityLogRecord): string {
    const base = item.fieldCaption || item.typeOfChange || 'Updated';

    if (item.fieldCaption) {
      if (item.oldValue && item.newValue) {
        return `${base} changed from "${item.oldValue}" to "${item.newValue}"`;
      }

      if (!item.oldValue && item.newValue) {
        return `${base} set to "${item.newValue}"`;
      }

      if (item.oldValue && !item.newValue) {
        return `${base} cleared`;
      }
    }

    return base;
  }

  isCritical(item: ActivityLogRecord): boolean {
    const text = `${item.typeOfChange || ''} ${item.fieldCaption || ''} ${item.newValue || ''}`.toLowerCase();
    return text.includes('deletion') || text.includes('rejected') || text.includes('cancel') || text.includes('failed');
  }

  getNotificationClass(item: ActivityLogRecord): string {
    if (this.isCritical(item)) {
      return 'is-critical';
    }

    const text = `${item.typeOfChange || ''} ${item.fieldCaption || ''}`.toLowerCase();
    if (text.includes('insertion') || text.includes('approved') || text.includes('created')) {
      return 'is-positive';
    }

    return 'is-neutral';
  }

  getTimeLabel(item: ActivityLogRecord): string {
    const date = item.dateAndTime ? new Date(item.dateAndTime) : null;
    if (!date || isNaN(date.getTime())) {
      return 'Unknown time';
    }

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) {
      return 'just now';
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  getAbsoluteTime(item: ActivityLogRecord): string {
    const date = item.dateAndTime ? new Date(item.dateAndTime) : null;
    if (!date || isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString();
  }

  private getDateBucket(item: ActivityLogRecord): 'today' | 'yesterday' | 'earlier' {
    const date = item.dateAndTime ? new Date(item.dateAndTime) : null;
    if (!date || isNaN(date.getTime())) {
      return 'earlier';
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const value = date.getTime();

    if (value >= startOfToday) {
      return 'today';
    }

    if (value >= startOfYesterday) {
      return 'yesterday';
    }

    return 'earlier';
  }

  private buildFilter(): string {
    if (this.mode !== 'mine') {
      return '';
    }

    const userId = (this.sessionService.UserId || '').replace(/'/g, "''");
    if (!userId) {
      return '';
    }

    return `(portalUserId eq '${userId}' or userID eq '${userId}')`;
  }

  private getReadStorageKey(): string {
    const userId = (this.sessionService.UserId || 'guest').toLowerCase();
    return `notification-center:read:${userId}`;
  }

  private loadReadState(): void {
    try {
      const raw = localStorage.getItem(this.getReadStorageKey());
      const arr = raw ? JSON.parse(raw) : [];
      const normalized = Array.isArray(arr)
        ? arr
            .map((x) => this.toNumber(x))
            .filter((x): x is number => x !== null)
        : [];
      this.readEntryNos = new Set<number>(normalized);
    } catch {
      this.readEntryNos = new Set<number>();
    }
  }

  private persistReadState(): void {
    try {
      localStorage.setItem(this.getReadStorageKey(), JSON.stringify(Array.from(this.readEntryNos.values())));
    } catch {
    }
  }

  private normalizeLog(raw: any): ActivityLogRecord {
    return {
      entryNo: this.toNumber(raw?.entryNo ?? raw?.EntryNo) || 0,
      dateAndTime: raw?.dateAndTime ?? raw?.DateAndTime,
      fieldCaption: raw?.fieldCaption ?? raw?.FieldCaption,
      oldValue: raw?.oldValue ?? raw?.OldValue,
      newValue: raw?.newValue ?? raw?.NewValue,
      typeOfChange: raw?.typeOfChange ?? raw?.TypeOfChange,
      portalUserId: raw?.portalUserId ?? raw?.PortalUserId,
      userID: raw?.userID ?? raw?.UserID,
      tableCaption: raw?.tableCaption ?? raw?.TableCaption,
    };
  }

  private getEntryNo(item: ActivityLogRecord | any): number | null {
    return this.toNumber(item?.entryNo ?? item?.EntryNo);
  }

  private toNumber(value: any): number | null {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return null;
  }
}
