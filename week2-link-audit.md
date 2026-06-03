# Week 2 Link Audit

Menu source: `data/processed/clean-menu.json`
Recipe source: `data/recipes/sample-recipes.json`

This audit uses the same title normalization behavior as `js/loadRecipes.js`: exact title, normalized title, and generated slug identifiers. The dashboard returns the first matching recipe in `sample-recipes.json`.

## Summary

- Total Week 2 menu assignments: 62
- Exact title matches: 57
- Usable exact recipe matches: 0
- Normalized title/slug matches: 5
- Placeholder matches: 57
- Missing matches: 0
- Menu title != recipe title: 5
- Usable recipes blocked by earlier placeholder duplicates: 0

## Why Week 2 Recipes Are Not Appearing

The dashboard is finding recipe records for every Week 2 menu assignment, but 57 of 62 first matches are placeholders. Because `findRecipeByTitle` returns the first match in `sample-recipes.json`, a later complete recipe with the same title will not be used if a placeholder appears earlier.

## Usable Recipes Blocked By Earlier Placeholder Duplicates

_None._

## Most Important: Menu Title Does Not Equal Recipe Title

These are linked by normalization/slug matching, but the displayed menu title and stored recipe title are not identical. If a stricter linking path is used elsewhere, these can prevent linking.

| Week | Day | Category | Menu | Recipe | Recipe Found? | Placeholder? | Recipe ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Week 2 | Tuesday | Veggie 1 | GRILLED ASPARAGUS | Grilled Asparagus | Normalized | No | grilled-asparagus |
| Week 2 | Wednesday | Veggie 1 | SAUTEED SPINACH WITH DICED ONIONS | Sauteed Spinach with Diced Onions | Normalized | No | sauteed-spinach-with-diced-onions |
| Week 2 | Thursday | Veggie 2 | BUTTERED PEAS | Buttered Peas | Normalized | No | buttered-peas |
| Week 2 | Thursday | Dessert | ASSORTED DESSERTS | Assorted Desserts | Normalized | No | assorted-desserts |
| Week 2 | Sunday | Starch | WILD RICE PILAF | Wild Rice Pilaf | Normalized | No | wild-rice-pilaf |

## Full Week 2 Assignment Audit

