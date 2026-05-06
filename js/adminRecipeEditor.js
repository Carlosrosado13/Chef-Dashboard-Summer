import { loadRecipes } from "./loadRecipes.js";
import { applyRecipePatch, rollbackRecipePatch } from "./applyRecipePatch.js";
import { generateRecipePatch } from "./generateRecipePatch.js";
import { renderPatchPreview } from "./renderPatchPreview.js";
import {
  clearRecipeDraft,
  getRecipeDraftId,
  loadRecipeDraft,
  saveRecipeDraft
} from "./recipeDraftManager.js";
import {
  renderRecipeEditor,
  renderRecipeList,
  renderValidation
} from "./renderRecipeEditor.js";

const RECIPE_SCHEMA_URL = "schemas/recipe.schema.json";

const state = {
  recipes: [],
  schema: null,
  selectedIndex: null,
  draft: null,
  validation: null,
  patchHistory: [],
  notice: null,
  draftRecord: null,
  search: "",
  isDirty: false
};

let statusElement;
let errorElement;
let searchInput;
let listRoot;
let editorRoot;
let validationRoot;
let patchPreviewRoot;
let draftStatusRoot;

async function loadJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to load ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function setStatus(message, tone = "neutral") {
  statusElement.textContent = message;
  statusElement.dataset.tone = tone;
}

function showError(message) {
  errorElement.textContent = message;
  errorElement.hidden = false;
  setStatus("Admin unavailable", "error");
}

function clearError() {
  errorElement.textContent = "";
  errorElement.hidden = true;
}

function getSelectedRecipe() {
  return state.selectedIndex === null ? null : state.recipes[state.selectedIndex];
}

function getFilteredRecipes() {
  const query = state.search.toLowerCase().trim();

  return state.recipes
    .map((recipe, index) => ({ ...recipe, index }))
    .filter((recipe) => {
      if (!query) {
        return true;
      }

      return `${recipe.title} ${recipe.category}`.toLowerCase().includes(query);
    });
}

function selectRecipe(index) {
  if (state.isDirty && !window.confirm("Discard unsaved changes and switch recipes?")) {
    return;
  }

  state.selectedIndex = index;
  const recipe = state.recipes[index];
  const draftRecord = loadRecipeDraft(getRecipeDraftId(recipe, index));
  state.draftRecord = null;
  state.draft = structuredClone(recipe);

  if (draftRecord && window.confirm(`Restore locally saved draft from ${formatTimestamp(draftRecord.savedAt)}?`)) {
    state.draft = structuredClone(draftRecord.draft);
    state.draftRecord = draftRecord;
    state.isDirty = true;
  }

  state.validation = null;
  state.isDirty = state.draftRecord !== null;
  renderAdmin();
}

function resetDraft() {
  const recipe = getSelectedRecipe();
  state.draft = recipe ? structuredClone(recipe) : null;
  state.validation = null;
  state.isDirty = false;
  clearCurrentDraft();
  renderAdmin();
}

function cancelEditing() {
  if (state.isDirty && !window.confirm("Discard unsaved changes?")) {
    return;
  }

  state.selectedIndex = null;
  state.draft = null;
  state.validation = null;
  state.draftRecord = null;
  state.isDirty = false;
  renderAdmin();
}

function updateDraft(recipe) {
  state.draft = recipe;
  state.validation = validateRecipeAgainstSchema(recipe, state.schema);
  state.isDirty = true;
  persistCurrentDraft();
  updateValidationAndPatch();
}

function validateDraft(recipe) {
  state.draft = recipe;
  state.validation = validateRecipeAgainstSchema(recipe, state.schema);
  state.isDirty = true;
  persistCurrentDraft();
  updateValidationAndPatch();
}

function persistCurrentDraft() {
  if (state.selectedIndex === null || !state.draft) {
    return;
  }

  const recipeId = getRecipeDraftId(state.recipes[state.selectedIndex], state.selectedIndex);
  state.draftRecord = saveRecipeDraft(recipeId, state.draft);
  renderDraftStatus();
}

function updateValidationAndPatch() {
  renderValidation(validationRoot, state.validation);
  renderPatchPreview(patchPreviewRoot, createPatchPreview(), {
    onApply: applyCurrentPatch,
    onRollback: rollbackLastPatch,
    canRollback: state.patchHistory.length > 0,
    notice: state.notice
  });
}

function createPatchPreview() {
  if (state.selectedIndex === null || !state.draft) {
    return {};
  }

  const validation = state.validation || validateRecipeAgainstSchema(state.draft, state.schema);

  return generateRecipePatch(state.recipes[state.selectedIndex], state.draft, validation, {
    index: state.selectedIndex,
    source: "data/recipes/sample-recipes.json"
  });
}

