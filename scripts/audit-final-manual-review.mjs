import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractRecipeFromHtmlDocument } from "../worker/src/extractRecipe.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const recipes = JSON.parse(await fs.readFile(path.join(root, "recipes-cleaned.json"), "utf8"));
const flagged = recipes.filter((recipe) => recipe?.metadata?.ingredientAudit?.requiresManualReview);

const genericIngredientPattern = /^(?:protein|vegetables?|sauce base|primary protein|seasonal vegetables|aromatic vegetables|house sauce|recipe details pending|ingredient needed|as required)$/i;
const genericStepPattern = /\b(?:prepare (?:the )?protein|cook until done|season to taste|prepare as desired|appropriate saute|according to the dish|placeholder recipe|follow standard procedure|serve as appropriate)\b/i;
const instructionVerbPattern = /\b(?:add|arrange|bake|beat|blend|boil|bring|combine|cook|cover|drain|fold|fry|grill|heat|mix|place|pour|preheat|reduce|remove|roast|saute|season|serve|simmer|stir|toss|whisk)\b/i;
const validUnits = new Set([
  "", "each", "tbsp", "tsp", "cup", "lb", "oz", "g", "kg", "ml", "l", "can", "package",
  "jar", "pint", "quart", "gallon", "head", "clove", "bunch", "stalk", "slice", "piece",
  "pinch", "sprig", "to taste"
]);

const normalize = (value) => String(value || "")
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

function getSourceUrl(recipe) {
  return recipe?.metadata?.sourceUrl
    || recipe?.metadata?.recipeUrl
    || recipe?.metadata?.importedFromUrl
    || recipe?.sourceUrl || recipe?.recipeUrl || recipe?.importedFromUrl || "";
}

function cleanUrl(value) {
  return String(value || "").trim().replace(/\s+\(.*$/s, "");
}

function ingredientTokens(ingredients) {
  return new Set((ingredients || []).flatMap((ingredient) =>
    normalize(typeof ingredient === "string" ? ingredient : ingredient?.name).split(" ")
      .filter((word) => word.length > 2)
  ));
}

function overlapRatio(left, right) {
  if (!left.size || !right.size) return 0;
  let matches = 0;
  for (const token of left) if (right.has(token)) matches++;
  return matches / Math.min(left.size, right.size);
}

async function verifySource(recipe) {
  const url = cleanUrl(getSourceUrl(recipe));
  if (!url) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/147 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) return { ok: false, url, issue: `${response.status} ${response.statusText}` };
    const extracted = extractRecipeFromHtmlDocument(await response.text(), url);
    const ingredientMatch = overlapRatio(ingredientTokens(recipe.ingredients), ingredientTokens(extracted.ingredients));
    const sourceSteps = Array.isArray(extracted.steps) ? extracted.steps.filter(Boolean) : [];
    const localSteps = Array.isArray(recipe.steps) ? recipe.steps.filter(Boolean) : [];
    const instructionMatch = sourceSteps.length >= 1 && localSteps.length >= 1;
    return {
      ok: ingredientMatch >= 0.65 && instructionMatch,
      url: response.url,
      ingredientMatch,
      sourceIngredients: extracted.ingredients?.length || 0,
      sourceSteps: sourceSteps.length,
      issue: ingredientMatch < 0.65
        ? `Ingredient match confidence ${(ingredientMatch * 100).toFixed(0)}%`
        : !instructionMatch ? "Source or local instructions missing" : ""
    };
  } catch (error) {
    return {
      ok: false,
      url,
      issue: error?.name === "AbortError" ? "Request timed out" : String(error?.message || error)
    };
  } finally {
    clearTimeout(timer);
  }
}

const sourceResults = new Map();
let cursor = 0;
const sourceRecipes = flagged.filter((recipe) => getSourceUrl(recipe));
async function worker() {
  while (cursor < sourceRecipes.length) {
    const recipe = sourceRecipes[cursor++];
    sourceResults.set(recipe.title, await verifySource(recipe));
  }
}
await Promise.all(Array.from({ length: Math.min(5, sourceRecipes.length) }, worker));

