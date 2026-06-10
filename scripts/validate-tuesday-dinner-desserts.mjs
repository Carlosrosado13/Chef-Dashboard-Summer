import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { findRecipeByTitle, normalizeRecipeTitle } from "../js/loadRecipes.js";
import { validateRecipe } from "../worker/src/validateRecipe.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (file) =>
  JSON.parse((await fs.readFile(path.join(root, file), "utf8")).replace(/^\uFEFF/, ""));
const readHeadJson = (file) =>
  JSON.parse(execFileSync("git", ["show", `HEAD:${file}`], { cwd: root, encoding: "utf8" }));

const menu = await readJson("data/processed/clean-menu.json");
const recipes = await readJson("data/recipes/sample-recipes.json");
const beforeMenu = readHeadJson("data/processed/clean-menu.json");
const beforeRecipes = readHeadJson("data/recipes/sample-recipes.json");

const expected = {
  "Week 1": "CHOCOLATE MOUSSE WITH SPONGE TOFFEE",
  "Week 2": "PEACH FRIED PIES (DF)",
  "Week 3": "INDIAN PUDDING \u2013 CORNMEAL AND MOLASSES CAKE WITH VANILLA ICE CREAM",
  "Week 4": "BLUEBERRY CRUMBLE CHEESECAKE",
};
const targetKeys = new Set(Object.values(expected).map(normalizeRecipeTitle));

const references = (rotation) => {
  const rows = [];
  for (const [week, weekData] of Object.entries(rotation?.weeks || {})) {
    for (const [day, dayData] of Object.entries(weekData?.days || {})) {
      for (const [category, title] of Object.entries(dayData || {})) {
        if (String(title || "").trim()) rows.push({ week, day, category, title });
      }
    }
  }
  return rows;
};

const beforeAssignments = {};
for (const week of Object.keys(expected)) {
  beforeAssignments[week] = beforeMenu.dinner.weeks[week].days.Tuesday.Dessert;
  if (menu.dinner.weeks[week].days.Tuesday.Dessert !== expected[week]) {
    throw new Error(`Incorrect Tuesday dessert for ${week}.`);
  }
}

if (JSON.stringify(menu.lunch) !== JSON.stringify(beforeMenu.lunch)) {
  throw new Error("Lunch menu changed.");
}

for (const [week, weekData] of Object.entries(menu.dinner.weeks)) {
  for (const [day, dayData] of Object.entries(weekData.days)) {
    for (const [category, title] of Object.entries(dayData)) {
      if (day === "Tuesday" && category === "Dessert") continue;
      const previous = beforeMenu.dinner.weeks[week].days[day][category];
      if (title !== previous) {
        throw new Error(`Non-target menu assignment changed: ${week} ${day} ${category}.`);
      }
    }
  }
}

const targetRecipes = Object.values(expected).map((title) => {
  const recipe = findRecipeByTitle(recipes, title);
  if (!recipe) throw new Error(`Broken target recipe link: ${title}`);
  return recipe;
});

const missingIngredients = targetRecipes.filter(
  (recipe) =>
    !Array.isArray(recipe.ingredients) ||
    recipe.ingredients.length === 0 ||
    recipe.ingredients.some(
      (item) =>
        !String(item?.name || "").trim() ||
        !String(item?.unit || "").trim() ||
        !Number.isFinite(Number(item?.amount)) ||
        Number(item.amount) <= 0,
    ),
);
const missingInstructions = targetRecipes.filter(
  (recipe) =>
    !Array.isArray(recipe.steps) ||
    recipe.steps.length === 0 ||
    recipe.steps.some((step) => !String(step || "").trim()),
);
const emptyRecipeFields = targetRecipes.filter(
  (recipe) =>
    !String(recipe.title || "").trim() ||
    !String(recipe.yield || "").trim() ||
    recipe.category !== "Dessert",
);
const schemaFailures = targetRecipes.filter((recipe) => !validateRecipe(recipe).ok);

