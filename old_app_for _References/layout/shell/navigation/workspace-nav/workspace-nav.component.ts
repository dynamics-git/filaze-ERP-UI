import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuGroup } from '../models/menuGroup';
import { MENU_MODULES, MenuModule } from '../menu-items';
import { SessionService } from '../../../../core/services/session.service';
import { DataTableService } from '../../../../core/services/shared/data-table.service';
import { RestService } from '../../../../core/services/rest.service';
import { ThemeOptions } from '../../../theme-options.model';
import { WorkspaceNavService } from '../workspace-nav.service';

@Component({
  standalone: false,
  selector: 'app-workspace-nav',
  templateUrl: './workspace-nav.component.html',
  styleUrl: './workspace-nav.component.scss',
})
export class WorkspaceNavComponent implements OnInit, OnDestroy {
  public extraParameter: any;

  constructor(
    public globals: ThemeOptions,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private sessionService: SessionService,
    private dataTableService: DataTableService,
    private restService: RestService,
    private workspaceNavService: WorkspaceNavService
  ) {}

  private routeSub?: Subscription;
  private activeModuleSub?: Subscription;
  private compactFlyoutCloseTimer: any = null;

  private newInnerWidth!: number;
  private innerWidth!: number;

  public activeId: string = 'dashboards';
  public menuModules: MenuModule[] = [];
  public activeModuleKey = '';
  public quickAccessMode: 'pinned' | 'recent' = 'pinned';
  public openStates: { [key: string]: boolean } = {};
  public compactFlyoutMenu: MenuGroup | null = null;

  private userRole: any;
  private permissions: any[] = [];
  private permissionKeys = new Set<string>();

  public recentShortcutsItems: any[] = [];
  public workspaceItems: any[] = [];

  get activeModule(): MenuModule | null {
    return (
      this.menuModules.find((module) => module.key === this.activeModuleKey) ||
      this.menuModules[0] ||
      null
    );
  }

  get quickAccessItems(): any[] {
    return this.quickAccessMode === 'pinned'
      ? this.workspaceItems
      : this.recentShortcutsItems;
  }

  get compactFlyoutChildren(): any[] {
    return this.compactFlyoutMenu?.children || [];
  }

  get activeChildTitle(): string {
    const activeModule = this.activeModule;
    if (!activeModule) {
      return '';
    }

    for (const group of activeModule.items) {
      const activeChild = group.children.find((child) => this.isChildActive(child));
      if (activeChild?.title) {
        return activeChild.title;
      }
    }

    return '';
  }

  setQuickAccessMode(mode: 'pinned' | 'recent'): void {
    this.quickAccessMode = mode;
    this.normalizeQuickAccessMode();
  }

  addInShortcut(item: any, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.recentShortcutsItems = JSON.parse(
      localStorage.getItem('Recent-Shortcut-Items') || '[]'
    );

    const exists = this.recentShortcutsItems.some((x: any) =>
      x.id ? x.id === item.id : JSON.stringify(x) === JSON.stringify(item)
    );

    if (!exists) {
      this.recentShortcutsItems.unshift(item);

      if (this.recentShortcutsItems.length > 5) {
        this.recentShortcutsItems = this.recentShortcutsItems.slice(0, 5);
      }

      localStorage.setItem(
        'Recent-Shortcut-Items',
        JSON.stringify(this.recentShortcutsItems)
      );
    }

    this.normalizeQuickAccessMode();
  }

  getPinnedShortcuts() {
    const userId = this.sessionService.UserId;
    const companyId = this.sessionService.Company;

    const filter =
      `portalUserId eq '${userId}' ` +
      `and menuType eq 'Sidebar' ` +
      `and CompanyId eq ${companyId} `;

    this.restService
      .get(`/menuShortcuts?$filter=${encodeURIComponent(filter)}`)
      .subscribe({
        next: (res: any) => {
          const records = res?.value || [];

          this.workspaceItems = records.map((item: any) => ({
            systemId: item.systemId || item.SystemId || item.id || '',
            title: item.itemTitle,
            link: item.link,
            page: item.pageCode,
            icon: item.icon,
            groupTitle: item.groupTitle,
            menuKey: item.menuKey,
            companyId: item.CompanyId,
            portalResponsibilityCentre: item.PortalResponsibilityCentre,
          }));

          this.normalizeQuickAccessMode();
        },
        error: (err) => {
          console.error('Failed to load pinned shortcuts', err);
          this.workspaceItems = [];
          this.normalizeQuickAccessMode();
        },
      });
  }

  togglePin1(item: any, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const idx = this.workspaceItems.findIndex((p) => p.link === item.link);
    if (idx > -1) {
      this.workspaceItems.splice(idx, 1);
    } else {
      this.workspaceItems.push(item);
    }

    localStorage.setItem('workspace-pins', JSON.stringify(this.workspaceItems));
    this.normalizeQuickAccessMode();
  }

