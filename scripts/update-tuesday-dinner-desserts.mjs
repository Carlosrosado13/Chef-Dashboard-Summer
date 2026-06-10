import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findRecipeByTitle, normalizeRecipeTitle } from "../js/loadRecipes.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const menuPath = path.join(root, "data", "processed", "clean-menu.json");
const recipesPath = path.join(root, "data", "recipes", "sample-recipes.json");
const readJson = async (file) =>
  JSON.parse((await fs.readFile(file, "utf8")).replace(/^\uFEFF/, ""));

const menu = await readJson(menuPath);
const recipes = await readJson(recipesPath);
const recipeCountBefore = recipes.length;

const assignments = {
  "Week 1": "CHOCOLATE MOUSSE WITH SPONGE TOFFEE",
  "Week 2": "PEACH FRIED PIES (DF)",
  "Week 3": "INDIAN PUDDING \u2013 CORNMEAL AND MOLASSES CAKE WITH VANILLA ICE CREAM",
  "Week 4": "BLUEBERRY CRUMBLE CHEESECAKE",
};

const assignmentFor = (week) => [
  {
    week,
    day: "Tuesday",
    category: "Dessert",
  },
];

const mousse = findRecipeByTitle(recipes, assignments["Week 1"]);
if (!mousse) throw new Error("Chocolate mousse recipe is missing.");
mousse.title = assignments["Week 1"];
mousse.category = "Dessert";
mousse.metadata = {
  ...(mousse.metadata || {}),
  dinnerAssignments: assignmentFor("Week 1"),
  tuesdayDessertSource: "Dinner Tuesday Desserts.txt",
};

const indianPudding = findRecipeByTitle(recipes, assignments["Week 3"]);
if (!indianPudding) throw new Error("Indian pudding recipe is missing.");
indianPudding.title = assignments["Week 3"];
indianPudding.category = "Dessert";
indianPudding.metadata = {
  ...(indianPudding.metadata || {}),
  dinnerAssignments: assignmentFor("Week 3"),
  tuesdayDessertSource: "Dinner Tuesday Desserts.txt",
};

const peachFriedPies = {
  title: assignments["Week 2"],
  yield: "8 pies",
  category: "Dessert",
  ingredients: [
    { amount: 2.5, unit: "cup", name: "all-purpose flour" },
    { amount: 0.75, unit: "cup", name: "vegetable shortening, solid and chilled" },
    { amount: 1.25, unit: "tsp", name: "salt, divided" },
    { amount: 0.5, unit: "cup", name: "ice water, plus 1 to 2 tablespoons if needed" },
    { amount: 4, unit: "cup", name: "peeled and finely chopped peaches" },
    { amount: 0.5, unit: "cup", name: "granulated sugar" },
    { amount: 0.25, unit: "cup", name: "brown sugar, packed" },
    { amount: 2, unit: "Tbsp", name: "cornstarch" },
    { amount: 1, unit: "Tbsp", name: "fresh lemon juice" },
    { amount: 0.5, unit: "tsp", name: "ground cinnamon" },
    { amount: 0.125, unit: "tsp", name: "ground nutmeg" },
    { amount: 3, unit: "cup", name: "vegetable oil for deep frying" },
    { amount: 0.5, unit: "cup", name: "powdered sugar, optional" },
  ],
  steps: [
    "Combine the chopped peaches, granulated sugar, brown sugar, cornstarch, lemon juice, cinnamon, nutmeg, and 0.25 teaspoon salt in a saucepan. Simmer over medium heat for 6 to 8 minutes, stirring constantly, until glossy and jam-like. Transfer to a bowl and cool completely.",
    "Whisk the flour with the remaining 1 teaspoon salt. Cut in the chilled vegetable shortening until the mixture resembles coarse crumbs with pea-sized pieces.",
    "Drizzle in 0.5 cup ice water and mix gently with a fork just until the dough comes together, adding 1 tablespoon extra water at a time only if needed. Shape into a disc, wrap, and refrigerate for 30 minutes.",
    "Roll the chilled dough on a lightly floured surface to about 1/8-inch thickness. Cut eight 5-inch rounds, rerolling scraps as needed.",
    "Place 2 tablespoons cooled filling in the center of each round. Lightly moisten the edge, fold into a half-moon, and crimp firmly with a floured fork.",
    "Heat the vegetable oil in a deep skillet or Dutch oven to 350 F. Fry 2 or 3 pies at a time for 3 to 4 minutes per side, turning once, until puffed, crisp, and deeply golden.",
    "Drain on paper towels and cool for 5 to 10 minutes. Dust with powdered sugar if desired and serve warm or at room temperature.",
  ],
  tags: ["dairy-free"],
  metadata: {
    sourceFile: "Dinner Tuesday Desserts.txt",
    tuesdayDessertSource: "Dinner Tuesday Desserts.txt",
    dinnerAssignments: assignmentFor("Week 2"),
  },
};

