import { adminFetch, initializeAdminAuth } from "./adminAuth.js";
import { initMenuAssignment, reloadMenuAssignment } from "./adminMenuAssignment.js";
import { loadRecipes } from "./loadRecipes.js";
import { applyRecipePatch, rollbackRecipePatch } from "./applyRecipePatch.js";
import { generateCreateRecipePatch, generateRecipePatch } from "./generateRecipePatch.js";
import { loadMenuData } from "./loadMenuData.js";
import { renderPatchPreview } from "./renderPatchPreview.js";
import {
  deleteRecipePhoto,
  isManagedRecipePhoto,
  RECIPE_PHOTO_ACCEPT,
  uploadRecipePhoto
} from "./adminRecipePhoto.js";
import {
  clearRecipeDraft,
  createDebouncedRecipeDraftSaver,
  getRecipeDraftId,
  loadRecipeDraft
} from "./recipeDraftManager.js";
import {
  renderRecipeEditor,
  renderRecipeList,
  renderValidation
} from "./renderRecipeEditor.js";

const RECIPE_SCHEMA_URL = "schemas/recipe.schema.json";

const state = {
  recipes: [],
  menuData: null,
  schema: null,
  mode: "edit",
  selectedIndex: null,
  draft: null,
  validation: null,
  patchHistory: [],
  notice: null,
  draftRecord: null,
  search: "",
  entryMode: null,
  importUrl: "",
  importStatus: null,
  isDirty: false,
  localSaveStatus: "idle",
  productionAssignment: {
    mealType: "dinner",
    week: "Week 1",
    day: "Monday",
    category: "Elevated",
    slotMode: "existing"
  }
};

const draftSaver = createDebouncedRecipeDraftSaver(500);

function createEmptyRecipeDraft() {
  return {
    title: "",
    yield: "",
    category: "Elevated",
    photoUrl: "",
    ingredients: [],
    steps: []
  };
}

let statusElement;
let errorElement;
let createRecipeButton;
let entryRoot;
let searchInput;
let listRoot;
let editorRoot;
let validationRoot;
let patchPreviewRoot;
let draftStatusRoot;
let auditHistoryRoot;
let adminContentRoot;
let adminInitialized = false;

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

function normalizeProductionAssignment(assignment = {}) {
  return {
    mealType: "dinner",
    week: assignment.week || state.productionAssignment.week || "Week 1",
    day: assignment.day || state.productionAssignment.day || "Monday",
    category: assignment.category || state.productionAssignment.category || "Elevated",
    slotMode: assignment.slotMode || state.productionAssignment.slotMode || "existing"
  };
}

function cleanMenuRecipeName(value) {
  return String(value || "")
    .replace(/^Hot Appetizer:\s*/i, "")
    .trim();
}

function getAssignedMenuRecipeName(assignment = state.productionAssignment) {
  return cleanMenuRecipeName(
    state.menuData?.[assignment.mealType || "dinner"]?.weeks?.[assignment.week]?.days?.[assignment.day]?.[assignment.category]
  );
}

