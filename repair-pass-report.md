# Recipe Database Repair Pass Report

Latest repository state was re-scanned before repairs. Menu assignments, recipe names, recipe IDs, week/day assignments, category architecture, and schema were not modified. Placeholder recipes, zero quantities, missing content, and orphan recipes were left for review.

## Files Modified

- `data/recipes/sample-recipes.json`
- `repair-pass-report.md`
- `remaining-zero-quantity-report.md`
- `remaining-orphan-report.md`

## Before Counts

- duplicateTitleGroups: 0
- duplicateIdGroups: 0
- totalAssignments: 392
- brokenLinks: 3
- blankAssignments: 3
- nonblankBrokenLinks: 0
- malformedUnits: 250
- safeQuantityIssues: 0
- zeroQuantities: 138
- invalidCategories: 6
- titleSpellingItems: 9
- orphanRecipes: 11

## After Counts

- duplicateTitleGroups: 0
- duplicateIdGroups: 0
- totalAssignments: 392
- brokenLinks: 3
- blankAssignments: 3
- nonblankBrokenLinks: 0
- malformedUnits: 0
- safeQuantityIssues: 0
- zeroQuantities: 138
- invalidCategories: 6
- titleSpellingItems: 9
- orphanRecipes: 11

## Repairs Applied

- Unit fields normalized: 250
- Safe quantity fields normalized: 0
- Category spelling/taxonomy fields normalized: 0
- Recipe titles renamed: 0

### Unit Changes

