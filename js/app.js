import { loadMenuData } from "./loadMenuData.js";
import { aggregateIngredients } from "./aggregateIngredients.js";
import { calculateInventoryNeeds } from "./calculateInventoryNeeds.js";
import { loadInventory } from "./loadInventory.js";
import { findRecipeByTitle, loadRecipes } from "./loadRecipes.js";
import { renderIngredientListInto } from "./renderIngredientList.js";
import { renderInventoryPanelInto } from "./renderInventoryPanel.js";
import { createRecipeModal } from "./renderRecipeModal.js";
import {
  getAvailableDays,
  getAvailableMealTypes,
  getAvailableWeeksForMeal,
  renderMenuInto
} from "./renderMenu.js";

const state = {
  menuData: null,
  viewMode: "daily",
  selectedMealType: "",
  selectedWeek: "",
  selectedDay: "",
  ingredientTargetYield: ""
};

let recipes = [];
let inventory = [];
let recipeModal;
let menuRoot;
let ingredientRoot;
let inventoryRoot;
let viewFilter;
let mealFilter;
let weekFilter;
let dayFilter;
let menuStatus;
let frontendError;

function setStatus(message, tone = "neutral") {
  if (!menuStatus) {
    return;
  }

  menuStatus.textContent = message;
  menuStatus.dataset.tone = tone;
}

function renderPanelMessage(className, title, message) {
  if (!menuRoot) {
    return;
  }

  const panel = document.createElement("section");
  panel.className = className;

  const heading = document.createElement("h2");
  heading.textContent = title;

  const copy = document.createElement("p");
  copy.textContent = message;

  panel.append(heading, copy);
  menuRoot.replaceChildren(panel);
}

function showLoadingState() {
  renderPanelMessage("menu-state menu-state--loading", "Loading menu", "Fetching processed winter menu data.");

  if (ingredientRoot) {
    ingredientRoot.replaceChildren();
  }

  if (inventoryRoot) {
    inventoryRoot.replaceChildren();
  }
}

function showEmptyState() {
  renderPanelMessage("menu-state menu-state--empty", "No menu data", "No lunch or dinner menu entries are available yet.");
}

function showFrontendError(message) {
  console.error("[menu-dashboard] frontend error:", message);

  if (frontendError) {
    frontendError.textContent = message;
    frontendError.hidden = false;
  }

  setStatus("Unable to render menu", "error");
  renderPanelMessage("menu-state menu-state--error", "Menu unavailable", message);

  if (ingredientRoot) {
    ingredientRoot.replaceChildren();
  }

  if (inventoryRoot) {
    inventoryRoot.replaceChildren();
  }
}

function clearFrontendError() {
  if (!frontendError) {
    return;
  }

  frontendError.textContent = "";
  frontendError.hidden = true;
}

function formatMealType(mealType) {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

function renderFilterButtons(container, options, selectedValue, onSelect) {
  if (!container) {
    throw new Error("Filter container was not found.");
  }

  if (options.length === 0) {
    container.replaceChildren();
    return;
  }

  container.replaceChildren(
    ...options.map((option) => createFilterButton(option.label, option.value, selectedValue === option.value, onSelect))
  );
}

function createFilterButton(label, value, isActive, onSelect) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "filter-button";
  button.textContent = label;
  button.dataset.value = value;
  button.setAttribute("aria-pressed", String(isActive));

  button.addEventListener("click", () => {
    onSelect(value);
    renderDashboard();
  });

  return button;
}

function syncDefaultSelections() {
  const mealTypes = getAvailableMealTypes(state.menuData);

  if (!mealTypes.includes(state.selectedMealType)) {
    state.selectedMealType = mealTypes[0] || "";
  }

  const weeks = getAvailableWeeksForMeal(state.menuData, state.selectedMealType);

  if (!weeks.includes(state.selectedWeek)) {
    state.selectedWeek = weeks[0] || "";
  }

  const days = getAvailableDays(state.menuData, {
    mealType: state.selectedMealType,
    week: state.selectedWeek
  });

  if (!days.includes(state.selectedDay)) {
    state.selectedDay = days[0] || "";
  }

  return {
    mealTypes,
    weeks,
    days
  };
}

