import { adminFetch, initializeAdminAuth } from "./adminAuth.js";
import { initMenuAssignment } from "./adminMenuAssignment.js";
import { loadRecipes } from "./loadRecipes.js";
import { applyRecipePatch, rollbackRecipePatch } from "./applyRecipePatch.js";
import { generateCreateRecipePatch, generateRecipePatch } from "./generateRecipePatch.js";
import { renderPatchPreview } from "./renderPatchPreview.js";
import {
  clearRecipeDraft,
  getRecipeDraftId,
  loadRecipeDraft,
  saveRecipeDraft
} from "./recipeDraftManager.js";
import {
  createEmptyRecipeDraft,
  renderRecipeCreateWizard
} from "./renderRecipeCreateWizard.js";
import {
  renderRecipeEditor,
  renderRecipeList,
  renderValidation
} from "./renderRecipeEditor.js";

const RECIPE_SCHEMA_URL = "schemas/recipe.schema.json";

const state = {
  recipes: [],
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
  isDirty: false
};

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
  state.mode = "edit";
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

function startCreateRecipe() {
  if (state.isDirty && !window.confirm("Discard unsaved changes and create a new recipe?")) {
    return;
  }

  state.mode = "create";
  state.entryMode = "scratch";
  state.selectedIndex = null;
  state.draft = createEmptyRecipeDraft();
  state.validation = validateRecipeAgainstSchema(state.draft, state.schema);
  state.draftRecord = null;
  state.notice = null;
  state.isDirty = false;
  renderAdmin();
}

function startImportRecipe() {
  if (state.isDirty && !window.confirm("Discard unsaved changes and import a recipe?")) {
    return;
  }

  state.entryMode = "import";
  state.selectedIndex = null;
  state.mode = "edit";
  state.draft = null;
  state.validation = null;
  state.draftRecord = null;
  state.notice = null;
  state.isDirty = false;
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
  state.mode = "edit";
  state.draft = null;
  state.validation = null;
  state.draftRecord = null;
  state.isDirty = false;
  renderAdmin();
}

function updateCreateDraft(recipe) {
  state.draft = recipe;
  state.validation = validateRecipeAgainstSchema(recipe, state.schema);
  state.isDirty = true;
  updateValidationAndPatch();
}

function validateCreateDraft(recipe) {
  state.draft = recipe;
  state.validation = validateRecipeAgainstSchema(recipe, state.schema);
  state.isDirty = true;
  updateValidationAndPatch();
}

function resetCreateDraft() {
  state.draft = createEmptyRecipeDraft();
  state.validation = validateRecipeAgainstSchema(state.draft, state.schema);
  state.isDirty = false;
  renderAdmin();
}

function cancelCreateRecipe() {
  if (state.isDirty && !window.confirm("Discard this unsaved new recipe?")) {
    return;
  }

  state.mode = "edit";
  state.entryMode = null;
  state.draft = null;
  state.validation = null;
  state.isDirty = false;
  renderAdmin();
}

function useImportedRecipe(recipe) {
  state.mode = "create";
  state.entryMode = "import";
  state.selectedIndex = null;
  state.draft = structuredClone(recipe);
  state.validation = validateRecipeAgainstSchema(state.draft, state.schema);
  state.draftRecord = null;
  state.notice = {
    tone: "success",
    message: "Imported recipe loaded into the editor. Review and correct it before saving."
  };
  state.isDirty = true;
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
  if (state.mode === "create") {
    if (!state.draft) {
      return {};
    }

    const validation = state.validation || validateRecipeAgainstSchema(state.draft, state.schema);

    return generateCreateRecipePatch(state.draft, validation, {
      proposedIndex: state.recipes.length,
      source: "data/recipes/sample-recipes.json"
    });
  }

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

  validateNotes(recipe, errors);

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

function validateCurrentSchema(recipe) {
  return validateRecipeAgainstSchema(recipe, state.schema);
}

function applyCurrentPatch() {
  const patch = createPatchPreview();

  if (patch.operation === "createRecipe") {
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

    state.recipes = [...state.recipes, recipe];
    state.selectedIndex = state.recipes.length - 1;
    state.mode = "edit";
    state.entryMode = null;
    state.draft = structuredClone(recipe);
    state.validation = validateCurrentSchema(state.draft);
    state.patchHistory.push({
      ...structuredClone(patch),
      index: state.selectedIndex,
      appliedAt: new Date().toISOString(),
      rollbackRecipe: null
    });
    state.notice = {
      tone: "success",
      message: "New recipe added in memory for review and testing."
    };
    state.isDirty = false;
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

function validateNotes(recipe, errors) {
  if (recipe.notes === undefined) {
    return;
  }

  if (!Array.isArray(recipe.notes)) {
    errors.push({ message: "notes must be array" });
    return;
  }

  recipe.notes.forEach((note, index) => {
    if (typeof note !== "string") {
      errors.push({ message: `notes[${index}] must be string` });
    }
  });
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
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Recipe extraction failed.");
    }

    state.importStatus = {
      tone: "success",
      message: "Recipe extracted. Review the draft before adding it to the system."
    };
    renderEntryControls();
    openExtractionPreview(result.recipe, validateRecipeAgainstSchema(result.recipe, state.schema));
  } catch (error) {
    state.importStatus = {
      tone: "error",
      message: error.message || "Recipe extraction failed."
    };
    renderEntryControls();
  }
}

function openExtractionPreview(recipe, validation) {
  let modalDraft = structuredClone(recipe);
  let modalValidation = validation || validateRecipeAgainstSchema(modalDraft, state.schema);
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
    modalValidation = validateRecipeAgainstSchema(modalDraft, state.schema);
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
    onChange(recipeDraft) {
      modalDraft = recipeDraft;
      refreshValidation();
    },
    onValidate(recipeDraft) {
      modalDraft = recipeDraft;
      refreshValidation();
    },
    onReset() {
      modalDraft = structuredClone(recipe);
      renderRecipeCreateWizard(editor, modalDraft, previewOptions);
      refreshValidation();
    },
    onCancel() {
      overlay.remove();
    }
  };

  renderRecipeCreateWizard(editor, modalDraft, previewOptions);
  renderValidation(validationRoot, modalValidation);
  useButton.disabled = !modalValidation.ok;
}

function renderAdmin() {
  renderEntryControls();
  renderRecipeList(listRoot, getFilteredRecipes(), state.selectedIndex, selectRecipe);
  if (state.mode === "create") {
    renderRecipeCreateWizard(editorRoot, state.draft, {
      onChange: updateCreateDraft,
      onValidate: validateCreateDraft,
      onReset: resetCreateDraft,
      onCancel: cancelCreateRecipe
    });
  } else {
    renderRecipeEditor(editorRoot, state.draft, {
      onChange: updateDraft,
      onValidate: validateDraft,
      onReset: resetDraft,
      onCancel: cancelEditing
    });
  }
  renderDraftStatus();
  updateValidationAndPatch();
  setStatus(state.isDirty ? "Unsaved changes" : "Ready", state.isDirty ? "error" : "success");
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
  createRecipeButton = document.querySelector("#create-recipe-button");
  entryRoot = document.querySelector("#recipe-entry-root");
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
