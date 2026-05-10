import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { SessionService } from '../../../core/services/session.service';
import { ThemeOptions } from '../../theme-options.model';
import { environment } from '../../../../environments/environment';
import { SelectCompanyModalComponent } from '../../../shared/components/select-company-modal/select-company-modal.component';
import { SelectResCenterModalComponent } from '../../../shared/components/select-res-center-modal/select-res-center-modal.component';
import { SystemActivityModalComponent } from '../../../shared/components/system-activity-modal/system-activity-modal.component';
import { DataTableService } from '../../../core/services/shared/data-table.service';
import { Router } from '@angular/router';
import { RestService } from '../../../core/services/rest.service';
import { MENU_MODULES, MenuModule } from '../../shell/navigation/menu-items';
import { WorkspaceNavService } from '../../shell/navigation/workspace-nav.service';

@Component({
  standalone: false,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  company: string = '';
  isLive: boolean = false;
  menuModules: MenuModule[] = MENU_MODULES;
  activeModuleKey = '';

  responsibilityCenterName: string = '';
  responsibilityCenterTitle: string = 'Responsibility Center';
  showResponsibilityCenter: boolean = false;
  canChangeResCenter: boolean = false;

  isActive: boolean = false;
  notificationCount: number = 0;

  private resCenterChangedSubscription?: Subscription;
  private activeModuleSubscription?: Subscription;
  private companyModalRef: NgbModalRef | null = null;
  private resCenterModalRef: NgbModalRef | null = null;

  constructor(
    private sessionService: SessionService,
    public globals: ThemeOptions,
    private dataTableService: DataTableService,
    private restService: RestService,
    private toastr: ToastrService,
    private modal: NgbModal,
    private router: Router,
    private workspaceNavService: WorkspaceNavService
  ) {}

  @HostBinding('class.isActive')
  get isActiveAsGetter(): boolean {
    return this.isActive;
  }

  ngOnInit(): void {
    this.isLive = environment.isLive;
    this.syncHeaderContext();
    this.refreshNotificationBadge();
    this.activeModuleKey =
      this.workspaceNavService.loadSavedActiveModule() || this.menuModules[0]?.key || '';

    this.activeModuleSubscription = this.workspaceNavService.activeModuleKey$.subscribe((key) => {
      this.activeModuleKey = key || this.menuModules[0]?.key || '';
    });

    this.resCenterChangedSubscription =
      this.sessionService.resCenterChanged$?.subscribe((changed: boolean) => {
        if (changed) {
          this.syncHeaderContext();
          this.refreshNotificationBadge();
        }
      });
  }

  ngOnDestroy(): void {
    this.resCenterChangedSubscription?.unsubscribe();
    this.activeModuleSubscription?.unsubscribe();
  }

  selectModule(module: MenuModule): void {
    this.workspaceNavService.setActiveModule(module.key);
  }

  trackByModuleKey(index: number, module: MenuModule): string {
    return module.key;
  }

  toggleHeaderMobile(): void {
    this.globals.toggleHeaderMobile = !this.globals.toggleHeaderMobile;
  }

  changeCompany(): void {
    if (this.companyModalRef) {
      return;
    }

    this.companyModalRef = this.modal.open(SelectCompanyModalComponent, {
      backdrop: true,
      keyboard: true,
      windowClass: 'company-sheet-modal',
      backdropClass: 'company-sheet-backdrop'
    });

    this.companyModalRef.result.finally(() => {
      this.companyModalRef = null;
      this.syncHeaderContext();
    });
  }

  changeResCenter(): void {
    if (!this.canChangeResCenter) {
      return;
    }

    if (this.resCenterModalRef) {
      return;
    }

    this.resCenterModalRef = this.modal.open(SelectResCenterModalComponent, {
      backdrop: true,
      keyboard: true,
      windowClass: 'company-sheet-modal',
      backdropClass: 'company-sheet-backdrop'
    });

    this.resCenterModalRef.result.finally(() => {
      this.resCenterModalRef = null;
      this.syncHeaderContext();
    });
  }

  clearCache(): void {
    this.dataTableService.clearCacheData();
    this.toastr.success('Cache cleared successfully!');
  }

  openSystemActivity(): void {
    const modalRef = this.modal.open(SystemActivityModalComponent, {
      size: 'lg',
      backdrop: true,
      keyboard: true,
      windowClass: 'system-activity-modal-window'
    });

    modalRef.result.finally(() => {
      this.refreshNotificationBadge();
    });
  }

  get notificationBadgeLabel(): string {
    if (this.notificationCount > 99) {
      return '99+';
    }

    return String(this.notificationCount);
  }

  private async refreshNotificationBadge(): Promise<void> {
    const url = `/usersActivityLogs?$top=100&$orderby=dateAndTime desc`;

    try {
      const response: any = await firstValueFrom(this.restService.get(url));
      const logs: any[] = Array.isArray(response?.value) ? response.value : [];
      const unread = this.getUnreadCount(logs);
      this.notificationCount = unread;
    } catch {
      this.notificationCount = 0;
    }
  }

  private getUnreadCount(logs: any[]): number {
    const readSet = this.getReadEntryNoSet();
    let count = 0;

    for (const item of logs) {
      const entryNo = this.toEntryNo(item?.entryNo);
      if (entryNo !== null && !readSet.has(entryNo)) {
        count++;
      }
    }

    return count;
  }

  private toEntryNo(value: any): number | null {
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

  private getReadEntryNoSet(): Set<number> {
    const key = this.getReadStorageKey();
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set<number>(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set<number>();
    }
  }

  private getReadStorageKey(): string {
    const userId = (this.sessionService.UserId || 'guest').toLowerCase();
    return `notification-center:read:${userId}`;
  }

  dashboard(): void {
    this.router.navigate(['/home']);
  }

  private syncHeaderContext(): void {
    this.company = this.sessionService.CompanyName || '';

    const isSuperAdmin = !!this.sessionService.SuperAdmin;
    const currentRes = this.sessionService.ResponsibilityCenter;
    const resCenters = this.sessionService.ResponsibilityCenters || [];
    const showAll = !!this.sessionService.ShowAllResCenters;

    if (isSuperAdmin) {
      this.responsibilityCenterName = '';
      this.responsibilityCenterTitle = 'Responsibility Center';
      this.showResponsibilityCenter = false;
      this.canChangeResCenter = false;
      return;
    }

    this.responsibilityCenterName =
      currentRes?.PortalResponsibilityCentre ||
      currentRes?.ResponsibilityCentre ||
      currentRes?.Code ||
      '';

    this.canChangeResCenter = showAll || resCenters.length > 1;

    this.showResponsibilityCenter =
      !!this.responsibilityCenterName ||
      this.canChangeResCenter ||
      resCenters.length > 0;

    this.responsibilityCenterTitle = this.responsibilityCenterName
      ? this.responsibilityCenterName
      : this.canChangeResCenter
      ? 'Select Responsibility Center'
      : 'Responsibility Center';
  }
}