function validateRecipeAgainstSchema(recipe, schema) {
  const errors = [];
  const allowedRootProperties = Object.keys(schema.properties || {});

  for (const property of schema.required || []) {
    if (recipe[property] === undefined || recipe[property] === "") {
      errors.push({ message: `Missing required property: ${property}` });
    }
  }

  for (const property of Object.keys(recipe)) {
    if (!allowedRootProperties.includes(property)) {
      errors.push({ message: `Unknown property is not allowed: ${property}` });
    }
  }

  for (const property of ["title", "yield", "category"]) {
    if (recipe[property] !== undefined && typeof recipe[property] !== "string") {
      errors.push({ message: `${property} must be string` });
    }
  }

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length < 1) {
    errors.push({ message: "ingredients must include at least 1 item" });
  } else {
    recipe.ingredients.forEach((ingredient, index) => {
      validateIngredient(ingredient, index, errors);
    });
  }

  if (!Array.isArray(recipe.steps) || recipe.steps.length < 1) {
    errors.push({ message: "steps must include at least 1 item" });
  } else {
    recipe.steps.forEach((step, index) => {
      if (typeof step !== "string") {
        errors.push({ message: `steps[${index}] must be string` });
      }
    });
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

function validateCurrentSchema(recipe) {
  return validateRecipeAgainstSchema(recipe, state.schema);
}

function applyCurrentPatch() {
  const patch = createPatchPreview();
  const result = applyRecipePatch(state.recipes, patch, validateCurrentSchema);

  if (!result.ok) {
    state.notice = {
      tone: "error",
      message: result.error
    };
    state.validation = result.details?.length ? { ok: false, errors: result.details } : state.validation;
    updateValidationAndPatch();
    return;
  }

  state.recipes = result.recipes;
  state.patchHistory.push(result.historyEntry);
  state.selectedIndex = result.historyEntry.index;
  state.draft = structuredClone(result.appliedRecipe);
  state.validation = validateCurrentSchema(state.draft);
  state.isDirty = false;
  clearCurrentDraft();
  state.notice = {
    tone: "success",
    message: `Patch applied in memory at ${result.historyEntry.appliedAt}.`
  };
  renderAdmin();
}

function rollbackLastPatch() {
  const lastPatch = state.patchHistory.at(-1);
  const result = rollbackRecipePatch(state.recipes, lastPatch, validateCurrentSchema);

  if (!result.ok) {
    state.notice = {
      tone: "error",
      message: result.error
    };
    updateValidationAndPatch();
    return;
  }

  state.recipes = result.recipes;
  state.patchHistory.pop();
  state.selectedIndex = lastPatch.index;
  state.draft = structuredClone(result.rolledBackRecipe);
  state.validation = validateCurrentSchema(state.draft);
  state.isDirty = false;
  clearCurrentDraft();
  state.notice = {
    tone: "success",
    message: `Rolled back in memory at ${result.rolledBackAt}.`
  };
  renderAdmin();
}

function clearCurrentDraft() {
  if (state.selectedIndex === null) {
    return;
  }

  const recipeId = getRecipeDraftId(state.recipes[state.selectedIndex], state.selectedIndex);
  clearRecipeDraft(recipeId);
  state.draftRecord = null;
  renderDraftStatus();
}

function clearDraftManually() {
  if (!state.draftRecord || !window.confirm("Clear the locally saved draft for this recipe?")) {
    return;
  }

  clearCurrentDraft();
  state.notice = {
    tone: "success",
    message: "Local draft cleared."
  };
  renderAdmin();
}

function renderDraftStatus() {
  if (!draftStatusRoot) {
    return;
  }

  draftStatusRoot.replaceChildren();

  const message = document.createElement("span");
  message.textContent = state.draftRecord
    ? `Draft saved locally at ${formatTimestamp(state.draftRecord.savedAt)}.`
    : "No local draft saved.";
  draftStatusRoot.append(message);

  if (state.draftRecord) {
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "draft-status__button";
    clearButton.textContent = "Clear draft";
    clearButton.addEventListener("click", clearDraftManually);
    draftStatusRoot.append(clearButton);
  }
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function validateIngredient(ingredient, index, errors) {
  const allowedProperties = ["name", "amount", "unit"];

  for (const property of ["name", "amount", "unit"]) {
    if (ingredient[property] === undefined || ingredient[property] === "") {
      errors.push({ message: `ingredients[${index}] missing required property: ${property}` });
    }
  }

  for (const property of Object.keys(ingredient)) {
    if (!allowedProperties.includes(property)) {
      errors.push({ message: `ingredients[${index}] unknown property: ${property}` });
    }
  }

  if (typeof ingredient.name !== "string") {
    errors.push({ message: `ingredients[${index}].name must be string` });
  }

  if (!Number.isFinite(ingredient.amount)) {
    errors.push({ message: `ingredients[${index}].amount must be number` });
  }

  if (typeof ingredient.unit !== "string") {
    errors.push({ message: `ingredients[${index}].unit must be string` });
  }
}

function renderAdmin() {
  renderRecipeList(listRoot, getFilteredRecipes(), state.selectedIndex, selectRecipe);
  renderRecipeEditor(editorRoot, state.draft, {
    onChange: updateDraft,
    onValidate: validateDraft,
    onReset: resetDraft,
    onCancel: cancelEditing
  });
  renderDraftStatus();
  updateValidationAndPatch();
  setStatus(state.isDirty ? "Unsaved changes" : "Ready", state.isDirty ? "error" : "success");
}

async function initAdmin() {
  statusElement = document.querySelector("#admin-status");
  errorElement = document.querySelector("#admin-error");
  searchInput = document.querySelector("#recipe-search");
  listRoot = document.querySelector("#recipe-list");
  editorRoot = document.querySelector("#recipe-editor-root");
  validationRoot = document.querySelector("#validation-root");
  patchPreviewRoot = document.querySelector("#patch-preview-root");
  draftStatusRoot = document.querySelector("#draft-status");

  try {
    clearError();
    const [recipeResult, schema] = await Promise.all([
      loadRecipes(),
      loadJson(RECIPE_SCHEMA_URL)
    ]);

    if (!recipeResult.ok) {
      throw new Error(recipeResult.error);
    }

    state.recipes = recipeResult.recipes;
    state.schema = schema;
    searchInput.addEventListener("input", () => {
      state.search = searchInput.value;
      renderAdmin();
    });
    window.addEventListener("beforeunload", (event) => {
      if (!state.isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    });
    renderAdmin();
  } catch (error) {
    showError(error.message || "Unable to initialize recipe admin.");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdmin, { once: true });
} else {
  initAdmin();
}
