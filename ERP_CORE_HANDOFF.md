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

### Page config shape
`src/app/pages/purchase-order/purchase-order.config.ts` is the current clean reference for new page config.

Use three top-level config buckets:
- `purchaseOrderHeaderConfig: EntryHeaderConfig`
- `purchaseOrderLineConfig: LineConfig`
- `purchaseOrderListConfig: ListPageConfig & { dataSource: DataSourceConfig }`

For other pages, keep the same naming chain:
- `<pageName>HeaderConfig`
- `<pageName>LineConfig`
- `<pageName>ListConfig`

Do not create page-local schema names such as `PurchaseOrderLineConfig`.
Do not invent parallel names such as `DocumentLineConfig`.
Use generic ERP core names from `public-api.ts`.

### List config
List config owns page metadata, views, list data source, and visible list columns.

Core defaults for normal ERP list pages:
- `dataSource.supportsCreate` defaults to `true`
- `dataSource.supportsUpdate` defaults to `true`
- `dataSource.supportsDelete` defaults to `true`
- `tools.refresh` defaults to `true`
- `tools.filter` defaults to `true`
- `tools.advancedFilter` defaults to `true`
- `tools.export` defaults to `true`
- `tools.columns` defaults to `true`

Do not repeat these defaults in every page config. Page config should only override exceptions.

Good normal page:

```ts
dataSource: {
  endpoint: '/purchaseOrderHeaders',
  keyField: 'systemId',
  documentNoField: 'number'
}
```

Good read-only exception:

```ts
dataSource: {
  endpoint: '/postedPurchaseInvoices',
  supportsCreate: false,
  supportsUpdate: false,
  supportsDelete: false
}
```

Good tool exception:

```ts
tools: {
  export: false
}
```

Meaning of filters:
- `filter` means the basic list filtering/search layer: views, search box, and quick filter strip.
- `advancedFilter` means the advanced side/panel filter builder: field, operator, value, multiple conditions, and bookmarks.

Both should be enabled by default for enterprise list pages because core supports them. A page should set either one to `false` only for a real exception.

Keep only page-specific columns in `dataSurface.columns`.
Core defaults handle grid mechanics such as:
- table mode
- row key fallback
- selection behavior
- sortable/resizable defaults
- list fact panel fallback
- column `id` inferred from `field`

List fact panel follows the same field-level rule as header and line fact panels:
- Put `factPanel` on a `dataSurface.columns[]` item to show that list field in the right-side list fact panel.
- If a list column does not have `factPanel`, it does not appear in the list fact panel.
- Core must not guess fact panel fields from all columns.
- Core must not guess a summary from the first currency/number column.

Good list fact panel column:

```ts
{
  field: 'amountIncludingVAT',
  label: 'Amount Including VAT',
  type: 'currency',
  align: 'end',
  factPanel: {
    sectionId: 'amounts',
    sectionTitle: 'Amounts',
    order: 20,
    fallback: '0'
  }
}
```

The `factPanel.order` value is only the row order inside the fact panel section. It is not the grid column order.

Good:

```ts
dataSurface: {
  columns: [
    { field: 'number', label: 'No', type: 'text', isPrimary: true },
    { field: 'buyFromVendorName', label: 'Buy-from Vendor Name', type: 'text' },
    { field: 'status', label: 'Status', type: 'badge' }
  ]
}
```

Avoid repeating generic defaults in page config:
- `dataSurface.id`
- `mode: 'table'`
- `idField: 'systemId'` unless truly non-standard
- `selectable`
- `multiSelect`
- `sortable`
- `resizable`
- `infiniteScroll`
- `supportsCreate: true`
- `supportsUpdate: true`
- `supportsDelete: true`
- `tools.refresh: true`
- `tools.filter: true`
- `tools.advancedFilter: true`
- `tools.export: true`
- `tools.columns: true`
- hardcoded currency codes such as `MYR`

### Action bar fallback behavior
`src/app/layout/actions/actions.ts` now supports config-driven page context with route fallback.

Meaning:
- If a page calls `setPageContext(...)`, the action header uses config values.
- If a page does not provide context yet, old route-based static values still render.

This is temporary transitional behavior and should be preserved until all pages are mapped.

### Command contract
All command surfaces should use one shared command shape.

Stable model:

```ts
export interface ErpCommandConfig {
  id?: string;
  label: string;
  actionKey: string;
  surface?: 'list' | 'header' | 'line' | 'detail' | 'factPanel';
  group?: string;
  icon?: string;
  trailingIcon?: string;
  order?: number;
  isPrimary?: boolean;
  tone?: 'primary' | 'normal' | 'danger';
  disabled?: boolean;
  hidden?: boolean;
  runModalPageId?: string;
  runModalTarget?: 'list' | 'entry';
  requireSelection?: boolean;
  selectionMode?: 'single' | 'multiple';
  tooltip?: string;
  permissionKey?: string;
}
```

