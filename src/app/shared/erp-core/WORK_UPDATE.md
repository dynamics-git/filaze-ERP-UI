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

## Backend ERP Database Progress (May 24, 2026)

- Migration state confirmed complete: no pending migrations (`php artisan migrate --force` returned Nothing to migrate).
- New ERP geography master APIs were added and route-registered:
  - `countryRegions`
  - `postCodes`
- Geography sample data seeders added and verified:
  - `CountryRegionSeeder`
  - `PostCodeSeeder`
- Default seeder updated to call the geography seeders and run successfully.
- Lightweight feature coverage added for geography API create/list flows and passing.
- Shared model trait compatibility fix applied in backend (`UsesSystemId`) to avoid PHP constant collision on newer runtime behavior.
- BC-driven enhancement milestone implemented:
  - `payment_term_translations` table created
  - `currency_exchange_rates` table created
  - Corresponding Eloquent models added
- BC-driven enhancement API layer implemented:
  - `paymentTermTranslations` CRUD routes + controller
  - `currencyExchangeRates` CRUD routes + controller
- Seeder and test coverage extended for these enhancements:
  - `PaymentTermTranslationSeeder`
  - `CurrencyExchangeRateSeeder`
  - `CurrencyAndPaymentTermEnhancementsApiTest` (passing)
- Currency adjustment run-history milestone completed:
  - `currency_rate_adjustment_runs` table created
  - `CurrencyRateAdjustmentRun` model added
  - `currencyRateAdjustmentRuns` API routes + controller added
  - `runRevaluation` now writes Started/Completed/Failed run logs
  - `CurrencyRateAdjustmentRunsApiTest` added and passing
- Currency revaluation rounding policy aligned to currency master settings:
  - hardcoded `round(..., 5)` removed from posting path
  - now uses `CurrencyCode.amountRoundingPrecision` + rounding method
  - safe fallback to legacy 5-decimal precision when policy is missing
  - verified by `CurrencyRevaluationPostingServiceRoundingTest`
- Currency run-history analytics added for operations visibility:
  - `currencyRateAdjustmentRuns/Summary`
  - `currencyRateAdjustmentRuns/RecentFailures`
  - `currencyRateAdjustmentRuns/ExportCsv`
  - supports filters: `status`, `currencyCode`, `runType`, `fromDate`, `toDate`
- Performance guards added for run-history endpoints:
  - list/recent-failures page size capped at 500
  - CSV export limit capped at 10,000 rows
- Small-batch retention module added for clean scale-up:
  - `currency_rate_adjustment_run_archives` table created
  - `currencyRateAdjustmentRuns/PruneHistory` endpoint added
  - supports `dryRun`, `archiveBeforePrune`, `olderThanDays`, `limit`
  - tested archive+prune flow in `CurrencyRateAdjustmentRunsApiTest`
- Scheduled backend retention process added:
  - artisan command: `currency:prune-runs`
  - safe dry-run and chunk options supported
  - scheduler entry runs daily at 02:00 with overlap protection
- Archive history consumer API added (small independent module):
  - `currencyRateAdjustmentRunArchives` list endpoint
  - `currencyRateAdjustmentRunArchives({systemId})` show endpoint
  - `currencyRateAdjustmentRunArchives/ExportCsv` export endpoint
  - focused coverage added in `CurrencyRateAdjustmentRunsApiTest`
- Archive KPI module added:
  - `currencyRateAdjustmentRunArchives/Summary` endpoint
  - grouped counts by archive reason and status
  - daily archive counts for selected time window
  - feature test coverage added
- Load-scale seed module added:
  - artisan command: `currency:seed-runs-load`
  - configurable volume, failure mix, archive ratio, and date spread
  - optional `--wipe-company` for repeatable perf test cycles
  - smoke-tested with synthetic run/archive output summary
- Dashboard consumer contract module added:
  - `currencyRateAdjustmentRuns/DashboardContract` endpoint
  - one-call payload with runSummary + recentFailures + archiveSummary
  - reduces frontend multi-call stitching for operations dashboard
  - feature test coverage added

- Shifted from currency-only focus to core ERP module expansion (Sales):
  - BC anchors captured for `Sales Header` and `Sales Line`
  - added `sales_order_headers` table (robust header structure + indexes)
  - added `sales_order_lines` table (line-level qty/price/tax + dimensions + indexes)
  - added `SalesOrderHeader` and `SalesOrderLine` models with audit/default behaviors
  - migrations applied successfully in MySQL

- Sales document-chain expansion completed (next layer):
  - added shipment tables: `sales_shipment_headers`, `sales_shipment_lines`
  - added invoice tables: `sales_invoice_headers`, `sales_invoice_lines`
  - added posted tables: `posted_sales_shipment_headers`, `posted_sales_shipment_lines`, `posted_sales_invoice_headers`, `posted_sales_invoice_lines`
  - compliance correction applied: normalized sales order naming/common fields (`no`, `itemNo`, `resDataCentre`) via follow-up migration

