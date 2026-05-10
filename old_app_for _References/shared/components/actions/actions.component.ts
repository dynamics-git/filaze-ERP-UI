import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ElementRef,
  HostListener,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { AdvanceFilterModel } from '../../../core/models/shared/advance-filter.model';
import { ActionsConfig } from '../../../core/models/shared/actionsConfig';
import { CustomButton } from '../../../core/models/shared/customButton';
import { TableHeader } from '../../../core/models/shared/tableHeader';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { DataTableService } from '../../../core/services/shared/data-table.service';
import { SectionType } from '../../../core/models/shared/eventDataModel';
import { MENU_MODULES } from '../../../layout/shell/navigation/menu-items';
import { SessionService } from '../../../core/services/session.service';
import { Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss'],
})
export class ActionsComponent implements OnInit, OnChanges {
  showInformationTabs = false;
  showSearchBox = false;
  searchTerm = '';
  advancedFilter: AdvanceFilterModel;
  private _selectedItems: any[] = [];

  selectedSortField: string | undefined;
  selectedSortIcon: string | undefined;
  showSortDropdown = false;
  showStatusDropdown = false;

  showCustomFilter = false;
  showAddFilterPanel: any;
  groupOption: any[] = [];
  selectedSortDirection: 'asc' | 'desc' | null = null;
  activeSubDropdown: string | null = null;
  isGridView = false;
  activeTab: string | undefined;
  searchQuery = '';

  showMoreDropdown = false;
  showExportDropdown = false;
  showColumnsDropdown = false;
  pinnedMenuButtons: any[] = [];

  private headerMaster: TableHeader[] = [];
  private subscriptions = new Subscription();
  @Input() config: ActionsConfig = {
    showCreate: true,
    showSearch: true,
    showEdit: true,
    showDelete: true,
    showexportExcel: true,
    showExportPdf: true,
    showAdvanceFilter: true,
  };

  @Input() viewMode!: boolean;
  @Input('buttons') customButtons: CustomButton[] = [];
  @Input('topbuttons') topButtons: CustomButton[] = [];
  @Input() headers: TableHeader[] = [];
  @Input() isFilter!: boolean;
  @Input() filterDropdown: any = [];
  @Input() sortingOption: any = [];
  @Input() MenuButtons: any[] = [];
  @Input() clearAllClickedAct!: boolean;

  resolvedMenuButtons: any[] = [];

  @Output() searchData = new EventEmitter<string>();
  @Output() create = new EventEmitter();
  @Output() copy = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() post = new EventEmitter();
  @Output() reverse = new EventEmitter();
  @Output() undoshipment = new EventEmitter();
  @Output() resetpassword = new EventEmitter();
  @Output() back = new EventEmitter();
  @Output() refresh = new EventEmitter();
  @Output() exportexcel = new EventEmitter<any[]>();
  @Output() exportpdf = new EventEmitter();
  @Output() print = new EventEmitter();
  @Output() buttonClickEvent = new EventEmitter<CustomButtonEvent>();
  @Output() toogleInfo = new EventEmitter<boolean>();
  @Output() advanceSearch = new EventEmitter<AdvanceFilterModel>();
  @Output() customfilter = new EventEmitter();
  @Output() sortChange = new EventEmitter<any>();
  @Output() groupOptionChange = new EventEmitter<any>();
  @Output() gridView = new EventEmitter<boolean>();

  constructor(
    private toastr: ToastrService,
    private dataTableService: DataTableService,
    private router: Router,
    private elementRef: ElementRef,
    private sessionService: SessionService
  ) {
    this.advancedFilter = {
      searchTerm: '',
      selectedColumn: '',
    };
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.dataTableService.ItemSelected$.subscribe((items: any[]) => {
        this._selectedItems = items;
      })
    );

    this.groupOption = [
      { Value: 'All', label: 'All' },
      ...(this.filterDropdown?.[0]?.fieldOptions || []),
    ];

    this.syncHeaderMaster();
    this.resolveMenuButtons();
    this.syncPinnedMenuButtons();

