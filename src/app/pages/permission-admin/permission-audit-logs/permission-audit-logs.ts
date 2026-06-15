import { Component } from '@angular/core';
import { DocumentRuntimeComponent } from '../../../shared/erp-core/public-api';
import {
  permissionAuditLogsHeaderConfig,
  permissionAuditLogsListConfig,
} from './permission-audit-logs.config';

@Component({
  selector: 'app-permission-audit-logs-page',
  standalone: true,
  imports: [DocumentRuntimeComponent],
  templateUrl: './permission-audit-logs.html',
})
export class PermissionAuditLogsPage {
  readonly pageId = 'permission-audit-logs';
  readonly listConfig = permissionAuditLogsListConfig;
  readonly headerConfig = permissionAuditLogsHeaderConfig;
}
