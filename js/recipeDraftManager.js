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

export function createDebouncedRecipeDraftSaver(delay = 500) {
  let timerId = null;

  function cancel() {
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
  }

  return {
    schedule(recipeId, draft, onSaved) {
      cancel();
      timerId = window.setTimeout(() => {
        timerId = null;
        const record = saveRecipeDraft(recipeId, draft);
        onSaved?.(record);
      }, delay);
    },
    cancel
  };
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
