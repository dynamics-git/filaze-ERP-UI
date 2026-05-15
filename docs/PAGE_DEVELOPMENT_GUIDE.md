# Filaz ERP Page Development Guide

Last updated: 2026-05-15  
Base reference page: Purchase Order

This guide explains how to create ERP pages using the shared Filaz runtime. It is written for new developers joining the project. Purchase Order is the reference implementation because it uses the main enterprise patterns: list page, entry dialog, header fields, lines, footer totals, factbox, attachments, line calculations, save/delete, and RunModal navigation.

## Core Principle

Pages must be config-driven.

The page TypeScript file should not contain business layout definitions, footer labels, field labels, hardcoded API names, or repeated calculation formulas when shared runtime/config can own them.

Use this split:

```txt
Page config owns:
- labels
- API field names
- columns
- header sections
- footer sections
- factbox display rules
- calculation rules
- datasource endpoints
- toolbar buttons

Shared core owns:
- rendering
- popup layout
- line edit event handling
- generic footer rendering
- generic calculation execution
- save/delete orchestration
- RunModal resolution
```

If a future page needs a different label, a different footer row, or an extra calculated amount, change config. Do not edit shared HTML unless the visual component itself is missing a generic capability.

## Page Shape

Entry pages use this structure:

```txt
Header
Lines
Footer
Factbox
Attachments
```

Each part is optional. A page can use:

```txt
Header only
Header + Lines
Header + Lines + Footer
Lines + Footer
Header + Factbox
List only
```

Do not treat document totals as line rows. Footer totals are calculated from lines but displayed as document footer values. If the API later exposes header total fields, footer rows can read header fields instead of calculated totals.

## Important Files

Shared runtime:

```txt
src/app/layout/entry-dialog/entry-dialog.ts
src/app/layout/entry-dialog/entry-dialog.html
src/app/shared/erp-core/components/popup-host/popup-host.ts
src/app/shared/erp-core/services/entry-state.service.ts
src/app/shared/erp-core/services/line-calculation.service.ts
src/app/shared/erp-core/services/line-command.service.ts
src/app/shared/erp-core/services/run-modal.service.ts
src/app/shared/erp-core/models/entry-dialog-config.model.ts
src/app/shared/erp-core/constants/entry-footer-presets.ts
```

Purchase Order reference:

```txt
src/app/pages/purchase-order/purchase-order.ts
src/app/pages/purchase-order/purchase-order.config.ts
```

Purchase Invoice and Prepayment follow the same shared methodology:

```txt
src/app/pages/purchase-invoice/purchase-invoice.ts
src/app/pages/purchase-invoice/purchase-invoice.config.ts
src/app/pages/prepayment/prepayment.ts
src/app/pages/prepayment/prepayment.config.ts
```

## Config Naming Rules

Use API field names in config keys and field bindings.

Good:

```ts
{
  id: 'directUnitCost',
  label: 'Original Cost/Unit',
  field: 'directUnitCost',
  valueType: 'number'
}
```

Do not use UI labels as API field names.

Bad:

```ts
field: 'Original Cost/Unit'
```

Labels are for humans. Fields are for API/data binding.

## List Page Config

A list page config defines the grid, datasource, filters, commands, and factbox.

Example pattern:

```ts
export const purchaseOrderListDataSource: DataSourceConfig = {
  endpoint: '/purchaseOrderHeaders',
  contractProfileKey: 'purchaseOrderHeaders',
  keyField: 'systemId',
  documentNoField: 'number',
  autoGenerateNumber: true,
  lazyCreateOnFirstInput: true,
  defaultSort: 'number',
  pageSize: 20,
  supportsCreate: true,
  supportsUpdate: true,
  supportsDelete: true
};
```

Enterprise rule:

```txt
Use systemId as the persisted record identity whenever the API provides it.
Use document number only as business display/search/filter data.
```

Do not build URLs like:

```txt
purchaseInvoiceHeaders('107211')
```

when the API provides:

```txt
systemId: '...guid...'
```

## Header Sections

Header sections define fields shown above or around the line area.

Example:

```ts
export const purchaseOrderHeaderSections: EntryHeaderSectionConfig[] = [
  {
    id: 'primary',
    title: 'Primary Details',
    fields: [
      {
        key: 'number',
        label: 'No',
        type: 'text',
        valueType: 'text',
        readonly: true
      },
      {
        key: 'buyFromVendorNumber',
        label: 'Vendor No',
        type: 'select',
        valueType: 'text',
        optionsEndpoint: '/vendorsAPI'
      }
    ]
  }
];
```

Rules:

```txt
key = API/data field
label = UI text
type = renderer control type
valueType = text/number/date/boolean conversion
readonly = UI edit behavior
factPanel = optional factbox display rule
```

Do not write separate factbox code when the field already has `factPanel`.

## Line Columns

Line columns define the editable grid.

Example:

```ts
export const purchaseOrderLineColumns: LineColumnConfig[] = [
  {
    id: 'quantity',
    label: 'Quantity',
    field: 'quantity',
    valueType: 'number',
    cellType: 'text',
    align: 'end'
  },
  {
    id: 'directUnitCost',
    label: 'Original Cost/Unit',
    field: 'directUnitCost',
    valueType: 'number',
    cellType: 'text',
    align: 'end'
  },
  {
    id: 'lineAmount',
    label: 'PO Amount',
    field: 'lineAmount',
    valueType: 'number',
    cellType: 'text',
    readonly: true,
    align: 'end',
    factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 80 }
  }
];
```

Rules:

```txt
field = row API field
label = column caption
optionsDataKey = row property that contains dropdown options
optionsEndpoints = master APIs needed for dropdowns
readonly = visible but not editable
factPanel = show selected row value in the factbox
```

Dropdowns should load from configured endpoints. If dropdown options are missing, check:

```txt
optionsEndpoints
optionsDataKey
master data loader
line row option assignment
```

## Row Calculation

Row calculation updates fields on the active line after a line value changes.

Default enterprise behavior is handled by shared core. For normal document lines, the page should not define a formula. Core reads the existing line column config and row fields.

Default core matching:

```txt
quantity / qty
*
directUnitCost / unitCost / unitPrice / originalCost
=
lineAmount / amount / poAmount
```

If the row also has `amountToInvoice`, core updates it with the same calculated amount. If the row has `amountIncludingVat`, core can add `vat` or `tax`.

Purchase Order uses this default path. It already has these line columns:

```txt
quantity
directUnitCost
lineAmount
amountToInvoice
```

So PO does not need a page-level formula block.

Custom row calculation is only for exceptions. Example: a page needs `amountLcy` from line amount and currency factor.

```ts
{
  target: 'amountLcy',
  formula: {
    kind: 'multiply',
    values: [
      { kind: 'field', field: 'lineAmount' },
      { kind: 'field', field: 'currencyFactor', defaultValue: 1 }
    ]
  }
}
```

This means:

```txt
lineAmount * currencyFactor = amountLcy
```

Use custom calculation only when default field matching cannot express the business rule.

## Footer Totals

Footer is a generic document footer container. It is not hardcoded in HTML.

Common shared footer preset:

```txt
src/app/shared/erp-core/constants/entry-footer-presets.ts
```

Shared preset:

```ts
export const DOCUMENT_TOTAL_FOOTER_ROWS = [
  { id: 'amount-excl-sst', label: 'Amount Excl. SST', source: 'total', totalKey: 'subtotal' },
  { id: 'sst', label: 'SST', source: 'total', totalKey: 'sst' },
  { id: 'total-incl-sst', label: 'Total Incl. SST', source: 'total', totalKey: 'total', emphasis: true }
];
```

PO and PI can opt into the shared footer:

```ts
export const purchaseOrderFooterSections = DOCUMENT_TOTAL_FOOTER_SECTIONS;
```

If a common footer row is added to the shared preset, every page using that preset benefits automatically.

If a page does not want a footer:

```ts
footerSections: undefined
```

If a page wants a custom footer:

```ts
export const prepaymentFooterSections = buildDocumentTotalFooterSections([
  { id: 'amount', label: 'Amount', source: 'total', totalKey: 'subtotal' },
  { id: 'remaining-amount', label: 'Remaining Amount', source: 'total', totalKey: 'difference', emphasis: true }
]);
```

Footer row value sources:

```txt
source: 'total'   -> read from calculated line totals
source: 'header'  -> read from headerData field
source: 'literal' -> read from config value
```

Examples:

```ts
{ id: 'total-vat', label: 'Total VAT', source: 'total', totalKey: 'sst' }
{ id: 'header-total', label: 'Header Total', source: 'header', field: 'totalAmount' }
{ id: 'mode', label: 'Calculation Mode', source: 'literal', value: 'Preview' }
```

## Totals Calculation

Totals calculation turns line rows into footer values.

PO example:

```ts
export const purchaseOrderLineTotalsCalculation: LineTotalsCalculationConfig = {
  defaults: purchaseOrderLineTotalsDefault,
  totals: {
    subtotal: { kind: 'sum', field: 'lineAmount' },
    sst: { kind: 'default' },
    total: { kind: 'sum', field: 'lineAmount' },
    difference: {
      kind: 'difference',
      left: { kind: 'sum', field: 'lineAmount' },
      right: { kind: 'sum', field: 'amountInvoiced' }
    }
  }
};
```

Important:

```txt
Footer totals are display/calculation values.
Do not PATCH header totals unless API exposes real header total fields and config maps them.
```

When the backend later provides header total fields, footer rows can switch to:

```ts
{ id: 'total-incl-sst', label: 'Total Incl. SST', source: 'header', field: 'amountIncludingVat' }
```

## Factbox

Factbox is generated from config.