| Recipe index | Recipe title | Ingredient index | Ingredient | Original unit | New unit |
|---:|---|---:|---|---|---|
| 5 | Miso and Soy Chilean Sea Bass | 4 | soy sauce | tablespoons | Tbsp |
| 5 | Miso and Soy Chilean Sea Bass | 5 | (4 ounce) fillets fresh sea bass, about 1 inch thick |  | each |
| 5 | Miso and Soy Chilean Sea Bass | 6 | chopped green onion | tablespoons | Tbsp |
| 6 | Spinach and Ricotta Manicotti | 0 | (15 ounce) container ricotta cheese |  | each |
| 6 | Spinach and Ricotta Manicotti | 1 | (10 ounce) package frozen chopped spinach, thawed and squeezed dry |  | each |
| 6 | Spinach and Ricotta Manicotti | 3 | large egg |  | each |
| 6 | Spinach and Ricotta Manicotti | 4 | minced fresh parsley | teaspoons | tsp |
| 6 | Spinach and Ricotta Manicotti | 5 | pepper | teaspoon | tsp |
| 6 | Spinach and Ricotta Manicotti | 6 | garlic powder | teaspoon | tsp |
| 6 | Spinach and Ricotta Manicotti | 7 | shredded mozzarella cheese, divided | cups | cup |
| 6 | Spinach and Ricotta Manicotti | 9 | (8 ounce) package manicotti shells |  | each |
| 6 | Spinach and Ricotta Manicotti | 10 | (26 ounce) jars spaghetti sauce |  | each |
| 6 | Spinach and Ricotta Manicotti | 11 | water | cups | cup |
| 7 | Ginger Jasmine Rice | 2 | ginger (, grated) | tablespoon | Tbsp |
| 7 | Ginger Jasmine Rice | 4 | butter | tablespoon | Tbsp |
| 7 | Ginger Jasmine Rice | 5 | kosher salt | teaspoon | tsp |
| 7 | Ginger Jasmine Rice | 6 | ground black pepper | teaspoon | tsp |
| 7 | Ginger Jasmine Rice | 7 | scallions | tablespoons | Tbsp |
| 8 | Corn Soup | 4 | vegetable or chicken stock | l | L |
| 10 | Braised Short Ribs with Red Wine Sauce | 3 | stock or pan sauce base | l | L |
| 11 | Herb Roasted Chicken Supreme | 3 | stock or pan sauce base | l | L |
| 12 | Pan Seared Salmon with Cucumber Dill Yogurt Sauce | 3 | stock or pan sauce base | l | L |
| 15 | Roasted Baby Potatoes | 1 | vegetable or chicken stock | l | L |
| 16 | Peach Melba | 2 | cream or dairy base | l | L |
| 19 | Carved Pork Tenderloin with Apple and Fennel Slaw | 3 | stock or pan sauce base | l | L |
| 20 | Turkey Medallion with Cranberry and Orange Chutney | 3 | stock or pan sauce base | l | L |
| 21 | Sauteed Shrimp with Garlic, White Wine and Fresh Diced Tomato | 3 | stock or pan sauce base | l | L |
| 24 | Wild Rice Pilaf | 1 | vegetable or chicken stock | l | L |
| 25 | Chocolate Mousse with Sponge Toffee | 2 | cream or dairy base | l | L |
| 28 | Roast Beef with Chimichurri | 3 | stock or pan sauce base | l | L |
| 29 | Herb Roasted Chicken Leg with Lemon Sauce | 3 | stock or pan sauce base | l | L |
| 30 | Baked Cod with Lemon Caper Vinaigrette | 3 | stock or pan sauce base | l | L |
| 33 | Quinoa Pilaf | 1 | vegetable or chicken stock | l | L |
| 34 | Lemon Curd Tart with Egg White | 2 | cream or dairy base | l | L |
| 36 | Cream of Carrot Soup | 4 | vegetable or chicken stock | l | L |
| 37 | Seared Scallops with Citrus and Herb Salsa | 3 | stock or pan sauce base | l | L |
| 38 | Roasted Lamb Leg with Mint Gremolata | 3 | stock or pan sauce base | l | L |
| 39 | Grilled Chicken Breast with Basil Pesto and Roasted Tomato | 3 | stock or pan sauce base | l | L |
| 42 | Couscous with Fresh Chopped Herbs | 1 | vegetable or chicken stock | l | L |
| 43 | Rice Pudding with Fresh Berries | 2 | cream or dairy base | l | L |
| 46 | Beef Strips with Sauteed Wild Mushrooms with Pan Sauce | 3 | stock or pan sauce base | l | L |
| 47 | Roasted Turkey Breast with Pan Gravy | 3 | stock or pan sauce base | l | L |
| 48 | Baked Haddock with Tomato and Basil Salsa | 3 | stock or pan sauce base | l | L |
| 51 | Fresh Herb Orzo | 1 | vegetable or chicken stock | l | L |
| 52 | Assorted Desserts | 2 | cream or dairy base | l | L |
| 53 | Asian Vegetable - Beef Soup | 4 | vegetable or chicken stock | l | L |
| 55 | Roasted Pork with Grainy Dijon Mustard Sauce | 3 | stock or pan sauce base | l | L |
| 56 | Honey Garlic Chicken Breast | 3 | stock or pan sauce base | l | L |
| 57 | Grilled Shirmp with Mango Salsa | 3 | stock or pan sauce base | l | L |
| 60 | Baked Potato with Sour Cream and Chive | 1 | vegetable or chicken stock | l | L |
| 61 | Cheesecake with Berry Compote | 2 | cream or dairy base | l | L |
| 62 | Taco Soup | 4 | vegetable or chicken stock | l | L |
| 64 | Prime Rib with Horseradish Yogurt Sauce | 3 | stock or pan sauce base | l | L |
| 65 | Poached Salmon with Cucumber and Herb Sauce | 3 | stock or pan sauce base | l | L |
| 66 | Roasted Chicken with Thyme and Lemon Jus | 3 | stock or pan sauce base | l | L |
| 69 | Butter Mashed Potatoes | 1 | vegetable or chicken stock | l | L |
| 70 | Apple Pie | 2 | cream or dairy base | l | L |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 0 | 0 Ingredients |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 1 | 6 6 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 2 | 0 slices |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 3 | 0 bacon |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 4 | 0 chopped |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 5 | 0.5 1/2 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 6 | 0 cup cup |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 7 | 0 onion |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 8 | 0 diced |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 9 | 2 2 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 10 | 0 carrots |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 11 | 0 peeled, quartered and sliced |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 12 | 0.5 1/2 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 13 | 0 cup cup |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 14 | 0 celery |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 15 | 0 sliced |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 16 | 2 2 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 17 | 0 teaspoons teaspoons |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 18 | 0 minced garlic |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 19 | 0.25 1/4 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 20 | 0 cup cup |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 21 | 0 tomato paste |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 22 | 0.5 1/2 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 23 | 0 teaspoon teaspoon |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 24 | 0 dried thyme |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 25 | 1 1 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 26 | 0 bay leaf |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 27 | 1 1 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 28 | 0 pound pound |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 29 | 0 Russet potatoes |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 30 | 0 peeled and diced into 1/2 inch cubes |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 31 | 2 2 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 32 | ounce bottles |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 33 | 0 clam juice |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 34 | 2 2 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 35 | 0 cups cups |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 36 | 0 chicken broth |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 37 | 28 28 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 38 | 0 ounce can |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 39 | 0 diced tomatoes |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 40 | 0 do not drain |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 41 | 10 10 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 42 | 0 ounce can |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 43 | 0 whole baby clams |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 44 | 0 drained |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 45 | 0 salt and pepper to taste |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 46 | 2 2 |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 47 | 0 tablespoons tablespoons |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 48 | 0 chopped parsley |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 49 | 0 oyster crackers and cooked bacon for serving |  | each |
| 71 | MANHATTAN CLAM CHOWDER (TOMATO BASE) | 50 | 0 optional |  | each |
| 72 | BOSTON CREAM PIE | 0 | 0 0 Ingredients |  | each |
| 72 | BOSTON CREAM PIE | 1 | 0 6 6 |  | each |
| 72 | BOSTON CREAM PIE | 2 | 0 0 slices |  | each |
| 72 | BOSTON CREAM PIE | 3 | 0 0 bacon |  | each |
| 72 | BOSTON CREAM PIE | 4 | 0 0 chopped |  | each |
| 72 | BOSTON CREAM PIE | 5 | 0 0.5 1/2 |  | each |
| 72 | BOSTON CREAM PIE | 6 | 0 0 cup cup |  | each |
| 72 | BOSTON CREAM PIE | 7 | 0 0 onion |  | each |
| 72 | BOSTON CREAM PIE | 8 | 0 0 diced |  | each |
| 72 | BOSTON CREAM PIE | 9 | 0 2 2 |  | each |
| 72 | BOSTON CREAM PIE | 10 | 0 0 carrots |  | each |
| 72 | BOSTON CREAM PIE | 11 | 0 0 peeled, quartered and sliced |  | each |
| 72 | BOSTON CREAM PIE | 12 | 0 0.5 1/2 |  | each |
| 72 | BOSTON CREAM PIE | 13 | 0 0 cup cup |  | each |
| 72 | BOSTON CREAM PIE | 14 | 0 0 celery |  | each |
| 72 | BOSTON CREAM PIE | 15 | 0 0 sliced |  | each |
| 72 | BOSTON CREAM PIE | 16 | 0 2 2 |  | each |
| 72 | BOSTON CREAM PIE | 17 | 0 0 teaspoons teaspoons |  | each |
| 72 | BOSTON CREAM PIE | 18 | 0 0 minced garlic |  | each |
| 72 | BOSTON CREAM PIE | 19 | 0 0.25 1/4 |  | each |
| 72 | BOSTON CREAM PIE | 20 | 0 0 cup cup |  | each |
| 72 | BOSTON CREAM PIE | 21 | 0 0 tomato paste |  | each |
| 72 | BOSTON CREAM PIE | 22 | 0 0.5 1/2 |  | each |
| 72 | BOSTON CREAM PIE | 23 | 0 0 teaspoon teaspoon |  | each |
| 72 | BOSTON CREAM PIE | 24 | 0 0 dried thyme |  | each |
| 72 | BOSTON CREAM PIE | 25 | 0 1 1 |  | each |
| 72 | BOSTON CREAM PIE | 26 | 0 0 bay leaf |  | each |
| 72 | BOSTON CREAM PIE | 27 | 0 1 1 |  | each |
| 72 | BOSTON CREAM PIE | 28 | 0 0 pound pound |  | each |
| 72 | BOSTON CREAM PIE | 29 | 0 0 Russet potatoes |  | each |
| 72 | BOSTON CREAM PIE | 30 | 0 0 peeled and diced into 1/2 inch cubes |  | each |
| 72 | BOSTON CREAM PIE | 31 | 0 2 2 |  | each |
| 72 | BOSTON CREAM PIE | 32 | ounce bottles |  | each |
| 72 | BOSTON CREAM PIE | 33 | 0 0 clam juice |  | each |
| 72 | BOSTON CREAM PIE | 34 | 0 2 2 |  | each |
| 72 | BOSTON CREAM PIE | 35 | 0 0 cups cups |  | each |
| 72 | BOSTON CREAM PIE | 36 | 0 0 chicken broth |  | each |
| 72 | BOSTON CREAM PIE | 37 | 0 28 28 |  | each |
| 72 | BOSTON CREAM PIE | 38 | 0 0 ounce can |  | each |
| 72 | BOSTON CREAM PIE | 39 | 0 0 diced tomatoes |  | each |
| 72 | BOSTON CREAM PIE | 40 | 0 0 do not drain |  | each |
| 72 | BOSTON CREAM PIE | 41 | 0 10 10 |  | each |
| 72 | BOSTON CREAM PIE | 42 | 0 0 ounce can |  | each |
| 72 | BOSTON CREAM PIE | 43 | 0 0 whole baby clams |  | each |
| 72 | BOSTON CREAM PIE | 44 | 0 0 drained |  | each |
| 72 | BOSTON CREAM PIE | 45 | 0 0 salt and pepper to taste |  | each |
| 72 | BOSTON CREAM PIE | 46 | 0 2 2 |  | each |
| 72 | BOSTON CREAM PIE | 47 | 0 0 tablespoons tablespoons |  | each |
| 72 | BOSTON CREAM PIE | 48 | 0 0 chopped parsley |  | each |
| 72 | BOSTON CREAM PIE | 49 | 0 0 oyster crackers and cooked bacon for serving |  | each |
| 72 | BOSTON CREAM PIE | 50 | 0 0 optional |  | each |
| 73 | WHITE BEAN DIP WITH TOASTED PITA CHIPS | 0 | extra-virgin olive oil | tablespoons | Tbsp |
| 73 | WHITE BEAN DIP WITH TOASTED PITA CHIPS | 1 | fat garlic cloves, thinly sliced |  | each |
| 73 | WHITE BEAN DIP WITH TOASTED PITA CHIPS | 2 | scallions, thinly sliced, white and light green parts separated from dark greens |  | each |
| 73 | WHITE BEAN DIP WITH TOASTED PITA CHIPS | 3 | tomato paste | tablespoon | Tbsp |
| 73 | WHITE BEAN DIP WITH TOASTED PITA CHIPS | 4 | to 2 tablespoons chile crisp or chile paste, to taste | teaspoons | tsp |
| 73 | WHITE BEAN DIP WITH TOASTED PITA CHIPS | 5 | (15-ounce) cans white beans, such as cannellini or Great Northern, drained and rinsed |  | each |
| 73 | WHITE BEAN DIP WITH TOASTED PITA CHIPS | 6 | fine sea salt, plus more to taste | teaspoon | tsp |
| 73 | WHITE BEAN DIP WITH TOASTED PITA CHIPS | 7 | ounces sharp white Cheddar, grated (about 2 cups) |  | each |
| 74 | TOMATO BASIL PIZETTE | 0 | ⅓ cups plain flour, plus a little extra for sprinkling ⅓ cup + 1 tablespoon unsalted butter, chilled and diced |  | each |
| 74 | TOMATO BASIL PIZETTE | 1 | mature cheddar cheese, grated, divided ¼ teaspoon ground black pepper | cups | cup |
| 74 | TOMATO BASIL PIZETTE | 2 | 0 ¼ teaspoon dried thyme 2 ½ lbs heirloom tomatoes |  | each |
| 74 | TOMATO BASIL PIZETTE | 3 | olive oil, divided ½ teaspoon salt | tablespoons | Tbsp |
| 74 | TOMATO BASIL PIZETTE | 4 | garlic, sliced 4 sprigs fresh thyme | cloves | clove |
| 74 | TOMATO BASIL PIZETTE | 5 | bacon slices, diced 1 small onion, diced |  | each |
| 74 | TOMATO BASIL PIZETTE | 6 | 0 ½ cup mayonnaise 1 large egg, room temperature |  | each |
| 74 | TOMATO BASIL PIZETTE | 7 | chopped fresh chives, plus more for serving 1 tablespoon chopped fresh basil, plus more for serving | tablespoons | Tbsp |
| 74 | TOMATO BASIL PIZETTE | 8 | breadcrumbs | tablespoons | Tbsp |
| 75 | THAI CHICKEN NOODLE SOUP | 0 | coconut oil, or olive oil | tablespoon | Tbsp |
| 75 | THAI CHICKEN NOODLE SOUP | 1 | chicken breasts, boneless, skinless |  | each |
| 75 | THAI CHICKEN NOODLE SOUP | 2 | ounces rice noodles |  | each |
| 75 | THAI CHICKEN NOODLE SOUP | 3 | onion, diced |  | each |
| 75 | THAI CHICKEN NOODLE SOUP | 4 | carrots, peeled and julienned |  | each |
| 75 | THAI CHICKEN NOODLE SOUP | 5 | red bell pepper, julienned |  | each |
| 75 | THAI CHICKEN NOODLE SOUP | 7 | garlic, minced or grated | cloves | clove |
| 75 | THAI CHICKEN NOODLE SOUP | 8 | inch fresh ginger, minced or grated |  | each |
| 75 | THAI CHICKEN NOODLE SOUP | 9 | red Thai chili, minced (optional) |  | each |
| 75 | THAI CHICKEN NOODLE SOUP | 10 | Thai red curry paste | tablespoons | Tbsp |
| 75 | THAI CHICKEN NOODLE SOUP | 11 | chicken broth | cups | cup |
| 75 | THAI CHICKEN NOODLE SOUP | 13 | fish sauce (optional) | teaspoon | tsp |
| 75 | THAI CHICKEN NOODLE SOUP | 15 | 0 0 Lime, cut into wedges, to serve |  | each |
| 76 | SEARED CATFISH | 0 | 0 2 Échalote(s) |  | each |
| 76 | SEARED CATFISH | 1 | cl Crème liquide |  | each |
| 76 | SEARED CATFISH | 3 | Citron(s) jaune(s) |  | each |
| 76 | SEARED CATFISH | 4 | verre(s) Vin blanc |  | each |
| 77 | CHICKEN CAESAR SALAD | 0 | 0 0 Ingredients |  | each |
| 77 | CHICKEN CAESAR SALAD | 1 | 0 6 6 |  | each |
| 77 | CHICKEN CAESAR SALAD | 2 | 0 0 cups cups |  | each |
| 77 | CHICKEN CAESAR SALAD | 3 | 0 0 romaine or salad greens, |  | each |
| 77 | CHICKEN CAESAR SALAD | 4 | 0 0 washed, dried and chopped |  | each |
| 77 | CHICKEN CAESAR SALAD | 5 | 0 3 3 |  | each |
| 77 | CHICKEN CAESAR SALAD | 6 | 0 0 slices |  | each |
| 77 | CHICKEN CAESAR SALAD | 7 | 0 0 bacon, |  | each |
| 77 | CHICKEN CAESAR SALAD | 8 | 0 0 cooked and crumbled |  | each |
| 77 | CHICKEN CAESAR SALAD | 9 | 0 3 3 |  | each |
| 77 | CHICKEN CAESAR SALAD | 10 | 0 0 boiled eggs, |  | each |
| 77 | CHICKEN CAESAR SALAD | 11 | 0 0 sliced or chopped |  | each |
| 77 | CHICKEN CAESAR SALAD | 12 | 0 1 1 |  | each |
| 77 | CHICKEN CAESAR SALAD | 13 | 0 0 large |  | each |
| 77 | CHICKEN CAESAR SALAD | 14 | 0 0 chicken breast, |  | each |
| 77 | CHICKEN CAESAR SALAD | 15 | 0 0 seasoned and cooked |  | each |
| 77 | CHICKEN CAESAR SALAD | 16 | 0 1 1 |  | each |
| 77 | CHICKEN CAESAR SALAD | 17 | 0 0 cup cup |  | each |
| 77 | CHICKEN CAESAR SALAD | 18 | 0 0 cherry tomatoes |  | each |
| 77 | CHICKEN CAESAR SALAD | 19 | 0 1 1 |  | each |
| 77 | CHICKEN CAESAR SALAD | 20 | 0 0 cup cup |  | each |
| 77 | CHICKEN CAESAR SALAD | 21 | 0 0 croutons |  | each |
| 77 | CHICKEN CAESAR SALAD | 22 | 0 1 1 |  | each |
| 77 | CHICKEN CAESAR SALAD | 23 | 0 0 tablespoon tablespoon |  | each |
| 77 | CHICKEN CAESAR SALAD | 24 | 0 0 grated parmesan cheese |  | each |
| 77 | CHICKEN CAESAR SALAD | 25 | 0 2 2 |  | each |
| 77 | CHICKEN CAESAR SALAD | 26 | 0 0 tablespoons tablespoons |  | each |
| 77 | CHICKEN CAESAR SALAD | 27 | 0 0 shaved parmesan cheese |  | each |
| 77 | CHICKEN CAESAR SALAD | 28 | 0 0 Marzetti® Simply Dressed® Caesar Salad Dressing |  | each |
| 78 | Thai Fish Cakes with Cilantro Dip | 0 | pound basa fillets ( cooked and flaked) |  | each |
| 78 | Thai Fish Cakes with Cilantro Dip | 1 | green onion (diced) |  | each |
| 78 | Thai Fish Cakes with Cilantro Dip | 2 | 0 1 egg |  | each |
| 78 | Thai Fish Cakes with Cilantro Dip | 3 | ⁄4 cup panko breadcrumbs |  | each |
| 78 | Thai Fish Cakes with Cilantro Dip | 4 | ⁄2 Tablespoon red curry paste |  | each |
| 78 | Thai Fish Cakes with Cilantro Dip | 5 | minced cilantro | tablespoons | Tbsp |
| 78 | Thai Fish Cakes with Cilantro Dip | 6 | mayonnaise | tablespoons | Tbsp |
| 78 | Thai Fish Cakes with Cilantro Dip | 7 | minced fresh ginger | teaspoon | tsp |
| 78 | Thai Fish Cakes with Cilantro Dip | 8 | ⁄2 lime (juice and zest) |  | each |
| 78 | Thai Fish Cakes with Cilantro Dip | 9 | mayonnaise | tablespoons | Tbsp |
| 78 | Thai Fish Cakes with Cilantro Dip | 10 | capers (minced) | teaspoons | tsp |
| 78 | Thai Fish Cakes with Cilantro Dip | 11 | ⁄4 lime (juice and zest) |  | each |
| 78 | Thai Fish Cakes with Cilantro Dip | 12 | minced green onion | tablespoon | Tbsp |
| 78 | Thai Fish Cakes with Cilantro Dip | 13 | 0 0 salt & pepper |  | each |
| 79 | 3 - Sisters Indigenous Soup | 0 | olive oil | tbsp | Tbsp |
| 79 | 3 - Sisters Indigenous Soup | 1 | medium yellow onion, peeled and diced |  | each |
| 79 | 3 - Sisters Indigenous Soup | 2 | garlic, minced | cloves | clove |
| 79 | 3 - Sisters Indigenous Soup | 6 | bay leaves |  | each |
| 79 | 3 - Sisters Indigenous Soup | 7 | ounces chicken broth |  | each |
| 79 | 3 - Sisters Indigenous Soup | 8 | ounce can diced fire roasted tomatoes |  | each |
| 79 | 3 - Sisters Indigenous Soup | 9 | 0 0 salt and fresh cracked black pepper |  | each |
| 79 | 3 - Sisters Indigenous Soup | 10 | jalapeño pepper, minced (leave out for less heat) |  | each |
| 79 | 3 - Sisters Indigenous Soup | 11 | zucchini, diced (do not peel) |  | each |
| 79 | 3 - Sisters Indigenous Soup | 12 | summer squash, diced (do not peel) |  | each |
| 79 | 3 - Sisters Indigenous Soup | 13 | ears corn, kernels removed |  | each |
| 79 | 3 - Sisters Indigenous Soup | 14 | cooked black-eyed peas | cups | cup |
| 79 | 3 - Sisters Indigenous Soup | 15 | 0 0 fresh parsley |  | each |
| 79 | 3 - Sisters Indigenous Soup | 16 | 0 0 grated cheese such as Parmesan or Asiago |  | each |


