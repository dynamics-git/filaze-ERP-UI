import { Injectable } from '@angular/core';
import { MenuItem, MenuSearchItem } from '../models/menu-item.model';
import { PermissionService } from './permission.service';
import { isPageIdRegistered } from './run-modal-config-registry';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly migratedRoutes = new Set<string>([
    '/purchase-order',
    '/customers',
    '/customer-ledger-entries',
    '/admin/permission/users',
    '/admin/permission/company-information',
    '/admin/permission/companies',
    '/admin/permission/roles',
    '/admin/permission/permission-sets',
    '/admin/permission/app-pages',
    '/admin/permission/page-fields',
    '/admin/permission/field-rules'
  ]);

  private readonly items: MenuItem[] = [
    {
      pageId: 'finance',
      label: 'Finance',
      module: 'Finance',
      icon: 'bi bi-cash-stack',
      children: [
        {
          pageId: 'petty-cash-journal',
          label: 'Petty Cash Journal',
          module: 'Finance',
          route: '/journal/claim',
          icon: 'bi bi-wallet2',
          group: 'Journals',
          permissionKey: 'CLAIM JOURNAL'
        },
        {
          pageId: 'submitted-petty-cash',
          label: 'Submitted Petty Cash',
          module: 'Finance',
          route: '/journal/submitted-claim',
          icon: 'bi bi-journal-check',
          group: 'Journals',
          permissionKey: 'SUBMITTED CLAIM JOURNAL'
        },
        {
          pageId: 'payment-journal',
          label: 'Payment Journal',
          module: 'Finance',
          route: '/claim/payment-journal',
          icon: 'bi bi-bank',
          group: 'Payments',
          permissionKey: 'Payment Journal'
        },
        {
          pageId: 'claim-payment',
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
      pageId: 'sales',
      label: 'Sales',
      module: 'Sales',
      icon: 'bi bi-cart',
      children: [
        {
          pageId: 'sales-order',
          label: 'Sales Order',
          module: 'Sales',
          route: '/sales/salesOrder',
          icon: 'bi bi-bag',
          group: 'Sales',
          permissionKey: 'SO'
        },
        {
          pageId: 'sales-invoice',
          label: 'Sales Invoice',
          module: 'Sales',
          route: '/sales/salesInvoice',
          icon: 'bi bi-receipt',
          group: 'Sales',
          permissionKey: 'SI'
        },
        {
          pageId: 'sales-credit-memo',
          label: 'Sales Credit Memo',
          module: 'Sales',
          route: '/sales/sales-Credit-Memo',
          icon: 'bi bi-receipt-cutoff',
          group: 'Sales',
          permissionKey: 'SCM'
        },
        {
          pageId: 'posted-sales-invoices',
          label: 'Posted Sales Invoices',
          module: 'Sales',
          route: '/sales/postedsalesInvoice',
          icon: 'bi bi-journal-check',
          group: 'Sales History',
          permissionKey: 'POSTED SI'
        },
        {
          pageId: 'posted-sales-credit-memos',
          label: 'Posted Sales Credit Memos',
          module: 'Sales',
          route: '/sales/postedsales-Credit-Memo',
          icon: 'bi bi-archive',
          group: 'Sales History',
          permissionKey: 'PSCM'
        },
        {
          pageId: 'customer-ledger-entry',
          label: 'Customer Ledger Entries',
          module: 'Sales',
          route: '/customer-ledger-entries',
          icon: 'bi bi-journal-text',
          group: 'Sales History',
          permissionKey: 'CUSTOMERS'
        }
      ]
    },
    {
      pageId: 'master',
      label: 'Master',
      module: 'Master',
      icon: 'bi bi-diagram-3',
      children: [
        {
          pageId: 'customer-master',
          label: 'Customers',
          module: 'Master',
          route: '/customers',
          icon: 'bi bi-people',
          group: 'Master Data',
          permissionKey: 'CUSTOMERS'
        }
      ]
    },
    {
      pageId: 'purchase',
      label: 'Purchase',
      module: 'Purchase',
      icon: 'bi bi-bag',
      children: [
        {
          pageId: 'purchase-requisition',
          label: 'Purchase Requisition',
          module: 'Purchase',
          route: '/purchase/requisition',
          icon: 'bi bi-file-earmark-text',
          group: 'Requisitions',
          permissionKey: 'PR'
        },
        {
          pageId: 'bid-waiver',
          label: 'Bid Waiver',
          module: 'Purchase',
          route: '/purchase/PRBidWaiver',
          icon: 'bi bi-file-earmark-check',
          group: 'Requisitions',
          permissionKey: 'PRBidWaiver'
        },
        {
          pageId: 'vendor-selection',
          label: 'Vendor Selection',
          module: 'Purchase',
          route: '/purchase/PR-Vender-Selection',
          icon: 'bi bi-shop',
          group: 'Requisitions',
          permissionKey: 'PR-VS'
        },
        {
          pageId: 'approved-requisitions',
          label: 'Approved Requisitions',
          module: 'Purchase',
          route: '/purchase/approved-pr',
          icon: 'bi bi-check2-square',
          group: 'Requisitions',
          permissionKey: 'APR'
        },
        {
          pageId: 'archived-requisitions',
          label: 'Archived Requisitions',
          module: 'Purchase',
          route: '/purchase/archived-requisition',
          icon: 'bi bi-archive',
          group: 'Requisitions',
          permissionKey: 'ArchivedPR'
        },
        {
          pageId: 'cancelled-requisitions',
          label: 'Cancelled Requisitions',
          module: 'Purchase',
          route: '/purchase/cancelled-pr',
          icon: 'bi bi-x-square',
          group: 'Requisitions',
          permissionKey: 'PRC'
        },
        {
          pageId: 'purchase-quote',
          label: 'Purchase Quote',
          module: 'Purchase',
          route: '/purchase/quote',
          icon: 'bi bi-chat-square-quote',
          group: 'Purchase',
          permissionKey: 'PQ'
        },
        {
          pageId: 'purchase-order',
          label: 'Purchase Order',
          module: 'Purchase',
          route: '/purchase-order',
          icon: 'bi bi-cart-check',
          group: 'Purchase',
          permissionKey: 'PO'
        },
        {
          pageId: 'purchase-credit-memo',
          label: 'Purchase Credit Memo',
          module: 'Purchase',
          route: '/purchase/purchase-Credit-Memo',
          icon: 'bi bi-receipt-cutoff',
          group: 'Purchase',
          permissionKey: 'PCM'
        },
        {
          pageId: 'vendors',
          label: 'Vendors',
          module: 'Purchase',
          route: '/vendor/register',
          icon: 'bi bi-shop',
          group: 'Vendor Management',
          permissionKey: 'REGISTER VENDOR'
        },
        {
          pageId: 'goods-received-note',
          label: 'Goods Received Note',
          module: 'Purchase',
          route: '/purchase/receipt',
          icon: 'bi bi-box-arrow-in-down',
          group: 'Procurement History',
          permissionKey: 'POSTED PURCHASE RECEIPT'
        },
        {
          pageId: 'posted-purchase-credit-memos',
          label: 'Posted Purchase Credit Memos',
          module: 'Purchase',
          route: '/purchase/postedpurchase-Credit-Memo',
          icon: 'bi bi-receipt-cutoff',
          group: 'Procurement History',
          permissionKey: 'PPCM'
        },
        {
          pageId: 'cancelled-purchase-orders',
          label: 'Cancelled Purchase Orders',
          module: 'Purchase',
          route: '/purchase/order-cancelled',
          icon: 'bi bi-x-square',
          group: 'Procurement History',
          permissionKey: 'POC'
        },
        {
          pageId: 'archived-purchase-orders',
          label: 'Archived Purchase Orders',
          module: 'Purchase',
          route: '/purchase/archived-order',
          icon: 'bi bi-archive',
          group: 'Procurement History',
          permissionKey: 'ArchivedPO'
        },
        {
          pageId: 'archived-purchase-quotes',
          label: 'Archived Purchase Quotes',
          module: 'Purchase',
          route: '/purchase/archived-quote',
          icon: 'bi bi-archive',
          group: 'Procurement History',
          permissionKey: 'ArchivedPQ'
        },
        {
          pageId: 'tms-route-planning',
          label: 'TMS Route Planning',
          module: 'Purchase',
          route: '/tms/dashboard',
          icon: 'bi bi-truck',
          group: 'Transport Management',
          permissionKey: 'PR'
        },
        {
          pageId: 'freight-charge-setup',
          label: 'Freight Charge Setup',
          module: 'Purchase',
          route: '/tms/setup/freight-charges',
          icon: 'bi bi-truck',
          group: 'Transport Management',
          permissionKey: 'PR'
        },
        {
          pageId: 'transporter-setup',
          label: 'Transporter Setup',
          module: 'Purchase',
          route: '/tms/setup/transporters',
          icon: 'bi bi-truck',
          group: 'Transport Management',
          permissionKey: 'PR'
        },
        {
          pageId: 'truck-setup',
          label: 'Truck Setup',
          module: 'Purchase',
          route: '/tms/setup/trucks',
          icon: 'bi bi-truck',
          group: 'Transport Management',
          permissionKey: 'PR'
        },
        {
          pageId: 'import-purchase-requisition',
          label: 'Import Purchase Requisition',
          module: 'Purchase',
          route: '/purchase/smart-document-import/import',
          icon: 'bi bi-file-earmark-arrow-up',
          group: 'Smart Document Import',
          permissionKey: 'PR'
        },
        {
          pageId: 'vendor-draft-workspace',
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
      pageId: 'inventory',
      label: 'Inventory',
      module: 'Inventory',
      icon: 'bi bi-box-seam',
      children: [
        {
          pageId: 'inventory-items',
          label: 'Items',
          module: 'Inventory',
          icon: 'bi bi-box-seam',
          group: 'Inventory',
          permissionKey: 'ITEMS'
        },
        {
          pageId: 'inventory-adjustment',
          label: 'Inventory Adjustment',
          module: 'Inventory',
          icon: 'bi bi-arrow-left-right',
          group: 'Inventory',
          permissionKey: 'INVENTORY ADJUSTMENT'
        }
      ]
    },
    {
      pageId: 'manufacturing',
      label: 'Manufacturing',
      module: 'Manufacturing',
      icon: 'bi bi-gear-wide-connected',
      children: [
        {
          pageId: 'production-orders',
          label: 'Production Orders',
          module: 'Manufacturing',
          icon: 'bi bi-gear-wide-connected',
          group: 'Manufacturing',
          permissionKey: 'PRODUCTION ORDERS'
        },
        {
          pageId: 'work-centers',
          label: 'Work Centers',
          module: 'Manufacturing',
          icon: 'bi bi-diagram-3',
          group: 'Manufacturing Setup',
          permissionKey: 'WORK CENTERS'
        }
      ]
    },
    {
      pageId: 'projects',
      label: 'Projects',
      module: 'Projects',
      icon: 'bi bi-kanban',
      children: [
        {
          pageId: 'project-recoveries',
          label: 'Project Recoveries',
          module: 'Projects',
          icon: 'bi bi-kanban',
          group: 'Projects',
          permissionKey: 'PROJECT RECOVERIES'
        },
        {
          pageId: 'project-setup',
          label: 'Project Setup',
          module: 'Projects',
          icon: 'bi bi-sliders',
          group: 'Projects',
          permissionKey: 'PROJECT SETUP'
        }
      ]
    },
    {
      pageId: 'hr',
      label: 'HR',
      module: 'HR',
      icon: 'bi bi-people',
      children: [
        {
          pageId: 'employee-claim',
          label: 'Employee Claim',
          module: 'HR',
          route: '/claim/employeeclaim',
          icon: 'bi bi-receipt',
          group: 'Claims',
          permissionKey: 'EMP CLAIM'
        },
        {
          pageId: 'finance-claim-review',
          label: 'Finance Claim Review',
          module: 'HR',
          route: '/claim/finance-claim-review',
          icon: 'bi bi-cash-coin',
          group: 'Claim Processing',
          permissionKey: 'FINANCE CLAIM REVIEW'
        },
        {
          pageId: 'claim-status',
          label: 'Claim Status',
          module: 'HR',
          route: '/reports/claim-status',
          icon: 'bi bi-bar-chart',
          group: 'Claim Reports',
          permissionKey: 'CLAIM_STATUS_REPORT'
        },
        {
          pageId: 'monthly-claim-summary',
          label: 'Monthly Claim Summary',
          module: 'HR',
          route: '/reports/monthly-claim-summary',
          icon: 'bi bi-bar-chart',
          group: 'Claim Reports',
          permissionKey: 'MONTHLY_CLAIM_SUMMARY'
        },
        {
          pageId: 'expense-type-summary',
          label: 'Expense Type Summary',
          module: 'HR',
          route: '/reports/expense-type-summary',
          icon: 'bi bi-bar-chart',
          group: 'Claim Reports',
          permissionKey: 'EXPENSE_TYPE_SUMMARY'
        },
        {
          pageId: 'posted-employee-claims',
          label: 'Posted Employee Claims',
          module: 'HR',
          route: '/claim/posted-employee-claim',
          icon: 'bi bi-archive',
          group: 'Claim History',
          permissionKey: 'POSTED EMP CLAIM'
        },
        {
          pageId: 'claim-setup',
          label: 'Claim Setup',
          module: 'HR',
          icon: 'bi bi-sliders',
          group: 'Claim Setup',
          permissionKey: 'CLAIM SETUP'
        },
        {
          pageId: 'claim-types',
          label: 'Claim Types',
          module: 'HR',
          route: '/claim/claimtype',
          icon: 'bi bi-tags',
          group: 'Claim Setup',
          permissionKey: 'CLAIM_TYPE'
        },
        {
          pageId: 'expense-type-setup',
          label: 'Expense Type Setup',
          module: 'HR',
          route: '/claim/expensetypesetup',
          icon: 'bi bi-sliders',
          group: 'Claim Setup',
          permissionKey: 'EXPENSE_TYPE_SETUP'
        },
        {
          pageId: 'entitlements',
          label: 'Entitlements',
          module: 'HR',
          route: '/claim/entitlement',
          icon: 'bi bi-award',
          group: 'Claim Setup',
          permissionKey: 'ENTITLEMENTS'
        },
        {
          pageId: 'staff-groups',
          label: 'Staff Groups',
          module: 'HR',
          route: '/claim/staff-group',
          icon: 'bi bi-people',
          group: 'Claim Setup',
          permissionKey: 'STAFF_GROUP'
        },
        {
          pageId: 'departments',
          label: 'Departments',
          module: 'HR',
          route: '/claim/department',
          icon: 'bi bi-diagram-3',
          group: 'Claim Setup',
          permissionKey: 'DEPT'
        },
        {
          pageId: 'employees',
          label: 'Employees',
          module: 'HR',
          route: '/claim/employee',
          icon: 'bi bi-person-badge',
          group: 'Claim Setup',
          permissionKey: 'EMP'
        },
        {
          pageId: 'employee-roles',
          label: 'Employee Roles',
          module: 'HR',
          route: '/claim/employee-role',
          icon: 'bi bi-person-check',
          group: 'Claim Setup',
          permissionKey: 'EMP_ROLE'
        },
        {
          pageId: 'claim-rule-setup',
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
      pageId: 'admin',
      label: 'Admin',
      module: 'Admin',
      icon: 'bi bi-sliders',
      children: [
        {
          pageId: 'workflow-setup',
          label: 'Workflow Setup',
          module: 'Admin',
          route: '/approval/workflow-setup',
          icon: 'bi bi-diagram-3',
          group: 'Workflow & Review',
          permissionKey: 'WORKFLOW SETUP'
        },
        {
          pageId: 'approval-user-setup',
          label: 'Approval User Setup',
          module: 'Admin',
          route: '/approval/setup',
          icon: 'bi bi-person-check',
          group: 'Workflow & Review',
          permissionKey: 'APPROVAL SETUP'
        },
        {
          pageId: 'approvers-group',
          label: 'Approvers Group',
          module: 'Admin',
          route: '/approval/approversgroup',
          icon: 'bi bi-people',
          group: 'Workflow & Review',
          permissionKey: 'AG'
        },
        {
          pageId: 'approval-entries',
          label: 'Approval Entries',
          module: 'Admin',
          route: '/approval/entry',
          icon: 'bi bi-check2-square',
          group: 'Workflow & Review',
          permissionKey: 'APPROVAL ENTRIES'
        },
        {
          pageId: 'approved-entries',
          label: 'Approved Entries',
          module: 'Admin',
          route: '/approval/approved-entry',
          icon: 'bi bi-check2-all',
          group: 'Workflow & Review',
          permissionKey: 'APPROVED ENTRIES'
        },
        {
          pageId: 'document-review-user-setup',
          label: 'Document Review User Setup',
          module: 'Admin',
          route: '/approval/review-user-setup',
          icon: 'bi bi-person-lines-fill',
          group: 'Workflow & Review',
          permissionKey: 'DOCUMENT REVIEW USER SETUP'
        },
        {
          pageId: 'review-entries',
          label: 'Review Entries',
          module: 'Admin',
          route: '/approval/review-entry',
          icon: 'bi bi-list-check',
          group: 'Workflow & Review',
          permissionKey: 'REVIEW ENTRIES'
        },
        {
          pageId: 'budget-request',
          label: 'Budget Request',
          module: 'Admin',
          route: '/approval/budget-request',
          icon: 'bi bi-clipboard-data',
          group: 'Workflow & Review',
          permissionKey: 'BR'
        },
        {
          pageId: 'user-setup',
          label: 'User Setup',
          module: 'Admin',
          route: '/admin/permission/users',
          icon: 'bi bi-people',
          group: 'Permission Setup',
          permissionKey: 'USERS'
        },
        {
          pageId: 'company-setup',
          label: 'Company Information',
          module: 'Admin',
          route: '/admin/permission/company-information',
          openMode: 'popup',
          icon: 'bi bi-building',
          group: 'Permission Setup',
          permissionKey: 'COMPANIES'
        },
        {
          pageId: 'companies',
          label: 'Companies',
          module: 'Admin',
          route: '/admin/permission/companies',
          openMode: 'popup',
          icon: 'bi bi-table',
          group: 'Permission Setup',
          permissionKey: 'COMPANIES'
        },
        {
          pageId: 'role-setup',
          label: 'Role Setup',
          module: 'Admin',
          route: '/admin/permission/roles',
          openMode: 'popup',
          icon: 'bi bi-person-gear',
          group: 'Permission Setup',
          permissionKey: 'ROLES'
        },
        {
          pageId: 'permission-set-setup',
          label: 'Permission Set Setup',
          module: 'Admin',
          route: '/admin/permission/permission-sets',
          openMode: 'popup',
          icon: 'bi bi-shield-check',
          group: 'Permission Setup',
          permissionKey: 'PERMISSION SETS'
        },
        {
          pageId: 'application-page-setup',
          label: 'Application Page Setup',
          module: 'Admin',
          route: '/admin/permission/app-pages',
          openMode: 'popup',
          icon: 'bi bi-layout-text-window',
          group: 'Permission Setup',
          permissionKey: 'APP PAGES'
        },
        {
          pageId: 'page-field-setup',
          label: 'Page Field Setup',
          module: 'Admin',
          route: '/admin/permission/page-fields',
          icon: 'bi bi-input-cursor-text',
          group: 'Permission Setup',
          permissionKey: 'PAGE FIELDS'
        },
        {
          pageId: 'permission-field-rule-setup',
          label: 'Permission Field Rule Setup',
          module: 'Admin',
          route: '/admin/permission/field-rules',
          openMode: 'popup',
          icon: 'bi bi-shield-lock',
          group: 'Permission Setup',
          permissionKey: 'FIELD PERMISSIONS'
        },
        {
          pageId: 'active-users',
          label: 'Active Users',
          module: 'Admin',
          route: '/users/activeUser',
          icon: 'bi bi-person-check',
          group: 'Users & Roles',
          permissionKey: 'ACTIVE USER'
        },
        {
          pageId: 'portal-reasons',
          label: 'Portal Reasons',
          module: 'Admin',
          route: '/users/portal-reasons',
          icon: 'bi bi-chat-square-text',
          group: 'Users & Roles',
          permissionKey: 'PORTAL REASON'
        },
        {
          pageId: 'company-permissions',
          label: 'Company Permissions',
          module: 'Admin',
          route: '/users/company-permissions',
          icon: 'bi bi-building-lock',
          group: 'Access Control',
          permissionKey: 'COMPANY PERMISSIONS'
        },
        {
          pageId: 'access-centers',
          label: 'Access Centers',
          module: 'Admin',
          route: '/access-center/list',
          icon: 'bi bi-diagram-3',
          group: 'Access Control',
          permissionKey: 'ACCESS CENTER'
        },
        {
          pageId: 'access-center-permissions',
          label: 'Access Center Permissions',
          module: 'Admin',
          route: '/access-center/permissions',
          icon: 'bi bi-shield-lock',
          group: 'Access Control',
          permissionKey: 'ACCESS CENTER PERMISSIONS'
        },
        {
          pageId: 'portal-setup',
          label: 'Portal Setup',
          module: 'Admin',
          route: '/users/portalSetup',
          icon: 'bi bi-gear',
          group: 'System Setup',
          permissionKey: 'PORTAL SETUP'
        },
        {
          pageId: 'attachment-types',
          label: 'Attachment Types',
          module: 'Admin',
          route: '/attachments/types',
          icon: 'bi bi-paperclip',
          group: 'System Setup',
          permissionKey: 'DocumentAttachmentTypes'
        },
        {
          pageId: 'document-attachments',
          label: 'Document Attachments',
          module: 'Admin',
          route: '/attachments/documents',
          icon: 'bi bi-files',
          group: 'System Setup',
          permissionKey: 'DocumentAttachments'
        },
        {
          pageId: 'email-templates',
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
    const item = this.items.find((menuItem) => this.normalize(menuItem.module) === normalizedKey || this.normalize(menuItem.pageId) === normalizedKey);

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
      const isSearchablePage = Boolean(item.pageId?.trim() || item.route?.trim());
      const current: MenuSearchItem[] = isSearchablePage
        ? [{ ...item, moduleLabel }]
        : [];

      const children = item.children ? this.collectSearchItems(item.children, moduleLabel) : [];

      return [...current, ...children];
    });
  }

  private matchesQuery(item: MenuSearchItem, normalizedQuery: string): boolean {
    return [item.label, item.moduleLabel, item.group, item.pageId, item.route]
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
      .filter((item) => this.shouldIncludeItem(item))
      .map((item) => {
        const children = item.children ? this.filterItems(item.children) : undefined;
        const route = this.getMigratedRoute(item.route);
        
        // If item has pageId but no route, check if it's actually registered
        // If not registered, clear pageId to show "Coming soon"
        const pageId = item.pageId && !route && !isPageIdRegistered(item.pageId) 
          ? '' 
          : item.pageId;

        return {
          ...item,
          pageId,
          route,
          children
        };
      });
  }

  private shouldIncludeItem(item: MenuItem): boolean {
    if (item.route && this.migratedRoutes.has(item.route)) {
      return this.permissionService.canView(item.pageId);
    }

    return this.permissionService.hasPermission(item.permissionKey);
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