  togglePin(module: any, menuItem: any, child: any, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const existing = this.workspaceItems.find((p: any) => p.link === child.link);

    if (existing?.systemId) {
      this.unpinShortcut(existing, event);
    } else {
      this.pinShortcut(module, child);
    }
  }

  pinShortcut(module: any, child: any) {
    const menuItem = module?.items?.find((item: any) =>
      item?.children?.some((c: any) =>
        (c?.link && c.link === child?.link) ||
        (c?.page && c.page === child?.page) ||
        (c?.title && c.title === child?.title)
      )
    );

    const payload = {
      portalUserId: this.sessionService.UserId,
      menuType: 'Sidebar',
      menuKey: module?.key || '',
      groupTitle: menuItem?.title || '',
      itemTitle: child?.title || '',
      link: child?.link || '',
      pageCode: child?.page || child?.action || '',
      icon: menuItem?.icon || '',
      CreatedBy: this.sessionService.UserId,
      UserId: this.sessionService.UserId,
      Company: this.sessionService.CompanyName,
      CompanyId: this.sessionService.Company,
      PortalResponsibilityCentre:
        this.sessionService.ResponsibilityCenter?.PortalResponsibilityCentre,
    };

    this.restService.post('/menuShortcuts', payload).subscribe({
      next: () => {
        this.getPinnedShortcuts();
      },
      error: (err) => {
        console.error('Failed to pin shortcut', err);
      },
    });
  }

  unpinShortcut(item: any, event?: Event) {
    const systemId = item?.systemId;
    const link = item?.link;

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!systemId) {
      console.error('systemId missing for pinned item', item);
      return;
    }

