// import { HttpClient } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Router } from '@angular/router';
// import { CookieService } from 'ngx-cookie-service';
// import { ToastrService } from 'ngx-toastr';
// import { Subject } from 'rxjs';
// import { environment } from '../../../environments/environment';
// import { IdleLogoutModalComponent } from '../../shared/components/idle-logout-modal/idle-logout-modal.component';
// import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// type LogoutReason = 'expired' | 'manual' | 'unauthorized' | 'idle' | 'license';

// @Injectable({
//     providedIn: 'root'
// })
// export class SessionService {
//     private _sessionTime = environment.sessionTimeout * 60;
//     private apiUrl: string = environment.api;

//     public permissionsLoaded$ = new Subject<void>();
//     public resCenterChanged$ = new Subject<boolean>();

//     private permissions: any[] = [];
//     private isLoggingOut = false;

//     private readonly STORAGE_KEYS = {
//         user: 'cenergi-user-details',
//         company: 'cenergi-comapny',
//         companyName: 'cenergi-comapny-name',
//         responsibilityCenter: 'cenergi-responsibility-center',
//         defaultResponsibilityCenter: 'cenergi-default-responsibility-center',
//         responsibilityCenters: 'cenergi-responsibility-centers',
//         superAdmin: 'cenergi-super-admin',
//         showAllResCenters: 'cenergi-show-all-res-centers',
//         showResCenterSelection: 'cenergi-show-res-center-selection',
//         licensePermission: 'cenergi-licensePermission',
//         ip: 'cenergi-user-ip',
//         licenseDetails: 'cenergi-Lisence-details',
//         userLastLogin: 'cenergi-user-last-login',
//         openedPopupId: 'cenergi-opened-popup-id',
//         accessToken: 'access-token'
//     };

//     constructor(
//         private cookie: CookieService,
//         private router: Router,
//         private httpclient: HttpClient,
//         private toastr: ToastrService,
//         private modal: NgbModal
//     ) { }

//     private readStorage<T>(key: string, fallback: T): T {
//         try {
//             const raw = localStorage.getItem(key);
//             return raw ? JSON.parse(raw) : fallback;
//         } catch {
//             return fallback;
//         }
//     }

//     private writeStorage(key: string, value: any): void {
//         localStorage.setItem(key, JSON.stringify(value));
//     }

//     private removeStorage(key: string): void {
//         localStorage.removeItem(key);
//     }

//     private get loginRoute(): string {
//         return '/auth/login';
//     }

//     public get User(): any {
//         return this.readStorage(this.STORAGE_KEYS.user, null);
//     }

//     public set User(v: any) {
//         this._sessionTime = environment.sessionTimeout * 60;

//         if (v === null || v === undefined) {
//             this.removeStorage(this.STORAGE_KEYS.user);
//             return;
//         }

//         this.writeStorage(this.STORAGE_KEYS.user, v);
//     }

//     public get Company(): any {
//         return this.readStorage(this.STORAGE_KEYS.company, null);
//     }

//     public set Company(v: any) {
//         if (v === null || v === undefined) {
//             this.removeStorage(this.STORAGE_KEYS.company);
//             return;
//         }

//         this.writeStorage(this.STORAGE_KEYS.company, v);
//     }

//     public get CompanyName(): any {
//         return this.readStorage(this.STORAGE_KEYS.companyName, null);
//     }

//     public set CompanyName(v: any) {
//         if (v === null || v === undefined) {
//             this.removeStorage(this.STORAGE_KEYS.companyName);
//             return;
//         }

//         this.writeStorage(this.STORAGE_KEYS.companyName, v);
//     }

//     public get ResponsibilityCenter(): any {
//         return this.readStorage(this.STORAGE_KEYS.responsibilityCenter, null);
//     }

//     public set ResponsibilityCenter(v: any) {
//         if (v === null || v === undefined) {
//             this.removeStorage(this.STORAGE_KEYS.responsibilityCenter);
//             return;
//         }

//         this.writeStorage(this.STORAGE_KEYS.responsibilityCenter, v);
//     }

//     public get DefaultResponsibilityCenter(): any {
//         return this.readStorage(this.STORAGE_KEYS.defaultResponsibilityCenter, null);
//     }

