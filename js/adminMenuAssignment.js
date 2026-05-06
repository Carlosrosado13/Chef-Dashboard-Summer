import { generateMenuAssignmentPatch, getMenuOptions } from "./generateMenuAssignmentPatch.js";
import { loadMenuData } from "./loadMenuData.js";
import { renderMenuAssignmentEditor } from "./renderMenuAssignmentEditor.js";

const MENU_SCHEMA_URL = "schemas/menuRotation.schema.json";

const state = {
  initialized: false,
  root: null,
  menuData: null,
  menuSchema: null,
  recipes: [],
  recipeQuery: "",
  assignment: {
    mealType: "lunch",
    week: "",
    day: "",
    category: "",
    recipeId: "",
    action: "assign",
    replaceExisting: true
  },
  patch: null,
  error: null
};

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

function createStatus(message, tone = "neutral") {
  const status = document.createElement("p");
  status.className = "admin-muted";
  status.dataset.tone = tone;
  status.textContent = message;
  return status;
}

function normalizeSelection(nextAssignment = {}) {
  const mealTypes = Object.keys(state.menuData || {});
  const mealType = mealTypes.includes(nextAssignment.mealType)
    ? nextAssignment.mealType
    : mealTypes.includes(state.assignment.mealType)
      ? state.assignment.mealType
      : mealTypes[0] || "lunch";

  const weekOptions = getMenuOptions(state.menuData, mealType, "").weeks;
  const week = weekOptions.includes(nextAssignment.week)
    ? nextAssignment.week
    : weekOptions.includes(state.assignment.week)
      ? state.assignment.week
      : weekOptions[0] || "";

  const options = getMenuOptions(state.menuData, mealType, week);
  const day = options.days.includes(nextAssignment.day)
    ? nextAssignment.day
    : options.days.includes(state.assignment.day)
      ? state.assignment.day
      : options.days[0] || "";
  const category = options.categories.includes(nextAssignment.category)
    ? nextAssignment.category
    : options.categories.includes(state.assignment.category)
      ? state.assignment.category
      : options.categories[0] || "";

  return {
    ...state.assignment,
    ...nextAssignment,
    mealType,
    week,
    day,
    category
  };
}

function updatePatch() {
  if (!state.menuData) {
    state.patch = null;
    return;
  }

  state.patch = generateMenuAssignmentPatch(
    state.menuData,
    state.recipes,
    state.assignment,
    state.menuSchema
  );
}

function render() {
  if (!state.root) {
    return;
  }

  if (state.error) {
    state.root.replaceChildren(createStatus(state.error, "error"));
    return;
  }

  if (!state.menuData) {
    state.root.replaceChildren(createStatus("Loading menu assignment tools."));
    return;
  }

  updatePatch();
  renderMenuAssignmentEditor(state.root, state, {
    onAssignmentChange: (partial) => {
      state.assignment = normalizeSelection(partial);
      render();
    },
    onRecipeQueryChange: (query) => {
      state.recipeQuery = query;
      render();
    },
    onRemoveAssignment: () => {
      state.assignment = normalizeSelection({
        action: "remove",
        recipeId: ""
      });
      render();
    }
  });
}

export async function initMenuAssignment({ recipes = [] } = {}) {
  state.root = document.querySelector("#menu-assignment-root");
  state.recipes = recipes;

  if (!state.root) {
    return;
  }

  if (state.initialized) {
    render();
    return;
  }

  state.initialized = true;
  render();

  try {
    const [menuResult, menuSchema] = await Promise.all([
      loadMenuData(),
      loadJson(MENU_SCHEMA_URL)
    ]);

    if (!menuResult.ok) {
      throw new Error(menuResult.error);
    }

    state.menuData = menuResult.data;
    state.menuSchema = menuSchema;
    state.assignment = normalizeSelection();
    render();
  } catch (error) {
    state.error = error.message || "Unable to initialize menu assignment tools.";
    render();
  }
}
