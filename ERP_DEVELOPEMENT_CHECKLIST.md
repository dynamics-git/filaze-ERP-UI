# ERP Developement Checklist

Last updated: 2026-06-11

Use this as the living checklist for ERP UI development.
After each development task, update the relevant status before moving to the next task.

Status legend:

- `[x]` done
- `[ ]` not started
- `[~]` partially done / needs review
- `[!]` blocked or needs decision

---

## 1) Foundation

- [x] Shared ERP core exists
- [x] List runtime exists
- [x] Document runtime exists
- [x] Popup / RunModal engine exists
- [x] Global search UI exists
- [x] Dynamic config discovery exists
- [x] Development guide exists
- [x] Purchase Order reference page exists
- [x] Customer Master page exists
- [x] Customer Ledger Entry config exists

---

## 2) Core Features To Review / Complete

- [ ] Confirm global search expected behavior
- [ ] Confirm page launcher behavior: route vs RunModal
- [ ] Confirm shared page registry requirements
- [ ] Confirm menu migration strategy
- [ ] Confirm permission handling strategy
- [~] Review Filaz Enterprise Permission Framework PDF
- [ ] Confirm business command handling pattern
- [ ] Confirm page verification checklist

---

## 3) Permission Framework / Security Engine

Source document:

- Filaz Enterprise Permission Framework.pdf

Goal:

- Build one shared Filaz Platform Security Engine for ERP, WorkHub, and future Filaz products.

Backend API guide:

- Permission APIs - Frontend Payload and Response Guide
- Base URL: `/api/tecsa/procure/v1.0`
- Main frontend endpoint: `GET /effective-permissions?application_code=ERP`

### 3.1 Permission Foundation

- [x] Confirm permission framework scope
- [x] Confirm ERP and WorkHub should share one permission engine
- [x] Confirm application code: ERP
- [x] Do not use FILAZ_ prefix for ERP application code
- [ ] Confirm module codes from current menu structure
- [x] Confirm frontend should use pageCode for permission mapping
- [~] Confirm page codes for existing migrated pages
- [ ] Confirm super admin behavior
- [~] Confirm permission cache strategy
- [x] Confirm effective permissions load after login

Initial page code mapping:

| Frontend area | Backend pageCode |
| --- | --- |
| purchase-order | PURCHASE_ORDER |
| customer-master / customers route | CUSTOMER_MASTER |
| customer-ledger-entry | CUSTOMER_LEDGER_ENTRY |

### 3.2 Database / Backend Tables

- [ ] filaz_applications
- [ ] filaz_modules
- [ ] filaz_pages
- [ ] filaz_users
- [ ] filaz_roles
- [ ] filaz_user_roles
- [ ] filaz_permission_sets
- [ ] filaz_role_permission_sets
- [ ] filaz_page_permissions
- [ ] filaz_field_permissions
- [ ] filaz_data_access_rules
- [ ] filaz_permission_audit_logs
- [ ] Foreign keys and unique indexes
- [ ] Laravel migrations
- [ ] Backend permission validation service
- [ ] Backend data access query filtering
- [ ] Permission audit service

### 3.3 Permission Admin Pages

- [x] Applications
- [x] Modules
- [x] Pages
- [ ] Users
- [x] User Roles
- [x] Roles
- [x] Permission Sets
- [x] Role Permission Sets
- [x] Page Permissions
- [ ] Permission Matrix
- [x] Field Permissions
- [x] Data Access Rules
- [ ] Effective Permissions
- [x] Permission Audit Log

### 3.4 Frontend Permission Integration

- [x] Confirm permission payload after login
- [x] Implement permission payload after login
- [x] Menu item filtering by page view permission
- [x] Route guard direct URL blocking
- [x] Command/button permission mapping
- [x] List standard action permission mapping
- [x] Header command permission mapping
- [x] Line command permission mapping
- [x] Field renderer permission mapping
- [x] Field visibility/editability/required/disabled/masked rules
- [~] Record-level access awareness in list pages
- [ ] Effective permission preview

### 3.6 Permission Structure (Multi-App)

- [x] Add company-scoped Applications admin page (`/applications`)
- [x] Add company-scoped Modules admin page (`/modules`)
- [x] Add company-scoped Pages admin page (`/pages`)
- [x] Add FK dropdown chaining in forms:
	- [x] `modules.application_id -> /applications`
	- [x] `pages.module_id -> /modules`
	- [x] Permission pages continue dropdown-oriented design for FK fields
- [x] Add routes under Admin > Security for Applications/Modules/Pages
- [x] Add menu entries under Admin security group for Applications/Modules/Pages
- [x] Validate response mapping against Laravel `{ data: [] }` shape
- [~] Build and smoke test CRUD flows for all three pages