//     public set DefaultResponsibilityCenter(v: any) {
//         if (v === null || v === undefined) {
//             this.removeStorage(this.STORAGE_KEYS.defaultResponsibilityCenter);
//             return;
//         }

//         this.writeStorage(this.STORAGE_KEYS.defaultResponsibilityCenter, v);
//     }

//     public get ResponsibilityCenters(): any[] {
//         return this.readStorage(this.STORAGE_KEYS.responsibilityCenters, []);
//     }

//     public set ResponsibilityCenters(v: any[]) {
//         if (!Array.isArray(v)) {
//             this.removeStorage(this.STORAGE_KEYS.responsibilityCenters);
//             return;
//         }

//         this.writeStorage(this.STORAGE_KEYS.responsibilityCenters, v);
//     }

//     public get ResponsibilityCenterId(): string | null {
//         return this.ResponsibilityCenter?.PortalResponsibilityCentre ?? null;
//     }

//     public get UserDetails(): any {
//         return this.User;
//     }

//     public get RoleId(): string | null {
//         return this.UserDetails?.RoleId ?? null;
//     }

//     public reduceSessionTime(): void {
//         if (this._sessionTime > 0) {
//             this._sessionTime--;
//         }
//     }

//     public get UserName(): string {
//         return this.User?.UserName ? String(this.User.UserName).toLowerCase() : '';
//     }

//     public get UserId(): string {
//         return this.User?.UserId ?? '';
//     }

//     public get Email(): string {
//         return this.User?.Email ?? '';
//     }

//     public get Permissions(): any[] {
//         return this.permissions;
//     }

//     public set Permissions(v: any[]) {
//         this.permissions = Array.isArray(v) ? v : [];
//     }

//     public get SuperAdmin(): boolean {
//         return this.readStorage(this.STORAGE_KEYS.superAdmin, false);
//     }

//     public set SuperAdmin(v: boolean) {
//         this.writeStorage(this.STORAGE_KEYS.superAdmin, !!v);
//     }

//     public get ShowAllResCenters(): boolean {
//         return this.readStorage(this.STORAGE_KEYS.showAllResCenters, false);
//     }

//     public set ShowAllResCenters(v: boolean) {
//         this.writeStorage(this.STORAGE_KEYS.showAllResCenters, !!v);
//     }

//     public get ShowResCenterSelection(): boolean {
//         return this.readStorage(this.STORAGE_KEYS.showResCenterSelection, false);
//     }

//     public set ShowResCenterSelection(v: boolean) {
//         this.writeStorage(this.STORAGE_KEYS.showResCenterSelection, !!v);
//     }

//     public get licensePermission(): boolean {
//         return this.readStorage(this.STORAGE_KEYS.licensePermission, false);
//     }

//     public set licensePermission(v: boolean) {
//         this.writeStorage(this.STORAGE_KEYS.licensePermission, !!v);
//     }

//     public get IP(): any {
//         return this.readStorage(this.STORAGE_KEYS.ip, null);
//     }

//     public set IP(v: any) {
//         if (v === null || v === undefined) {
//             this.removeStorage(this.STORAGE_KEYS.ip);
//             return;
//         }

//         this.writeStorage(this.STORAGE_KEYS.ip, v);
//     }

//     public get UserLiseceLoginIfo(): any {
//         return this.readStorage(this.STORAGE_KEYS.licenseDetails, null);
//     }

//     public set UserLiseceLoginIfo(v: any) {
//         if (v === null || v === undefined) {
//             this.removeStorage(this.STORAGE_KEYS.licenseDetails);
//             return;
//         }

//         this.writeStorage(this.STORAGE_KEYS.licenseDetails, v);
//     }

//     public get UserLastLoginInfo(): any {
//         return this.readStorage(this.STORAGE_KEYS.userLastLogin, null);
//     }

//     public set UserLastLoginInfo(v: any) {
//         if (v === null || v === undefined) {
//             this.removeStorage(this.STORAGE_KEYS.userLastLogin);
//             return;
//         }

//         this.writeStorage(this.STORAGE_KEYS.userLastLogin, v);
//     }

