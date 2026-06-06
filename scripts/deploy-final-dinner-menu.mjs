import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { findRecipeByTitle, normalizeRecipeTitle } from "../js/loadRecipes.js";
import { scaleRecipe } from "../js/scaleRecipe.js";
import { aggregateIngredients } from "../js/aggregateIngredients.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apply = process.argv.includes("--apply");
const readJson = async (file) => JSON.parse((await fs.readFile(file, "utf8")).replace(/^\uFEFF/, ""));
const hashFile = async (file) => createHash("sha256").update(await fs.readFile(file)).digest("hex").toUpperCase();
const snapshotPath = path.join(root, ".tmp-final-dinner-deployment-snapshot.json");
const sourceValidationPath = path.join(root, ".tmp-final-dinner-source-validation.json");
const menuPath = path.join(root, "data", "processed", "clean-menu.json");
const recipesPath = path.join(root, "data", "recipes", "sample-recipes.json");
const snapshot = await readJson(snapshotPath);
const sourceValidation = await readJson(sourceValidationPath);
const currentMenu = await readJson(menuPath);
const currentRecipes = await readJson(recipesPath);

if (await hashFile(snapshot.finalWorkbook) !== snapshot.finalWorkbookHash) {
  throw new Error("The approved final workbook changed after preview generation.");
}
if (await hashFile(menuPath) !== snapshot.menuHash || await hashFile(recipesPath) !== snapshot.recipesHash) {
  throw new Error("Production menu or recipe data changed after preview generation. Regenerate the preview.");
}

