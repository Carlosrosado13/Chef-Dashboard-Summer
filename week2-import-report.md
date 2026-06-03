# Week 2 Recipe Import Report

Source file: `missing-recipes-report.csv`

Processed only `Week 2` rows. Recipes were generated only when the CSV row contained parseable inline recipe content. Rows with empty sources were skipped. Rows with URL-only sources are listed for manual review because recipe content was not embedded in the CSV and URL extraction was unavailable/blocked in this environment.

## Summary

- Week 2 rows processed: 57
- Recipes successfully created: 10
- Recipes skipped because no source exists: 9
- Recipes requiring manual review: 38
- Duplicate title warnings: 0
- Duplicate ID warnings: Not applicable; active `sample-recipes.json` schema does not store recipe IDs, so no IDs were generated.
- Schema validation issues: 0

## Recipes Successfully Created

| # | Title | Category | Ingredients | Steps |
| --- | --- | --- | --- | --- |
| 1 | PASTA WITH SUMMER VEGETABLES WITH LEMON PARMESAN SAUCE | Comfort | 14 | 6 |
| 2 | ANCIENT GRAINS | Starch | 11 | 6 |
| 3 | GRILLED TILAPIA WITH BALSAMIC ONION SAUCE | Alternative | 12 | 5 |
| 4 | BROCCOLINI WITH GARLIC CONFIT | Veggie 1 | 4 | 6 |
| 5 | SUMAC SPICED ROASTED CARROT CHUNKS | Veggie 2 | 6 | 5 |
| 6 | HERB AND CREAM CHEESE POLENTA | Starch | 9 | 5 |
| 7 | LEMON BREAD WITH ICING | Dessert | 12 | 6 |
| 8 | ROASTED PORK TENDERLOIN WITH OLIVE AND FETA SALSA | Comfort | 12 | 6 |
| 9 | BRAISED BEAN CASSOULET | Veggie 2 | 16 | 6 |
| 10 | SHRIMP LINGUINI WITH SAFFRON SAUCE AND PEPPERED GREENS | Elevated | 16 | 8 |

## Recipes Skipped Because No Source Exists

| Day | Category | Title | Reason |
| --- | --- | --- | --- |
| Monday | Veggie 1 | STEAMED CAULIFLOWER FLORETS | No URL or inline recipe source in CSV row. |
| Monday | Veggie 2 | STEAMED CARROTS | No URL or inline recipe source in CSV row. |
| Monday | Starch | BAKED FARRO PILAF | No URL or inline recipe source in CSV row. |
| Tuesday | Veggie 2 | ROASTED MUSHROOMS | No URL or inline recipe source in CSV row. |
| Tuesday | Starch | WILD RICE | No URL or inline recipe source in CSV row. |
| Wednesday | Veggie 2 | ROASTED BABY TOP CARROTS | No URL or inline recipe source in CSV row. |
| Thursday | Veggie 1 | ROASTED ZUCCHINI CHUNKS | No URL or inline recipe source in CSV row. |
| Saturday | Starch | HERB ROASTED POTATO WEDGES | No URL or inline recipe source in CSV row. |
| Sunday | Veggie 2 | ROASTED BUTTERNUT SQUASH | No URL or inline recipe source in CSV row. |

## Recipes Requiring Manual Review