const blueberryCrumbleCheesecake = {
  title: assignments["Week 4"],
  yield: "12 servings",
  category: "Dessert",
  ingredients: [
    { amount: 1.5, unit: "cup", name: "graham cracker crumbs" },
    { amount: 1.33, unit: "cup", name: "granulated sugar, divided" },
    { amount: 6, unit: "Tbsp", name: "unsalted butter, melted" },
    { amount: 2, unit: "cup", name: "fresh or frozen blueberries" },
    { amount: 1, unit: "Tbsp", name: "cornstarch" },
    { amount: 1, unit: "Tbsp", name: "fresh lemon juice" },
    { amount: 32, unit: "oz", name: "cream cheese, softened to room temperature" },
    { amount: 0.5, unit: "cup", name: "sour cream, room temperature" },
    { amount: 1.5, unit: "tsp", name: "pure vanilla extract" },
    { amount: 4, unit: "each", name: "large eggs, room temperature" },
    { amount: 0.5, unit: "cup", name: "all-purpose flour for crumble" },
    { amount: 0.25, unit: "cup", name: "brown sugar, packed" },
    { amount: 0.5, unit: "tsp", name: "ground cinnamon" },
    { amount: 3, unit: "Tbsp", name: "cold unsalted butter, cubed" },
  ],
  steps: [
    "Heat the oven to 325 F and lightly grease a 9-inch springform pan. Mix the graham crumbs, 3 tablespoons of the granulated sugar, and melted butter. Press firmly into the bottom and slightly up the sides; bake for 10 minutes and cool completely.",
    "Combine the blueberries, 2 tablespoons granulated sugar, cornstarch, and lemon juice in a saucepan. Cook over medium heat for 5 to 6 minutes, gently mashing the berries, until glossy and thick. Cool.",
    "Whisk together the flour, brown sugar, and cinnamon. Cut in the cold cubed butter until coarse clumps form, then refrigerate the crumble.",
    "Beat the softened cream cheese with 1 cup granulated sugar for 2 to 3 minutes until smooth. Mix in the sour cream and vanilla. On low speed, add the eggs one at a time, mixing only until each yolk disappears.",
    "Pour the cheesecake batter over the cooled crust. Spoon the blueberry mixture over the batter and swirl gently with a knife. Sprinkle the chilled crumble evenly over the surface.",
    "Wrap the bottom of the pan in foil and bake for 50 minutes, until the edges are set and the center still jiggles slightly. Turn off the oven, crack the door 2 inches, and cool the cheesecake inside for 1 hour.",
    "Remove the foil, run a thin knife around the inside edge, and refrigerate for at least 6 hours or overnight before removing the springform collar and slicing.",
  ],
  metadata: {
    sourceFile: "Dinner Tuesday Desserts.txt",
    tuesdayDessertSource: "Dinner Tuesday Desserts.txt",
    dinnerAssignments: assignmentFor("Week 4"),
  },
};

for (const recipe of [peachFriedPies, blueberryCrumbleCheesecake]) {
  const existing = findRecipeByTitle(recipes, recipe.title);
  if (existing) {
    recipes[recipes.indexOf(existing)] = recipe;
  } else {
    recipes.push(recipe);
  }
}

for (const [week, title] of Object.entries(assignments)) {
  menu.dinner.weeks[week].days.Tuesday.Dessert = title;
}

const targetKeys = new Set(Object.values(assignments).map(normalizeRecipeTitle));
const targetRecipes = recipes.filter((recipe) =>
  targetKeys.has(normalizeRecipeTitle(recipe.title)),
);
if (targetRecipes.length !== 4) {
  throw new Error(`Expected 4 Tuesday dessert recipes, found ${targetRecipes.length}.`);
}

await fs.writeFile(menuPath, `${JSON.stringify(menu, null, 2)}\n`, "utf8");
await fs.writeFile(recipesPath, `${JSON.stringify(recipes, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      updatedAssignments: assignments,
      recipesVerifiedOrUpdated: targetRecipes.length,
      recipesAdded: recipes.length - recipeCountBefore,
    },
    null,
    2,
  ),
);
