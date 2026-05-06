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

function renderIngredientGroup(group, isOpen) {
  const section = createElement("details", "ingredient-group");
  const heading = createElement("summary", "ingredient-group__title");
  const headingText = createElement("span", "", group.category);
  const count = createElement("span", "ingredient-group__count", `${group.count} item${group.count === 1 ? "" : "s"}`);
  const list = createElement("ul", "ingredient-list");

  section.open = isOpen;
  heading.append(headingText, count);

  for (const ingredient of group.ingredients) {
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

function renderScalingIssues(scalingIssues) {
  if (scalingIssues.length === 0) {
    return null;
  }

  const section = createElement("section", "ingredient-warning");
  section.append(createElement("h3", "", "Scaling review needed"));

  const list = createElement("ul", "");
  for (const issue of scalingIssues) {
    list.append(createElement("li", "", `${issue.title}: ${issue.message}`));
  }

  section.append(list);
  return section;
}

function renderYieldControls(summary, options) {
  const form = createElement("form", "ingredient-scaler");
  const label = createElement("label", "ingredient-scaler__label", "Global target yield");
  const input = createElement("input", "ingredient-scaler__input");
  const applyButton = createElement("button", "ingredient-scaler__button", "Apply");
  const resetButton = createElement("button", "ingredient-scaler__button", "Reset");
  const hint = createElement("p", "ingredient-scaler__hint", "Applies the same target yield to every linked recipe in this meal/week.");

  input.type = "text";
  input.value = summary.filters.targetYield || "";
  input.placeholder = "Example: 48 servings";
  applyButton.type = "submit";
  resetButton.type = "button";

  label.append(input);
  form.append(label, applyButton, resetButton, hint);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    options.onTargetYieldChange?.(input.value.trim());
  });

  resetButton.addEventListener("click", () => {
    input.value = "";
    options.onTargetYieldChange?.("");
  });

  return form;
}

export function renderIngredientList(summary, options = {}) {
  const panel = createElement("section", "ingredient-panel");
  const header = createElement("header", "ingredient-panel__header");
  const title = createElement("h2", "", "Ingredient Summary");
  const meta = createElement(
    "p",
    "",
    `${summary.filters.mealType || "Meal"} | ${summary.filters.week || "Week"} | ${summary.usedRecipeCount} linked recipes`
  );

  header.append(title, meta);
  panel.append(header, renderYieldControls(summary, options));

  if (summary.ingredients.length === 0) {
    panel.append(createElement("p", "ingredient-empty", "No linked recipe ingredients are available for this selection yet."));
  } else {
    const groups = summary.categorizedIngredients || [];
    const groupWrap = createElement("div", "ingredient-panel__groups");

    for (const [index, group] of groups.entries()) {
      groupWrap.append(renderIngredientGroup(group, index === 0));
    }

    panel.append(groupWrap);
  }

  const unitIssues = renderUnitIssues(summary.unitIssues);
  const scalingIssues = renderScalingIssues(summary.scalingIssues || []);
  const missingRecipes = renderMissingRecipes(summary.missingRecipes);

  if (scalingIssues) {
    panel.append(scalingIssues);
  }

  if (unitIssues) {
    panel.append(unitIssues);
  }

  if (missingRecipes) {
    panel.append(missingRecipes);
  }

  return panel;
}

export function renderIngredientListInto(container, summary, options = {}) {
  if (!container) {
    throw new Error("An ingredient container is required.");
  }

  container.replaceChildren(renderIngredientList(summary, options));
}
