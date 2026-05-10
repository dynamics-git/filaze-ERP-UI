import { Injectable } from '@angular/core';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(private readonly sessionService: SessionService) {}

  isSuperAdmin(): boolean {
    return this.sessionService.SuperAdmin || this.sessionService.UserName.toLowerCase() === 'admin@tecsa.com.my';
  }

  hasPermission(permissionKey?: string): boolean {
    if (!permissionKey) {
      return true;
    }

    if (this.isSuperAdmin()) {
      return true;
    }

    const permissions = this.sessionService.Permissions;

    if (!permissions.length) {
      // TODO(permission): During migration, allow all until the login flow consistently stores portalPermissions.
      return true;
    }

    const normalizedPermissionKey = this.normalize(permissionKey);

    return permissions.some((permission) => {
      const objectName = this.readPermissionValue(permission, 'ObjectName');
      const pageName = this.readPermissionValue(permission, 'PageName');
      const canRead = this.readPermissionFlag(permission, 'ReadPermission');

      return canRead && (
        this.normalize(objectName) === normalizedPermissionKey ||
        this.normalize(pageName) === normalizedPermissionKey
      );
    });
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

  private normalize(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toUpperCase();
  }
}