//     public getPermission(pageName: string) {
//         if (this.SuperAdmin) {
//             return {
//                 read: true,
//                 create: true,
//                 edit: true,
//                 post: true,
//                 delete: true
//             };
//         }

//         const permission = this.permissions.find((p) => p.ObjectName === pageName);

//         if (permission) {
//             return {
//                 read: permission.ReadPermission,
//                 create: permission.InsertPermission,
//                 edit: permission.ModifyPermission,
//                 post: permission.PostPermission,
//                 delete: permission.DeletePermission
//             };
//         }

//         return {
//             read: false,
//             create: false,
//             edit: false,
//             post: false,
//             delete: false
//         };
//     }

//     public set OpenedPopupId(v: string) {
//         if (!v) {
//             this.removeStorage(this.STORAGE_KEYS.openedPopupId);
//             return;
//         }

//         this.writeStorage(this.STORAGE_KEYS.openedPopupId, v);
//     }

//     public get OpenedPopupId(): string {
//         return this.readStorage(this.STORAGE_KEYS.openedPopupId, '');
//     }

//     public isSessionValid(): boolean {
//         return !!this.User && !!localStorage.getItem(this.STORAGE_KEYS.accessToken);
//     }

//     public clearSessionData(): void {
//         Object.values(this.STORAGE_KEYS).forEach((key) => {
//             localStorage.removeItem(key);
//         });

//         this.permissions = [];
//         this.cookie.deleteAll('/');
//     }

//     public logout(reason: LogoutReason = 'manual'): void {
//         if (this.isLoggingOut) {
//             return;
//         }

//         this.isLoggingOut = true;

//         try {
//             this.clearSessionData();

//             if (reason === 'expired') {
//                 this.toastr.warning(
//                     'Your session has expired. Please login again.',
//                     'Session Expired'
//                 );
//             } else if (reason === 'unauthorized') {
//                 this.toastr.error(
//                     'You are not authorized. Please login again.',
//                     'Unauthorized'
//                 );
//             } else if (reason === 'license') {
//                 this.toastr.error(
//                     'Your login permission is no longer valid. Please login again.',
//                     'Access Removed'
//                 );
//             }

//             this.router.navigateByUrl(this.loginRoute).finally(() => {
//                 this.isLoggingOut = false;
//             });
//         } catch {
//             this.isLoggingOut = false;
//             this.router.navigateByUrl(this.loginRoute);
//         }
//     }

//     //   public logoutWithIdleMessage(): void {
//     //     if (this.isLoggingOut) {
//     //       return;
//     //     }

//     //     this.isLoggingOut = true;
//     //     this.clearSessionData();

//     //     const modalRef = this.modal.open(IdleLogoutModalComponent, {
//     //       backdrop: 'static',
//     //       keyboard: false
//     //     });

//     //     modalRef.result.finally(() => {
//     //       this.router.navigateByUrl(this.loginRoute).finally(() => {
//     //         this.isLoggingOut = false;
//     //       });
//     //     });
//     //   }

//     public logoutWithIdleMessage(): void {
//         this.prepareIdleExpiry();
//         this.finishIdleExpiryRedirect();
//     }

//     public prepareIdleExpiry(): void {
//         if (this.isLoggingOut) {
//             return;
//         }

//         this.isLoggingOut = true;
//         this.clearSessionData();
//     }

//     public finishIdleExpiryRedirect(): void {
//         this.router.navigateByUrl(this.loginRoute).finally(() => {
//             this.isLoggingOut = false;
//         });
//     }
// }


//The break happened because the current session service serializes everything with JSON.stringify(...), 
// and the login flow is storing the selected responsibility center as the full object result[0], 
// not a plain code/value. That is why your storage changed shape




import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

