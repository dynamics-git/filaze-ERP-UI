# RunModal Progress

Last updated: 2026-05-13
Owner: ERP shared runtime track

## Goal
Build a BC-style shared RunModal framework where:
- buttons pass only page id and optional mode/size,
- shared runtime resolves config, loads data, and handles popup actions,
- page TS remains minimal (no duplicated popup business logic).

## Confirmed Decisions
- Keep architecture config-driven.
- Avoid per-page popup blueprint duplication.
- Use shared resolver for page config loading.
- Use relation metadata for child APIs (parent/child endpoint composition).
- Keep styling aligned with existing brand tokens (no custom visual invention).

## Current Status
### Implemented
- Shared RunModal open path in `src/app/shared/erp-core/services/run-modal.service.ts`.
- Popup action routing through shared host in `src/app/shared/erp-core/components/popup-host/popup-host.ts`.
- Config-driven open from Purchase Invoice and Purchase Order button metadata.
- Relation binding for Prepayment:
  - `parentEndpoint: '/purchaseInvoiceLines'`
  - `childCollection: 'portalInvPrePayments'`
  - `parentIdFields: ['Id', 'id', 'lineId', 'LineId']`
- Shared line renderer upgrades:
  - readonly line columns supported,
  - row index carried in line action payload,
  - single/multi delete aligned with selected row indexes.

### In Progress
- Verify payload shaping for prepayment save/apply/delete to match old behavior exactly.
- Confirm line/header readonly rules and editable fields across all run-modal entry points.

## Known Open Items
- Ensure `remainingAmount` is not incorrectly posted/updated in payload where backend expects computed value.
- Ensure autosave/create/update uses correct endpoint semantics for relation mode.
- Validate behavior for header-button and factbox-button launch contexts when no active line is selected.
- Add optional explicit id source priority in relation config only if needed by new pages.

## Next Steps (Ordered)
1. Lock prepayment payload contract to old reference behavior.
2. Validate apply/save/delete network calls against expected API shape.
3. Add focused test checklist per entry point (line/header/factbox).
4. Keep this doc updated after each significant change.

## Quick Test Checklist
- Open Purchase Invoice -> click Pre payment -> popup opens.
- Prepayment list loads from relation endpoint.
- Edit percentage/amount -> save/apply works.
- Delete selected line works for single and multi selection.
- Open Purchase Order from Prepayment process button via RunModal.
- Active row indication is visible and not style-breaking.

## Change Log
- 2026-05-13: Added shared RunModal document and baseline status.

## Update Template
Use this block for each update:

```
### YYYY-MM-DD HH:mm
- Change:
- Files:
- Why:
- Result:
- Follow-up:
```
