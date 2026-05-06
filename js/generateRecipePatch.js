const PATCH_FIELDS = ["title", "yield", "category", "ingredients", "steps"];

function cloneValue(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function valuesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
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
  if (!validationResult?.ok) {
    return {
      ok: false,
      blocked: true,
      reason: "Edited recipe must pass validation before a patch can be generated.",
      errors: validationResult?.errors || [],
      timestamp: new Date().toISOString()
    };
  }

  const changedFields = getRecipeChanges(originalRecipe, editedRecipe);

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
