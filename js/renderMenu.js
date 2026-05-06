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

function matchesFilter(value, selectedValue) {
  return !selectedValue || value === selectedValue;
}

export function getFilteredMenuData(menuData, filters = {}) {
  const filteredData = {};

  for (const [mealType, mealRotation] of Object.entries(menuData || {})) {
    if (!matchesFilter(mealType, filters.mealType)) {
      continue;
    }

    const weeks = {};

    for (const [weekName, week] of Object.entries(mealRotation.weeks || {})) {
      if (!matchesFilter(weekName, filters.week)) {
        continue;
      }

      const days = {};

      for (const [dayName, day] of Object.entries(week.days || {})) {
        if (!matchesFilter(dayName, filters.day)) {
          continue;
        }

        days[dayName] = day;
      }

      if (Object.keys(days).length > 0) {
        weeks[weekName] = { days };
      }
    }

    if (Object.keys(weeks).length > 0) {
      filteredData[mealType] = { weeks };
    }
  }

  return filteredData;
}

export function getAvailableWeeks(menuData) {
  const weeks = new Set();

  for (const mealRotation of Object.values(menuData || {}).filter(Boolean)) {
    for (const weekName of Object.keys(mealRotation.weeks || {})) {
      weeks.add(weekName);
    }
  }

  return Array.from(weeks).sort((firstWeek, secondWeek) => {
    const firstNumber = Number(firstWeek.match(/\d+/)?.[0] || 0);
    const secondNumber = Number(secondWeek.match(/\d+/)?.[0] || 0);

    return firstNumber - secondNumber || firstWeek.localeCompare(secondWeek);
  });
}

export function getAvailableMealTypes(menuData) {
  return Object.keys(menuData || {}).filter((mealType) => {
    const weeks = menuData[mealType]?.weeks || {};
    return Object.keys(weeks).length > 0;
  });
}

export function getAvailableWeeksForMeal(menuData, mealType) {
  return getAvailableWeeks(mealType ? { [mealType]: menuData?.[mealType] } : menuData);
}

export function getAvailableDays(menuData, filters = {}) {
  const days = new Set();
  const filteredData = getFilteredMenuData(menuData, {
    mealType: filters.mealType,
    week: filters.week
  });

  for (const mealRotation of Object.values(filteredData)) {
    for (const week of Object.values(mealRotation.weeks || {})) {
      for (const dayName of Object.keys(week.days || {})) {
        days.add(dayName);
      }
    }
  }

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return Array.from(days).sort((firstDay, secondDay) => {
    const firstIndex = dayOrder.indexOf(firstDay);
    const secondIndex = dayOrder.indexOf(secondDay);

    if (firstIndex !== -1 || secondIndex !== -1) {
      return (firstIndex === -1 ? 99 : firstIndex) - (secondIndex === -1 ? 99 : secondIndex);
    }

    return firstDay.localeCompare(secondDay);
  });
}

export function renderMenuItem(category, value, options = {}) {
  const item = createElement("div", "menu-item");
  const categoryElement = createElement("dt", "menu-item__category", category);
  const valueElement = createElement("dd", "menu-item__value");
  const button = createElement("button", "menu-item__button", value || "Not scheduled");
  button.type = "button";
  button.disabled = !value;

  if (value) {
    button.addEventListener("click", () => {
      options.onMenuItemClick?.({
        category,
        title: value
      });
    });
  }

  valueElement.append(button);

  item.append(categoryElement, valueElement);

  return item;
}

export function renderDay(dayName, dayMenu, options = {}) {
  const section = createElement("section", "menu-day");
  section.dataset.day = dayName;
  const heading = createElement("h4", "menu-day__title", dayName);
  const list = createElement("dl", "menu-day__items");

  for (const [category, value] of Object.entries(dayMenu || {})) {
    list.append(renderMenuItem(category, value, options));
  }

  section.append(heading, list);

  return section;
}

export function renderWeek(weekName, week, options = {}) {
  const section = createElement("section", "menu-week");
  section.dataset.week = weekName;
  const heading = createElement("h3", "menu-week__title", weekName);
  const days = createElement("div", "menu-week__days");
  days.dataset.viewMode = Object.keys(week.days || {}).length > 1 ? "weekly" : "daily";

  for (const [dayName, dayMenu] of Object.entries(week.days || {})) {
    days.append(renderDay(dayName, dayMenu, options));
  }

  section.append(heading, days);

  return section;
}

export function renderMealType(mealType, mealRotation, options = {}) {
  const section = createElement("section", "menu-meal");
  section.dataset.mealType = mealType;
  const title = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  const heading = createElement("h2", "menu-meal__title", title);
  const weeks = createElement("div", "menu-meal__weeks");

  for (const [weekName, week] of Object.entries(mealRotation.weeks || {})) {
    weeks.append(renderWeek(weekName, week, options));
  }

  section.append(heading, weeks);

  return section;
}

export function renderMenu(menuData, options = {}) {
  const fragment = document.createDocumentFragment();
  const filteredData = getFilteredMenuData(menuData, options.filters || {});

  if (Object.keys(filteredData).length === 0) {
    const emptyState = createElement("p", "menu-empty", "No menu items match the selected filters.");
    fragment.append(emptyState);
    return fragment;
  }

  for (const [mealType, mealRotation] of Object.entries(filteredData)) {
    const mealElement = renderMealType(mealType, mealRotation, options);
    mealElement.dataset.viewMode = options.viewMode || "daily";
    fragment.append(mealElement);
  }

  return fragment;
}

export function renderMenuInto(container, menuData, options = {}) {
  if (!container) {
    throw new Error("A render container is required.");
  }

  container.replaceChildren(renderMenu(menuData, options));
}
