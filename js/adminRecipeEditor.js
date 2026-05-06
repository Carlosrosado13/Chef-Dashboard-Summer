import { loadRecipes } from "./loadRecipes.js";
import { generateRecipePatch } from "./generateRecipePatch.js";
import { renderPatchPreview } from "./renderPatchPreview.js";
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
  state.draft = structuredClone(state.recipes[index]);
  state.validation = null;
  state.isDirty = false;
  renderAdmin();
}

function resetDraft() {
  const recipe = getSelectedRecipe();
  state.draft = recipe ? structuredClone(recipe) : null;
  state.validation = null;
  state.isDirty = false;
  renderAdmin();
}

function cancelEditing() {
  if (state.isDirty && !window.confirm("Discard unsaved changes?")) {
    return;
  }

  state.selectedIndex = null;
  state.draft = null;
  state.validation = null;
  state.isDirty = false;
  renderAdmin();
}

function updateDraft(recipe) {
  state.draft = recipe;
  state.validation = validateRecipeAgainstSchema(recipe, state.schema);
  state.isDirty = true;
  updateValidationAndPatch();
}

function validateDraft(recipe) {
  state.draft = recipe;
  state.validation = validateRecipeAgainstSchema(recipe, state.schema);
  state.isDirty = true;
  updateValidationAndPatch();
}

function updateValidationAndPatch() {
  renderValidation(validationRoot, state.validation);
  renderPatchPreview(patchPreviewRoot, createPatchPreview());
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
