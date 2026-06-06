import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const recipesPath = path.join(root, "data", "recipes", "sample-recipes.json");
const recipes = JSON.parse(await fs.readFile(recipesPath, "utf8"));

const replacements = new Map([
  ["ASSORTED DESSERT", {
    title: "ASSORTED DESSERT",
    yield: "24 servings",
    category: "Dessert",
    ingredients: [
      { amount: 8, unit: "each", name: "mini fruit tarts" },
      { amount: 8, unit: "each", name: "brownie bites" },
      { amount: 8, unit: "each", name: "mini cheesecakes" },
      { amount: 3, unit: "cup", name: "fresh seasonal berries, washed and dried" },
      { amount: 0.25, unit: "cup", name: "icing sugar for garnish" }
    ],
    steps: [
      "Confirm the dessert assortment and identify items containing common allergens before plating.",
      "Arrange the mini fruit tarts, brownie bites, and mini cheesecakes in alternating rows on chilled service trays, allowing one dessert per serving.",
      "Distribute the fresh seasonal berries evenly around the desserts without placing wet fruit directly on pastries.",
      "Lightly dust the assortment with icing sugar immediately before service.",
      "Cover and refrigerate at 40°F (4°C) or below until service; remove only the quantity needed for each service period."
    ],
    notes: [
      "Yield provides 24 individual dessert portions.",
      "Maintain allergen identification for each purchased dessert variety."
    ],
    tags: ["production-ready", "retirement-home", "dessert-assortment"]
  }],
  ["SUMMER MINESTRONE", {
    title: "SUMMER MINESTRONE",
    yield: "24 servings",
    category: "Appetizer 2",
    ingredients: [
      { amount: 0.5, unit: "cup", name: "olive oil" },
      { amount: 3, unit: "each", name: "large yellow onions, diced" },
      { amount: 3, unit: "lb", name: "carrots, peeled and diced" },
      { amount: 2, unit: "lb", name: "celery, diced" },
      { amount: 12, unit: "clove", name: "garlic, minced" },
      { amount: 4, unit: "lb", name: "zucchini, diced" },
      { amount: 3, unit: "lb", name: "green beans, trimmed and cut into 1-inch pieces" },
      { amount: 2, unit: "can", name: "106 oz diced tomatoes with juice" },
      { amount: 6, unit: "quart", name: "low-sodium vegetable broth" },
      { amount: 3, unit: "can", name: "100 oz cannellini beans, drained and rinsed" },
      { amount: 2, unit: "lb", name: "small shell pasta" },
      { amount: 2, unit: "Tbsp", name: "dried Italian seasoning" },
      { amount: 2, unit: "lb", name: "baby spinach, roughly chopped" },
      { amount: 2, unit: "Tbsp", name: "kosher salt, or to taste" },
      { amount: 1, unit: "Tbsp", name: "ground black pepper" },
      { amount: 0.5, unit: "cup", name: "fresh parsley, chopped" }
    ],
    steps: [
      "Heat the olive oil in a steam-jacketed kettle or heavy stockpot over medium heat. Add the onions, carrots, and celery; cook for 8 to 10 minutes until softened without browning.",
      "Add the minced garlic and Italian seasoning. Cook for 1 minute, stirring continuously.",
      "Add the zucchini, green beans, diced tomatoes, and vegetable broth. Bring to a boil, then reduce to a steady simmer.",
      "Simmer for 15 minutes, or until the carrots and green beans are nearly tender.",
      "Stir in the cannellini beans and shell pasta. Simmer for 10 to 12 minutes, stirring regularly, until the pasta is tender and the soup reaches at least 165°F (74°C).",
      "Fold in the chopped spinach and cook for 2 minutes until wilted. Season with kosher salt and black pepper, then finish with chopped parsley.",
      "Serve in 8-ounce portions. For hot holding, maintain at 140°F (60°C) or above and stir periodically to keep ingredients evenly distributed."
    ],
    notes: [
      "Dairy-free as written.",
      "Add extra hot vegetable broth during holding if the pasta thickens the soup."
    ],
    tags: ["production-ready", "retirement-home", "dairy-free", "soup"]
  }]
]);

const changed = [];
for (let index = 0; index < recipes.length; index++) {
  const replacement = replacements.get(recipes[index].title);
  if (!replacement) continue;
  recipes[index] = {
    ...replacement,
    metadata: {
      ...(recipes[index].metadata || {}),
      source: "chef-approved-production-recipe",
      createdForMenuLinkAudit: false,
      remediatedAt: new Date().toISOString(),
      remediationScope: "Final Dinner remediation"
    }
  };
  changed.push(recipes[index].title);
}

if (changed.length !== replacements.size) {
  throw new Error(`Expected to update ${replacements.size} recipes but updated ${changed.length}.`);
}

await fs.writeFile(recipesPath, `${JSON.stringify(recipes, null, 2)}\n`);
console.log(JSON.stringify({ changed }, null, 2));
