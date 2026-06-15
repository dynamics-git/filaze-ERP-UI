import { DataSourceConfig, EntryHeaderConfig, ListPageConfig } from '../../../shared/erp-core/public-api';

export const permissionAuditLogsListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
  pageId: 'permission-audit-logs',
  pageCode: 'PERMISSION_AUDIT_LOGS',
  pageType: 'setup',
  defaultOpenTarget: 'list',
  title: 'Permission Audit Logs',
  module: 'Admin',
  viewSuffix: 'permission audit logs',
  dataSource: {
    endpoint: '/permission-audit-logs',
    keyField: 'systemId',
    documentNoField: 'event_time',
    pageSize: 50,
  },
  dataSurface: {
    id: 'permission-audit-logs-grid',
    idField: 'systemId',
    columns: [
      { id: 'event_time', field: 'event_time', label: 'Event Time', isPrimary: true },
      { id: 'actor', field: 'actor', label: 'Actor' },
      { id: 'permission_set_id', field: 'permission_set_id', label: 'Permission Set' },
      { id: 'target_page', field: 'target_page', label: 'Target Page' },
      { id: 'action', field: 'action', label: 'Action' },
      { id: 'result', field: 'result', label: 'Result' },
    ],
  },
  searchFields: ['actor', 'target_page', 'action', 'result'],
  searchPlaceholder: 'Search permission audit logs',
};

export const permissionAuditLogsHeaderConfig: EntryHeaderConfig = {
  dialogTitle: 'Permission Audit Log',
  toolbarButtons: [],
  sections: [
    {
      id: 'header-main',
      title: 'Event Details',
      fields: [
        { key: 'event_time', label: 'Event Time', type: 'text', readonly: true },
        { key: 'actor', label: 'Actor', type: 'text', readonly: true },
        { key: 'permission_set_id', label: 'Permission Set', type: 'text', readonly: true },
        { key: 'target_page', label: 'Target Page', type: 'text', readonly: true },
        { key: 'action', label: 'Action', type: 'text', readonly: true },
        { key: 'result', label: 'Result', type: 'text', readonly: true },
        { key: 'details', label: 'Details', type: 'textarea', width: 'wide', readonly: true },
      ],
    },
  ],
};
