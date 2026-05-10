import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';
import { FILAZ_MENU_MODULES } from './menu-items';
import { ErpMenuItem, ErpMenuModule, ErpPermissionRecord } from './menu.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly activeModuleStorageKey = 'filaz-active-module';
  private readonly recentShortcutStorageKey = 'Recent-Shortcut-Items';
  private readonly modulesSubject = new BehaviorSubject<ErpMenuModule[]>([]);
  private readonly activeModuleKeySubject = new BehaviorSubject<string>(
    localStorage.getItem(this.activeModuleStorageKey) || ''
  );

  readonly modules$ = this.modulesSubject.asObservable();
  readonly activeModuleKey$ = this.activeModuleKeySubject.asObservable();

  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService
  ) {}

  loadForCurrentSession(): Observable<ErpMenuModule[]> {
    if (this.sessionService.SuperAdmin || this.sessionService.UserName.toLowerCase() === 'admin@tecsa.com.my') {
      this.sessionService.SuperAdmin = true;
      this.sessionService.Permissions = [];
      const modules = this.cloneModules(FILAZ_MENU_MODULES);
      this.modulesSubject.next(modules);
      this.ensureActiveModule(modules);
      return this.modules$;
    }

    return this.authService.getRolePermissions(this.sessionService.RoleId).pipe(
      map((response) => this.toPermissionRecords(response)),
      map((permissions) => this.filterModulesByPermissions(FILAZ_MENU_MODULES, permissions)),
      tap((modules) => {
        this.modulesSubject.next(modules);
        this.ensureActiveModule(modules);
      })
    );
  }

  setActiveModule(key: string): void {
    this.activeModuleKeySubject.next(key);
    localStorage.setItem(this.activeModuleStorageKey, key);
  }

  getRecentShortcuts(): ErpMenuItem[] {
    const value = localStorage.getItem(this.recentShortcutStorageKey);

    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed as ErpMenuItem[] : [];
    } catch {
      return [];
    }
  }

  addRecentShortcut(item: ErpMenuItem): void {
    const items = this.getRecentShortcuts()
      .filter((existing) => existing.id !== item.id);

    items.unshift(item);
    localStorage.setItem(this.recentShortcutStorageKey, JSON.stringify(items.slice(0, 5)));
  }

  private filterModulesByPermissions(modules: ErpMenuModule[], permissions: ErpPermissionRecord[]): ErpMenuModule[] {
    const permissionKeys = new Set(
      permissions
        .map((permission) => this.normalizePermissionKey(permission.ObjectName || permission.PageName))
        .filter(Boolean)
    );

    return modules
      .map((module) => ({
        ...module,
        groups: module.groups
          .map((group) => ({
            ...group,
            children: group.children.filter((child) => permissionKeys.has(this.normalizePermissionKey(child.pageKey)))
          }))
          .filter((group) => group.children.length > 0)
      }))
      .filter((module) => module.groups.length > 0);
  }

  private toPermissionRecords(response: unknown): ErpPermissionRecord[] {
    const rows = response && typeof response === 'object' && 'value' in response
      ? (response as Record<string, unknown>)['value']
      : response;

    return Array.isArray(rows) ? rows as ErpPermissionRecord[] : [];
  }

  private cloneModules(modules: ErpMenuModule[]): ErpMenuModule[] {
    return modules.map((module) => ({
      ...module,
      groups: module.groups.map((group) => ({
        ...group,
        children: group.children.map((child) => ({ ...child }))
      }))
    }));
  }

  private ensureActiveModule(modules: ErpMenuModule[]): void {
    if (!modules.length) {
      this.setActiveModule('');
      return;
    }

    const activeKey = this.activeModuleKeySubject.value;
    const exists = modules.some((module) => module.key === activeKey);

    if (!exists) {
      this.setActiveModule(modules[0].key);
    }
  }

  private normalizePermissionKey(value?: string): string {
    return (value || '').trim().replace(/\s+/g, ' ').toUpperCase();
  }
}