    this.subscriptions.add(
      this.sessionService.permissionsLoaded$.subscribe(() => {
        this.resolveMenuButtons();
        this.syncPinnedMenuButtons();
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['headers']) {
      this.syncHeaderMaster();
    }

    if (
      changes['clearAllClickedAct'] &&
      changes['clearAllClickedAct'].currentValue === true
    ) {
      this.onFilterClearAllAct();
    }

    if (changes['MenuButtons']) {
      this.resolveMenuButtons();
      this.syncPinnedMenuButtons();
    }

  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.closeFloatingMenus();
  }

  private syncHeaderMaster(): void {
    if (!this.headers?.length) {
      return;
    }

    if (!this.headerMaster.length) {
      this.headerMaster = this.headers.map((h) => ({ ...h }));
      return;
    }

    const known = new Set(this.headerMaster.map((h) => h.prop));
    this.headers.forEach((header) => {
      if (!known.has(header.prop)) {
        this.headerMaster.push({ ...header });
      }
    });
  }

  private closeFloatingMenus(): void {
    this.showMoreDropdown = false;
    this.showExportDropdown = false;
    this.showColumnsDropdown = false;
    this.showSortDropdown = false;
    this.showStatusDropdown = false;
    this.activeSubDropdown = null;
  }

  get hasActionMenu(): boolean {
    return Array.isArray(this.resolvedMenuButtons) && this.resolvedMenuButtons.length > 0;
  }

  get hasPinnedMenuButtons(): boolean {
    return this.pinnedMenuButtons.length > 0;
  }

  private getPinnedStorageKey(): string {
    const pageKey = (this.router.url || 'default')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    return `actions:pinned:${pageKey}`;
  }

  private getMenuButtonIdentity(btn: any): string {
    return String(btn?.route || btn?.name || btn?.label || '').toLowerCase();
  }

 private syncPinnedMenuButtons(): void {
  if (!Array.isArray(this.resolvedMenuButtons) || this.resolvedMenuButtons.length === 0) {
    this.pinnedMenuButtons = [];
    return;
  }

  const key = this.getPinnedStorageKey();
  let pinnedIds: string[] = [];

  try {
    const raw = localStorage.getItem(key);
    pinnedIds = raw ? JSON.parse(raw) : [];
  } catch {
    pinnedIds = [];
  }

  this.pinnedMenuButtons = this.resolvedMenuButtons.filter((btn) =>
    pinnedIds.includes(this.getMenuButtonIdentity(btn))
  );
}

  // private resolveMenuButtons(): void {
  //   if (Array.isArray(this.MenuButtons) && this.MenuButtons.length > 0) {
  //     this.resolvedMenuButtons = this.MenuButtons;
  //     return;
  //   }

  //   const currentRoute = (this.router.url || '').split('?')[0].toLowerCase();

  //   const flattenChildren: ChildMenuItem[] = MENU_MODULES
  //     .flatMap((module) => module.items)
  //     .flatMap((group) => group.menu.childrens || []);

  //   const current = flattenChildren.find((child) => {
  //     const link = (child.link || '').toLowerCase();
  //     return !!link && currentRoute.startsWith(link);
  //   });

  //   if (!current) {
  //     this.resolvedMenuButtons = [];
  //     return;
  //   }

  //   const siblings = MENU_MODULES
  //     .flatMap((module) => module.items)
  //     .find((group) => (group.menu.childrens || []).some((child) => child.page === current.page))
  //     ?.menu.childrens || [];

  //   this.resolvedMenuButtons = siblings
  //     .filter((child) => !!child.link)
  //     .map((child) => ({
  //       label: child.title,
  //       name: child.title,
  //       route: child.link,
  //       isEnable: (child.link || '').toLowerCase() !== currentRoute
  //     }));
  // }

  private resolveMenuButtons(): void {
    const currentRoute = (this.router.url || '').split('?')[0].toLowerCase();

    const groups = MENU_MODULES
      .flatMap((module) => module.items);

    const currentGroup = groups.find((group) =>
      (group.children || []).some((child: any) => {
        const link = (child.link || '').toLowerCase();
        return !!link && currentRoute.startsWith(link);
      })
    );

    const dynamicButtons = (currentGroup?.children || [])
      .filter((child: any) => !!child.link)
      .filter((child: any) => this.hasPermission(child.page || child.action))
      .map((child: any) => ({
        label: child.title,
        name: child.title,
        route: child.link,
        page: child.page,
        action: child.action,
        isEnable: (child.link || '').toLowerCase() !== currentRoute
      }));

    const manualButtons = Array.isArray(this.MenuButtons) ? this.MenuButtons : [];
    const seenIdentities = new Set<string>();
    const mergedButtons: any[] = [];

    [...dynamicButtons, ...manualButtons].forEach((btn) => {
      const identity = this.getMenuButtonIdentity(btn);

      if (!identity || seenIdentities.has(identity)) {
        return;
      }

      seenIdentities.add(identity);
      mergedButtons.push(btn);
    });

    this.resolvedMenuButtons = mergedButtons;
  }

  isPinned(btn: any): boolean {
    const identity = this.getMenuButtonIdentity(btn);
    return this.pinnedMenuButtons.some((pinned) => this.getMenuButtonIdentity(pinned) === identity);
  }

  togglePin(btn: any, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!btn) {
      return;
    }

    const key = this.getPinnedStorageKey();
    const identity = this.getMenuButtonIdentity(btn);
    let pinnedIds: string[] = [];

    try {
      const raw = localStorage.getItem(key);
      pinnedIds = raw ? JSON.parse(raw) : [];
    } catch {
      pinnedIds = [];
    }

    if (pinnedIds.includes(identity)) {
      pinnedIds = pinnedIds.filter((id) => id !== identity);
    } else {
      pinnedIds.push(identity);
    }

    localStorage.setItem(key, JSON.stringify(pinnedIds));
    this.syncPinnedMenuButtons();
  }

