import { loadMenuData } from "./loadMenuData.js";
import { aggregateIngredients } from "./aggregateIngredients.js";
import { calculateAnalytics } from "./calculateAnalytics.js";
import { calculateFoodCosts, loadPricing } from "./calculateFoodCosts.js";
import { calculateForecasts } from "./calculateForecasts.js";
import { calculateInventoryNeeds } from "./calculateInventoryNeeds.js";
import { generatePurchaseOrders, loadSuppliers } from "./generatePurchaseOrders.js";
import { loadInventory } from "./loadInventory.js";
import { findRecipeByTitle, loadRecipes } from "./loadRecipes.js";
import { renderIngredientListInto } from "./renderIngredientList.js";
import { renderInventoryPanelInto } from "./renderInventoryPanel.js";
import { renderPurchaseOrdersInto } from "./renderPurchaseOrders.js";
import { renderFoodCostsInto } from "./renderFoodCosts.js";
import { renderAnalyticsDashboardInto } from "./renderAnalyticsDashboard.js";
import { renderForecastDashboardInto } from "./renderForecastDashboard.js";
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
let suppliers = [];
let pricing = [];
let recipeModal;
let menuRoot;
let ingredientRoot;
let inventoryRoot;
let purchaseOrderRoot;
let foodCostRoot;
let analyticsRoot;
let forecastRoot;
let viewFilter;
let mealFilter;
let weekFilter;
let dayFilter;
let controlsPanel;
let previousWeekButton;
let nextWeekButton;
let previousDayButton;
let nextDayButton;
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

function createSkeletonPanel(title = "Loading") {
  const panel = document.createElement("section");
  panel.className = "skeleton-panel";

  const heading = document.createElement("h2");
  heading.textContent = title;

  const lines = document.createElement("div");
  lines.className = "skeleton-lines";

  for (let index = 0; index < 4; index += 1) {
    const line = document.createElement("span");
    line.className = "skeleton-line";
    lines.append(line);
  }

  panel.append(heading, lines);
  return panel;
}