function createRecipeId(recipeOrTitle) {
  const title = typeof recipeOrTitle === "string" ? recipeOrTitle : recipeOrTitle?.title;

  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isPlaceholderRecipe(recipe) {
  const title = String(recipe?.title || "").trim().toLowerCase();
  const tags = Array.isArray(recipe?.tags) ? recipe.tags.map((tag) => String(tag).toLowerCase()) : [];

  return (
    title === "placeholder" ||
    title === "untitled" ||
    title === "new recipe" ||
    title.includes("placeholder") ||
    tags.includes("placeholder") ||
    recipe?.metadata?.placeholder === true ||
    recipe?.placeholder === true
  );
}

function canDeleteSelectedRecipe() {
  const recipe = getSelectedRecipe();

  return (
    state.mode !== "create" &&
    state.selectedIndex !== null &&
    Number.isInteger(state.selectedIndex) &&
    state.selectedIndex >= 0 &&
    state.selectedIndex < state.recipes.length &&
    recipe &&
    typeof recipe === "object" &&
    String(recipe.title || "").trim() &&
    !isPlaceholderRecipe(recipe)
  );
}

function hasExistingRecipeSelection() {
  return (
    state.mode !== "create" &&
    state.selectedIndex !== null &&
    Number.isInteger(state.selectedIndex) &&
    state.selectedIndex >= 0 &&
    state.selectedIndex < state.recipes.length &&
    Boolean(getSelectedRecipe())
  );
}

function findMenuLinksForRecipe(recipe) {
  const title = String(recipe?.title || "").trim();
  const references = new Set([title, createRecipeId(title)].filter(Boolean));
  const links = [];

  if (!state.menuData || references.size === 0) {
    return links;
  }

  for (const [mealType, meal] of Object.entries(state.menuData || {})) {
    for (const [week, weekValue] of Object.entries(meal?.weeks || {})) {
      for (const [day, dayValue] of Object.entries(weekValue?.days || {})) {
        for (const [category, value] of Object.entries(dayValue || {})) {
          if (references.has(value)) {
            links.push({ mealType, week, day, category });
          }
        }
      }
    }
  }

  return links;
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

  clearCurrentDraft();
  state.selectedIndex = index;
  state.mode = "edit";
  const recipe = state.recipes[index];
  const draftRecord = loadRecipeDraft(getRecipeDraftId(recipe, index));
  state.draftRecord = null;
  state.draft = structuredClone(recipe);
  state.localSaveStatus = "idle";

  if (draftRecord && window.confirm(`Restore locally saved draft from ${formatTimestamp(draftRecord.savedAt)}?`)) {
    state.draft = structuredClone(draftRecord.draft);
    state.draftRecord = draftRecord;
    state.isDirty = true;
  }

  state.validation = null;
  state.isDirty = state.draftRecord !== null;
  renderAdmin();
}

function startCreateRecipe() {
  if (state.isDirty && !window.confirm("Discard unsaved changes and create a new recipe?")) {
    return;
  }

  clearCurrentDraft();
  state.productionAssignment = normalizeProductionAssignment({ slotMode: "new" });
  state.mode = "create";
  state.entryMode = "scratch";
  state.selectedIndex = null;
  state.draft = createEmptyRecipeDraft();
  state.draft.category = state.productionAssignment.category;
  state.validation = validateRecipeForKitchen(state.draft);
  state.draftRecord = null;
  state.notice = null;
  state.isDirty = false;
  state.localSaveStatus = "idle";
  renderAdmin();
}

function startImportRecipe() {
  if (state.isDirty && !window.confirm("Discard unsaved changes and import a recipe?")) {
    return;
  }

  clearCurrentDraft();
  state.productionAssignment = normalizeProductionAssignment({ slotMode: "existing" });
  state.entryMode = "import";
  state.selectedIndex = null;
  state.mode = "edit";
  state.draft = null;
  state.validation = null;
  state.draftRecord = null;
  state.notice = null;
  state.isDirty = false;
  state.localSaveStatus = "idle";
  renderAdmin();
}

function resetDraft() {
  const recipe = getSelectedRecipe();
  state.draft = recipe ? structuredClone(recipe) : null;
  state.validation = null;
  state.isDirty = false;
  state.localSaveStatus = "idle";
  clearCurrentDraft();
  renderAdmin();
}

function cancelEditing() {
  if (state.isDirty && !window.confirm("Discard unsaved changes?")) {
    return;
  }

  clearCurrentDraft();
  state.selectedIndex = null;
  state.mode = "edit";
  state.draft = null;
  state.validation = null;
  state.draftRecord = null;
  state.isDirty = false;
  state.localSaveStatus = "idle";
  renderAdmin();
}

function openDeleteRecipeDialog() {
  if (!canDeleteSelectedRecipe()) {
    state.notice = {
      tone: "error",
      message: "Recipe deletion failed."
    };
    updateValidationAndPatch();
    return;
  }

  const recipe = getSelectedRecipe();
  const links = findMenuLinksForRecipe(recipe);
  const overlay = createElement("div", "recipe-import-modal");
  const dialog = createElement("section", "recipe-import-modal__dialog");
  const header = createElement("header", "recipe-import-modal__header");
  const body = createElement("div", "recipe-import-modal__body");
  const content = createElement("div", "");
  const actions = createElement("div", "admin-actions recipe-import-modal__actions");
  const cancelButton = createElement("button", "filter-button", "Cancel");
  const deleteButton = createElement("button", "filter-button", "Delete Recipe");

  cancelButton.type = "button";
  deleteButton.type = "button";
  cancelButton.addEventListener("click", () => overlay.remove());
  deleteButton.addEventListener("click", async () => {
    deleteButton.disabled = true;
    cancelButton.disabled = true;
    await deleteSelectedRecipe();
    overlay.remove();
  });

  header.append(createElement("h2", "", "Delete Recipe"));
  content.append(createElement("p", "admin-muted", "Are you sure you want to permanently delete this recipe?"));

  if (links.length > 0) {
    content.append(createElement("p", "admin-auth-error", "This recipe is currently assigned to one or more menu slots."));
  }

  body.append(content);
  actions.append(cancelButton, deleteButton);
  dialog.append(header, body, actions);
  overlay.append(dialog);
  document.body.append(overlay);
}

function updateCreateDraft(recipe, assignment) {
  updateProductionAssignment(assignment);
  state.draft = recipe;
  state.validation = validateRecipeForKitchen(recipe);
  state.isDirty = true;
  state.localSaveStatus = "unsaved";
  scheduleCurrentDraftSave();
  updateValidationAndPatch();
}

function updateProductionAssignment(assignment) {
  state.productionAssignment = normalizeProductionAssignment(assignment);
}

function validateCreateDraft(recipe, assignment) {
  updateProductionAssignment(assignment);
  state.draft = recipe;
  state.validation = validateRecipeForKitchen(recipe);
  state.isDirty = true;
  state.localSaveStatus = "unsaved";
  scheduleCurrentDraftSave();
  updateValidationAndPatch();
}

function resetCreateDraft() {
  clearCurrentDraft();
  state.draft = createEmptyRecipeDraft();
  state.productionAssignment = normalizeProductionAssignment({ slotMode: "new" });
  state.draft.category = state.productionAssignment.category;
  state.validation = validateRecipeForKitchen(state.draft);
  state.isDirty = false;
  state.localSaveStatus = "idle";
  renderAdmin();
}

function cancelCreateRecipe() {
  if (state.isDirty && !window.confirm("Discard this unsaved new recipe?")) {
    return;
  }

  clearCurrentDraft();
  state.mode = "edit";
  state.entryMode = null;
  state.draft = null;
  state.validation = null;
  state.isDirty = false;
  state.localSaveStatus = "idle";
  renderAdmin();
}

function useImportedRecipe(recipe) {
  state.mode = "create";
  state.entryMode = "import";
  state.selectedIndex = null;
  state.draft = structuredClone(recipe);
  state.draft.category = state.draft.category || state.productionAssignment.category;
  if (state.productionAssignment.slotMode !== "new") {
    state.draft.title = getAssignedMenuRecipeName() || state.draft.title;
    state.draft.category = state.productionAssignment.category;
  }
  state.validation = validateRecipeForKitchen(state.draft);
  state.draftRecord = null;
  state.notice = {
    tone: "success",
    message: "Imported recipe loaded into the editor. Review and correct it before saving."
  };
  state.isDirty = true;
  state.localSaveStatus = "unsaved";
  renderAdmin();
}

function updateDraft(recipe, assignment) {
  updateProductionAssignment(assignment);
  state.draft = recipe;
  state.validation = validateRecipeForKitchen(recipe);
  state.isDirty = true;
  state.localSaveStatus = "unsaved";
  scheduleCurrentDraftSave();
  updateValidationAndPatch();
}

function validateDraft(recipe, assignment) {
  updateProductionAssignment(assignment);
  state.draft = recipe;
  state.validation = validateRecipeForKitchen(recipe);
  state.isDirty = true;
  state.localSaveStatus = "unsaved";
  scheduleCurrentDraftSave();
  updateValidationAndPatch();
}

function saveDraft(recipe, assignment) {
  updateDraft(recipe, assignment);
  window.setTimeout(() => {
    applyCurrentPatch();
  });
}

function saveCreateDraft(recipe, assignment) {
  updateCreateDraft(recipe, assignment);
  window.setTimeout(() => {
    applyCurrentPatch();
  });
}

function getCurrentDraftId() {
  if (state.selectedIndex !== null) {
    return getRecipeDraftId(state.recipes[state.selectedIndex], state.selectedIndex);
  }

  if (state.mode === "create") {
    return `create:${state.entryMode || "scratch"}`;
  }

  return null;
}

function scheduleCurrentDraftSave() {
  if (!state.draft) {
    return;
  }

  const recipeId = getCurrentDraftId();
  if (!recipeId) {
    return;
  }

  state.localSaveStatus = "unsaved";
  renderDraftStatus();
  draftSaver.schedule(recipeId, state.draft, (record) => {
    state.draftRecord = record;
    state.localSaveStatus = "saved";
    renderDraftStatus();
    setStatus(createWorkflowStatusMessage(), state.isDirty ? "error" : "success");
  });
}

function updateValidationAndPatch() {
  renderValidation(validationRoot, state.validation);
  renderPatchPreview(patchPreviewRoot, createPatchPreview(), {
    onApply: applyCurrentPatch,
    onRollback: rollbackLastPatch,
    canRollback: state.patchHistory.length > 0,
    notice: state.notice
  });
  renderAuditHistory();
}

function createPatchPreview() {
  if (state.mode === "create") {
    if (!state.draft) {
      return {};
    }

    const validation = state.validation || validateRecipeForKitchen(state.draft);

    return generateCreateRecipePatch(state.draft, validation, {
      proposedIndex: state.recipes.length,
      source: "data/recipes/sample-recipes.json"
    });
  }

  if (state.selectedIndex === null || !state.draft) {
    return {};
  }

  const validation = state.validation || validateRecipeForKitchen(state.draft);

  return generateRecipePatch(state.recipes[state.selectedIndex], state.draft, validation, {
    index: state.selectedIndex,
    source: "data/recipes/sample-recipes.json"
  });
}

function validateRecipeForKitchen(recipe) {
  const missing = [];

  if (!String(recipe?.title || "").trim()) {
    missing.push("Recipe Name");
  }

  if (!String(recipe?.category || "").trim()) {
    missing.push("Recipe Category");
  }

  if (!Array.isArray(recipe?.ingredients) || recipe.ingredients.length === 0) {
    missing.push("Ingredients");
  }

  if (!Array.isArray(recipe?.steps) || recipe.steps.length === 0) {
    missing.push("Steps");
  }

  return missing.length === 0
    ? { ok: true, status: "Ready to Save" }
    : {
        ok: false,
        status: "Missing Required Fields",
        missing,
        errors: missing.map((field) => ({ message: field }))
      };
}

function validateCurrentSchema(recipe) {
  return validateRecipeForKitchen(recipe);
}

function createDeleteRecipePatch(recipe, index) {
  const title = String(recipe?.title || "").trim();

  return {
    operation: "deleteRecipe",
    source: "data/recipes/sample-recipes.json",
    recipeTitle: title,
    cleanupAssignments: true,
    timestamp: new Date().toISOString()
  };
}

function validateDeleteCommitPayload(payload) {
  const errors = [];
  const patch = payload?.patch || (payload?.operation ? payload : null);

  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    errors.push("Delete payload must include a patch object.");
  }

  if (patch?.operation !== "deleteRecipe") {
    errors.push("Delete payload operation must be deleteRecipe.");
  }

  const hasIndex = Number.isInteger(patch?.index) && patch.index >= 0 && patch.index < state.recipes.length;
  const hasTitle = typeof patch?.recipeTitle === "string" && patch.recipeTitle.trim() !== "";
  const hasOriginalTitle = typeof patch?.originalTitle === "string" && patch.originalTitle.trim() !== "";
  const hasRecipeId = typeof patch?.recipeId === "string" && patch.recipeId.trim() !== "";

  if (!hasIndex && !hasTitle && !hasOriginalTitle && !hasRecipeId) {
    errors.push("Delete payload must include index, recipeTitle, originalTitle, or recipeId.");
  }

  if (typeof patch?.source !== "string" || !patch.source.startsWith("data/recipes/")) {
    errors.push("Delete payload source must be a recipe JSON path string.");
  }

  if (!Array.isArray(state.recipes)) {
    errors.push("Recipe state must be an array before deletion.");
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

async function reloadPersistedData(selectedTitle = "", fallbackRecipes = null) {
  const [recipeResult, menuResult] = await Promise.all([
    loadRecipes(`data/recipes/sample-recipes.json?v=${Date.now()}`),
    loadMenuData(`data/processed/clean-menu.json?v=${Date.now()}`)
  ]);

  if (!recipeResult.ok) {
    throw new Error(recipeResult.error);
  }

  if (menuResult.ok) {
    state.menuData = menuResult.data;
  }

  const reloadedHasRecipe = !selectedTitle || recipeResult.recipes.some((recipe) => recipe.title === selectedTitle);
  state.recipes = reloadedHasRecipe || !Array.isArray(fallbackRecipes) ? recipeResult.recipes : fallbackRecipes;
  await reloadMenuAssignment({ recipes: state.recipes });

  const selectedIndex = selectedTitle
    ? state.recipes.findIndex((recipe) => recipe.title === selectedTitle)
    : -1;

  state.selectedIndex = selectedIndex >= 0 ? selectedIndex : null;
  state.mode = selectedIndex >= 0 ? "edit" : "edit";
  state.entryMode = null;
  state.draft = selectedIndex >= 0 ? structuredClone(state.recipes[selectedIndex]) : null;
  state.validation = state.draft ? validateRecipeForKitchen(state.draft) : null;
}

async function cleanupReplacedPhoto(originalRecipe, updatedRecipe) {
  const originalPhotoUrl = String(originalRecipe?.photoUrl || "").trim();
  const updatedPhotoUrl = String(updatedRecipe?.photoUrl || "").trim();

  if (!originalPhotoUrl || originalPhotoUrl === updatedPhotoUrl || !isManagedRecipePhoto(originalPhotoUrl)) {
    return null;
  }

  try {
    await deleteRecipePhoto(originalPhotoUrl);
    return null;
  } catch (error) {
    return error.message || "The previous managed photo could not be deleted.";
  }
}

async function handlePhotoUpload(file, recipeTitle) {
  return uploadRecipePhoto(file, recipeTitle);
}

function notifyDashboardRefresh() {
  const payload = {
    type: "recipe-data-updated",
    timestamp: Date.now()
  };

  try {
    localStorage.setItem("chefDashboard.recipeDataUpdated", JSON.stringify(payload));
  } catch {
    // Ignore storage failures; the persisted GitHub data is still the source of truth.
  }

  try {
    const channel = new BroadcastChannel("chef-dashboard-admin");
    channel.postMessage(payload);
    channel.close();
  } catch {
    // BroadcastChannel is a progressive enhancement for already-open dashboard tabs.
  }
}

async function deleteSelectedRecipe() {
  if (!canDeleteSelectedRecipe()) {
    state.notice = {
      tone: "error",
      message: "Recipe deletion failed."
    };
    updateValidationAndPatch();
    return;
  }

  const recipe = getSelectedRecipe();
  const patch = createDeleteRecipePatch(recipe, state.selectedIndex);
  const draftId = getCurrentDraftId();
  const commitResult = await commitRecipePatch(patch, null, null, {
    skipMenuAssignment: true,
    flatPatch: true,
    validatePayload: validateDeleteCommitPayload
  });

  if (!commitResult.ok) {
    state.notice = {
      tone: "error",
      message: `Recipe deletion failed. ${commitResult.error || ""}`.trim()
    };
    updateValidationAndPatch();
    return;
  }

  const photoCleanupWarning = await cleanupReplacedPhoto(recipe, null);
  draftSaver.cancel();
  if (draftId) {
    clearRecipeDraft(draftId);
  }

  await reloadPersistedData("", commitResult.recipes);
  state.notice = {
    tone: photoCleanupWarning ? "error" : "success",
    message: photoCleanupWarning
      ? `Recipe deleted successfully. ${photoCleanupWarning}`
      : "Recipe deleted successfully."
  };
  state.isDirty = false;
  state.localSaveStatus = "idle";
  state.draftRecord = null;
  notifyDashboardRefresh();
  renderAdmin();
}

async function applyCurrentPatch() {
  try {
    await applyCurrentPatchUnsafe();
  } catch (error) {
    state.notice = {
      tone: "error",
      message: error.message || "Recipe save failed."
    };
    updateValidationAndPatch();
  }
}

async function applyCurrentPatchUnsafe() {
  const patch = createPatchPreview();

  if (patch.operation === "createRecipe") {
    const draftId = getCurrentDraftId();
    const recipe = structuredClone(patch.recipe);
    const validation = validateCurrentSchema(recipe);

    if (!validation.ok) {
      state.notice = {
        tone: "error",
        message: "New recipe failed validation."
      };
      state.validation = validation;
      updateValidationAndPatch();
      return;
    }

    const commitResult = await commitRecipePatch(patch, null, recipe);

    if (!commitResult.ok) {
      state.notice = {
        tone: "error",
        message: commitResult.error
      };
      updateValidationAndPatch();
      return;
    }

    await reloadPersistedData(recipe.title, commitResult.recipes);
    state.patchHistory.push({
      ...structuredClone(patch),
      index: commitResult.recipeIndex,
      appliedAt: commitResult.timestamp,
      rollbackRecipe: null,
      github: commitResult.github,
      menu: commitResult.menu
    });
    state.notice = {
      tone: "success",
      message: `Recipe saved permanently and assigned to ${state.productionAssignment.week} ${state.productionAssignment.day} ${state.productionAssignment.category}.`
    };
    state.isDirty = false;
    state.localSaveStatus = "idle";
    if (draftId) {
      clearRecipeDraft(draftId);
    }
    state.draftRecord = null;
    renderAdmin();
    return;
  }

  const draftId = getCurrentDraftId();

  if (patch.ok && !patch.hasChanges && state.selectedIndex !== null && state.draft) {
    const commitResult = await commitRecipePatch(patch, state.recipes[state.selectedIndex], state.draft);

    if (!commitResult.ok) {
      state.notice = {
        tone: "error",
        message: commitResult.error
      };
      updateValidationAndPatch();
      return;
    }

    await reloadPersistedData(state.draft.title, commitResult.recipes);
    state.notice = {
      tone: "success",
      message: `Recipe assignment saved permanently for ${state.productionAssignment.week} ${state.productionAssignment.day} ${state.productionAssignment.category}.`
    };
    state.isDirty = false;
    state.localSaveStatus = "idle";
    draftSaver.cancel();
    if (draftId) {
      clearRecipeDraft(draftId);
    }
    state.draftRecord = null;
    renderAdmin();
    return;
  }

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

  const commitResult = await commitRecipePatch(patch, state.recipes[patch.index], result.appliedRecipe);

  if (!commitResult.ok) {
    state.notice = {
      tone: "error",
      message: commitResult.error
    };
    updateValidationAndPatch();
    return;
  }

  const photoCleanupWarning = await cleanupReplacedPhoto(
    state.recipes[patch.index],
    result.appliedRecipe
  );
  await reloadPersistedData(result.appliedRecipe.title, commitResult.recipes);
  state.patchHistory.push({
    ...result.historyEntry,
    github: commitResult.github,
    menu: commitResult.menu
  });
  state.isDirty = false;
  state.localSaveStatus = "idle";
  draftSaver.cancel();
  if (draftId) {
    clearRecipeDraft(draftId);
  }
  state.draftRecord = null;
  state.notice = {
    tone: photoCleanupWarning ? "error" : "success",
    message: [
      createApplyPatchMessage(result.historyEntry.appliedAt, commitResult),
      photoCleanupWarning
    ].filter(Boolean).join(" ")
  };
  renderAdmin();
}

async function commitRecipePatch(patch, originalRecipe, updatedRecipe, options = {}) {
  try {
    const payload = options.flatPatch
      ? {
          ...patch,
          source: patch.source || "data/recipes/sample-recipes.json"
        }
      : {
          patch,
          source: "data/recipes/sample-recipes.json",
          originalRecipe,
          updatedRecipe,
          menuSource: "data/processed/clean-menu.json"
        };

    if (!options.skipMenuAssignment) {
      payload.menuAssignment = state.productionAssignment;
    }

    if (options.commitMessage) {
      payload.commitMessage = options.commitMessage;
    }

    const validation = options.validatePayload?.(payload);
    if (validation && !validation.ok) {
      return {
        ok: false,
        error: validation.errors.join(" ")
      };
    }

    const response = await adminFetch("/api/recipe/commit-patch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      const details = Array.isArray(result.details)
        ? result.details.map((detail) => detail.message || JSON.stringify(detail)).filter(Boolean).join(" ")
        : "";
      throw new Error([result.error || "Recipe patch commit failed.", details].filter(Boolean).join(" "));
    }

    return result;
  } catch (error) {
    return {
      ok: false,
      error: error.message || "Recipe save could not be committed."
    };
  }
}

function createApplyPatchMessage(appliedAt, commitResult) {
  const menuMessage = commitResult.menu?.applied
    ? ` Assigned to ${state.productionAssignment.week} ${state.productionAssignment.day} ${state.productionAssignment.category}.`
    : "";

  return `Recipe saved permanently at ${appliedAt}.${menuMessage}`;
}

function rollbackLastPatch() {
  const lastPatch = state.patchHistory.at(-1);

  if (lastPatch?.operation === "createRecipe") {
    state.recipes = state.recipes.filter((_, index) => index !== lastPatch.index);
    state.patchHistory.pop();
    state.selectedIndex = null;
    state.mode = "edit";
    state.draft = null;
    state.validation = null;
    state.isDirty = false;
    state.notice = {
      tone: "success",
      message: "Created recipe removed from memory."
    };
    renderAdmin();
    return;
  }

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
    message: `Rolled back locally at ${result.rolledBackAt}.`
  };
  renderAdmin();
}

function clearCurrentDraft() {
  const recipeId = getCurrentDraftId();

  if (!recipeId) {
    return;
  }

  draftSaver.cancel();
  clearRecipeDraft(recipeId);
  state.draftRecord = null;
  state.localSaveStatus = "idle";
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
  message.textContent = createDraftStatusMessage();
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

function renderAuditHistory() {
  if (!auditHistoryRoot) {
    return;
  }

  auditHistoryRoot.replaceChildren();

  const patch = createPatchPreview();
  const currentPanel = createElement("section", "audit-panel");
  const currentTitle = createElement("h3", "", "Current Patch Object");
  const currentCopy = createElement("p", "admin-muted", "Debug preview for the active recipe workflow. No changes are applied from this panel.");
  const currentPatch = createElement("pre", "patch-preview", JSON.stringify(patch || {}, null, 2));
  currentPanel.append(currentTitle, currentCopy, currentPatch);

  const historyPanel = createElement("section", "audit-panel");
  const historyTitle = createElement("h3", "", "Applied Patch History");
  historyPanel.append(historyTitle);

  if (state.patchHistory.length === 0) {
    historyPanel.append(createElement("p", "admin-muted", "No patches have been applied in this admin session."));
  } else {
    const list = createElement("div", "audit-history-list");
    for (const patchEntry of state.patchHistory.slice().reverse()) {
      const item = createElement("details", "admin-debug-details");
      const label = patchEntry.updatedTitle || patchEntry.originalTitle || patchEntry.recipe?.title || patchEntry.operation || "Recipe patch";
      item.append(
        createElement("summary", "", label),
        createElement("pre", "patch-preview", JSON.stringify(patchEntry, null, 2))
      );
      list.append(item);
    }
    historyPanel.append(list);
  }

  auditHistoryRoot.append(currentPanel, historyPanel);
}

function createDraftStatusMessage() {
  const patch = createPatchPreview();
  const patchStatus = patch.ok ? "Ready to Save" : "Missing Required Fields";

  if (state.localSaveStatus === "unsaved") {
    return `Unsaved changes. ${patchStatus}.`;
  }

  if (state.localSaveStatus === "saved" && state.draftRecord) {
    return `Saved locally at ${formatTimestamp(state.draftRecord.savedAt)}. ${patchStatus}.`;
  }

  if (state.draftRecord) {
    return `Saved locally at ${formatTimestamp(state.draftRecord.savedAt)}. ${patchStatus}.`;
  }

  return `No local draft saved. ${patchStatus}.`;
}

function createWorkflowStatusMessage() {
  const patch = createPatchPreview();

  if (state.localSaveStatus === "saved") {
    return patch.ok ? "Saved locally | Ready to Save" : "Saved locally";
  }

  if (state.isDirty) {
    return patch.ok ? "Unsaved changes | Ready to Save" : "Unsaved changes";
  }

  return patch.ok ? "Ready to Save" : "Ready";
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  return element;
}

function renderEntryControls() {
  if (!entryRoot) {
    return;
  }

  const panel = createElement("section", "recipe-entry");
  const modeButtons = createElement("div", "recipe-entry__modes");
  const importButton = createElement("button", "recipe-entry__mode-button", "Import From Website");
  const scratchButton = createElement("button", "recipe-entry__mode-button", "Create From Scratch");

  importButton.type = "button";
  scratchButton.type = "button";
  importButton.setAttribute("aria-pressed", String(state.entryMode === "import"));
  scratchButton.setAttribute("aria-pressed", String(state.entryMode === "scratch"));
  importButton.addEventListener("click", startImportRecipe);
  scratchButton.addEventListener("click", startCreateRecipe);
  modeButtons.append(importButton, scratchButton);
  panel.append(modeButtons);

  if (state.entryMode === "import") {
    const form = createElement("form", "recipe-entry__import");
    const field = createElement("label", "admin-field");
    const label = createElement("span", "", "Recipe URL");
    const input = createElement("input", "");
    const submit = createElement("button", "filter-button", "Extract Recipe");
    const message = createElement("p", state.importStatus?.tone === "error" ? "admin-auth-error" : "admin-muted", state.importStatus?.message || "Paste a public recipe page to start an editable kitchen-ready draft.");

    input.type = "url";
    input.name = "recipeUrl";
    input.placeholder = "https://example.com/recipe";
    input.value = state.importUrl;
    submit.type = "submit";
    field.append(label, input);
    form.append(field, submit, message);
    form.addEventListener("input", () => {
      state.importUrl = input.value;
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      extractRecipeFromUrl(input.value);
    });
    panel.append(form);
  }

  entryRoot.replaceChildren(panel);
}

async function extractRecipeFromUrl(url) {
  state.importUrl = String(url || "").trim();
  state.importStatus = {
    tone: "neutral",
    message: "Extracting recipe data..."
  };
  renderEntryControls();

  try {
    const response = await adminFetch("/api/admin/extract-url", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: state.importUrl })
    });
    const result = await readExtractionJson(response);

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Recipe extraction failed.");
    }

    state.importStatus = {
      tone: result.validation?.ok === false ? "error" : "success",
      message: result.validation?.ok === false
        ? "Recipe extracted with validation issues. Correct the draft before saving."
        : "Recipe extracted. Review the draft before adding it to the system."
    };
    renderEntryControls();
    openExtractionPreview(result.recipe, validateRecipeForKitchen(result.recipe));
  } catch (error) {
    state.importStatus = {
      tone: "error",
      message: error.message || "Recipe extraction failed."
    };
    renderEntryControls();
  }
}

