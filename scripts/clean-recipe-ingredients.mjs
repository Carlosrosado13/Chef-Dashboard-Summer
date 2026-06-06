import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractRecipeFromHtmlDocument } from "../worker/src/extractRecipe.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data", "recipes", "sample-recipes.json");
const outputPath = path.join(root, "recipes-cleaned.json");
const auditPath = path.join(root, ".tmp-ingredient-audit.json");
const recipes = JSON.parse((await fs.readFile(sourcePath, "utf8")).replace(/^\uFEFF/, ""));

const normalize = (value) => String(value || "")
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/&/g, " and ").replace(/[^a-zA-Z0-9]+/g, " ")
  .replace(/\s+/g, " ").trim().toLowerCase();

const foodWords = new Set(`
almond apple apricot artichoke arugula asparagus avocado bacon basil bean beans beef beet berries berry
broccoli broccolini broth butter buttermilk cabbage caper capers carrot carrots cauliflower celery cheese
chicken chickpea chickpeas chili chocolate cilantro cinnamon clam clams coconut cod corn cream cucumber cumin
dill egg eggs endive fennel fish flour garlic ginger grape grapes haddock halibut ham hazelnut honey kale lamb
leek lemon lentil lentils lettuce lime lobster mango maple milk mint mushroom mushrooms mustard noodle noodles
oat oats oil olive olives onion onions orange oregano parsley pasta peach peaches pear pears peas pepper peppers
pesto pork potato potatoes prosciutto quinoa radish rice ricotta rosemary salmon salt scallop scallops shallot
shallots shrimp spinach squash stock strawberry sugar thyme tomato tomatoes tuna turkey vanilla vinegar walnut
walnuts water wine yogurt zucchini
`.trim().split(/\s+/));

const headerWords = /^(?:the|base|aromatics?|liquid|herbs?|seasoning|coating|glaze|sauce|dressing|garnish|topping|crunch|poaching|protein|vegetables?|fruit|salad|filling|crust|batter|marinade|braising|assembly|finish|finishing|steam|salsa|melba|components?|for serving|for the .+)$/i;
const overviewPattern = /^(?:overview|prep(?:aration)?\s*time|cook(?:ing)?\s*time|total\s*time|yield|servings?|ingredients?|instructions?|method|directions?|notes?)\s*:/i;
const instructionPattern = /^(?:add|arrange|bake|beat|blend|boil|bring|combine|cook|cover|drain|fold|grill|heat|mix|place|pour|preheat|reduce|remove|roast|saute|season|serve|simmer|stir|toss|whisk)\b/i;
const placeholderPattern = /recipe details pending|seasonal vegetables|aromatic vegetables|primary protein|house sauce|ingredient needed|as required/i;
const unitAliases = new Map([
  ["tablespoon", "Tbsp"], ["tablespoons", "Tbsp"], ["tbsp", "Tbsp"],
  ["teaspoon", "tsp"], ["teaspoons", "tsp"], ["tsp", "tsp"],
  ["cup", "cup"], ["cups", "cup"], ["ounce", "oz"], ["ounces", "oz"], ["oz", "oz"],
  ["pound", "lb"], ["pounds", "lb"], ["lb", "lb"], ["lbs", "lb"],
  ["gram", "g"], ["grams", "g"], ["g", "g"], ["kilogram", "kg"], ["kilograms", "kg"], ["kg", "kg"],
  ["milliliter", "ml"], ["milliliters", "ml"], ["ml", "ml"], ["liter", "L"], ["liters", "L"],
  ["can", "can"], ["cans", "can"], ["clove", "clove"], ["cloves", "clove"],
  ["bunch", "bunch"], ["bunches", "bunch"], ["stalk", "stalk"], ["stalks", "stalk"],
  ["slice", "slice"], ["slices", "slice"], ["piece", "piece"], ["pieces", "piece"],
  ["pinch", "pinch"], ["head", "head"], ["heads", "head"]
]);

function parseAmount(value) {
  const text = String(value || "")
    .replaceAll("¼", "1/4").replaceAll("½", "1/2").replaceAll("¾", "3/4")
    .replaceAll("⅓", "1/3").replaceAll("⅔", "2/3").replaceAll("⅛", "1/8").trim();
  const mixed = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
}