Aliases:
- `CommandConfig = ErpCommandConfig`
- `EntryCommandButtonConfig = ErpCommandConfig`
- `FactPanelButtonConfig = ErpCommandConfig`

Command surfaces:
- `surface: 'list'` for top list/page toolbar commands.
- `surface: 'header'` for entry header toolbar commands.
- `surface: 'line'` for line toolbar commands.
- `surface: 'detail'` for nested/detail toolbar commands.
- `surface: 'factPanel'` for fact panel buttons.

Standard list actions are not page command buttons:
- New comes from `dataSource.supportsCreate !== false`
- Delete comes from `dataSource.supportsDelete !== false`
- Refresh comes from `tools.refresh !== false`

Future permission layer should combine with these defaults:

```ts
showNew = dataSource.supportsCreate !== false && userCanCreate;
showDelete = dataSource.supportsDelete !== false && userCanDelete;
showCommand = command.permissionKey ? hasPermission(command.permissionKey) : true;
```

Extra list command:

```ts
{
  id: 'send-approval',
  label: 'Send Approval',
  actionKey: 'cmd:send-approval',
  surface: 'list',
  group: 'process',
  icon: 'bi bi-send',
  requireSelection: true,
  selectionMode: 'single',
  permissionKey: 'PO_APPROVAL_SEND'
}
```

Entry header RunModal command:

```ts
{
  id: 'prepayment',
  label: 'Pre payment',
  actionKey: 'cmd:prepayment',
  surface: 'header',
  group: 'process',
  icon: 'bi bi-credit-card',
  runModalPageId: 'prepayment',
  runModalTarget: 'entry'
}
```

Line command:

```ts
{
  id: 'line-attachments',
  label: 'Attachments',
  actionKey: 'dialog:attachments',
  surface: 'line',
  group: 'more',
  icon: 'bi bi-paperclip',
  requireSelection: true,
  selectionMode: 'single'
}
```

Fact panel command:

```ts
{
  id: 'view-activity',
  label: 'Activity',
  actionKey: 'cmd:view-activity',
  surface: 'factPanel',
  icon: 'bi bi-clock-history',
  runModalPageId: 'activity-log',
  runModalTarget: 'entry'
}
```

Implemented now:
- shared command model and aliases
- list/header/line/detail/fact-panel button types aligned to the same contract
- list page standard actions derive from core defaults
- normal pages no longer need `standardActions` or default CRUD/tool flags

Next runtime step:
- one generic command router should add current context by surface
- if `runModalPageId` exists, the router should open RunModal
- if no `runModalPageId`, the router should dispatch `actionKey` to the page business handler
- `requireSelection` and `selectionMode` should be enforced by the core command router

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

### 5. Dropdown contract
New pages must use the clean dropdown contract.

Header field dropdown:

```ts
{
  key: 'buyFromVendorNumber',
  label: 'Vendor No',
  type: 'dropdown',
  api: ['/vendorsAPI', '/vendors'],
  valueField: 'number',
  labelField: 'name',
  fill: {
    buyFromVendorName: 'name'
  }
}
```

Line column dropdown:

```ts
{
  id: 'no',
  field: 'no',
  label: 'No',
  cellType: 'dropdown',
  fill: {
    description: 'description'
  }
}
```

Rules:
- `api` loads dropdown records.
- `valueField` is the saved value.
- `labelField` is the normal display label.
- `displayFormat` is optional and UI-only.
- `fill` maps target field names to source field names from the selected record.
- If no `fill` is configured, only the dropdown field itself changes.
- The same dropdown/fill model applies to header fields and line columns.

Do not use these legacy names for new pages:
- `bindValue`
- `bindLabel`
- `targets`
- `selectionStrategy`
- `optionsDataKey`
- `optionsEndpoints`
- `masterEndpoints`
- `masterOptionFields`
- `displayName` unless the actual API contract really has a `displayName` field

Compatibility note:
Some legacy pages, especially Purchase Invoice, may still compile with `bindValue` / `bindLabel` while they are being migrated. Do not copy that pattern into new or cleaned pages.

### 6. Dropdown values must stay clean
The saved field value must be the real business value only.

Examples:
- Vendor dropdown saves vendor number.
- Item dropdown saves item number.
- UOM dropdown saves UOM code.

The UI may display friendly text, but it must not combine fields into the saved value.

Good:

```ts
valueField: 'number',
labelField: 'name',
displayFormat: '[number] - [name]' // optional
```

Bad:
- storing `V0001 - ABC Supplier` in the vendor number field
- assuming old `displayName` behavior
- using dropdown display logic as business data mapping