async function readExtractionJson(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    const snippet = text.trim().slice(0, 80);
    throw new Error(`Extraction endpoint returned ${contentType || "unknown content type"} from ${response.url || "unknown URL"}: ${snippet}`);
  }
}

function openExtractionPreview(recipe, validation) {
  let modalDraft = structuredClone(recipe);
  let modalValidation = validation || validateRecipeForKitchen(modalDraft);
  const overlay = createElement("div", "recipe-import-modal");
  const dialog = createElement("section", "recipe-import-modal__dialog");
  const header = createElement("header", "recipe-import-modal__header");
  const body = createElement("div", "recipe-import-modal__body");
  const editor = createElement("div", "");
  const validationRoot = createElement("aside", "recipe-import-modal__validation");
  const actions = createElement("div", "admin-actions recipe-import-modal__actions");
  const useButton = createElement("button", "filter-button", "Use This Recipe");
  const closeButton = createElement("button", "filter-button", "Close");

  function refreshValidation() {
    modalValidation = validateRecipeForKitchen(modalDraft);
    renderValidation(validationRoot, modalValidation);
    useButton.disabled = !modalValidation.ok;
  }

  useButton.type = "button";
  closeButton.type = "button";
  useButton.addEventListener("click", () => {
    useImportedRecipe(modalDraft);
    overlay.remove();
  });
  closeButton.addEventListener("click", () => overlay.remove());
  header.append(
    createElement("h2", "", "Editable Extraction Preview"),
    createElement("p", "admin-muted", "Correct imported fields now, then load the recipe into the admin editor.")
  );
  actions.append(useButton, closeButton);
  body.append(editor, validationRoot);
  dialog.append(header, body, actions);
  overlay.append(dialog);
  document.body.append(overlay);

  const previewOptions = {
    mode: "create",
    assignment: state.productionAssignment,
    menuData: state.menuData,
    photoAccept: RECIPE_PHOTO_ACCEPT,
    onPhotoUpload: handlePhotoUpload,
    onChange(recipeDraft, assignment) {
      modalDraft = recipeDraft;
      updateProductionAssignment(assignment);
      refreshValidation();
    },
    onValidate(recipeDraft, assignment) {
      modalDraft = recipeDraft;
      updateProductionAssignment(assignment);
      refreshValidation();
    },
    onSave(recipeDraft, assignment) {
      modalDraft = recipeDraft;
      updateProductionAssignment(assignment);
      useImportedRecipe(modalDraft);
      overlay.remove();
      refreshValidation();
    },
    onReset() {
      modalDraft = structuredClone(recipe);
      renderRecipeEditor(editor, modalDraft, previewOptions);
      refreshValidation();
    },
    onCancel() {
      overlay.remove();
    }
  };

  renderRecipeEditor(editor, modalDraft, previewOptions);
  renderValidation(validationRoot, modalValidation);
  useButton.disabled = !modalValidation.ok;
}