Header fields can opt in:

```ts
{
  key: 'status',
  label: 'Status',
  type: 'text',
  factPanel: { sectionId: 'review', sectionTitle: 'Review', order: 10 }
}
```

Line columns can opt in:

```ts
{
  id: 'lineAmount',
  label: 'PO Amount',
  field: 'lineAmount',
  factPanel: { sectionId: 'line', sectionTitle: 'Line', order: 80 }
}
```

Rules:

```txt
Do not create duplicate factbox arrays in page TS if field/line config can drive it.
List factbox and popup factbox are separate surfaces, but both should be config-driven.
```

## Save Flow

Header save:

```txt
Header field changed
-> EntryDialog emits header:changed
-> EntryStateService schedules header autosave
-> Header datasource PATCH uses systemId
```

Line save:

```txt
Line field changed
-> EntryDialog emits line:changed
-> Page/runtime applies row calculation config
-> Line PATCH sends changed field + calculated fields
-> Footer totals recalculate locally
```

Important rule:

```txt
Line edit/insert/delete must not trigger header PATCH.
```

Header totals are not saved unless the API exposes header total fields and config explicitly maps them.

## Delete Flow

Line delete uses shared `LineCommandService`.

Expected behavior:

```txt
Select one or more line rows
Click Delete
Confirm
Delete each persisted line by systemId
Remove deleted rows locally
Recalculate footer totals
Do not PATCH header
```

Page should not hand-roll delete loops. Use shared command service.

## RunModal Navigation

RunModal is for BC-style page navigation.

Button config can open another page:

```ts
{
  label: 'Purchase Order',
  actionKey: 'cmd:purchase-order',
  group: 'Process',
  runModalPageId: 'purchase-order',
  runModalTarget: 'list',
  runModalMode: 'page',
  runModalSize: 'full'
}
```

Use target carefully:

```txt
runModalTarget: 'entry' -> open document card directly when id/context is available
runModalTarget: 'list'  -> open list page first, then user opens card normally
```

If a source page does not have the target document id, open the list page. Do not open a random card.

## Building A New Page

Use this checklist.

1. Create page folder:

```txt
src/app/pages/my-page/my-page.ts
src/app/pages/my-page/my-page.html
src/app/pages/my-page/my-page.config.ts
```

2. Define list datasource:

```ts
export const myPageListDataSource: DataSourceConfig = {
  endpoint: '/myHeaders',
  keyField: 'systemId',
  documentNoField: 'number',
  pageSize: 20,
  supportsCreate: true,
  supportsUpdate: true,
  supportsDelete: true
};
```

3. Define header sections.

4. Define line columns.

5. Define row calculation rules if lines need derived values.

6. Define totals calculation rules if footer/factbox needs totals.

7. Choose footer:

```ts
export const myPageFooterSections = DOCUMENT_TOTAL_FOOTER_SECTIONS;
```

or:

```ts
export const myPageFooterSections = undefined;
```

or custom:

```ts
export const myPageFooterSections = buildDocumentTotalFooterSections([...]);
```

8. Define toolbar buttons.

9. Open popup using `EntryDialogConfig`.

10. Validate:

```bash
npx tsc -p tsconfig.app.json --noEmit
```

## Common Mistakes

Avoid these:

```txt
Hardcoding footer labels in HTML
Writing sum/multiply formulas inside page TS
Using document number as update/delete id when systemId exists
Triggering header PATCH after line edit
Duplicating factbox sections by hand when fields already have factPanel metadata
Adding one-off page SCSS for shared controls
Adding per-page footer files when a shared preset is enough
```

## When To Change Core

Change shared core only when the capability is generic.

Examples:

```txt
Footer renderer supports new source type
Calculation engine supports divide/percentage/rounding
Line command service supports bulk validation
RunModal supports a new target mode
Factbox renderer supports buttons
```

Do not change core for one page label or one page field. That belongs in config.

## PO Development Test Checklist

Use Purchase Order as the main regression test.

1. Open `/purchase-order`.
2. Open a PO card.
3. Change `quantity`.
4. Confirm line PATCH goes to `/purchaseOrderLines(systemId)`.
5. Confirm no `/purchaseOrderHeaders(systemId)` PATCH happens from line edit.
6. Confirm `lineAmount` recalculates.
7. Confirm footer total recalculates.
8. Delete one line.
9. Confirm DELETE goes to `/purchaseOrderLines(systemId)`.
10. Confirm no header PATCH after delete.
11. Add a line.
12. Select line type/no and confirm dropdowns load.
13. Confirm factbox follows selected line.
14. Confirm RunModal list/card navigation still works.

## Living Document Rule

Whenever a new shared pattern is added, update this guide.

Examples:

```txt
new footer source type
new calculation formula type
new attachment context rule
new RunModal target
new page creation shortcut
```

This guide should stay useful for a junior developer creating a new page without needing to ask where every piece lives.