## Known Follow-up Items

### Purchase Order config status
Purchase Order is the current clean reference for:
- three config buckets only
- simple dropdown `api`
- field-level dropdown `fill`
- list columns only in `dataSurface`
- no page-level `selectionStrategy`
- no `masterOptionFields`
- no list grid default repetition

Do not reintroduce old app config copied from `old_app_for _References`.

### Calculation Contract
Core owns only the generic calculation executor. It must not know business field names, document types, currency rules, UOM rules, tax rules, or purchase-specific logic.

The page config owns field names and formulas.

Calculation flow:
- Page config defines `calculation` only when the page needs calculated fields.
- Core reads formula strings with normal math operators: `+`, `-`, `*`, `/`, `%`, and parentheses.
- Core reads line fields by field key, for example `quantity`.
- Core reads header fields with `header.`, for example `header.currencyFactor`.
- Core writes the result into the configured `target`.
- The result is visible only if the target field/column exists in the header or line config.
- If a page does not need calculation, do not add `calculation`.
- If a page does not need footer totals, do not add `totalsCalculation` or footer rows.

Calculation rule shape:

```ts
calculation: [
  {
    target: 'targetFieldKey',
    formula: 'realFieldKey * header.realHeaderFieldKey',
    precision: 2 // optional
  }
]
```

Do not add labels to `calculation` rules. The display label comes from the target field/column config. Calculation rules only define where the value goes and how to calculate it.

#### Line Result Field
Line calculation writes into a line field.

```ts
columns: [
  { field: 'quantity', label: 'Quantity', valueType: 'number' },
  { field: 'directUnitCost', label: 'Unit Cost', valueType: 'number' },
  { field: 'lineAmount', label: 'Line Amount', valueType: 'number', readonly: true }
],
calculation: [
  {
    target: 'lineAmount',
    formula: 'quantity * directUnitCost'
  }
]
```

User enters `quantity` and `directUnitCost`. Core writes the result to `lineAmount`.

#### Copy Field
Use a formula with one field when a target should copy another value.

```ts
calculation: [
  {
    target: 'amountToInvoice',
    formula: 'lineAmount'
  }
]
```

#### Full Line Formula With UOM And Currency
Do not split a formula unless an intermediate result is useful. A complete formula can stay in one rule.

```ts
calculation: [
  {
    target: 'lineAmount',
    formula: 'quantity * uomFactor * directUnitCost * header.currencyFactor'
  }
]
```

For this formula:
- `quantity`, `uomFactor`, and `directUnitCost` are line fields.
- `header.currencyFactor` is a header field.
- `uomFactor` should normally be filled by the UOM dropdown API.
- `currencyFactor` should normally be filled by the currency dropdown API.
- If no UOM conversion is needed, `uomFactor` should default to `1`.
- If no currency conversion is needed, `currencyFactor` should default to `1`.

Example UOM field:

```ts
{
  field: 'unitOfMeasure',
  cellType: 'dropdown',
  api: '/unitOfMeasures',
  valueField: 'code',
  labelField: 'code',
  fill: {
    uomFactor: 'quantityPerUnit'
  }
},
{
  field: 'uomFactor',
  valueType: 'number',
  hidden: true,
  defaultValue: 1
}
```

Example currency field:

```ts
{
  key: 'currencyCode',
  type: 'dropdown',
  api: '/currencies',
  valueField: 'code',
  labelField: 'code',
  fill: {
    currencyFactor: 'exchangeRate'
  }
},
{
  key: 'currencyFactor',
  type: 'number',
  readonly: true,
  defaultValue: 1
}
```

#### Amount And Local Amount
If a page stores document currency amount and base/local amount, define both targets.

```ts
columns: [
  { field: 'amount', label: 'Amount', valueType: 'number', readonly: true },
  { field: 'localAmount', label: 'Local Amount', valueType: 'number', readonly: true }
],
calculation: [
  {
    target: 'amount',
    formula: 'quantity * uomFactor * unitCost'
  },
  {
    target: 'localAmount',
    formula: 'amount * header.currencyFactor'
  }
]
```

If the page wants a single stored amount including currency conversion, it can use one rule:

```ts
calculation: [
  {
    target: 'lineAmount',
    formula: 'quantity * uomFactor * unitCost * header.currencyFactor'
  }
]
```

#### Travel Or Non-Purchase Pages
The same engine works for non-purchase pages.

```ts
columns: [
  { field: 'km', label: 'KM', valueType: 'number' },
  { field: 'petrolPrice', label: 'Petrol Price', valueType: 'number' },
  { field: 'travelAmount', label: 'Travel Amount', valueType: 'number', readonly: true }
],
calculation: [
  {
    target: 'travelAmount',
    formula: 'km * petrolPrice'
  }
]
```

