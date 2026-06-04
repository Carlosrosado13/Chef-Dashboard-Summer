# Week 1 Lunch Merge Report

Source: `week1-lunch-recipes.json`
Target: `data/recipes/sample-recipes.json`

## Merge Summary

- Recipes added: 0
- Recipes updated: 35
- Placeholders replaced: 35
- Final recipe count: 379

All cleaned Week 1 lunch recipes already existed in `sample-recipes.json` as menu-link placeholders, so each matching placeholder was replaced in place.

## Recipes Updated

- MISO & SHRIMIP SOUP WITH SCALLION DUMPLING
- GINGER SOY SALMON WITH JASMINE RICE
- VEGETABLE LASAGNA
- MEDITERRANEAN TOMATO, OLIVE, & FETA IN GREEK DRESSING
- MANGO PUDDING
- ROASTED RED PEPPER WITH DILL YOGURT
- TURKEY MEDALLION WITH CRANBERRY ORANGE CHUTNEY
- LOBSTER / SHRIMP ROLL ON TOASTED BRIOCHE
- ARUGULA & PEAR WITH BALSAMIC VINAIGRETTE
- LEMON SORBET
- CHICKEN TORTILLA
- GRILLED FISH WITH SALSA
- EGGPLANT PARMESAN
- CORN & AVOCADO WITH HONEY MUSTARD VINAIGRETTE
- COCONUT FLAN
- TOMATO BASIL
- PHILLY CHEESESTEAK
- VEGETABLE & TOFU STIRFRY
- BEET & GOAT CHEESE WITH RED WINE VINAIGRETTE
- CHAI POACHED PEARS WITH CINNAMON TOPPING
- SEAFOOD CHOWDER
- SPICED CHICKEN, BRIE, & AVOCADO MELT
- VEGETABLE PAELLA
- CITRUS GREENS WITH CHOICE DRESSING
- KEY LIME MOUSSE
- THAI COCONUT & VEGETABLE
- LEMONGRASS CHICKEN
- CHICKPEA & VEGETABLE CURRY
- GREEN MANGO SALAD WITH POPPYSEED DRESSING
- PINEAPPLE CAKE WITH CITRUS TOPPING
- FRENCH LENTIL
- CAPRESE STYLE CHICKEN PLATE
- COD WITH LEMON&HERB SAUCE (GF/DF)
- MEDITERRANEAN CHICKPEA
- APPLE TART

## Preservation

- Recipe titles were preserved.
- Existing recipe categories in `sample-recipes.json` were preserved.
- Existing menu assignment metadata was preserved, including the additional Week 3 Monday lunch salad assignment on MEDITERRANEAN CHICKPEA.
- Placeholder tags and placeholder notes were removed from the 35 replaced Week 1 lunch records.

## Validation Results

- Duplicate titles: 0.
- Duplicate IDs: 0.
- ID fields present: 0.
- Schema validation: 379 recipes checked, 0 failures.
- Week 1 lunch menu links: 35 checked, 0 unresolved.
- Week 1 lunch placeholders remaining: 0.

## Link Audit Note

The full lunch menu link scan checked 140 lunch links and found 2 unresolved Week 2 links unrelated to this Week 1 merge:

- Week 2 Monday Soup 1: `GAZPACHO SOUP (DF/GF)`; recipe exists as `GAZPACHO SOUP`.
- Week 2 Saturday Soup 1: `SUMMER MINESTRONE (DF)`; recipe exists as `SUMMER MINESTRONE`.