const allReferences = [...references(menu.dinner), ...references(menu.lunch)];
const brokenLinks = allReferences.filter(
  (reference) => !findRecipeByTitle(recipes, reference.title),
);

const duplicateGroups = Object.values(
  Object.groupBy(recipes, (recipe) => normalizeRecipeTitle(recipe.title)),
).filter((group) => group.length > 1);

const tuesdayDessertRows = references(menu.dinner).filter(
  (row) => row.day === "Tuesday" && row.category === "Dessert",
);
const duplicateTuesdayDessertAssignments =
  tuesdayDessertRows.length === 4 &&
  new Set(tuesdayDessertRows.map((row) => row.week)).size === 4
    ? 0
    : Math.abs(tuesdayDessertRows.length - 4) + 1;

const unchangedBeforeRecipes = beforeRecipes.filter(
  (recipe) => !targetKeys.has(normalizeRecipeTitle(recipe.title)),
);
const unchangedAfterRecipes = recipes.filter(
  (recipe) => !targetKeys.has(normalizeRecipeTitle(recipe.title)),
);
if (JSON.stringify(unchangedAfterRecipes) !== JSON.stringify(unchangedBeforeRecipes)) {
  throw new Error("A non-target recipe changed or moved.");
}

const validation = {
  recipesVerifiedOrUpdated: targetRecipes.length,
  recipesAdded: recipes.length - beforeRecipes.length,
  missingIngredients: missingIngredients.length,
  missingInstructions: missingInstructions.length,
  emptyRecipeFields: emptyRecipeFields.length,
  brokenLinks: brokenLinks.length,
  duplicateTuesdayDessertAssignments,
  duplicateRecipes: duplicateGroups.length,
  schemaFailures: schemaFailures.length,
  lunchUnchanged: true,
  nonTuesdayAssignmentsUnchanged: true,
  nonTargetRecipesUnchanged: true,
};

for (const [key, value] of Object.entries(validation)) {
  if (typeof value === "number" && key !== "recipesVerifiedOrUpdated" && key !== "recipesAdded" && value !== 0) {
    throw new Error(`${key} validation failed: ${value}`);
  }
}

const lines = [
  "# Tuesday Dinner Dessert Update Report",
  "",
  "## BEFORE",
  "",
  "| Week | Day | Category | Recipe |",
  "|---|---|---|---|",
  ...Object.entries(beforeAssignments).map(
    ([week, title]) => `| ${week} | Tuesday | Dessert | ${title} |`,
  ),
  "",
  "## AFTER",
  "",
  "| Week | Day | Category | Recipe |",
  "|---|---|---|---|",
  ...Object.entries(expected).map(
    ([week, title]) => `| ${week} | Tuesday | Dessert | ${title} |`,
  ),
  "",
  "## VALIDATION RESULTS",
  "",
  `- Recipe count updated: ${validation.recipesVerifiedOrUpdated} verified/updated (${validation.recipesAdded} added)`,
  `- Missing ingredients: ${validation.missingIngredients}`,
  `- Missing instructions: ${validation.missingInstructions}`,
  `- Empty recipe fields: ${validation.emptyRecipeFields}`,
  `- Broken links: ${validation.brokenLinks}`,
  `- Duplicate Tuesday dessert assignments: ${validation.duplicateTuesdayDessertAssignments}`,
  `- Duplicate recipes: ${validation.duplicateRecipes}`,
  `- Recipe schema failures: ${validation.schemaFailures}`,
  `- Lunch unchanged: Yes`,
  `- Non-Tuesday menu assignments unchanged: Yes`,
  `- Non-target recipe records unchanged: Yes`,
  "",
  "## FINAL CONFIRMATION",
  "",
  "| Week | Day | Category | Recipe |",
  "|---|---|---|---|",
  ...Object.entries(expected).map(
    ([week, title]) => `| ${week} | Tuesday | Dessert | ${title} |`,
  ),
  "",
];

await fs.writeFile(
  path.join(root, "tuesday-dessert-update-report.md"),
  lines.join("\n"),
  "utf8",
);

console.log(JSON.stringify(validation, null, 2));
