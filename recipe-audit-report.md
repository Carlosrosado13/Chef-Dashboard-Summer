# Recipe Audit Report

Generated from the current Chef Dashboard repository data. Existing dashboard, menu, and recipe data were not modified.

## Files Scanned

- Active recipe database: `data/recipes/sample-recipes.json`
- Active menu assignments: `data/processed/clean-menu.json`
- Recipe loader: `js/loadRecipes.js`

## Summary

- Total recipes: 84
- Recipes with issues: 28
- Duplicate recipe title/ID issues: 14
- Missing field issues: 0
- Empty array issues: 0
- Weird quantity issues: 145
- Malformed unit issues: 203
- Ingredient formatting issues: 0
- Step formatting issues: 0
- Spelling/taxonomy checks: 5
- Invalid category issues: 6
- Orphan recipes: 15
- Broken menu recipe links: 312
- Total audit findings: 700

## Issue Counts

| Issue type | Count |
|---|---:|
| Missing Fields | 0 |
| Empty Arrays | 0 |
| Duplicates | 14 |
| Invalid Categories | 6 |
| Weird Quantities | 145 |
| Malformed Units | 203 |
| Ingredient Formatting Inconsistencies | 0 |
| Step Formatting Inconsistencies | 0 |
| Spelling And Taxonomy Checks | 5 |
| Broken Recipe References | 312 |
| Orphan Recipes | 15 |

## Detailed Findings

### Missing Fields

_No issues found._

### Empty Arrays

_No issues found._

### Duplicates

| Recipe title | Issue | Location |
|---|---|---|
| Citrus and Shrimp Lemon Lavender Cups | Duplicate recipe title after normalization: citrus and shrimp lemon lavender cups | data/recipes/sample-recipes.json:399 title |
| Citrus and Shrimp Lemon Lavender Cups | Duplicate recipe title after normalization: citrus and shrimp lemon lavender cups | data/recipes/sample-recipes.json:4872 title |
| Fried Calamari with Smoked Paprika Dip | Duplicate recipe title after normalization: fried calamari with smoked paprika dip | data/recipes/sample-recipes.json:1405 title |
| Fried Calamari with Smoked Paprika Dip | Duplicate recipe title after normalization: fried calamari with smoked paprika dip | data/recipes/sample-recipes.json:4929 title |
| 3 - Sisters Indigenous Soup | Duplicate recipe title after normalization: 3 sisters indigenous soup | data/recipes/sample-recipes.json:5101 title |
| 3 Sisters Indigenous Soup | Duplicate recipe title after normalization: 3 sisters indigenous soup | data/recipes/sample-recipes.json:5201 title |
| 3 Sisters Indigenous Soup | Duplicate recipe title after normalization: 3 sisters indigenous soup | data/recipes/sample-recipes.json:5292 title |
| Citrus and Shrimp Lemon Lavender Cups | Duplicate recipe ID: citrus-and-shrimp-lemon-lavender-cups | data/recipes/sample-recipes.json:399 id/generatedId |
| Citrus and Shrimp Lemon Lavender Cups | Duplicate recipe ID: citrus-and-shrimp-lemon-lavender-cups | data/recipes/sample-recipes.json:4872 id/generatedId |
| Fried Calamari with Smoked Paprika Dip | Duplicate recipe ID: fried-calamari-with-smoked-paprika-dip | data/recipes/sample-recipes.json:1405 id/generatedId |
| Fried Calamari with Smoked Paprika Dip | Duplicate recipe ID: fried-calamari-with-smoked-paprika-dip | data/recipes/sample-recipes.json:4929 id/generatedId |
| 3 - Sisters Indigenous Soup | Duplicate recipe ID: 3-sisters-indigenous-soup | data/recipes/sample-recipes.json:5101 id/generatedId |
| 3 Sisters Indigenous Soup | Duplicate recipe ID: 3-sisters-indigenous-soup | data/recipes/sample-recipes.json:5201 id/generatedId |
| 3 Sisters Indigenous Soup | Duplicate recipe ID: 3-sisters-indigenous-soup | data/recipes/sample-recipes.json:5292 id/generatedId |

### Invalid Categories

| Recipe title | Issue | Location |
|---|---|---|
| Grilled Lemon-Herb Chicken | Invalid category: entree | data/recipes/sample-recipes.json:3 category |
| Beef Bourguignon | Invalid category: entree | data/recipes/sample-recipes.json:35 category |
| Cream of Mushroom Soup | Invalid category: soup | data/recipes/sample-recipes.json:67 category |
| Beef Meatloaf with Jus | Invalid category: entree | data/recipes/sample-recipes.json:99 category |
| Coffee-Rubbed Beef Tenderloin, shallot butter (GF) | Invalid category: dinner elevated | data/recipes/sample-recipes.json:131 category |
| Miso and Soy Chilean Sea Bass | Invalid category: Traditional | data/recipes/sample-recipes.json:158 category |

### Weird Quantities