const rows = [];
const statuses = [];
const genericRecipes = new Set();
const missingSourceRecipes = new Set();

function addIssue(recipe, issueType, severity, recommendedFix) {
  rows.push({
    recipeName: recipe.title,
    issueType,
    severity,
    recommendedFix,
    sourceUrl: cleanUrl(getSourceUrl(recipe))
  });
}

for (const recipe of flagged) {
  const startCount = rows.length;
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps.map(String).map((step) => step.trim()).filter(Boolean) : [];

  if (ingredients.length < 3) {
    addIssue(recipe, "Ingredient completeness", "Critical", `Rebuild ingredient list; only ${ingredients.length} valid ingredient(s) remain.`);
  }
  for (const ingredient of ingredients) {
    const name = String(ingredient?.name || "").trim();
    const amount = Number(ingredient?.amount);
    const unit = normalize(ingredient?.unit);
    if (!name) addIssue(recipe, "Malformed ingredient", "Critical", "Add an actual food ingredient name.");
    if (!Number.isFinite(amount) || amount < 0) addIssue(recipe, "Invalid quantity", "High", `Correct quantity for "${name || "unnamed ingredient"}".`);
    if (!validUnits.has(unit)) addIssue(recipe, "Invalid unit", "High", `Normalize unit "${ingredient?.unit}" for ${name}.`);
    if (genericIngredientPattern.test(name)) {
      genericRecipes.add(recipe.title);
      addIssue(recipe, "Generic ingredient", "Critical", `Replace "${name}" with specific food ingredients and quantities.`);
    }
  }

  if (steps.length < 3) {
    addIssue(recipe, "Instruction completeness", "Critical", `Write at least three recipe-specific cooking steps; only ${steps.length} remain.`);
  }
  if (steps.some((step) => genericStepPattern.test(step))) {
    genericRecipes.add(recipe.title);
    addIssue(recipe, "Generic instructions", "Critical", "Replace production-template language with recipe-specific temperatures, timing, and method.");
  }
  if (steps.length && steps.filter((step) => instructionVerbPattern.test(step)).length < Math.min(2, steps.length)) {
    addIssue(recipe, "Instruction specificity", "High", "Rewrite steps with clear cooking actions, timing, and sequence.");
  }

  const yieldText = String(recipe.yield || "").trim();
  const yieldNumber = Number(yieldText.match(/\d+(?:\.\d+)?/)?.[0]);
  if (!yieldText) addIssue(recipe, "Missing yield", "Critical", "Add a production yield or serving count.");
  else if (!Number.isFinite(yieldNumber) || yieldNumber <= 0 || yieldNumber > 1000) {
    addIssue(recipe, "Unreasonable yield", "High", `Verify yield "${yieldText}" and replace it with a positive serving or batch quantity.`);
  }

  const source = sourceResults.get(recipe.title);
  if (source && !source.ok) {
    missingSourceRecipes.add(recipe.title);
    addIssue(recipe, "Source validation", "Medium", `Manually verify against the original source. ${source.issue}.`);
  }

  const blocking = rows.slice(startCount).some((row) => ["Critical", "High"].includes(row.severity));
  const sourceOnly = !blocking && rows.length > startCount;
  statuses.push({
    recipeName: recipe.title,
    status: blocking ? "Requires Fixes" : sourceOnly ? "Approved Pending Source Verification" : "Approved for Production"
  });
  if (rows.length === startCount) {
    addIssue(recipe, "Approved", "Info", "No recipe-quality correction required.");
  }
}

const summary = {
  reviewed: flagged.length,
  approvedForProduction: statuses.filter((item) => item.status === "Approved for Production").length,
  approvedPendingSourceVerification: statuses.filter((item) => item.status === "Approved Pending Source Verification").length,
  requiringFixes: statuses.filter((item) => item.status === "Requires Fixes").length,
  missingSourceData: missingSourceRecipes.size,
  containingGenericContent: genericRecipes.size,
  issueRows: rows.length
};

await fs.writeFile(path.join(root, ".tmp-final-manual-review.json"), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  summary,
  rows,
  statuses,
  sourceResults: Object.fromEntries(sourceResults)
}, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));
