# Duplicate Cleanup Report

Duplicate recipe groups were resolved without modifying menu assignments, recipe links, or schema.

## Summary

- Duplicate normalized title groups before: 3
- Duplicate normalized title groups after: 0
- Duplicate recipe ID groups before: 3
- Duplicate recipe ID groups after: 0
- Records removed: 4
- Records retained: 3
- Nonblank broken menu links before: 0
- Nonblank broken menu links after: 0
- Blank menu assignments still unresolved: 3

## Records Retained

| Original index | Title | Summary |
|---:|---|---|
| 9 | Citrus and Shrimp Lemon Lavender Cups | Retained title, category, yield, week/day/menu-slot metadata. Replaced generic method with dish-specific method cues from duplicate index 78 and added cleanup notes. |
| 27 | Fried Calamari with Smoked Paprika Dip | Retained existing record and metadata. No merge from duplicate index 79 because duplicate body did not match calamari. |
| 81 | 3 - Sisters Indigenous Soup | Retained most complete 3 Sisters Indigenous Soup record with 17 ingredients and 6 steps. |

## Records Removed

| Original index | Title | Reason |
|---:|---|---|
| 78 | Citrus and Shrimp Lemon Lavender Cups | Merged useful method cues into retained index 9, then removed duplicate. |
| 79 | Fried Calamari with Smoked Paprika Dip | Removed duplicate title/ID. Body appeared to describe fish cakes rather than Fried Calamari. |
| 82 | 3 Sisters Indigenous Soup | Removed duplicate 3 Sisters Indigenous Soup record; retained more complete index 81. |
| 83 | 3 Sisters Indigenous Soup | Removed duplicate 3 Sisters Indigenous Soup record; retained more complete index 81. |

## Merged Content Summary

- Citrus and Shrimp Lemon Lavender Cups: retained original index 9. Generic production method (6 steps) was replaced with 6 dish-specific steps based on useful method content from original index 78.
- Citrus ingredients from original index 78 were not copied into structured ingredients because the duplicate had a different yield and malformed unit/zero-quantity artifacts. Ingredient cues were preserved in notes for later chef review.
- Fried Calamari with Smoked Paprika Dip: no content merged from original index 79 because its ingredients and method appear to describe fish cakes rather than calamari.
- 3 Sisters Indigenous Soup: no content merged from original indexes 82 and 83 because original index 81 had the most complete method and ingredient set.

## Menu Link Verification

- Total menu assignments checked: 392
- Remaining broken links: 3
- Remaining nonblank broken links: 0
- Remaining blank assignment slots: 3

All nonblank menu assignments still resolve to recipes after duplicate cleanup.
