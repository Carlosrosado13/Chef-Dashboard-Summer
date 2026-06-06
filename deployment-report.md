# Final Summer Dinner Deployment Report

Generated: 2026-06-06T17:16:04.960Z

Source of truth: `summer-menu-master-final.xlsx`

Scope: Dinner only, Weeks 1-4, approved nine Dinner categories.

## Publishing Status

Production data was applied and committed locally. Remote publication is pending because both configured release channels rejected their stored credentials: GitHub could not obtain HTTPS credentials, and Cloudflare Pages returned authentication error 10000.

## Deployment Summary

| Item | Count |
| --- | ---: |
| Final Dinner assignments | 250 |
| Dinner assignments added to blank slots | 2 |
| Dinner assignments removed | 1 |
| Dinner assignments changed | 105 |
| Recipes added | 38 |
| Recipes rebuilt from approved workbook | 150 |
| Recipes rebuilt from source URLs | 23 |
| Blocked-source recipes normalized from current data | 4 |
| Recipes preserved unchanged because Lunch uses them | 3 |
| Recipes archived and removed | 64 |
| Recipes requiring source manual review | 30 |

## Archive

Removed records were archived at `archive/recipes/removed-final-dinner-deployment-2026-06-06T17-16-04-972Z.json` before the production recipe database was written.

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

30 source-linked recipes could not be proven complete from automated extraction. 4 sources returned HTTP 403. These are recorded in `recipe-validation-report.md`.

3 Dinner recipes have strict completeness findings because the same records are used by Lunch and were preserved unchanged: `GAZPACHO SOUP`, `SOBA NOODLE SALAD`, `SUMMER MINESTRONE`. Details are in `recipe-completeness-audit.xlsx`.
