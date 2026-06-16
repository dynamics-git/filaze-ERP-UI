# Header and Line Field Guide (Junior-Friendly)

Purpose:
- Explain what each config field does in Header and Line pages.
- Explain when runtime actually uses each field.
- Remove confusion around keyField, documentNoField, parentKeyField, and navigation.

This guide is based on the real runtime behavior in:
- src/app/shared/erp-core/components/document-runtime/document-runtime.ts
- src/app/shared/erp-core/models/data-source-config.model.ts
- src/app/shared/erp-core/models/entry-dialog-config.model.ts
- src/app/shared/erp-core/models/line-config.model.ts

---

## 1) Big Picture in One Minute

For Header + Line page shape:

1. Header list loads from header dataSource.endpoint.
2. User opens one header record.
3. Runtime loads lines related to that header.
4. Runtime saves line changes to line endpoint.

There are 3 different identities in play:

1. Header PK (example: header.systemId)
2. Line PK (example: line.systemId)
3. Line FK to Header (example: line.rolePermissionId)

Do not mix these 3.

---

## 2) Most Important DataSource Fields

## keyField

What it means:
- Primary key of that datasource's own record.

Used for:
- Update, delete, row identity, record lookup.

Examples:
- Header dataSource.keyField = systemId (header row identity)
- Line dataSource.keyField = systemId (line row identity)

---

## parentKeyField (line datasource)

What it means:
- Foreign key field on line row that points to header.

Used for:
- Non-navigation filter logic.
- Auto-fill relation value into new/edited line row.

Example:
- parentKeyField = rolePermissionId
- Means line.rolePermissionId points to header PK.

---

## documentNoField

Important:
- Name is legacy from document pages.
- In many modern pages, this field acts as "header source field", not literal document number.

Used for:
- Header title seed and new header seed behavior.
- Relation fallback source in line-parent copy logic.

In line relation flow:
- Runtime can copy header[documentNoField] into line[parentKeyField] when needed.

If your system is systemId-based:
- line.documentNoField = systemId is valid.

---

## navigation (line datasource)

What it means:
- Build nested endpoint for line operations.

Fields:
- parentEndpoint: header collection endpoint
- childCollection: line collection under parent
- parentIdFields: header fields runtime can use to build parent id in URL
- top: preferred line page size

Example endpoint built by runtime:
- /role-permissions(<parentId>)/page-permissions

Why this exists:
- To match strict parent-child backend APIs.

---

## createFields

What it means:
- Exact fields runtime sends when creating line (or header if used there).

Used for:
- Whitelisting payload fields.

Tip:
- Keep only backend-accepted fields.

---

## updateBlockedFields

What it means:
- Fields runtime must never send during update.

Used for:
- Protect immutable keys and relation ids.

Typical blocked fields:
- systemId
- rolePermissionId (or your FK)

---

## defaultSort

What it means:
- Preferred order sent as query sort.

Used for:
- loadList query order.

Note:
- Backend may honor or ignore it.
- Keeping it is fine if backend supports that field.

---

## pageSize / navigation.top

What they mean:
- pageSize: default list size for normal list loads.
- navigation.top: preferred top for nested line loads.

---

## supportsCreate / supportsUpdate / supportsDelete

What they mean:
- Capability flags for runtime command behavior.

Used for:
- Enabling/disabling standard actions where applicable.

---

## autoGenerateNumber / lazyCreateOnFirstInput

Mostly for document-style headers:
- autoGenerateNumber: backend or runtime expects generated number.
- lazyCreateOnFirstInput: create draft only after first valid header interaction.

---

## parentFixedFields

What it means:
- Constant relation filters/values for line calls.

Example:
- documentType: Order

Used for:
- Extra filter or payload context along with parent relation.

---

## contractProfileKey

What it means:
- Optional contract mapping key for payload sanitization/service profile behavior.

Use when:
- Entity contract service requires profile-specific normalization.

---

## defaultFilter

What it means:
- Base filter always applied to list endpoint.

Used for:
- Pre-filtering list without user action.

---

## endpoint

What it means:
- Base API route for that datasource.

Header example:
- /role-permissions

Line base example:
- /page-permissions

With navigation enabled, runtime can resolve nested endpoint at runtime.

---

## 3) Header Config Fields (EntryHeaderConfig)

## dialogTitle
- Popup/page header title text.

## sections
- Header form structure.
- Each section has fields shown in form.

## sections[].id
- Important for line placement when line uses after-section mode.

## toolbarButtons / detailToolbarButtons
- Header-level and detail-level action buttons.

## commandBar
- Layout behavior for visible primary actions and groups.

## attachmentsDefault
- Default attachment behavior and mapping context.

---

## 4) Line Config Fields (LineConfig)

## placement
- Where line grid renders in entry UI.
- after-section needs valid section id.

## toolbarButtons
- Line actions like new/delete.

## columns
- Line grid columns and editors.

## lineKeyField
- Runtime line sequence/identity helper for row handling.
- Usually sequence field like line_no if backend provides it.
- If not available, systemId can be used but sequence behavior is weaker.

## calculation / totalsCalculation / footerSections
- Optional formulas and total rows.

## commandBar
- Optional line command bar behavior.

---

## 5) Runtime Timing: When Each Field Is Used

Open Header from List:
1. Header datasource.endpoint, keyField, documentNoField

Load Lines:
1. line dataSource + navigation + parentIdFields
2. parentKeyField + documentNoField (non-navigation filter/copy path)

Create Line:
1. createFields
2. parentKeyField/documentNoField relation copy
3. keyField for response merge identity

Update Line:
1. keyField to resolve row id
2. updateBlockedFields to strip immutable fields

Delete Line:
1. keyField to resolve row id

---

## 6) Your Current PagePermissions Mapping (Easy Read)

Header:
- endpoint: /role-permissions
- header PK: systemId
- display field: roleCode

Line:
- endpoint base: /page-permissions
- line PK: systemId
- line FK to header: rolePermissionId
- nested route: /role-permissions(<parentId>)/page-permissions
- parent id source fields: rolePermissionId, then systemId (as configured)

Meaning:
- Header.systemId identifies parent record.
- Line.rolePermissionId links line to that parent.
- Line.systemId identifies each line row.

---

## 7) Naming Confusion Cheat Sheet

If confused, use this quick mapping:

- keyField = who am I (this row id)
- parentKeyField = whose child am I (parent FK on line)
- documentNoField = which header value should runtime read as relation source
- navigation.parentIdFields = which header field builds parent id in nested URL

---

## 8) Safe Configuration Rules for Team

1. Always define keyField for header and line.
2. Always define parentKeyField for line pages.
3. For nested APIs, always define navigation.parentEndpoint, childCollection, parentIdFields.
4. Keep createFields aligned to backend accepted payload.
5. Add immutable ids to updateBlockedFields.
6. Keep section ids stable when line placement uses after-section.

---

## 9) Quick Validation Checklist

Before merge:

1. Open header from list works.
2. Line list URL uses expected nested parent id.
3. New line payload contains FK relation field.
4. Update payload excludes blocked fields.
5. Delete uses line keyField id.
6. No mismatch between section id and line placement target.

---

End of guide.