function normalizeIngredient(ingredient) {
  if (typeof ingredient !== "string") {
    return {
      amount: Number.isFinite(Number(ingredient?.amount)) ? Number(ingredient.amount) : 0,
      unit: String(ingredient?.unit || "").trim(),
      name: String(ingredient?.name || "").trim()
    };
  }
  const text = ingredient.trim();
  const match = text.match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+|[¼½¾⅓⅔⅛])?\s*([A-Za-z]+)?\s*(.*)$/);
  if (!match || !match[1]) return { amount: 0, unit: "", name: text };
  const amount = parseAmount(match[1]);
  const potentialUnit = String(match[2] || "").toLowerCase();
  if (unitAliases.has(potentialUnit)) {
    return { amount, unit: unitAliases.get(potentialUnit), name: String(match[3] || "").trim() };
  }
  return { amount, unit: "each", name: [match[2], match[3]].filter(Boolean).join(" ").trim() };
}

function sourceUrl(recipe) {
  return recipe?.metadata?.sourceUrl
    || recipe?.metadata?.recipeUrl
    || recipe?.metadata?.importedFromUrl
    || recipe?.sourceUrl || recipe?.recipeUrl || recipe?.importedFromUrl || "";
}

function cleanUrl(value) {
  return String(value || "").trim().replace(/\s+\(.*$/s, "");
}

function classify(recipe, ingredient) {
  const name = String(ingredient?.name || "").trim();
  const normalized = normalize(name);
  const title = normalize(recipe.title);
  const words = normalized.split(" ").filter(Boolean);
  const hasFoodWord = words.some((word) => foodWords.has(word));
  const oneEach = Number(ingredient?.amount) === 1 && normalize(ingredient?.unit) === "each";

  if (!name) return "Missing ingredient name";
  if (overviewPattern.test(name)) return "Overview field extracted as ingredient";
  if (placeholderPattern.test(name)) return "Generic ingredient placeholder";
  if (/^(?:the|and|or)$/i.test(name)) return "Section-heading fragment";
  if (/[&+:]\s*$/.test(name)) return "Truncated section heading";
  if (instructionPattern.test(name) && (words.length >= 4 || /[.!?]$/.test(name))) {
    return "Instruction text extracted as ingredient";
  }
  if (/[.!?]$/.test(name) && words.length >= 6) {
    return "Description or sentence extracted as ingredient";
  }
  if (oneEach && headerWords.test(name) && !hasFoodWord) return "Section title extracted as ingredient";
  if (oneEach && normalized === title) return "Recipe title extracted as ingredient";
  if (oneEach && words.length >= 2 && words.length <= 6 && title.includes(normalized) && !hasFoodWord) {
    return "Recipe-title fragment extracted as ingredient";
  }
  if (oneEach && /^[A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*){0,3}$/.test(name) && !hasFoodWord) {
    return "Likely section heading";
  }
  return "";
}

function cleanIngredients(recipe, ingredients) {
  const kept = [];
  const removed = [];
  for (const rawIngredient of Array.isArray(ingredients) ? ingredients : []) {
    const ingredient = normalizeIngredient(rawIngredient);
    const reason = classify(recipe, ingredient);
    if (reason) removed.push({ ingredient, reason });
    else kept.push(ingredient);
  }
  return { kept, removed };
}

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/147 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9"
};

async function fetchSource(recipe) {
  const url = cleanUrl(sourceUrl(recipe));
  if (!url) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, { headers, redirect: "follow", signal: controller.signal });
    if (!response.ok) return { ok: false, url, issue: `${response.status} ${response.statusText}` };
    const extracted = extractRecipeFromHtmlDocument(await response.text(), url);
    const cleaned = cleanIngredients(recipe, extracted.ingredients);
    if (cleaned.kept.length < 3) return { ok: false, url, issue: "Source extraction produced fewer than 3 clean ingredients" };
    return { ok: true, url: response.url, ingredients: cleaned.kept, removed: cleaned.removed };
  } catch (error) {
    return { ok: false, url, issue: error?.name === "AbortError" ? "Request timed out" : String(error?.message || error) };
  } finally {
    clearTimeout(timer);
  }
}