#### Employee Or Headcount Pages
Field names are page-specific. Core does not know employee logic.

```ts
calculation: [
  {
    target: 'salaryTotal',
    formula: 'noOfEmployee * salaryPerEmployee'
  }
]
```

#### Tax, Discount, Service Charge
Use real page field keys in the formula.

```ts
calculation: [
  {
    target: 'netAmount',
    formula: 'grossAmount + taxAmount - discountAmount + serviceCharge'
  }
]
```

#### Percent Formula
Percentage can be expressed directly.

```ts
calculation: [
  {
    target: 'discountAmount',
    formula: 'grossAmount * discountPercent%'
  },
  {
    target: 'netAmount',
    formula: 'grossAmount - discountAmount'
  }
]
```

#### Header Target Calculation
Header calculation writes into a header field by using `targetSource: 'header'`.

```ts
calculation: [
  {
    target: 'remainingBudget',
    targetSource: 'header',
    formula: 'header.budgetAmount - header.usedBudget'
  }
]
```

The header target field must exist in header config if the result should be visible.

#### Header Field Used In Line Calculation
Line calculation can read header fields.

```ts
calculation: [
  {
    target: 'approvedLineAmount',
    formula: 'lineAmount * header.approvalFactor'
  }
]
```

#### Chained Formulas
Rules run in order. Later formulas can use targets calculated by earlier formulas.

```ts
calculation: [
  {
    target: 'lineAmount',
    formula: 'quantity * directUnitCost'
  },
  {
    target: 'taxAmount',
    formula: 'lineAmount * taxPercent%'
  },
  {
    target: 'amountIncludingTax',
    formula: 'lineAmount + taxAmount'
  }
]
```

Do not split formulas just to split them. Split only when the intermediate target is a real field the UI/API needs.

### Footer Totals Contract
Footer totals are separate from row/header calculation and are optional.

Add footer config only when the entry/footer needs totals.

Footer values come from `totalsCalculation`.
Footer labels come from `footerSections`.

Good footer totals:

```ts
totalsCalculation: {
  defaults: {
    subtotal: '0.00',
    tax: '0.00',
    total: '0.00',
    difference: '0.00'
  },
  format: {
    type: 'currency',
    currencyCodeHeaderField: 'currencyCode'
  },
  totals: {
    subtotal: { formula: 'sum(lineAmount)' },
    tax: { formula: 'sum(taxAmount)' },
    total: { formula: 'sum(localAmount)' },
    difference: { formula: 'sum(localAmount) - sum(amountInvoiced)' }
  }
}
```

Good footer labels:

```ts
footerSections: [
  {
    id: 'document-totals',
    rows: [
      { id: 'subtotal', label: 'Subtotal', source: 'total', totalKey: 'subtotal' },
      { id: 'tax', label: 'Tax', source: 'total', totalKey: 'tax' },
      { id: 'total', label: 'Total', source: 'total', totalKey: 'total', emphasis: true },
      { id: 'difference', label: 'Difference', source: 'total', totalKey: 'difference' }
    ]
  }
]
```

The `totalKey` must match the key produced by `totalsCalculation`.

Footer formulas can use `sum(lineFieldKey)`. Footer formulas summarize line rows. Row formulas should not use `sum(...)`.

If a page has line calculation but no footer, define only `calculation`.
If a page has footer but no row calculation, define only `totalsCalculation` and `footerSections`.

### Calculation Rules
Do not add role names or hardcoded business slots such as `quantityField`, `unitAmountField`, or `amountField` to core. Field names belong in page config only.

Do not put page-specific calculation math in page TypeScript. `EntryStateService.handleEntryPopupAction(...)` is the shared runtime gateway for entry popup events. Pages pass the active `entryDialogConfig` and `lineConfig` there, and the runtime:
- applies `lineConfig.calculation` when a line changes
- recalculates all line formulas when a header changes
- recalculates footer totals from `lineConfig.totalsCalculation`
- adds calculated target fields to the line change payload as `calculatedFields` so save logic can persist them

Page code may handle page-specific events such as line type changes or opening run modals, but it must not contain formula math such as `quantity * directUnitCost`.

For UOM conversion, currency conversion, tax, discount, employee, travel, or any future business rule, the page/API provides the fields and formula. Core must stay generic.

### Next structural target
Recommended future contract for each enterprise page:
- page context
- commands
- standard actions
- views
- data source
- list columns
- header config
- line config
- dropdown `api/valueField/labelField/fill`
- calculation formulas when needed

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
5. New dropdowns use `api/valueField/labelField/fill`, not legacy binding names.
6. New line calculations must be formula/config driven; do not add hardcoded field-name guesses to core.
