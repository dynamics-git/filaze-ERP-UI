# Filaz ERP Core Work Update

## Current Direction

- New Filaz ERP architecture stays config-driven.
- Dashboard/List visual design is the source of truth for list pages.
- Entry dialog visual design is the source of truth for document popups.
- Old app is reference for API/logic only, not UI.
- Do not add page-specific SCSS for real ERP pages unless explicitly approved.

## Current Stable Pieces

- `erp-list-page` is the shared list composition surface.
- Purchase Order uses `erp-list-page` for the list-first flow.
- Purchase Order row click selects/factbox context; primary/open action is separate.
- Global REST response normalization is connected through `UnicodeNormalizer`.
- Purchase Order list supports paged loading and infinite-scroll trigger.
- Shared Filaz loader styles were added for list loading states.
- Existing top `app-actions` can receive page commands through `ActionDispatcherService`.

## Visual Rules

- Keep finalized Filaz UI intact.
- Preserve dashboard spacing, row height, checkbox placement, sticky columns, factbox rhythm.
- Preserve entry-dialog modal proportions, commandbar spacing, section cards, and factbox style.
- Do not invent new colors. Use existing CSS variables from `_tokens.scss`.
- Prefer shared styles/components over page-specific styles.

## Important Files

- List visual reference:
  - `src/app/features/dashboard/dashboard-page/dashboard-page.html`
  - `src/app/features/dashboard/dashboard-page/dashboard-page.scss`

- Entry popup visual reference:
  - `src/app/layout/entry-dialog/entry-dialog.html`
  - `src/app/layout/entry-dialog/entry-dialog.scss`

- Shared list implementation:
  - `src/app/shared/erp-core/components/list-page/list-page.ts`
  - `src/app/shared/erp-core/components/list-page/list-page.html`
  - `src/app/shared/erp-core/components/list-page/list-page.scss`

- Purchase Order page:
  - `src/app/pages/purchase-order/purchase-order.ts`
  - `src/app/pages/purchase-order/purchase-order.html`
  - `src/app/pages/purchase-order/purchase-order.config.ts`

- API/data foundation:
  - `src/app/core/services/rest.service.ts`
  - `src/app/core/utils/unicode-normalizer.ts`
  - `src/app/shared/erp-core/services/data-source.service.ts`

## Known Issues To Review Next

- Purchase Order refresh/load behavior must be verified after hard browser refresh.
- Module menu must close on outside click, Escape, and navigation consistently.
- Infinite loading should show the new Filaz loader clearly on first load and next-page load.
- Purchase Order list should not show placeholder rows when API returns no data.
- Document popup should be rebuilt from the entry-dialog visual structure before continuing document work.

## Build Status

- `npm run build` passes.
- Existing warnings:
  - Initial bundle budget warning.
  - Component SCSS budget warnings for large visual files.
  - `crypto-js` CommonJS warning.

## Next Safe Step

1. Verify `/purchase-order` hard refresh loads rows without needing a click.
2. Verify module menu closes on outside click/Escape/navigation.
3. Verify loader appears during initial list loading and infinite scroll.
4. Only after list flow is stable, map entry-dialog design into the config-driven document popup.