| Recipe title | Issue | Location |
|---|---|---|
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[0].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[1].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[2].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[3].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[4].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[5].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[6].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[7].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[8].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[9].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[10].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[11].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[12].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[13].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[14].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[15].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[16].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[17].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[18].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[19].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[20].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[21].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[22].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[23].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[24].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[25].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[26].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[27].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[28].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[29].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[30].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[31].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[33].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[34].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[35].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[36].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[37].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[38].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[39].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[40].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[41].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[42].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[43].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[44].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[45].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[46].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[47].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[48].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[49].amount |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:3898 ingredients[50].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[0].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[1].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[2].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[3].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[4].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[5].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[6].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[7].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[8].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[9].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[10].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[11].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[12].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[13].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[14].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[15].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[16].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[17].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[18].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[19].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[20].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[21].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[22].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[23].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[24].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[25].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[26].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[27].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[28].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[29].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[30].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[31].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[33].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[34].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[35].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[36].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[37].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[38].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[39].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[40].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[41].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[42].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[43].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[44].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[45].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[46].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[47].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[48].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[49].amount |
| BOSTON CREAM PIE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4171 ingredients[50].amount |
| TOMATO BASIL PIZETTE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4495 ingredients[2].amount |
| TOMATO BASIL PIZETTE | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4495 ingredients[6].amount |
| THAI CHICKEN NOODLE SOUP | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4578 ingredients[15].amount |
| SEARED CATFISH | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4675 ingredients[0].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[0].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[1].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[2].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[3].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[4].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[5].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[6].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[7].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[8].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[9].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[10].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[11].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[12].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[13].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[14].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[15].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[16].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[17].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[18].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[19].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[20].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[21].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[22].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[23].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[24].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[25].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[26].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[27].amount |
| CHICKEN CAESAR SALAD | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4713 ingredients[28].amount |
| Citrus and Shrimp Lemon Lavender Cups | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4872 ingredients[2].amount |
| Fried Calamari with Smoked Paprika Dip | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4929 ingredients[2].amount |
| Fried Calamari with Smoked Paprika Dip | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:4929 ingredients[13].amount |
| Thai Fish Cakes with Cilantro Dip | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:5015 ingredients[2].amount |
| Thai Fish Cakes with Cilantro Dip | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:5015 ingredients[13].amount |
| 3 - Sisters Indigenous Soup | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:5101 ingredients[9].amount |
| 3 - Sisters Indigenous Soup | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:5101 ingredients[15].amount |
| 3 - Sisters Indigenous Soup | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:5101 ingredients[16].amount |
| 3 Sisters Indigenous Soup | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:5201 ingredients[14].amount |
| 3 Sisters Indigenous Soup | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:5201 ingredients[15].amount |
| 3 Sisters Indigenous Soup | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:5292 ingredients[14].amount |
| 3 Sisters Indigenous Soup | Weird quantity: amount is 0 | data/recipes/sample-recipes.json:5292 ingredients[15].amount |

### Malformed Units