function renderControls(options) {
  if (dayFilter) {
    dayFilter.closest(".control-group").hidden = state.viewMode === "weekly";
  }

  renderFilterButtons(
    viewFilter,
    [
      {
        label: "Daily View",
        value: "daily"
      },
      {
        label: "Weekly View",
        value: "weekly"
      }
    ],
    state.viewMode,
    (viewMode) => {
      state.viewMode = viewMode;
    }
  );

  renderFilterButtons(
    mealFilter,
    options.mealTypes.map((mealType) => ({
      label: formatMealType(mealType),
      value: mealType
    })),
    state.selectedMealType,
    (mealType) => {
      state.selectedMealType = mealType;
      state.selectedWeek = "";
      state.selectedDay = "";
    }
  );

  renderFilterButtons(
    weekFilter,
    options.weeks.map((week) => ({
      label: week,
      value: week
    })),
    state.selectedWeek,
    (week) => {
      state.selectedWeek = week;
      state.selectedDay = "";
    }
  );

  renderFilterButtons(
    dayFilter,
    options.days.map((day) => ({
      label: day,
      value: day
    })),
    state.selectedDay,
    (day) => {
      state.selectedDay = day;
    }
  );
}

function renderDashboard() {
  if (!state.menuData) {
    return;
  }

  if (!menuRoot) {
    throw new Error("Menu root container was not found.");
  }

  console.log("[menu-dashboard] rendering started");
  const options = syncDefaultSelections();
  renderControls(options);

  if (!state.selectedMealType || !state.selectedWeek || !state.selectedDay) {
    showEmptyState();
    console.log("[menu-dashboard] rendering completed");
    return;
  }

  renderMenuInto(menuRoot, state.menuData, {
    filters: {
      mealType: state.selectedMealType,
      week: state.selectedWeek,
      day: state.viewMode === "daily" ? state.selectedDay : ""
    },
    viewMode: state.viewMode,
    onMenuItemClick: handleMenuItemClick
  });

  const ingredientSummary = aggregateIngredients(state.menuData, recipes, {
      mealType: state.selectedMealType,
      week: state.selectedWeek,
      targetYield: state.ingredientTargetYield
    });

  renderIngredientListInto(
    ingredientRoot,
    ingredientSummary,
    {
      onTargetYieldChange: handleIngredientTargetYieldChange
    }
  );
  renderInventoryPanelInto(inventoryRoot, calculateInventoryNeeds(ingredientSummary, inventory));

  if (state.viewMode === "daily") {
    setStatus(`${formatMealType(state.selectedMealType)} | ${state.selectedWeek} | ${state.selectedDay}`, "success");
  } else {
    setStatus(`${formatMealType(state.selectedMealType)} | ${state.selectedWeek}`, "success");
  }
  console.log("[menu-dashboard] rendering completed");
}

function handleMenuItemClick(menuItem) {
  const recipe = findRecipeByTitle(recipes, menuItem.title);

  if (recipe) {
    recipeModal.openRecipe(recipe);
    return;
  }

  recipeModal.openMissingRecipe(menuItem.title);
}

function handleIngredientTargetYieldChange(targetYield) {
  state.ingredientTargetYield = targetYield;
  renderDashboard();
}

async function initDashboard() {
  menuRoot = document.querySelector("#menu-root");
  ingredientRoot = document.querySelector("#ingredient-root");
  inventoryRoot = document.querySelector("#inventory-root");
  viewFilter = document.querySelector("#view-filter");
  mealFilter = document.querySelector("#meal-filter");
  weekFilter = document.querySelector("#week-filter");
  dayFilter = document.querySelector("#day-filter");
  menuStatus = document.querySelector("#menu-status");
  frontendError = document.querySelector("#frontend-error");
  recipeModal = createRecipeModal();
  document.body.append(recipeModal.element);

  try {
    clearFrontendError();
    setStatus("Loading menu data...");
    showLoadingState();

    const result = await loadMenuData();

    if (!result.ok) {
      showFrontendError(result.error);
      return;
    }

    const recipeResult = await loadRecipes();
    if (!recipeResult.ok) {
      console.warn("[menu-dashboard] recipes unavailable:", recipeResult.error);
    }
    recipes = recipeResult.recipes;

    const inventoryResult = await loadInventory();
    if (!inventoryResult.ok) {
      console.warn("[menu-dashboard] inventory unavailable:", inventoryResult.error);
    }
    inventory = inventoryResult.inventory;

    state.menuData = result.data;
    console.log("[menu-dashboard] data loaded", state.menuData);
    setStatus("Menu data loaded", "success");
    renderDashboard();
  } catch (error) {
    showFrontendError(error.message || "Menu rendering failed.");
  }
}

function bootDashboard() {
  console.log("[menu-dashboard] bootstrap started");
  initDashboard();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootDashboard, { once: true });
} else {
  bootDashboard();
}
