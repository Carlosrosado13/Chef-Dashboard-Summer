import { loadMenuData } from "./loadMenuData.js";
import { getAvailableWeeks, renderMenuInto } from "./renderMenu.js";

const menuRoot = document.querySelector("#menu-root");
const weekFilter = document.querySelector("#week-filter");
const menuStatus = document.querySelector("#menu-status");

const state = {
  menuData: null,
  selectedWeek: ""
};

function setStatus(message, tone = "neutral") {
  if (!menuStatus) {
    return;
  }

  menuStatus.textContent = message;
  menuStatus.dataset.tone = tone;
}

function renderWeekButtons(weeks) {
  if (!weekFilter) {
    return;
  }

  const buttons = [
    createWeekButton("All weeks", "", state.selectedWeek === "")
  ];

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

  renderWeekButtons(getAvailableWeeks(state.menuData));
  renderMenuInto(menuRoot, state.menuData, {
    filters: {
      week: state.selectedWeek
    }
  });
}

async function initDashboard() {
  setStatus("Loading menu data...");

  const result = await loadMenuData();

  if (!result.ok) {
    setStatus(result.error, "error");
    return;
  }

  state.menuData = result.data;
  setStatus("Menu data loaded", "success");
  renderDashboard();
}

initDashboard();