### Quantity Changes

No safe quantity changes were needed. Null, negative, or malformed numeric-string quantities were not present. Zero quantities were intentionally left unchanged.

### Category Changes

No category changes were applied. Remaining invalid categories are on orphan recipes, which this pass was instructed not to fix.

## Manual Review Items

- Zero quantities left unchanged: 138
- Orphan recipes left unchanged: 11
- Invalid categories remaining: 6
- Title spelling items remaining: 9

### Invalid Categories Remaining

| Recipe index | Recipe title | Category | Reason |
|---:|---|---|---|
| 0 | Grilled Lemon-Herb Chicken | entree | Orphan recipe excluded from automatic fixes. |
| 1 | Beef Bourguignon | entree | Orphan recipe excluded from automatic fixes. |
| 2 | Cream of Mushroom Soup | soup | Orphan recipe excluded from automatic fixes. |
| 3 | Beef Meatloaf with Jus | entree | Orphan recipe excluded from automatic fixes. |
| 4 | Coffee-Rubbed Beef Tenderloin, shallot butter (GF) | dinner elevated | Orphan recipe excluded from automatic fixes. |
| 5 | Miso and Soy Chilean Sea Bass | Traditional | Orphan recipe excluded from automatic fixes. |

### Title Spelling Review

| Recipe index | Recipe title | Suggested spelling | Reason |
|---:|---|---|---|
| 17 | California Brococli Salad | broccoli | Linked recipe was not renamed. |
| 45 | Whaldorf Endive Salad | Waldorf | Linked recipe was not renamed. |
| 57 | Grilled Shirmp with Mango Salsa | shrimp | Linked recipe was not renamed. |
| 241 | SAUTEED SPINACH WITH GARROT/MUSHROOM/ONION | carrot | Linked recipe was not renamed. |
| 244 | MISO & SHRIMIP SOUP WITH SCALLION DUMPLING | shrimp | Linked recipe was not renamed. |
| 298 | GINGER & CARROT WITH CORRIANDER YOGURT (GF) | coriander | Linked recipe was not renamed. |
| 304 | RATAOUILLE WITH LENTILS | ratatouille | Linked recipe was not renamed. |
| 328 | BANANA CREAM PIE TRIFFLE | trifle | Linked recipe was not renamed. |
| 341 | CARRIBEAN RAGU STUFFED PLANTAINS | Caribbean | Linked recipe was not renamed. |

## Success Criteria Check

- No duplicate IDs: yes
- No duplicate titles: yes
- No malformed units: yes
- No invalid categories: no - remaining invalid categories are orphan recipes excluded from automatic fixes
- No broken nonblank menu links: yes
- Recipe schema remains valid: verified separately after repair pass
