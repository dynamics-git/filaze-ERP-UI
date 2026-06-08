# Dummy Page Templates

Purpose:
- Copy-ready templates for new ERP pages.
- Replace endpoint names, keys, and field mapping only.

Main config file (single source):
- dummy-page.config.ts (barrel exports only)

Files:
- dummy-master-page.ts/html: list-first master page
- dummy-master.config.ts: config for master template
- dummy-header-line-page.ts/html: document header + line page
- dummy-header-line.config.ts: config for header + line template
- dummy-header-page.ts/html: header-only page
- dummy-header-only.config.ts: config for header-only template
- dummy-line-page.ts/html: line-focused page with technical header
- dummy-line-only.config.ts: config for line-focused template

Core benefit examples included:
- Page-level custom command selection policy: dummy-header-line.config.ts (commandSelectionPolicy)
- List fact panel config: dummy-master.config.ts and dummy-header-line.config.ts
- Column to fact panel mapping: dataSurface.columns[].factPanel in master/header-line configs
- Header field fact panel + fact panel button: dummy-header-line.config.ts
- Detail toolbar buttons: dummy-header-line.config.ts (detailToolbarButtons)
- Attachments default config: dummy-header-line.config.ts (attachmentsDefault)
- RunModal command example: dummy-header-line.config.ts (runModalPageId/runModalTarget)
- Footer ON and OFF templates: dummy-header-line.config.ts

Selection policy example:
- default custom list commands use single-record context
- bulk commands override to multiple only when needed
- standard Delete remains core-controlled and does not need per-page custom wiring

Blocked field example:
- keep all status branches in the dummy template
- `All` stays here as a reference branch for training and copy-paste
- real master configs can remove non-business values when the backend contract does not need them

Quick copy flow:
1. Copy one page TS/HTML pair and rename class + selector + pageId.
2. Copy related config from the matching config file above.
3. Replace dataSource endpoint, keyField, documentNoField.
4. Replace columns/sections/field mappings.
5. Keep formulas and footer patterns as needed:
   - with totals: dummyHeaderLineLineConfigWithTotals
   - without totals/footer: dummyHeaderLineLineConfigNoTotals
