import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findRecipeByTitle, normalizeRecipeTitle } from "../js/loadRecipes.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const recipes = JSON.parse(await fs.readFile(path.join(root, "recipes-cleaned.json"), "utf8"));
const menu = JSON.parse(await fs.readFile(path.join(root, "data", "processed", "clean-menu.json"), "utf8"));
const flagged = recipes.filter((recipe) => recipe?.metadata?.ingredientAudit?.requiresManualReview);

const genericIngredientPattern = /^(?:protein|vegetables?|sauce base|primary protein|seasonal vegetables|aromatic vegetables|house sauce|recipe details pending|ingredient needed|as required)$/i;
const explicitPlaceholderStep = /placeholder recipe created to link the current menu assignment|prepare primary protein|appropriate saute|according to the dish/i;
const sourceFailurePattern = /^Source validation failed:/i;

function sourceUrl(recipe) {
  return recipe?.metadata?.sourceUrl
    || recipe?.metadata?.recipeUrl
    || recipe?.metadata?.importedFromUrl
    || recipe?.sourceUrl || recipe?.recipeUrl || recipe?.importedFromUrl || "";
}

function formatIngredients(recipe) {
  return (recipe.ingredients || []).map((ingredient) =>
    [ingredient.amount, ingredient.unit, ingredient.name]
      .filter((value) => value !== "" && value !== null && value !== undefined)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
  ).join("\n");
}

function assignments() {
  const result = [];
  for (const [meal, rotation] of Object.entries(menu)) {
    for (const [week, weekData] of Object.entries(rotation?.weeks || {})) {
      for (const [day, dayData] of Object.entries(weekData?.days || {})) {
        for (const [category, title] of Object.entries(dayData || {})) {
          if (String(title || "").trim()) result.push({ meal, week, day, category, title });
        }
      }
    }
  }
  return result;
}

const menuAssignments = assignments();
const rows = [];
const classifications = new Map();

for (const recipe of flagged) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps.map(String).map((step) => step.trim()).filter(Boolean) : [];
  const genericIngredients = ingredients.filter((ingredient) => genericIngredientPattern.test(String(ingredient?.name || "").trim()));
  const genericInstructions = steps.filter((step) => explicitPlaceholderStep.test(step));
  const sourceIssue = (recipe.metadata?.ingredientAudit?.issues || []).find((issue) => sourceFailurePattern.test(issue));
  const missingIngredients = ingredients.length < 3;
  const missingInstructions = steps.length === 0 || genericInstructions.length === steps.length;

  let classification = "Category A: Recipe appears production-ready";
  const reasons = [];
  if (sourceIssue) {
    classification = "Category E: Recipe should be rebuilt from source URL";
    reasons.push(sourceIssue.replace(sourceFailurePattern, "").trim());
  } else if (missingIngredients) {
    classification = "Category C: Recipe missing ingredients";
    reasons.push(`Only ${ingredients.length} valid ingredient(s) remain after cleanup`);
    if (missingInstructions) reasons.push("Current instructions are placeholder-only");
  } else if (missingInstructions) {
    classification = "Category D: Recipe missing instructions";
    reasons.push("No recipe-specific instructions remain");
  } else if (genericIngredients.length || genericInstructions.length) {
    classification = "Category B: Recipe needs minor cleanup";
    reasons.push("Specific generic or placeholder content remains");
  }
  classifications.set(classification, (classifications.get(classification) || 0) + 1);

  const matchedAssignments = menuAssignments.filter((assignment) =>
    normalizeRecipeTitle(assignment.title) === normalizeRecipeTitle(recipe.title)
    || findRecipeByTitle([recipe], assignment.title)
  );
  const assignmentRows = matchedAssignments.length ? matchedAssignments : [{ meal: "", week: "", day: "", category: "" }];
  for (const assignment of assignmentRows) {
    rows.push({
      recipeName: recipe.title,
      week: assignment.week,
      day: assignment.day,
      category: assignment.meal ? `${assignment.meal[0].toUpperCase()}${assignment.meal.slice(1)} - ${assignment.category}` : "",
      classification,
      reasonFlagged: reasons.join("; "),
      sourceUrl: sourceUrl(recipe),
      yield: recipe.yield || "",
      ingredientCount: ingredients.length,
      stepCount: steps.length,
      genericIngredientsDetected: genericIngredients.map((ingredient) => ingredient.name).join("; "),
      genericInstructionsDetected: genericInstructions.join("\n"),
      currentIngredientList: formatIngredients(recipe),
      currentStepList: steps.map((step, index) => `${index + 1}. ${step}`).join("\n")
    });
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  flaggedRecipes: flagged.length,
  reportRows: rows.length,
  classifications: Object.fromEntries(classifications),
  rows
};
await fs.writeFile(path.join(root, ".tmp-flagged-recipes-review.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({
  flaggedRecipes: output.flaggedRecipes,
  reportRows: output.reportRows,
  classifications: output.classifications
}, null, 2));