- Partial shipment/invoice support hardened at schema level:
  - added partial quantity fields for shipment and invoice line states (`qtyToInvoice`, `quantityNotInvoiced`, `quantityShipped`, `quantityInvoiced`)
  - added source linkage fields between shipment and invoice lines for posting traceability
  - migration applied successfully: `2026_05_24_000063_add_partial_fulfillment_fields_to_sales_lines`

- Sales posting mechanics implemented (backend logic layer):
  - new endpoints:
    - `salesOrderHeaders({systemId})/PostAsShipment`
    - `salesOrderHeaders({systemId})/PostAsInvoice`
  - line-level partial posting supported via payload quantities
  - if no line payload, backend auto-posts remaining shippable/invoiceable quantities
  - writes both operational and posted tables, and updates order quantity states
  - shipment-to-invoice allocation traceability included
  - feature coverage added: `SalesOrderPostingApiTest`

- Purchase DB chain extended to close posted-history gap:
  - added live receipt tables: `purchase_receipt_headers`, `purchase_receipt_lines`
  - added posted receipt tables: `posted_purchase_receipt_headers`, `posted_purchase_receipt_lines`
  - added posted invoice tables: `posted_purchase_invoice_headers`, `posted_purchase_invoice_lines`
  - migrations applied successfully in MySQL (`2026_05_24_000064` to `2026_05_24_000069`)

- Purchase posting mechanics implemented (backend logic layer):
  - service added: `PurchasePostingService`
  - endpoints upgraded from flag-only to transactional posting:
    - `purchaseOrderHeaders({systemId})/PostAsReceive`
    - `purchaseOrderHeaders({systemId})/PostAsInvoice`
  - supports line-level partial receive/invoice via payload quantities
  - if no line payload, backend auto-posts remaining receivable/invoiceable quantities
  - writes receipt and posted purchase history tables and updates order line quantity states
  - receipt-to-invoice allocation traceability included
  - feature coverage added: `PurchaseOrderPostingApiTest`

- SME ledger integration added for posting services:
  - new `LedgerPostingService` centralizes journal + ledger side-effects
  - Sales shipment now posts inventory/value + audit entries
  - Sales invoice now posts GL + customer ledger + detailed customer ledger + audit entries
  - Purchase receipt now posts inventory/value + audit entries
  - Purchase invoice now posts GL + vendor ledger + detailed vendor ledger + audit entries
  - posting services remain safe in sqlite test harnesses via table-existence guards
  - account resolution upgraded to use posting profiles/matrices before fallback account selection
  - balanced double-entry enforcement added for GL insert rows
  - new test coverage: `LedgerPostingServiceTest` (mapped account usage + debit/credit balance assertion)
- Demo data setup hardened for real DB testing:
  - `ErpDemoFoundationSeeder` ensures demo company exists
  - `CurrencyRateAdjustmentRunSeeder` adds realistic Started/Completed/Failed runs
  - `DatabaseSeeder` now runs with model events enabled so system audit fields populate
  - run command: `php artisan db:seed`
- Enhancement API tests expanded:
  - `CurrencyAndPaymentTermEnhancementsApiTest` now covers update/delete for `paymentTermTranslations`
  - same test now covers update/delete/filter for `currencyExchangeRates`
  - regression bundle currently passing across unit + feature suites
- API documentation extended with Currency Run History endpoint examples and query params.
- New session continuity guide created:
  - `DATABASE_SESSION_HANDOFF.md`

## BC Reference Tracking

- Confirmed legacy BC export reference file exists:
  - `BC REF/Taxcycle ALL object Back Up.txt`
- File characteristics:
  - Very large (about 160 MB), cannot be opened directly in editor sync tools.
  - Parsed via terminal in slices; current sampled objects include:
    - `OBJECT Table 3 Payment Terms`
    - `OBJECT Table 4 Currency`
- Working rule:
  - Continue using this BC reference as schema/behavior source.
  - Extract in batches and map to current Filaz naming conventions and existing migration model.
- Database milestone tracker created:
  - `DATABASE_MILESTONE_PLAN.md`
  - This is now the primary module-by-module table tracking document (DONE/PLANNED/REVIEW).
- BC mapping notes created:
  - `DATABASE_BC_MAPPING_NOTES.md`
  - Field-level mapping decisions now captured before/with each BC-driven implementation.

## Next Safe Step

1. Verify `/purchase-order` hard refresh loads rows without needing a click.
2. Verify module menu closes on outside click/Escape/navigation.
3. Verify loader appears during initial list loading and infinite scroll.
4. Only after list flow is stable, map entry-dialog design into the config-driven document popup.

## Parallel Backend Next Step

1. Continue BC object extraction in controlled batches (starting Payment Terms and Currency blocks already sampled).
2. Reconcile remaining BC table/field deltas against existing Laravel migrations.
3. Record each mapped object and status in this file as implementation continues.