| Recipe title | Issue | Location |
|---|---|---|
| Miso and Soy Chilean Sea Bass | Malformed unit: blank unit | data/recipes/sample-recipes.json:158 ingredients[5].unit |
| Spinach and Ricotta Manicotti | Malformed unit: blank unit | data/recipes/sample-recipes.json:208 ingredients[0].unit |
| Spinach and Ricotta Manicotti | Malformed unit: blank unit | data/recipes/sample-recipes.json:208 ingredients[1].unit |
| Spinach and Ricotta Manicotti | Malformed unit: blank unit | data/recipes/sample-recipes.json:208 ingredients[3].unit |
| Spinach and Ricotta Manicotti | Malformed unit: blank unit | data/recipes/sample-recipes.json:208 ingredients[9].unit |
| Spinach and Ricotta Manicotti | Malformed unit: blank unit | data/recipes/sample-recipes.json:208 ingredients[10].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[0].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[1].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[2].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[3].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[4].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[5].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[6].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[7].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[8].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[9].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[10].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[11].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[12].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[13].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[14].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[15].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[16].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[17].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[18].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[19].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[20].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[21].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[22].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[23].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[24].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[25].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[26].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[27].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[28].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[29].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[30].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[31].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[32].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[33].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[34].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[35].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[36].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[37].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[38].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[39].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[40].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[41].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[42].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[43].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[44].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[45].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[46].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[47].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[48].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[49].unit |
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | Malformed unit: blank unit | data/recipes/sample-recipes.json:3898 ingredients[50].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[0].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[1].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[2].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[3].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[4].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[5].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[6].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[7].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[8].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[9].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[10].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[11].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[12].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[13].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[14].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[15].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[16].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[17].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[18].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[19].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[20].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[21].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[22].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[23].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[24].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[25].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[26].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[27].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[28].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[29].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[30].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[31].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[32].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[33].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[34].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[35].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[36].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[37].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[38].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[39].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[40].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[41].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[42].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[43].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[44].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[45].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[46].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[47].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[48].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[49].unit |
| BOSTON CREAM PIE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4171 ingredients[50].unit |
| WHITE BEAN DIP WITH TOASTED PITA CHIPS | Malformed unit: blank unit | data/recipes/sample-recipes.json:4444 ingredients[1].unit |
| WHITE BEAN DIP WITH TOASTED PITA CHIPS | Malformed unit: blank unit | data/recipes/sample-recipes.json:4444 ingredients[2].unit |
| WHITE BEAN DIP WITH TOASTED PITA CHIPS | Malformed unit: blank unit | data/recipes/sample-recipes.json:4444 ingredients[5].unit |
| WHITE BEAN DIP WITH TOASTED PITA CHIPS | Malformed unit: blank unit | data/recipes/sample-recipes.json:4444 ingredients[7].unit |
| TOMATO BASIL PIZETTE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4495 ingredients[0].unit |
| TOMATO BASIL PIZETTE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4495 ingredients[2].unit |
| TOMATO BASIL PIZETTE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4495 ingredients[5].unit |
| TOMATO BASIL PIZETTE | Malformed unit: blank unit | data/recipes/sample-recipes.json:4495 ingredients[6].unit |
| THAI CHICKEN NOODLE SOUP | Malformed unit: blank unit | data/recipes/sample-recipes.json:4578 ingredients[1].unit |
| THAI CHICKEN NOODLE SOUP | Malformed unit: blank unit | data/recipes/sample-recipes.json:4578 ingredients[2].unit |
| THAI CHICKEN NOODLE SOUP | Malformed unit: blank unit | data/recipes/sample-recipes.json:4578 ingredients[3].unit |
| THAI CHICKEN NOODLE SOUP | Malformed unit: blank unit | data/recipes/sample-recipes.json:4578 ingredients[4].unit |
| THAI CHICKEN NOODLE SOUP | Malformed unit: blank unit | data/recipes/sample-recipes.json:4578 ingredients[5].unit |
| THAI CHICKEN NOODLE SOUP | Malformed unit: blank unit | data/recipes/sample-recipes.json:4578 ingredients[8].unit |
| THAI CHICKEN NOODLE SOUP | Malformed unit: blank unit | data/recipes/sample-recipes.json:4578 ingredients[9].unit |
| THAI CHICKEN NOODLE SOUP | Malformed unit: blank unit | data/recipes/sample-recipes.json:4578 ingredients[15].unit |
| SEARED CATFISH | Malformed unit: blank unit | data/recipes/sample-recipes.json:4675 ingredients[0].unit |
| SEARED CATFISH | Malformed unit: blank unit | data/recipes/sample-recipes.json:4675 ingredients[1].unit |
| SEARED CATFISH | Malformed unit: blank unit | data/recipes/sample-recipes.json:4675 ingredients[3].unit |
| SEARED CATFISH | Malformed unit: blank unit | data/recipes/sample-recipes.json:4675 ingredients[4].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[0].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[1].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[2].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[3].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[4].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[5].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[6].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[7].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[8].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[9].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[10].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[11].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[12].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[13].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[14].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[15].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[16].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[17].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[18].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[19].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[20].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[21].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[22].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[23].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[24].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[25].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[26].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[27].unit |
| CHICKEN CAESAR SALAD | Malformed unit: blank unit | data/recipes/sample-recipes.json:4713 ingredients[28].unit |
| Citrus and Shrimp Lemon Lavender Cups | Malformed unit: blank unit | data/recipes/sample-recipes.json:4872 ingredients[0].unit |
| Citrus and Shrimp Lemon Lavender Cups | Malformed unit: blank unit | data/recipes/sample-recipes.json:4872 ingredients[2].unit |
| Citrus and Shrimp Lemon Lavender Cups | Malformed unit: blank unit | data/recipes/sample-recipes.json:4872 ingredients[6].unit |
| Citrus and Shrimp Lemon Lavender Cups | Malformed unit: blank unit | data/recipes/sample-recipes.json:4872 ingredients[7].unit |
| Citrus and Shrimp Lemon Lavender Cups | Malformed unit: blank unit | data/recipes/sample-recipes.json:4872 ingredients[8].unit |
| Fried Calamari with Smoked Paprika Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:4929 ingredients[0].unit |
| Fried Calamari with Smoked Paprika Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:4929 ingredients[1].unit |
| Fried Calamari with Smoked Paprika Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:4929 ingredients[2].unit |
| Fried Calamari with Smoked Paprika Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:4929 ingredients[3].unit |
| Fried Calamari with Smoked Paprika Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:4929 ingredients[4].unit |
| Fried Calamari with Smoked Paprika Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:4929 ingredients[8].unit |
| Fried Calamari with Smoked Paprika Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:4929 ingredients[11].unit |
| Fried Calamari with Smoked Paprika Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:4929 ingredients[13].unit |
| Thai Fish Cakes with Cilantro Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:5015 ingredients[0].unit |
| Thai Fish Cakes with Cilantro Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:5015 ingredients[1].unit |
| Thai Fish Cakes with Cilantro Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:5015 ingredients[2].unit |
| Thai Fish Cakes with Cilantro Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:5015 ingredients[3].unit |
| Thai Fish Cakes with Cilantro Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:5015 ingredients[4].unit |
| Thai Fish Cakes with Cilantro Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:5015 ingredients[8].unit |
| Thai Fish Cakes with Cilantro Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:5015 ingredients[11].unit |
| Thai Fish Cakes with Cilantro Dip | Malformed unit: blank unit | data/recipes/sample-recipes.json:5015 ingredients[13].unit |
| 3 - Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5101 ingredients[1].unit |
| 3 - Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5101 ingredients[6].unit |
| 3 - Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5101 ingredients[7].unit |
| 3 - Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5101 ingredients[8].unit |
| 3 - Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5101 ingredients[9].unit |
| 3 - Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5101 ingredients[10].unit |
| 3 - Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5101 ingredients[11].unit |
| 3 - Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5101 ingredients[12].unit |
| 3 - Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5101 ingredients[13].unit |
| 3 - Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5101 ingredients[15].unit |
| 3 - Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5101 ingredients[16].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5201 ingredients[1].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5201 ingredients[2].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5201 ingredients[3].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5201 ingredients[4].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5201 ingredients[9].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5201 ingredients[14].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5201 ingredients[15].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5292 ingredients[1].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5292 ingredients[2].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5292 ingredients[3].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5292 ingredients[4].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5292 ingredients[9].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5292 ingredients[14].unit |
| 3 Sisters Indigenous Soup | Malformed unit: blank unit | data/recipes/sample-recipes.json:5292 ingredients[15].unit |

### Ingredient Formatting Inconsistencies

_No issues found._

### Step Formatting Inconsistencies

_No issues found._

### Spelling And Taxonomy Checks