type LogoutReason = 'expired' | 'manual' | 'unauthorized' | 'idle' | 'license';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private _sessionTime = environment.sessionTimeout * 60;

  public permissionsLoaded$ = new Subject<void>();
  public resCenterChanged$ = new Subject<boolean>();
  public userProfileChanged$ = new Subject<void>();

  private permissions: any[] = [];
  private isLoggingOut = false;

  private readonly STORAGE_KEYS = {
    user: 'app-user-details',
    company: 'app-comapny',
    companyName: 'app-comapny-name',
    responsibilityCenter: 'app-responsibility-center',
    defaultResponsibilityCenter: 'app-default-responsibility-center',
    responsibilityCenters: 'app-responsibility-centers',
    superAdmin: 'app-super-admin',
    showAllResCenters: 'app-show-all-res-centers',
    showResCenterSelection: 'app-show-res-center-selection',
    licensePermission: 'app-licensePermission',
    ip: 'app-user-ip',
    licenseDetails: 'app-Lisence-details',
    userLastLogin: 'app-user-last-login',
    openedPopupId: 'app-opened-popup-id',
    accessToken: 'access-token',
    recentShortcutItems: 'Recent-Shortcut-Items',
  };

  constructor(
    private cookie: CookieService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  private get loginRoute(): string {
    return '/auth/login';
  }

  private readRaw(key: string): string | null {
    return localStorage.getItem(key);
  }

  private removeStorage(key: string): void {
    localStorage.removeItem(key);
  }

  private writePlainStorage(key: string, value: any): void {
    if (value === null || value === undefined || value === '') {
      this.removeStorage(key);
      return;
    }

    localStorage.setItem(key, String(value));
  }

  private readPlainStorage<T>(key: string, fallback: T): T {
    const raw = this.readRaw(key);

    if (raw === null || raw === undefined || raw === '') {
      return fallback;
    }

    return raw as unknown as T;
  }

  private writeJsonStorage(key: string, value: any): void {
    if (value === null || value === undefined) {
      this.removeStorage(key);
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  }

  private readJsonStorage<T>(key: string, fallback: T): T {
    try {
      const raw = this.readRaw(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  private parsePossiblyJson(raw: string | null): any {
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  private extractResponsibilityCenterCode(value: any): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value.trim() || null;
    }

    if (typeof value === 'object') {
      return (
        value.PortalResponsibilityCentre ||
        value.ResponsibilityCentre ||
        value.ResponsibilityCenter ||
        value.Code ||
        value.code ||
        value.Id ||
        value.id ||
        null
      );
    }

    return null;
  }

  private resolveResponsibilityCenterObject(code: string | null): any {
    if (!code) {
      return null;
    }

    const list = this.ResponsibilityCenters || [];

    const match = list.find((item: any) => {
      const itemCode = this.extractResponsibilityCenterCode(item);
      return itemCode === code;
    });

    return match || code;
  }

  public get User(): any {
    return this.readJsonStorage(this.STORAGE_KEYS.user, null);
  }

  public set User(v: any) {
    this._sessionTime = environment.sessionTimeout * 60;

    if (v === null || v === undefined) {
      this.removeStorage(this.STORAGE_KEYS.user);
      return;
    }

    this.writeJsonStorage(this.STORAGE_KEYS.user, v);
  }

  public get Company(): string | null {
    const parsed = this.parsePossiblyJson(this.readRaw(this.STORAGE_KEYS.company));
    if (parsed === null || parsed === undefined || parsed === '') {
      return null;
    }

    if (typeof parsed === 'object') {
      const normalized = parsed.id || parsed.Id || parsed.value || parsed.Code || '';
      if (normalized) {
        this.writePlainStorage(this.STORAGE_KEYS.company, normalized);
        return String(normalized);
      }
    }

    return String(parsed);
  }

  public set Company(v: any) {
    if (v === null || v === undefined || v === '') {
      this.removeStorage(this.STORAGE_KEYS.company);
      return;
    }

    const normalized =
      typeof v === 'object' ? v.id || v.Id || v.value || v.Code || '' : v;

    this.writePlainStorage(this.STORAGE_KEYS.company, normalized);
  }

  public get CompanyName(): string | null {
    const parsed = this.parsePossiblyJson(this.readRaw(this.STORAGE_KEYS.companyName));
    if (parsed === null || parsed === undefined || parsed === '') {
      return null;
    }

    return typeof parsed === 'object' ? String(parsed.name || parsed.Name || '') : String(parsed);
  }

  public set CompanyName(v: any) {
    if (v === null || v === undefined || v === '') {
      this.removeStorage(this.STORAGE_KEYS.companyName);
      return;
    }

    const normalized = typeof v === 'object' ? v.name || v.Name || '' : v;
    this.writePlainStorage(this.STORAGE_KEYS.companyName, normalized);
  }

  public get ResponsibilityCenter(): any {
    const parsed = this.parsePossiblyJson(this.readRaw(this.STORAGE_KEYS.responsibilityCenter));
    const code = this.extractResponsibilityCenterCode(parsed);

    if (!code) {
      return null;
    }

    // migrate old object/json storage to plain code
    this.writePlainStorage(this.STORAGE_KEYS.responsibilityCenter, code);
    // return this.resolveResponsibilityCenterObject(code);
    return { PortalResponsibilityCentre: code };
  }

  public set ResponsibilityCenter(v: any) {
    const code = this.extractResponsibilityCenterCode(v);

    if (!code) {
      this.removeStorage(this.STORAGE_KEYS.responsibilityCenter);
      return;
    }

    this.writePlainStorage(this.STORAGE_KEYS.responsibilityCenter, code);
  }

  public get DefaultResponsibilityCenter(): string | null {
    const parsed = this.parsePossiblyJson(
      this.readRaw(this.STORAGE_KEYS.defaultResponsibilityCenter)
    );
    const code = this.extractResponsibilityCenterCode(parsed);

    if (!code) {
      return null;
    }

    // migrate old object/json storage to plain code
    this.writePlainStorage(this.STORAGE_KEYS.defaultResponsibilityCenter, code);
    return code;
  }

  public set DefaultResponsibilityCenter(v: any) {
    const code = this.extractResponsibilityCenterCode(v);

    if (!code) {
      this.removeStorage(this.STORAGE_KEYS.defaultResponsibilityCenter);
      return;
    }

    this.writePlainStorage(this.STORAGE_KEYS.defaultResponsibilityCenter, code);
  }

  public get ResponsibilityCenters(): any[] {
    return this.readJsonStorage(this.STORAGE_KEYS.responsibilityCenters, []);
  }

  public set ResponsibilityCenters(v: any[]) {
    if (!Array.isArray(v)) {
      this.removeStorage(this.STORAGE_KEYS.responsibilityCenters);
      return;
    }

    this.writeJsonStorage(this.STORAGE_KEYS.responsibilityCenters, v);
  }

  public get ResponsibilityCenterId(): string | null {
    return this.extractResponsibilityCenterCode(this.ResponsibilityCenter);
  }

  public get UserDetails(): any {
    return this.User;
  }

  public get RoleId(): string | null {
    return this.UserDetails?.RoleId ?? null;
  }

  public reduceSessionTime(): void {
    if (this._sessionTime > 0) {
      this._sessionTime--;
    }
  }

  public get UserName(): string {
    return this.User?.UserName ? String(this.User.UserName).toLowerCase() : '';
  }

  public get UserId(): string {
    return this.User?.UserId ?? '';
  }

  public get Email(): string {
    return this.User?.Email ?? '';
  }

  public get Permissions(): any[] {
    return this.permissions;
  }

  public set Permissions(v: any[]) {
    this.permissions = Array.isArray(v) ? v : [];
  }

  public get SuperAdmin(): boolean {
    return this.readJsonStorage(this.STORAGE_KEYS.superAdmin, false);
  }

  public set SuperAdmin(v: boolean) {
    this.writeJsonStorage(this.STORAGE_KEYS.superAdmin, !!v);
  }

  public get ShowAllResCenters(): boolean {
    return this.readJsonStorage(this.STORAGE_KEYS.showAllResCenters, false);
  }

  public set ShowAllResCenters(v: boolean) {
    this.writeJsonStorage(this.STORAGE_KEYS.showAllResCenters, !!v);
  }

  public get ShowResCenterSelection(): boolean {
    return this.readJsonStorage(this.STORAGE_KEYS.showResCenterSelection, false);
  }

  public set ShowResCenterSelection(v: boolean) {
    this.writeJsonStorage(this.STORAGE_KEYS.showResCenterSelection, !!v);
  }

  public get licensePermission(): boolean {
    return this.readJsonStorage(this.STORAGE_KEYS.licensePermission, false);
  }

  public set licensePermission(v: boolean) {
    this.writeJsonStorage(this.STORAGE_KEYS.licensePermission, !!v);
  }

  public get IP(): string | null {
    const parsed = this.parsePossiblyJson(this.readRaw(this.STORAGE_KEYS.ip));
    if (parsed === null || parsed === undefined || parsed === '') {
      return null;
    }

    return String(parsed);
  }

  public set IP(v: any) {
    if (v === null || v === undefined || v === '') {
      this.removeStorage(this.STORAGE_KEYS.ip);
      return;
    }

    this.writePlainStorage(this.STORAGE_KEYS.ip, v);
  }

  public get UserLiseceLoginIfo(): any {
    return this.readJsonStorage(this.STORAGE_KEYS.licenseDetails, null);
  }

  public set UserLiseceLoginIfo(v: any) {
    if (v === null || v === undefined) {
      this.removeStorage(this.STORAGE_KEYS.licenseDetails);
      return;
    }

    this.writeJsonStorage(this.STORAGE_KEYS.licenseDetails, v);
  }

  public get UserLastLoginInfo(): string | null {
    const parsed = this.parsePossiblyJson(this.readRaw(this.STORAGE_KEYS.userLastLogin));
    if (parsed === null || parsed === undefined || parsed === '') {
      return null;
    }

    return String(parsed);
  }

  public set UserLastLoginInfo(v: any) {
    if (v === null || v === undefined || v === '') {
      this.removeStorage(this.STORAGE_KEYS.userLastLogin);
      return;
    }

    this.writePlainStorage(this.STORAGE_KEYS.userLastLogin, v);
  }

  public getPermission(pageName: string) {
    if (this.SuperAdmin) {
      return {
        read: true,
        create: true,
        edit: true,
        post: true,
        delete: true,
      };
    }

    const permission = this.permissions.find((p) => p.ObjectName === pageName);

    if (permission) {
      return {
        read: permission.ReadPermission,
        create: permission.InsertPermission,
        edit: permission.ModifyPermission,
        post: permission.PostPermission,
        delete: permission.DeletePermission,
      };
    }

    return {
      read: false,
      create: false,
      edit: false,
      post: false,
      delete: false,
    };
  }

  public set OpenedPopupId(v: string) {
    if (!v) {
      this.removeStorage(this.STORAGE_KEYS.openedPopupId);
      return;
    }

    this.writePlainStorage(this.STORAGE_KEYS.openedPopupId, v);
  }

  public get OpenedPopupId(): string {
    return this.readPlainStorage(this.STORAGE_KEYS.openedPopupId, '');
  }

  public isSessionValid(): boolean {
    return !!this.User && !!localStorage.getItem(this.STORAGE_KEYS.accessToken);
  }

  public clearSessionData(): void {
    Object.values(this.STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    this.permissions = [];
    this.cookie.deleteAll('/');
  }

  public logout(reason: LogoutReason = 'manual'): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;

    try {
      this.clearSessionData();

      if (reason === 'expired') {
        this.toastr.warning(
          'Your session has expired. Please login again.',
          'Session Expired'
        );
      } else if (reason === 'unauthorized') {
        this.toastr.error(
          'You are not authorized. Please login again.',
          'Unauthorized'
        );
      } else if (reason === 'license') {
        this.toastr.error(
          'Your login permission is no longer valid. Please login again.',
          'Access Removed'
        );
      }

      this.router.navigateByUrl(this.loginRoute).finally(() => {
        this.isLoggingOut = false;
      });
    } catch {
      this.isLoggingOut = false;
      this.router.navigateByUrl(this.loginRoute);
    }
  }

  public logoutWithIdleMessage(): void {
    this.prepareIdleExpiry();
    this.finishIdleExpiryRedirect();
  }

  public prepareIdleExpiry(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;
    this.clearSessionData();
  }

  public finishIdleExpiryRedirect(): void {
    this.router.navigateByUrl(this.loginRoute).finally(() => {
      this.isLoggingOut = false;
    });
  }

  notifyUserProfileChanged(): void {
    this.userProfileChanged$.next();
  }
}