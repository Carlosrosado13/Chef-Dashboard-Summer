# Recipe Repair Report

Only the eight malformed recipes identified in `malformed-recipe-report.md` were repaired. Menu assignments, recipe links, recipe IDs, and schema were not modified.

## Summary

- Recipes repaired: 8
- Recipes with remaining malformed ingredient rows: 0
- Scaling validation failures: 0

## Validation Results

| Recipe | Rows before | Rows after | Remaining malformed rows | Scaling works | Summary |
|---|---:|---:|---:|---|---|
| MANHATTAN CLAM CHOWDER (TOMATO BASE) | 51 | 16 | 0 | yes | Reconstructed malformed split token ingredients into 16 structured chowder ingredients; removed parser header token from steps. |
| BOSTON CREAM PIE | 51 | 16 | 0 | yes | Replaced incorrect chowder extraction with 16 structured Boston cream pie ingredients and a dessert method. |
| CHICKEN CAESAR SALAD | 29 | 9 | 0 | yes | Reconstructed malformed split token ingredients into 9 structured salad ingredients; removed parser header token from steps. |
| 3 - Sisters Indigenous Soup | 17 | 17 | 0 | yes | Corrected malformed broth, tomato, salt/pepper, parsley, and cheese garnish rows. |
| Thai Fish Cakes with Cilantro Dip | 14 | 14 | 0 | yes | Corrected malformed fish, egg, panko, curry paste, lime, and seasoning rows. |
| TOMATO BASIL PIZETTE | 9 | 17 | 0 | yes | Split combined ingredient rows into 17 structured tomato basil pizette ingredients. |
| SEARED CATFISH | 5 | 5 | 0 | yes | Corrected malformed beurre blanc ingredient rows with normalized units. |
| THAI CHICKEN NOODLE SOUP | 16 | 16 | 0 | yes | Corrected malformed rice noodle, ginger, and lime rows. |

## Ingredient Rows Corrected

### MANHATTAN CLAM CHOWDER (TOMATO BASE)

- Recipe index: 71
- Ingredient rows before: 51
- Ingredient rows after: 16
- Remaining malformed rows: 0
- Scaling works: yes
- Repair summary: Reconstructed malformed split token ingredients into 16 structured chowder ingredients; removed parser header token from steps.

### BOSTON CREAM PIE

- Recipe index: 72
- Ingredient rows before: 51
- Ingredient rows after: 16
- Remaining malformed rows: 0
- Scaling works: yes
- Repair summary: Replaced incorrect chowder extraction with 16 structured Boston cream pie ingredients and a dessert method.

### CHICKEN CAESAR SALAD

- Recipe index: 77
- Ingredient rows before: 29
- Ingredient rows after: 9
- Remaining malformed rows: 0
- Scaling works: yes
- Repair summary: Reconstructed malformed split token ingredients into 9 structured salad ingredients; removed parser header token from steps.

### 3 - Sisters Indigenous Soup

- Recipe index: 79
- Ingredient rows before: 17
- Ingredient rows after: 17
- Remaining malformed rows: 0
- Scaling works: yes
- Repair summary: Corrected malformed broth, tomato, salt/pepper, parsley, and cheese garnish rows.

### Thai Fish Cakes with Cilantro Dip

- Recipe index: 78
- Ingredient rows before: 14
- Ingredient rows after: 14
- Remaining malformed rows: 0
- Scaling works: yes
- Repair summary: Corrected malformed fish, egg, panko, curry paste, lime, and seasoning rows.

### TOMATO BASIL PIZETTE

- Recipe index: 74
- Ingredient rows before: 9
- Ingredient rows after: 17
- Remaining malformed rows: 0
- Scaling works: yes
- Repair summary: Split combined ingredient rows into 17 structured tomato basil pizette ingredients.

### SEARED CATFISH

- Recipe index: 76
- Ingredient rows before: 5
- Ingredient rows after: 5
- Remaining malformed rows: 0
- Scaling works: yes
- Repair summary: Corrected malformed beurre blanc ingredient rows with normalized units.

### THAI CHICKEN NOODLE SOUP

- Recipe index: 75
- Ingredient rows before: 16
- Ingredient rows after: 16
- Remaining malformed rows: 0
- Scaling works: yes
- Repair summary: Corrected malformed rice noodle, ginger, and lime rows.

