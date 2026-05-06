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

export function renderMenuItem(category, value) {
  const item = createElement("div", "menu-item");
  const categoryElement = createElement("dt", "menu-item__category", category);
  const valueElement = createElement("dd", "menu-item__value", value || "");

  item.append(categoryElement, valueElement);

  return item;
}

export function renderDay(dayName, dayMenu) {
  const section = createElement("section", "menu-day");
  const heading = createElement("h4", "menu-day__title", dayName);
  const list = createElement("dl", "menu-day__items");

  for (const [category, value] of Object.entries(dayMenu || {})) {
    list.append(renderMenuItem(category, value));
  }

  section.append(heading, list);

  return section;
}

export function renderWeek(weekName, week) {
  const section = createElement("section", "menu-week");
  const heading = createElement("h3", "menu-week__title", weekName);
  const days = createElement("div", "menu-week__days");

  for (const [dayName, dayMenu] of Object.entries(week.days || {})) {
    days.append(renderDay(dayName, dayMenu));
  }

  section.append(heading, days);

  return section;
}

export function renderMealType(mealType, mealRotation) {
  const section = createElement("section", "menu-meal");
  const title = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  const heading = createElement("h2", "menu-meal__title", title);
  const weeks = createElement("div", "menu-meal__weeks");

  for (const [weekName, week] of Object.entries(mealRotation.weeks || {})) {
    weeks.append(renderWeek(weekName, week));
  }

  section.append(heading, weeks);

  return section;
}

export function renderMenu(menuData, options = {}) {
  const fragment = document.createDocumentFragment();
  const filteredData = getFilteredMenuData(menuData, options.filters || {});

  for (const [mealType, mealRotation] of Object.entries(filteredData)) {
    fragment.append(renderMealType(mealType, mealRotation));
  }

  return fragment;
}

export function renderMenuInto(container, menuData, options = {}) {
  if (!container) {
    return;
  }

  container.replaceChildren(renderMenu(menuData, options));
}
