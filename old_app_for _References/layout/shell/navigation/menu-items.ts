import { MenuGroup } from './models/menuGroup';

export interface MenuModule {
  key: string;
  title: string;
  items: MenuGroup[];
}

export const MENU_MODULES: MenuModule[] = [
  {
    key: 'procurement',
    title: 'Procurement',
    items: [
      {
        title: 'Requisitions',
        icon: 'bi bi-file-earmark-text',
        children: [
          { title: 'Purchase Requisition', link: '/purchase/requisition', page: 'PR' },
          { title: 'Bid Waiver', link: '/purchase/PRBidWaiver', page: 'PRBidWaiver' },
          { title: 'Vendor Selection', link: '/purchase/PR-Vender-Selection', page: 'PR-VS' },
          { title: 'Approved Requisitions', link: '/purchase/approved-pr', page: 'APR' },
          { title: 'Archived Requisitions', link: '/purchase/archived-requisition', page: 'ArchivedPR' },
          { title: 'Cancelled Requisitions', link: '/purchase/cancelled-pr', page: 'PRC' },
        ],
      },
      {
        title: 'Purchase',
        icon: 'bi bi-cart',
        children: [
          { title: 'Purchase Quote', link: '/purchase/quote', page: 'PQ' },
          { title: 'Purchase Order', link: '/purchase/order', page: 'PO' },
          { title: 'Variation Order', link: '/purchase/variation-order', page: 'VO' },
          { title: 'Purchase Invoice', link: '/purchase/invoice', page: 'PI' },
          { title: 'Purchase Credit Memo', link: '/purchase/purchase-Credit-Memo', page: 'PCM' },
        ],
      },
      {
        title: 'Vendor Management',
        icon: 'bi bi-shop',
        children: [
          { title: 'Vendors', link: '/vendor/register', page: 'REGISTER VENDOR' },
        ],
      },
      {
        title: 'Procurement History',
        icon: 'bi bi-archive',
        children: [
          { title: 'Goods Received Note', link: '/purchase/receipt', page: 'POSTED PURCHASE RECEIPT' },
          { title: 'Cancelled Purchase Orders', link: '/purchase/order-cancelled', page: 'POC' },
          { title: 'Posted Purchase Invoices', link: '/purchase/postedinvoice', page: 'POSTED PURCHASE INVOICE' },
          { title: 'Posted Prepayment Purchase Invoices', link: '/purchase/prepaymentpostedinvoice', page: 'PRE-PAYMENT POSTED PURCHASE INVOICE' },
          { title: 'Posted Purchase Credit Memos', link: '/purchase/postedpurchase-Credit-Memo', page: 'PPCM' },
          { title: 'Archived Purchase Orders', link: '/purchase/archived-order', page: 'ArchivedPO' },
          { title: 'Archived Purchase Quotes', link: '/purchase/archived-quote', page: 'ArchivedPQ' },
        ],
      },
      {
        title: 'Transport Management',
        icon: 'bi bi-truck',
        children: [
          { title: 'TMS Route Planning', link: '/tms/dashboard', page: 'PR' },
          { title: 'Freight Charge Setup', link: '/tms/setup/freight-charges', page: 'PR' },
          { title: 'Transporter Setup', link: '/tms/setup/transporters', page: 'PR' },
          { title: 'Truck Setup', link: '/tms/setup/trucks', page: 'PR' },
        ],
      },
      {
        title: 'Smart Document Import',
        icon: 'bi bi-file-earmark-arrow-up',
        children: [
          { title: 'Import Purchase Requisition', link: '/purchase/smart-document-import/import', page: 'PR' },
          { title: 'Vendor Draft Workspace', link: '/purchase/smart-document-import/drafts', page: 'PR' },
        ],
      },
    ],
  },
  {
    key: 'claims',
    title: 'Employee Claims',
    items: [
      {
        title: 'Claims',
        icon: 'bi bi-receipt',
        children: [
          { title: 'Employee Claim', link: '/claim/employeeclaim', page: 'EMP CLAIM' },
        ],
      },
      {
        title: 'Claim Processing',
        icon: 'bi bi-cash-coin',
        children: [
          { title: 'Finance Claim Review', link: '/claim/finance-claim-review', page: 'FINANCE CLAIM REVIEW' },
          { title: 'Claim Payment', link: '/claim/claimpayment', page: 'CLAIM PAYMENTS' },
          { title: 'Payment Journal', link: '/claim/payment-journal', page: 'Payment Journal' },
        ],
      },
      {
        title: 'Claim Reports',
        icon: 'bi bi-bar-chart',
        children: [
          { title: 'Claim Status', link: '/reports/claim-status', page: 'CLAIM_STATUS_REPORT' },
          { title: 'Monthly Claim Summary', link: '/reports/monthly-claim-summary', page: 'MONTHLY_CLAIM_SUMMARY' },
          { title: 'Expense Type Summary', link: '/reports/expense-type-summary', page: 'EXPENSE_TYPE_SUMMARY' },
        ],
      },
      {
        title: 'Claim History',
        icon: 'bi bi-archive',
        children: [
          { title: 'Posted Employee Claims', link: '/claim/posted-employee-claim', page: 'POSTED EMP CLAIM' },
        ],
      },
      {
        title: 'Claim Setup',
        icon: 'bi bi-sliders',
        children: [
          { title: 'Claim Setup', page: 'CLAIM SETUP', action: 'claimSetup' },
          { title: 'Claim Types', link: '/claim/claimtype', page: 'CLAIM_TYPE' },
          { title: 'Expense Type Setup', link: '/claim/expensetypesetup', page: 'EXPENSE_TYPE_SETUP' },
          { title: 'Entitlements', link: '/claim/entitlement', page: 'ENTITLEMENTS' },
          { title: 'Staff Groups', link: '/claim/staff-group', page: 'STAFF_GROUP' },
          { title: 'Departments', link: '/claim/department', page: 'DEPT' },
          { title: 'Employees', link: '/claim/employee', page: 'EMP' },
          { title: 'Employee Roles', link: '/claim/employee-role', page: 'EMP_ROLE' },
          { title: 'Claim Rule Setup', link: '/claim/ruleSetup', page: 'CLAIM_RULE_SETUP' },
        ],
      },
    ],
  },
  {
    key: 'sales-cash',
    title: 'Sales & Cash',
    items: [
      {
        title: 'Sales',
        icon: 'bi bi-bag',
        children: [
          { title: 'Sales Order', link: '/sales/salesOrder', page: 'SO' },
          { title: 'Sales Invoice', link: '/sales/salesInvoice', page: 'SI' },
          { title: 'Sales Credit Memo', link: '/sales/sales-Credit-Memo', page: 'SCM' },
        ],
      },
      {
        title: 'Sales History',
        icon: 'bi bi-archive',
        children: [
          { title: 'Posted Sales Invoices', link: '/sales/postedsalesInvoice', page: 'POSTED SI' },
          { title: 'Posted Sales Credit Memos', link: '/sales/postedsales-Credit-Memo', page: 'PSCM' },
        ],
      },
      {
        title: 'Petty Cash',
        icon: 'bi bi-wallet2',
        children: [
          { title: 'Petty Cash Journal', link: '/journal/claim', page: 'CLAIM JOURNAL' },
          { title: 'Submitted Petty Cash', link: '/journal/submitted-claim', page: 'SUBMITTED CLAIM JOURNAL' },
        ],
      },
    ],
  },
  {
    key: 'workflow',
    title: 'Workflow & Review',
    items: [
      {
        title: 'Approvals & Review',
        icon: 'bi bi-check2-square',
        children: [
          { title: 'Workflow Setup', link: '/approval/workflow-setup', page: 'WORKFLOW SETUP' },
          { title: 'Approval User Setup', link: '/approval/setup', page: 'APPROVAL SETUP' },
          { title: 'Approvers Group', link: '/approval/approversgroup', page: 'AG' },
          { title: 'Approval Entries', link: '/approval/entry', page: 'APPROVAL ENTRIES' },
          { title: 'Approved Entries', link: '/approval/approved-entry', page: 'APPROVED ENTRIES' },
          { title: 'Document Review User Setup', link: '/approval/review-user-setup', page: 'DOCUMENT REVIEW USER SETUP' },
          { title: 'Review Entries', link: '/approval/review-entry', page: 'REVIEW ENTRIES' },
          { title: 'Budget Request', link: '/approval/budget-request', page: 'BR' },
        ],
      },
    ],
  },
  {
    key: 'administration',
    title: 'Administration',
    items: [
      {
        title: 'Users & Roles',
        icon: 'bi bi-people',
        children: [
          { title: 'Users', link: '/users/users', page: 'USERS' },
          { title: 'User Roles', link: '/users/roles', page: 'USER ROLES' },
          { title: 'Active Users', link: '/users/activeUser', page: 'ACTIVE USER' },
          { title: 'Portal Reasons', link: '/users/portal-reasons', page: 'PORTAL REASON' },
        ],
      },
      {
        title: 'Access Control',
        icon: 'bi bi-shield-lock',
        children: [
          { title: 'Page Configuration', link: '/users/pages', page: 'PAGE CONFIGURATION' },
          { title: 'Company Permissions', link: '/users/company-permissions', page: 'COMPANY PERMISSIONS' },
          { title: 'Responsibility Centers', link: '/responsibility/list', page: 'RESPONSIBILITY CENTER' },
          { title: 'Responsibility Permissions', link: '/responsibility/permissions', page: 'RESPONSIBILITY PERMISSIONS' },
        ],
      },
      {
        title: 'System Setup',
        icon: 'bi bi-gear',
        children: [
          { title: 'Portal Setup', page: 'PORTAL SETUP', action: 'portalSetup' },
          { title: 'Attachment Types', link: '/attachments/types', page: 'DocumentAttachmentTypes' },
          { title: 'Document Attachments', link: '/attachments/documents', page: 'DocumentAttachments' },
          { title: 'Email Templates', link: '/template/email', page: 'EmailTemplate' },
        ],
      },
    ],
  },
];

export const MenuItems: MenuGroup[] = [
  ...(MENU_MODULES.find((m) => m.key === 'procurement')?.items ?? []),
  ...(MENU_MODULES.find((m) => m.key === 'claims')?.items ?? []),
  ...(MENU_MODULES.find((m) => m.key === 'sales-cash')?.items ?? []),
  ...(MENU_MODULES.find((m) => m.key === 'workflow')?.items ?? []),
  ...(MENU_MODULES.find((m) => m.key === 'administration')?.items ?? []),
];
