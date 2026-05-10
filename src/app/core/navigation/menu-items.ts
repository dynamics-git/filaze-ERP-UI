import { ErpMenuModule } from './menu.model';

export const FILAZ_MENU_MODULES: ErpMenuModule[] = [
  {
    key: 'procurement',
    title: 'Procurement',
    icon: 'bi bi-bag',
    groups: [
      {
        id: 'procurement-requisitions',
        title: 'Requisitions',
        icon: 'bi bi-file-earmark-text',
        children: [
          { id: 'purchase-requisition', title: 'Purchase Requisition', route: '/purchase/requisition', pageKey: 'PR' },
          { id: 'bid-waiver', title: 'Bid Waiver', route: '/purchase/PRBidWaiver', pageKey: 'PRBidWaiver' },
          { id: 'vendor-selection', title: 'Vendor Selection', route: '/purchase/PR-Vender-Selection', pageKey: 'PR-VS' },
          { id: 'approved-requisitions', title: 'Approved Requisitions', route: '/purchase/approved-pr', pageKey: 'APR' },
          { id: 'archived-requisitions', title: 'Archived Requisitions', route: '/purchase/archived-requisition', pageKey: 'ArchivedPR' },
          { id: 'cancelled-requisitions', title: 'Cancelled Requisitions', route: '/purchase/cancelled-pr', pageKey: 'PRC' }
        ]
      },
      {
        id: 'procurement-purchase',
        title: 'Purchase',
        icon: 'bi bi-cart',
        children: [
          { id: 'purchase-quote', title: 'Purchase Quote', route: '/purchase/quote', pageKey: 'PQ' },
          { id: 'purchase-order', title: 'Purchase Order', route: '/purchase/order', pageKey: 'PO' },
          { id: 'variation-order', title: 'Variation Order', route: '/purchase/variation-order', pageKey: 'VO' },
          { id: 'purchase-invoice', title: 'Purchase Invoice', route: '/purchase-invoice', pageKey: 'PI' },
          { id: 'purchase-credit-memo', title: 'Purchase Credit Memo', route: '/purchase/purchase-Credit-Memo', pageKey: 'PCM' }
        ]
      },
      {
        id: 'procurement-vendor-management',
        title: 'Vendor Management',
        icon: 'bi bi-shop',
        children: [
          { id: 'vendors', title: 'Vendors', route: '/vendor/register', pageKey: 'REGISTER VENDOR' }
        ]
      },
      {
        id: 'procurement-history',
        title: 'Procurement History',
        icon: 'bi bi-archive',
        children: [
          { id: 'goods-received-note', title: 'Goods Received Note', route: '/purchase/receipt', pageKey: 'POSTED PURCHASE RECEIPT' },
          { id: 'cancelled-purchase-orders', title: 'Cancelled Purchase Orders', route: '/purchase/order-cancelled', pageKey: 'POC' },
          { id: 'posted-purchase-invoices', title: 'Posted Purchase Invoices', route: '/purchase/postedinvoice', pageKey: 'POSTED PURCHASE INVOICE' },
          { id: 'posted-prepayment-purchase-invoices', title: 'Posted Prepayment Purchase Invoices', route: '/purchase/prepaymentpostedinvoice', pageKey: 'PRE-PAYMENT POSTED PURCHASE INVOICE' },
          { id: 'posted-purchase-credit-memos', title: 'Posted Purchase Credit Memos', route: '/purchase/postedpurchase-Credit-Memo', pageKey: 'PPCM' },
          { id: 'archived-purchase-orders', title: 'Archived Purchase Orders', route: '/purchase/archived-order', pageKey: 'ArchivedPO' },
          { id: 'archived-purchase-quotes', title: 'Archived Purchase Quotes', route: '/purchase/archived-quote', pageKey: 'ArchivedPQ' }
        ]
      }
    ]
  },
  {
    key: 'claims',
    title: 'Employee Claims',
    icon: 'bi bi-cash-coin',
    groups: [
      {
        id: 'claims-documents',
        title: 'Claims',
        icon: 'bi bi-receipt',
        children: [
          { id: 'employee-claim', title: 'Employee Claim', route: '/claim/employeeclaim', pageKey: 'EMP CLAIM' }
        ]
      },
      {
        id: 'claim-processing',
        title: 'Claim Processing',
        icon: 'bi bi-cash-coin',
        children: [
          { id: 'finance-claim-review', title: 'Finance Claim Review', route: '/claim/finance-claim-review', pageKey: 'FINANCE CLAIM REVIEW' },
          { id: 'claim-payment', title: 'Claim Payment', route: '/claim/claimpayment', pageKey: 'CLAIM PAYMENTS' },
          { id: 'payment-journal', title: 'Payment Journal', route: '/claim/payment-journal', pageKey: 'Payment Journal' }
        ]
      },
      {
        id: 'claim-setup',
        title: 'Claim Setup',
        icon: 'bi bi-sliders',
        children: [
          { id: 'claim-setup', title: 'Claim Setup', actionKey: 'claimSetup', pageKey: 'CLAIM SETUP' },
          { id: 'claim-types', title: 'Claim Types', route: '/claim/claimtype', pageKey: 'CLAIM_TYPE' },
          { id: 'expense-type-setup', title: 'Expense Type Setup', route: '/claim/expensetypesetup', pageKey: 'EXPENSE_TYPE_SETUP' },
          { id: 'employees', title: 'Employees', route: '/claim/employee', pageKey: 'EMP' },
          { id: 'employee-roles', title: 'Employee Roles', route: '/claim/employee-role', pageKey: 'EMP_ROLE' }
        ]
      }
    ]
  },
  {
    key: 'sales-cash',
    title: 'Sales & Cash',
    icon: 'bi bi-cart',
    groups: [
      {
        id: 'sales',
        title: 'Sales',
        icon: 'bi bi-bag',
        children: [
          { id: 'sales-order', title: 'Sales Order', route: '/sales/salesOrder', pageKey: 'SO' },
          { id: 'sales-invoice', title: 'Sales Invoice', route: '/sales/salesInvoice', pageKey: 'SI' },
          { id: 'sales-credit-memo', title: 'Sales Credit Memo', route: '/sales/sales-Credit-Memo', pageKey: 'SCM' }
        ]
      },
      {
        id: 'petty-cash',
        title: 'Petty Cash',
        icon: 'bi bi-wallet2',
        children: [
          { id: 'petty-cash-journal', title: 'Petty Cash Journal', route: '/journal/claim', pageKey: 'CLAIM JOURNAL' },
          { id: 'submitted-petty-cash', title: 'Submitted Petty Cash', route: '/journal/submitted-claim', pageKey: 'SUBMITTED CLAIM JOURNAL' }
        ]
      }
    ]
  },
  {
    key: 'workflow',
    title: 'Workflow & Review',
    icon: 'bi bi-check2-square',
    groups: [
      {
        id: 'workflow-review',
        title: 'Approvals & Review',
        icon: 'bi bi-check2-square',
        children: [
          { id: 'workflow-setup', title: 'Workflow Setup', route: '/approval/workflow-setup', pageKey: 'WORKFLOW SETUP' },
          { id: 'approval-user-setup', title: 'Approval User Setup', route: '/approval/setup', pageKey: 'APPROVAL SETUP' },
          { id: 'approvers-group', title: 'Approvers Group', route: '/approval/approversgroup', pageKey: 'AG' },
          { id: 'approval-entries', title: 'Approval Entries', route: '/approval/entry', pageKey: 'APPROVAL ENTRIES' },
          { id: 'review-entries', title: 'Review Entries', route: '/approval/review-entry', pageKey: 'REVIEW ENTRIES' },
          { id: 'budget-request', title: 'Budget Request', route: '/approval/budget-request', pageKey: 'BR' }
        ]
      }
    ]
  },
  {
    key: 'administration',
    title: 'Administration',
    icon: 'bi bi-sliders',
    groups: [
      {
        id: 'users-roles',
        title: 'Users & Roles',
        icon: 'bi bi-people',
        children: [
          { id: 'users', title: 'Users', route: '/users/users', pageKey: 'USERS' },
          { id: 'user-roles', title: 'User Roles', route: '/users/roles', pageKey: 'USER ROLES' },
          { id: 'active-users', title: 'Active Users', route: '/users/activeUser', pageKey: 'ACTIVE USER' },
          { id: 'portal-reasons', title: 'Portal Reasons', route: '/users/portal-reasons', pageKey: 'PORTAL REASON' }
        ]
      },
      {
        id: 'access-control',
        title: 'Access Control',
        icon: 'bi bi-shield-lock',
        children: [
          { id: 'page-configuration', title: 'Page Configuration', route: '/users/pages', pageKey: 'PAGE CONFIGURATION' },
          { id: 'company-permissions', title: 'Company Permissions', route: '/users/company-permissions', pageKey: 'COMPANY PERMISSIONS' },
          { id: 'responsibility-centers', title: 'Responsibility Centers', route: '/responsibility/list', pageKey: 'RESPONSIBILITY CENTER' },
          { id: 'responsibility-permissions', title: 'Responsibility Permissions', route: '/responsibility/permissions', pageKey: 'RESPONSIBILITY PERMISSIONS' }
        ]
      },
      {
        id: 'system-setup',
        title: 'System Setup',
        icon: 'bi bi-gear',
        children: [
          { id: 'portal-setup', title: 'Portal Setup', actionKey: 'portalSetup', pageKey: 'PORTAL SETUP' },
          { id: 'attachment-types', title: 'Attachment Types', route: '/attachments/types', pageKey: 'DocumentAttachmentTypes' },
          { id: 'document-attachments', title: 'Document Attachments', route: '/attachments/documents', pageKey: 'DocumentAttachments' },
          { id: 'email-templates', title: 'Email Templates', route: '/template/email', pageKey: 'EmailTemplate' }
        ]
      }
    ]
  }
];
