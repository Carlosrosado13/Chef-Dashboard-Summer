# Final Summer Dinner Deployment Report

Generated: 2026-06-06T18:28:26.150Z

Source of truth: `C:\Users\cjr_1\Downloads\summer-menu-master-final(2).xlsx (uploaded as summer-menu-master-final.xlsx)`

Scope: Dinner only, Weeks 1-4, approved nine Dinner categories.

## Publishing Status

Production data was applied and committed locally. Remote publication is pending because GitHub HTTPS authentication could not obtain credentials in this session. The release commit is ready to push without further data changes.

## Deployment Summary

| Item | Count |
| --- | ---: |
| Final Dinner assignments | 250 |
| Dinner assignments added to blank slots | 0 |
| Dinner assignments removed | 0 |
| Dinner assignments changed | 45 |
| Recipes added | 38 |
| Recipes rebuilt from approved workbook | 155 |
| Recipes rebuilt from source URLs | 23 |
| Blocked-source recipes normalized from current data | 4 |
| Recipes preserved unchanged because Lunch uses them | 1 |
| Recipes archived and removed | 33 |
| Recipes requiring source manual review | 28 |

## Archive

Removed records were archived at `archive/recipes/removed-final-dinner-deployment-2026-06-06T18-28-26-175Z.json` before the production recipe database was written.

## Validation Results

- Dinner menu matches the approved workbook: **PASS** (250 assignments).
- Missing Dinner recipes: **PASS** (0).
- Duplicate menu assignments/recipe groups: **PASS** (0).
- Orphan recipes: **PASS** (0).
- Scaling calculations: **PASS** (0 failures).
- Dinner procurement calculations: **PASS** (0 failures).
- Lunch assignments unchanged: **PASS**.
- Lunch recipe records unchanged: **PASS**.
- Lunch procurement unchanged: **PASS**.

## Manual Review

28 source-linked recipes could not be proven complete from automated extraction. 4 sources returned HTTP 403. These are recorded in `recipe-validation-report.md`.

1 Dinner recipes have strict completeness findings because the same records are used by Lunch and were preserved unchanged: `SUMMER MINESTRONE`. Details are in `recipe-completeness-audit.xlsx`.