function renderAdmin() {
  if (adminContentRoot) {
    adminContentRoot.dataset.adminHasDraft = String(Boolean(state.draft));
  }

  renderEntryControls();
  renderRecipeList(listRoot, getFilteredRecipes(), state.selectedIndex, selectRecipe);
  if (state.mode === "create") {
    renderRecipeEditor(editorRoot, state.draft, {
      mode: "create",
      assignment: state.productionAssignment,
      menuData: state.menuData,
      photoAccept: RECIPE_PHOTO_ACCEPT,
      onPhotoUpload: handlePhotoUpload,
      onChange: updateCreateDraft,
      onValidate: validateCreateDraft,
      onSave: saveCreateDraft,
      onReset: resetCreateDraft,
      onCancel: cancelCreateRecipe
    });
  } else {
    renderRecipeEditor(editorRoot, state.draft, {
      mode: "edit",
      assignment: state.productionAssignment,
      menuData: state.menuData,
      photoAccept: RECIPE_PHOTO_ACCEPT,
      onPhotoUpload: handlePhotoUpload,
      onChange: updateDraft,
      onValidate: validateDraft,
      onSave: saveDraft,
      onReset: resetDraft,
      onCancel: cancelEditing,
      showDelete: hasExistingRecipeSelection(),
      deleteDisabled: !canDeleteSelectedRecipe(),
      onDelete: openDeleteRecipeDialog
    });
  }
  renderDraftStatus();
  updateValidationAndPatch();
  setStatus(createWorkflowStatusMessage(), state.isDirty ? "error" : "success");
}

