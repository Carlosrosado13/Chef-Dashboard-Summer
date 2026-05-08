function cloneValue(value) {
  return structuredClone(value);
}

function createRecipeId(recipe) {
  return String(recipe?.title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createFailure(message, details = []) {
  return {
    ok: false,
    error: message,
    details
  };
}

export function applyRecipePatch(recipes, patch, validateRecipe) {
  if (!patch?.ok || patch.blocked) {
    return createFailure("Patch is blocked or invalid.", patch?.errors || []);
  }

  if (!patch.hasChanges) {
    return createFailure("Patch does not contain any changes.");
  }

  if (!Number.isInteger(patch.index) || patch.index < 0 || patch.index >= recipes.length) {
    return createFailure("Patch index is outside the recipe dataset.");
  }

  const updatedRecipes = cloneValue(recipes);
  const originalRecipe = cloneValue(updatedRecipes[patch.index]);
  const updatedRecipe = {
    ...originalRecipe
  };

  for (const [field, change] of Object.entries(patch.changedFields || {})) {
    updatedRecipe[field] = cloneValue(change.updated);
  }

  const validation = validateRecipe(updatedRecipe);

  if (!validation.ok) {
    return createFailure("Updated recipe failed validation.", validation.errors);
  }

  updatedRecipes[patch.index] = updatedRecipe;
  const originalRecipeId = createRecipeId(originalRecipe);
  const updatedRecipeId = createRecipeId(updatedRecipe);

  return {
    ok: true,
    recipes: updatedRecipes,
    appliedRecipe: updatedRecipe,
    linkedMenuUpdate: {
      hasRecipeIdChange: originalRecipeId !== updatedRecipeId,
      originalRecipeId,
      updatedRecipeId
    },
    historyEntry: {
      ...cloneValue(patch),
      appliedAt: new Date().toISOString(),
      rollbackRecipe: originalRecipe
    }
  };
}

export function rollbackRecipePatch(recipes, historyEntry, validateRecipe) {
  if (!historyEntry || !Number.isInteger(historyEntry.index)) {
    return createFailure("No applied patch is available to roll back.");
  }

  if (historyEntry.index < 0 || historyEntry.index >= recipes.length) {
    return createFailure("Rollback index is outside the recipe dataset.");
  }

  const rollbackRecipe = cloneValue(historyEntry.rollbackRecipe);
  const validation = validateRecipe(rollbackRecipe);

  if (!validation.ok) {
    return createFailure("Rollback recipe failed validation.", validation.errors);
  }

  const updatedRecipes = cloneValue(recipes);
  updatedRecipes[historyEntry.index] = rollbackRecipe;

  return {
    ok: true,
    recipes: updatedRecipes,
    rolledBackRecipe: rollbackRecipe,
    rolledBackAt: new Date().toISOString()
  };
}
