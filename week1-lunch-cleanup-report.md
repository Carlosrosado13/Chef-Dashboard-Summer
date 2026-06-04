# Week 1 Lunch Cleanup Report

Source: `week1-lunch-recipes.json`

## Recipes Corrected

27 recipes were edited for production-instruction cleanup and duplicate-fragment cleanup:

- MISO & SHRIMIP SOUP WITH SCALLION DUMPLING
- ROASTED RED PEPPER WITH DILL YOGURT
- TOMATO BASIL
- SEAFOOD CHOWDER
- THAI COCONUT & VEGETABLE
- FRENCH LENTIL
- GINGER SOY SALMON WITH JASMINE RICE
- TURKEY MEDALLION WITH CRANBERRY ORANGE CHUTNEY
- GRILLED FISH WITH SALSA
- PHILLY CHEESESTEAK
- SPICED CHICKEN, BRIE, & AVOCADO MELT
- VEGETABLE LASAGNA
- LOBSTER / SHRIMP ROLL ON TOASTED BRIOCHE
- EGGPLANT PARMESAN
- VEGETABLE PAELLA
- ARUGULA & PEAR WITH BALSAMIC VINAIGRETTE
- CORN & AVOCADO WITH HONEY MUSTARD VINAIGRETTE
- BEET & GOAT CHEESE WITH RED WINE VINAIGRETTE
- CITRUS GREENS WITH CHOICE DRESSING
- GREEN MANGO SALAD WITH POPPYSEED DRESSING
- MANGO PUDDING
- LEMON SORBET
- COCONUT FLAN
- CHAI POACHED PEARS WITH CINNAMON TOPPING
- KEY LIME MOUSSE
- PINEAPPLE CAKE WITH CITRUS TOPPING
- APPLE TART

No recipe titles, yields, or menu assignments were changed.

## Category Corrections

- `Entr\u00e9e 1`: 7 recipes validated.
- `Entr\u00e9e 2`: 7 recipes validated.
- Invalid mojibake category values from the audit remaining: 0.
- Category values after cleanup: `Soup 1`, `Entr\u00e9e 1`, `Entr\u00e9e 2`, `Salad`, `Dessert`.

## Home-Recipe Instructions Removed

Removed or neutralized consumer-facing instructions, including:

- Recipe success tip / kitchen tip blocks.
- `Serve immediately` phrasing.
- `your`-style home cooking directions.
- Home equipment references such as manufacturer instructions.
- Citation fragments such as `[1]` and `[1, 2]`.
- Overnight home-chilling language where not needed for production.
- Decorative or promotional wording such as `beautifully`.

## Duplicate Ingredient Fragments

PINEAPPLE CAKE WITH CITRUS TOPPING had duplicate `unsalted butter` fragments split into production-use labels:

- `melted butter (for topping)`
- `softened butter (for batter)`

Ingredient quantities and units were preserved.

## Validation Results

- JSON parse: pass.
- Recipe schema validation: 35 recipes checked, 0 failures.
- Category validation: 0 invalid categories.
- Malformed-character scan: 0 hits for mojibake markers or tip emoji.
- Home-instruction scan: 0 hits for the targeted audit phrases and examples.
