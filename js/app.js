import { loadMenuData } from "./loadMenuData.js";
import { getAvailableWeeks, renderMenuInto } from "./renderMenu.js";

const state = {
  menuData: null,
  selectedWeek: ""
};

let menuRoot;
let weekFilter;
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
}

function clearFrontendError() {
  if (!frontendError) {
    return;
  }

  frontendError.textContent = "";
  frontendError.hidden = true;
}

function renderWeekButtons(weeks) {
  if (!weekFilter) {
    throw new Error("Week filter container was not found.");
  }

  if (weeks.length === 0) {
    weekFilter.replaceChildren();
    return;
  }

  const buttons = [createWeekButton("All weeks", "", state.selectedWeek === "")];

  for (const week of weeks) {
    buttons.push(createWeekButton(week, week, state.selectedWeek === week));
  }

  weekFilter.replaceChildren(...buttons);
}

function createWeekButton(label, value, isActive) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "week-filter__button";
  button.textContent = label;
  button.dataset.week = value;
  button.setAttribute("aria-pressed", String(isActive));

  button.addEventListener("click", () => {
    state.selectedWeek = value;
    renderDashboard();
  });

  return button;
}

function renderDashboard() {
  if (!state.menuData) {
    return;
  }

  if (!menuRoot) {
    throw new Error("Menu root container was not found.");
  }

  console.log("[menu-dashboard] rendering started");
  const weeks = getAvailableWeeks(state.menuData);
  renderWeekButtons(weeks);

  if (weeks.length === 0) {
    showEmptyState();
    console.log("[menu-dashboard] rendering completed");
    return;
  }

  renderMenuInto(menuRoot, state.menuData, {
    filters: {
      week: state.selectedWeek
    }
  });
  console.log("[menu-dashboard] rendering completed");
}

async function initDashboard() {
  menuRoot = document.querySelector("#menu-root");
  weekFilter = document.querySelector("#week-filter");
  menuStatus = document.querySelector("#menu-status");
  frontendError = document.querySelector("#frontend-error");

  try {
    clearFrontendError();
    setStatus("Loading menu data...");
    showLoadingState();

    const result = await loadMenuData();

    if (!result.ok) {
      showFrontendError(result.error);
      return;
    }

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