const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const categories = [
  "Appetizer 1", "Appetizer 2", "Elevated", "Comfort", "Alternative",
  "Veggie 1", "Veggie 2", "Starch", "Dessert"
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getRecipeIndex(recipes, reference) {
  const found = findRecipeByTitle(recipes, reference);
  return found ? recipes.indexOf(found) : -1;
}

function getMenuReferences(rotation) {
  const references = [];
  for (const [week, weekValue] of Object.entries(rotation?.weeks || {})) {
    for (const [day, dayValue] of Object.entries(weekValue?.days || {})) {
      for (const [category, title] of Object.entries(dayValue || {})) {
        if (String(title || "").trim()) references.push({ week, day, category, title });
      }
    }
  }
  return references;
}

const lunchReferences = getMenuReferences(currentMenu.lunch);
const lunchIndices = new Set();
for (const reference of lunchReferences) {
  const index = getRecipeIndex(currentRecipes, reference.title);
  if (index < 0) throw new Error(`Current Lunch recipe is missing before deployment: ${reference.title}`);
  lunchIndices.add(index);
}
const immutableLunchRecipes = new Map([...lunchIndices].map((index) => [index, JSON.stringify(currentRecipes[index])]));

const fractionMap = new Map([
  ["½", "1/2"], ["⅓", "1/3"], ["⅔", "2/3"], ["¼", "1/4"], ["¾", "3/4"],
  ["⅕", "1/5"], ["⅖", "2/5"], ["⅗", "3/5"], ["⅘", "4/5"],
  ["⅙", "1/6"], ["⅚", "5/6"], ["⅛", "1/8"], ["⅜", "3/8"], ["⅝", "5/8"], ["⅞", "7/8"]
]);

function normalizeFractions(value) {
  let text = String(value || "");
  for (const [glyph, fraction] of fractionMap) {
    text = text.replaceAll(glyph, ` ${fraction}`);
  }
  return text.replace(/(\d)\s+(\d+\/\d+)/g, "$1 $2").replace(/\s+/g, " ").trim();
}

function parseNumber(value) {
  const text = normalizeFractions(value);
  const mixed = text.match(/^(\d+(?:\.\d+)?)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function splitTopLevel(value) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const character of String(value || "")) {
    if (character === "(") depth++;
    if (character === ")") depth = Math.max(0, depth - 1);
    if (character === "," && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function splitIngredientSections(value) {
  const text = String(value || "").trim();
  const sectionPattern = /(?=[A-Z][A-Za-z /&-]{1,35}:\s*(?:\d|[¼½¾⅓⅔⅛]|a\b|an\b|one\b|two\b|three\b|four\b|five\b|six\b))/g;
  const sections = text.split(sectionPattern).map((item) => item.trim()).filter(Boolean);
  return sections.flatMap((section) => splitTopLevel(section));
}

const unitAliases = new Map([
  ["tbsp", "Tbsp"], ["tablespoon", "Tbsp"], ["tablespoons", "Tbsp"],
  ["tsp", "tsp"], ["teaspoon", "tsp"], ["teaspoons", "tsp"],
  ["cup", "cup"], ["cups", "cup"], ["lb", "lb"], ["lbs", "lb"], ["pound", "lb"], ["pounds", "lb"],
  ["oz", "oz"], ["ounce", "oz"], ["ounces", "oz"], ["g", "g"], ["gram", "g"], ["grams", "g"],
  ["kg", "kg"], ["ml", "ml"], ["l", "L"], ["liter", "L"], ["liters", "L"],
  ["can", "can"], ["cans", "can"], ["package", "package"], ["packages", "package"],
  ["jar", "jar"], ["jars", "jar"], ["pint", "pint"], ["pints", "pint"],
  ["head", "head"], ["heads", "head"], ["clove", "clove"], ["cloves", "clove"],
  ["sprig", "sprig"], ["sprigs", "sprig"], ["stalk", "stalk"], ["stalks", "stalk"],
  ["slice", "slice"], ["slices", "slice"], ["piece", "piece"], ["pieces", "piece"]
]);

function parseIngredient(segment) {
  let text = normalizeFractions(segment).replace(/^[^:]{1,45}:\s*(?=\d|a |an |one |two |three |four |five |six )/i, "");
  text = text.replace(/^[•*-]\s*/, "").trim();
  if (!text) return null;
  if (/^(salt|pepper|salt and pepper|fresh mint leaves for garnish|optional garnish)/i.test(text)) {
    return { amount: 1, unit: "to taste", name: text };
  }
  if (/^(a|one)\s+pinch\b/i.test(text)) {
    return { amount: 1, unit: "pinch", name: text.replace(/^(a|one)\s+pinch\s*(?:of\s*)?/i, "") || "seasoning" };
  }
  const amountMatch = text.match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s+(.+)$/);
  if (!amountMatch) return { amount: 1, unit: "each", name: text };
  const amount = parseNumber(amountMatch[1]) ?? 1;
  let remainder = amountMatch[2].trim();
  const firstWord = remainder.match(/^([A-Za-z%]+)\b\s*(.*)$/);
  if (firstWord && unitAliases.has(firstWord[1].toLowerCase())) {
    return {
      amount,
      unit: unitAliases.get(firstWord[1].toLowerCase()),
      name: firstWord[2].trim() || firstWord[1]
    };
  }
  return { amount, unit: "each", name: remainder };
}

function splitSteps(value) {
  const cleaned = String(value || "")
    .replaceAll("\\n", "\n")
    .replace(/\r/g, "")
    .trim();
  let steps = cleaned.split(/\n+/).map((item) => item.trim()).filter(Boolean);
  if (steps.length < 3) {
    steps = cleaned
      .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ '&/-]{2,55}:\s)/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (steps.length < 3) {
    const sentences = cleaned.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
    steps = [];
    for (let index = 0; index < sentences.length; index += 2) {
      steps.push(sentences.slice(index, index + 2).join(" "));
    }
  }
  return steps;
}

function parseWorkbookRecipe(row) {
  const text = String(row.RecipeText || "").replaceAll("\\n", "\n");
  const yieldMatch = text.match(/Yield:\s*([^\n🛒]+?)(?=\s*🛒|\s*Ingredients)/i);
  const ingredientMarker = text.search(/🛒\s*Ingredients|Ingredients/i);
  const stepMarker = text.search(/🍳\s*Step-by-Step Instructions|Step-by-Step Instructions/i);
  if (ingredientMarker < 0 || stepMarker < 0 || stepMarker <= ingredientMarker) {
    throw new Error(`Unable to parse approved recipe text for ${row.MenuItem}`);
  }
  const ingredientStart = text.slice(ingredientMarker).replace(/^.*?(?:🛒\s*)?Ingredients\s*/is, "");
  const ingredientText = ingredientStart.slice(0, ingredientStart.search(/🍳\s*Step-by-Step Instructions|Step-by-Step Instructions/i));
  const stepText = text.slice(stepMarker).replace(/^.*?(?:🍳\s*)?Step-by-Step Instructions\s*/is, "");
  const ingredients = splitIngredientSections(ingredientText)
    .map(parseIngredient)
    .filter((item) => item && item.name);
  const steps = splitSteps(stepText);
  return {
    title: row.MenuItem.trim(),
    yield: String(yieldMatch?.[1] || "4 servings").trim(),
    category: row.Category,
    ingredients,
    steps
  };
}

function completenessIssues(recipe) {
  const issues = [];
  if (!String(recipe?.title || "").trim()) issues.push("Missing title");
  if (!String(recipe?.yield || "").trim()) issues.push("Missing yield");
  if (!String(recipe?.category || "").trim()) issues.push("Missing category");
  const ingredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe?.steps) ? recipe.steps : [];
  if (ingredients.length < 3) issues.push("Fewer than 3 ingredients");
  if (ingredients.some((item) =>
    !String(item?.name || "").trim()
    || !Number.isFinite(Number(item?.amount))
    || Number(item.amount) <= 0
    || !String(item?.unit || "").trim()
  )) issues.push("Ingredient quantity, name, or unit missing");
  if (ingredients.some((item) => /recipe details pending|seasonal vegetables|aromatic vegetables|primary protein|house sauce or dipping sauce/i.test(item.name))) {
    issues.push("Placeholder or generic ingredient");
  }
  if (steps.length < 3) issues.push("Fewer than 3 instructions");
  if (steps.some((step) => /placeholder recipe|prepare primary|appropriate saute|according to the dish/i.test(step))) {
    issues.push("Placeholder or generic instruction");
  }
  return issues;
}

function normalizeSourceRecipe(recipe, row, fallbackRecipe = null) {
  const source = structuredClone(recipe || fallbackRecipe || {});
  const fallback = fallbackRecipe || {};
  let ingredients = Array.isArray(source.ingredients) ? source.ingredients : [];
  if (ingredients.length < 3 && Array.isArray(fallback.ingredients)) ingredients = fallback.ingredients;
  ingredients = ingredients.map((item) => {
    const name = String(item?.name || "ingredient").trim();
    const amount = Number(item?.amount);
    return {
      amount: Number.isFinite(amount) && amount > 0 ? amount : 1,
      unit: String(item?.unit || "").trim() || (/to taste|as needed|for garnish|optional/i.test(name) ? "to taste" : "each"),
      name
    };
  });
  let steps = Array.isArray(source.steps) ? source.steps.filter((step) => String(step || "").trim()) : [];
  if (steps.length < 3 && Array.isArray(fallback.steps) && fallback.steps.length >= 3) {
    steps = fallback.steps;
  }
  if (steps.length < 3) steps = splitSteps(steps.join(" "));
  return {
    title: row.MenuItem.trim(),
    yield: String(source.yield || fallback.yield || "4 servings").trim(),
    category: row.Category,
    ingredients,
    steps
  };
}

const sourceByIndex = new Map(sourceValidation.results.map((item) => [item.recipeIndex, item]));
const finalRows = snapshot.finalRows;
const finalGroups = new Map();
for (const row of finalRows) {
  const key = normalizeRecipeTitle(row.MenuItem);
  if (!finalGroups.has(key)) finalGroups.set(key, []);
  finalGroups.get(key).push(row);
}

const currentIndexByFinalKey = new Map();
for (const [key, rows] of finalGroups) {
  const matches = new Set(rows.map((row) => getRecipeIndex(currentRecipes, row.MenuItem)).filter((index) => index >= 0));
  if (matches.size > 1) throw new Error(`Final recipe resolves to multiple current records: ${rows[0].MenuItem}`);
  currentIndexByFinalKey.set(key, matches.size ? [...matches][0] : -1);
}

const replacements = new Map();
const additions = [];
const recipeActions = [];
const completenessAudit = [];
const manualReview = [];
for (const [key, rows] of finalGroups) {
  const row = rows[0];
  const currentIndex = currentIndexByFinalKey.get(key);
  const isLunchShared = currentIndex >= 0 && lunchIndices.has(currentIndex);
  if (isLunchShared) {
    const recipe = currentRecipes[currentIndex];
    const issues = completenessIssues(recipe);
    recipeActions.push({ recipeName: row.MenuItem, action: "Preserved unchanged (shared with Lunch)", currentIndex });
    for (const issue of issues) {
      completenessAudit.push({
        recipeName: row.MenuItem,
        issueType: issue,
        issueDescription: "Dinner recipe is shared with Lunch and was not modified due to the deployment restriction.",
        sourceUrl: recipe?.metadata?.sourceUrl || "",
        actionTaken: "Manual review required; Lunch record preserved unchanged."
      });
    }
    if (sourceByIndex.has(currentIndex)) {
      manualReview.push({ recipeName: row.MenuItem, reason: "Source-linked recipe is shared with Lunch; no record changes allowed." });
    }
    continue;
  }

  const current = currentIndex >= 0 ? currentRecipes[currentIndex] : null;
  const sourceResult = currentIndex >= 0 ? sourceByIndex.get(currentIndex) : null;
  const workbookValue = String(row.RecipeText || "").trim();
  const isUrlRecipe = /^https?:\/\//i.test(workbookValue);
  const parsed = isUrlRecipe
    ? normalizeSourceRecipe(sourceResult?.extracted, row, current)
    : parseWorkbookRecipe(row);
  parsed.metadata = {
    ...(current?.metadata || {}),
    deployedFrom: "summer-menu-master-final.xlsx",
    finalWorkbookSha256: snapshot.finalWorkbookHash,
    dinnerAssignments: rows.map(({ Week, Day, Category }) => ({ week: Week, day: Day, category: Category })),
    deployedAt: new Date().toISOString()
  };
  if (isUrlRecipe) parsed.metadata.sourceUrl = workbookValue.replace(/\s+\(complete the recipe.*$/i, "");
  if (sourceResult) {
    parsed.metadata.sourceValidation = {
      validatedAt: sourceValidation.generatedAt,
      status: sourceResult.ok ? "validated" : "manual-review",
      finalUrl: sourceResult.finalUrl || sourceResult.sourceUrl,
      issue: sourceResult.error || sourceResult.issues?.join("; ") || ""
    };
    if (!sourceResult.ok) {
      manualReview.push({
        recipeName: row.MenuItem,
        reason: `Original source could not produce a complete structured extraction: ${sourceResult.error || sourceResult.issues?.join("; ")}`
      });
    }
  }
  const issues = completenessIssues(parsed);
  if (issues.length) {
    for (const issue of issues) {
      completenessAudit.push({
        recipeName: row.MenuItem,
        issueType: issue,
        issueDescription: "Approved workbook recipe text could not be normalized to production completeness.",
        sourceUrl: parsed.metadata.sourceUrl || "",
        actionTaken: "Manual review required."
      });
    }
  }
  if (currentIndex >= 0) {
    replacements.set(currentIndex, parsed);
    recipeActions.push({
      recipeName: row.MenuItem,
      action: isUrlRecipe
        ? (sourceResult?.extracted ? "Re-extracted and normalized from source URL" : "Retained and normalized current extraction; source URL blocked")
        : "Rebuilt from approved workbook recipe",
      currentIndex
    });
  } else {
    additions.push(parsed);
    recipeActions.push({ recipeName: row.MenuItem, action: "Added from approved workbook recipe", currentIndex: null });
  }
}

const proposedMenu = structuredClone(currentMenu);
for (const week of weeks) {
  for (const day of days) {
    const dayMenu = proposedMenu.dinner.weeks[week].days[day];
    for (const category of categories) delete dayMenu[category];
  }
}
for (const row of finalRows) {
  proposedMenu.dinner.weeks[row.Week].days[row.Day][row.Category] = row.MenuItem;
}

const finalDinnerReferences = getMenuReferences(proposedMenu.dinner);
const usedCurrentIndices = new Set(lunchIndices);
for (const [key, currentIndex] of currentIndexByFinalKey) {
  if (currentIndex >= 0) usedCurrentIndices.add(currentIndex);
}

const proposedRecipes = [];
const oldToNew = new Map();
for (let index = 0; index < currentRecipes.length; index++) {
  if (!usedCurrentIndices.has(index)) continue;
  const recipe = replacements.get(index) || currentRecipes[index];
  oldToNew.set(index, proposedRecipes.length);
  proposedRecipes.push(recipe);
}
proposedRecipes.push(...additions);

const duplicateGroups = Object.entries(Object.groupBy(
  proposedRecipes.map((recipe, index) => ({ index, title: recipe.title, key: normalizeRecipeTitle(recipe.title) })),
  (item) => item.key
)).filter(([key, items]) => key && items.length > 1);
if (duplicateGroups.length) {
  throw new Error(`Duplicate recipes after cleanup: ${duplicateGroups.map(([, items]) => items.map((item) => item.title).join(" / ")).join("; ")}`);
}

const missingDinner = finalDinnerReferences.filter((reference) => !findRecipeByTitle(proposedRecipes, reference.title));
const missingLunch = lunchReferences.filter((reference) => !findRecipeByTitle(proposedRecipes, reference.title));
if (missingDinner.length || missingLunch.length) {
  throw new Error(`Broken recipe links after deployment staging: Dinner=${missingDinner.length}, Lunch=${missingLunch.length}`);
}

const lunchAfter = JSON.stringify(proposedMenu.lunch);
const lunchBeforeSnapshot = JSON.stringify(currentMenu.lunch);
if (lunchAfter !== lunchBeforeSnapshot) throw new Error("Lunch menu changed during staging.");
for (const [oldIndex, originalJson] of immutableLunchRecipes) {
  const newIndex = oldToNew.get(oldIndex);
  if (newIndex === undefined || JSON.stringify(proposedRecipes[newIndex]) !== originalJson) {
    throw new Error(`Lunch recipe changed during staging: ${currentRecipes[oldIndex].title}`);
  }
}

const dinnerRecipeKeys = new Set(finalDinnerReferences.map((item) => normalizeRecipeTitle(findRecipeByTitle(proposedRecipes, item.title)?.title)));
const lunchRecipeKeys = new Set(lunchReferences.map((item) => normalizeRecipeTitle(findRecipeByTitle(proposedRecipes, item.title)?.title)));
const orphanRecipes = proposedRecipes.filter((recipe) => {
  const key = normalizeRecipeTitle(recipe.title);
  return !dinnerRecipeKeys.has(key) && !lunchRecipeKeys.has(key);
});
if (orphanRecipes.length) throw new Error(`Orphan recipes remain after cleanup: ${orphanRecipes.length}`);

const finalCompleteness = [];
for (const reference of finalDinnerReferences) {
  const recipe = findRecipeByTitle(proposedRecipes, reference.title);
  for (const issue of completenessIssues(recipe)) {
    finalCompleteness.push({ reference, recipe, issue });
  }
}

const scalingFailures = [];
for (const key of dinnerRecipeKeys) {
  const recipe = proposedRecipes.find((item) => normalizeRecipeTitle(item.title) === key);
  const yieldNumber = String(recipe.yield || "").match(/\d+(?:\.\d+)?/)?.[0];
  const target = yieldNumber ? String(Number(yieldNumber) * 2) : "8";
  const result = scaleRecipe(recipe, target);
  if (!result.ok || result.recipe.ingredients.some((item) => !item.scaled)) {
    scalingFailures.push(recipe.title);
  }
}

const procurementFailures = [];
for (const week of weeks) {
  const result = aggregateIngredients(proposedMenu, proposedRecipes, { mealType: "dinner", week });
  if (result.missingRecipes.length) procurementFailures.push(...result.missingRecipes.map((item) => `${week}: ${item.title}`));
}

const lunchProcurementBefore = weeks.map((week) =>
  aggregateIngredients(currentMenu, currentRecipes, { mealType: "lunch", week })
);
const lunchProcurementAfter = weeks.map((week) =>
  aggregateIngredients(proposedMenu, proposedRecipes, { mealType: "lunch", week })
);
const lunchProcurementUnchanged =
  JSON.stringify(lunchProcurementAfter) === JSON.stringify(lunchProcurementBefore);
if (!lunchProcurementUnchanged) throw new Error("Lunch procurement data changed during staging.");

const removedRecipes = currentRecipes.filter((_, index) => !usedCurrentIndices.has(index));
const analysis = {
  generatedAt: new Date().toISOString(),
  applied: apply,
  menu: {
    finalAssignments: finalDinnerReferences.length,
    finalUnassignedSlots: 252 - finalDinnerReferences.length,
    lunchAssignments: lunchReferences.length
  },
  recipes: {
    before: currentRecipes.length,
    after: proposedRecipes.length,
    added: additions.length,
    rebuilt: replacements.size,
    removed: removedRecipes.length,
    lunchRecordsPreserved: lunchIndices.size,
    duplicateGroups: duplicateGroups.length,
    orphans: orphanRecipes.length,
    incompleteDinnerAssignments: finalCompleteness.length
  },
  sourceValidation: {
    attempted: sourceValidation.total,
    fullyValidated: sourceValidation.validated,
    requiringManualReview: sourceValidation.failed
  },
  validation: {
    missingDinnerRecipes: missingDinner.length,
    missingLunchRecipes: missingLunch.length,
    scalingFailures,
    procurementFailures,
    lunchMenuUnchanged: true,
    lunchRecipesUnchanged: true,
    lunchProcurementUnchanged
  },
  recipeActions,
  completenessAudit,
  manualReview,
  removedRecipeTitles: removedRecipes.map((recipe) => recipe.title)
};

await fs.writeFile(path.join(root, ".tmp-proposed-final-menu.json"), `${JSON.stringify(proposedMenu, null, 2)}\n`);
await fs.writeFile(path.join(root, ".tmp-proposed-final-recipes.json"), `${JSON.stringify(proposedRecipes, null, 2)}\n`);
await fs.writeFile(path.join(root, ".tmp-final-dinner-deployment-analysis.json"), `${JSON.stringify(analysis, null, 2)}\n`);

if (apply) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archiveDir = path.join(root, "archive", "recipes");
  await fs.mkdir(archiveDir, { recursive: true });
  const archivePath = path.join(archiveDir, `removed-final-dinner-deployment-${timestamp}.json`);
  await fs.writeFile(archivePath, `${JSON.stringify({
    archivedAt: new Date().toISOString(),
    reason: "Not referenced by final Dinner menu or unchanged Lunch menu",
    recipes: removedRecipes
  }, null, 2)}\n`);
  await fs.writeFile(menuPath, `${JSON.stringify(proposedMenu, null, 2)}\n`);
  await fs.writeFile(recipesPath, `${JSON.stringify(proposedRecipes, null, 2)}\n`);
  analysis.archivePath = path.relative(root, archivePath).replaceAll("\\", "/");
  await fs.writeFile(path.join(root, ".tmp-final-dinner-deployment-analysis.json"), `${JSON.stringify(analysis, null, 2)}\n`);
}

console.log(JSON.stringify({
  applied: apply,
  menu: analysis.menu,
  recipes: analysis.recipes,
  sourceValidation: analysis.sourceValidation,
  validation: analysis.validation,
  manualReview: manualReview.length
}, null, 2));
