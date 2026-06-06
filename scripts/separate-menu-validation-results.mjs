import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeRecipeTitle } from "../js/loadRecipes.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const recipes = JSON.parse(await fs.readFile(path.join(root, "recipes-cleaned.json"), "utf8"));
const authorities = JSON.parse((await fs.readFile(path.join(root, ".tmp-menu-authorities.json"), "utf8")).replace(/^\uFEFF/, ""));
const dinnerRows = authorities.dinner;
const lunchRows = authorities.lunch;

function matches(recipeTitle, assignmentTitle) {
  const left = normalizeRecipeTitle(recipeTitle);
  const right = normalizeRecipeTitle(assignmentTitle);
  const singular = (value) => value.endsWith("s") ? value.slice(0, -1) : value;
  return left === right || singular(left) === singular(right);
}

const flagged = recipes.filter((recipe) => recipe?.metadata?.ingredientAudit?.requiresManualReview);
const missingIngredientSets = { Dinner: new Set(), Lunch: new Set(), Unassigned: new Set() };
const missingInstructionSets = { Dinner: new Set(), Lunch: new Set(), Unassigned: new Set() };
const rows = [];

for (const recipe of flagged) {
  const dinnerMatches = dinnerRows.filter((assignment) => matches(recipe.title, assignment.title));
  const lunchMatches = lunchRows.filter((assignment) => matches(recipe.title, assignment.title));
  const memberships = [];
  if (dinnerMatches.length) memberships.push({ menuType: "Dinner", assignments: dinnerMatches });
  if (lunchMatches.length) memberships.push({ menuType: "Lunch", assignments: lunchMatches });
  if (!memberships.length) memberships.push({ menuType: "Unassigned", assignments: [{}] });

  const missingIngredients = !Array.isArray(recipe.ingredients) || recipe.ingredients.length < 3;
  const steps = Array.isArray(recipe.steps) ? recipe.steps.map(String).filter((step) => step.trim()) : [];
  const missingInstructions = steps.length === 0 || steps.every((step) =>
    /placeholder recipe created to link the current menu assignment/i.test(step)
  );

  for (const membership of memberships) {
    if (missingIngredients) missingIngredientSets[membership.menuType].add(recipe.title);
    if (missingInstructions) missingInstructionSets[membership.menuType].add(recipe.title);
    for (const assignment of membership.assignments) {
      rows.push({
        recipeName: recipe.title,
        menuType: membership.menuType,
        week: assignment.week || "",
        day: assignment.day || "",
        category: assignment.category || "",
        missingIngredients: missingIngredients ? "Y" : "N",
        ingredientCount: Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0,
        missingInstructions: missingInstructions ? "Y" : "N",
        stepCount: steps.length
      });
    }
  }
}

const summary = {
  dinnerMissingIngredients: missingIngredientSets.Dinner.size,
  lunchMissingIngredients: missingIngredientSets.Lunch.size,
  unassignedMissingIngredients: missingIngredientSets.Unassigned.size,
  dinnerMissingInstructions: missingInstructionSets.Dinner.size,
  lunchMissingInstructions: missingInstructionSets.Lunch.size,
  unassignedMissingInstructions: missingInstructionSets.Unassigned.size
};

await fs.writeFile(path.join(root, ".tmp-menu-validation-separated.json"), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  authorities: {
    dinner: "summer-menu-master-final(2).xlsx (uploaded as summer-menu-master-final.xlsx)",
    lunch: "lunch-menu-master.xlsx"
  },
  flaggedRecipes: flagged.length,
  dinnerAssignments: dinnerRows.length,
  lunchAssignments: lunchRows.length,
  summary,
  lists: {
    dinnerRecipesMissingIngredients: [...missingIngredientSets.Dinner].sort(),
    lunchRecipesMissingIngredients: [...missingIngredientSets.Lunch].sort(),
    unassignedRecipesMissingIngredients: [...missingIngredientSets.Unassigned].sort(),
    dinnerRecipesMissingInstructions: [...missingInstructionSets.Dinner].sort(),
    lunchRecipesMissingInstructions: [...missingInstructionSets.Lunch].sort(),
    unassignedRecipesMissingInstructions: [...missingInstructionSets.Unassigned].sort()
  },
  rows
}, null, 2)}\n`);

console.log(JSON.stringify({
  flaggedRecipes: flagged.length,
  dinnerAssignments: dinnerRows.length,
  lunchAssignments: lunchRows.length,
  summary
}, null, 2));
