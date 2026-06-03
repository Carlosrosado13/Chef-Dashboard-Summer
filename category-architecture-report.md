# Menu Slot Category Architecture Decision

Decision: preserve menu-slot category architecture. Dinner recipes and menu slots use the nine Dinner slots; Lunch recipes and menu slots use the five Lunch slots. No schema redesign and no menu assignment changes are required.

## Allowed Categories

Dinner: Appetizer 1, Appetizer 2, Elevated, Comfort, Alternative, Veggie 1, Veggie 2, Starch, Dessert

Lunch: Soup 1, Entr?e 1, Entr?e 2, Salad, Dessert

## Current Recipe Categories

- Alternative
- Appetizer 1
- Appetizer 2
- Comfort
- Dessert
- Elevated
- Starch
- Traditional
- Veggie 1
- Veggie 2
- dinner elevated
- entree
- soup

Invalid/non-slot recipe categories currently present: 6

| Recipe index | Recipe title | Current category |
|---:|---|---|
| 0 | Grilled Lemon-Herb Chicken | entree |
| 1 | Beef Bourguignon | entree |
| 2 | Cream of Mushroom Soup | soup |
| 3 | Beef Meatloaf with Jus | entree |
| 4 | Coffee-Rubbed Beef Tenderloin, shallot butter (GF) | dinner elevated |
| 5 | Miso and Soy Chilean Sea Bass | Traditional |