async function initAdmin() {
  if (adminInitialized) {
    await initMenuAssignment({ recipes: state.recipes });
    renderAdmin();
    return;
  }

  adminInitialized = true;
  statusElement = document.querySelector("#admin-status");
  errorElement = document.querySelector("#admin-error");
  adminContentRoot = document.querySelector("#admin-content");
  createRecipeButton = document.querySelector("#create-recipe-button");
  entryRoot = document.querySelector("#recipe-entry-root");
  searchInput = document.querySelector("#recipe-search");
  listRoot = document.querySelector("#recipe-list");
  editorRoot = document.querySelector("#recipe-editor-root");
  validationRoot = document.querySelector("#validation-root");
  patchPreviewRoot = document.querySelector("#patch-preview-root");
  draftStatusRoot = document.querySelector("#draft-status");
  auditHistoryRoot = document.querySelector("#audit-history-root");

  try {
    clearError();
    const [recipeResult, menuResult, schema] = await Promise.all([
      loadRecipes(),
      loadMenuData(),
      loadJson(RECIPE_SCHEMA_URL)
    ]);

    if (!recipeResult.ok) {
      throw new Error(recipeResult.error);
    }

    state.recipes = recipeResult.recipes;
    if (menuResult.ok) {
      state.menuData = menuResult.data;
    }
    state.schema = schema;
    await initMenuAssignment({ recipes: state.recipes });
    createRecipeButton.addEventListener("click", startCreateRecipe);
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

function bootAdmin() {
  initializeAdminAuth({
    onAuthenticated: initAdmin
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootAdmin, { once: true });
} else {
  bootAdmin();
}
