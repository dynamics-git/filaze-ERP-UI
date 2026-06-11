import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommandConfig } from '../../shared/erp-core/models/command-config.model';
import {
  EffectiveFieldPermission,
  EffectivePagePermission,
  EffectivePermissionsResponse,
  PermissionAction,
  PermissionFlag,
} from '../models/effective-permissions.model';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly actionFlags: Record<PermissionAction, PermissionFlag> = {
    view: 'can_view',
    insert: 'can_insert',
    edit: 'can_edit',
    delete: 'can_delete',
    submit: 'can_submit',
    approve: 'can_approve',
    reject: 'can_reject',
    reopen: 'can_reopen',
    cancel: 'can_cancel',
    assign: 'can_assign',
    export: 'can_export',
    print: 'can_print',
    post: 'can_post',
    archive: 'can_archive',
  };

  constructor(
    private readonly http: HttpClient,
    private readonly sessionService: SessionService
  ) {}

  loadEffectivePermissions(applicationCode = 'ERP'): Observable<EffectivePermissionsResponse> {
    const endpoint = `/effective-permissions?application_code=${encodeURIComponent(applicationCode)}`;

    return this.http.get<EffectivePermissionsResponse>(this.buildApiUrl(endpoint), {
      headers: this.createHeaders().set('X-Application-Code', applicationCode),
    }).pipe(
      map((response) => this.normalizeEffectivePermissions(response, applicationCode)),
      tap((permissions) => {
        this.sessionService.EffectivePermissions = permissions;
      })
    );
  }

  isSuperAdmin(): boolean {
    return this.sessionService.SuperAdmin || this.sessionService.UserName.toLowerCase() === 'admin@tecsa.com.my';
  }

  hasEffectivePermissions(): boolean {
    return Boolean(this.sessionService.EffectivePermissions);
  }

  canView(pageCode?: string): boolean {
    return this.can(pageCode, 'view');
  }

  can(pageCode: string | undefined, action: PermissionAction): boolean {
    if (!pageCode) {
      return true;
    }

    if (this.isSuperAdmin()) {
      return true;
    }

    const effectivePermissions = this.sessionService.EffectivePermissions;
    if (!effectivePermissions) {
      return this.hasPermission(pageCode);
    }

    const page = this.findPagePermission(pageCode);
    if (!page || page.can_view !== true) {
      return false;
    }

    if (action === 'view') {
      return true;
    }

    return page[this.actionFlags[action]] === true;
  }

  canCommand(
    pageCode: string | undefined,
    command: Pick<CommandConfig, 'actionKey' | 'permissionAction'>
  ): boolean {
    if (!pageCode) {
      return true;
    }

    const action = command.permissionAction ?? this.resolveActionFromCommand(command.actionKey);
    return action ? this.can(pageCode, action) : true;
  }

  getFieldPermission(pageCode: string | undefined, fieldKey: string): EffectiveFieldPermission | undefined {
    if (!pageCode || this.isSuperAdmin()) {
      return undefined;
    }

    const permissions = this.sessionService.EffectivePermissions?.fields ?? [];
    const normalizedPage = this.normalizeCode(pageCode);
    const normalizedField = this.normalizeCode(fieldKey);
    return permissions.find((permission) =>
      this.normalizeCode(permission.page) === normalizedPage &&
      this.normalizeCode(permission.field) === normalizedField
    );
  }

  hasPermission(permissionKey?: string): boolean {
    if (!permissionKey) {
      return true;
    }

    if (this.isSuperAdmin()) {
      return true;
    }

    const effectivePermissions = this.sessionService.EffectivePermissions;
    if (effectivePermissions) {
      return this.canView(permissionKey);
    }

    const permissions = this.sessionService.Permissions;

    if (!permissions.length) {
      // TODO(permission): During migration, allow all until the login flow consistently stores permissions.
      return true;
    }

    const normalizedPermissionKey = this.normalizeLegacy(permissionKey);

    return permissions.some((permission) => {
      const objectName = this.readPermissionValue(permission, 'ObjectName');
      const pageName = this.readPermissionValue(permission, 'PageName');
      const canRead = this.readPermissionFlag(permission, 'ReadPermission');

      return canRead && (
        this.normalizeLegacy(objectName) === normalizedPermissionKey ||
        this.normalizeLegacy(pageName) === normalizedPermissionKey
      );
    });
  }

  private findPagePermission(pageCode: string): EffectivePagePermission | undefined {
    const normalized = this.normalizeCode(pageCode);
    return this.sessionService.EffectivePermissions?.pages.find((page) =>
      this.normalizeCode(page.page) === normalized
    );
  }

  private resolveActionFromCommand(actionKey: string | undefined): PermissionAction | undefined {
    const normalized = this.normalizeCode(actionKey ?? '');
    if (!normalized) {
      return undefined;
    }

    if (normalized === 'NEW' || normalized.includes('LINE_NEW') || normalized.includes('INSERT') || normalized.includes('ADD')) {
      return 'insert';
    }

    if (normalized === 'DELETE' || normalized.includes('LINE_DELETE') || normalized.includes('REMOVE')) {
      return 'delete';
    }

    if (normalized.includes('SUBMIT') || normalized.includes('SEND_APPROVAL')) {
      return 'submit';
    }

    if (normalized.includes('REJECT')) {
      return 'reject';
    }

    if (normalized.includes('REOPEN') || normalized.includes('RE_OPEN')) {
      return 'reopen';
    }

    if (normalized.includes('CANCEL')) {
      return 'cancel';
    }

    if (normalized.includes('ASSIGN')) {
      return 'assign';
    }

    if (normalized.includes('EXPORT')) {
      return 'export';
    }

    if (normalized.includes('PRINT')) {
      return 'print';
    }

    if (normalized.includes('POST')) {
      return 'post';
    }

    if (normalized.includes('ARCHIVE')) {
      return 'archive';
    }

    if (normalized.includes('APPROVE') || normalized.includes('APPROVAL') || normalized.includes('REVIEW')) {
      return 'approve';
    }

    if (normalized === 'SAVE' || normalized.includes('EDIT') || normalized.includes('UPDATE') || normalized.includes('RELEASE')) {
      return 'edit';
    }

    return undefined;
  }

  private normalizeEffectivePermissions(
    response: EffectivePermissionsResponse,
    fallbackApplication: string
  ): EffectivePermissionsResponse {
    return {
      application: response?.application || fallbackApplication,
      roles: Array.isArray(response?.roles) ? response.roles : [],
      pages: Array.isArray(response?.pages) ? response.pages : [],
      fields: Array.isArray(response?.fields) ? response.fields : [],
      data_access_rules: Array.isArray(response?.data_access_rules) ? response.data_access_rules : [],
    };
  }

  private buildApiUrl(endpoint: string): string {
    const baseUrl = environment.apiBaseUrl.endsWith('/')
      ? environment.apiBaseUrl.slice(0, -1)
      : environment.apiBaseUrl;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${normalizedEndpoint}`;
  }

  private createHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (this.sessionService.AccessToken) {
      headers = headers.set('Authorization', `Bearer ${this.sessionService.AccessToken}`);
    }

    return headers;
  }

  private readPermissionValue(permission: unknown, key: string): string {
    if (permission && typeof permission === 'object' && key in permission) {
      const record = permission as Record<string, unknown>;
      const value = record[key];
      return value === undefined || value === null ? '' : String(value);
    }

    return '';
  }

  private readPermissionFlag(permission: unknown, key: string): boolean {
    const value = this.readPermissionValue(permission, key);
    return value === 'true' || value === 'True' || value === 'Yes' || value === '1' || value === 'Full';
  }

  private normalizeLegacy(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toUpperCase();
  }

  private normalizeCode(value: string): string {
    return value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toUpperCase();
  }
}
