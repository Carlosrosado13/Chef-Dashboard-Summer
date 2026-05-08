export const PATCH_FIELDS = ["title", "yield", "category", "ingredients", "steps", "notes", "tags", "metadata"];

function cloneValue(value) {
  return value === undefined ? undefined : structuredClone(value);
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
  const changedFields = {};

  for (const field of PATCH_FIELDS) {
    if (!valuesEqual(originalRecipe?.[field], editedRecipe?.[field])) {
      changedFields[field] = {
        original: cloneValue(originalRecipe?.[field]),
        updated: cloneValue(editedRecipe?.[field])
      };
    }
  }

  return changedFields;
}

export function generateRecipePatch(originalRecipe, editedRecipe, validationResult, options = {}) {
  const changedFields = getRecipeChanges(originalRecipe, editedRecipe);
  console.log("Detected changed fields:", changedFields);

  if (!validationResult?.ok) {
    return {
      ok: false,
      blocked: true,
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
    originalTitle: originalRecipe?.title || "",
    updatedTitle: editedRecipe?.title || "",
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