| Recipe title | Issue | Location |
|---|---|---|
| Coffee-Rubbed Beef Tenderloin, shallot butter (GF) | Category spelling/taxonomy check: non-slot category; use Elevated | data/recipes/sample-recipes.json:131 category |
| Miso and Soy Chilean Sea Bass | Category spelling/taxonomy check: legacy Dinner category; use Comfort | data/recipes/sample-recipes.json:158 category |
| California Brococli Salad | Spelling check: possible misspelling of broccoli | data/recipes/sample-recipes.json:850 title |
| Whaldorf Endive Salad | Spelling check: possible misspelling of Waldorf | data/recipes/sample-recipes.json:2421 title |
| Grilled Shirmp with Mango Salsa | Spelling check: possible misspelling of shrimp | data/recipes/sample-recipes.json:3110 title |

### Broken Recipe References

| Recipe title | Issue | Location |
|---|---|---|
| COCONUT SHRIMP WITH LIME DIP | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Monday.Appetizer 1 |
| CARROT AND ORANGE SOUP | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Monday.Appetizer 2 |
| MAPLE GLAZED SALMON FILET WITH | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Monday.Elevated |
| CHICKEN CORDON BLEU | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Monday.Comfort |
| ROAST CHICKEN WITH PAPRIKA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Monday.Alternative |
| STEAMED CAULIFLOWER FLORETS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Monday.Veggie 1 |
| STEAMED CARROTS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Monday.Veggie 2 |
| BAKED FARRO PILAF | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Monday.Starch |
| BLACK FOREST CAKE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Monday.Dessert |
| ROASTED RED PEPPER HUMMUS AND PITA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Tuesday.Appetizer 1 |
| SPICY TUNA AND CRISPY RICE CRACKER | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Tuesday.Appetizer 2 |
| SEARED HALIBUT WITH CHERRY TOMATO&OLIVE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Tuesday.Elevated |
| PASTA WITH SUMMER VEGETABLES WITH LEMON PARMESAN SAUCE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Tuesday.Comfort |
| (blank menu assignment) | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Tuesday.Alternative |
| ROASTED MUSHROOMS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Tuesday.Veggie 2 |
| WILD RICE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Tuesday.Starch |
| PEACH FRIED PIES | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Tuesday.Dessert |
| SHAVED FENNEL AND ORANGE SALAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Wednesday.Appetizer 1 |
| CUCUMBER AND DILL SALAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Wednesday.Appetizer 2 |
| CHICKEN MARSALA IN MUSHROOM SAUCE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Wednesday.Elevated |
| OPEN FACED ROAST BEEF DIP | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Wednesday.Comfort |
| LEMON BAKED COD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Wednesday.Alternative |
| ROASTED BABY TOP CARROTS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Wednesday.Veggie 2 |
| GARLIC MASHED POTATOES | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Wednesday.Starch |
| BANANA CREAM PIE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Wednesday.Dessert |
| CORN CHOWDER | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Thursday.Appetizer 1 |
| MANGO AND AVOCADO SALAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Thursday.Appetizer 2 |
| VEAL SHANK WITH NATURAL JUS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Thursday.Elevated |
| CHICKEN PARMESAN | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Thursday.Comfort |
| SEARED SCALLOPS WITH SQUASH PUREE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Thursday.Alternative |
| ROASTED ZUCCHINI CHUNKS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Thursday.Veggie 1 |
| ANCIENT GRAINS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Thursday.Starch |
| SMOKED SALMON CUCUMBER BITES | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Friday.Appetizer 1 |
| GAZPACHO SOUP | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Friday.Appetizer 2 |
| TURKEY ROULADE WITH SPINACH&SUNDRIED TOMATO                     (GF/DF) | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Friday.Elevated |
| SPAGHETTI AND MEATBALLS IN MARINARA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Friday.Comfort |
| GRILLED TILAPIA WITH BALSAMIC ONION SAUCE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Friday.Alternative |
| BROCCOLINI WITH GARLIC CONFIT | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Friday.Veggie 1 |
| SUMAC SPICED ROASTED CARROT CHUNKS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Friday.Veggie 2 |
| HERB AND CREAM CHEESE POLENTA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Friday.Starch |
| LEMON BREAD WITH ICING | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Friday.Dessert |
| GRILLED ZUCCHINI ROLLUP WITH RICOTTA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Saturday.Appetizer 1 |
| BACON AND CLAM FLATBREAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Saturday.Appetizer 2 |
| RED WINE BRAISED BEEF BRISKET | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Saturday.Elevated |
| ROASTED PORK TENDERLOIN WITH OLIVE AND FETA SALSA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Saturday.Comfort |
| WILD MUSHROOM TART WITH GOAT CHEESE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Saturday.Alternative |
| ROASTED MEXICAN STREET CORN | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Saturday.Veggie 1 |
| BRAISED BEAN CASSOULET | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Saturday.Veggie 2 |
| HERB ROASTED POTATO WEDGES | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Saturday.Starch |
| KEY LIME PIE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Saturday.Dessert |
| ZUCCHINI FRITTERS WITH DIP | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Sunday.Appetizer 1 |
| SOBA NOODLE SALAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Sunday.Appetizer 2 |
| SHRIMP LINGUINI WITH SAFFRON SAUCE AND PEPPERED GREENS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Sunday.Elevated |
| ROASTED CHICKEN BREAST IN CREAMY SUNDRIED TOMATO SAUCE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Sunday.Comfort |
| SEARED SALMON WITH BASIL PESTO SAUCE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Sunday.Alternative |
| SAUTEED ASPARAGUS (2" CUTS) | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Sunday.Veggie 1 |
| ROASTED BUTTERNUT SQUASH | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Sunday.Veggie 2 |
| PEACH COBBLER | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 2.Sunday.Dessert |
| GERMAN POTATO SALAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Monday.Appetizer 1 |
| CHILLED MELON SOUP WITH PROSCIUTTO CHIP | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Monday.Appetizer 2 |
| SHRIMP CURRY | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Monday.Elevated |
| BAKED CHICKEN IN CREAMY BASIL AND CORN SAUCE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Monday.Comfort |
| SEARED SALMON FILET WITH PINEAPPLE SALSA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Monday.Alternative |
| SAUTEED BOK CHOY | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Monday.Veggie 1 |
| ROASTED CARROTS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Monday.Veggie 2 |
| SCALLOPED POTATOES | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Monday.Starch |
| ORANGE CUSTARD WITH BLACKBERRY | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Monday.Dessert |
| AVGOLEMONO SOUP (GREEK LEMON CHICKEN) | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Tuesday.Appetizer 1 |
| SPINACH STRAWBERRY SALAD WITH ALMOND & GOAT CHEESE HONEY MUSTARD DRESSING | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Tuesday.Appetizer 2 |
| BEEF BRISKET BBQ | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Tuesday.Elevated |
| FRIED CHICKEN | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Tuesday.Comfort |
| (blank menu assignment) | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Tuesday.Alternative |
| GREEN AND YELLOW BEAN | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Tuesday.Veggie 2 |
| GARLIC MASHED POTATO | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Tuesday.Starch |
| INDIAN PUDDING (MOLASSES/CORNMEAL) | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Tuesday.Dessert |
| CLASSIC DEVILLED EGGS WITH BABY GREENS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Wednesday.Appetizer 2 |
| GRILLED TILAPIA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Wednesday.Elevated |
| TURKEY CUTLET WITH ARUGULA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Wednesday.Comfort |
| CARAMELIZED ONION TART | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Wednesday.Alternative |
| GRILLED EGGPLANT CHUNKS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Wednesday.Veggie 1 |
| ROASTED ZUCCHINI | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Wednesday.Veggie 2 |
| BUTTERED HERB NOODLE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Wednesday.Starch |
| SAUTEED SHRIMP AND PESTO PASTA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Thursday.Elevated |
| SALMON FILET WITH TZATZIKI SAUCE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Thursday.Comfort |
| TOMATO CHEDDAR AND BACON PIE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Thursday.Alternative |
| SAUTEED BABY PEPPERS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Thursday.Veggie 2 |
| STICKY JASMINE RICE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Thursday.Starch |
| RIBBON SALAD WITH ORANGE VINAIGRETTE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Friday.Appetizer 1 |
| CREAM OF ASPARAGUS SOUP WITH SOUR CREAM | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Friday.Appetizer 2 |
| BEEF STROGANOFF | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Friday.Elevated |
| CARROT AND PEA MIX | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Friday.Veggie 1 |
| STEAMED CAULIFLOWER | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Friday.Veggie 2 |
| CORNBREAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Friday.Starch |
| CLASSIC BUTTER TARTS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Friday.Dessert |
| SMOKED SALMON & AVOCADO MOUSSE PLATE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Saturday.Appetizer 1 |
| ROASTED RED PEPPER SOUP | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Saturday.Appetizer 2 |
| DOVER SOLE WITH HERB OIL | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Saturday.Elevated |
| GRILLED LEMON GARLIC CHICKEN BREAST | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Saturday.Comfort |
| GRILLED VEGETABLE SKEWER | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Saturday.Alternative |
| GRILLED ZUCCHINI CHUNKS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Saturday.Veggie 1 |
| STEAMED CARROT WEDGES | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Saturday.Veggie 2 |
| FARO WITH FRESH HERBS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Saturday.Starch |
| SHOOFLY PIE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Saturday.Dessert |
| HUSH PUPPIES WITH GARLIC DIP | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Sunday.Appetizer 1 |
| GRILLED EGGPLANT CAPRESE DISH | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Sunday.Appetizer 2 |
| BBQ PORK BACK RIBS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Sunday.Elevated |
| CREAMY MAC N CHEESE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Sunday.Comfort |
| CHICKEN MARSALA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Sunday.Alternative |
| STEAMED GREEN BEANS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Sunday.Veggie 1 |
| ROASTED ROOT VEGETABLE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Sunday.Veggie 2 |
| LOADED BAKED POTATO | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Sunday.Starch |
| POUDING CHOMEUR | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 3.Sunday.Dessert |
| SHRIMP CEVICHE WITH CROSTINI AND SALSA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Monday.Appetizer 1 |
| TOMATO PUFF TART | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Monday.Appetizer 2 |
| JAMBALAYA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Monday.Elevated |
| CHICKEN BROCCOLI RICE CASSEROLE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Monday.Comfort |
| CORN SPOONBREAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Monday.Alternative |
| ROASTED BROCCOLINI | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Monday.Veggie 1 |
| STEAMED CARROTS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Monday.Veggie 2 |
| ROASTED POTATO | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Monday.Starch |
| STRAWBERRY LEMONADE BARS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Monday.Dessert |
| LEMON ORZO SALAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Tuesday.Appetizer 1 |
| TARRAGON CHICKEN SALAD CROSTINI | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Tuesday.Appetizer 2 |
| CHICKEN FRANCESE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Tuesday.Elevated |
| CLASSIC BEEF CHILI | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Tuesday.Comfort |
| VEGETABLE ENCHILADAS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Tuesday.Alternative |
| ROASTED BUTTERNUT SQUASH | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Tuesday.Veggie 1 |
| SAUTEED PEPPERS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Tuesday.Veggie 2 |
| SPANISH RICE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Tuesday.Starch |
| BLUEBERRY CRUMBLE CHEESECAKE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Tuesday.Dessert |
| GRILLED CLAMS WITH CUCUMBER AND SCALLION | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Wednesday.Appetizer 1 |
| MUFFULETTA OLIVE SALAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Wednesday.Appetizer 2 |
| SMOTHERED PORK CHOPS IN MUSHROOM GRAVY | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Wednesday.Elevated |
| FARFELLE PASTA WITH CHICKEN AND SAUSAGE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Wednesday.Comfort |
| GRILLED COD WITH ROMESCO SAUCE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Wednesday.Alternative |
| ROASTED BRUSSEL SPROUT WITH LEMON | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Wednesday.Veggie 1 |
| STEAMED GREEN BEANS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Wednesday.Veggie 2 |
| SWEET POTATO PUREE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Wednesday.Starch |
| MARGARITA BARS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Wednesday.Dessert |
| SUMMER RICE WRAPS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Thursday.Appetizer 1 |
| VIDALIA ONION SOUP | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Thursday.Appetizer 2 |
| GRILLED BEEF STEAK WITH GREEN PEPPERCORN SAUCE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Thursday.Elevated |
| BAKED SALMON WITH BLACK BEAN SALSA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Thursday.Comfort |
| BAKED CAULIFLOWER STEAK WITH CAJUN CORN SALSA | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Thursday.Alternative |
| SAUTEED SPINACH | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Thursday.Veggie 1 |
| STEAMED CAULIFLOWER | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Thursday.Veggie 2 |
| BUTTER MASHED POTATO | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Thursday.Starch |
| BROCCOLI CHEDDAR SOUP | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Friday.Appetizer 1 |
| WATERMELON FETA CUCUMBER SALAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Friday.Appetizer 2 |
| PORK SCHNITZEL WITH CINNAMON APPLE SAUCE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Friday.Elevated |
| TURKEY POT ROAST | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Friday.Comfort |
| GARLIC SAUTEED SHRIMP | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Friday.Alternative |
| SEARED GREEN BEANS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Friday.Veggie 1 |
| ROASTED ACORN SQUASH WEDGES | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Friday.Veggie 2 |
| SPAETZLE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Friday.Starch |
| PAVLOVA WITH FRESH BERRIES | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Friday.Dessert |
| SUMMER MINESTRONE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Saturday.Appetizer 2 |
| SALISBURY STEAK IN ONION GRAVY | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Saturday.Elevated |
| OVEN BAKED BBQ BONE-IN CHICKEN | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Saturday.Comfort |
| ROASTED VEGETABLE AND FALAFEL ON BREAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Saturday.Alternative |
| RATATOUILLE COINS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Saturday.Veggie 1 |
| TRI COLOR CAULIFLOWER GRATIN | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Saturday.Veggie 2 |
| STEAMED CARROTS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Saturday.Starch |
| APEROL SPRITZ TRIFLE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Saturday.Dessert |
| CHICKEN GNOCCHI SOUP | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Sunday.Appetizer 1 |
| CLASSIC POTATO SALAD | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Sunday.Appetizer 2 |
| LOBSTER TAIL THERMIDOR | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Sunday.Elevated |
| SPAGHETTI WITH BOLOGNESE | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Sunday.Comfort |
| (blank menu assignment) | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Sunday.Alternative |
| SAUTEED SPINACH WITH GARROT/MUSHROOM/ONION | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Sunday.Veggie 1 |
| PARMESAN GREEN BEANS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Sunday.Veggie 2 |
| CHERRY SLAB PIE BARS | Broken recipe reference: dinner menu assignment does not resolve to a recipe | data/processed/clean-menu.json dinner.Week 4.Sunday.Dessert |
| MISO & SHRIMIP SOUP WITH SCALLION DUMPLING | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Monday.Soup 1 |
| GINGER SOY SALMON WITH JASMINE RICE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Monday.Entrée 1 |
| VEGETABLE LASAGNA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Monday.Entrée 2 |
| MEDITERRANEAN TOMATO, OLIVE, & FETA IN GREEK DRESSING | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Monday.Salad |
| MANGO PUDDING | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Monday.Dessert |
| ROASTED RED PEPPER WITH DILL YOGURT | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Tuesday.Soup 1 |
| TURKEY MEDALLION WITH CRANBERRY ORANGE CHUTNEY | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Tuesday.Entrée 1 |
| LOBSTER / SHRIMP ROLL ON TOASTED BRIOCHE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Tuesday.Entrée 2 |
| ARUGULA & PEAR WITH BALSAMIC VINAIGRETTE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Tuesday.Salad |
| LEMON SORBET | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Tuesday.Dessert |
| CHICKEN TORTILLA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Wednesday.Soup 1 |
| GRILLED FISH WITH SALSA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Wednesday.Entrée 1 |
| EGGPLANT PARMESAN | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Wednesday.Entrée 2 |
| CORN & AVOCADO WITH HONEY MUSTARD VINAIGRETTE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Wednesday.Salad |
| COCONUT FLAN | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Wednesday.Dessert |
| TOMATO BASIL | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Thursday.Soup 1 |
| PHILLY CHEESESTEAK | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Thursday.Entrée 1 |
| VEGETABLE & TOFU STIRFRY | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Thursday.Entrée 2 |
| BEET & GOAT CHEESE WITH RED WINE VINAIGRETTE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Thursday.Salad |
| CHAI POACHED PEARS WITH CINNAMON TOPPING | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Thursday.Dessert |
| SEAFOOD CHOWDER | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Friday.Soup 1 |
| SPICED CHICKEN, BRIE, & AVOCADO MELT | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Friday.Entrée 1 |
| VEGETABLE PAELLA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Friday.Entrée 2 |
| CITRUS GREENS WITH CHOICE DRESSING | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Friday.Salad |
| KEY LIME MOUSSE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Friday.Dessert |
| THAI COCONUT & VEGETABLE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Saturday.Soup 1 |
| LEMONGRASS CHICKEN | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Saturday.Entrée 1 |
| CHICKPEA & VEGETABLE CURRY | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Saturday.Entrée 2 |
| GREEN MANGO SALAD WITH POPPYSEED DRESSING | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Saturday.Salad |
| PINEAPPLE CAKE WITH CITRUS TOPPING | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Saturday.Dessert |
| FRENCH LENTIL | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Sunday.Soup 1 |
| CAPRESE STYLE CHICKEN PLATE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Sunday.Entrée 1 |
| COD WITH LEMON&HERB SAUCE (GF/DF) | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Sunday.Entrée 2 |
| MEDITERRANEAN CHICKPEA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Sunday.Salad |
| APPLE TART | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 1.Sunday.Dessert |
| GAZPACHO SOUP (DF/GF) | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Monday.Soup 1 |
| GRILLED CHICKEN SOUVLAKI | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Monday.Entrée 1 |
| VEGETABLE PAD THAI WITH TOFU | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Monday.Entrée 2 |
| CUCUMBER & DILL WITH LEMON YOGURT DRESSING | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Monday.Salad |
| STRAWBERRIES & CREAM | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Monday.Dessert |
| WONTON SOUP (DF) | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Tuesday.Soup 1 |
| HOISIN BEEF & BROCCOLI | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Tuesday.Entrée 1 |
| STUFFED BOLOGNESE ZUCCHINI BOATS | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Tuesday.Entrée 2 |
| NAPPA CABBAGE SALAD WITH ASIAN VINAIGRETTE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Tuesday.Salad |
| COCONUT CREAM PIE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Tuesday.Dessert |
| BLACK BEAN SOUP WITH SCALLION CRÈME FRAICHE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Wednesday.Soup 1 |
| GRILLED CHICKEN BREAST WITH CITRUS SALSA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Wednesday.Entrée 1 |
| PASTA PRIMAVERA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Wednesday.Entrée 2 |
| TOMATO AND LIME SALAD WITH CITRUS VINAIGRETTE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Wednesday.Salad |
| MANGO SORBET | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Wednesday.Dessert |
| MUSHROOM VELOUTE (GF) | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Thursday.Soup 1 |
| ROAST PORK TENDERLOIN WITH APPLE FENNEL SLAW | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Thursday.Entrée 1 |
| SWEET POTATO & BLACK BEAN BOWL | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Thursday.Entrée 2 |
| MIXED GREENS WITH CHOICE DRESSING | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Thursday.Salad |
| PANNA COTTA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Thursday.Dessert |
| GINGER & CARROT WITH CORRIANDER YOGURT (GF) | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Friday.Soup 1 |
| CHICKEN FRIED RICE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Friday.Entrée 1 |
| STEAMED COD WITH GINGER SCALLION | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Friday.Entrée 2 |
| THAI CUCUMBER SALAD | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Friday.Salad |
| S'MORE CUPCAKES | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Friday.Dessert |
| SUMMER MINESTRONE (DF) | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Saturday.Soup 1 |
| HERB ROASTED CHICKEN | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Saturday.Entrée 1 |
| RATAOUILLE WITH LENTILS | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Saturday.Entrée 2 |
| PROSCIUTTO & MELON WITH BALSAMIC REDUCTION | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Saturday.Salad |
| VANILLA CRÈME BRULEE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Saturday.Dessert |
| CHICKEN VEGETABLE BROTH (GF) | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Sunday.Soup 1 |
| THAI GRILLED CHICKEN | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Sunday.Entrée 1 |
| VEGETABLE CURRY | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Sunday.Entrée 2 |
| SPINACH AND STRAWBERRY SALAD | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Sunday.Salad |
| ASSORTED DESSERT | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 2.Sunday.Dessert |
| SPINACH & LEEK | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Monday.Soup 1 |
| GRILLED LAMB KOFTA WITH TOMATO CUCUMBER YOGURT W/ DILL | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Monday.Entrée 1 |
| GRILLED STEAK WITH COWBOY BUTTER SAUCE (GF) | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Monday.Entrée 2 |
| MEDITERRANEAN CHICKPEA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Monday.Salad |
| YOGURT WITH HONEY, FIG & NUTS PARFAIT | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Monday.Dessert |
| HOT & SOUR BEEF SOUP | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Tuesday.Soup 1 |
| TERIYAKI CHICKEN | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Tuesday.Entrée 1 |
| VEGETABLE SUSHI ROLL | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Tuesday.Entrée 2 |
| SOBA NOODLE SALAD | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Tuesday.Salad |
| BLUEBERRY TART | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Tuesday.Dessert |
| CORN CHOWDER | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Wednesday.Soup 1 |
| MOJO PORK | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Wednesday.Entrée 1 |
| RICE & BEAN STUFFED PEPPERS | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Wednesday.Entrée 2 |
| JICAMA SLAW | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Wednesday.Salad |
| TRES LECHES | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Wednesday.Dessert |
| TOMATO & GARLIC | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Thursday.Soup 1 |
| JERK SALMON | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Thursday.Entrée 1 |
| COCONUT VEGETABLE CURRY WITH SEITAN | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Thursday.Entrée 2 |
| SPINACH & MANGO | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Thursday.Salad |
| BANANA CREAM PIE TRIFFLE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Thursday.Dessert |
| BOULLIABAISE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Friday.Soup 1 |
| BAKED HADDOCK WITH DILL SAUCE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Friday.Entrée 1 |
| VEGETABLE QUICHE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Friday.Entrée 2 |
| ARUGULA PARMESAN | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Friday.Salad |
| FRESH BERRIES & CREAM | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Friday.Dessert |
| CHILLED PEA SOUP | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Saturday.Soup 1 |
| ROAST CHICKEN W/ TARRAGON | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Saturday.Entrée 1 |
| WEST INDIES CRAB LETTUCE WRAPS WITH KEY LIME MAYO | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Saturday.Entrée 2 |
| GARDEN GREENS | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Saturday.Salad |
| PEAR AND CUSTARD TART | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Saturday.Dessert |
| SWISS ONION SOUP | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Sunday.Soup 1 |
| BEEF LASAGNA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Sunday.Entrée 1 |
| CARRIBEAN RAGU STUFFED PLANTAINS | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Sunday.Entrée 2 |
| CUCUMBER SALAD | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Sunday.Salad |
| DULCE DE LECHE PARFAIT | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 3.Sunday.Dessert |
| VEGETABLE BROTH WITH FRESH HERB | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Monday.Soup 1 |
| GRILLED FISH WITH LEMON RICE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Monday.Entrée 1 |
| CHICKPEA STEW | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Monday.Entrée 2 |
| AVOCADO & TOMATO | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Monday.Salad |
| COCONUT PANNA COTTA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Monday.Dessert |
| MISO TOFU SOUP | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Tuesday.Soup 1 |
| GINGER BEEF WITH JULIENNED ASIAN VEGETABLE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Tuesday.Entrée 1 |
| POACHED CHICKEN WITH TARRAGON YOGURT SAUCE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Tuesday.Entrée 2 |
| BABY CORN SALAD | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Tuesday.Salad |
| LIMONCELLO TIRAMISU | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Tuesday.Dessert |
| ROASTED TOMATO & FENNEL | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Wednesday.Soup 1 |
| TURKEY MEATBALLS WITH BASIL SAUCE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Wednesday.Entrée 1 |
| SALMON WITH LEMON YOGURT SAUCE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Wednesday.Entrée 2 |
| BOCCONCINI & BASIL | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Wednesday.Salad |
| LEMON CUSTARD WITH FRESH BERRIES | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Wednesday.Dessert |
| SHRIMP & CORN BROTH | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Thursday.Soup 1 |
| SEAFOOD STEW | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Thursday.Entrée 1 |
| ZUCCHINI AND RICOTTA BAKED PASTA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Thursday.Entrée 2 |
| CITRUS AVOCADO GREENS | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Thursday.Salad |
| STRAWBERRY CRUNCH POKE CAKE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Thursday.Dessert |
| TUSCAN WHITE BEAN SOUP | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Friday.Soup 1 |
| PORK TENDERLOIN WITH HERB BUTTER SAUCE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Friday.Entrée 1 |
| CLASSIC FISH AND CHIPS WITH TARTAR AND LEMON | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Friday.Entrée 2 |
| ROASTED BEET & ORANGE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Friday.Salad |
| CAMPFIRE BERRY-PEACH COBBLER | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Friday.Dessert |
| CHICKEN & WILD RICE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Saturday.Soup 1 |
| GRILLED CHICKEN BREAST WITH FRESH TOMATO&BASIL SALSA | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Saturday.Entrée 1 |
| VEGETABLE FAJITAS | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Saturday.Entrée 2 |
| SPINACH & STRAWBERRY | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Saturday.Salad |
| RICE PUDDING W/ CINNAMON (GF/DF) | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Saturday.Dessert |
| CHILLED MELON SOUP | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Sunday.Soup 1 |
| ROASTED CHICKEN LEG CHIMICHURRI | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Sunday.Entrée 1 |
| EGGPLANT & TOMATO GRATIN | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Sunday.Entrée 2 |
| ARUGULA,SHAVED FENNEL & CRISPY PROSCIUTTO | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Sunday.Salad |
| VANILLA CRÈME BRULEE | Broken recipe reference: lunch menu assignment does not resolve to a recipe | data/processed/clean-menu.json lunch.Week 4.Sunday.Dessert |

### Orphan Recipes

| Recipe title | Issue | Location |
|---|---|---|
| Grilled Lemon-Herb Chicken | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:3 |
| Beef Bourguignon | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:35 |
| Cream of Mushroom Soup | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:67 |
| Beef Meatloaf with Jus | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:99 |
| Coffee-Rubbed Beef Tenderloin, shallot butter (GF) | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:131 |
| Miso and Soy Chilean Sea Bass | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:158 |
| Spinach and Ricotta Manicotti | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:208 |
| Ginger Jasmine Rice | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:281 |
| Corn Soup | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:337 |
| Braised Short Ribs with Red Wine Sauce | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:451 |
| Fried Calamari with Smoked Paprika Dip | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:1405 |
| Citrus and Shrimp Lemon Lavender Cups | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:4872 |
| Fried Calamari with Smoked Paprika Dip | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:4929 |
| 3 Sisters Indigenous Soup | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:5201 |
| 3 Sisters Indigenous Soup | Orphan recipe: recipe is not used by any current menu assignment | data/recipes/sample-recipes.json:5292 |

## Recommended Fixes

1. Decide whether recipe categories should remain production categories or be normalized to the current Dinner/Lunch menu-slot taxonomy.
2. Link or create recipes for broken menu references, starting with current menu slots that are blank or missing from the recipe database.
3. Normalize ingredients so each line uses `{ name, amount, unit }` with a numeric amount and a recognized unit.
4. Review blank ingredient units separately; some may be legitimate each/count-style ingredients, but they should be explicit.
5. Review orphan recipes before deleting anything; several may be reusable base recipes or future menu items.
6. Fix legacy categories such as `Traditional` and `dinner elevated` after choosing the canonical taxonomy.
