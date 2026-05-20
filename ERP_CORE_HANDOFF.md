# ERP Core Handoff

## Purpose
This document explains the current ERP-core structure after cleanup, what is active, what was deleted, and the rules future work should follow.

## Current Direction
The codebase is moving toward a dynamic enterprise-style page system where page metadata, commands, list layout, and factbox data come from page config instead of being hardcoded in layout components.

Current policy:
- Keep UI behavior stable.
- Prefer config-driven page metadata.
- Allow safe fallback to existing static values where a page has not been mapped yet.
- Do not add duplicate UI ownership across layout, popup host, and page components.

## Active Runtime Pieces

### List and popup entry flow
Used by Purchase Order, Purchase Invoice, and Prepayment.
- `src/app/shared/erp-core/components/list-page/`
- `src/app/shared/erp-core/components/popup-host/`
- `src/app/layout/entry-dialog/`
- `src/app/shared/erp-core/components/command-bar/`
- `src/app/shared/erp-core/components/list-fact-panel/`
- `src/app/shared/erp-core/components/form-renderer/`
- `src/app/shared/erp-core/components/line-renderer/`
- `src/app/shared/erp-core/components/fact-panel-renderer/`
- `src/app/shared/erp-core/services/action-dispatcher.service.ts`
- `src/app/shared/erp-core/services/data-source.service.ts`
- `src/app/shared/erp-core/services/entry-state.service.ts`
- `src/app/shared/erp-core/services/line-calculation.service.ts`
- `src/app/shared/erp-core/services/line-command.service.ts`
- `src/app/shared/erp-core/services/popup-stack.service.ts`
- `src/app/shared/erp-core/services/run-modal.service.ts`
- `src/app/pages/purchase-order/purchase-order.ts`
- `src/app/pages/purchase-order/purchase-order.config.ts`
- `src/app/pages/purchase-invoice/`
- `src/app/pages/prepayment/`

## Config Ownership Rules

### Purchase Order list page
`src/app/pages/purchase-order/purchase-order.config.ts` is the source for:
- list command config
- list data surface columns
- factbox sections
- mapped page metadata for actions header

Mapped metadata currently used by the action bar:
- `title`
- `module`
- `company`
- `viewSuffix`

Removed as dead metadata from purchase order list page config because not consumed:
- `id`
- `subtitle`
- `pageType`

### Action bar fallback behavior
`src/app/layout/actions/actions.ts` now supports config-driven page context with route fallback.

Meaning:
- If a page calls `setPageContext(...)`, the action header uses config values.
- If a page does not provide context yet, old route-based static values still render.

This is temporary transitional behavior and should be preserved until all pages are mapped.

## Deleted Dead Files
These had no runtime consumers and were removed.

- `src/app/shared/erp-core/components/form/form.ts`
- `src/app/shared/erp-core/components/form/form.html`
- `src/app/shared/erp-core/components/form/form.scss`
- `src/app/shared/erp-core/components/shell/shell.ts`
- `src/app/shared/erp-core/components/shell/shell.html`
- `src/app/shared/erp-core/components/shell/shell.scss`
- `src/app/shared/erp-core/services/page-state.service.ts`
- `src/app/shared/erp-core/configs/command-bar-sample.config.ts`
- `src/app/shared/erp-core/examples/purchase-invoice/purchase-invoice.mock-data.ts`

Also cleaned:
- `src/app/shared/erp-core/index.ts`
- `src/app/shared/erp-core/examples/purchase-invoice/index.ts`

## Important Architecture Notes

### 1. Avoid duplicate ownership
Do not let the same UI concern live in multiple places.

Examples:
- Popup page visual shell should have one owner.
- List page heading metadata should not be hardcoded in multiple places.
- Commands should not be defined both in page config and unrelated layout code unless fallback is intentional.

### 2. Prefer page config over route hardcoding
For enterprise scalability, each page should eventually provide:
- page metadata
- commands
- views
- list/document surface config
- factbox config

Layout should render from that contract whenever possible.

### 3. Keep fallback only while migrating
Fallbacks are acceptable during migration, but once a page is fully mapped the static duplicate should be removed.

### 4. Keep ERP-core generic
Avoid importing layout-specific components into generic core unless intentionally accepted as a temporary bridge.
Current popup flow still has some coupling to layout entry dialog and should be revisited later.

## Known Follow-up Items

### Purchase Order config review
Current file contains an extra factbox section named `BaseLine` that duplicates audit-style fields.
This is not dead in runtime because factbox renders all configured sections, but it should be reviewed for business correctness.

### Next structural target
Recommended future contract for each enterprise page:
- page context
- commands
- standard actions
- views
- data source
- data surface
- factbox
- popup/document config when that page supports entry mode

## Implementation Rule For Future Coders
When adding or changing a page:
1. Put page-specific metadata in page config first.
2. Reuse existing shared models when possible.
3. Only add new shared components if at least one real page uses them.
4. Do not create sample/demo config inside runtime folders unless it has a real consumer.
5. Before adding a new generic component, verify an existing one cannot be made dynamic.
6. Preserve current UI while migrating static values into config-driven values.

## Validation Status
After cleanup:
- No errors in touched files.
- No remaining references to the deleted runtime files.

## Coder Import Contract (Mandatory)
This rule is now mandatory for all new and updated pages.

### Approved import entry
Use shared core only through:
- `src/app/shared/erp-core/public-api.ts`

### Forbidden import pattern
Do not import from deep core internals in page files, for example:
- `src/app/shared/erp-core/services/...`
- `src/app/shared/erp-core/models/...`
- `src/app/shared/erp-core/components/...`
- `src/app/shared/erp-core/constants/...`

Reason:
- Keep page code minimal.
- Keep core internals hidden and package-safe.
- Prevent coder dependency on unstable internal paths.

### Reference pages coders must follow
- `src/app/pages/purchase-order/purchase-order.ts`
- `src/app/pages/purchase-invoice/purchase-invoice.ts`
- `src/app/pages/prepayment/prepayment.ts`

### Change policy for shared core
If core internals change:
- Page coders should not need edits unless public contract changes.
- Only `public-api.ts` and approved exported contracts are considered stable integration surface.

### Review checklist (required before merge)
1. Page imports shared core from `public-api.ts` only.
2. No deep core import paths in the page file.
3. Page-specific behavior remains in page config or page logic.
4. Shared logic changes are implemented in core once, not duplicated per page.
