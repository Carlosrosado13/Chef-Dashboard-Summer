import { createRecipeId, getMenuOptions } from "./generateMenuAssignmentPatch.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function selectField(label, value, values, onChange) {
  const wrapper = el("label", "admin-field");
  const select = el("select", "");
  wrapper.append(el("span", "", label), select);
  for (const optionValue of values) {
    const option = el("option", "", optionValue);
    option.value = optionValue;
    option.selected = optionValue === value;
    select.append(option);
  }
  select.addEventListener("change", () => onChange(select.value));
  return wrapper;
}

function renderRecipeList(container, recipes, selectedRecipeId, onSelect) {
  container.replaceChildren();

  if (!recipes.length) {
    container.append(el("p", "admin-muted", "No recipes match this search."));
    return;
  }

  for (const recipe of recipes) {
    const recipeId = createRecipeId(recipe);
    const button = el("button", "recipe-list__item", recipe.title);
    button.type = "button";
    button.setAttribute("aria-pressed", String(recipeId === selectedRecipeId || recipe.title === selectedRecipeId));
    button.addEventListener("click", () => onSelect(recipeId));
    container.append(button);
  }
}

function renderRecipePreview(container, recipe) {
  container.replaceChildren();
  if (!recipe) {
    container.append(el("p", "admin-muted", "Select a recipe to preview it."));
    return;
  }
  container.append(
    el("h3", "", recipe.title),
    el("p", "admin-muted", `${recipe.category} | ${recipe.yield}`),
    el("pre", "patch-preview", JSON.stringify(recipe, null, 2))
  );
}

function renderPatchSummary(container, patch) {
  container.replaceChildren();

  if (!patch) {
    container.append(el("p", "admin-muted", "Choose a menu slot and recipe to preview the assignment patch."));
    return;
  }

  if (!patch.ok) {
    const panel = el("div", "patch-panel patch-panel--blocked");
    panel.append(el("p", "admin-auth-error", patch.reason || "Patch generation is blocked."));
    const list = el("ul", "admin-errors");
    for (const error of patch.errors || []) {
      list.append(el("li", "", error.message || String(error)));
    }
    panel.append(list);
    container.append(panel);
    return;
  }

  const field = Object.entries(patch.changedFields || {})[0];
  const title = field?.[0] || "Menu assignment";
  const values = field?.[1] || { original: "", updated: "" };
  const summary = el("div", "patch-field");
  const valueGrid = el("div", "patch-field__values");
  const original = el("div", "");
  const updated = el("div", "");

  original.append(
    el("div", "patch-field__label", "Current"),
    el("pre", "patch-field__value patch-field__value--original", values.original || "(empty)")
  );
  updated.append(
    el("div", "patch-field__label", "Updated"),
    el("pre", "patch-field__value patch-field__value--updated", values.updated || "(empty)")
  );
  valueGrid.append(original, updated);
  summary.append(
    el("h3", "patch-field__title", title),
    valueGrid,
    el("p", "admin-muted", patch.hasChanges ? "Ready to preview. No files will be changed." : "No change from the current assignment.")
  );
  container.append(summary);
}

export function renderMenuAssignmentEditor(container, state, options = {}) {
  const mealTypes = Object.keys(state.menuData || {});
  const menuOptions = getMenuOptions(state.menuData, state.assignment.mealType, state.assignment.week);
  const selectedRecipe = state.recipes.find((recipe) => createRecipeId(recipe) === state.assignment.recipeId || recipe.title === state.assignment.recipeId);
  const filteredRecipes = state.recipes.filter((recipe) => {
    const query = state.recipeQuery.toLowerCase().trim();
    return !query || `${recipe.title} ${recipe.category}`.toLowerCase().includes(query);
  });

  const shell = el("div", "menu-assignment-grid");
  const controls = el("section", "menu-assignment-controls");
  const recipePanel = el("section", "menu-assignment-recipes");
  const previewPanel = el("section", "menu-assignment-preview");
  const recipeList = el("div", "recipe-list");
  const recipeSearch = el("input", "");
  const replace = el("label", "admin-check");
  const replaceInput = el("input", "");
  const removeButton = el("button", "filter-button", "Remove Assignment");
  const patchSummary = el("div", "patch-panel");
  const patchPreview = el("pre", "patch-preview", JSON.stringify(state.patch || {}, null, 2));

  recipeSearch.type = "search";
  recipeSearch.placeholder = "Search recipes";
  recipeSearch.value = state.recipeQuery;
  recipeSearch.addEventListener("input", () => options.onRecipeQueryChange?.(recipeSearch.value));

  replaceInput.type = "checkbox";
  replaceInput.checked = state.assignment.replaceExisting;
  replaceInput.addEventListener("change", (event) => {
    options.onAssignmentChange?.({ replaceExisting: event.target.checked });
  });
  replace.append(replaceInput, el("span", "", "Replace existing assignment"));

  removeButton.type = "button";
  removeButton.addEventListener("click", () => options.onRemoveAssignment?.());

  controls.append(
    selectField("Meal Type", state.assignment.mealType, mealTypes, (mealType) => options.onAssignmentChange?.({ mealType })),
    selectField("Week", state.assignment.week, menuOptions.weeks, (week) => options.onAssignmentChange?.({ week })),
    selectField("Day", state.assignment.day, menuOptions.days, (day) => options.onAssignmentChange?.({ day })),
    selectField("Category", state.assignment.category, menuOptions.categories, (category) => options.onAssignmentChange?.({ category })),
    replace,
    removeButton
  );

  renderRecipeList(recipeList, filteredRecipes, state.assignment.recipeId, (recipeId) => options.onAssignmentChange?.({ recipeId, action: "assign" }));
  recipePanel.append(el("h3", "", "Recipe Selector"), recipeSearch, recipeList);
  renderRecipePreview(previewPanel, selectedRecipe);
  renderPatchSummary(patchSummary, state.patch);
  previewPanel.append(el("h3", "", "Assignment Preview"), patchSummary, el("h3", "", "Patch Object"), patchPreview);
  shell.append(controls, recipePanel, previewPanel);
  container.replaceChildren(shell);
}
