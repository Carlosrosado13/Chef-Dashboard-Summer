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

function formatAmount(amount) {
  if (Number.isFinite(amount)) {
    return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  return "As needed";
}

function groupIngredientsByUnit(ingredients) {
  return ingredients.reduce((groups, ingredient) => {
    const groupName = ingredient.unit || "Unspecified unit";
    const group = groups.get(groupName) || [];
    group.push(ingredient);
    groups.set(groupName, group);
    return groups;
  }, new Map());
}

function renderIngredientGroup(unit, ingredients) {
  const section = createElement("section", "ingredient-group");
  const heading = createElement("h3", "ingredient-group__title", unit);
  const list = createElement("ul", "ingredient-list");

  for (const ingredient of ingredients) {
    const item = createElement("li", "ingredient-list__item");
    const quantity = createElement("span", "ingredient-list__quantity", `${formatAmount(ingredient.amount)} ${ingredient.unit}`.trim());
    const name = createElement("span", "ingredient-list__name", ingredient.name);
    const sourceCount = createElement("span", "ingredient-list__sources", `${ingredient.sources.length} linked item${ingredient.sources.length === 1 ? "" : "s"}`);

    item.append(quantity, name, sourceCount);
    list.append(item);
  }

  section.append(heading, list);
  return section;
}

function renderMissingRecipes(missingRecipes) {
  if (missingRecipes.length === 0) {
    return null;
  }

  const section = createElement("section", "ingredient-warning");
  section.append(createElement("h3", "", "Missing linked recipes"));

  const list = createElement("ul", "");
  for (const item of missingRecipes) {
    list.append(createElement("li", "", `${item.day} ${item.category}: ${item.title}`));
  }

  section.append(list);
  return section;
}

function renderUnitIssues(unitIssues) {
  if (unitIssues.length === 0) {
    return null;
  }

  const section = createElement("section", "ingredient-warning");
  section.append(createElement("h3", "", "Unit review needed"));

  const list = createElement("ul", "");
  for (const issue of unitIssues) {
    list.append(createElement("li", "", `${issue.name}: ${issue.units.join(", ")}`));
  }

  section.append(list);
  return section;
}

export function renderIngredientList(summary) {
  const panel = createElement("section", "ingredient-panel");
  const header = createElement("header", "ingredient-panel__header");
  const title = createElement("h2", "", "Ingredient Summary");
  const meta = createElement(
    "p",
    "",
    `${summary.filters.mealType || "Meal"} | ${summary.filters.week || "Week"} | ${summary.usedRecipeCount} linked recipes`
  );

  header.append(title, meta);
  panel.append(header);

  if (summary.ingredients.length === 0) {
    panel.append(createElement("p", "ingredient-empty", "No linked recipe ingredients are available for this selection yet."));
  } else {
    const groups = groupIngredientsByUnit(summary.ingredients);
    const groupWrap = createElement("div", "ingredient-panel__groups");

    for (const [unit, ingredients] of groups.entries()) {
      groupWrap.append(renderIngredientGroup(unit, ingredients));
    }

    panel.append(groupWrap);
  }

  const unitIssues = renderUnitIssues(summary.unitIssues);
  const missingRecipes = renderMissingRecipes(summary.missingRecipes);

  if (unitIssues) {
    panel.append(unitIssues);
  }

  if (missingRecipes) {
    panel.append(missingRecipes);
  }

  return panel;
}

export function renderIngredientListInto(container, summary) {
  if (!container) {
    throw new Error("An ingredient container is required.");
  }

  container.replaceChildren(renderIngredientList(summary));
}
