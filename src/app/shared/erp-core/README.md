# ERP Core Milestone

The ERP core is the shared foundation for reusable, config-driven ERP pages. Its purpose is to let future pages use stable shell, command, data, factbox, popup, and state contracts underneath the finalized Filaz UI design without rewriting page-specific screens too early.

## Completed So Far

- `command-bar`: generic action bar with configurable standard actions and config-driven commands.
- `data-surface`: generic table surface driven by column config and row data.
- `factbox-host`: reusable side-panel container driven by sections, fields, badges, and selected record data.
- `shell demo`: temporary isolated demo that combines command bar, data surface, and factbox host.
- `popup-stack.service`: foundation for managing generic popup stack state.

## Current Rule

- Do not change the finalized Filaz UI design.
- The core should become config-driven underneath the existing visual direction.
- Real pages should not be migrated until component contracts are stable.

## Next Planned Steps

- Add a `popup-host` demo.
- Define the document page pattern.
- Use Purchase Invoice as the first real consumer after the contracts settle.
