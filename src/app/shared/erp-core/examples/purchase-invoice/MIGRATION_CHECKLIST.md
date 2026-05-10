# Purchase Invoice Migration Checklist

## Current ERP Core Components Validated

- `erp-command-bar`
- `erp-data-surface`
- `erp-factbox-host`
- `erp-popup-host`
- `erp-document-page`
- `erp-form`
- `PopupStackService`
- Purchase Invoice example config and mock-data demo

## Real Purchase Invoice Migration Phases

### Phase 1: Read-Only Display With Real API

Render the real Purchase Invoice header and lines through ERP core using live read-only data.

### Phase 2: Command Wiring

Wire configured commands to real application actions one command at a time.

### Phase 3: Line Edit Popup

Enable line editing through a popup using `erp-form`, without changing header edit behavior.

### Phase 4: Header Edit

Introduce header editing after line edit behavior is stable.

### Phase 5: Lookups

Connect lookup fields for vendors, items, accounts, dimensions, and related records.

### Phase 6: Validation/Save

Add validation and save flows after display, commands, editing, and lookups are stable.

## Risk Rules

- Do not touch old working Purchase Invoice until read-only demo works.
- No full rewrite.
- One phase at a time.
- Preserve finalized UI.

## Data Needed

- Header endpoint
- Line endpoint
- Key fields
- Document number field
- Line parent field
- Real field names