  get visibleHeaders(): TableHeader[] {
    return this.headers || [];
  }

  get allHeadersForChooser(): TableHeader[] {
    return this.headerMaster?.length ? this.headerMaster : (this.headers || []);
  }

  isColumnVisible(header: TableHeader): boolean {
    return !!this.headers?.some((h) => h.prop === header.prop);
  }

  addItem() {
    this.create.emit();
  }

  copyItem() {
    if (this._selectedItems.length > 0) {
      this.copy.emit(this._selectedItems);
    } else {
      this.toastr.warning('Select item to copy');
    }
  }

  viewItem() {
    if (this._selectedItems.length > 0) {
      this.view.emit(this._selectedItems[0]);
    } else {
      this.toastr.warning('Select item to view');
    }
  }

  editItem() {
    if (this.viewMode) {
      this.edit.emit(null);
      return;
    }

    if (this._selectedItems.length > 0) {
      this.edit.emit(this._selectedItems[0]);
    } else {
      this.toastr.warning('Select item to edit');
    }
  }

  deleteItem() {
    if (this._selectedItems.length > 0) {
      this.delete.emit(this._selectedItems);
    } else {
      this.toastr.warning('Select item to delete');
    }
  }

  searchItem() {
    this.searchData.emit(this.searchTerm);
  }

  postData() {
    this.post.emit();
  }

  reverseData() {
    this.reverse.emit();
  }

  undoShipmentData() {
    this.undoshipment.emit();
  }

  goBack() {
    this.back.emit();
  }

  resetPassword() {
    this.resetpassword.emit();
  }

  refreshPage() {
    this.refresh.emit();
    this.closeFloatingMenus();
  }

  exportCsv() {
    this.exportexcel.emit();
    this.closeFloatingMenus();
  }

  exportPdf() {
    this.exportpdf.emit();
    this.closeFloatingMenus();
  }

  emitPrint() {
    this.print.emit();
  }

  customButtonClick(button: CustomButton) {
    this.buttonClickEvent.emit({
      button,
      data: null,
      section: SectionType.List,
    });
  }

  topcustomButtonClick(button: CustomButton) {
    this.buttonClickEvent.emit({
      button,
      data: null,
      section: SectionType.List,
    });
  }

  showSearch() {
    this.showSearchBox = true;
    setTimeout(() => {
      const el = document.getElementById('search') as HTMLInputElement | null;
      el?.focus();
    }, 100);
  }

  toogleInfoEvent() {
    this.showInformationTabs = !this.showInformationTabs;
    this.toogleInfo.emit(this.showInformationTabs);
    this.showCustomFilter = false;
    this.closeFloatingMenus();
  }

  onAdvanceSearch() {
    this.advanceSearch.emit(this.advancedFilter);
  }

  clearAdvanceSearch() {
    this.advancedFilter.searchTerm = '';
    this.advancedFilter.selectedColumn = '';
    this.onAdvanceSearch();
  }

  onSortClick(event?: MouseEvent) {
    event?.stopPropagation();
    this.showSortDropdown = !this.showSortDropdown;
    this.showStatusDropdown = false;
    this.showMoreDropdown = false;
    this.showExportDropdown = false;
    this.showColumnsDropdown = false;
  }

  onStatusClick(event?: MouseEvent) {
    event?.stopPropagation();
    this.showStatusDropdown = !this.showStatusDropdown;
    this.showSortDropdown = false;
    this.showMoreDropdown = false;
    this.showExportDropdown = false;
    this.showColumnsDropdown = false;
  }

  onSelectStatus(option: string) {
    this.showStatusDropdown = false;
  }

  onAddFilterClick() {
    this.showAddFilterPanel = !this.showAddFilterPanel;
  }

  filter() {
    this.showCustomFilter = !this.showCustomFilter;
    this.customfilter.emit(this.showCustomFilter);
    this.showInformationTabs = false;
    this.closeFloatingMenus();

    if (this.showCustomFilter && !this.isFilter) {
      if (this.activeTab) {
        this.activeTab = '';
        this.refresh.emit();
      }

      if (this.selectedSortField) {
        this.selectedSortField = '';
        this.selectedSortIcon = '';
        this.selectedSortDirection = null;
        this.showSortDropdown = false;
        this.activeSubDropdown = null;
        this.refresh.emit();
        this.sortChange.emit();
      }
    }
  }