const sourceResults = new Map();
let cursor = 0;
const sourceRecipes = recipes.map((recipe, index) => ({ recipe, index })).filter(({ recipe }) => sourceUrl(recipe));
async function worker() {
  while (cursor < sourceRecipes.length) {
    const item = sourceRecipes[cursor++];
    sourceResults.set(item.index, await fetchSource(item.recipe));
  }
}
await Promise.all(Array.from({ length: Math.min(5, sourceRecipes.length) }, worker));

const cleanedRecipes = [];
const auditRows = [];
const manualReview = [];
let ingredientsRemoved = 0;
let recipesRebuilt = 0;

for (let index = 0; index < recipes.length; index++) {
  const original = recipes[index];
  const recipe = structuredClone(original);
  const existingClean = cleanIngredients(recipe, recipe.ingredients);
  let selected = existingClean.kept;
  let action = "Removed invalid extracted ingredient";
  const source = sourceResults.get(index);

  if (source?.ok) {
    selected = source.ingredients;
    action = "Rebuilt ingredient list from source URL";
    recipesRebuilt++;
  }

  for (const removed of existingClean.removed) {
    ingredientsRemoved++;
    auditRows.push({
      recipeName: recipe.title,
      invalidIngredient: [removed.ingredient?.amount, removed.ingredient?.unit, removed.ingredient?.name].filter((value) => value !== "" && value !== undefined).join(" "),
      reason: removed.reason,
      actionTaken: source?.ok ? "Replaced by clean source ingredient list" : "Removed from cleaned recipe"
    });
  }

  recipe.ingredients = selected;
  recipe.metadata = {
    ...(recipe.metadata || {}),
    ingredientAudit: {
      auditedAt: new Date().toISOString(),
      sourceChecked: Boolean(sourceUrl(recipe)),
      sourceRebuilt: Boolean(source?.ok),
      sourceIssue: source && !source.ok ? source.issue : ""
    }
  };

  const remainingArtifacts = selected
    .map((ingredient) => ({ ingredient, reason: classify(recipe, ingredient) }))
    .filter((item) => item.reason);
  const issues = [];
  if (!String(recipe.title || "").trim()) issues.push("Missing title");
  if (!String(recipe.yield || "").trim()) issues.push("Missing yield");
  if (selected.length < 3) issues.push("Fewer than 3 ingredients after cleanup");
  if (!Array.isArray(recipe.steps) || recipe.steps.filter((step) => String(step || "").trim()).length < 1) issues.push("Missing cooking steps");
  if (remainingArtifacts.length) issues.push("Possible ingredient artifacts remain");
  if (source && !source.ok) issues.push(`Source validation failed: ${source.issue}`);

  recipe.metadata.ingredientAudit.issues = issues;
  recipe.metadata.ingredientAudit.requiresManualReview = issues.length > 0;
  if (issues.length) manualReview.push({ recipeName: recipe.title, issues, sourceUrl: cleanUrl(sourceUrl(recipe)) });
  cleanedRecipes.push(recipe);
}

await fs.writeFile(outputPath, `${JSON.stringify(cleanedRecipes, null, 2)}\n`);
await fs.writeFile(auditPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  totals: {
    recipesAudited: recipes.length,
    ingredientsBefore: recipes.reduce((sum, recipe) => sum + (recipe.ingredients?.length || 0), 0),
    ingredientsAfter: cleanedRecipes.reduce((sum, recipe) => sum + (recipe.ingredients?.length || 0), 0),
    ingredientsRemoved,
    sourceRecipes: sourceRecipes.length,
    recipesRebuiltFromSourceUrls: recipesRebuilt,
    recipesRequiringManualReview: manualReview.length
  },
  auditRows,
  manualReview
}, null, 2)}\n`);

console.log(JSON.stringify({
  recipesCleaned: "recipes-cleaned.json",
  auditRows: auditRows.length,
  ...JSON.parse(await fs.readFile(auditPath, "utf8")).totals
}, null, 2));