| Day | Category | Title | Reason | Source |
| --- | --- | --- | --- | --- |
| Monday | Appetizer 1 | COCONUT SHRIMP WITH LIME DIP | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://thegourmetbonvivant.com/fried-coconut-shrimp-with-honey-lime-sauce/ |
| Monday | Appetizer 2 | CARROT AND ORANGE SOUP | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://artsincubator.ca/cookbook/recipes/soups/sunny-carrot-and-orange-soup-with-toasted-almonds?gad_source=1&gad_campa |
| Monday | Elevated | MAPLE GLAZED SALMON FILET WITH | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.becel.ca/en-ca/recipe/maple-mustard-salmon-204346?gclsrc=aw.ds&gad_source=1&gad_campaignid=21086526214&gbrai |
| Monday | Comfort | CHICKEN CORDON BLEU | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.allrecipes.com/recipe/8669/chicken-cordon-bleu-ii/ |
| Monday | Alternative | ROAST CHICKEN WITH PAPRIKA | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.simplyrecipes.com/recipes/smoked_paprika_roasted_chicken/ |
| Monday | Dessert | BLACK FOREST CAKE | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.allrecipes.com/recipe/8095/black-forest-cake-i/ |
| Tuesday | Appetizer 1 | ROASTED RED PEPPER HUMMUS AND PITA | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.themediterraneandish.com/roasted-red-pepper-hummus-recipe/ |
| Tuesday | Appetizer 2 | SPICY TUNA AND CRISPY RICE CRACKER | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://artsincubator.ca/cookbook/recipes/spicy-tuna-crispy-rice?gad_source=1&gad_campaignid=23003435220&gbraid=0AAAAA9T |
| Tuesday | Elevated | SEARED HALIBUT WITH CHERRY TOMATO&OLIVE | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://themodernproper.com/moms-tomato-olive-salsa (complete the recipe adding extra step to sear the fish) |
| Tuesday | Alternative | SAUTEED SHRIMP WITH GARLIC, WHITE WINE & FRESH DICED TOMATO | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.theyellowtable.com/recipes/best-garlicky-shrimp-white-wine-tomatoes-recipe |
| Tuesday | Dessert | PEACH FRIED PIES | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://divascancook.com/fried-peach-pies-recipe/ |
| Wednesday | Appetizer 1 | SHAVED FENNEL AND ORANGE SALAD | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.notquitenigella.com/2021/09/03/shaved-fennel-orange-salad/ |
| Wednesday | Appetizer 2 | CUCUMBER AND DILL SALAD | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.allrecipes.com/recipe/238366/best-ever-cucumber-dill-salad/ |
| Wednesday | Elevated | CHICKEN MARSALA IN MUSHROOM SAUCE | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://familystylefood.com/chicken-marsala/ |
| Wednesday | Comfort | OPEN FACED ROAST BEEF DIP | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://themodernproper.com/french-dip-sandwich |
| Wednesday | Alternative | LEMON BAKED COD | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.themediterraneandish.com/baked-cod-recipe-lemon-garlic/ |
| Wednesday | Starch | GARLIC MASHED POTATOES | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.simplyrecipes.com/recipes/garlic_mashed_potatoes/ |
| Wednesday | Dessert | BANANA CREAM PIE | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://sallysbakingaddiction.com/homemade-banana-cream-pie/ |
| Thursday | Appetizer 1 | CORN CHOWDER | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.allrecipes.com/recipe/86096/grandmas-corn-chowder/ |
| Thursday | Appetizer 2 | MANGO AND AVOCADO SALAD | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://feelgoodfoodie.net/recipe/avocado-mango-salad/ |
| Thursday | Elevated | VEAL SHANK WITH NATURAL JUS | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.acanadianfoodie.com/2014/10/12/osso-buco-with-veal-jus/ |
| Thursday | Comfort | CHICKEN PARMESAN | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.allrecipes.com/recipe/223042/chicken-parmesan/ |
| Thursday | Alternative | SEARED SCALLOPS WITH SQUASH PUREE | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.acozykitchen.com/seared-scallops-acorn-squash |
| Friday | Appetizer 1 | SMOKED SALMON CUCUMBER BITES | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.allrecipes.com/recipe/241473/cucumber-cups-with-dill-cream-and-smoked-salmon/ |
| Friday | Appetizer 2 | GAZPACHO SOUP | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://artsincubator.ca/cookbook/recipes/soups/chilled-roasted-red-pepper-and-cucumber-gazpacho?gad_source=1&gad_campai |
| Friday | Elevated | TURKEY ROULADE WITH SPINACH&SUNDRIED TOMATO                     (GF/DF) | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://riverheadlocal.com/2017/04/29/in-the-kitchen-sharpen-your-knife-skills-for-this-spinach-feta-and-sun-dried-tomat |
| Friday | Comfort | SPAGHETTI AND MEATBALLS IN MARINARA | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://amandascookin.com/spaghetti-and-meatballs-in-marinara-sauce/ |
| Saturday | Appetizer 1 | GRILLED ZUCCHINI ROLLUP WITH RICOTTA | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.thekitchn.com/recipe-grilled-zucchini-roll-ups-with-ricotta-and-herbs-221922 |
| Saturday | Appetizer 2 | BACON AND CLAM FLATBREAD | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://chickenofthesea.com/seafood-recipes/white-clam-flatbread-with-herbs/ |
| Saturday | Elevated | RED WINE BRAISED BEEF BRISKET | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.allrecipes.com/recipe/221041/wine-braised-beef-brisket/ |
| Saturday | Alternative | WILD MUSHROOM TART WITH GOAT CHEESE | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.giangiskitchen.com/mushroom-goat-cheese-tarte/ |
| Saturday | Veggie 1 | ROASTED MEXICAN STREET CORN | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://ohsweetbasil.com/sheet-pan-mexican-street-corn-elote-recipe/ |
| Saturday | Dessert | KEY LIME PIE | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://sallysbakingaddiction.com/key-lime-pie/ |
| Sunday | Appetizer 1 | ZUCCHINI FRITTERS WITH DIP | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://coleycooks.com/zucchini-fritters/ |
| Sunday | Appetizer 2 | SOBA NOODLE SALAD | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.veganricha.com/cold-soba-noodle-salad-recipe/ |
| Sunday | Comfort | ROASTED CHICKEN BREAST IN CREAMY SUNDRIED TOMATO SAUCE | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.recipetineats.com/chicken-with-creamy-sun-dried-tomato-sauce/ |
| Sunday | Alternative | SEARED SALMON WITH BASIL PESTO SAUCE | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.food.com/recipe/pan-seared-salmon-with-lemon-basil-pesto-444000 |
| Sunday | Dessert | PEACH COBBLER | URL source present, but recipe content was not embedded in CSV and page extraction was blocked/unavailable in this environment. | https://www.allrecipes.com/recipe/51535/fresh-southern-peach-cobbler/ |

## Duplicate Title Warnings

_None._

## Duplicate ID Warnings

Not applicable. The current active recipe database schema does not include recipe IDs, and this package was generated to match that schema.

## Validation

- Valid JSON: yes
- Unique generated records by title: yes
- Ingredients array exists on every recipe: yes
- Steps array exists on every recipe: yes
- Schema matches current recipe database keys: yes

## Schema Issues

_None._