  onFilterClearAllAct() {
    if (this.activeTab) {
      this.resetStatus();
    }
    if (this.selectedSortField) {
      this.resetSort();
    }
  }

  setActiveTab(tab: string) {
    if (this.groupOption.length > 0) {
      this.activeTab = this.groupOption[0].Value;
    }
    this.activeTab = tab;
    this.groupOptionChange.emit(this.activeTab);
    this.showStatusDropdown = false;
  }

  toggleSubDropdown(field: string) {
    this.activeSubDropdown = this.activeSubDropdown === field ? null : field;
  }

  onSelectSort(field: string, direction: 'asc' | 'desc') {
    this.selectedSortField = field;
    this.selectedSortIcon =
      direction === 'asc' ? 'bi-arrow-up-short' : 'bi-arrow-down-short';
    this.selectedSortDirection = direction;
    this.showSortDropdown = false;
    this.activeSubDropdown = null;

    const sort = `${field}%20${direction}%20`;
    if (this.isFilter) {
      this.sortChange.emit(field);
    } else {
      this.sortChange.emit(sort);
    }
  }

  resetSort() {
    this.selectedSortField = '';
    this.selectedSortIcon = '';
    this.selectedSortDirection = null;
    this.showSortDropdown = false;
    this.activeSubDropdown = null;
    this.refresh.emit();
    this.sortChange.emit();
  }

  resetStatus() {
    this.activeTab = '';
    this.refresh.emit();
  }

  menuClick(btn: any, event?: MouseEvent) {
    event?.stopPropagation();

    if (btn?.isEnable === false) {
      return;
    }

    if (typeof btn?.fn === 'function') {
      btn.fn();
    }

    if (btn?.route) {
      this.router.navigate([btn.route]);
    }

    this.closeFloatingMenus();
  }

  setGridView(nextValue: boolean) {
    if (this.isGridView === nextValue) {
      return;
    }
    this.isGridView = nextValue;
    this.gridView.emit(this.isGridView);
  }

  viewType() {
    this.setGridView(!this.isGridView);
  }

  toggleMoreDropdown(event?: MouseEvent) {
    event?.stopPropagation();
    this.showMoreDropdown = !this.showMoreDropdown;
    this.showExportDropdown = false;
    this.showColumnsDropdown = false;
    this.showSortDropdown = false;
    this.showStatusDropdown = false;
  }

  toggleExportDropdown(event?: MouseEvent) {
    event?.stopPropagation();
    this.showExportDropdown = !this.showExportDropdown;
    this.showMoreDropdown = false;
    this.showColumnsDropdown = false;
    this.showSortDropdown = false;
    this.showStatusDropdown = false;
  }

  toggleColumnsDropdown(event?: MouseEvent) {
    event?.stopPropagation();
    this.showColumnsDropdown = !this.showColumnsDropdown;
    this.showMoreDropdown = false;
    this.showExportDropdown = false;
    this.showSortDropdown = false;
    this.showStatusDropdown = false;
  }

  onToggleColumn(header: TableHeader, event?: Event): void {
    event?.stopPropagation();

    if (!header || header.isPrimaryLink) {
      return;
    }

    const currentIndex = this.headers.findIndex((h) => h.prop === header.prop);

    if (currentIndex > -1) {
      this.headers.splice(currentIndex, 1);
      return;
    }

    const masterIndex = this.headerMaster.findIndex((h) => h.prop === header.prop);

    if (masterIndex === -1) {
      this.headers.push({ ...header });
      return;
    }

    const visibleBeforeInsert = this.headerMaster
      .slice(0, masterIndex)
      .filter((masterHeader) =>
        this.headers.some((visibleHeader) => visibleHeader.prop === masterHeader.prop)
      ).length;

    this.headers.splice(visibleBeforeInsert, 0, { ...this.headerMaster[masterIndex] });
  }

  private hasPermission(pageName?: string): boolean {
    if (this.sessionService.SuperAdmin) {
      return true;
    }

    if (!pageName) {
      return false;
    }

    const permissions = this.sessionService.Permissions || [];
    const normalizedPage = this.normalizePermissionKey(pageName);

    return permissions.some((permission: any) =>
      this.normalizePermissionKey(permission?.ObjectName) === normalizedPage
      // && permission?.ReadPermission === true
    );
  }

  private normalizePermissionKey(value?: string): string {
    return (value || '')
      .trim()
      .replace(/[\s_-]+/g, ' ')
      .toUpperCase();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}