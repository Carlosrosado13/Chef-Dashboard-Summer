# Summer Menu Procurement Report

Generated from:

- `data/processed/clean-menu.json` (active dashboard menu source)
- `data/recipes/sample-recipes.json`
- `recipe-repair-priority-report.md`

## Summary

| Metric | Count |
| --- | ---: |
| Total menu assignments | 392 |
| Nonblank menu items | 389 |
| Total recipe links | 389 |
| Distinct linked recipes | 368 |
| Missing recipes | 3 |
| Menu assignments with incomplete ingredients | 255 |
| Menu assignments with missing/placeholder instructions | 223 |
| Procurement summary ingredients | 696 |
| Weekly procurement rows | 890 |
| Invalid, zero-quantity, or placeholder ingredient lines excluded from aggregation | 296 |
| Linked assignments represented in repair priority report | 365 |

## Recipe Match Confidence

| Match Type | Count | Confidence |
| --- | ---: | ---: |
| Exact title | 376 | 100% |
| Normalized title | 13 | 99% |
| Fuzzy title (>90%) | 0 | Actual similarity score |
| Missing/unmatched | 3 | Below threshold or blank |

Normalized matching is case-insensitive, removes punctuation/diacritics, standardizes ampersands, and ignores dietary-only parentheticals such as `(DF/GF)`. Fuzzy matching uses normalized Levenshtein similarity and only accepts scores strictly above 90%.

## Uncertain Matches

- Week 1, Monday, Appetizer 1: `3 Sisters Indigenous Soup` -> `3 - Sisters Indigenous Soup` (Normalized, 99%)
- Week 2, Monday, Soup 1: `GAZPACHO SOUP (DF/GF)` -> `GAZPACHO SOUP` (Normalized, 99%)
- Week 2, Tuesday, Veggie 1: `GRILLED ASPARAGUS` -> `Grilled Asparagus` (Normalized, 99%)
- Week 2, Wednesday, Veggie 1: `SAUTEED SPINACH WITH DICED ONIONS` -> `Sauteed Spinach with Diced Onions` (Normalized, 99%)
- Week 2, Thursday, Dessert: `ASSORTED DESSERTS` -> `Assorted Desserts` (Normalized, 99%)
- Week 2, Thursday, Veggie 2: `BUTTERED PEAS` -> `Buttered Peas` (Normalized, 99%)
- Week 2, Saturday, Soup 1: `SUMMER MINESTRONE (DF)` -> `SUMMER MINESTRONE` (Normalized, 99%)
- Week 2, Sunday, Starch: `WILD RICE PILAF` -> `Wild Rice Pilaf` (Normalized, 99%)
- Week 3, Tuesday, Veggie 1: `STEAMED BROCCOLI` -> `Steamed Broccoli` (Normalized, 99%)
- Week 3, Thursday, Dessert: `ASSORTED DESSERTS` -> `Assorted Desserts` (Normalized, 99%)
- Week 3, Thursday, Veggie 1: `GRILLED ASPARAGUS` -> `Grilled Asparagus` (Normalized, 99%)
- Week 4, Thursday, Dessert: `ASSORTED DESSERTS` -> `Assorted Desserts` (Normalized, 99%)
- Week 4, Sunday, Starch: `STEAMED BROCCOLI` -> `Steamed Broccoli` (Normalized, 99%)

## Audit Rules

- **No linked recipe:** no exact, normalized, or >90% fuzzy title match.
- **Incomplete ingredients:** ingredients are absent, contain placeholder content, or include a line with a missing/non-positive quantity, missing name, or missing unit.
- **Missing or placeholder instructions:** instructions are absent/blank or contain the explicit placeholder instruction.
- The repair priority report is used as a cross-check against linked recipe titles; current recipe content controls the final issue status so repaired recipes are not marked missing solely because of an older report classification.
- Procurement includes every usable quantified ingredient line from linked recipes. Ingredient usage counts distinct recipe titles; weekly quantities count each menu assignment.
- Ingredient quantities are combined only when both normalized ingredient name and unit match. No unit conversions are assumed.

## Validation

- Full Menu rows: **392**
- Unique Full Menu rows: **392**
- Weeks present: **Week 1, Week 2, Week 3, Week 4**
- Duplicate rows: **0**
- Workbook package reopened and all required Open XML parts parsed successfully: **Yes**
- Worksheet names verified: **Full Menu, Procurement Summary, Weekly Procurement, Missing Recipes Audit**
- Formula cells: **0** (the workbook uses static audited totals; no formulas are required)
- Formula errors: **0**
