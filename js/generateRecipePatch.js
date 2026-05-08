export const PATCH_FIELDS = ["title", "yield", "category", "ingredients", "steps", "notes", "tags", "metadata"];
const KNOWN_UNITS = new Set([
  "bag", "bags", "bunch", "bunches", "can", "cans", "case", "cases", "clove", "cloves",
  "cup", "cups", "each", "ea", "fl", "gal", "g", "kg", "lb", "lbs", "oz", "pt", "qt",
  "t", "tbsp", "tablespoon", "tablespoons", "tsp", "teaspoon", "teaspoons"
]);

function cloneValue(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeAmount(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseIngredientLine(line) {
  const parts = String(line || "").split("|").map((part) => part.trim());

  if (parts.length >= 3) {
    const [amount, unit, ...nameParts] = parts;
    return {
      amount: normalizeAmount(amount),
      unit: normalizeText(unit),
      name: normalizeText(nameParts.join(" | "))
    };
  }

  const textParts = String(line || "").replace(/\s+/g, " ").trim().split(" ");
  const amount = normalizeAmount(textParts[0]);

  if (amount !== 0 && textParts.length >= 3) {
    const unitCandidate = textParts[1].toLowerCase();
    const hasKnownUnit = KNOWN_UNITS.has(unitCandidate);
    return {
      amount,
      unit: hasKnownUnit ? normalizeText(textParts[1]) : "",
      name: normalizeText(textParts.slice(hasKnownUnit ? 2 : 1).join(" "))
    };
  }

  return {
    amount: 0,
    unit: "",
    name: normalizeText(line)
  };
}

function normalizeIngredient(ingredient) {
  if (typeof ingredient === "string") {
    return parseIngredientLine(ingredient);
  }

  return {
    amount: normalizeAmount(ingredient?.amount),
    unit: normalizeText(ingredient?.unit),
    name: normalizeText(ingredient?.name)
  };
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item).replace(/^\d+[\.)]\s*/, ""))
      .filter(Boolean);
  }

  return String(value || "")
    .split("\n")
    .map((item) => normalizeText(item).replace(/^\d+[\.)]\s*/, ""))
    .filter(Boolean);
}

function normalizeRecipeForPatch(recipe = {}) {
  return {
    ...structuredClone(recipe),
    title: normalizeText(recipe.title),
    yield: normalizeText(recipe.yield),
    category: normalizeText(recipe.category),
    ingredients: Array.isArray(recipe.ingredients)
      ? recipe.ingredients.map(normalizeIngredient).filter((ingredient) => ingredient.name || ingredient.unit || ingredient.amount !== 0)
      : normalizeStringList(recipe.ingredients).map(parseIngredientLine),
    steps: normalizeStringList(recipe.steps),
    notes: normalizeStringList(recipe.notes)
  };
}

function normalizeForComparison(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeForComparison);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((normalized, key) => {
        normalized[key] = normalizeForComparison(value[key]);
        return normalized;
      }, {});
  }

  return value;
}

function valuesEqual(left, right) {
  return JSON.stringify(normalizeForComparison(left)) === JSON.stringify(normalizeForComparison(right));
}

export function getRecipeChanges(originalRecipe, editedRecipe) {
  const normalizedOriginalRecipe = normalizeRecipeForPatch(originalRecipe);
  const normalizedEditedRecipe = normalizeRecipeForPatch(editedRecipe);
  const changedFields = {};

  for (const field of PATCH_FIELDS) {
    if (!valuesEqual(normalizedOriginalRecipe?.[field], normalizedEditedRecipe?.[field])) {
      changedFields[field] = {
        original: cloneValue(normalizedOriginalRecipe?.[field]),
        updated: cloneValue(normalizedEditedRecipe?.[field])
      };
    }
  }

  return changedFields;
}

export function generateRecipePatch(originalRecipe, draftRecipe, validationResult, options = {}) {
  const normalizedOriginalRecipe = normalizeRecipeForPatch(originalRecipe);
  const normalizedDraftRecipe = normalizeRecipeForPatch(draftRecipe);
  const changedFields = getRecipeChanges(normalizedOriginalRecipe, normalizedDraftRecipe);
  console.log("Original recipe:", normalizedOriginalRecipe);
  console.log("Draft recipe:", normalizedDraftRecipe);
  console.log("Detected changed fields:", changedFields);

  if (!validationResult?.ok) {
    return {
      ok: false,
      blocked: true,
      operation: "updateRecipe",
      source: options.source || "data/recipes/sample-recipes.json",
      index: options.index,
      originalTitle: normalizedOriginalRecipe?.title || "",
      updatedTitle: normalizedDraftRecipe?.title || "",
      reason: "Edited recipe must pass validation before a patch can be generated.",
      errors: validationResult?.errors || [],
      changedFields,
      hasChanges: Object.keys(changedFields).length > 0,
      timestamp: new Date().toISOString()
    };
  }

  return {
    ok: true,
    operation: "updateRecipe",
    source: options.source || "data/recipes/sample-recipes.json",
    index: options.index,
    originalTitle: normalizedOriginalRecipe?.title || "",
    updatedTitle: normalizedDraftRecipe?.title || "",
    timestamp: new Date().toISOString(),
    changedFields,
    hasChanges: Object.keys(changedFields).length > 0
  };
}

export function generateCreateRecipePatch(recipe, validationResult, options = {}) {
  if (!validationResult?.ok) {
    return {
      ok: false,
      blocked: true,
      operation: "createRecipe",
      reason: "New recipe must pass validation before a create patch can be generated.",
      errors: validationResult?.errors || [],
      timestamp: new Date().toISOString()
    };
  }

  const changedFields = {};

  for (const field of PATCH_FIELDS) {
    changedFields[field] = {
      original: null,
      updated: cloneValue(recipe[field])
    };
  }

  return {
    ok: true,
    operation: "createRecipe",
    patchType: "create-recipe",
    source: options.source || "data/recipes/sample-recipes.json",
    proposedIndex: options.proposedIndex,
    title: recipe.title,
    timestamp: new Date().toISOString(),
    changedFields,
    hasChanges: true,
    recipe: structuredClone(recipe)
  };
}