| Week | Day | Category | Menu Title | Recipe Found? | Recipe Title | Placeholder? | Recipe ID | Match Count | Usable Later? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Week 2 | Monday | Appetizer 1 | COCONUT SHRIMP WITH LIME DIP | Exact | COCONUT SHRIMP WITH LIME DIP | Yes | coconut-shrimp-with-lime-dip | 1 | No |
| Week 2 | Monday | Appetizer 2 | CARROT AND ORANGE SOUP | Exact | CARROT AND ORANGE SOUP | Yes | carrot-and-orange-soup | 1 | No |
| Week 2 | Monday | Elevated | MAPLE GLAZED SALMON FILET WITH | Exact | MAPLE GLAZED SALMON FILET WITH | Yes | maple-glazed-salmon-filet-with | 1 | No |
| Week 2 | Monday | Comfort | CHICKEN CORDON BLEU | Exact | CHICKEN CORDON BLEU | Yes | chicken-cordon-bleu | 1 | No |
| Week 2 | Monday | Alternative | ROAST CHICKEN WITH PAPRIKA | Exact | ROAST CHICKEN WITH PAPRIKA | Yes | roast-chicken-with-paprika | 1 | No |
| Week 2 | Monday | Veggie 1 | STEAMED CAULIFLOWER FLORETS | Exact | STEAMED CAULIFLOWER FLORETS | Yes | steamed-cauliflower-florets | 1 | No |
| Week 2 | Monday | Veggie 2 | STEAMED CARROTS | Exact | STEAMED CARROTS | Yes | steamed-carrots | 1 | No |
| Week 2 | Monday | Starch | BAKED FARRO PILAF | Exact | BAKED FARRO PILAF | Yes | baked-farro-pilaf | 1 | No |
| Week 2 | Monday | Dessert | BLACK FOREST CAKE | Exact | BLACK FOREST CAKE | Yes | black-forest-cake | 1 | No |
| Week 2 | Tuesday | Appetizer 1 | ROASTED RED PEPPER HUMMUS AND PITA | Exact | ROASTED RED PEPPER HUMMUS AND PITA | Yes | roasted-red-pepper-hummus-and-pita | 1 | No |
| Week 2 | Tuesday | Appetizer 2 | SPICY TUNA AND CRISPY RICE CRACKER | Exact | SPICY TUNA AND CRISPY RICE CRACKER | Yes | spicy-tuna-and-crispy-rice-cracker | 1 | No |
| Week 2 | Tuesday | Elevated | SEARED HALIBUT WITH CHERRY TOMATO&OLIVE | Exact | SEARED HALIBUT WITH CHERRY TOMATO&OLIVE | Yes | seared-halibut-with-cherry-tomato-and-olive | 1 | No |
| Week 2 | Tuesday | Comfort | PASTA WITH SUMMER VEGETABLES WITH LEMON PARMESAN SAUCE | Exact | PASTA WITH SUMMER VEGETABLES WITH LEMON PARMESAN SAUCE | Yes | pasta-with-summer-vegetables-with-lemon-parmesan-sauce | 1 | No |
| Week 2 | Tuesday | Veggie 1 | GRILLED ASPARAGUS | Normalized | Grilled Asparagus | No | grilled-asparagus | 1 | No |
| Week 2 | Tuesday | Veggie 2 | ROASTED MUSHROOMS | Exact | ROASTED MUSHROOMS | Yes | roasted-mushrooms | 1 | No |
| Week 2 | Tuesday | Starch | WILD RICE | Exact | WILD RICE | Yes | wild-rice | 1 | No |
| Week 2 | Tuesday | Dessert | PEACH FRIED PIES | Exact | PEACH FRIED PIES | Yes | peach-fried-pies | 1 | No |
| Week 2 | Wednesday | Appetizer 1 | SHAVED FENNEL AND ORANGE SALAD | Exact | SHAVED FENNEL AND ORANGE SALAD | Yes | shaved-fennel-and-orange-salad | 1 | No |
| Week 2 | Wednesday | Appetizer 2 | CUCUMBER AND DILL SALAD | Exact | CUCUMBER AND DILL SALAD | Yes | cucumber-and-dill-salad | 1 | No |
| Week 2 | Wednesday | Elevated | CHICKEN MARSALA IN MUSHROOM SAUCE | Exact | CHICKEN MARSALA IN MUSHROOM SAUCE | Yes | chicken-marsala-in-mushroom-sauce | 1 | No |
| Week 2 | Wednesday | Comfort | OPEN FACED ROAST BEEF DIP | Exact | OPEN FACED ROAST BEEF DIP | Yes | open-faced-roast-beef-dip | 1 | No |
| Week 2 | Wednesday | Alternative | LEMON BAKED COD | Exact | LEMON BAKED COD | Yes | lemon-baked-cod | 1 | No |
| Week 2 | Wednesday | Veggie 1 | SAUTEED SPINACH WITH DICED ONIONS | Normalized | Sauteed Spinach with Diced Onions | No | sauteed-spinach-with-diced-onions | 1 | No |
| Week 2 | Wednesday | Veggie 2 | ROASTED BABY TOP CARROTS | Exact | ROASTED BABY TOP CARROTS | Yes | roasted-baby-top-carrots | 1 | No |
| Week 2 | Wednesday | Starch | GARLIC MASHED POTATOES | Exact | GARLIC MASHED POTATOES | Yes | garlic-mashed-potatoes | 1 | No |
| Week 2 | Wednesday | Dessert | BANANA CREAM PIE | Exact | BANANA CREAM PIE | Yes | banana-cream-pie | 1 | No |
| Week 2 | Thursday | Appetizer 1 | CORN CHOWDER | Exact | CORN CHOWDER | Yes | corn-chowder | 1 | No |
| Week 2 | Thursday | Appetizer 2 | MANGO AND AVOCADO SALAD | Exact | MANGO AND AVOCADO SALAD | Yes | mango-and-avocado-salad | 1 | No |
| Week 2 | Thursday | Elevated | VEAL SHANK WITH NATURAL JUS | Exact | VEAL SHANK WITH NATURAL JUS | Yes | veal-shank-with-natural-jus | 1 | No |
| Week 2 | Thursday | Comfort | CHICKEN PARMESAN | Exact | CHICKEN PARMESAN | Yes | chicken-parmesan | 1 | No |
| Week 2 | Thursday | Alternative | SEARED SCALLOPS WITH SQUASH PUREE | Exact | SEARED SCALLOPS WITH SQUASH PUREE | Yes | seared-scallops-with-squash-puree | 1 | No |
| Week 2 | Thursday | Veggie 1 | ROASTED ZUCCHINI CHUNKS | Exact | ROASTED ZUCCHINI CHUNKS | Yes | roasted-zucchini-chunks | 1 | No |
| Week 2 | Thursday | Veggie 2 | BUTTERED PEAS | Normalized | Buttered Peas | No | buttered-peas | 1 | No |
| Week 2 | Thursday | Starch | ANCIENT GRAINS | Exact | ANCIENT GRAINS | Yes | ancient-grains | 1 | No |
| Week 2 | Thursday | Dessert | ASSORTED DESSERTS | Normalized | Assorted Desserts | No | assorted-desserts | 1 | No |
| Week 2 | Friday | Appetizer 1 | SMOKED SALMON CUCUMBER BITES | Exact | SMOKED SALMON CUCUMBER BITES | Yes | smoked-salmon-cucumber-bites | 1 | No |
| Week 2 | Friday | Appetizer 2 | GAZPACHO SOUP | Exact | GAZPACHO SOUP | Yes | gazpacho-soup | 1 | No |
| Week 2 | Friday | Elevated | TURKEY ROULADE WITH SPINACH&SUNDRIED TOMATO                     (GF/DF) | Exact | TURKEY ROULADE WITH SPINACH&SUNDRIED TOMATO                     (GF/DF) | Yes | turkey-roulade-with-spinach-and-sundried-tomato | 1 | No |
| Week 2 | Friday | Comfort | SPAGHETTI AND MEATBALLS IN MARINARA | Exact | SPAGHETTI AND MEATBALLS IN MARINARA | Yes | spaghetti-and-meatballs-in-marinara | 1 | No |
| Week 2 | Friday | Alternative | GRILLED TILAPIA WITH BALSAMIC ONION SAUCE | Exact | GRILLED TILAPIA WITH BALSAMIC ONION SAUCE | Yes | grilled-tilapia-with-balsamic-onion-sauce | 1 | No |
| Week 2 | Friday | Veggie 1 | BROCCOLINI WITH GARLIC CONFIT | Exact | BROCCOLINI WITH GARLIC CONFIT | Yes | broccolini-with-garlic-confit | 1 | No |
| Week 2 | Friday | Veggie 2 | SUMAC SPICED ROASTED CARROT CHUNKS | Exact | SUMAC SPICED ROASTED CARROT CHUNKS | Yes | sumac-spiced-roasted-carrot-chunks | 1 | No |
| Week 2 | Friday | Starch | HERB AND CREAM CHEESE POLENTA | Exact | HERB AND CREAM CHEESE POLENTA | Yes | herb-and-cream-cheese-polenta | 1 | No |
| Week 2 | Friday | Dessert | LEMON BREAD WITH ICING | Exact | LEMON BREAD WITH ICING | Yes | lemon-bread-with-icing | 1 | No |
| Week 2 | Saturday | Appetizer 1 | GRILLED ZUCCHINI ROLLUP WITH RICOTTA | Exact | GRILLED ZUCCHINI ROLLUP WITH RICOTTA | Yes | grilled-zucchini-rollup-with-ricotta | 1 | No |
| Week 2 | Saturday | Appetizer 2 | BACON AND CLAM FLATBREAD | Exact | BACON AND CLAM FLATBREAD | Yes | bacon-and-clam-flatbread | 1 | No |
| Week 2 | Saturday | Elevated | RED WINE BRAISED BEEF BRISKET | Exact | RED WINE BRAISED BEEF BRISKET | Yes | red-wine-braised-beef-brisket | 1 | No |
| Week 2 | Saturday | Comfort | ROASTED PORK TENDERLOIN WITH OLIVE AND FETA SALSA | Exact | ROASTED PORK TENDERLOIN WITH OLIVE AND FETA SALSA | Yes | roasted-pork-tenderloin-with-olive-and-feta-salsa | 1 | No |
| Week 2 | Saturday | Alternative | WILD MUSHROOM TART WITH GOAT CHEESE | Exact | WILD MUSHROOM TART WITH GOAT CHEESE | Yes | wild-mushroom-tart-with-goat-cheese | 1 | No |
| Week 2 | Saturday | Veggie 1 | ROASTED MEXICAN STREET CORN | Exact | ROASTED MEXICAN STREET CORN | Yes | roasted-mexican-street-corn | 1 | No |
| Week 2 | Saturday | Veggie 2 | BRAISED BEAN CASSOULET | Exact | BRAISED BEAN CASSOULET | Yes | braised-bean-cassoulet | 1 | No |
| Week 2 | Saturday | Starch | HERB ROASTED POTATO WEDGES | Exact | HERB ROASTED POTATO WEDGES | Yes | herb-roasted-potato-wedges | 1 | No |
| Week 2 | Saturday | Dessert | KEY LIME PIE | Exact | KEY LIME PIE | Yes | key-lime-pie | 1 | No |
| Week 2 | Sunday | Appetizer 1 | ZUCCHINI FRITTERS WITH DIP | Exact | ZUCCHINI FRITTERS WITH DIP | Yes | zucchini-fritters-with-dip | 1 | No |
| Week 2 | Sunday | Appetizer 2 | SOBA NOODLE SALAD | Exact | SOBA NOODLE SALAD | Yes | soba-noodle-salad | 1 | No |
| Week 2 | Sunday | Elevated | SHRIMP LINGUINI WITH SAFFRON SAUCE AND PEPPERED GREENS | Exact | SHRIMP LINGUINI WITH SAFFRON SAUCE AND PEPPERED GREENS | Yes | shrimp-linguini-with-saffron-sauce-and-peppered-greens | 1 | No |
| Week 2 | Sunday | Comfort | ROASTED CHICKEN BREAST IN CREAMY SUNDRIED TOMATO SAUCE | Exact | ROASTED CHICKEN BREAST IN CREAMY SUNDRIED TOMATO SAUCE | Yes | roasted-chicken-breast-in-creamy-sundried-tomato-sauce | 1 | No |
| Week 2 | Sunday | Alternative | SEARED SALMON WITH BASIL PESTO SAUCE | Exact | SEARED SALMON WITH BASIL PESTO SAUCE | Yes | seared-salmon-with-basil-pesto-sauce | 1 | No |
| Week 2 | Sunday | Veggie 1 | SAUTEED ASPARAGUS (2" CUTS) | Exact | SAUTEED ASPARAGUS (2" CUTS) | Yes | sauteed-asparagus-2-cuts | 1 | No |
| Week 2 | Sunday | Veggie 2 | ROASTED BUTTERNUT SQUASH | Exact | ROASTED BUTTERNUT SQUASH | Yes | roasted-butternut-squash | 1 | No |
| Week 2 | Sunday | Starch | WILD RICE PILAF | Normalized | Wild Rice Pilaf | No | wild-rice-pilaf | 1 | No |
| Week 2 | Sunday | Dessert | PEACH COBBLER | Exact | PEACH COBBLER | Yes | peach-cobbler | 1 | No |

