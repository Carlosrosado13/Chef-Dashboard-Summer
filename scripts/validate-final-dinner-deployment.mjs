import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { findRecipeByTitle, normalizeRecipeTitle } from "../js/loadRecipes.js";
import { scaleRecipe } from "../js/scaleRecipe.js";
import { aggregateIngredients } from "../js/aggregateIngredients.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (name) =>
  JSON.parse((await fs.readFile(path.join(root, name), "utf8")).replace(/^\uFEFF/, ""));
const snapshot = await readJson(".tmp-final-dinner-deployment-snapshot.json");
const menu = await readJson("data/processed/clean-menu.json");
const recipes = await readJson("data/recipes/sample-recipes.json");
const previousMenu = JSON.parse(execFileSync("git", ["show", "HEAD:data/processed/clean-menu.json"], { cwd: root, encoding: "utf8" }));
const previousRecipes = JSON.parse(execFileSync("git", ["show", "HEAD:data/recipes/sample-recipes.json"], { cwd: root, encoding: "utf8" }));

function references(rotation) {
  const rows = [];
  for (const [week, weekValue] of Object.entries(rotation?.weeks || {})) {
    for (const [day, dayValue] of Object.entries(weekValue?.days || {})) {
      for (const [category, title] of Object.entries(dayValue || {})) {
        if (String(title || "").trim()) rows.push({ week, day, category, title });
      }
    }
  }
  return rows;
}

const expected = snapshot.finalRows.map((row) =>
  [row.Week, row.Day, row.Category, row.MenuItem].join("\u001f")
).sort();
const actual = references(menu.dinner).map((row) =>
  [row.week, row.day, row.category, row.title].join("\u001f")
).sort();
if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("Dinner assignments do not exactly match the approved workbook.");
if (JSON.stringify(menu.lunch) !== JSON.stringify(previousMenu.lunch)) throw new Error("Lunch assignments changed.");

const lunchRefs = references(menu.lunch);
for (const ref of lunchRefs) {
  const before = findRecipeByTitle(previousRecipes, ref.title);
  const after = findRecipeByTitle(recipes, ref.title);
  if (!before || !after || JSON.stringify(after) !== JSON.stringify(before)) {
    throw new Error(`Lunch recipe changed: ${ref.title}`);
  }
}

for (const week of ["Week 1", "Week 2", "Week 3", "Week 4"]) {
  const before = aggregateIngredients(previousMenu, previousRecipes, { mealType: "lunch", week });
  const after = aggregateIngredients(menu, recipes, { mealType: "lunch", week });
  if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error(`Lunch procurement changed for ${week}.`);
}

const dinnerRefs = references(menu.dinner);
const missing = dinnerRefs.filter((ref) => !findRecipeByTitle(recipes, ref.title));
if (missing.length) throw new Error(`${missing.length} Dinner recipes are missing.`);

const duplicateGroups = Object.values(Object.groupBy(recipes, (recipe) => normalizeRecipeTitle(recipe.title)))
  .filter((group) => group.length > 1);
if (duplicateGroups.length) throw new Error(`${duplicateGroups.length} duplicate recipe groups remain.`);

const activeKeys = new Set([...dinnerRefs, ...lunchRefs].map((ref) =>
  normalizeRecipeTitle(findRecipeByTitle(recipes, ref.title)?.title)
));
const orphans = recipes.filter((recipe) => !activeKeys.has(normalizeRecipeTitle(recipe.title)));
if (orphans.length) throw new Error(`${orphans.length} orphan recipes remain.`);

const scalingFailures = [];
for (const key of new Set(dinnerRefs.map((ref) => normalizeRecipeTitle(findRecipeByTitle(recipes, ref.title).title)))) {
  const recipe = recipes.find((item) => normalizeRecipeTitle(item.title) === key);
  const currentYield = Number(String(recipe.yield || "").match(/\d+(?:\.\d+)?/)?.[0] || 4);
  const result = scaleRecipe(recipe, String(currentYield * 2));
  if (!result.ok || result.recipe.ingredients.some((item) => !item.scaled)) scalingFailures.push(recipe.title);
}
if (scalingFailures.length) throw new Error(`${scalingFailures.length} scaling checks failed.`);

const procurementFailures = [];
for (const week of ["Week 1", "Week 2", "Week 3", "Week 4"]) {
  const result = aggregateIngredients(menu, recipes, { mealType: "dinner", week });
  procurementFailures.push(...result.missingRecipes);
}
if (procurementFailures.length) throw new Error(`${procurementFailures.length} Dinner procurement links failed.`);

console.log(JSON.stringify({
  dinnerAssignments: actual.length,
  lunchAssignments: lunchRefs.length,
  recipes: recipes.length,
  missingDinnerRecipes: missing.length,
  duplicateRecipeGroups: duplicateGroups.length,
  orphanRecipes: orphans.length,
  scalingFailures: scalingFailures.length,
  dinnerProcurementFailures: procurementFailures.length,
  lunchAssignmentsUnchanged: true,
  lunchRecipesUnchanged: true,
  lunchProcurementUnchanged: true
}, null, 2));
