import { Injectable } from '@angular/core';
import { MenuItem, MenuSearchItem } from '../models/menu-item.model';
import { PermissionService } from './permission.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly migratedRoutes = new Set<string>([
    '/purchase-order',
    '/customers',
    '/users/users',
    '/admin/security/permission-setup',
    '/admin/security/applications',
    '/admin/security/modules',
    '/admin/security/pages',
    '/admin/security/roles',
    '/admin/security/user-roles',
    '/admin/security/permission-sets',
    '/admin/security/role-permission-sets',
    '/admin/security/page-permissions',
    '/admin/security/field-permissions',
    '/admin/security/data-access-rules',
    '/admin/security/permission-audit-logs'
  ]);

  private readonly items: MenuItem[] = [
    {
      id: 'finance',
      label: 'Finance',
      module: 'Finance',
      icon: 'bi bi-cash-stack',
      children: [
        {
          id: 'petty-cash-journal',
          label: 'Petty Cash Journal',
          module: 'Finance',
          route: '/journal/claim',
          icon: 'bi bi-wallet2',
          group: 'Journals',
          permissionKey: 'CLAIM JOURNAL'
        },
        {
          id: 'submitted-petty-cash',
          label: 'Submitted Petty Cash',
          module: 'Finance',
          route: '/journal/submitted-claim',
          icon: 'bi bi-journal-check',
          group: 'Journals',
          permissionKey: 'SUBMITTED CLAIM JOURNAL'
        },
        {
          id: 'payment-journal',
          label: 'Payment Journal',
          module: 'Finance',
          route: '/claim/payment-journal',
          icon: 'bi bi-bank',
          group: 'Payments',
          permissionKey: 'Payment Journal'
        },
        {
          id: 'claim-payment',
          label: 'Claim Payment',
          module: 'Finance',
          route: '/claim/claimpayment',
          icon: 'bi bi-cash-coin',
          group: 'Payments',
          permissionKey: 'CLAIM PAYMENTS'
        }
      ]
    },
    {
      id: 'sales',
      label: 'Sales',
      module: 'Sales',
      icon: 'bi bi-cart',
      children: [
        {
          id: 'sales-order',
          label: 'Sales Order',
          module: 'Sales',
          route: '/sales/salesOrder',
          icon: 'bi bi-bag',
          group: 'Sales',
          permissionKey: 'SO'
        },
        {
          id: 'sales-invoice',
          label: 'Sales Invoice',
          module: 'Sales',
          route: '/sales/salesInvoice',
          icon: 'bi bi-receipt',
          group: 'Sales',
          permissionKey: 'SI'
        },
        {
          id: 'sales-credit-memo',
          label: 'Sales Credit Memo',
          module: 'Sales',
          route: '/sales/sales-Credit-Memo',
          icon: 'bi bi-receipt-cutoff',
          group: 'Sales',
          permissionKey: 'SCM'
        },
        {
          id: 'posted-sales-invoices',
          label: 'Posted Sales Invoices',
          module: 'Sales',
          route: '/sales/postedsalesInvoice',
          icon: 'bi bi-journal-check',
          group: 'Sales History',
          permissionKey: 'POSTED SI'
        },
        {
          id: 'posted-sales-credit-memos',
          label: 'Posted Sales Credit Memos',
          module: 'Sales',
          route: '/sales/postedsales-Credit-Memo',
          icon: 'bi bi-archive',
          group: 'Sales History',
          permissionKey: 'PSCM'
        }
      ]
    },
    {
      id: 'master',
      label: 'Master',
      module: 'Master',
      icon: 'bi bi-diagram-3',
      children: [
        {
          id: 'customer-master',
          label: 'Customers',
          module: 'Master',
          route: '/customers',
          icon: 'bi bi-people',
          group: 'Master Data',
          pageCode: 'CUSTOMER_MASTER',
          permissionKey: 'CUSTOMERS'
        }
      ]
    },
    {
      id: 'purchase',
      label: 'Purchase',
      module: 'Purchase',
      icon: 'bi bi-bag',
      children: [
        {
          id: 'purchase-requisition',
          label: 'Purchase Requisition',
          module: 'Purchase',
          route: '/purchase/requisition',
          icon: 'bi bi-file-earmark-text',
          group: 'Requisitions',
          permissionKey: 'PR'
        },
        {
          id: 'bid-waiver',
          label: 'Bid Waiver',
          module: 'Purchase',
          route: '/purchase/PRBidWaiver',
          icon: 'bi bi-file-earmark-check',
          group: 'Requisitions',
          permissionKey: 'PRBidWaiver'
        },
        {
          id: 'vendor-selection',
          label: 'Vendor Selection',
          module: 'Purchase',
          route: '/purchase/PR-Vender-Selection',
          icon: 'bi bi-shop',
          group: 'Requisitions',
          permissionKey: 'PR-VS'
        },
        {
          id: 'approved-requisitions',
          label: 'Approved Requisitions',
          module: 'Purchase',
          route: '/purchase/approved-pr',
          icon: 'bi bi-check2-square',
          group: 'Requisitions',
          permissionKey: 'APR'
        },
        {
          id: 'archived-requisitions',
          label: 'Archived Requisitions',
          module: 'Purchase',
          route: '/purchase/archived-requisition',
          icon: 'bi bi-archive',
          group: 'Requisitions',
          permissionKey: 'ArchivedPR'
        },
        {
          id: 'cancelled-requisitions',
          label: 'Cancelled Requisitions',
          module: 'Purchase',
          route: '/purchase/cancelled-pr',
          icon: 'bi bi-x-square',
          group: 'Requisitions',
          permissionKey: 'PRC'
        },
        {
          id: 'purchase-quote',
          label: 'Purchase Quote',
          module: 'Purchase',
          route: '/purchase/quote',
          icon: 'bi bi-chat-square-quote',
          group: 'Purchase',
          permissionKey: 'PQ'
        },
        {
          id: 'purchase-order',
          label: 'Purchase Order',
          module: 'Purchase',
          route: '/purchase-order',
          icon: 'bi bi-cart-check',
          group: 'Purchase',
          pageCode: 'PURCHASE_ORDER',
          permissionKey: 'PO'
        },
        {
          id: 'purchase-credit-memo',
          label: 'Purchase Credit Memo',
          module: 'Purchase',
          route: '/purchase/purchase-Credit-Memo',
          icon: 'bi bi-receipt-cutoff',
          group: 'Purchase',
          permissionKey: 'PCM'
        },
        {
          id: 'vendors',
          label: 'Vendors',
          module: 'Purchase',
          route: '/vendor/register',
          icon: 'bi bi-shop',
          group: 'Vendor Management',
          permissionKey: 'REGISTER VENDOR'
        },
        {
          id: 'goods-received-note',
          label: 'Goods Received Note',
          module: 'Purchase',
          route: '/purchase/receipt',
          icon: 'bi bi-box-arrow-in-down',
          group: 'Procurement History',
          permissionKey: 'POSTED PURCHASE RECEIPT'
        },
        {
          id: 'posted-purchase-credit-memos',
          label: 'Posted Purchase Credit Memos',
          module: 'Purchase',
          route: '/purchase/postedpurchase-Credit-Memo',
          icon: 'bi bi-receipt-cutoff',
          group: 'Procurement History',
          permissionKey: 'PPCM'
        },
        {
          id: 'cancelled-purchase-orders',
          label: 'Cancelled Purchase Orders',
          module: 'Purchase',
          route: '/purchase/order-cancelled',
          icon: 'bi bi-x-square',
          group: 'Procurement History',
          permissionKey: 'POC'
        },
        {
          id: 'archived-purchase-orders',
          label: 'Archived Purchase Orders',
          module: 'Purchase',
          route: '/purchase/archived-order',
          icon: 'bi bi-archive',
          group: 'Procurement History',
          permissionKey: 'ArchivedPO'
        },
        {
          id: 'archived-purchase-quotes',
          label: 'Archived Purchase Quotes',
          module: 'Purchase',
          route: '/purchase/archived-quote',
          icon: 'bi bi-archive',
          group: 'Procurement History',
          permissionKey: 'ArchivedPQ'
        },
        {
          id: 'tms-route-planning',
          label: 'TMS Route Planning',
          module: 'Purchase',
          route: '/tms/dashboard',
          icon: 'bi bi-truck',
          group: 'Transport Management',
          permissionKey: 'PR'
        },
        {
          id: 'freight-charge-setup',
          label: 'Freight Charge Setup',
          module: 'Purchase',
          route: '/tms/setup/freight-charges',
          icon: 'bi bi-truck',
          group: 'Transport Management',
          permissionKey: 'PR'
        },
        {
          id: 'transporter-setup',
          label: 'Transporter Setup',
          module: 'Purchase',
          route: '/tms/setup/transporters',
          icon: 'bi bi-truck',
          group: 'Transport Management',
          permissionKey: 'PR'
        },
        {
          id: 'truck-setup',
          label: 'Truck Setup',
          module: 'Purchase',
          route: '/tms/setup/trucks',
          icon: 'bi bi-truck',
          group: 'Transport Management',
          permissionKey: 'PR'
        },
        {
          id: 'import-purchase-requisition',
          label: 'Import Purchase Requisition',
          module: 'Purchase',
          route: '/purchase/smart-document-import/import',
          icon: 'bi bi-file-earmark-arrow-up',
          group: 'Smart Document Import',
          permissionKey: 'PR'
        },
        {
          id: 'vendor-draft-workspace',
          label: 'Vendor Draft Workspace',
          module: 'Purchase',
          route: '/purchase/smart-document-import/drafts',
          icon: 'bi bi-file-earmark-arrow-up',
          group: 'Smart Document Import',
          permissionKey: 'PR'
        }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory',
      module: 'Inventory',
      icon: 'bi bi-box-seam',
      children: [
        {
          id: 'inventory-items',
          label: 'Items',
          module: 'Inventory',
          icon: 'bi bi-box-seam',
          group: 'Inventory',
          permissionKey: 'ITEMS'
        },
        {
          id: 'inventory-adjustment',
          label: 'Inventory Adjustment',
          module: 'Inventory',
          icon: 'bi bi-arrow-left-right',
          group: 'Inventory',
          permissionKey: 'INVENTORY ADJUSTMENT'
        }
      ]
    },
    {
      id: 'manufacturing',
      label: 'Manufacturing',
      module: 'Manufacturing',
      icon: 'bi bi-gear-wide-connected',
      children: [
        {
          id: 'production-orders',
          label: 'Production Orders',
          module: 'Manufacturing',
          icon: 'bi bi-gear-wide-connected',
          group: 'Manufacturing',
          permissionKey: 'PRODUCTION ORDERS'
        },
        {
          id: 'work-centers',
          label: 'Work Centers',
          module: 'Manufacturing',
          icon: 'bi bi-diagram-3',
          group: 'Manufacturing Setup',
          permissionKey: 'WORK CENTERS'
        }
      ]
    },
    {
      id: 'projects',
      label: 'Projects',
      module: 'Projects',
      icon: 'bi bi-kanban',
      children: [
        {
          id: 'project-recoveries',
          label: 'Project Recoveries',
          module: 'Projects',
          icon: 'bi bi-kanban',
          group: 'Projects',
          permissionKey: 'PROJECT RECOVERIES'
        },
        {
          id: 'project-setup',
          label: 'Project Setup',
          module: 'Projects',
          icon: 'bi bi-sliders',
          group: 'Projects',
          permissionKey: 'PROJECT SETUP'
        }
      ]
    },
    {
      id: 'hr',
      label: 'HR',
      module: 'HR',
      icon: 'bi bi-people',
      children: [
        {
          id: 'employee-claim',
          label: 'Employee Claim',
          module: 'HR',
          route: '/claim/employeeclaim',
          icon: 'bi bi-receipt',
          group: 'Claims',
          permissionKey: 'EMP CLAIM'
        },
        {
          id: 'finance-claim-review',
          label: 'Finance Claim Review',
          module: 'HR',
          route: '/claim/finance-claim-review',
          icon: 'bi bi-cash-coin',
          group: 'Claim Processing',
          permissionKey: 'FINANCE CLAIM REVIEW'
        },
        {
          id: 'claim-status',
          label: 'Claim Status',
          module: 'HR',
          route: '/reports/claim-status',
          icon: 'bi bi-bar-chart',
          group: 'Claim Reports',
          permissionKey: 'CLAIM_STATUS_REPORT'
        },
        {
          id: 'monthly-claim-summary',
          label: 'Monthly Claim Summary',
          module: 'HR',
          route: '/reports/monthly-claim-summary',
          icon: 'bi bi-bar-chart',
          group: 'Claim Reports',
          permissionKey: 'MONTHLY_CLAIM_SUMMARY'
        },
        {
          id: 'expense-type-summary',
          label: 'Expense Type Summary',
          module: 'HR',
          route: '/reports/expense-type-summary',
          icon: 'bi bi-bar-chart',
          group: 'Claim Reports',
          permissionKey: 'EXPENSE_TYPE_SUMMARY'
        },
        {
          id: 'posted-employee-claims',
          label: 'Posted Employee Claims',
          module: 'HR',
          route: '/claim/posted-employee-claim',
          icon: 'bi bi-archive',
          group: 'Claim History',
          permissionKey: 'POSTED EMP CLAIM'
        },
        {
          id: 'claim-setup',
          label: 'Claim Setup',
          module: 'HR',
          icon: 'bi bi-sliders',
          group: 'Claim Setup',
          permissionKey: 'CLAIM SETUP'
        },
        {
          id: 'claim-types',
          label: 'Claim Types',
          module: 'HR',
          route: '/claim/claimtype',
          icon: 'bi bi-tags',
          group: 'Claim Setup',
          permissionKey: 'CLAIM_TYPE'
        },
        {
          id: 'expense-type-setup',
          label: 'Expense Type Setup',
          module: 'HR',
          route: '/claim/expensetypesetup',
          icon: 'bi bi-sliders',
          group: 'Claim Setup',
          permissionKey: 'EXPENSE_TYPE_SETUP'
        },
        {
          id: 'entitlements',
          label: 'Entitlements',
          module: 'HR',
          route: '/claim/entitlement',
          icon: 'bi bi-award',
          group: 'Claim Setup',
          permissionKey: 'ENTITLEMENTS'
        },
        {
          id: 'staff-groups',
          label: 'Staff Groups',
          module: 'HR',
          route: '/claim/staff-group',
          icon: 'bi bi-people',
          group: 'Claim Setup',
          permissionKey: 'STAFF_GROUP'
        },
        {
          id: 'departments',
          label: 'Departments',
          module: 'HR',
          route: '/claim/department',
          icon: 'bi bi-diagram-3',
          group: 'Claim Setup',
          permissionKey: 'DEPT'
        },
        {
          id: 'employees',
          label: 'Employees',
          module: 'HR',
          route: '/claim/employee',
          icon: 'bi bi-person-badge',
          group: 'Claim Setup',
          permissionKey: 'EMP'
        },
        {
          id: 'employee-roles',
          label: 'Employee Roles',
          module: 'HR',
          route: '/claim/employee-role',
          icon: 'bi bi-person-check',
          group: 'Claim Setup',
          permissionKey: 'EMP_ROLE'
        },
        {
          id: 'claim-rule-setup',
          label: 'Claim Rule Setup',
          module: 'HR',
          route: '/claim/ruleSetup',
          icon: 'bi bi-sliders',
          group: 'Claim Setup',
          permissionKey: 'CLAIM_RULE_SETUP'
        }
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      module: 'Admin',
      icon: 'bi bi-sliders',
      children: [
        {
          id: 'workflow-setup',
          label: 'Workflow Setup',
          module: 'Admin',
          route: '/approval/workflow-setup',
          icon: 'bi bi-diagram-3',
          group: 'Workflow & Review',
          permissionKey: 'WORKFLOW SETUP'
        },
        {
          id: 'approval-user-setup',
          label: 'Approval User Setup',
          module: 'Admin',
          route: '/approval/setup',
          icon: 'bi bi-person-check',
          group: 'Workflow & Review',
          permissionKey: 'APPROVAL SETUP'
        },
        {
          id: 'approvers-group',
          label: 'Approvers Group',
          module: 'Admin',
          route: '/approval/approversgroup',
          icon: 'bi bi-people',
          group: 'Workflow & Review',
          permissionKey: 'AG'
        },
        {
          id: 'approval-entries',
          label: 'Approval Entries',
          module: 'Admin',
          route: '/approval/entry',
          icon: 'bi bi-check2-square',
          group: 'Workflow & Review',
          permissionKey: 'APPROVAL ENTRIES'
        },
        {
          id: 'approved-entries',
          label: 'Approved Entries',
          module: 'Admin',
          route: '/approval/approved-entry',
          icon: 'bi bi-check2-all',
          group: 'Workflow & Review',
          permissionKey: 'APPROVED ENTRIES'
        },
        {
          id: 'document-review-user-setup',
          label: 'Document Review User Setup',
          module: 'Admin',
          route: '/approval/review-user-setup',
          icon: 'bi bi-person-lines-fill',
          group: 'Workflow & Review',
          permissionKey: 'DOCUMENT REVIEW USER SETUP'
        },
        {
          id: 'review-entries',
          label: 'Review Entries',
          module: 'Admin',
          route: '/approval/review-entry',
          icon: 'bi bi-list-check',
          group: 'Workflow & Review',
          permissionKey: 'REVIEW ENTRIES'
        },
        {
          id: 'budget-request',
          label: 'Budget Request',
          module: 'Admin',
          route: '/approval/budget-request',
          icon: 'bi bi-clipboard-data',
          group: 'Workflow & Review',
          permissionKey: 'BR'
        },
        {
          id: 'users',
          label: 'Users',
          module: 'Admin',
          route: '/users/users',
          icon: 'bi bi-people',
          group: 'Users & Roles',
          permissionKey: 'USERS'
        },
        {
          id: 'user-roles',
          label: 'User Roles',
          module: 'Admin',
          route: '/admin/security/user-roles',
          icon: 'bi bi-person-gear',
          group: 'Users & Roles',
          pageCode: 'USER_ROLES',
          permissionKey: 'USER ROLES'
        },
        {
          id: 'permission-setup',
          label: 'Permission Setup',
          module: 'Admin',
          route: '/admin/security/permission-setup',
          icon: 'bi bi-shield-lock',
          group: 'Security & Permissions',
          pageCode: 'PERMISSION_SETUP',
          permissionKey: 'PERMISSION SETUP'
        },
        {
          id: 'applications',
          label: 'Applications',
          module: 'Admin',
          route: '/admin/security/applications',
          icon: 'bi bi-grid',
          group: 'Security & Permissions',
          pageCode: 'APPLICATIONS',
          permissionKey: 'APPLICATIONS'
        },
        {
          id: 'modules',
          label: 'Modules',
          module: 'Admin',
          route: '/admin/security/modules',
          icon: 'bi bi-collection',
          group: 'Security & Permissions',
          pageCode: 'MODULES',
          permissionKey: 'MODULES'
        },
        {
          id: 'pages-security',
          label: 'Pages',
          module: 'Admin',
          route: '/admin/security/pages',
          icon: 'bi bi-layout-text-window',
          group: 'Security & Permissions',
          pageCode: 'PAGES',
          permissionKey: 'PAGES'
        },
        {
          id: 'roles',
          label: 'Roles',
          module: 'Admin',
          route: '/admin/security/roles',
          icon: 'bi bi-person-lock',
          group: 'Security & Permissions',
          pageCode: 'ROLES',
          permissionKey: 'ROLES'
        },
        {
          id: 'permission-sets',
          label: 'Permission Sets',
          module: 'Admin',
          route: '/admin/security/permission-sets',
          icon: 'bi bi-shield-check',
          group: 'Security & Permissions',
          pageCode: 'PERMISSION_SETS',
          permissionKey: 'PERMISSION SETS'
        },
        {
          id: 'role-permission-sets',
          label: 'Role Permission Sets',
          module: 'Admin',
          route: '/admin/security/role-permission-sets',
          icon: 'bi bi-shield-plus',
          group: 'Security & Permissions',
          pageCode: 'ROLE_PERMISSION_SETS',
          permissionKey: 'ROLE PERMISSION SETS'
        },
        {
          id: 'page-permissions',
          label: 'Page Permissions',
          module: 'Admin',
          route: '/admin/security/page-permissions',
          icon: 'bi bi-layout-text-window',
          group: 'Security & Permissions',
          pageCode: 'PAGE_PERMISSIONS',
          permissionKey: 'PAGE PERMISSIONS'
        },
        {
          id: 'field-permissions',
          label: 'Field Permissions',
          module: 'Admin',
          route: '/admin/security/field-permissions',
          icon: 'bi bi-input-cursor-text',
          group: 'Security & Permissions',
          pageCode: 'FIELD_PERMISSIONS',
          permissionKey: 'FIELD PERMISSIONS'
        },
        {
          id: 'data-access-rules',
          label: 'Data Access Rules',
          module: 'Admin',
          route: '/admin/security/data-access-rules',
          icon: 'bi bi-funnel',
          group: 'Security & Permissions',
          pageCode: 'DATA_ACCESS_RULES',
          permissionKey: 'DATA ACCESS RULES'
        },
        {
          id: 'permission-audit-logs',
          label: 'Permission Audit Logs',
          module: 'Admin',
          route: '/admin/security/permission-audit-logs',
          icon: 'bi bi-clock-history',
          group: 'Security & Permissions',
          pageCode: 'PERMISSION_AUDIT_LOGS',
          permissionKey: 'PERMISSION AUDIT LOGS'
        },
        {
          id: 'active-users',
          label: 'Active Users',
          module: 'Admin',
          route: '/users/activeUser',
          icon: 'bi bi-person-check',
          group: 'Users & Roles',
          permissionKey: 'ACTIVE USER'
        },
        {
          id: 'portal-reasons',
          label: 'Portal Reasons',
          module: 'Admin',
          route: '/users/portal-reasons',
          icon: 'bi bi-chat-square-text',
          group: 'Users & Roles',
          permissionKey: 'PORTAL REASON'
        },
        {
          id: 'page-configuration',
          label: 'Page Configuration',
          module: 'Admin',
          route: '/users/pages',
          icon: 'bi bi-file-earmark-code',
          group: 'Access Control',
          permissionKey: 'PAGE CONFIGURATION'
        },
        {
          id: 'company-permissions',
          label: 'Company Permissions',
          module: 'Admin',
          route: '/users/company-permissions',
          icon: 'bi bi-building-lock',
          group: 'Access Control',
          permissionKey: 'COMPANY PERMISSIONS'
        },
        {
          id: 'access-centers',
          label: 'Access Centers',
          module: 'Admin',
          route: '/access-center/list',
          icon: 'bi bi-diagram-3',
          group: 'Access Control',
          permissionKey: 'ACCESS CENTER'
        },
        {
          id: 'access-center-permissions',
          label: 'Access Center Permissions',
          module: 'Admin',
          route: '/access-center/permissions',
          icon: 'bi bi-shield-lock',
          group: 'Access Control',
          permissionKey: 'ACCESS CENTER PERMISSIONS'
        },
        {
          id: 'portal-setup',
          label: 'Portal Setup',
          module: 'Admin',
          route: '/users/portalSetup',
          icon: 'bi bi-gear',
          group: 'System Setup',
          permissionKey: 'PORTAL SETUP'
        },
        {
          id: 'attachment-types',
          label: 'Attachment Types',
          module: 'Admin',
          route: '/attachments/types',
          icon: 'bi bi-paperclip',
          group: 'System Setup',
          permissionKey: 'DocumentAttachmentTypes'
        },
        {
          id: 'document-attachments',
          label: 'Document Attachments',
          module: 'Admin',
          route: '/attachments/documents',
          icon: 'bi bi-files',
          group: 'System Setup',
          permissionKey: 'DocumentAttachments'
        },
        {
          id: 'email-templates',
          label: 'Email Templates',
          module: 'Admin',
          route: '/template/email',
          icon: 'bi bi-envelope-paper',
          group: 'System Setup',
          permissionKey: 'EmailTemplate'
        }
      ]
    }
  ];

  constructor(private readonly permissionService: PermissionService) {}

  getModules(): MenuItem[] {
    return this.items.map((item) => ({
      ...item,
      children: this.filterItems(item.children ?? [])
    }));
  }

  getModule(moduleKey: string): MenuItem | undefined {
    const normalizedKey = this.normalize(moduleKey);
    const item = this.items.find((menuItem) => this.normalize(menuItem.module) === normalizedKey || this.normalize(menuItem.id) === normalizedKey);

    if (!item) {
      return undefined;
    }

    return {
      ...item,
      children: this.filterItems(item.children ?? [])
    };
  }

  getModuleItems(moduleKey: string): MenuItem[] {
    return this.getModule(moduleKey)?.children ?? [];
  }

  search(query: string, limit = 8): MenuSearchItem[] {
    const normalizedQuery = this.normalizeQuery(query);
    if (!normalizedQuery) {
      return [];
    }

    return this.getModules()
      .flatMap((module) => this.collectSearchItems(module.children ?? [], module.label))
      .filter((item) => this.matchesQuery(item, normalizedQuery))
      .sort((left, right) => this.compareSearchItems(left, right, normalizedQuery))
      .slice(0, limit);
  }

  private collectSearchItems(items: MenuItem[], moduleLabel: string): MenuSearchItem[] {
    return items.flatMap((item) => {
      const current: MenuSearchItem[] = item.route
        ? [{ ...item, moduleLabel }]
        : [];

      const children = item.children ? this.collectSearchItems(item.children, moduleLabel) : [];

      return [...current, ...children];
    });
  }

  private matchesQuery(item: MenuSearchItem, normalizedQuery: string): boolean {
    return [item.label, item.moduleLabel, item.group, item.id, item.route]
      .filter((value): value is string => Boolean(value))
      .some((value) => this.normalize(value).includes(normalizedQuery));
  }

  private compareSearchItems(left: MenuSearchItem, right: MenuSearchItem, normalizedQuery: string): number {
    const leftScore = this.getSearchScore(left, normalizedQuery);
    const rightScore = this.getSearchScore(right, normalizedQuery);

    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }

    return left.label.localeCompare(right.label);
  }

  private getSearchScore(item: MenuSearchItem, normalizedQuery: string): number {
    const label = this.normalize(item.label);
    const moduleLabel = this.normalize(item.moduleLabel);

    if (label === normalizedQuery) {
      return 0;
    }

    if (label.startsWith(normalizedQuery)) {
      return 1;
    }

    if (moduleLabel.startsWith(normalizedQuery)) {
      return 2;
    }

    return 3;
  }

  private filterItems(items: MenuItem[]): MenuItem[] {
    return items
      .filter((item) => item.pageCode
        ? this.permissionService.canView(item.pageCode)
        : this.permissionService.hasPermission(item.permissionKey))
      .map((item) => {
        const children = item.children ? this.filterItems(item.children) : undefined;

        return {
          ...item,
          route: this.getMigratedRoute(item.route),
          children
        };
      });
  }

  private getMigratedRoute(route?: string): string | undefined {
    if (!route) {
      return undefined;
    }

    if (this.migratedRoutes.has(route)) {
      return route;
    }

    // TODO(menu-migration): This route exists in the old app reference but its new Filaz page is not migrated yet.
    return undefined;
  }

  private normalizeQuery(value: string): string {
    return this.normalize(value).replace(/\s+/g, ' ');
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }
}