    this.restService.delete(`/menuShortcuts(${systemId})`).subscribe({
      next: () => {
        this.workspaceItems = this.workspaceItems.filter((x: any) => x.link !== link);
        this.normalizeQuickAccessMode();
        this.getPinnedShortcuts();
      },
      error: (err) => {
        console.error('Failed to unpin shortcut', err);
      },
    });
  }

  removePin(item: any, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.workspaceItems = JSON.parse(
      localStorage.getItem('workspace-pins') || '[]'
    );

    const idx = this.workspaceItems.findIndex((p: any) => p.link === item.link);
    if (idx > -1) {
      this.workspaceItems.splice(idx, 1);
      localStorage.setItem('workspace-pins', JSON.stringify(this.workspaceItems));
    }

    this.normalizeQuickAccessMode();
  }

  isPinned(item: any): boolean {
    return this.workspaceItems.some((p) => p.link === item.link);
  }

  selectModule(module: MenuModule): void {
    this.activeModuleKey = module.key;
    this.workspaceNavService.setActiveModule(module.key);
    this.primeOpenStateForModule(module);
    this.primeCompactFlyout();
  }

  toggleMenu(module: MenuModule, menuItem: MenuGroup): void {
    const stateKey = this.getStateKey(module, menuItem);
    const nextState = !this.openStates[stateKey];

    this.closeModuleMenus(module);

    this.openStates[stateKey] = nextState;
  }

  isMenuOpen(module: MenuModule, menuItem: MenuGroup): boolean {
    return !!this.openStates[this.getStateKey(module, menuItem)];
  }

  isGroupActive(menuItem: MenuGroup): boolean {
    return menuItem.children.some((child) => this.isChildActive(child));
  }

  isChildActive(child: any): boolean {
    return !!child?.link && this.urlMatches(this.router.url, child.link);
  }

  isCompactFlyoutOpen(menuItem: MenuGroup): boolean {
    return this.compactFlyoutMenu?.title === menuItem.title;
  }

  openCompactFlyout(menuItem: MenuGroup): void {
    if (!this.globals.toggleSidebar) {
      return;
    }

    this.cancelCompactFlyoutClose();
    this.compactFlyoutMenu = menuItem;
  }

  toggleCompactFlyout(menuItem: MenuGroup, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.globals.toggleSidebar) {
      return;
    }

    if (this.isCompactFlyoutOpen(menuItem)) {
      this.closeCompactFlyout();
    } else {
      this.openCompactFlyout(menuItem);
    }
  }

  scheduleCompactFlyoutClose(): void {
    this.cancelCompactFlyoutClose();
    this.compactFlyoutCloseTimer = setTimeout(() => {
      this.compactFlyoutMenu = null;
    }, 120);
  }

  cancelCompactFlyoutClose(): void {
    if (this.compactFlyoutCloseTimer) {
      clearTimeout(this.compactFlyoutCloseTimer);
      this.compactFlyoutCloseTimer = null;
    }
  }

  closeCompactFlyout(): void {
    this.cancelCompactFlyoutClose();
    this.compactFlyoutMenu = null;
  }

  getModuleDisplayTitle(title: string): string {
    return (title || '').trim();
  }

  getModuleInitial(title: string): string {
    const label = (title || '').trim();
    const parts = label.split(/\s+/).filter(Boolean);

    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  ngOnInit() {
    setTimeout(() => {
      this.innerWidth = window.innerWidth;
      if (this.innerWidth < 1200) {
        this.globals.toggleSidebar = true;
      }
    });

    const recentItems = localStorage.getItem('Recent-Shortcut-Items');
    if (recentItems) {
      this.recentShortcutsItems = JSON.parse(recentItems);
    }

    this.normalizeQuickAccessMode();

    this.extraParameter =
      this.activatedRoute?.snapshot?.firstChild?.routeConfig?.path ?? '';

    this.routeSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.syncActiveModuleWithRoute();
      }
    });
    this.activeModuleSub = this.workspaceNavService.activeModuleKey$.subscribe((key) => {
      if (!this.menuModules.length) {
        return;
      }

      const targetModule = this.menuModules.find((module) => module.key === key);
      if (targetModule && this.activeModuleKey !== targetModule.key) {
        this.activeModuleKey = targetModule.key;
        this.primeOpenStateForModule(targetModule);
        this.primeCompactFlyout();
      }
    });
    this.getPinnedShortcuts();
    if (this.sessionService.UserName === 'admin@tecsa.com.my') {
      this.applyAllMenuModules();
      this.sessionService.SuperAdmin = true;
      this.sessionService.permissionsLoaded$.next();
    } else {
      this.getUserRoleDetails();
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.activeModuleSub?.unsubscribe();
    this.cancelCompactFlyoutClose();
  }

  private normalizeQuickAccessMode(): void {
    if (
      this.quickAccessMode === 'pinned' &&
      !this.workspaceItems.length &&
      this.recentShortcutsItems.length
    ) {
      this.quickAccessMode = 'recent';
    }

    if (
      this.quickAccessMode === 'recent' &&
      !this.recentShortcutsItems.length &&
      this.workspaceItems.length
    ) {
      this.quickAccessMode = 'pinned';
    }
  }

  private getStateKey(module: MenuModule, menuItem: MenuGroup): string {
    return `${module.key}::${menuItem.title}`;
  }

  private getPreferredMenuForModule(module: MenuModule | null): MenuGroup | null {
    if (!module?.items?.length) {
      return null;
    }

    return module.items.find(
      (item) => this.openStates[this.getStateKey(module, item)]
    ) || null;
  }

  private primeOpenStateForModule(module: MenuModule): void {
    this.closeModuleMenus(module);
  }

  private closeModuleMenus(module: MenuModule | null): void {
    module?.items?.forEach((item) => {
      this.openStates[this.getStateKey(module, item)] = false;
    });
  }

  private closeAllMenus(): void {
    this.menuModules.forEach((module) => this.closeModuleMenus(module));
    this.closeCompactFlyout();
  }

  private primeCompactFlyout(): void {
    if (!this.globals.toggleSidebar) {
      this.compactFlyoutMenu = null;
      return;
    }

    this.compactFlyoutMenu = this.getPreferredMenuForModule(this.activeModule);
  }

  private syncActiveModuleWithRoute(): void {
    if (!this.menuModules.length) {
      this.activeModuleKey = '';
      this.compactFlyoutMenu = null;
      return;
    }

    const matchedModule = this.menuModules.find((module) =>
      module.items.some((item) =>
        item.children.some(
          (child) => !!child?.link && this.urlMatches(this.router.url, child.link)
        )
      )
    );

    const savedKey = this.workspaceNavService.loadSavedActiveModule();
    const savedModule = this.menuModules.find((module) => module.key === savedKey);

    const targetModule = matchedModule || savedModule || this.menuModules[0];

    this.activeModuleKey = targetModule.key;
    this.workspaceNavService.setActiveModule(targetModule.key);
    this.closeAllMenus();
  }

  private normalizeUrl(url: string): string {
    if (!url) {
      return '';
    }

    const clean = url.split('?')[0].replace(/\/+$/, '');
    return clean.startsWith('/') ? clean : `/${clean}`;
  }

  private urlMatches(currentUrl: string, targetUrl?: string): boolean {
    if (!targetUrl) {
      return false;
    }

    const current = this.normalizeUrl(currentUrl);
    const target = this.normalizeUrl(targetUrl);

    if (!current || !target) {
      return false;
    }

    return current === target || current.startsWith(`${target}/`);
  }

  private setMenuModules(modules: MenuModule[]): void {
    this.menuModules = modules;
    this.syncActiveModuleWithRoute();
  }

  private applyAllMenuModules(): void {
    this.setMenuModules(
      MENU_MODULES.map((module) => ({
        ...module,
        items: [...module.items],
      }))
    );
  }

  private applyMenuModulesByPermission(): void {
    this.setMenuModules(
      MENU_MODULES.map((module) => ({
        ...module,
        items: this.filterMenuGroupsByPermission(module.items),
      })).filter((module) => module.items.length > 0)
    );
  }

  private filterMenuGroupsByPermission(items: MenuGroup[]): MenuGroup[] {
    return items
      .map((item) => {
        const children = item.children.filter((child) =>
          this.hasPermission(child.page)
        );

        return {
          title: item.title,
          icon: item.icon,
          children,
        };
      })
      .filter((item) => item.children.length > 0);
  }

  private normalizePermissionKey(value?: string): string {
    return (value || '')
      .trim()
      .replace(/[\s_-]+/g, ' ')
      .toUpperCase();
  }

  private rebuildPermissionKeys(): void {
    this.permissionKeys = new Set(
      this.permissions
        .map((permission) => this.normalizePermissionKey(permission?.ObjectName))
        .filter(Boolean)
    );
  }

  private hasPermission(pageName: string): boolean {
    return this.permissionKeys.has(this.normalizePermissionKey(pageName));
  }

  getUserRoleDetails() {
    const roleId = this.sessionService.User.RoleId;

    this.restService
      .get("/portalUsersRoles?$filter=RoleId eq '" + roleId + "'")
      .subscribe((response: any) => {
        if (response && response.value.length > 0) {
          this.userRole = response.value[0];

          if (this.userRole.IsSuperAdmin) {
            this.applyAllMenuModules();
            this.sessionService.SuperAdmin = true;
            this.sessionService.permissionsLoaded$.next();
          } else {
            this.getRolePermissions(roleId);
          }
        } else {
          this.permissions = [];
          this.sessionService.Permissions = [];
          this.rebuildPermissionKeys();
          this.applyMenuModulesByPermission();
          this.sessionService.permissionsLoaded$.next();
        }
      });
  }

  getRolePermissions(roleId: string) {
    this.restService
      .get("/portalPermissions?$filter=RoleId eq '" + roleId + "'")
      .subscribe({
        next: (response: any) => {
          this.permissions = response?.value ?? [];
          this.sessionService.Permissions = this.permissions;
          this.rebuildPermissionKeys();
          this.applyMenuModulesByPermission();
          this.sessionService.permissionsLoaded$.next();
        },
        error: () => {
          this.permissions = [];
          this.sessionService.Permissions = [];
          this.rebuildPermissionKeys();
          this.applyMenuModulesByPermission();
          this.sessionService.permissionsLoaded$.next();
        },
      });
  }

  navigativeUrl1(url: string) {
    this.router.navigate([url]);
  }

  navigativeUrl(item: any, event: Event) {
    if (item.action && this.actionMap[item.action]) {
      event.preventDefault();
      this.closeAllMenus();
      this.actionMap[item.action]();
    } else if (item.link) {
      this.addInShortcut(item);
      this.closeAllMenus();
      this.navigativeUrl1(item.link);
    }
  }

  trackByModuleKey(index: number, module: MenuModule): string {
    return module.key;
  }

  trackByMenuTitle(index: number, menuItem: MenuGroup): string {
    return menuItem.title;
  }

  trackByChild(index: number, child: any): string {
    return child.page || child.title || index.toString();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.newInnerWidth = event.target.innerWidth;
    if (this.newInnerWidth < 1200) {
      this.globals.toggleSidebar = true;
      this.primeCompactFlyout();
    } else {
      this.globals.toggleSidebar = false;
      this.closeCompactFlyout();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    if (target.closest('.app-workspace-nav')) {
      return;
    }

    this.closeAllMenus();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeAllMenus();
  }

  private actionMap: { [key: string]: () => void } = {
    portalSetup: () => this.routePortalSetupPage(),
    claimSetup: () => this.routeClaimSetupPage(),
  };

  routePortalSetupPage() {
    this.restService.get('/portalSetups').subscribe({
      next: (response: any) => {
        const firstId = response?.value?.[0]?.systemId;
        if (firstId) {
          this.router.navigate(['users/portalSetup', firstId]);
        } else {
          console.log('Unable to find the item');
        }
      },
      error: () => {
        console.log('Unable to find the item');
      },
    });
  }

  routeClaimSetupPage() {
    this.restService.get('/empClaimSetups').subscribe({
      next: (response: any) => {
        const firstId = response?.value?.[0]?.systemId;
        if (firstId) {
          this.router.navigate(['claim/employeeclaimsetup', firstId]);
        } else {
          console.log('Unable to find the item');
        }
      },
      error: () => {
        console.log('Unable to find the item');
      },
    });
  }
}