## Missing Matches

_None._

## Placeholder Matches

| Week | Day | Category | Menu Title | Recipe Title | Recipe ID | Usable Later? |
| --- | --- | --- | --- | --- | --- | --- |
| Week 2 | Monday | Appetizer 1 | COCONUT SHRIMP WITH LIME DIP | COCONUT SHRIMP WITH LIME DIP | coconut-shrimp-with-lime-dip | No |
| Week 2 | Monday | Appetizer 2 | CARROT AND ORANGE SOUP | CARROT AND ORANGE SOUP | carrot-and-orange-soup | No |
| Week 2 | Monday | Elevated | MAPLE GLAZED SALMON FILET WITH | MAPLE GLAZED SALMON FILET WITH | maple-glazed-salmon-filet-with | No |
| Week 2 | Monday | Comfort | CHICKEN CORDON BLEU | CHICKEN CORDON BLEU | chicken-cordon-bleu | No |
| Week 2 | Monday | Alternative | ROAST CHICKEN WITH PAPRIKA | ROAST CHICKEN WITH PAPRIKA | roast-chicken-with-paprika | No |
| Week 2 | Monday | Veggie 1 | STEAMED CAULIFLOWER FLORETS | STEAMED CAULIFLOWER FLORETS | steamed-cauliflower-florets | No |
| Week 2 | Monday | Veggie 2 | STEAMED CARROTS | STEAMED CARROTS | steamed-carrots | No |
| Week 2 | Monday | Starch | BAKED FARRO PILAF | BAKED FARRO PILAF | baked-farro-pilaf | No |
| Week 2 | Monday | Dessert | BLACK FOREST CAKE | BLACK FOREST CAKE | black-forest-cake | No |
| Week 2 | Tuesday | Appetizer 1 | ROASTED RED PEPPER HUMMUS AND PITA | ROASTED RED PEPPER HUMMUS AND PITA | roasted-red-pepper-hummus-and-pita | No |
| Week 2 | Tuesday | Appetizer 2 | SPICY TUNA AND CRISPY RICE CRACKER | SPICY TUNA AND CRISPY RICE CRACKER | spicy-tuna-and-crispy-rice-cracker | No |
| Week 2 | Tuesday | Elevated | SEARED HALIBUT WITH CHERRY TOMATO&OLIVE | SEARED HALIBUT WITH CHERRY TOMATO&OLIVE | seared-halibut-with-cherry-tomato-and-olive | No |
| Week 2 | Tuesday | Comfort | PASTA WITH SUMMER VEGETABLES WITH LEMON PARMESAN SAUCE | PASTA WITH SUMMER VEGETABLES WITH LEMON PARMESAN SAUCE | pasta-with-summer-vegetables-with-lemon-parmesan-sauce | No |
| Week 2 | Tuesday | Veggie 2 | ROASTED MUSHROOMS | ROASTED MUSHROOMS | roasted-mushrooms | No |
| Week 2 | Tuesday | Starch | WILD RICE | WILD RICE | wild-rice | No |
| Week 2 | Tuesday | Dessert | PEACH FRIED PIES | PEACH FRIED PIES | peach-fried-pies | No |
| Week 2 | Wednesday | Appetizer 1 | SHAVED FENNEL AND ORANGE SALAD | SHAVED FENNEL AND ORANGE SALAD | shaved-fennel-and-orange-salad | No |
| Week 2 | Wednesday | Appetizer 2 | CUCUMBER AND DILL SALAD | CUCUMBER AND DILL SALAD | cucumber-and-dill-salad | No |
| Week 2 | Wednesday | Elevated | CHICKEN MARSALA IN MUSHROOM SAUCE | CHICKEN MARSALA IN MUSHROOM SAUCE | chicken-marsala-in-mushroom-sauce | No |
| Week 2 | Wednesday | Comfort | OPEN FACED ROAST BEEF DIP | OPEN FACED ROAST BEEF DIP | open-faced-roast-beef-dip | No |
| Week 2 | Wednesday | Alternative | LEMON BAKED COD | LEMON BAKED COD | lemon-baked-cod | No |
| Week 2 | Wednesday | Veggie 2 | ROASTED BABY TOP CARROTS | ROASTED BABY TOP CARROTS | roasted-baby-top-carrots | No |
| Week 2 | Wednesday | Starch | GARLIC MASHED POTATOES | GARLIC MASHED POTATOES | garlic-mashed-potatoes | No |
| Week 2 | Wednesday | Dessert | BANANA CREAM PIE | BANANA CREAM PIE | banana-cream-pie | No |
| Week 2 | Thursday | Appetizer 1 | CORN CHOWDER | CORN CHOWDER | corn-chowder | No |
| Week 2 | Thursday | Appetizer 2 | MANGO AND AVOCADO SALAD | MANGO AND AVOCADO SALAD | mango-and-avocado-salad | No |
| Week 2 | Thursday | Elevated | VEAL SHANK WITH NATURAL JUS | VEAL SHANK WITH NATURAL JUS | veal-shank-with-natural-jus | No |
| Week 2 | Thursday | Comfort | CHICKEN PARMESAN | CHICKEN PARMESAN | chicken-parmesan | No |
| Week 2 | Thursday | Alternative | SEARED SCALLOPS WITH SQUASH PUREE | SEARED SCALLOPS WITH SQUASH PUREE | seared-scallops-with-squash-puree | No |
| Week 2 | Thursday | Veggie 1 | ROASTED ZUCCHINI CHUNKS | ROASTED ZUCCHINI CHUNKS | roasted-zucchini-chunks | No |
| Week 2 | Thursday | Starch | ANCIENT GRAINS | ANCIENT GRAINS | ancient-grains | No |
| Week 2 | Friday | Appetizer 1 | SMOKED SALMON CUCUMBER BITES | SMOKED SALMON CUCUMBER BITES | smoked-salmon-cucumber-bites | No |
| Week 2 | Friday | Appetizer 2 | GAZPACHO SOUP | GAZPACHO SOUP | gazpacho-soup | No |
| Week 2 | Friday | Elevated | TURKEY ROULADE WITH SPINACH&SUNDRIED TOMATO                     (GF/DF) | TURKEY ROULADE WITH SPINACH&SUNDRIED TOMATO                     (GF/DF) | turkey-roulade-with-spinach-and-sundried-tomato | No |
| Week 2 | Friday | Comfort | SPAGHETTI AND MEATBALLS IN MARINARA | SPAGHETTI AND MEATBALLS IN MARINARA | spaghetti-and-meatballs-in-marinara | No |
| Week 2 | Friday | Alternative | GRILLED TILAPIA WITH BALSAMIC ONION SAUCE | GRILLED TILAPIA WITH BALSAMIC ONION SAUCE | grilled-tilapia-with-balsamic-onion-sauce | No |
| Week 2 | Friday | Veggie 1 | BROCCOLINI WITH GARLIC CONFIT | BROCCOLINI WITH GARLIC CONFIT | broccolini-with-garlic-confit | No |
| Week 2 | Friday | Veggie 2 | SUMAC SPICED ROASTED CARROT CHUNKS | SUMAC SPICED ROASTED CARROT CHUNKS | sumac-spiced-roasted-carrot-chunks | No |
| Week 2 | Friday | Starch | HERB AND CREAM CHEESE POLENTA | HERB AND CREAM CHEESE POLENTA | herb-and-cream-cheese-polenta | No |
| Week 2 | Friday | Dessert | LEMON BREAD WITH ICING | LEMON BREAD WITH ICING | lemon-bread-with-icing | No |
| Week 2 | Saturday | Appetizer 1 | GRILLED ZUCCHINI ROLLUP WITH RICOTTA | GRILLED ZUCCHINI ROLLUP WITH RICOTTA | grilled-zucchini-rollup-with-ricotta | No |
| Week 2 | Saturday | Appetizer 2 | BACON AND CLAM FLATBREAD | BACON AND CLAM FLATBREAD | bacon-and-clam-flatbread | No |
| Week 2 | Saturday | Elevated | RED WINE BRAISED BEEF BRISKET | RED WINE BRAISED BEEF BRISKET | red-wine-braised-beef-brisket | No |
| Week 2 | Saturday | Comfort | ROASTED PORK TENDERLOIN WITH OLIVE AND FETA SALSA | ROASTED PORK TENDERLOIN WITH OLIVE AND FETA SALSA | roasted-pork-tenderloin-with-olive-and-feta-salsa | No |
| Week 2 | Saturday | Alternative | WILD MUSHROOM TART WITH GOAT CHEESE | WILD MUSHROOM TART WITH GOAT CHEESE | wild-mushroom-tart-with-goat-cheese | No |
| Week 2 | Saturday | Veggie 1 | ROASTED MEXICAN STREET CORN | ROASTED MEXICAN STREET CORN | roasted-mexican-street-corn | No |
| Week 2 | Saturday | Veggie 2 | BRAISED BEAN CASSOULET | BRAISED BEAN CASSOULET | braised-bean-cassoulet | No |
| Week 2 | Saturday | Starch | HERB ROASTED POTATO WEDGES | HERB ROASTED POTATO WEDGES | herb-roasted-potato-wedges | No |
| Week 2 | Saturday | Dessert | KEY LIME PIE | KEY LIME PIE | key-lime-pie | No |
| Week 2 | Sunday | Appetizer 1 | ZUCCHINI FRITTERS WITH DIP | ZUCCHINI FRITTERS WITH DIP | zucchini-fritters-with-dip | No |
| Week 2 | Sunday | Appetizer 2 | SOBA NOODLE SALAD | SOBA NOODLE SALAD | soba-noodle-salad | No |
| Week 2 | Sunday | Elevated | SHRIMP LINGUINI WITH SAFFRON SAUCE AND PEPPERED GREENS | SHRIMP LINGUINI WITH SAFFRON SAUCE AND PEPPERED GREENS | shrimp-linguini-with-saffron-sauce-and-peppered-greens | No |
| Week 2 | Sunday | Comfort | ROASTED CHICKEN BREAST IN CREAMY SUNDRIED TOMATO SAUCE | ROASTED CHICKEN BREAST IN CREAMY SUNDRIED TOMATO SAUCE | roasted-chicken-breast-in-creamy-sundried-tomato-sauce | No |
| Week 2 | Sunday | Alternative | SEARED SALMON WITH BASIL PESTO SAUCE | SEARED SALMON WITH BASIL PESTO SAUCE | seared-salmon-with-basil-pesto-sauce | No |
| Week 2 | Sunday | Veggie 1 | SAUTEED ASPARAGUS (2" CUTS) | SAUTEED ASPARAGUS (2" CUTS) | sauteed-asparagus-2-cuts | No |
| Week 2 | Sunday | Veggie 2 | ROASTED BUTTERNUT SQUASH | ROASTED BUTTERNUT SQUASH | roasted-butternut-squash | No |
| Week 2 | Sunday | Dessert | PEACH COBBLER | PEACH COBBLER | peach-cobbler | No |
