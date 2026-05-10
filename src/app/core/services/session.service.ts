import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

export type ErpPermission = {
  read: boolean;
  insert: boolean;
  modify: boolean;
  post: boolean;
  delete: boolean;
};

export type SessionContext = {
  user?: unknown;
  company?: string;
  companyName?: string;
  responsibilityCenter?: unknown;
  defaultResponsibilityCenter?: unknown;
  responsibilityCenters?: unknown[];
  permissions?: unknown[];
  superAdmin?: boolean;
  showAllResCenters?: boolean;
  showResCenterSelection?: boolean;
  accessToken?: string;
};

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly prefix = 'app-';
  private readonly userDetailsKey = `${this.prefix}user-details`;
  private readonly companyKey = `${this.prefix}comapny`;
  private readonly companyNameKey = `${this.prefix}comapny-name`;
  private readonly responsibilityCenterKey = `${this.prefix}responsibility-center`;
  private readonly defaultResponsibilityCenterKey = `${this.prefix}default-responsibility-center`;
  private readonly responsibilityCentersKey = `${this.prefix}responsibility-centers`;
  private readonly permissionsKey = `${this.prefix}permissions`;
  private readonly superAdminKey = `${this.prefix}super-admin`;
  private readonly showAllResCentersKey = `${this.prefix}show-all-res-centers`;
  private readonly showResCenterSelectionKey = `${this.prefix}show-res-center-selection`;
  private readonly licensePermissionKey = `${this.prefix}licensePermission`;
  private readonly ipKey = `${this.prefix}user-ip`;
  private readonly licenseInfoKey = `${this.prefix}Lisence-details`;
  private readonly userLastLoginKey = `${this.prefix}user-last-login`;
  private readonly openedPopupIdKey = `${this.prefix}opened-popup-id`;
  private readonly accessTokenKey = 'access-token';

  readonly permissionsLoaded$ = new BehaviorSubject<boolean>(false);
  readonly resCenterChanged$ = new Subject<unknown>();
  readonly userProfileChanged$ = new Subject<unknown>();

  constructor(private readonly router: Router) {}

  get User(): unknown {
    return this.readJson(this.userDetailsKey);
  }

  set User(value: unknown) {
    this.writeJson(this.userDetailsKey, value);
    this.userProfileChanged$.next(value);
  }

  get UserDetails(): unknown {
    return this.User;
  }

  set UserDetails(value: unknown) {
    this.User = value;
  }

  get Company(): string {
    return this.readString(this.companyKey);
  }

  set Company(value: string) {
    this.writeString(this.companyKey, value);
  }

  get CompanyName(): string {
    return this.readString(this.companyNameKey);
  }

  set CompanyName(value: string) {
    this.writeString(this.companyNameKey, value);
  }

  get ResponsibilityCenter(): unknown {
    return this.readJson(this.responsibilityCenterKey);
  }

  set ResponsibilityCenter(value: unknown) {
    this.writeJson(this.responsibilityCenterKey, value);
    this.resCenterChanged$.next(value);
  }

  get DefaultResponsibilityCenter(): unknown {
    return this.readJson(this.defaultResponsibilityCenterKey);
  }

  set DefaultResponsibilityCenter(value: unknown) {
    this.writeJson(this.defaultResponsibilityCenterKey, value);
  }

  get ResponsibilityCenters(): unknown[] {
    const value = this.readJson(this.responsibilityCentersKey);
    return Array.isArray(value) ? value : [];
  }

  set ResponsibilityCenters(value: unknown[]) {
    this.writeJson(this.responsibilityCentersKey, value);
  }

  get ResponsibilityCenterId(): string {
    const value = this.ResponsibilityCenter;
    return this.readProperty(value, 'Code') || this.readProperty(value, 'Id') || '';
  }

  get RoleId(): string {
    return this.readProperty(this.User, 'RoleId');
  }

  get UserName(): string {
    return this.readProperty(this.User, 'UserName') || this.readProperty(this.User, 'Name');
  }

  get UserId(): string {
    return this.readProperty(this.User, 'UserId') || this.readProperty(this.User, 'SystemId') || this.readProperty(this.User, 'Id');
  }

  get Email(): string {
    return this.readProperty(this.User, 'Email');
  }

  get Permissions(): unknown[] {
    const value = this.readJson(this.permissionsKey);
    return Array.isArray(value) ? value : [];
  }

  set Permissions(value: unknown[]) {
    this.writeJson(this.permissionsKey, value);
    this.permissionsLoaded$.next(true);
  }

  get SuperAdmin(): boolean {
    return this.readBoolean(this.superAdminKey);
  }

  set SuperAdmin(value: boolean) {
    this.writeBoolean(this.superAdminKey, value);
  }

  get ShowAllResCenters(): boolean {
    return this.readBoolean(this.showAllResCentersKey);
  }

  set ShowAllResCenters(value: boolean) {
    this.writeBoolean(this.showAllResCentersKey, value);
  }

  get ShowResCenterSelection(): boolean {
    return this.readBoolean(this.showResCenterSelectionKey);
  }

  set ShowResCenterSelection(value: boolean) {
    this.writeBoolean(this.showResCenterSelectionKey, value);
  }

  get licensePermission(): boolean {
    return this.readBoolean(this.licensePermissionKey);
  }

  set licensePermission(value: boolean) {
    this.writeBoolean(this.licensePermissionKey, value);
  }

  get IP(): string {
    return this.readString(this.ipKey);
  }

  set IP(value: string) {
    this.writeString(this.ipKey, value);
  }

  get UserLiseceLoginIfo(): unknown {
    return this.readJson(this.licenseInfoKey);
  }

  set UserLiseceLoginIfo(value: unknown) {
    this.writeJson(this.licenseInfoKey, value);
  }

  get UserLastLoginInfo(): unknown {
    return this.readJson(this.userLastLoginKey);
  }

  set UserLastLoginInfo(value: unknown) {
    this.writeJson(this.userLastLoginKey, value);
  }

  get OpenedPopupId(): string {
    return this.readString(this.openedPopupIdKey);
  }

  set OpenedPopupId(value: string) {
    this.writeString(this.openedPopupIdKey, value);
  }

  get AccessToken(): string {
    return this.readString(this.accessTokenKey);
  }

  set AccessToken(value: string) {
    this.writeString(this.accessTokenKey, value);
  }

  applySessionContext(context: SessionContext): void {
    if (context.user !== undefined) {
      this.User = context.user;
    }

    if (context.company !== undefined) {
      this.Company = context.company;
    }

    if (context.companyName !== undefined) {
      this.CompanyName = context.companyName;
    }

    if (context.responsibilityCenter !== undefined) {
      this.ResponsibilityCenter = context.responsibilityCenter;
    }

    if (context.defaultResponsibilityCenter !== undefined) {
      this.DefaultResponsibilityCenter = context.defaultResponsibilityCenter;
    }

    if (context.responsibilityCenters !== undefined) {
      this.ResponsibilityCenters = context.responsibilityCenters;
    }

    if (context.permissions !== undefined) {
      this.Permissions = context.permissions;
    }

    if (context.superAdmin !== undefined) {
      this.SuperAdmin = context.superAdmin;
    }

    if (context.showAllResCenters !== undefined) {
      this.ShowAllResCenters = context.showAllResCenters;
    }

    if (context.showResCenterSelection !== undefined) {
      this.ShowResCenterSelection = context.showResCenterSelection;
    }

    if (context.accessToken !== undefined) {
      this.AccessToken = context.accessToken;
    }
  }

  getPermission(pageName: string): ErpPermission {
    if (this.SuperAdmin) {
      return {
        read: true,
        insert: true,
        modify: true,
        post: true,
        delete: true
      };
    }

    const permission = this.Permissions.find((item) => this.readProperty(item, 'PageName') === pageName);

    return {
      read: this.readPermissionFlag(permission, 'ReadPermission'),
      insert: this.readPermissionFlag(permission, 'InsertPermission'),
      modify: this.readPermissionFlag(permission, 'ModifyPermission'),
      post: this.readPermissionFlag(permission, 'PostPermission'),
      delete: this.readPermissionFlag(permission, 'DeletePermission')
    };
  }

  hasPermission(pageName: string, permission: keyof ErpPermission): boolean {
    return this.getPermission(pageName)[permission];
  }

  isSessionValid(): boolean {
    return Boolean(this.User && this.AccessToken);
  }

  clearSessionData(): void {
    [
      this.userDetailsKey,
      this.companyKey,
      this.companyNameKey,
      this.responsibilityCenterKey,
      this.defaultResponsibilityCenterKey,
      this.responsibilityCentersKey,
      this.permissionsKey,
      this.superAdminKey,
      this.showAllResCentersKey,
      this.showResCenterSelectionKey,
      this.licensePermissionKey,
      this.ipKey,
      this.licenseInfoKey,
      this.userLastLoginKey,
      this.openedPopupIdKey,
      this.accessTokenKey,
      'Recent-Shortcut-Items'
    ].forEach((key) => localStorage.removeItem(key));

    this.permissionsLoaded$.next(false);
  }

  logout(reason = 'logout'): void {
    this.clearSessionData();
    console.warn(`Session cleared: ${reason}`);
    void this.router.navigate(['/auth/login']);
  }

  logoutWithIdleMessage(): void {
    this.logout('idle-timeout');
  }

  prepareIdleExpiry(): void {
    localStorage.setItem(`${this.prefix}idle-expired`, 'true');
  }

  finishIdleExpiryRedirect(): void {
    localStorage.removeItem(`${this.prefix}idle-expired`);
    void this.router.navigate(['/auth/login']);
  }

  notifyUserProfileChanged(): void {
    this.userProfileChanged$.next(this.User);
  }

  private readPermissionFlag(value: unknown, key: string): boolean {
    const flag = this.readProperty(value, key);
    return flag === 'true' || flag === 'Yes' || flag === '1' || flag === 'Full';
  }

  private readProperty(value: unknown, key: string): string {
    if (value && typeof value === 'object' && key in value) {
      const record = value as Record<string, unknown>;
      const property = record[key];
      return property === undefined || property === null ? '' : String(property);
    }

    return '';
  }

  private readJson(key: string): unknown {
    const value = localStorage.getItem(key);

    if (!value) {
      return undefined;
    }

    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }

  private writeJson(key: string, value: unknown): void {
    if (value === undefined || value === null || value === '') {
      localStorage.removeItem(key);
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  }

  private readString(key: string): string {
    return localStorage.getItem(key) ?? '';
  }

  private writeString(key: string, value: string): void {
    if (!value) {
      localStorage.removeItem(key);
      return;
    }

    localStorage.setItem(key, value);
  }

  private readBoolean(key: string): boolean {
    return localStorage.getItem(key) === 'true';
  }

  private writeBoolean(key: string, value: boolean): void {
    localStorage.setItem(key, String(value));
  }
}
