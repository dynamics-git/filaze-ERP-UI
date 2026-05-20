# ERP Core

The ERP core is the shared foundation for config-driven Filaz pages. Active pages should use the public core contract from `public-api.ts`, then keep page-specific labels, fields, columns, datasource endpoints, totals, and RunModal buttons in page config.

## Active Runtime

- `list-page`: list rendering, selection, standard actions, and list fact panel.
- `command-bar`: command rendering used by `list-page`.
- `popup-host`: popup stack rendering and RunModal handoff.
- `entry-dialog`: active entry modal shell used by `popup-host`.
- Shared services for data loading, save payloads, line commands, line calculations, filters, confirmations, popup stack, and RunModal.

## Current Rule

- Keep core generic.
- Do not add page-specific business workflow into core.
- Do not keep demo/runtime experiments without an active consumer.
- Field names, API names, labels, columns, footer totals, and factbox rows belong in page config.