function showLoadingState() {
  renderPanelMessage("menu-state menu-state--loading", "Loading menu", "Fetching processed winter menu data.");

  if (ingredientRoot) {
    ingredientRoot.replaceChildren(createSkeletonPanel("Ingredients"));
  }

  if (inventoryRoot) {
    inventoryRoot.replaceChildren(createSkeletonPanel("Inventory"));
  }

  if (purchaseOrderRoot) {
    purchaseOrderRoot.replaceChildren(createSkeletonPanel("Purchase Orders"));
  }

  if (foodCostRoot) {
    foodCostRoot.replaceChildren(createSkeletonPanel("Food Costing"));
  }

  if (analyticsRoot) {
    analyticsRoot.replaceChildren(createSkeletonPanel("Analytics"));
  }

  if (forecastRoot) {
    forecastRoot.replaceChildren(createSkeletonPanel("Forecast"));
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

  if (purchaseOrderRoot) {
    purchaseOrderRoot.replaceChildren();
  }

  if (foodCostRoot) {
    foodCostRoot.replaceChildren();
  }

  if (analyticsRoot) {
    analyticsRoot.replaceChildren();
  }

  if (forecastRoot) {
    forecastRoot.replaceChildren();
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

function renderSelectControl(container, options, selectedValue, onSelect) {
  if (!container) {
    throw new Error("Select container was not found.");
  }

  if (options.length === 0) {
    container.replaceChildren();
    return;
  }

  const select = document.createElement("select");
  select.className = "select-filter__control";
  select.id = container.id === "week-filter" ? "week-select" : container.id === "day-filter" ? "day-select" : "";

  for (const option of options) {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.label;
    item.selected = selectedValue === option.value;
    select.append(item);
  }

  select.addEventListener("change", () => {
    onSelect(select.value);
    renderDashboard();
  });

  container.replaceChildren(select);
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
  const mealTypes = Array.isArray(getAvailableMealTypes(state.menuData)) ? getAvailableMealTypes(state.menuData) : [];

  if (!mealTypes.includes(state.selectedMealType)) {
    state.selectedMealType = mealTypes[0] || "";
  }

  const weeks = Array.isArray(getAvailableWeeksForMeal(state.menuData, state.selectedMealType))
    ? getAvailableWeeksForMeal(state.menuData, state.selectedMealType)
    : [];

  if (!weeks.includes(state.selectedWeek)) {
    state.selectedWeek = weeks[0] || "";
  }

  const days = Array.isArray(getAvailableDays(state.menuData, {
    mealType: state.selectedMealType,
    week: state.selectedWeek
  }))
    ? getAvailableDays(state.menuData, {
        mealType: state.selectedMealType,
        week: state.selectedWeek
      })
    : [];

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
    dayFilter.closest(".toolbar-field").hidden = state.viewMode === "weekly";
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

  renderSelectControl(
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

  renderSelectControl(
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

  updateQuickSwitchButtons(options);
}

function updateQuickSwitchButtons(options) {
  const weekIndex = options.weeks.findIndex((week) => week === state.selectedWeek);
  const dayIndex = options.days.findIndex((day) => day === state.selectedDay);
  const isWeeklyView = state.viewMode === "weekly";

  if (previousWeekButton) previousWeekButton.disabled = weekIndex <= 0;
  if (nextWeekButton) nextWeekButton.disabled = weekIndex === -1 || weekIndex >= options.weeks.length - 1;
  if (previousDayButton) previousDayButton.disabled = isWeeklyView || dayIndex <= 0;
  if (nextDayButton) nextDayButton.disabled = isWeeklyView || dayIndex === -1 || dayIndex >= options.days.length - 1;
}

function moveWeek(delta) {
  const weeks = Array.isArray(getAvailableWeeksForMeal(state.menuData, state.selectedMealType))
    ? getAvailableWeeksForMeal(state.menuData, state.selectedMealType)
    : [];
  const index = weeks.findIndex((week) => week === state.selectedWeek);
  const nextWeek = weeks[index + delta];

  if (!nextWeek) {
    return;
  }

  state.selectedWeek = nextWeek;
  state.selectedDay = "";
  renderDashboard();
}

function moveDay(delta) {
  const days = Array.isArray(getAvailableDays(state.menuData, {
    mealType: state.selectedMealType,
    week: state.selectedWeek
  }))
    ? getAvailableDays(state.menuData, {
        mealType: state.selectedMealType,
        week: state.selectedWeek
      })
    : [];
  const index = days.findIndex((day) => day === state.selectedDay);
  const nextDay = days[index + delta];

  if (!nextDay) {
    return;
  }

  state.selectedDay = nextDay;
  renderDashboard();
}

function enhanceCollapsiblePanel(root, label, options = {}) {
  const panel = root?.firstElementChild;

  if (!panel || panel.dataset.collapsibleReady === "true") {
    return;
  }

  const header = panel.querySelector("header") || panel;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "panel-collapse-button";
  button.textContent = "Collapse";
  button.setAttribute("aria-expanded", "true");
  button.setAttribute("aria-label", `Collapse ${label}`);
  panel.classList.add("operational-panel");
  panel.dataset.collapsibleReady = "true";

  const setCollapsed = (isCollapsed) => {
    panel.classList.toggle("is-collapsed", isCollapsed);
    button.textContent = isCollapsed ? "Expand" : "Collapse";
    button.setAttribute("aria-expanded", String(!isCollapsed));
    button.setAttribute("aria-label", `${isCollapsed ? "Expand" : "Collapse"} ${label}`);
  };

  button.addEventListener("click", () => {
    const isCollapsed = panel.classList.toggle("is-collapsed");
    setCollapsed(isCollapsed);
  });

  header.append(button);

  if (options.defaultCollapsedOnMobile && window.matchMedia("(max-width: 640px)").matches) {
    setCollapsed(true);
  }
}

function enhanceOperationalPanels() {
  enhanceCollapsiblePanel(ingredientRoot, "ingredients");
  enhanceCollapsiblePanel(inventoryRoot, "inventory", { defaultCollapsedOnMobile: true });
  enhanceCollapsiblePanel(purchaseOrderRoot, "purchase orders", { defaultCollapsedOnMobile: true });
  enhanceCollapsiblePanel(foodCostRoot, "food costing", { defaultCollapsedOnMobile: true });
  enhanceCollapsiblePanel(analyticsRoot, "analytics", { defaultCollapsedOnMobile: true });
  enhanceCollapsiblePanel(forecastRoot, "forecast", { defaultCollapsedOnMobile: true });
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
  const inventoryNeeds = calculateInventoryNeeds(ingredientSummary, inventory);
  const purchaseOrders = generatePurchaseOrders(inventoryNeeds, ingredientSummary, suppliers);
  const foodCosts = calculateFoodCosts(ingredientSummary, inventoryNeeds, purchaseOrders, pricing);
  const analytics = calculateAnalytics({
    ingredientSummary,
    inventoryNeeds,
    purchaseOrders,
    foodCosts
  });
  const forecasts = calculateForecasts({
    ingredientSummary,
    inventoryNeeds,
    purchaseOrders,
    foodCosts,
    analytics
  });

  renderIngredientListInto(
    ingredientRoot,
    ingredientSummary,
    {
      onTargetYieldChange: handleIngredientTargetYieldChange
    }
  );
  renderInventoryPanelInto(inventoryRoot, inventoryNeeds);
  renderPurchaseOrdersInto(purchaseOrderRoot, purchaseOrders);
  renderFoodCostsInto(foodCostRoot, foodCosts);
  renderAnalyticsDashboardInto(analyticsRoot, analytics);
  renderForecastDashboardInto(forecastRoot, forecasts);
  enhanceOperationalPanels();

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

function setupResponsiveControls() {
  controlsPanel?.removeAttribute("open");
}

async function refreshDashboardData() {
  const cacheKey = Date.now();
  const [menuResult, recipeResult] = await Promise.all([
    loadMenuData(`data/processed/clean-menu.json?v=${cacheKey}`),
    loadRecipes(`data/recipes/sample-recipes.json?v=${cacheKey}`)
  ]);

  if (menuResult.ok) {
    state.menuData = menuResult.data;
  }

  if (recipeResult.ok) {
    recipes = recipeResult.recipes;
  }

  renderDashboard();
}

function listenForAdminRefreshes() {
  window.addEventListener("storage", (event) => {
    if (event.key === "chefDashboard.recipeDataUpdated") {
      refreshDashboardData();
    }
  });

  try {
    const channel = new BroadcastChannel("chef-dashboard-admin");
    channel.addEventListener("message", (event) => {
      if (event.data?.type === "recipe-data-updated") {
        refreshDashboardData();
      }
    });
  } catch {
    // Storage events still cover cross-tab refreshes when BroadcastChannel is unavailable.
  }
}

async function initDashboard() {
  menuRoot = document.querySelector("#menu-root");
  ingredientRoot = document.querySelector("#ingredient-root");
  inventoryRoot = document.querySelector("#inventory-root");
  purchaseOrderRoot = document.querySelector("#purchase-order-root");
  foodCostRoot = document.querySelector("#food-cost-root");
  analyticsRoot = document.querySelector("#analytics-root");
  forecastRoot = document.querySelector("#forecast-root");
  viewFilter = document.querySelector("#view-filter");
  mealFilter = document.querySelector("#meal-filter");
  weekFilter = document.querySelector("#week-filter");
  dayFilter = document.querySelector("#day-filter");
  controlsPanel = document.querySelector("#dashboard-controls");
  previousWeekButton = document.querySelector("#previous-week");
  nextWeekButton = document.querySelector("#next-week");
  previousDayButton = document.querySelector("#previous-day");
  nextDayButton = document.querySelector("#next-day");
  menuStatus = document.querySelector("#menu-status");
  frontendError = document.querySelector("#frontend-error");
  recipeModal = createRecipeModal();
  document.body.append(recipeModal.element);
  previousWeekButton?.addEventListener("click", () => moveWeek(-1));
  nextWeekButton?.addEventListener("click", () => moveWeek(1));
  previousDayButton?.addEventListener("click", () => moveDay(-1));
  nextDayButton?.addEventListener("click", () => moveDay(1));
  setupResponsiveControls();
  listenForAdminRefreshes();

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

    const supplierResult = await loadSuppliers();
    if (!supplierResult.ok) {
      console.warn("[menu-dashboard] suppliers unavailable:", supplierResult.error);
    }
    suppliers = supplierResult.suppliers;

    const pricingResult = await loadPricing();
    if (!pricingResult.ok) {
      console.warn("[menu-dashboard] pricing unavailable:", pricingResult.error);
    }
    pricing = pricingResult.pricing;

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