Frontend implementation order:

1. Inspect current `PermissionService`, auth flow, route guard, menu filtering, command rendering, and form renderer.
2. [x] Add frontend models for the effective permissions payload.
3. [x] Extend `PermissionService` to load and cache `/effective-permissions?application_code=ERP`.
4. [x] Load effective permissions immediately after login.
5. [x] Add `pageCode` to routes, menu items, and/or page configs.
6. [x] Filter menu items using `can_view`.
7. [x] Block direct routes using `can_view`.
8. [x] Apply command and standard action permissions.
9. [x] Apply field permissions in shared form rendering.
10. [~] Store data access rules for display/debug, while backend enforces record access.

Command permission map:

| UI action / command | Backend permission |
| --- | --- |
| View / Open | can_view |
| New / Add / Insert | can_insert |
| Edit / Save / Update | can_edit |
| Delete / Remove | can_delete |
| Submit / Send Approval Request / Submit Workflow | can_submit |
| Approve / Review | can_approve |
| Reject | can_reject |
| Reopen / Re-Open | can_reopen |
| Cancel / Cancel Approval Request / Cancel Workflow | can_cancel |
| Assign | can_assign |
| Export / Export File | can_export |
| Print | can_print |
| Post | can_post |
| Archive | can_archive |

### 3.5 Permission Rules To Enforce

- [ ] If canView is false, all other page actions are treated as false
- [ ] If field visible is false, editable/required/masked must be treated as false
- [ ] Frontend permission hiding is UI-only
- [ ] Backend must validate every protected action
- [ ] Audit log must be append-only
- [ ] Audit log must not cascade-delete
- [ ] Permission changes must clear or refresh permission cache

---

## 4) Pages To Discuss One By One

- [ ] Purchase Order
- [ ] Customer Master
- [ ] Customer Ledger Entry
- [ ] Vendor Master
- [ ] Item Master
- [ ] Sales Order
- [ ] Sales Invoice
- [ ] Purchase Requisition
- [ ] Purchase Quote
- [ ] Goods Received Note
- [ ] Payment Journal
- [ ] Employee Claim
- [ ] Claim Setup pages
- [ ] Approval / Workflow pages
- [ ] Admin setup pages
- [ ] Inventory pages
- [ ] Manufacturing pages
- [ ] Project pages
- [ ] Reports

---

## 5) Per-Page Development Checklist

Use this for every page selected for development.

- [ ] Confirm page type: list, card, document, worksheet, setup, report
- [ ] Confirm API endpoint
- [ ] Confirm primary key field
- [ ] Confirm document/display number field
- [ ] Confirm create fields
- [ ] Confirm update fields
- [ ] Confirm delete support
- [ ] Confirm list columns
- [ ] Confirm header fields
- [ ] Confirm line fields, if any
- [ ] Confirm parent/line relation, if any
- [ ] Confirm dropdown APIs and mappings
- [ ] Confirm formulas/totals, if any
- [ ] Confirm commands/buttons
- [ ] Confirm business API actions
- [ ] Confirm route
- [ ] Confirm menu entry
- [ ] Confirm search/launcher behavior
- [ ] Build page
- [ ] Run TypeScript check
- [ ] Run build
- [ ] Manual test

---

## 6) Development Log

Add completed work here as development progresses.

| Date | Area | Status | Notes |
| --- | --- | --- | --- |
| 2026-06-11 | Checklist | [x] | Created initial ERP development checklist. |
| 2026-06-11 | Permission Framework | [~] | Added checklist section from Filaz Enterprise Permission Framework PDF. |
| 2026-06-11 | Permission Backend Guide | [~] | Added confirmed backend API decisions: application_code ERP, pageCode mapping, after-login effective permission load, and command permission map. |
| 2026-06-11 | Permission Frontend Engine | [x] | Implemented effective permission loading after login, pageCode-based menu and route checks, command/action permissions, field permissions, and verified with TypeScript/build. |
| 2026-06-11 | Permission Admin Pages | [~] | Added config-driven Admin security pages for Roles, User Roles, Permission Sets, Role Permission Sets, Page Permissions, Field Permissions, Data Access Rules, and Permission Audit Logs. Effective Permissions and Matrix remain pending. |
| 2026-06-12 | Permission Structure (Applications/Modules/Pages) | [~] | Added Admin security pages, routes, menu entries, and FK dropdown links for Applications, Modules, and Pages based on company-scoped backend APIs. Build verified; manual CRUD smoke test pending. |
