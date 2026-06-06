# Menu Update Audit

## Sources

- Live website assignments: `data/processed/clean-menu.json`
- Current active recipe validation: `active-recipes.json`
- Existing workbook: `summer-menu-master.xlsx`

Only the existing **Full Menu** worksheet was synchronized. Procurement and audit worksheets were preserved unchanged, as requested; recipe content and ingredient lists were not regenerated.

## Changes

| Metric | Count |
| --- | ---: |
| Original Full Menu rows | 392 |
| Rows removed | 3 |
| Rows added | 0 |
| Duplicate rows removed | 0 |
| Missing active assignments added | 0 |
| Final Full Menu rows | 389 |

### Rows Removed

- Week 2 / Tuesday / Alternative: (blank/unassigned slot)
- Week 3 / Tuesday / Alternative: (blank/unassigned slot)
- Week 4 / Sunday / Alternative: (blank/unassigned slot)

### Rows Added

- None

## Validation

- Every output row corresponds to a populated live Summer Menu assignment: **Passed**
- Every menu item resolves against the current active recipe database: **Passed**
- Deleted/inactive recipes remaining: **0**
- Duplicate assignment rows: **0**
- Blank/unassigned rows: **0**
- Week/day/category/menu item set exactly matches the populated website assignments: **Passed**
- Final row count equals active populated assignment count: **389**
- Worksheet names, other worksheets, table formatting, filters, freeze pane, and column widths preserved: **Passed**

Repeated menu items assigned to different legitimate slots are retained. Duplicate validation applies to complete `Week + Day + Category + Menu Item` rows.
