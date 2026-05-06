const STORAGE_PREFIX = "chefDashboard.recipeDraft.";

function getDraftKey(recipeId) {
  return `${STORAGE_PREFIX}${recipeId}`;
}

export function getRecipeDraftId(recipe, index) {
  return `${index}:${recipe?.title || "untitled"}`;
}

export function saveRecipeDraft(recipeId, draft) {
  const record = {
    recipeId,
    draft: structuredClone(draft),
    savedAt: new Date().toISOString()
  };

  localStorage.setItem(getDraftKey(recipeId), JSON.stringify(record));

  return record;
}

export function loadRecipeDraft(recipeId) {
  const rawDraft = localStorage.getItem(getDraftKey(recipeId));

  if (!rawDraft) {
    return null;
  }

  try {
    return JSON.parse(rawDraft);
  } catch {
    localStorage.removeItem(getDraftKey(recipeId));
    return null;
  }
}

export function clearRecipeDraft(recipeId) {
  localStorage.removeItem(getDraftKey(recipeId));
}

export function hasRecipeDraft(recipeId) {
  return loadRecipeDraft(recipeId) !== null;
}
